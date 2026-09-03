import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  getArticleForPath,
  getArticleUrl,
  getVisibleHelpArticles,
  helpArticles,
} from "../src/data/helpCenter.ts";

const repositoryRoot = new URL("../../", import.meta.url);
const workspaceRoot = new URL("../../WorkSpace/", import.meta.url);

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

test("every Help article and step has user-facing text", () => {
  for (const article of helpArticles) {
    assert.ok(article.title.trim(), `missing article title for ${article.journey}`);
    assert.ok(article.summary.trim(), `missing article summary for ${article.journey}`);
    assert.ok(article.steps.length > 0, `missing steps for ${article.journey}`);

    for (const step of article.steps) {
      assert.ok(step.title.trim(), `missing step title for ${article.journey}/${step.slug}`);
      assert.ok(step.description.trim(), `missing step description for ${article.journey}/${step.slug}`);
    }
  }
});

test("public and Admin Help audiences cannot see each other's articles", () => {
  const publicArticles = getVisibleHelpArticles("public");
  const adminArticles = getVisibleHelpArticles("admin");

  assert.equal(publicArticles.every((article) => article.role !== "admin"), true);
  assert.equal(adminArticles.every((article) => article.role === "admin"), true);
  assert.equal(getArticleForPath("/help/admin/admin-dashboard").article, undefined);

  const adminArticle = getArticleForPath("/admin/help/admin/admin-dashboard", "admin").article;
  assert.equal(adminArticle?.journey, "A01");
  assert.equal(getArticleUrl(adminArticle), "/admin/help/admin/admin-dashboard");
  assert.equal(getArticleUrl(adminArticle, undefined, "admin"), "/admin/help/admin/admin-dashboard");
});

test("annotated Help visuals define a written explanation for every marker", () => {
  const expectedMarkers = new Map([
    ["B01/register", { desktop: [1, 2, 3], mobile: [1, 2, 3] }],
    ["B04/discover", { desktop: [1, 2, 3], mobile: [1, 2, 3] }],
    ["B04/product-detail", { desktop: [1, 2, 3], mobile: [1, 2, 3] }],
    ["B04/cart", { desktop: [1, 2], mobile: [1, 2] }],
    ["B02/search", { desktop: [1, 2, 3], mobile: [1, 2, 3] }],
    ["B02/detail", { desktop: [1, 2, 3], mobile: [1, 2, 3] }],
    ["B02/choose", { desktop: [1, 2, 3], mobile: [1, 2, 3] }],
    ["B09/discover", { desktop: [1, 2, 3], mobile: [1, 2, 3] }],
    ["A01/open", { desktop: [1, 2, 3], mobile: [1, 2, 3] }],
    ["A05/pending", { desktop: [1, 2, 3], mobile: [1, 2, 3] }],
    ["A09/list", { desktop: [1, 2, 3], mobile: [1, 2, 3] }],
    ["ADMIN-REVIEW/dashboard", { desktop: [1, 2, 3], mobile: [1, 2, 3] }],
    ["ADMIN-REVIEW/product-review", { desktop: [1, 2, 3], mobile: [1, 2, 3] }],
    ["ADMIN-OPERATIONS/dashboard", { desktop: [1, 2, 3], mobile: [1, 2, 3] }],
    ["S07/program", { desktop: [1, 2, 3], mobile: [1, 2, 3] }],
  ]);
  const visualSteps = helpArticles.flatMap((article) =>
    article.steps
      .filter((step) => step.visual)
      .map((step) => ({ journey: article.journey, step })),
  );

  assert.equal(visualSteps.length, expectedMarkers.size);

  for (const [key, platformMarkers] of expectedMarkers) {
    const [journey, stepSlug] = key.split("/");
    const step = helpArticles
      .find((article) => article.journey === journey)
      ?.steps.find((candidate) => candidate.slug === stepSlug);

    assert.ok(step?.visual, `missing visual for ${key}`);
    for (const [platform, numbers] of Object.entries(platformMarkers)) {
      const markers = step.visual.markers[platform];
      assert.deepEqual(markers.map((marker) => marker.number), numbers);
      assert.equal(new Set(numbers).size, numbers.length, `duplicate marker for ${key}/${platform}`);
      assert.deepEqual(numbers, numbers.map((_, index) => index + 1));
      assert.equal(
        markers.every((marker) => marker.guidance.trim().length > 0),
        true,
        `missing written guidance for ${key}/${platform}`,
      );
    }
  }
});

