import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import path from "node:path";

export const UAT_AUTH_KEYS = [
  "ANTIFAKE_UAT_BUYER_EMAIL",
  "ANTIFAKE_UAT_BUYER_PASSWORD",
  "ANTIFAKE_UAT_SELLER_EMAIL",
  "ANTIFAKE_UAT_SELLER_PASSWORD",
  "ANTIFAKE_UAT_ADMIN_EMAIL",
  "ANTIFAKE_UAT_ADMIN_PASSWORD",
];

const roleCredentialKeys = {
  buyer: ["ANTIFAKE_UAT_BUYER_EMAIL", "ANTIFAKE_UAT_BUYER_PASSWORD"],
  seller: ["ANTIFAKE_UAT_SELLER_EMAIL", "ANTIFAKE_UAT_SELLER_PASSWORD"],
  admin: ["ANTIFAKE_UAT_ADMIN_EMAIL", "ANTIFAKE_UAT_ADMIN_PASSWORD"],
};

const DEFAULT_ENV_FILE = "../back-end/.env";
const DEFAULT_GREP = "buyer fixture pack|seller fixture pack|Admin review pack";

const hasValue = (value) => typeof value === "string" && value.trim().length > 0;

export function parseDotEnv(contents) {
  const values = {};

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;

    const [, name, rawValue] = match;
    let value = rawValue.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, "").trim();
    }
    values[name] = value;
  }

  return values;
}

export function getCredentialAvailability(environment) {
  return Object.fromEntries(
    Object.entries(roleCredentialKeys).map(([role, [emailKey, passwordKey]]) => [
      role,
      hasValue(environment[emailKey]) && hasValue(environment[passwordKey]),
    ]),
  );
}

export function buildUatCaptureEnvironment(
  baseEnvironment = process.env,
  fileEnvironment = {},
) {
  const environment = { ...baseEnvironment };

  for (const key of [...UAT_AUTH_KEYS, "UAT_QR_CODE"]) {
    if (!hasValue(environment[key]) && hasValue(fileEnvironment[key])) {
      environment[key] = fileEnvironment[key];
    }
  }

  Object.assign(environment, {
    UAT_BASE_URL: environment.UAT_BASE_URL || "https://antifake.io.vn",
    ANTIFAKE_CURRENT_ENVIRONMENT:
      environment.ANTIFAKE_CURRENT_ENVIRONMENT || "UAT_DEMO",
    UAT_APPROVED_PUBLIC_HOSTS:
      environment.UAT_APPROVED_PUBLIC_HOSTS ||
      "antifake.io.vn,www.antifake.io.vn",
    UAT_FIXTURE_SMOKE: "true",
    UAT_VIDEO: "false",
  });

  return environment;
}

function readOptionalEnvFile(environment) {
  const configuredPath = environment.UAT_ENV_FILE?.trim();
  const fileName = configuredPath || DEFAULT_ENV_FILE;
  const filePath = path.resolve(process.cwd(), fileName);

  if (!existsSync(filePath)) {
    if (configuredPath) {
      throw new Error(`UAT_ENV_FILE does not exist: ${configuredPath}`);
    }
    return {};
  }

  return parseDotEnv(readFileSync(filePath, "utf8"));
}

export function runUatVisualCapture(
  args = process.argv.slice(2),
  baseEnvironment = process.env,
) {
  const [project = "desktop", ...grepParts] = args;
  if (!["desktop", "mobile"].includes(project)) {
    throw new Error("UAT capture project must be desktop or mobile");
  }

  const fileEnvironment = readOptionalEnvFile(baseEnvironment);
  const environment = buildUatCaptureEnvironment(
    baseEnvironment,
    fileEnvironment,
  );
  const availability = getCredentialAvailability(environment);
  for (const role of ["buyer", "seller", "admin"]) {
    console.log(
      `${role.toUpperCase()}_CREDENTIAL_AVAILABLE=${availability[role]}`,
    );
  }

  const grep = grepParts.join(" ") || DEFAULT_GREP;
  const result = spawnSync(
    process.execPath,
    [
      "node_modules/playwright/cli.js",
      "test",
      "--config=playwright.uat.config.ts",
      "e2e/uat-visual-capture.spec.ts",
      `--project=${project}`,
      "--grep",
      grep,
    ],
    { cwd: process.cwd(), env: environment, stdio: "inherit" },
  );

  if (result.error) throw result.error;
  return result.status ?? 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = runUatVisualCapture();
  } catch (error) {
    console.error(error instanceof Error ? error.message : "UAT capture failed");
    process.exitCode = 1;
  }
}
