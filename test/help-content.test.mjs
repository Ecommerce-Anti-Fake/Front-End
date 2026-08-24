import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getArticleForPath, helpArticles } from "../src/data/helpCenter.ts";

test("Help Center covers source-backed buyer and seller support journeys", () => {
  const keys = new Set(helpArticles.map((article) => `${article.role}/${article.slug}`));

  for (const key of [
    "buyer/voucher",
    "buyer/chat-shop",
    "buyer/livestream",
    "seller/wallet",
    "seller/voucher",
    "seller/affiliate",
    "seller/livestream",
    "admin/operations",
  ]) {
    assert.equal(keys.has(key), true, `missing ${key}`);
  }
});

test("support journeys retain an evidence status and at least one step", () => {
  const supportArticles = helpArticles.filter((article) =>
    ["voucher", "chat-shop", "livestream", "wallet", "affiliate", "operations"].includes(article.slug),
  );

  assert.equal(supportArticles.every((article) => article.status && article.steps.length > 0), true);
});

test("master guide Help links resolve to registered journeys", () => {
  const guide = fs.readFileSync("../docs/user-guide/ANTIFAKE_USER_GUIDE.md", "utf8");
  const routes = [...guide.matchAll(/\]\((\/help\/[^)]+)\)/g)].map((match) => match[1]);

  assert.equal(routes.length > 0, true);
  for (const route of routes) {
    assert.ok(getArticleForPath(route).article, `unregistered Help route ${route}`);
  }
});
