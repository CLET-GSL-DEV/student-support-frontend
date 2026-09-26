#!/usr/bin/env bash
# VENDORED, do not edit here. Source: CLET-GSL-DEV/.github v2.3.0 (9ad19d4),
# .github/actions/security-scan/gate.sh, copied verbatim below this header. This repository is public and
# cannot call the organisation's private reusable workflow, so security.yml runs this copy. Update it by
# re-copying the source at a newer tag, never by editing it.
# One verdict over every scan result recorded in $RESULTS_DIR.
#
# Each tool leaves <tool>.json (its report) and, if it is a command, <tool>.status (its exit
# code). Both are read here. A recorded exit code that nobody reads is how a scanner that
# crashed and left an empty report reads as "0 findings", so:
#   - a tool with no usable report is a PROBLEM, whether or not blocking is on;
#   - an exit status outside the tool's normal set is a PROBLEM, even with a fine-looking report;
#   - findings only fail the run when BLOCKING is true.
# What counts is CRITICAL and HIGH, in every tool (each row below says how its report expresses that).
# The reports themselves keep every severity, including vulnerabilities with no fix yet: the gate
# chooses, the report shows everything. A dependency vulnerability counts only once a fixed version
# exists (Trivy's ignore-unfixed, applied here).
# A PROBLEM fails the step in both modes: advisory means "findings do not block", not "a scan
# that did not run is fine".
#
# Env: RESULTS_DIR   BLOCKING (true|false)   EXTRA_TOOLS (space-separated, beyond semgrep+trivy)
#      ACCEPTED: newline "<advisory id> <YYYY-MM-DD expiry> <reason>" entries. An active entry is not
#      counted by any vulnerability tool (a package a repository pins on purpose); an expired one is
#      counted again, with a warning; a malformed line is a PROBLEM, so a typo cannot hide anything.
#      TODAY (YYYY-MM-DD) overrides the date, for tests.
# Adding a tool is a new row in the two functions below.

set -uo pipefail

dir="${RESULTS_DIR:?RESULTS_DIR is not set}"
blocking="${BLOCKING:-false}"
tools="semgrep trivy ${EXTRA_TOOLS:-}"
today="${TODAY:-$(date -u +%F)}"

problems=()
blockers=()
rows=""
accepted_rows=""
acc_ids=()
while IFS= read -r line; do
  line="${line%%$'\r'}"
  [ -z "${line//[[:space:]]/}" ] && continue
  case "$line" in \#*) continue ;; esac
  read -r id until reason <<< "$line"
  shopt -s nocasematch
  if ! [[ "$id" =~ ^(CVE-[0-9]{4}-[0-9]+|GHSA(-[a-z0-9]{4}){3}|PYSEC-[0-9]{4}-[0-9]+)$ ]] \
     || ! [[ "$until" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || [ -z "${reason:-}" ]; then
    shopt -u nocasematch
    problems+=("accepted_vulnerabilities: malformed entry '$line' (want: <CVE-/GHSA-/PYSEC- id> <YYYY-MM-DD> <reason>)")
    continue
  fi
  shopt -u nocasematch
  if [[ "$until" < "$today" ]]; then
    echo "::warning::accepted vulnerability $id expired on $until and is counted again ($reason)"
    accepted_rows="${accepted_rows}- \`$id\` EXPIRED $until, counted again: $reason"$'\n'
  else
    acc_ids+=("$(printf '%s' "$id" | tr '[:lower:]' '[:upper:]')")
    accepted_rows="${accepted_rows}- \`$id\` accepted until $until: $reason"$'\n'
  fi
done <<< "${ACCEPTED:-}"
acc_json="$(printf '%s\n' ${acc_ids[@]+"${acc_ids[@]}"} | jq -R . | jq -sc 'map(select(length > 0))')"

# Exit statuses that mean "ran to completion" (1 is "found something" for these tools).
ok_statuses() {
  case "$1" in
    semgrep)                              echo "0" ;;
    bandit|pip-audit|pnpm-audit|npm-audit) echo "0 1" ;;
    # A bitmask: 1 is an analysis error; 2 (classes not resolved) and 4 (bugs found) still ran.
    spotbugs)                             echo "0 2 4 6" ;;
    *)                                    echo "" ;;
  esac
}

# A finding whose ids (the array piped in) include no accepted id.
NOT_ACC='map(ascii_upcase) | any(. as $i | $acc | index($i)) | not'
NOT_ACC_TRIVY="select(([.VulnerabilityID] + (.VendorIDs // [])) | ${NOT_ACC})"
# The severity piped in is critical or high (any case).
CRIT_HIGH='(. // "" | ascii_upcase) as $s | ["CRITICAL", "HIGH"] | index($s) != null'
# A Trivy vulnerability that counts: critical or high, a fixed version exists, not accepted.
TRIVY_VULN="select((.Severity | ${CRIT_HIGH}) and ((.FixedVersion // \"\") != \"\")) | ${NOT_ACC_TRIVY}"

# Tools whose findings are reported but never block, and why (another row gates the same thing).
report_only() {
  case "$1" in
    # pip-audit gives no severity. python-deps runs Trivy over the versions pip-audit resolved, so
    # Python dependencies are judged critical/high/fixed like every other ecosystem.
    pip-audit) echo "reported only; python-deps gates the same dependencies" ;;
    *)         echo "" ;;
  esac
}

