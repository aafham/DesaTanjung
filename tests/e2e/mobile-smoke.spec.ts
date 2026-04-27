import { expect, test } from "@playwright/test";
import { getAuthEnv, loginWithCredentials } from "./helpers/auth";

const env = getAuthEnv();

async function expectNoHorizontalOverflow(page: Parameters<typeof test>[0]["page"]) {
  const hasOverflow = await page.evaluate(() => {
    const documentElement = document.documentElement;
    return documentElement.scrollWidth > documentElement.clientWidth + 2;
  });

  expect(hasOverflow).toBe(false);
}

test.describe("mobile smoke coverage", () => {
  test("resident can move through key mobile pages", async ({ page }) => {
    test.skip(
      !env.residentIdentifier || !env.residentPassword,
      "Set E2E_RESIDENT_IDENTIFIER and E2E_RESIDENT_PASSWORD in .env.e2e.local",
    );

    await loginWithCredentials(page, env.residentIdentifier!, env.residentPassword!);
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
    await expect(page.getByText("Current month")).toBeVisible();
    await expect(page.getByRole("link", { name: "Payments" })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto("/payments");
    await expect(page.getByRole("heading", { name: "Submit your receipt" })).toBeVisible();
    await expect(page.getByText("Payment guide")).toBeVisible();
    await expect(page.getByRole("button", { name: /press here to choose receipt/i })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto("/notifications");
    await expect(page.getByRole("heading", { name: "Resident inbox and updates" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Resident inbox", exact: true })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto("/profile");
    await expect(page.getByRole("heading", { name: "Resident details", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Save profile changes" })).toBeVisible();
    await expect(page.getByLabel("Phone number")).toHaveAttribute("autocomplete", "tel");
    await expectNoHorizontalOverflow(page);
  });

  test("admin can move through key mobile pages", async ({ page }) => {
    test.skip(
      !env.adminIdentifier || !env.adminPassword,
      "Set E2E_ADMIN_IDENTIFIER and E2E_ADMIN_PASSWORD in .env.e2e.local",
    );

    await loginWithCredentials(page, env.adminIdentifier!, env.adminPassword!);
    await expect(page).toHaveURL(/\/admin$/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /Overview for/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Residents", exact: true })).toBeVisible();

    await page.goto("/admin/residents");
    await expect(page.getByRole("heading", { name: /Payment status for/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Export filtered CSV/i })).toBeVisible();

    await page.goto("/admin/activity");
    await expect(page.getByRole("heading", { name: /Track the latest portal actions/i })).toBeVisible();

    await page.goto("/admin/health");
    await expect(page.getByRole("heading", { name: /Is the portal ready/i })).toBeVisible();
  });
});
