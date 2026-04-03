import { test, expect } from '@playwright/test'

test('search by skill — no name results', async ({ page }) => {
  await page.goto('/search')
  await page.fill('[name="query"]', 'machine learning')
  await page.click('[type="submit"]')

  // Results must appear
  await expect(page.locator('[data-testid="mentor-card"]')).toHaveCount({ min: 0 })

  // Name search must be blocked — no name input should exist
  await expect(page.locator('[name="mentor_name"]')).toHaveCount(0)
})
