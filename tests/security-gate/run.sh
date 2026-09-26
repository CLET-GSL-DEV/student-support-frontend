#!/usr/bin/env bash
# VENDORED from CLET-GSL-DEV/.github v2.3.0 (9ad19d4) tests/scan/run.sh; only the gate path differs.
# Run: bash tests/security-gate/run.sh (needs bash and jq).
# Tests for the scan gate (.github/actions/security-scan/gate.sh). Pure bash + jq, no network.
# Each case builds a results directory the way the workflows do and checks the gate's verdict.
set -uo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
gate="$here/../../.github/scripts/security-gate.sh"
work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT
pass=0; fail=0

CLEAN_SEMGREP='{"results":[]}'
CLEAN_TRIVY='{"Results":[]}'

# verdict <blocking> <extra tools> -> exit code of the gate on $work/r
verdict() {
  BLOCKING="$1" EXTRA_TOOLS="${2:-}" RESULTS_DIR="$work/r" GITHUB_STEP_SUMMARY="$work/summary" \
    bash "$gate" > "$work/out" 2>&1
}
fresh() { rm -rf "$work/r"; mkdir -p "$work/r"; : > "$work/summary"
          printf '%s' "$CLEAN_SEMGREP" > "$work/r/semgrep.json"; echo 0 > "$work/r/semgrep.status"
          printf '%s' "$CLEAN_TRIVY"   > "$work/r/trivy.json"; }
expect() { # name want-exit
  local got=$?
  if [ "$got" -eq "$2" ]; then pass=$((pass+1)); else fail=$((fail+1)); echo "FAIL: $1 (exit $got, want $2)"; sed 's/^/    /' "$work/out"; fi
}
run() { local name="$1" want="$2"; shift 2; "$@"; local got=$?
  if [ "$got" -eq "$want" ]; then pass=$((pass+1)); else fail=$((fail+1)); echo "FAIL: $name (exit $got, want $want)"; sed 's/^/    /' "$work/out"; fi; }

# --- the ticket's first probe: a clean scan under a blocking policy passes
fresh; run "clean scan, blocking"          0 verdict true
fresh; run "clean scan, advisory"          0 verdict false

# --- findings
fresh; echo '{"results":[{"check_id":"x","extra":{"severity":"ERROR"}}]}' > "$work/r/semgrep.json"
run "semgrep finding, advisory passes"     0 verdict false
grep -q '::warning::' "$work/out" && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: advisory finding gave no warning"; }
run "semgrep finding, blocking fails"      1 verdict true
fresh; echo '{"Results":[{"Secrets":[{"RuleID":"aws","Severity":"CRITICAL"}]}]}' > "$work/r/trivy.json"
run "trivy secret, blocking fails"         1 verdict true
run "trivy secret, advisory passes"        0 verdict false

# --- the second probe: a recorded status or a missing report must not be dropped
fresh; : > "$work/r/semgrep.json"; echo 2 > "$work/r/semgrep.status"
run "semgrep crashed, empty report, advisory" 1 verdict false
run "semgrep crashed, empty report, blocking" 1 verdict true
fresh; echo 2 > "$work/r/semgrep.status"
run "semgrep exit 2 with a clean-looking report" 1 verdict false
fresh; rm "$work/r/trivy.json"
run "trivy report missing"                 1 verdict false
fresh; echo 'not json' > "$work/r/trivy.json"
run "trivy report is not JSON"             1 verdict false
fresh; rm "$work/r/semgrep.json"
run "semgrep report missing"               1 verdict false
fresh; printf '0\n\n' > "$work/r/semgrep.status"
run "status file with whitespace"          0 verdict true

# --- extra tools recorded by a stack
fresh; echo '{"results":[]}' > "$work/r/bandit.json"; echo 1 > "$work/r/bandit.status"
run "bandit exit 1 is normal, no HIGH"     0 verdict true "bandit"
echo 2 > "$work/r/bandit.status"
run "bandit exit 2 is a crash"             1 verdict false "bandit"