# What counts as a finding.
count_filter() {
  case "$1" in
    # Semgrep's legacy ERROR is its HIGH (WARNING is MEDIUM, INFO is LOW); rules now use both vocabularies.
    semgrep)    echo "[.results[]? | select(.extra.severity | (. // \"\" | ascii_upcase) as \$s | [\"CRITICAL\", \"HIGH\", \"ERROR\"] | index(\$s) != null)] | length" ;;
    trivy)      echo "[(.Results[]?.Vulnerabilities[]? | ${TRIVY_VULN}), (.Results[]?.Secrets[]? | select(.Severity | ${CRIT_HIGH})), (.Results[]?.Misconfigurations[]? | select((.Severity | ${CRIT_HIGH}) and ((.Status // \"FAIL\") == \"FAIL\")))] | length" ;;
    bandit)     echo '[.results[]? | select(.issue_severity=="HIGH")] | length' ;;
    pip-audit)  echo "[.dependencies[]?.vulns[]? | select(([.id] + (.aliases // [])) | ${NOT_ACC})] | length" ;;
    # One finding per line, written by the spotbugs action, beginning with its priority: H counts.
    spotbugs)   echo '[.findings[]? | select(startswith("H "))] | length' ;;
    # Trivy over the dependencies inside the built application jar (the jar-audit action), and over
    # the Python versions pip-audit resolved (security.yml).
    jar-audit|python-deps) echo "[.Results[]?.Vulnerabilities[]? | ${TRIVY_VULN}] | length" ;;
    # An unreachable registry makes both tools write a valid JSON {"error": ...}, which would
    # otherwise count as zero findings.
    pnpm-audit) echo "if has(\"error\") then error(\"the audit returned an error\") else [.advisories // {} | to_entries[] | .value | select(.severity | ${CRIT_HIGH}) | select(([.github_advisory_id // empty] + (.cves // [])) | ${NOT_ACC})] | length end" ;;
    # High and critical, as npm counts them; with accepted ids, per advisory so one can be excluded.
    npm-audit)  echo "if has(\"error\") then error(\"the audit returned an error\") elif (\$acc | length) == 0 then (.metadata.vulnerabilities.high // 0) + (.metadata.vulnerabilities.critical // 0) else [.vulnerabilities // {} | to_entries[] | .value.via[]? | objects | select(.severity == \"high\" or .severity == \"critical\") | ((.url // \"\") | capture(\"(?<g>GHSA-[a-z0-9-]+)\").g // (.source | tostring))] | unique | map(select([.] | ${NOT_ACC})) | length end" ;;
    *)          echo "" ;;
  esac
}

for tool in $tools; do
  report="$dir/$tool.json"
  status=""
  [ -f "$dir/$tool.status" ] && status="$(tr -d '[:space:]' < "$dir/$tool.status")"

  filter="$(count_filter "$tool")"
  if [ -z "$filter" ]; then
    problems+=("$tool: the gate has no rule for this tool")
    rows="${rows}| $tool | n/a | no rule for this tool |"$'\n'
    continue
  fi

  if [ ! -s "$report" ] || ! jq -e . "$report" >/dev/null 2>&1; then
    problems+=("$tool: no usable report${status:+ (exit status $status)}. The scan did not run; that is not a clean result.")
    rows="${rows}| $tool | n/a | no usable report${status:+, exit $status} |"$'\n'
    continue
  fi

  note=""
  if [ -n "$status" ]; then
    ok=" $(ok_statuses "$tool") "
    case "$ok" in
      *" $status "*) ;;
      *)
        problems+=("$tool: exited with status $status (expected one of: $(ok_statuses "$tool")). Its report cannot be trusted.")
        note="exit $status"
        ;;
    esac
  fi

  n="$(jq -r --argjson acc "$acc_json" "$filter" "$report" 2>/dev/null)" || n=""
  case "$n" in
    ''|*[!0-9]*)
      problems+=("$tool: the report could not be read for a finding count.")
      rows="${rows}| $tool | n/a | unreadable report |"$'\n'
      continue
      ;;
  esac
  ro="$(report_only "$tool")"
  if [ -n "$ro" ]; then
    note="${note:+$note; }$ro"
  elif [ "$n" -gt 0 ]; then
    blockers+=("$tool: $n critical/high finding(s)")
  fi
  rows="${rows}| $tool | $n | ${note} |"$'\n'
done

{
  echo "### Security scan"
  echo
  echo "| Tool | Critical/high findings | Note |"
  echo "|---|---:|---|"
  printf '%s' "$rows"
  echo
  echo "Blocking: \`$blocking\`"
  if [ -n "$accepted_rows" ]; then
    echo
    echo "**Accepted vulnerabilities** (not counted while active):"
    printf '%s' "$accepted_rows"
  fi
  if [ "${#problems[@]}" -gt 0 ]; then
    echo
    echo "**The scan itself has problems:**"
    for p in "${problems[@]}"; do echo "- $p"; done
  fi
} >> "${GITHUB_STEP_SUMMARY:-/dev/null}"

printf '%s' "$rows"

rc=0
for p in "${problems[@]+"${problems[@]}"}"; do
  [ -n "$p" ] && { echo "::error::$p"; rc=1; }
done
if [ "$blocking" = "true" ]; then
  for b in "${blockers[@]+"${blockers[@]}"}"; do
    [ -n "$b" ] && { echo "::error::$b"; rc=1; }
  done
elif [ "${#blockers[@]}" -gt 0 ]; then
  echo "::warning::findings recorded but security_blocking is false: ${blockers[*]}"
fi
exit "$rc"