test("B02 product detail explains the platform-specific marker targets", () => {
  const article = helpArticles.find((candidate) => candidate.journey === "B02");
  const detail = article?.steps.find((step) => step.slug === "detail");
  const choose = article?.steps.find((step) => step.slug === "choose");

  assert.deepEqual(detail?.visual?.markers.desktop, [
    { number: 1, guidance: "Xem hình ảnh và thông tin nhận diện sản phẩm." },
    { number: 2, guidance: "Chọn biến thể và số lượng còn khả dụng." },
    { number: 3, guidance: "Đọc khu vực xác thực sản phẩm chính hãng." },
  ]);
  assert.deepEqual(detail?.visual?.markers.mobile, [
    { number: 1, guidance: "Xem hình ảnh sản phẩm để nhận diện mặt hàng." },
    { number: 2, guidance: "Đối chiếu tên và giá sản phẩm." },
    { number: 3, guidance: "Chọn dung tích hoặc biến thể phù hợp." },
  ]);
  assert.deepEqual(choose?.visual?.markers.mobile, [
    { number: 1, guidance: "Xem hình ảnh sản phẩm để nhận diện mặt hàng." },
    { number: 2, guidance: "Đối chiếu tên và giá sản phẩm trước khi chọn." },
    { number: 3, guidance: "Chọn dung tích hoặc biến thể phù hợp." },
  ]);
});

