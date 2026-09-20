import { expect, test } from "@playwright/test"

const PASSWORD = "correct horse battery"

test.describe.configure({ mode: "serial", timeout: 90_000 })

test("first run asks for a password, then unlocks the app", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto("/")
  await expect(page).toHaveURL(/\/setup/)
  await expect(page.getByText("Set up a password")).toBeVisible()

  await page.locator("#password").fill(PASSWORD)
  await page.locator("#confirm").fill(PASSWORD)
  await page.getByRole("button", { name: "Set password" }).click()

  await expect(page.getByText("Everything Google kept.")).toBeVisible()
})

test("index the fixture and open Mail", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto("/login")
  await page.locator("#password").fill(PASSWORD)
  await page.getByRole("button", { name: "Unlock" }).click()
  await expect(page.getByText("Everything Google kept.")).toBeVisible()

  await page.getByRole("button", { name: "Reindex" }).click()

  // Indexing runs in a separate process; reload until the fixture's mail shows up.
  await expect(async () => {
    await page.goto("/mail")
    await expect(page.getByText("Quarterly plan").first()).toBeVisible({ timeout: 2000 })
  }).toPass({ timeout: 60_000 })
})

test("a narrow viewport shows only the desktop-only block", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 })
  await page.goto("/login")
  await expect(page.getByTestId("desktop-only-block")).toBeVisible()
  await expect(page.getByTestId("app-root")).toBeHidden()
})

test("requests with a foreign Host header are rejected", async ({ request, baseURL }) => {
  const response = await request.get(baseURL as string, { headers: { host: "evil.example" }, maxRedirects: 0 })
  expect(response.status()).toBe(403)
})

test("media routes and Server Functions need a session", async ({ playwright, baseURL }) => {
  const anonymous = await playwright.request.newContext({ baseURL })
  for (const url of ["/media/1", "/thumb/1", "/download/1", "/attachment/1/0"]) {
    const response = await anonymous.get(url, { maxRedirects: 0 })
    expect([307, 401, 403]).toContain(response.status())
  }
  await anonymous.dispose()
})
