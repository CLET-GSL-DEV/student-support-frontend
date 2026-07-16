---
name: api-integration
description: |
  API integration patterns and common failure modes for this monorepo's
  endpoint factory. Read before writing or debugging any API call — covers
  request/response body synchronization, access tokens, endpoint verification,
  Axios gotchas, and network-tab validation.
---

# API Integration — Failure Modes & Patterns

## Core principle: synchronize every layer

An API call flows through four layers. A mismatch in **any** layer causes silent bugs, 500s, or
corrupt data:

1. **Frontend hook** — what the React component thinks it's sending
2. **Endpoint factory** — what the `EndpointDef` declares (`GET`/`POST`/etc.)
3. **Axios request** — what actually hits the wire (check the Network tab)
4. **Backend** — what the real service expects as fields

**Every failure mode in this skill traces back to a mismatch between these four layers.**

---

## Failure mode 1: request body missing or misnamed fields

### Symptom

- 200 OK but the backend ignores the field (it's optional, so no error)
- 500 Internal Server Error because the backend code references a field that wasn't sent

### Root cause

The frontend endpoint declaration names fields that don't match the backend's actual contract, or
the calling code omits a field the backend unconditionally references.

### How to prevent

**Before writing the call**, read the actual backend contract (serializer, DTO, OpenAPI schema —
whatever your backend uses) via a real source, not memory. See the `project` and `architecture`
skills for how this repo's backend discovery is set up (fill this in once you have a real backend).

Map every required field. The frontend endpoint's body type must declare every required field with
the exact same name.

```ts
// BAD: missing field the backend expects
export const createTodoEndpoint = POST<Todo, { title: string }>({
  path: '/todos',
  // "priority" is missing — backend has it as required
});

// GOOD: every backend field is present in the body type
export const createTodoEndpoint = POST<Todo, { title: string; priority: string }>({
  path: '/todos',
});
```

**After writing the call**, open the Network tab and verify:

1. The request went to the **correct URL** (no typo in the path)
2. The **request body** contains **every field** the backend expects
3. Field names match **exactly** (e.g. `snake_case` vs `camelCase` — whatever the backend actually
   uses, not an assumption)
4. Values are the **correct type** (string vs number vs boolean)

### Debugging checklist for 500 errors

| Step | What to do                                                         |
| ---- | ------------------------------------------------------------------ |
| 1    | Open the Network tab and inspect the request payload               |
| 2    | Compare every payload field against the backend's real contract    |
| 3    | Check if the backend field is required or has no default           |
| 4    | If the backend references a nested field, ensure the parent exists |
| 5    | Check if a write-only field is expected on create but not sent     |

---

## Failure mode 2: matching the response body

### Symptom

- Frontend gets `undefined` or `null` for a field it expects
- Type error at runtime: `Cannot read properties of undefined`
- Data renders as blank or "N/A"

### Root cause

The frontend type/interface expects a field name or shape that doesn't match what the backend
actually returns.

### How to prevent

Read the backend's actual response fields (serializer output, DTO, OpenAPI schema) before writing
the response type.

```ts
// The response type must match what the backend actually returns
export const getTodoEndpoint = GET<{
  id: string;
  title: string;
  created_at: string; // ISO 8601
  owner: { id: string; display_name: string };
}>({
  path: (params) => `/todos/${params.id}`,
});
```

### Common response gotchas

- **Nested objects**: the backend might flatten them or nest them — verify which one it actually
  does
- **Field rename**: a backend refactor renames `display_name` to `full_name` but the frontend still
  uses the old name
- **Nullable fields**: the field exists but can be `null` — mark it as optional in the type
  (`field?: type | null`)
- **List wrapping**: the response might be `{ results: [...] }` (paginated) vs a bare array `[...]`

---

## Failure mode 3: access token not sent / expired

### Symptom

- 401 Unauthorized on every authenticated request
- Silent fallback to an unauthenticated response (no error shown)

### Root cause

The API call fires before the OIDC auth flow completes and populates the token, or the token expired
and the silent refresh failed.

### How to prevent

1. **Guard API calls behind auth state** — never fire an authenticated request before
   `auth.isAuthenticated` is `true`.

```tsx
// GOOD: wait for auth before fetching
function TodosPage() {
  const auth = useAuth();
  const { data } = useQueryEndpoint(todosEndpoints.list, undefined, {
    enabled: auth.isAuthenticated,
  });
}
```

2. **`@starter/api-client`'s `createApiClient`** attaches the token via an axios request interceptor
   and retries once on 401 via `onRefresh` (see `architecture` skill). If a request is
   unauthenticated when it shouldn't be, check `authStore.getToken()` is actually populated — that
   means `AuthTokenBridge` (from `@starter/auth`) mounted correctly.
3. **Network tab confirmation**: a 401 means the token is missing, expired, or the wrong audience.
   Check the `Authorization` header exists and the token isn't expired (jwt.io or the network
   inspector).

