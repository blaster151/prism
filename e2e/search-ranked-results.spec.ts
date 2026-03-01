import { test, expect } from "@playwright/test";
import { encode } from "next-auth/jwt";

// ---------------------------------------------------------------------------
// Fixtures — realistic search API responses
// ---------------------------------------------------------------------------

const FIXTURE_RESULTS_INITIAL = {
  data: {
    results: [
      {
        candidateId: "cand-alice-001",
        candidateName: "Alice Johnson",
        score: 0.899,
        semanticScore: 0.92,
        lexicalScore: 0.85,
        explanation: {
          summary: "90% match: matched on skills, clearance; supported by resume content.",
          evidence: [
            { field: "skills", snippet: "TypeScript, Python, satellite systems", source: "record" },
            { field: "clearance", snippet: "TS/SCI", source: "record" },
            {
              field: "resumeText",
              snippet: "…Led satellite guidance subsystem development for GPS III…",
              source: "resume",
              sourceDocumentId: "doc-alice-1",
            },
          ],
        },
      },
      {
        candidateId: "cand-bob-002",
        candidateName: "Bob Smith",
        score: 0.831,
        semanticScore: 0.78,
        lexicalScore: 0.95,
        explanation: {
          summary: "83% match: matched on skills; supported by resume content.",
          evidence: [
            { field: "skills", snippet: "Java, C++, embedded systems", source: "record" },
            {
              field: "resumeText",
              snippet: "…Developed real-time flight control software in C++…",
              source: "resume",
              sourceDocumentId: "doc-bob-1",
            },
          ],
        },
      },
      {
        candidateId: "cand-carol-003",
        candidateName: "Carol Williams",
        score: 0.706,
        semanticScore: 0.88,
        lexicalScore: 0.3,
        explanation: {
          summary: "71% match: matched on skills.",
          evidence: [
            { field: "skills", snippet: "Python, data analysis, machine learning", source: "record" },
          ],
        },
      },
    ],
    resultCount: 3,
    sessionId: "sess-e2e-001",
    queryContext: "senior engineer satellite",
  },
};

const FIXTURE_RESULTS_REFINEMENT = {
  data: {
    results: [
      {
        candidateId: "cand-alice-001",
        candidateName: "Alice Johnson",
        score: 0.94,
        semanticScore: 0.95,
        lexicalScore: 0.91,
        explanation: {
          summary: "94% match: matched on skills, clearance; supported by resume content.",
          evidence: [
            { field: "skills", snippet: "TypeScript, Python, satellite systems", source: "record" },
            { field: "clearance", snippet: "TS/SCI", source: "record" },
            {
              field: "resumeText",
              snippet: "…Led satellite guidance subsystem development for GPS III…",
              source: "resume",
              sourceDocumentId: "doc-alice-1",
            },
          ],
        },
      },
    ],
    resultCount: 1,
    sessionId: "sess-e2e-001",
    queryContext: "senior engineer satellite → TS/SCI clearance",
  },
};

// ---------------------------------------------------------------------------
// Auth helper (same pattern as ingest-trigger-status.spec.ts)
// ---------------------------------------------------------------------------

async function createSessionToken(args: { secret: string }) {
  const token = await encode({
    token: {
      sub: "e2e-user-id",
      role: "POWER_USER",
      email: "e2e@example.com",
    } as Record<string, unknown>,
    secret: args.secret,
    maxAge: 60 * 60,
  });
  return token;
}

