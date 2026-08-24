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

test("Help registry covers canonical Buyer, Seller and Admin journey IDs", () => {
  const journeyIds = new Set(helpArticles.map((article) => article.journey));

  for (const prefix of ["B", "S", "A"]) {
    const max = prefix === "A" ? 10 : 9;
    for (let index = 1; index <= max; index += 1) {
      assert.equal(journeyIds.has(`${prefix}${String(index).padStart(2, "0")}`), true, `missing journey ${prefix}${index}`);
    }
  }
});

test("support journeys retain an evidence status and at least one step", () => {
  const supportArticles = helpArticles.filter((article) =>
    ["voucher", "chat-shop", "livestream", "wallet", "affiliate", "operations"].includes(article.slug),
  );

  assert.equal(supportArticles.every((article) => article.status && article.steps.length > 0), true);
});

test("Help source references point to files in the workspace", () => {
  const workspaceRoot = new URL("../../", import.meta.url);

  for (const article of helpArticles) {
    for (const sourceRef of article.sourceRefs) {
      const filePath = sourceRef.split("#", 1)[0];
      assert.equal(
        fs.existsSync(new URL(`${filePath}`, workspaceRoot)),
        true,
        `missing source reference ${sourceRef}`,
      );
    }
  }
});

test("master guide Help links resolve to registered journeys", () => {
  const guide = fs.readFileSync(
    new URL("../../docs/user-guide/ANTIFAKE_USER_GUIDE.md", import.meta.url),
    "utf8",
  );
  const routes = [...guide.matchAll(/\]\((\/help\/[^)]+)\)/g)].map((match) => match[1]);

  assert.equal(routes.length > 0, true);
  for (const route of routes) {
    assert.ok(getArticleForPath(route).article, `unregistered Help route ${route}`);
  }
});

test("canonical documentation Help links resolve to registered journeys", () => {
  const documents = [
    "ANTIFAKE_USER_GUIDE.md",
    "JOURNEY_MAPS.md",
    "DOCUMENTATION_REGISTRY.md",
    "FEATURE_GUIDE_MATRIX.md",
  ];

  for (const document of documents) {
    const content = fs.readFileSync(
      new URL(`../../docs/user-guide/${document}`, import.meta.url),
      "utf8",
    );
    const routes = [
      ...content.matchAll(/(?:\]\(|`)(\/help\/[^)\s`]+)(?:\)|`)/g),
    ].map((match) => match[1]);

    assert.ok(routes.length > 0, `no Help routes found in ${document}`);
    for (const route of routes) {
      assert.ok(getArticleForPath(route).article, `unregistered Help route ${route} in ${document}`);
    }
  }
});

test("visual manifest concrete assets exist", () => {
  const workspaceRoot = new URL("../../", import.meta.url);
  const manifest = fs.readFileSync(
    new URL("../../docs/user-guide/VISUAL_MANIFEST.md", import.meta.url),
    "utf8",
  );
  const assets = [...manifest.matchAll(/`(docs\/images\/[^`]+\.png)`/g)].map((match) => match[1]);

  assert.ok(assets.length > 0);
  for (const asset of assets) {
    assert.equal(fs.existsSync(new URL(asset, workspaceRoot)), true, `missing visual asset ${asset}`);
  }
});

test("feature matrix keeps incomplete journey statuses explicit", () => {
  const matrix = fs.readFileSync(
    new URL("../../docs/user-guide/FEATURE_GUIDE_MATRIX.md", import.meta.url),
    "utf8",
  );

  assert.match(matrix, /\| Chat \|[^\n]+\| PARTIAL \|/);
  assert.match(matrix, /\| QR verification \|[^\n]+\| NOT_IMPLEMENTED \|/);
  assert.match(matrix, /\| Admin journeys A01-A10 \|[^\n]+\| UNVERIFIED \|/);
});
