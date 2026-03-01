import { test, expect } from "@playwright/test";
import { encode } from "next-auth/jwt";

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

test("ingestion trigger shows job in status view (CI-safe mocks)", async ({ page, context, baseURL }) => {
  const secret = process.env.NEXTAUTH_SECRET ?? "test-secret";
  const base = baseURL ?? "http://127.0.0.1:3000";
  const url = new URL(base);
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

  const jobId = "job-e2e-1";
  let triggered = false;

  await page.route("**/api/ingestion/trigger", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    triggered = true;
    return await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { jobId } }),
    });
  });

  await page.route("**/api/ingestion/jobs**", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    const jobs = triggered
      ? [
          {
            id: jobId,
            state: "succeeded",
            rawState: "completed",
            name: "ingest-dropbox",
            attemptsMade: 1,
            timestamp: Date.now(),
            processedOn: Date.now(),
            finishedOn: Date.now(),
            failedReason: null,
          },
        ]
      : [];
    return await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { jobs } }),
    });
  });

  await page.goto("/ingestion");
  await expect(page.getByRole("heading", { name: "Ingestion" })).toBeVisible();

  await page.getByRole("button", { name: "Trigger ingestion" }).click();

  await expect(page.getByText(jobId)).toBeVisible();
  await expect(page.getByText("succeeded")).toBeVisible();
});

