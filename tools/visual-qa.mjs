import { chromium } from "/Users/katerinaanisimova/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
});

for (const test of [
  { name: "desktop", width: 1440, height: 1100 },
  { name: "mobile", width: 390, height: 844 }
]) {
  const page = await browser.newPage({ viewport: { width: test.width, height: test.height } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:8766/", { waitUntil: "networkidle" });
  await page.screenshot({ path: `output/landing-${test.name}.png`, fullPage: true });
  await page.getByRole("button", { name: "Reserve My Free Spot" }).first().click();
  await page.screenshot({ path: `output/landing-${test.name}-modal.png`, fullPage: false });
  await page.locator("#name").fill("Test User");
  await page.locator("#email").fill("test@example.com");
  await page.getByRole("button", { name: "Confirm My Free Spot" }).click();
  const status = await page.locator("[data-form-status]").textContent();
  if (!status?.includes("Registration will open")) {
    throw new Error(`${test.name}: expected safe pre-launch form status`);
  }
  if (errors.length) throw new Error(`${test.name}: ${errors.join("; ")}`);
  await page.close();
}

await browser.close();
console.log("Visual QA passed for desktop and mobile.");
