import { expect, test } from "@playwright/test";
import { getAuthEnv, loginWithCredentials } from "./helpers/auth";
import { createTinyPng } from "./helpers/files";

const env = getAuthEnv();

test.describe("admin settings", () => {
  test("admin can update settings and upload a new QR on a disposable environment", async ({ browser, page }) => {
    test.skip(
      !env.adminIdentifier || !env.adminPassword || !env.allowSettingsMutation,
      "Set E2E_ADMIN_* and E2E_ALLOW_SETTINGS_MUTATION=true in .env.e2e.local for disposable environments only",
    );

    await loginWithCredentials(page, env.adminIdentifier!, env.adminPassword!);
    await expect(page).toHaveURL(/\/admin$/, { timeout: 15_000 });
    await page.goto("/admin/settings");
    await expect(
      page.getByRole("heading", { name: "Payment and community settings" }),
    ).toBeVisible();
    await expect(page.getByTestId("payment-qr-upload-label")).toBeVisible();

    const uniqueSuffix = Date.now().toString().slice(-6);
    const communityName = `Desa Tanjung Test ${uniqueSuffix}`;
    const monthlyFee = "45.50";
    const normalizedMonthlyFee = String(Number(monthlyFee));
    const dueDay = "9";
    const previewImage = page.getByTestId("payment-qr-preview-image");
    const beforePreviewSrc = await previewImage.getAttribute("src");

    await page.getByLabel("Community name").fill(communityName);
    await page.getByLabel("Monthly fee amount").fill(monthlyFee);
    await page.getByLabel("Payment due day").fill(dueDay);
    await page
      .getByTestId("payment-qr-input")
      .setInputFiles(createTinyPng(`payment-qr-${uniqueSuffix}.png`));

    await expect(page.getByText(`payment-qr-${uniqueSuffix}.png`)).toBeVisible();
    await expect(previewImage).toHaveAttribute("src", /blob:/);

    await page.getByRole("button", { name: "Save settings" }).click();

    await expect(page).toHaveURL(/message=Payment%20settings%20updated%20successfully/);
    await expect(page.getByText("Payment settings updated successfully.")).toBeVisible();
    await expect(page.getByRole("status")).toContainText("Payment settings updated successfully.");

    await expect(page.getByLabel("Community name")).toHaveValue(communityName);
    await expect(page.getByLabel("Monthly fee amount")).toHaveValue(normalizedMonthlyFee);
    await expect(page.getByLabel("Payment due day")).toHaveValue(dueDay);
    await expect(previewImage).not.toHaveAttribute("src", /blob:/);

    const afterPreviewSrc = await previewImage.getAttribute("src");
    expect(afterPreviewSrc).toBeTruthy();
    expect(afterPreviewSrc).not.toBe(beforePreviewSrc);

    if (env.residentIdentifier && env.residentPassword) {
      const residentContext = await browser.newContext();
      const residentPage = await residentContext.newPage();
      await loginWithCredentials(residentPage, env.residentIdentifier, env.residentPassword);
      await expect(residentPage).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
      await residentPage.goto("/payments");

      await expect(residentPage.getByAltText("Community payment QR code")).toBeVisible();
      const residentQrSrc = await residentPage
        .getByAltText("Community payment QR code")
        .getAttribute("src");

      expect(residentQrSrc).toBe(afterPreviewSrc);
      await residentContext.close();
    }
  });
});
