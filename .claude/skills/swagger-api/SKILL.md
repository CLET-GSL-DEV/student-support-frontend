---
name: swagger-api
description:
  Fetch OpenAPI/Swagger specs via URL and generate typed endpoint definitions matching this
  project's endpoint factory (GET/POST/PATCH/PUT/DELETE helpers,
  useQueryEndpoint/useMutationEndpoint)
---

## What I do

Given an OpenAPI/Swagger JSON or YAML URL, I:

1. Fetch and parse the spec
2. Generate TypeScript types from `#/components/schemas/`
3. Generate endpoint definitions using this project's `GET()`/`POST()`/`PATCH()`/`PUT()`/`DELETE()`
   helpers from `@starter/api-client` (see the `architecture` skill)
4. Write everything into a file matching this project's conventions
   (`apps/<app>/src/api/<domain>.ts` or `packages/<domain>/src/api.ts`)

## Project API pattern

```ts
import { DELETE, GET, PATCH, POST, PUT } from '@starter/api-client';

export interface Item {
  id: string;
  name: string;
}

export const itemsKeys = {
  all: ['items'] as const,
  lists: () => [...itemsKeys.all, 'list'] as const,
} as const;

export const itemsEndpoints = {
  list: GET<Item[], { page: number }>({ path: '/items', queryKey: itemsKeys.lists() }),
  create: POST<Item, { name: string }>({ path: '/items', invalidates: [itemsKeys.lists()] }),
} as const;
```

Consumed via the hooks, not called directly — see the `architecture` skill:

```tsx
import { useMutationEndpoint, useQueryEndpoint } from '@starter/api-client';

const { data } = useQueryEndpoint(itemsEndpoints.list, { query: { page: 1 } });
const create = useMutationEndpoint(itemsEndpoints.create);
```

For a separate backend service (its own axios instance, different base URL/auth):

```ts
import axios from 'axios';

import { createService } from '@starter/api-client';

const client = axios.create({ baseURL: env.someOtherApiUrl, timeout: 30000 });
const svc = createService(itemsEndpoints.list, client);
```

## Type generation rules

- `type: "string"` + `format: "date-time"` -> `string`
- `type: "integer"` or `type: "number"` -> `number`
- `type: "boolean"` -> `boolean`
- `$ref: "#/components/schemas/Foo"` -> inline the referenced type
- `type: "array"` -> `Array<itemType>`
- `nullable: true` -> `| null`
- `required` array drives which fields are required in the interface; everything else is optional

## File output conventions

Write a single `.ts` file with:

1. Imports at top
2. All response/request types as exported interfaces (no inline types unless trivial)
3. A query-key factory (`as const`)
4. Endpoint definitions as a const record (`as const`)

No hooks, no `createService` calls, no `useEffect` in this file — see the `architecture` skill's
"pure declarations only" rule. Consumers import the endpoints and call
`useQueryEndpoint`/`useMutationEndpoint` themselves.

## When to use me

Use when adding endpoint definitions for a backend service that exposes an OpenAPI spec. Ask for the
spec URL and the desired output file path. Generate the code and write it to disk — the user will
review and adjust.

## Example flow

User: "Generate endpoint definitions from http://example.com/openapi.json for
apps/web/src/api/items.ts" Agent: Fetches spec, generates types + query keys + endpoint defs, writes
file, runs `pnpm typecheck --filter @starter/web`.
