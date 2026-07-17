import { RouterProvider, createMemoryRouter, useLocation } from 'react-router';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useCreateParam } from './useCreateParam';

function Probe({ onCreate }: { onCreate: () => void }) {
  useCreateParam('rule', onCreate);
  const location = useLocation();
  return <span data-testid="search">{location.search || 'empty'}</span>;
}

describe('useCreateParam', () => {
  it('opens the create action once and consumes the param', async () => {
    const onCreate = vi.fn();
    const router = createMemoryRouter([{ path: '/x', element: <Probe onCreate={onCreate} /> }], {
      initialEntries: ['/x?new=rule'],
    });
    render(<RouterProvider router={router} />);

    expect(await screen.findByText('empty')).toBeInTheDocument();
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('ignores other entities and leaves their params alone', async () => {
    const onCreate = vi.fn();
    const router = createMemoryRouter([{ path: '/x', element: <Probe onCreate={onCreate} /> }], {
      initialEntries: ['/x?new=template'],
    });
    render(<RouterProvider router={router} />);

    expect(await screen.findByText('?new=template')).toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('does nothing without the param', async () => {
    const onCreate = vi.fn();
    const router = createMemoryRouter([{ path: '/x', element: <Probe onCreate={onCreate} /> }], {
      initialEntries: ['/x'],
    });
    render(<RouterProvider router={router} />);

    expect(await screen.findByText('empty')).toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();
  });
});