test("Help quality report records step-level coverage and remaining blockers", () => {
  const report = fs.readFileSync(
    new URL("../../WorkSpace/docs/user-guide/HELP_CENTER_QUALITY_AUDIT.md", import.meta.url),
    "utf8",
  );

  assert.match(report, /\*\*30\*\* \| \*\*88\*\*/);
  assert.match(report, /ARTICLE_ID.*FINAL_STATUS/);
  assert.match(report, /BLOCKED_FIXTURE/);
  assert.match(report, /BLOCKED_PROVIDER/);
  assert.match(report, /NOT_IMPLEMENTED/);
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

test("registered journey steps expose platform-specific visuals", () => {
  const expected = [
    ["B01", "register", "/journey-visuals/b01-registration-desktop.png", "/journey-visuals/b01-registration-mobile.png"],
    ["B04", "cart", "/journey-visuals/b04-cart-desktop.png", "/journey-visuals/b04-cart-mobile.png"],
    ["B02", "search", "/journey-visuals/b02-discovery-desktop.png", "/journey-visuals/b02-discovery-mobile.png"],
    ["B02", "detail", "/journey-visuals/b02-product-detail-desktop.png", "/journey-visuals/b02-product-detail-mobile.png"],
    ["B09", "discover", "/journey-visuals/b09-live-discovery-desktop.png", "/journey-visuals/b09-live-discovery-mobile.png"],
    ["A01", "open", "/journey-visuals/admin-dashboard-desktop.png", "/journey-visuals/admin-dashboard-mobile.png"],
    ["A05", "pending", "/journey-visuals/admin-product-review-desktop.png", "/journey-visuals/admin-product-review-mobile.png"],
    ["A09", "list", "/journey-visuals/admin-promotions-desktop.png", "/journey-visuals/admin-promotions-mobile.png"],
    ["ADMIN-REVIEW", "dashboard", "/journey-visuals/admin-dashboard-desktop.png", "/journey-visuals/admin-dashboard-mobile.png"],
    ["ADMIN-REVIEW", "product-review", "/journey-visuals/admin-product-review-desktop.png", "/journey-visuals/admin-product-review-mobile.png"],
    ["ADMIN-OPERATIONS", "dashboard", "/journey-visuals/admin-dashboard-desktop.png", "/journey-visuals/admin-dashboard-mobile.png"],
    ["S07", "program", "/journey-visuals/affiliate-program-desktop.png", "/journey-visuals/affiliate-program-mobile.png"],
  ];

  for (const [journey, stepSlug, desktop, mobile] of expected) {
    const article = helpArticles.find((candidate) => candidate.journey === journey);
    const step = article?.steps.find((candidate) => candidate.slug === stepSlug);
    assert.ok(step, `missing ${journey}/${stepSlug}`);
    assert.ok(step.visual, `missing visual metadata for ${journey}/${stepSlug}`);
    assert.equal(step.visual.desktop.startsWith("/help/"), false);
    assert.equal(step.visual.mobile.startsWith("/help/"), false);
    assert.equal(step.visual.desktop, desktop);
    assert.equal(step.visual.mobile, mobile);
    assert.equal(typeof step.visual.alt, "string");
    for (const asset of [desktop, mobile]) {
      assert.equal(
        fs.existsSync(new URL(`../public${asset}`, import.meta.url)),
        true,
        `missing served visual ${asset}`,
      );
    }
  }
});

test("B04 reuses accepted B02 visuals for equivalent public states", () => {
  const b02 = helpArticles.find((article) => article.journey === "B02");
  const b04 = helpArticles.find((article) => article.journey === "B04");
  const b02Search = b02?.steps.find((step) => step.slug === "search");
  const b02Detail = b02?.steps.find((step) => step.slug === "detail");
  const b04Discover = b04?.steps.find((step) => step.slug === "discover");
  const b04Detail = b04?.steps.find((step) => step.slug === "product-detail");

  assert.ok(b02Search?.visual);
  assert.ok(b02Detail?.visual);
  assert.ok(b04Discover?.visual);
  assert.ok(b04Detail?.visual);
  assert.deepEqual(b04Discover.visual, b02Search.visual);
  assert.deepEqual(b04Detail.visual, b02Detail.visual);
});

test("Admin overview journeys reuse accepted role-matched visuals", () => {
  const a01 = helpArticles.find((article) => article.journey === "A01");
  const a05 = helpArticles.find((article) => article.journey === "A05");
  const review = helpArticles.find((article) => article.journey === "ADMIN-REVIEW");
  const operations = helpArticles.find((article) => article.journey === "ADMIN-OPERATIONS");
  const a01Open = a01?.steps.find((step) => step.slug === "open");
  const a05Pending = a05?.steps.find((step) => step.slug === "pending");
  const reviewDashboard = review?.steps.find((step) => step.slug === "dashboard");
  const reviewProduct = review?.steps.find((step) => step.slug === "product-review");
  const operationsDashboard = operations?.steps.find((step) => step.slug === "dashboard");

  assert.ok(a01Open?.visual);
  assert.ok(a05Pending?.visual);
  assert.ok(reviewDashboard?.visual);
  assert.ok(reviewProduct?.visual);
  assert.ok(operationsDashboard?.visual);
  assert.deepEqual(reviewDashboard.visual, a01Open.visual);
  assert.deepEqual(reviewProduct.visual, a05Pending.visual);
  assert.deepEqual(operationsDashboard.visual, a01Open.visual);
});

test("QR Help describes the supported image path and fallback", () => {
  const article = helpArticles.find((candidate) => candidate.slug === "verify-product");
  assert.ok(article);

  const stepText = article.steps.map((step) => step.description).join(" ");
  assert.match(article.summary, /ảnh QR/);
  assert.match(stepText, /PNG, JPEG hoặc WebP/);
  assert.match(stepText, /ảnh rõ hơn/);
  assert.doesNotMatch(stepText, /cần bộ giải mã tương thích/);
});

test("Help source references point to files in the workspace", () => {
  for (const article of helpArticles) {
    for (const sourceRef of article.sourceRefs) {
      const filePath = sourceRef.split("#", 1)[0];
      const sourceRoot = filePath.startsWith("docs/") ? workspaceRoot : repositoryRoot;
      assert.equal(
        fs.existsSync(new URL(filePath, sourceRoot)),
        true,
        `missing source reference ${sourceRef}`,
      );
    }
  }
});

test("master guide Help links resolve to registered journeys", () => {
  const guide = fs.readFileSync(
    new URL("../../WorkSpace/docs/user-guide/ANTIFAKE_USER_GUIDE.md", import.meta.url),
    "utf8",
  );
  const routes = [...guide.matchAll(/\]\((\/(?:admin\/)?help\/[^)]+)\)/g)].map((match) => match[1]);

  assert.equal(routes.length > 0, true);
  for (const route of routes) {
    const audience = route.startsWith("/admin/help") ? "admin" : "public";
    assert.ok(getArticleForPath(route, audience).article, `unregistered Help route ${route}`);
  }
});

