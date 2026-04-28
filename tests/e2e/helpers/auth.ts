import { expect, Page } from "@playwright/test";

export type AuthEnv = {
  adminIdentifier?: string;
  adminPassword?: string;
  residentIdentifier?: string;
  residentPassword?: string;
  paymentResidentIdentifier?: string;
  paymentResidentPassword?: string;
  privacyResidentIdentifier?: string;
  privacyResidentPassword?: string;
  cashResidentHouseNumber?: string;
  allowSettingsMutation?: boolean;
  firstLoginIdentifier?: string;
  firstLoginPassword?: string;
  firstLoginNewPassword?: string;
};

export function getAuthEnv(): AuthEnv {
  return {
    adminIdentifier: process.env.E2E_ADMIN_IDENTIFIER,
    adminPassword: process.env.E2E_ADMIN_PASSWORD,
    residentIdentifier: process.env.E2E_RESIDENT_IDENTIFIER,
    residentPassword: process.env.E2E_RESIDENT_PASSWORD,
    paymentResidentIdentifier: process.env.E2E_PAYMENT_RESIDENT_IDENTIFIER,
    paymentResidentPassword: process.env.E2E_PAYMENT_RESIDENT_PASSWORD,
    privacyResidentIdentifier:
      process.env.E2E_PRIVACY_RESIDENT_IDENTIFIER ?? process.env.E2E_CASH_RESIDENT_HOUSE_NUMBER,
    privacyResidentPassword:
      process.env.E2E_PRIVACY_RESIDENT_PASSWORD ?? process.env.E2E_RESIDENT_PASSWORD,
    cashResidentHouseNumber: process.env.E2E_CASH_RESIDENT_HOUSE_NUMBER,
    allowSettingsMutation: process.env.E2E_ALLOW_SETTINGS_MUTATION === "true",
    firstLoginIdentifier: process.env.E2E_FIRST_LOGIN_IDENTIFIER,
    firstLoginPassword: process.env.E2E_FIRST_LOGIN_PASSWORD,
    firstLoginNewPassword: process.env.E2E_FIRST_LOGIN_NEW_PASSWORD,
  };
}

export async function gotoLogin(page: Page) {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /Access your account|Akses akaun anda/ })).toBeVisible();
}

export async function loginWithCredentials(
  page: Page,
  identifier: string,
  password: string,
) {
  await gotoLogin(page);
  await page.getByLabel(/House number \/ Username|Nombor rumah \/ Username/).fill(identifier);
  await page.getByLabel(/Password|Kata laluan/).fill(password);
  await page.getByRole("button", { name: /Enter portal|Masuk portal/ }).click();
}
