import { test, expect } from "@playwright/test";

test("unauthenticated users are redirected to sign-in", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/auth\/signin/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