# --- JVM tools: spotbugs (findings one per line, exit status a bitmask) and the jar audit
fresh; echo '{"findings":[]}' > "$work/r/spotbugs.json"; echo 0 > "$work/r/spotbugs.status"
run "spotbugs clean"                       0 verdict true "spotbugs"
fresh; echo '{"findings":["H S SECSPRCSRFPD: x"]}' > "$work/r/spotbugs.json"; echo 4 > "$work/r/spotbugs.status"
run "spotbugs finding (exit 4), blocking"  1 verdict true "spotbugs"
run "spotbugs finding (exit 4), advisory"  0 verdict false "spotbugs"
fresh; echo '{"findings":[]}' > "$work/r/spotbugs.json"; echo 2 > "$work/r/spotbugs.status"
run "spotbugs unresolved classes is a warning, not a crash" 0 verdict true "spotbugs"
fresh; echo '{"findings":[]}' > "$work/r/spotbugs.json"; echo 1 > "$work/r/spotbugs.status"
run "spotbugs analysis error (exit 1) fails" 1 verdict false "spotbugs"
fresh; rm -f "$work/r/spotbugs.json"
run "spotbugs report missing fails"        1 verdict false "spotbugs"
fresh; echo '{"Results":[{"Vulnerabilities":[{"VulnerabilityID":"CVE-1","Severity":"HIGH","FixedVersion":"1.2"}]}]}' > "$work/r/jar-audit.json"
run "jar-audit finding, blocking fails"    1 verdict true "jar-audit"
run "jar-audit finding, advisory passes"   0 verdict false "jar-audit"
fresh; echo '{"Results":[{"Packages":[{"Name":"a"}]}]}' > "$work/r/jar-audit.json"
run "jar-audit clean"                      0 verdict true "jar-audit"
fresh
run "jar-audit report missing fails"       1 verdict false "jar-audit"
echo 0 > "$work/r/bandit.status"; echo '{"results":[{"issue_severity":"HIGH"}]}' > "$work/r/bandit.json"
run "bandit HIGH, blocking"                1 verdict true "bandit"
run "bandit HIGH, advisory"                0 verdict false "bandit"
echo '{"results":[{"issue_severity":"MEDIUM"}]}' > "$work/r/bandit.json"
run "bandit MEDIUM only never blocks"      0 verdict true "bandit"
fresh; echo '{"dependencies":[{"vulns":[{"id":"X"}]}]}' > "$work/r/pip-audit.json"; echo 1 > "$work/r/pip-audit.status"
run "pip-audit vuln is reported, not gated" 0 verdict true "pip-audit"
grep -q '| pip-audit | 1 | reported only' "$work/summary" && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: pip-audit row does not say it is reported only"; }
echo 2 > "$work/r/pip-audit.status"
run "pip-audit crash still fails"          1 verdict false "pip-audit"
fresh; rm -f "$work/r/pip-audit.json"
run "pip-audit report missing still fails" 1 verdict false "pip-audit"
fresh; echo '{"Results":[{"Vulnerabilities":[{"VulnerabilityID":"CVE-9","Severity":"HIGH","FixedVersion":"4.2.1"}]}]}' > "$work/r/python-deps.json"
run "python-deps high with a fix, blocking" 1 verdict true "python-deps"
echo '{"Results":[{"Vulnerabilities":[{"VulnerabilityID":"CVE-9","Severity":"HIGH"}]}]}' > "$work/r/python-deps.json"
run "python-deps high, no fix yet"         0 verdict true "python-deps"
echo '{"Results":[{"Vulnerabilities":[{"VulnerabilityID":"CVE-9","Severity":"MEDIUM","FixedVersion":"4.2.1"}]}]}' > "$work/r/python-deps.json"
run "python-deps medium never blocks"      0 verdict true "python-deps"
fresh
run "python-deps report missing fails"     1 verdict false "python-deps"
fresh; echo '{"advisories":{"1":{"id":1,"severity":"high"}}}' > "$work/r/pnpm-audit.json"; echo 1 > "$work/r/pnpm-audit.status"
run "pnpm audit advisory, blocking"        1 verdict true "pnpm-audit"
echo '{"advisories":{}}' > "$work/r/pnpm-audit.json"
run "pnpm audit clean, blocking"           0 verdict true "pnpm-audit"
fresh; echo '{"metadata":{"vulnerabilities":{"high":1,"critical":0}}}' > "$work/r/npm-audit.json"; echo 1 > "$work/r/npm-audit.status"
run "npm audit high, blocking"             1 verdict true "npm-audit"
echo '{"metadata":{"vulnerabilities":{"high":0,"critical":0,"moderate":9}}}' > "$work/r/npm-audit.json"
run "npm audit moderate only"              0 verdict true "npm-audit"

fresh; echo '{"error":{"code":"ENOTFOUND","summary":"registry unreachable"}}' > "$work/r/pnpm-audit.json"; echo 1 > "$work/r/pnpm-audit.status"
run "pnpm audit registry error is not a clean result" 1 verdict false "pnpm-audit"
fresh; echo '{"error":{"code":"ENOTFOUND"}}' > "$work/r/npm-audit.json"; echo 1 > "$work/r/npm-audit.status"
run "npm audit registry error is not a clean result"  1 verdict false "npm-audit"

