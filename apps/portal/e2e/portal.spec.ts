import { test, expect } from "@playwright/test";

// Portal app runs on port 3001 in dev / test
const BASE_URL = process.env["PORTAL_URL"] ?? "http://localhost:3001";

test.describe("Portal — login page", () => {
  test("renders login page with email and password fields", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    await expect(page).toHaveURL(/\/login/);

    // Email and password inputs should be present
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Submit button should be present
    await expect(
      page.getByRole("button", { name: /accedi|login|sign in/i })
    ).toBeVisible();
  });

  test("shows validation state on invalid credentials", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Intercept API login call and return 401
    await page.route("**/portal/auth/login", (route) => {
      void route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ success: false, error: "Credenziali non valide" }),
      });
    });

    await page.getByRole("textbox", { name: /email/i }).fill("wrong@example.com");
    await page.locator('input[type="password"]').fill("wrongpassword");
    await page.getByRole("button", { name: /accedi|login|sign in/i }).click();

    // Error message should appear
    await expect(page.getByText(/credenziali/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Portal — authentication guards", () => {
  test("redirects unauthenticated user from / to /login", async ({ page }) => {
    // Navigate to root — should redirect to /dashboard which then redirects to /login
    await page.goto(`${BASE_URL}/`);

    // After the redirect chain resolves, should land on /login
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test("redirects unauthenticated user from /dashboard to /login", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});

test.describe("Portal — dashboard layout", () => {
  // This test mocks auth so we can test the dashboard UI
  test.beforeEach(async ({ page }) => {
    // Set auth token in localStorage before navigation
    await page.addInitScript(() => {
      const mockUser = {
        id: "test-client-1",
        email: "test@example.com",
        companyName: "Test SRL",
        contactName: "Mario Rossi",
        plan: "GROWTH",
        status: "ACTIVE",
      };
      localStorage.setItem("mc_access_token", "mock-access-token");
      localStorage.setItem("mc_refresh_token", "mock-refresh-token");
      localStorage.setItem("mc_user", JSON.stringify(mockUser));
    });

    // Mock all API calls to return successful responses so the dashboard renders
    await page.route("**/portal/dashboard/**", (route) => {
      void route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            kpis: { visitors: 0, leads: 0, chatbotChats: 0, reviewsAvg: 0 },
            recentLeads: [],
            agentActivity: [],
            website: null,
          },
        }),
      });
    });
  });

  test("authenticated user sees sidebar navigation", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    // Should not be redirected to login
    await expect(page).not.toHaveURL(/\/login/, { timeout: 5000 });

    // Sidebar nav items should be visible
    await expect(page.getByRole("link", { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /sito/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /chatbot/i })).toBeVisible();
  });

  test("dashboard layout has sidebar and main content area", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    // Sidebar should exist in the DOM (may be hidden on mobile)
    const sidebar = page.locator("aside, nav[aria-label]").first();
    await expect(sidebar).toBeAttached();

    // Main content area should exist
    await expect(page.locator("main, [class*='main']").first()).toBeAttached();
  });
});
