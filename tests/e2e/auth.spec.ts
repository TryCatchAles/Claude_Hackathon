import { test, expect } from '@playwright/test'

test('sign up flow', async ({ page }) => {
  await page.goto('/register')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'Password123!')
  await page.click('[type="submit"]')
  await expect(page).toHaveURL('/verify')
})

test('sign in flow', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'Password123!')
  await page.click('[type="submit"]')
  await expect(page).toHaveURL('/dashboard')
})