# --- a tool the stack promised but that never ran, and one the gate cannot judge
fresh
run "expected tool never ran"              1 verdict false "bandit"
fresh; echo '{}' > "$work/r/mystery.json"
run "tool the gate has no rule for"        1 verdict false "mystery"

# --- accepted_vulnerabilities: a pinned package's advisory, with an expiry and a reason
acc() { # blocking extra accepted-list -> exit code
  BLOCKING="$1" EXTRA_TOOLS="$2" ACCEPTED="$3" TODAY=2026-09-25 RESULTS_DIR="$work/r" GITHUB_STEP_SUMMARY="$work/summary" \
    bash "$gate" > "$work/out" 2>&1
}
TV='{"Results":[{"Vulnerabilities":[{"VulnerabilityID":"CVE-2026-1111","VendorIDs":["GHSA-aaaa-bbbb-cccc"],"Severity":"CRITICAL","FixedVersion":"2.0"}]}]}'
fresh; echo "$TV" > "$work/r/trivy.json"
run "trivy CVE not accepted, blocking fails"        1 acc true "" ""
run "trivy CVE accepted, blocking passes"           0 acc true "" "CVE-2026-1111 2026-12-31 pinned by the SDK"
run "trivy accepted by its GHSA alias"              0 acc true "" "GHSA-aaaa-bbbb-cccc 2026-12-31 pinned"
run "trivy accepted in lower case"                  0 acc true "" "cve-2026-1111 2026-12-31 pinned"
run "trivy accepted until today is still active"    0 acc true "" "CVE-2026-1111 2026-09-25 pinned"
run "trivy accepted but expired counts again"       1 acc true "" "CVE-2026-1111 2026-09-24 pinned"
grep -q 'expired on 2026-09-24' "$work/out" && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: expiry gave no warning"; }
run "a different accepted id does not hide it"      1 acc true "" "CVE-2026-9999 2026-12-31 other"
fresh; echo '{"Results":[{"Vulnerabilities":[{"VulnerabilityID":"CVE-2026-1111","Severity":"HIGH","FixedVersion":"2.0"}],"Secrets":[{"RuleID":"aws","Severity":"CRITICAL"}]}]}' > "$work/r/trivy.json"
run "an accepted CVE never hides a secret"          1 acc true "" "CVE-2026-1111 2026-12-31 pinned"
fresh
run "malformed entry: bad id fails even advisory"   1 acc false "" "not-an-id 2026-12-31 reason"
run "malformed entry: missing reason fails"         1 acc false "" "CVE-2026-1111 2026-12-31"
run "malformed entry: bad date fails"               1 acc false "" "CVE-2026-1111 31-12-2026 reason"
run "blank lines and comments are ignored"          0 acc true "" $'\n# a comment\n\n'
fresh; echo '{"Results":[{"Vulnerabilities":[{"VulnerabilityID":"CVE-2026-2222","VendorIDs":["GHSA-pppp-qqqq-rrrr"],"Severity":"HIGH","FixedVersion":"1.1"}]}]}' > "$work/r/python-deps.json"
run "python-deps accepted by CVE"                   0 acc true "python-deps" "CVE-2026-2222 2026-12-31 unreachable"
run "python-deps accepted by GHSA"                  0 acc true "python-deps" "GHSA-pppp-qqqq-rrrr 2026-12-31 unreachable"
run "python-deps not accepted"                      1 acc true "python-deps" ""
fresh; echo '{"advisories":{"9":{"github_advisory_id":"GHSA-dddd-eeee-ffff","cves":["CVE-2026-3333"],"severity":"critical"}}}' > "$work/r/pnpm-audit.json"; echo 1 > "$work/r/pnpm-audit.status"
run "pnpm audit accepted by GHSA"                   0 acc true "pnpm-audit" "GHSA-dddd-eeee-ffff 2026-12-31 pinned"
run "pnpm audit accepted by CVE"                    0 acc true "pnpm-audit" "CVE-2026-3333 2026-12-31 pinned"
run "pnpm audit not accepted"                       1 acc true "pnpm-audit" ""
fresh; echo '{"metadata":{"vulnerabilities":{"high":1,"critical":0}},"vulnerabilities":{"axios":{"via":[{"source":1,"severity":"high","url":"https://github.com/advisories/GHSA-gggg-hhhh-iiii"}]}}}' > "$work/r/npm-audit.json"; echo 1 > "$work/r/npm-audit.status"
run "npm audit accepted by GHSA"                    0 acc true "npm-audit" "GHSA-gggg-hhhh-iiii 2026-12-31 pinned"
run "npm audit other GHSA accepted: still counted"  1 acc true "npm-audit" "GHSA-zzzz-zzzz-zzzz 2026-12-31 other"
fresh; echo '{"Results":[{"Vulnerabilities":[{"VulnerabilityID":"CVE-2026-4444","Severity":"HIGH","FixedVersion":"3.1"}]}]}' > "$work/r/jar-audit.json"
run "jar audit accepted"                            0 acc true "jar-audit" "CVE-2026-4444 2026-12-31 pinned"
run "jar audit not accepted"                        1 acc true "jar-audit" ""
fresh; echo "$TV" > "$work/r/trivy.json"; acc true "" "CVE-2026-1111 2026-12-31 pinned by the SDK" >/dev/null
grep -q 'CVE-2026-1111` accepted until 2026-12-31: pinned by the SDK' "$work/summary" && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: summary does not list the accepted id"; }

