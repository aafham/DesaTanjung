import { expect, test } from "@playwright/test";
import { getAuthEnv, loginWithCredentials } from "./helpers/auth";
import { createTinyPng } from "./helpers/files";

const env = getAuthEnv();

async function uploadReceipt(page: Parameters<typeof test>[0]["page"]) {
  await loginWithCredentials(
    page,
    env.paymentResidentIdentifier!,
    env.paymentResidentPassword!,
  );
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });

  await page.getByRole("link", { name: /pay now/i }).click();
  await expect(page).toHaveURL(/\/payments$/);
  await page.getByTestId("payment-receipt-input").setInputFiles(createTinyPng("resident-full-flow.png"));
  await page.getByTestId("submit-receipt-button").click();
  await expect(
    page.getByText("Payment receipt uploaded successfully and is waiting for committee review."),
  ).toBeVisible();
}

test.describe.serial("full resident user flow", () => {
  test("resident can save profile details without breaking dashboard access", async ({ page }) => {
    test.skip(
      !env.residentIdentifier || !env.residentPassword,
      "Set E2E_RESIDENT_IDENTIFIER and E2E_RESIDENT_PASSWORD in .env.e2e.local",
    );

    await loginWithCredentials(page, env.residentIdentifier!, env.residentPassword!);
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });

    await page.goto("/profile");
    await expect(page.getByRole("heading", { name: "Resident details" })).toBeVisible();

    const name = await page.getByLabel("Owner name").inputValue();
    const address = await page.getByLabel("House address").inputValue();
    const phone = (await page.getByLabel("Phone number").inputValue()) || "012-345 6789";

    await page.getByLabel("Owner name").fill(name);
    await page.getByLabel("House address").fill(address);
    await page.getByLabel("Phone number").fill(phone);
    await page.getByRole("button", { name: "Save profile changes" }).click();

    await expect(page).toHaveURL(/\/profile\?message=Profile%20updated%20successfully/);
    await expect(page.getByText("Profile updated successfully.")).toBeVisible();
  });

  test("resident can upload a receipt from a mobile viewport with accessible upload controls", async ({ page }) => {
    test.skip(
      !env.paymentResidentIdentifier || !env.paymentResidentPassword,
      "Set E2E_PAYMENT_RESIDENT_IDENTIFIER and E2E_PAYMENT_RESIDENT_PASSWORD in .env.e2e.local",
    );

    await page.setViewportSize({ width: 393, height: 851 });
    await loginWithCredentials(
      page,
      env.paymentResidentIdentifier!,
      env.paymentResidentPassword!,
    );
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });

    await page.goto("/payments");
    const uploadControl = page.getByRole("button", { name: /press here to choose receipt/i });
    await expect(uploadControl).toBeVisible();
    await uploadControl.focus();
    await expect(uploadControl).toBeFocused();

    await page.getByTestId("payment-receipt-input").setInputFiles(createTinyPng("resident-mobile-upload.png"));
    await expect(page.getByText("Receipt image summary")).toBeVisible();
    await expect(page.getByAltText("Receipt preview")).toBeVisible();
    await expect(page.getByTestId("submit-receipt-button")).toBeEnabled();

    await page.getByTestId("submit-receipt-button").click();
    await expect(
      page.getByText("Payment receipt uploaded successfully and is waiting for committee review."),
    ).toBeVisible();

    await page.goto("/dashboard");
    const viewReceiptButton = page.getByRole("button", { name: /view receipt/i }).first();
    await expect(viewReceiptButton).toBeVisible();
    await viewReceiptButton.click();

    const receiptDialog = page.getByRole("dialog", { name: /receipt preview/i });
    await expect(receiptDialog).toBeVisible();
    await expect(page.getByRole("button", { name: /close/i })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(receiptDialog).toBeHidden();
    await expect(viewReceiptButton).toBeFocused();
  });

  test("resident receives approval notification after admin approves receipt", async ({ browser }) => {
    test.skip(
      !env.adminIdentifier ||
        !env.adminPassword ||
        !env.paymentResidentIdentifier ||
        !env.paymentResidentPassword,
      "Set admin and payment resident credentials in .env.e2e.local",
    );

    const residentPage = await browser.newPage();
    await uploadReceipt(residentPage);
    await residentPage.close();

    const adminPage = await browser.newPage();
    await loginWithCredentials(adminPage, env.adminIdentifier!, env.adminPassword!);
    await expect(adminPage).toHaveURL(/\/admin$/, { timeout: 15_000 });
    await adminPage.goto("/admin/approvals");

    const approvalCard = adminPage.getByTestId(`approval-card-${env.paymentResidentIdentifier!}`);
    await expect(approvalCard).toBeVisible();
    await approvalCard.getByTestId(`approve-payment-${env.paymentResidentIdentifier!}`).click();
    await adminPage.getByRole("button", { name: "Confirm" }).click();
    await expect(adminPage.getByText("Payment approved successfully.")).toBeVisible();
    await adminPage.close();

    const notificationPage = await browser.newPage();
    await loginWithCredentials(
      notificationPage,
      env.paymentResidentIdentifier!,
      env.paymentResidentPassword!,
    );
    await expect(notificationPage).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
    await notificationPage.goto("/notifications");

    await expect(notificationPage.getByRole("heading", { name: "Resident inbox", exact: true })).toBeVisible();
    await expect(notificationPage.getByText(/has been approved by the committee/i).first()).toBeVisible();
    await notificationPage.close();
  });

  test("resident receives reject notification after admin rejects receipt", async ({ browser }) => {
    test.skip(
      !env.adminIdentifier ||
        !env.adminPassword ||
        !env.paymentResidentIdentifier ||
        !env.paymentResidentPassword,
      "Set admin and payment resident credentials in .env.e2e.local",
    );

    const residentPage = await browser.newPage();
    await uploadReceipt(residentPage);
    await residentPage.close();

    const adminPage = await browser.newPage();
    await loginWithCredentials(adminPage, env.adminIdentifier!, env.adminPassword!);
    await expect(adminPage).toHaveURL(/\/admin$/, { timeout: 15_000 });
    await adminPage.goto("/admin/approvals");

    const approvalCard = adminPage.getByTestId(`approval-card-${env.paymentResidentIdentifier!}`);
    await expect(approvalCard).toBeVisible();
    await approvalCard.getByLabel("Reject reason").selectOption({ label: "Wrong month selected." });
    await approvalCard.getByTestId(`reject-payment-${env.paymentResidentIdentifier!}`).click();
    await adminPage.getByRole("button", { name: "Confirm" }).click();
    await expect(adminPage.getByText("Payment proof rejected with reason saved.")).toBeVisible();
    await adminPage.close();

    const notificationPage = await browser.newPage();
    await loginWithCredentials(
      notificationPage,
      env.paymentResidentIdentifier!,
      env.paymentResidentPassword!,
    );
    await expect(notificationPage).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
    await notificationPage.goto("/notifications");

    await expect(notificationPage.getByRole("heading", { name: "Resident inbox", exact: true })).toBeVisible();
    await expect(notificationPage.getByText(/payment proof .* was rejected/i).first()).toBeVisible();
    await expect(notificationPage.getByText(/wrong month selected/i).first()).toBeVisible();
    await notificationPage.close();
  });
});
