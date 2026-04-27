import { expect, test } from "@playwright/test";
import { getAuthEnv, gotoLogin, loginWithCredentials } from "./helpers/auth";

const env = getAuthEnv();

test.describe("authentication", () => {
  test("shows the public login page", async ({ page }) => {
    await gotoLogin(page);

    await expect(page.getByText("Portal bayaran bulanan komuniti.")).toBeVisible();
    await expect(page.getByText("Maklumat log masuk lalai")).toBeVisible();
    await expect(page.getByRole("button", { name: "Masuk portal" })).toBeVisible();
  });

  test("allows an admin to sign in and open the dashboard", async ({ page }) => {
    test.skip(
      !env.adminIdentifier || !env.adminPassword,
      "Set E2E_ADMIN_IDENTIFIER and E2E_ADMIN_PASSWORD in .env.e2e.local",
    );

    await loginWithCredentials(page, env.adminIdentifier!, env.adminPassword!);

    await expect(page).toHaveURL(/\/admin$/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /Overview for/i })).toBeVisible();
    await expect(page.getByText("Admin dashboard")).toBeVisible();
  });

  test("allows a resident to sign in and open the dashboard", async ({ page }) => {
    test.skip(
      !env.residentIdentifier || !env.residentPassword,
      "Set E2E_RESIDENT_IDENTIFIER and E2E_RESIDENT_PASSWORD in .env.e2e.local",
    );

    await loginWithCredentials(page, env.residentIdentifier!, env.residentPassword!);

    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
    await expect(page.getByText("Current month")).toBeVisible();
    await expect(page.getByText("Latest payment activity")).toBeVisible();
  });

  test("forces a first-login resident to change the password", async ({ page }) => {
    test.skip(
      !env.firstLoginIdentifier || !env.firstLoginPassword || !env.firstLoginNewPassword,
      "Set E2E_FIRST_LOGIN_IDENTIFIER, E2E_FIRST_LOGIN_PASSWORD, and E2E_FIRST_LOGIN_NEW_PASSWORD in .env.e2e.local",
    );

    await loginWithCredentials(page, env.firstLoginIdentifier!, env.firstLoginPassword!);

    await expect(page).toHaveURL(/\/change-password$/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Change your password" })).toBeVisible();
    await expect(page.getByText("Choose your language first")).toBeVisible();

    await page.getByLabel("New password", { exact: true }).fill(env.firstLoginNewPassword!);
    await page.getByLabel("Confirm new password").fill(env.firstLoginNewPassword!);
    await page.getByRole("button", { name: "Save new password" }).click();

    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
    await expect(page.getByText("Current month")).toBeVisible();
  });

  test("shows an error for invalid credentials", async ({ page }) => {
    await loginWithCredentials(page, "unknown-user", "wrong-password");

    await expect(page).toHaveURL(/\/login\?error=/);
    await expect(page.getByText("Username or password is incorrect.")).toBeVisible();
  });
});
