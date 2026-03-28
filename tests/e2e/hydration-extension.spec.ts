import { expect, test } from "@playwright/test";

test("does not log hydration mismatch when body is mutated before hydration", async ({
  page
}) => {
  const consoleErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await page.addInitScript(() => {
    const observer = new MutationObserver(() => {
      if (document.body && !document.body.classList.contains("kapture-loaded")) {
        document.body.classList.add("kapture-loaded");
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Recipes with real structure" })).toBeVisible();

  expect(
    consoleErrors.some((message) =>
      message.includes("hydrated but some attributes of the server rendered HTML didn't match")
    )
  ).toBe(false);
});
