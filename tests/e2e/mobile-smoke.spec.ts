import { expect, test } from "@playwright/test";
import { getAuthEnv, loginWithCredentials } from "./helpers/auth";

const env = getAuthEnv();

test.describe("mobile smoke coverage", () => {
  test("resident can move through key mobile pages", async ({ page }) => {
    test.skip(
      !env.residentIdentifier || !env.residentPassword,
      "Set E2E_RESIDENT_IDENTIFIER and E2E_RESIDENT_PASSWORD in .env.e2e.local",
    );

    await loginWithCredentials(page, env.residentIdentifier!, env.residentPassword!);
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
    await expect(page.getByText("Bulan semasa")).toBeVisible();
    await expect(page.getByRole("link", { name: "Bayaran" })).toBeVisible();

    await page.goto("/payments");
    await expect(page.getByRole("heading", { name: "Hantar resit bayaran" })).toBeVisible();
    await expect(page.getByText("Panduan bayaran")).toBeVisible();

    await page.goto("/notifications");
    await expect(page.getByRole("heading", { name: "Inbox penduduk dan makluman" })).toBeVisible();

    await page.goto("/profile");
    await expect(page.getByRole("heading", { name: "Maklumat penduduk" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Simpan perubahan profil" })).toBeVisible();
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
