import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const indexHtml = readFileSync(
  fileURLToPath(new URL("../index.html", import.meta.url)),
  "utf8",
);

test("uses the Vietnamese document locale for native 24-hour time controls", () => {
  assert.match(indexHtml, /<html\s+lang="vi-VN">/);
});
