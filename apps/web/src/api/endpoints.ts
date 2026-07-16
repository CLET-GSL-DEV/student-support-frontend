import { GET, POST } from '@starter/api-client';

/**
 * Example declarative endpoints — replace with real resources. `path` can be a
 * plain string or a `(params) => string` function for path params (e.g.
 * `(p) => \`/todos/\${p.id}\``). `queryKey` doubles as the TanStack Query cache
 * key for `useQueryEndpoint`; a mutation's `invalidates` lists query keys to
 * refetch on success.
 */
export interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

export const todosEndpoints = {
  list: GET<Todo[]>({
    path: '/todos',
    queryKey: ['todos'],
  }),
  create: POST<Todo, { title: string }>({
    path: '/todos',
    invalidates: [['todos']],
  }),
};