---

## Failure mode 4: wrong endpoint URL

### Symptom

- 404 Not Found
- 405 Method Not Allowed
- Data loads but from the wrong source

### Root cause

The path in the endpoint factory doesn't match the backend's actual route. Common issues:

- Trailing slash mismatch (`/todos` vs `/todos/`)
- Missing or extra path parameter
- Wrong HTTP method (`GET` instead of `POST`)

### How to prevent

Read the backend's real route table directly — never guess from a similar-sounding endpoint.

```ts
// Backend route: POST /todos/:id  (adjust to however your backend documents routes)
export const updateTodoEndpoint = PATCH<Todo, Partial<Todo>>({
  path: (params) => `/todos/${params.id}`, // matches the backend route exactly
});
```

**Network tab check**: every request should show the full URL. Verify it against the backend's real
route table, not from memory.

---

## Failure mode 5: Axios `.data` wrapping ("data.data")

### Symptom

- The response looks like `{ data: { data: { ... } } }` in the console
- Accessing `response.data` gives an object that also has a `.data` key
- Destructuring `data` from `useQueryEndpoint` gives the wrong shape

### Root cause

Axios wraps every response in an `AxiosResponse` object where `.data` is the actual payload. If the
backend **also** wraps its response in a `data` key (e.g. `{ "data": { ... } }`), destructuring once
gives you the axios wrapper, and you need `.data.data` to reach the real payload.

### How to prevent

1. **Log the raw response** once when writing a new endpoint:

```ts
const { data } = useQueryEndpoint(myEndpoint);
console.log('RAW RESPONSE:', data); // Check the actual shape
```

2. **`createService`** (in `@starter/api-client`) returns `response.data` directly — it does not
   unwrap a further backend-side `data` envelope. If your backend wraps responses in
   `{ data: ... }`, your endpoint's response type must account for that extra layer:

```ts
// Backend returns: { "data": { "id": "...", "title": "..." } }
export const getTodo = GET<{ data: Todo }>({ path: (p) => `/todos/${p.id}` });
```

### Quick reference: axios response shape

```
AxiosResponse (what axios returns)
  |-- .data          <- the actual HTTP response body
  |-- .status        <- HTTP status code
  |-- .headers       <- response headers
  `-- .config        <- request config

If backend wraps:    response.data.data  (first .data = Axios, second = backend)
If no wrap:          response.data       (directly the backend payload)
```

---

## Failure mode 6: Network tab lies (no, really, check it)

### Core rule

**Even a 200 response can be wrong.** The request might succeed but be missing fields. The Network
tab is the single source of truth for what was actually sent and received — not the console, not the
component state.

### What to check on every network request

| Check                             | Why                                                                     |
| --------------------------------- | ----------------------------------------------------------------------- |
| **Request URL**                   | Correct endpoint? No typos? Correct base path?                          |
| **Request method**                | GET vs POST vs PUT vs PATCH vs DELETE                                   |
| **Request headers**               | `Authorization: Bearer ...` present? `Content-Type: application/json`?  |
| **Request body** (POST/PUT/PATCH) | Every expected field present? Field names match exactly? Types correct? |
| **Response status**               | 200/201/204 for success, 4xx/5xx for errors                             |
| **Response body**                 | Matches the expected shape? Nullable fields actually present?           |
| **Response time**                 | Is the endpoint unexpectedly slow (>2s) indicating a backend issue?     |

**Always inspect the request body on the Network tab. Every time.**

---

## Full integration checklist

Use this checklist for every new API integration:

- [ ] **Backend contract read**: verified every field name and type against a real source
- [ ] **Backend route read**: verified the path and method
- [ ] **Endpoint factory**: fields match the backend exactly
- [ ] **Access token**: guarded behind `auth.isAuthenticated`
- [ ] **Network tab**: inspected request URL, method, headers, body
- [ ] **Network tab**: inspected response body matches the type
- [ ] **Axios unwrapping**: checked if `.data.data` is needed
- [ ] **Error handling**: 401, 403, 404, 422, 500 all handled gracefully (see `ApiError`/
      `normalizeApiError`/`apiErrorMessage`)
- [ ] **Optional fields**: checked if missing fields are truly optional
- [ ] **Nullable fields**: response types account for `null` values

---

## Quick reference: common error codes

| Code | Meaning               | What to check                                     |
| ---- | --------------------- | ------------------------------------------------- |
| 200  | OK (but verify body!) | Network tab for missing fields                    |
| 201  | Created               | Response body has the created resource            |
| 204  | No Content            | No body expected, success                         |
| 400  | Bad Request           | Request body fields don't match backend contract  |
| 401  | Unauthorized          | Token missing or expired                          |
| 403  | Forbidden             | User lacks permission for this action             |
| 404  | Not Found             | Wrong URL or missing path param                   |
| 422  | Unprocessable         | Validation error in request body                  |
| 500  | Server Error          | Check request body against backend contract first |
