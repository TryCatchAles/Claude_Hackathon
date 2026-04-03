import { test, expect } from '@playwright/test'

test('full booking flow', async ({ page }) => {
  // Assumes logged-in session cookie is set via storageState
  await page.goto('/search')
  await page.fill('[name="query"]', 'python')
  await page.click('[type="submit"]')

  await page.locator('[data-testid="mentor-card"]').first().click()
  await page.click('[data-testid="book-session"]')

  await expect(page).toHaveURL(/\/bookings\//)
  await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible()
})

test('cannot rate without a validated session', async ({ page }) => {
  await page.goto('/sessions')
  // Rating button must be disabled until session is validated
  await expect(page.locator('[data-testid="rate-btn"]:not([disabled])')).toHaveCount(0)
})