# --- only critical and high count, in every tool
sev() { fresh; printf '%s' "$2" > "$work/r/$1.json"; [ -z "${3:-}" ] || echo "$3" > "$work/r/$1.status"; } # tool report [status]
for s_ in ERROR HIGH CRITICAL error; do sev semgrep "{\"results\":[{\"extra\":{\"severity\":\"$s_\"}}]}"; run "semgrep $s_ blocks" 1 verdict true; done
for s_ in WARNING INFO MEDIUM LOW; do sev semgrep "{\"results\":[{\"extra\":{\"severity\":\"$s_\"}}]}"; run "semgrep $s_ never blocks" 0 verdict true; done
sev semgrep '{"results":[{"check_id":"no-severity"}]}'; run "semgrep finding without severity never blocks" 0 verdict true
sev trivy '{"Results":[{"Vulnerabilities":[{"VulnerabilityID":"CVE-1","Severity":"CRITICAL","FixedVersion":"1.0"}]}]}'; run "trivy critical with a fix blocks" 1 verdict true
sev trivy '{"Results":[{"Vulnerabilities":[{"VulnerabilityID":"CVE-1","Severity":"CRITICAL"}]}]}'; run "trivy critical, no fix yet, never blocks" 0 verdict true
sev trivy '{"Results":[{"Vulnerabilities":[{"VulnerabilityID":"CVE-1","Severity":"CRITICAL","FixedVersion":""}]}]}'; run "trivy empty FixedVersion never blocks" 0 verdict true
sev trivy '{"Results":[{"Vulnerabilities":[{"VulnerabilityID":"CVE-1","Severity":"MEDIUM","FixedVersion":"1.0"}]}]}'; run "trivy medium never blocks" 0 verdict true
sev trivy '{"Results":[{"Secrets":[{"RuleID":"jwt","Severity":"MEDIUM"}]}]}'; run "trivy medium secret never blocks" 0 verdict true
sev trivy '{"Results":[{"Misconfigurations":[{"ID":"DS002","Severity":"HIGH","Status":"FAIL"}]}]}'; run "trivy high misconfiguration blocks" 1 verdict true
sev trivy '{"Results":[{"Misconfigurations":[{"ID":"DS002","Severity":"HIGH","Status":"PASS"}]}]}'; run "trivy passed misconfiguration check never blocks" 0 verdict true
sev trivy '{"Results":[{"Misconfigurations":[{"ID":"DS026","Severity":"LOW","Status":"FAIL"}]}]}'; run "trivy low misconfiguration never blocks" 0 verdict true
sev jar-audit '{"Results":[{"Vulnerabilities":[{"VulnerabilityID":"CVE-1","Severity":"LOW","FixedVersion":"1.0"}]}]}'; run "jar-audit low never blocks" 0 verdict true "jar-audit"
sev spotbugs '{"findings":["M S SECXSS: x","L S SECPR: y"]}' 4; run "spotbugs M and L never block" 0 verdict true "spotbugs"
sev pnpm-audit '{"advisories":{"1":{"severity":"moderate"},"2":{"severity":"low"}}}' 1; run "pnpm moderate and low never block" 0 verdict true "pnpm-audit"
sev pnpm-audit '{"advisories":{"1":{"severity":"moderate"},"2":{"severity":"critical"}}}' 1; run "pnpm critical among moderates blocks" 1 verdict true "pnpm-audit"

# --- the summary reports what was found
fresh; echo '{"results":[{"extra":{"severity":"ERROR"}},{"extra":{"severity":"HIGH"}},{"extra":{"severity":"WARNING"}}]}' > "$work/r/semgrep.json"; verdict false >/dev/null
grep -q '| semgrep | 2 |' "$work/summary" && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL: summary does not show the count"; }

echo "passed: $pass  failed: $fail"
[ "$fail" -eq 0 ]
