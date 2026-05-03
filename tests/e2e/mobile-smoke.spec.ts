import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { getAuthEnv, loginWithCredentials } from "./helpers/auth";

const env = getAuthEnv();

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const documentElement = document.documentElement;
    const viewportWidth = documentElement.clientWidth;
    const offenders = Array.from(document.querySelectorAll("body *"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          text: (element.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 80),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      })
      .filter((element) => element.right > viewportWidth + 2 || element.left < -2)
      .slice(0, 5);

    return {
      hasOverflow: documentElement.scrollWidth > viewportWidth + 2,
      scrollWidth: documentElement.scrollWidth,
      viewportWidth,
      offenders,
    };
  });

  expect(
    overflow.hasOverflow,
    `Expected no horizontal overflow. ${JSON.stringify(overflow)}`,
  ).toBe(false);
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
    await expect(page.getByRole("button", { name: /PNG or JPG up to 10MB/i })).toBeVisible();
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
    await expectNoHorizontalOverflow(page);

    await page.goto("/admin/approvals");
    await expect(page.getByRole("heading", { name: /Review submissions for/i })).toBeVisible();
    await expect(page.getByText(/Pending receipts|No uploaded receipts/i).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto("/admin/residents");
    await expect(page.getByRole("heading", { name: /Payment status for/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Export filtered CSV/i })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { name: /Add, edit, delete, and reset user accounts/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Add user/i })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto("/admin/search");
    await expect(page.getByRole("heading", { name: /Search residents, payments, and activity/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Search A-12/i)).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto("/admin/settings");
    await expect(page.getByRole("heading", { name: /Payment and community settings/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Save settings/i })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto("/admin/reports");
    await expect(page.getByRole("heading", { name: /Monthly report for/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Download snapshot/i })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto("/admin/activity");
    await expect(page.getByRole("heading", { name: /Track the latest portal actions/i })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto("/admin/health");
    await expect(page.getByRole("heading", { name: /Is the portal ready/i })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
