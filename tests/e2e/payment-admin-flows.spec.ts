import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { getAuthEnv, loginWithCredentials } from "./helpers/auth";
import { createTinyPng } from "./helpers/files";
import { resetCurrentMonthPaymentForHouse } from "./helpers/supabase-admin";

const env = getAuthEnv();

async function uploadReceipt(page: Page, identifier: string, password: string) {
  await loginWithCredentials(page, identifier, password);
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });

  await page.getByRole("link", { name: /pay now/i }).click();
  await expect(page).toHaveURL(/\/payments$/);
  await expect(page.getByRole("heading", { name: "Submit your receipt" })).toBeVisible();

  await page.getByTestId("payment-receipt-input").setInputFiles(createTinyPng());
  await page.getByTestId("submit-receipt-button").click();

  await expect(
    page.getByText("Payment receipt uploaded successfully and is waiting for committee review."),
  ).toBeVisible();
  await expect(page.getByText("Your receipt has been submitted and is waiting for committee review.")).toBeVisible();
}

test.describe.serial("resident payment and admin review flows", () => {
  test("resident can upload a receipt and see pending guidance", async ({ page }) => {
    test.skip(
      !env.paymentResidentIdentifier || !env.paymentResidentPassword,
      "Set E2E_PAYMENT_RESIDENT_IDENTIFIER and E2E_PAYMENT_RESIDENT_PASSWORD in .env.e2e.local",
    );

    await uploadReceipt(page, env.paymentResidentIdentifier!, env.paymentResidentPassword!);
    await expect(page.getByText("Current status")).toBeVisible();
  });

  test("admin can approve an uploaded receipt", async ({ browser }) => {
    test.skip(
      !env.adminIdentifier ||
        !env.adminPassword ||
        !env.paymentResidentIdentifier ||
        !env.paymentResidentPassword,
      "Set admin and payment resident credentials in .env.e2e.local",
    );

    const residentPage = await browser.newPage();
    await uploadReceipt(
      residentPage,
      env.paymentResidentIdentifier!,
      env.paymentResidentPassword!,
    );
    await residentPage.close();

    const adminPage = await browser.newPage();
    await loginWithCredentials(adminPage, env.adminIdentifier!, env.adminPassword!);
    await expect(adminPage).toHaveURL(/\/admin$/, { timeout: 15_000 });

    await adminPage.goto("/admin/approvals");
    await expect(
      adminPage.getByRole("heading", { name: /review submissions for/i }),
    ).toBeVisible();
    const approvalCard = adminPage.getByTestId(
      `approval-card-${env.paymentResidentIdentifier!}`,
    );
    await expect(approvalCard).toBeVisible();

    await approvalCard.getByTestId(`approve-payment-${env.paymentResidentIdentifier!}`).click();
    await adminPage.getByRole("button", { name: "Confirm" }).click();

    await expect(adminPage).toHaveURL(/message=Payment%20approved%20successfully/);
    await expect(adminPage.getByText("Payment approved successfully.")).toBeVisible();
    await expect(adminPage.getByRole("status")).toContainText("Payment approved successfully.");
    await adminPage.close();
  });

  test("admin can reject an uploaded receipt with a saved reason", async ({ browser }) => {
    test.skip(
      !env.adminIdentifier ||
        !env.adminPassword ||
        !env.paymentResidentIdentifier ||
        !env.paymentResidentPassword,
      "Set admin and payment resident credentials in .env.e2e.local",
    );

    const residentPage = await browser.newPage();
    await uploadReceipt(
      residentPage,
      env.paymentResidentIdentifier!,
      env.paymentResidentPassword!,
    );
    await residentPage.close();

    const adminPage = await browser.newPage();
    await loginWithCredentials(adminPage, env.adminIdentifier!, env.adminPassword!);
    await expect(adminPage).toHaveURL(/\/admin$/, { timeout: 15_000 });
    await adminPage.goto("/admin/approvals");
    await expect(
      adminPage.getByRole("heading", { name: /review submissions for/i }),
    ).toBeVisible();

    const approvalCard = adminPage.getByTestId(
      `approval-card-${env.paymentResidentIdentifier!}`,
    );
    await expect(approvalCard).toBeVisible();

    await approvalCard.getByLabel("Reject reason").selectOption({
      label: "Wrong month selected.",
    });
    await approvalCard.getByTestId(`reject-payment-${env.paymentResidentIdentifier!}`).click();
    await adminPage.getByRole("button", { name: "Confirm" }).click();

    await expect(adminPage).toHaveURL(/message=Payment%20proof%20rejected%20with%20reason%20saved/);
    await expect(adminPage.getByText("Payment proof rejected with reason saved.")).toBeVisible();
    await expect(adminPage.getByRole("status")).toContainText(
      "Payment proof rejected with reason saved.",
    );
    await adminPage.close();
  });

  test("admin can mark a resident as cash paid", async ({ page }) => {
    test.skip(
      !env.adminIdentifier || !env.adminPassword || !env.cashResidentHouseNumber,
      "Set E2E_ADMIN_* and E2E_CASH_RESIDENT_HOUSE_NUMBER in .env.e2e.local",
    );

    await resetCurrentMonthPaymentForHouse(env.cashResidentHouseNumber!);

    await loginWithCredentials(page, env.adminIdentifier!, env.adminPassword!);
    await expect(page).toHaveURL(/\/admin$/, { timeout: 15_000 });
    await page.goto("/admin/residents");
    await expect(
      page.getByRole("heading", { name: /payment status for/i }),
    ).toBeVisible();

    await page.getByLabel("Search resident").fill(env.cashResidentHouseNumber!);
    const markCashButton = page.getByTestId(`mark-cash-${env.cashResidentHouseNumber!}`);
    await expect(markCashButton).toBeVisible();

    await markCashButton.click();
    await page.getByRole("button", { name: "Confirm" }).click();

    await expect(page).toHaveURL(/message=Cash%20payment%20marked%20successfully/);
    await expect(page.getByText("Cash payment marked successfully.")).toBeVisible();
    await expect(
      page.getByRole("status").filter({ hasText: "Cash payment marked successfully." }),
    ).toContainText("Cash payment marked successfully.");
  });
});