async function injectAuthCookie(context: import("@playwright/test").BrowserContext, baseURL: string, secret: string) {
  const url = new URL(baseURL);
  const isSecure = url.protocol === "https:";
  const cookieName = isSecure ? "__Secure-next-auth.session-token" : "next-auth.session-token";
  const token = await createSessionToken({ secret });

  await context.addCookies([
    {
      name: cookieName,
      value: token,
      domain: url.hostname,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      secure: isSecure,
    },
  ]);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("Search E2E — ranked results with explanations", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    const secret = process.env.NEXTAUTH_SECRET ?? "test-secret";
    const base = baseURL ?? "http://127.0.0.1:3000";
    await injectAuthCookie(context, base, secret);
  });

  test("search page is accessible and shows heading + search bar", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByRole("heading", { name: "Search" })).toBeVisible();
    await expect(page.getByPlaceholder("Describe the candidate")).toBeVisible();
    await expect(page.getByRole("button", { name: "Search" })).toBeVisible();
  });

  test("submitting a query displays ranked results with scores and explanations", async ({ page }) => {
    // Mock the search API
    await page.route("**/api/search", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      return await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(FIXTURE_RESULTS_INITIAL),
      });
    });

    await page.goto("/search");

    // Type query and submit
    await page.getByPlaceholder("Describe the candidate").fill("senior engineer satellite");
    await page.locator("form").getByRole("button", { name: "Search" }).click();

    // Verify result count
    await expect(page.getByText("3 results")).toBeVisible();

    // Verify ranked candidates appear with names
    await expect(page.getByText("Alice Johnson")).toBeVisible();
    await expect(page.getByText("Bob Smith")).toBeVisible();
    await expect(page.getByText("Carol Williams")).toBeVisible();

    // Verify scores are displayed (exact match to avoid hitting summary text)
    await expect(page.getByText("90%", { exact: true }).first()).toBeVisible(); // Alice
    await expect(page.getByText("83%", { exact: true }).first()).toBeVisible(); // Bob
    await expect(page.getByText("71%", { exact: true }).first()).toBeVisible(); // Carol

    // Verify explanation summaries are displayed
    await expect(page.getByText(/matched on skills, clearance/).first()).toBeVisible();
    await expect(page.getByText(/supported by resume content/).first()).toBeVisible();

    // Verify rank indicators
    await expect(page.getByText("#1")).toBeVisible();
    await expect(page.getByText("#2")).toBeVisible();
    await expect(page.getByText("#3")).toBeVisible();
  });

  test("expanding a result shows evidence-linked explanation details", async ({ page }) => {
    await page.route("**/api/search", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      return await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(FIXTURE_RESULTS_INITIAL),
      });
    });

    await page.goto("/search");
    await page.getByPlaceholder("Describe the candidate").fill("senior engineer satellite");
    await page.locator("form").getByRole("button", { name: "Search" }).click();

    // Wait for results
    await expect(page.getByText("Alice Johnson")).toBeVisible();

    // Click "Show evidence" on first result
    const showButtons = page.getByText("Show evidence");
    await showButtons.first().click();

    // Verify evidence section is visible (first expanded card)
    await expect(page.getByText("Evidence", { exact: true }).first()).toBeVisible();

    // Verify Record and Resume badges appear within the expanded evidence
    await expect(page.getByText("Record", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Resume", { exact: true }).first()).toBeVisible();

    // Verify evidence field names are shown
    await expect(page.getByText("skills", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("clearance", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("resumeText", { exact: true })).toBeVisible();

    // Verify evidence snippets
    await expect(page.getByText(/TypeScript, Python, satellite systems/).first()).toBeVisible();
    await expect(page.getByText(/satellite guidance subsystem/).first()).toBeVisible();

    // Collapse evidence
    await page.getByText("Hide evidence").click();
    // After collapse, the "Evidence" heading inside the panel should be hidden
    await expect(page.getByText("Hide evidence")).not.toBeVisible();
  });

  test("refinement search shows query context banner", async ({ page }) => {
    let searchCallCount = 0;

    await page.route("**/api/search", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();

      const body = JSON.parse(route.request().postData() ?? "{}");
      searchCallCount++;

      if (searchCallCount === 1) {
        // First search — no sessionId expected
        expect(body.sessionId).toBeUndefined();
        return await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(FIXTURE_RESULTS_INITIAL),
        });
      }

      // Second search (refinement) — sessionId expected
      expect(body.sessionId).toBe("sess-e2e-001");
      return await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(FIXTURE_RESULTS_REFINEMENT),
      });
    });

    await page.goto("/search");
    const searchForm = page.locator("form");

    // First search
    await page.getByPlaceholder("Describe the candidate").fill("senior engineer satellite");
    await searchForm.getByRole("button", { name: "Search" }).click();
    await expect(page.getByText("3 results")).toBeVisible();

    // Refinement search
    await page.getByPlaceholder("Describe the candidate").fill("TS/SCI clearance");
    await searchForm.getByRole("button", { name: "Search" }).click();

    // Verify query context banner appears
    await expect(page.getByText("Search context")).toBeVisible();
    await expect(page.getByText("senior engineer satellite → TS/SCI clearance")).toBeVisible();

    // Verify refined results
    await expect(page.getByText("1 result", { exact: true })).toBeVisible();
    await expect(page.getByText("94%", { exact: true }).first()).toBeVisible();

    // Verify two API calls were made
    expect(searchCallCount).toBe(2);
  });

  test("New Search clears session and results", async ({ page }) => {
    await page.route("**/api/search", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();

      const body = JSON.parse(route.request().postData() ?? "{}");

      if (!body.sessionId) {
        return await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(FIXTURE_RESULTS_INITIAL),
        });
      }

      return await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(FIXTURE_RESULTS_REFINEMENT),
      });
    });

    await page.goto("/search");
    const searchForm = page.locator("form");

    // Initial search
    await page.getByPlaceholder("Describe the candidate").fill("senior engineer satellite");
    await searchForm.getByRole("button", { name: "Search" }).click();
    await expect(page.getByText("3 results")).toBeVisible();

    // Refinement to trigger context banner
    await page.getByPlaceholder("Describe the candidate").fill("TS/SCI clearance");
    await searchForm.getByRole("button", { name: "Search" }).click();
    await expect(page.getByText("Search context")).toBeVisible();

    // Click "New Search"
    await page.getByRole("button", { name: "New Search" }).click();

    // Verify context banner is gone
    await expect(page.getByText("Search context")).not.toBeVisible();

    // Verify results are cleared
    await expect(page.getByText("Alice Johnson")).not.toBeVisible();
    await expect(page.getByText("1 result")).not.toBeVisible();
  });

  test("search handles error response gracefully", async ({ page }) => {
    await page.route("**/api/search", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      return await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          error: { code: "VALIDATION", message: "Query must not be empty." },
        }),
      });
    });

    await page.goto("/search");
    await page.getByPlaceholder("Describe the candidate").fill("x");
    await page.locator("form").getByRole("button", { name: "Search" }).click();

    await expect(page.getByText("Query must not be empty.")).toBeVisible();
  });
});
