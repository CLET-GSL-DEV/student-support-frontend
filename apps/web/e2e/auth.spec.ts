import { expect, test } from '@playwright/test';

test('protected route redirects unauthenticated users to the in-app login page', async ({
  page,
}) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: /sign in to starter app/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^sign in$/i })).toBeVisible();
});

// Clicking "Sign in" hands off to the ZITADEL hosted login (external IdP).
// Driving that full round-trip requires a live ZITADEL test realm + credentials,
// which is out of scope for CI here. To enable it, point the VITE_ZITADEL_* env at
// a test instance and assert the redirect lands on `VITE_ZITADEL_AUTHORITY`.
test.skip('full sign-in through ZITADEL (requires a live test realm)', () => {});
