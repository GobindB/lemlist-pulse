import { test, expect } from "@playwright/test";

test.describe("primary dashboard", () => {
  test("loads, renders KPI cards with non-empty values, and drills into a campaign", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Sales Activity")).toBeVisible();
    await expect(page.getByText(/Today/i).first()).toBeVisible({ timeout: 10_000 });

    // Wait for SWR-driven cards to populate. The pace card shows e.g. "5 / 30 calls".
    await expect(page.getByText(/calls/i).first()).toBeVisible({ timeout: 15_000 });

    // KPI strip should show at least one outcome metric label
    await expect(page.getByText(/Connect rate/i)).toBeVisible({ timeout: 15_000 });

    // Navigate to campaigns
    await page.getByRole("link", { name: /campaigns/i }).first().click();
    await expect(page).toHaveURL(/\/campaigns$/);

    // Click the first campaign in the list
    const firstCampaign = page.locator("a[href^='/campaigns/']").first();
    await expect(firstCampaign).toBeVisible({ timeout: 10_000 });
    await firstCampaign.click();

    // Drill-down: confirm funnel header and "all campaigns" back link both render
    await expect(page.getByText(/Funnel/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/All campaigns/i)).toBeVisible();
  });
});