test("canonical documentation Help links resolve to registered journeys", () => {
  const documents = [
    "ANTIFAKE_USER_GUIDE.md",
    "ANTIFAKE_USER_GUIDE_EBOOK.md",
    "JOURNEY_MAPS.md",
    "DOCUMENTATION_REGISTRY.md",
    "FEATURE_GUIDE_MATRIX.md",
  ];

  for (const document of documents) {
    const content = fs.readFileSync(
      new URL(`../../WorkSpace/docs/user-guide/${document}`, import.meta.url),
      "utf8",
    );
    const routes = [
      ...content.matchAll(/(?:\]\(|`)(\/(?:admin\/)?help\/[^)\s`]+)(?:\)|`)/g),
    ].map((match) => match[1]);

    assert.ok(routes.length > 0, `no Help routes found in ${document}`);
    for (const route of routes) {
      const audience = route.startsWith("/admin/help") ? "admin" : "public";
      assert.ok(getArticleForPath(route, audience).article, `unregistered Help route ${route} in ${document}`);
    }
  }
});

test("legacy UAT draft points to the canonical master guide", () => {
  const legacyGuide = fs.readFileSync(
    new URL("../../WorkSpace/docs/HUONG_DAN_SU_DUNG_ANTIFAKE.md", import.meta.url),
    "utf8",
  );

  assert.match(legacyGuide, /\]\(user-guide\/ANTIFAKE_USER_GUIDE\.md\)/);
});

test("visual manifest concrete assets exist", () => {
  const manifest = fs.readFileSync(
    new URL("../../WorkSpace/docs/user-guide/VISUAL_MANIFEST.md", import.meta.url),
    "utf8",
  );
  const assets = [...manifest.matchAll(/`(docs\/images\/[^`]+\.png)`/g)].map((match) => match[1]);

  assert.ok(assets.length > 0);
  for (const asset of assets) {
    assert.equal(fs.existsSync(new URL(asset, workspaceRoot)), true, `missing visual asset ${asset}`);
  }
});

test("visual manifest lists every canonical journey", () => {
  const manifest = fs.readFileSync(
    new URL("../../WorkSpace/docs/user-guide/VISUAL_MANIFEST.md", import.meta.url),
    "utf8",
  );
  const rows = manifest.split("\n");

  for (const prefix of ["B", "S", "A"]) {
    const max = prefix === "A" ? 10 : 9;
    for (let index = 1; index <= max; index += 1) {
      const journeyId = `${prefix}${String(index).padStart(2, "0")}`;
      const row = rows.find((candidate) => candidate.startsWith(`| ${journeyId} |`));

      assert.ok(row, `missing visual manifest journey ${journeyId}`);
      assert.match(row, /Desktop 1440×900 \+ Mobile 390×844/);
      if (prefix === "A") {
        assert.match(row, /Pending (targeted Admin visual evidence|PII-reviewed Admin user list\/detail fixture|sanitized Shop application in review queue|approved withdrawal fixture with payout-provider sandbox)|No final annotated visual yet|annotated captures inspected/);
      } else if (journeyId === "B03") {
        assert.match(row, /Do not publish as final/);
      } else {
        assert.match(row, /Pending|BLOCKED_EXTERNAL/);
      }
    }
  }
});

test("visual manifest routes mirror canonical Help metadata", () => {
  const manifest = fs.readFileSync(
    new URL("../../WorkSpace/docs/user-guide/VISUAL_MANIFEST.md", import.meta.url),
    "utf8",
  );
  const rows = manifest.split("\n");

  for (const article of helpArticles.filter((candidate) => /^[BSA]\d{2}$/.test(candidate.journey))) {
    const row = rows.find((candidate) => candidate.startsWith(`| ${article.journey} |`));
    assert.ok(row, `missing visual manifest row for ${article.journey}`);
    const columns = row.split("|").slice(1, -1).map((column) => column.trim());

    assert.equal(
      columns[1].replace(/^`|`$/g, ""),
      getArticleUrl(article, undefined, article.role === "admin" ? "admin" : "public"),
      `route drift for ${article.journey}`,
    );
  }
});

test("feature matrix keeps incomplete journey statuses explicit", () => {
  const matrix = fs.readFileSync(
    new URL("../../WorkSpace/docs/user-guide/FEATURE_GUIDE_MATRIX.md", import.meta.url),
    "utf8",
  );

  assert.match(matrix, /\| Chat \|[^\n]+\| PARTIAL \|/);
  assert.match(matrix, /\| QR verification \|[^\n]+\| PARTIAL \|/);
  assert.match(matrix, /\| Admin journeys A01-A10 \|[^\n]+\| PARTIAL \|/);
});

test("Admin Help statuses match the verified read-only route subset", () => {
  const statusByJourney = new Map(
    helpArticles
      .filter((article) => /^A\d{2}$/.test(article.journey))
      .map((article) => [article.journey, article.status]),
  );

  for (const journey of ["A01", "A02", "A04", "A05", "A08", "A09"]) {
    assert.equal(statusByJourney.get(journey), "PARTIAL", `expected ${journey} to be PARTIAL`);
  }
  for (const journey of ["A03", "A06", "A07", "A10"]) {
    assert.equal(statusByJourney.get(journey), "NOT_IMPLEMENTED", `expected ${journey} to remain NOT_IMPLEMENTED`);
  }
});

test("feature matrix bridges canonical journeys to UAT and platform visuals", () => {
  const matrix = fs.readFileSync(
    new URL("../../WorkSpace/docs/user-guide/FEATURE_GUIDE_MATRIX.md", import.meta.url),
    "utf8",
  );

  for (const column of ["Journey", "UAT test", "Runtime status", "Desktop visual", "Mobile visual"]) {
    assert.match(matrix, new RegExp(`\\| ${column} \\|`), `missing matrix column ${column}`);
  }

  for (const prefix of ["B", "S", "A"]) {
    const max = prefix === "A" ? 10 : 9;
    for (let index = 1; index <= max; index += 1) {
      const journeyId = `${prefix}${String(index).padStart(2, "0")}`;
      assert.match(matrix, new RegExp(`\\| ${journeyId} \\|`), `missing matrix journey ${journeyId}`);
    }
  }
});

test("journey bridge UAT references exist in the canonical UAT matrix", () => {
  const guideMatrix = fs.readFileSync(
    new URL("../../WorkSpace/docs/user-guide/FEATURE_GUIDE_MATRIX.md", import.meta.url),
    "utf8",
  );
  const uatMatrix = fs.readFileSync(
    new URL("../../WorkSpace/docs/UAT_TEST_MATRIX.md", import.meta.url),
    "utf8",
  );
  const bridge = guideMatrix.split("## Journey/UAT traceability bridge")[1].split("\n| Feature | Role | UI |")[0];
  const rows = bridge.split("\n").filter((line) => line.startsWith("| ") && !line.startsWith("|---") && !line.includes("| Feature |"));

  assert.equal(rows.length, 28);
  for (const row of rows) {
    const columns = row.split("|").slice(1, -1).map((column) => column.trim());
    assert.equal(columns.length, 8, `invalid journey bridge row: ${row}`);
    for (const testId of columns[3].matchAll(/AF-[A-Z]+-\d{3}/g)) {
      assert.match(uatMatrix, new RegExp(`\\| ${testId[0]} \\|`), `missing UAT case ${testId[0]}`);
    }
  }
});

test("documentation registry lists every canonical journey", () => {
  const registry = fs.readFileSync(
    new URL("../../WorkSpace/docs/user-guide/DOCUMENTATION_REGISTRY.md", import.meta.url),
    "utf8",
  );

  for (const prefix of ["B", "S", "A"]) {
    const max = prefix === "A" ? 10 : 9;
    for (let index = 1; index <= max; index += 1) {
      const journeyId = `${prefix}${String(index).padStart(2, "0")}`;
      assert.equal(
        registry.split("\n").some((row) => row.startsWith("| ") && row.includes("`" + journeyId + "`")),
        true,
        `missing registry journey ${journeyId}`,
      );
    }
  }
});

test("canonical registry routes and statuses mirror Help metadata", () => {
  const registry = fs.readFileSync(
    new URL("../../WorkSpace/docs/user-guide/DOCUMENTATION_REGISTRY.md", import.meta.url),
    "utf8",
  );
  const registryRows = registry.split("\n").filter((row) => row.startsWith("| "));

  for (const article of helpArticles.filter((candidate) => /^[BSA]\d{2}$/.test(candidate.journey))) {
    const row = registryRows.find((candidate) => candidate.includes("`" + article.journey + "`"));
    assert.ok(row, `missing registry row for ${article.journey}`);
    const columns = row.split("|").slice(1, -1).map((column) => column.trim());
    assert.equal(
      columns[2].replace(/^`|`$/g, ""),
      getArticleUrl(article, undefined, article.role === "admin" ? "admin" : "public"),
    );
    assert.equal(columns[3], article.status, `status drift for ${article.journey}`);
  }
});

test("canonical guide and ebook embed accepted annotated journey visuals", () => {
  const documents = [
    "ANTIFAKE_USER_GUIDE.md",
    "ANTIFAKE_USER_GUIDE_EBOOK.md",
  ];
  const acceptedVisuals = [
    "../images/auth/registration-desktop-production-6b24be3-annotated.png",
    "../images/auth/registration-mobile-production-6b24be3-annotated.png",
    "../images/buyer/cart-desktop-production-8157ffa-annotated.png",
    "../images/buyer/cart-mobile-production-8157ffa-annotated.png",
    "../images/admin/admin-product-registrations-desktop-production-9637e9f-annotated.png",
    "../images/admin/admin-product-registrations-mobile-production-9637e9f-annotated.png",
    "../images/admin/admin-vouchers-desktop-production-9637e9f-annotated.png",
    "../images/admin/admin-vouchers-mobile-production-9637e9f-annotated.png",
    "../images/buyer/catalog-home-desktop-production-6b24be3-annotated.png",
    "../images/buyer/catalog-home-mobile-production-6b24be3-annotated.png",
    "../images/buyer/product-detail-desktop-production-6b24be3-annotated.png",
    "../images/buyer/product-detail-mobile-production-6b24be3-annotated.png",
    "../images/buyer/live-discovery-desktop-production-6b24be3-annotated.png",
    "../images/buyer/live-discovery-mobile-production-6b24be3-annotated.png",
  ];

  for (const document of documents) {
    const documentUrl = new URL(`../../WorkSpace/docs/user-guide/${document}`, import.meta.url);
    const content = fs.readFileSync(documentUrl, "utf8");
    for (const visual of acceptedVisuals) {
      assert.equal(content.includes(`](${visual})`), true, `${document} is missing ${visual}`);
      assert.equal(
        fs.existsSync(new URL(visual, documentUrl)),
        true,
        `missing embedded visual ${visual}`,
      );
    }
  }
});
