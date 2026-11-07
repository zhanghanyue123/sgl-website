import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("AI customer service status dot straddles the launcher border", async () => {
  const source = await readFile(new URL("../components/AICustomerService.tsx", import.meta.url), "utf8");
  const launcher = source.match(/<div className="relative h-\[4\.5rem\] w-\[4\.5rem\]">([\s\S]*?)<\/div>/)?.[1];

  assert.ok(launcher, "launcher wrapper is missing");
  const button = launcher.match(/<button[\s\S]*?<\/button>/)?.[0];
  assert.ok(button, "launcher button is missing");
  assert.match(button, /className="[^"]*\boverflow-hidden\b[^"]*"/);
  assert.doesNotMatch(button, /bg-green-500/);

  const buttonEnd = launcher.indexOf("</button>");
  const statusDot = launcher.indexOf("bg-green-500");
  assert.ok(buttonEnd >= 0 && statusDot > buttonEnd, "status dot must be a sibling after the launcher button");
  const statusClasses = launcher.match(/<span className="([^"]*\bbg-green-500\b[^"]*)" aria-hidden="true" \/>/)?.[1].split(/\s+/) ?? [];
  assert.ok(statusClasses.includes("right-0") && statusClasses.includes("top-0"), "status dot must anchor to the launcher corner");
  assert.ok(statusClasses.includes("translate-x-1/2"), "status dot must extend halfway beyond the right border");
  assert.ok(statusClasses.includes("-translate-y-1/2"), "status dot must extend halfway beyond the top border");
});
