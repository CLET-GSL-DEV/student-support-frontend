import { describe, expect, it } from 'vitest';

import { cn } from './cn';
import { formatDate } from './formatDate';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('drops falsy values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });

  it('supports conditional objects', () => {
    expect(cn({ a: true, b: false })).toBe('a');
  });
});

describe('formatDate', () => {
  it('formats a date with the default locale', () => {
    const date = new Date('2026-07-05T00:00:00Z');
    expect(formatDate(date, { year: 'numeric', timeZone: 'UTC' })).toBe('2026');
  });
});
