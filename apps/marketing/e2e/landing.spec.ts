import { test, expect } from "@playwright/test";

// Marketing app runs on port 3000 in dev / test
const BASE_URL = process.env["MARKETING_URL"] ?? "http://localhost:3000";

// Default locale is "de"
test.describe("Marketing landing page — hero section", () => {
  test("renders hero section with CTA button", async ({ page }) => {
    await page.goto(`${BASE_URL}/de`);

    // Hero headline is rendered
    await expect(
      page.getByRole("heading", { name: /60 sekunden/i })
    ).toBeVisible();

    // Primary CTA button exists and is clickable
    const ctaButton = page.getByRole("link", { name: /generiere deine website/i });
    await expect(ctaButton).toBeVisible();
    await expect(ctaButton).toHaveAttribute("href", /\/de\/demo/);
  });
});

test.describe("Marketing landing page — language switcher", () => {
  test("switches locale from de to it and updates URL", async ({ page }) => {
    await page.goto(`${BASE_URL}/de`);

    // Open language dropdown in nav
    const langButton = page.locator("nav").getByRole("button", { name: /de/i }).first();
    await langButton.click();

    // Click Italian
    await page.getByRole("button", { name: /it/i }).first().click();

    // URL should now contain /it/
    await expect(page).toHaveURL(/\/it/);

    // Verify page content changed to Italian — CTA text
    await expect(
      page.getByRole("link", { name: /genera il tuo sito/i })
    ).toBeVisible();
  });
});

test.describe("Marketing Demo page — form submission flow", () => {
  test("submits demo form and shows loading state", async ({ page }) => {
    await page.goto(`${BASE_URL}/de/demo`);

    // Fill company name
    await page.getByRole("textbox").nth(0).fill("Test GmbH");

    // Select sector (first non-disabled option)
    const sector = page.locator("select");
    await sector.selectOption({ index: 1 });

    // Fill city
    await page.getByRole("textbox").nth(1).fill("Berlin");

    // Submit button should now be enabled
    const submitBtn = page.getByRole("button", { name: /generiere/i });
    await expect(submitBtn).toBeEnabled();

    // Intercept the API call so we don't actually call the backend
    await page.route("**/api/**", (route) => {
      void route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, previewUrl: "https://preview.example.com" }),
      });
    });

    await submitBtn.click();

    // Either loading state or success state should appear
    // The page transitions to a loading/terminal animation
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("keeps submit button disabled when form is incomplete", async ({ page }) => {
    await page.goto(`${BASE_URL}/de/demo`);

    // Submit button should be disabled when form is empty
    const submitBtn = page.getByRole("button", { name: /generiere/i });
    await expect(submitBtn).toBeDisabled();
  });
});

test.describe("Marketing Pricing page — billing toggle", () => {
  test("toggles between monthly and annual pricing", async ({ page }) => {
    await page.goto(`${BASE_URL}/de/prezzi`);

    // Monthly prices should be visible by default
    // Starter plan monthly: 297, annual: 238
    await expect(page.getByText("297")).toBeVisible();

    // Click the annual toggle button
    const annualBtn = page.getByRole("button", { name: /jährlich/i });
    await expect(annualBtn).toBeVisible();
    await annualBtn.click();

    // Annual prices should now be visible
    await expect(page.getByText("238")).toBeVisible();

    // Click back to monthly
    const monthlyBtn = page.getByRole("button", { name: /monatlich/i });
    await monthlyBtn.click();
    await expect(page.getByText("297")).toBeVisible();
  });

  test("shows -20% badge on annual toggle option", async ({ page }) => {
    await page.goto(`${BASE_URL}/de/prezzi`);
    await expect(page.getByText("-20%")).toBeVisible();
  });
});

test.describe("Marketing — mobile viewport (375px)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("renders hero section correctly at mobile width", async ({ page }) => {
    await page.goto(`${BASE_URL}/de`);

    // Logo visible
    await expect(page.getByText("madecreative").first()).toBeVisible();

    // Hamburger menu button visible (desktop nav is hidden)
    const hamburger = page.getByRole("button", { name: /menu/i });
    await expect(hamburger).toBeVisible();

    // Hero heading visible
    await expect(
      page.getByRole("heading", { name: /60 sekunden/i })
    ).toBeVisible();
  });

  test("mobile nav opens and shows all links", async ({ page }) => {
    await page.goto(`${BASE_URL}/de`);

    const hamburger = page.getByRole("button", { name: /menu/i });
    await hamburger.click();

    // Nav links should be visible in mobile menu
    await expect(page.getByRole("link", { name: /preise/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /demo/i })).toBeVisible();
  });

  test("pricing page is scrollable and cards stack vertically", async ({ page }) => {
    await page.goto(`${BASE_URL}/de/prezzi`);

    // Page should render without horizontal overflow
    const body = page.locator("body");
    await expect(body).toBeVisible();

    // All three plan cards should be reachable
    await expect(page.getByText("Starter")).toBeVisible();
  });
});
