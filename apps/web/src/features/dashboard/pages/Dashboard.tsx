import { useMutationEndpoint, useQueryEndpoint } from '@starter/api-client';

import { todosEndpoints } from '@/api/endpoints';
import { useCounterStore } from '@/stores';

export function Component() {
  const { count, increment, decrement, reset } = useCounterStore();

  const todos = useQueryEndpoint(todosEndpoints.list);
  const createTodo = useMutationEndpoint(todosEndpoints.create, {
    toast: {
      onSuccess: [{ condition: () => true, title: 'Todo created', variant: 'success' }],
      onError: [{ condition: () => true, title: 'Failed to create todo', variant: 'error' }],
    },
  });

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-gray-600">
        You are viewing a protected route. This card demonstrates the app-local Zustand store
        pattern for client state.
      </p>

      <div className="flex w-fit items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <button
          type="button"
          onClick={decrement}
          className="size-8 rounded-md border border-gray-300 text-lg"
        >
          −
        </button>
        <span className="w-10 text-center text-lg font-medium">{count}</span>
        <button
          type="button"
          onClick={increment}
          className="size-8 rounded-md border border-gray-300 text-lg"
        >
          +
        </button>
        <button type="button" onClick={reset} className="ml-2 text-sm text-gray-500 underline">
          reset
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-600">
          This card demonstrates server state via <code>useQueryEndpoint</code>/
          <code>useMutationEndpoint</code> against the <code>todosEndpoints</code> example in{' '}
          <code>src/api/endpoints.ts</code> — swap it for a real backend resource.
        </p>
        {todos.isLoading && <p className="text-sm text-gray-500">Loading todos…</p>}
        {todos.isError && <p className="text-sm text-red-600">Failed to load todos.</p>}
        {todos.data && (
          <ul className="list-disc pl-5 text-sm text-gray-700">
            {todos.data.map((todo) => (
              <li key={todo.id}>{todo.title}</li>
            ))}
          </ul>
        )}
        <button
          type="button"
          disabled={createTodo.isPending}
          onClick={() => createTodo.mutate({ body: { title: 'New todo' } })}
          className="w-fit rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
        >
          {createTodo.isPending ? 'Creating…' : 'Create todo'}
        </button>
      </div>
    </section>
  );
}
