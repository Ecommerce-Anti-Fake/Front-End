import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import {
  expect,
  type Browser,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import {
  assertUatCredentialNamespace,
  assertUatSellerAccount,
  assertUatRole,
  readUatAuthInput,
  type UatAuthRole,
} from "./uat-auth-contract.ts";

export function requiredCredential(role: UatAuthRole) {
  return readUatAuthInput(role)?.email;
}

export function requiredPassword(role: UatAuthRole = "buyer") {
  return readUatAuthInput(role)?.password;
}

export async function loginAs(
  page: Page,
  email: string,
  password: string,
  expectedRole?: UatAuthRole,
) {
  const loginResponsePromise = page.waitForResponse((response) => {
    try {
      const url = new URL(response.url());
      return (
        response.request().method() === "POST" &&
        /\/api\/auth\/login\/?$/i.test(url.pathname)
      );
    } catch {
      return false;
    }
  });
  await page.goto("/auth", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Email hoặc số điện thoại").fill(email);
  await page.getByRole("textbox", { name: "Mật khẩu" }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  const loginResponse = await loginResponsePromise;
  if (!loginResponse.ok()) {
    throw new Error(`UAT ${expectedRole ?? "account"} login failed`);
  }

  const loginPayload = (await loginResponse.json().catch(() => null)) as
    | {
        data?: { user?: { role?: unknown; shopId?: unknown } };
        user?: { role?: unknown; shopId?: unknown };
      }
    | null;
  const loginUser = loginPayload?.data?.user ?? loginPayload?.user;
  if (expectedRole) {
    assertUatRole(loginUser?.role, expectedRole);
    assertUatSellerAccount(expectedRole, loginUser?.shopId);
  }

  await page.waitForURL(
    (url) => url.pathname !== "/auth" && url.pathname !== "/login",
    { timeout: 15000 },
  );
  await expect(page.locator("body")).not.toBeEmpty();
}

const expectedRoleRoutes: Record<UatAuthRole, string> = {
  buyer: "/profile",
  seller: "/seller/shop-info",
  admin: "/admin",
};

const captureViewport = (testInfo: TestInfo) =>
  testInfo.project.name === "mobile"
    ? { width: 390, height: 844 }
    : { width: 1440, height: 900 };

const captureBaseURL = (testInfo: TestInfo) => {
  const baseURL = testInfo.project.use.baseURL;
  if (typeof baseURL !== "string" || !baseURL.trim()) {
    throw new Error("UAT base URL is unavailable for authenticated capture");
  }
  return baseURL;
};

export function getUatStorageStatePath(
  role: UatAuthRole,
  projectName: string,
) {
  return path.resolve(
    ".uat-runtime",
    "auth",
    `${role}-${projectName}.json`,
  );
}

async function verifyExpectedRoleRoute(page: Page, role: UatAuthRole) {
  const route = expectedRoleRoutes[role];
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).not.toBeEmpty();
  await expect(page).not.toHaveURL(/\/auth(?:\/|\?|$)/i);
  await expect(page).toHaveURL(
    new RegExp(`${route.replace("/", "\\/")}(?:\\?|$)`),
  );
}

export async function createAuthenticatedPage(
  browser: Browser,
  role: UatAuthRole,
  testInfo: TestInfo,
) {
  const credentials = readUatAuthInput(role);
  if (!credentials) {
    throw new Error(`UAT ${role} credentials are unavailable`);
  }
  assertUatCredentialNamespace(role, credentials.email);

  const viewport = captureViewport(testInfo);
  const baseURL = captureBaseURL(testInfo);
  const authDirectory = path.resolve(".uat-runtime", "auth");
  const storageStatePath = getUatStorageStatePath(role, testInfo.project.name);
  await mkdir(authDirectory, { recursive: true });

  const loginContext = await browser.newContext({
    baseURL,
    viewport,
    isMobile: testInfo.project.name === "mobile",
    hasTouch: testInfo.project.name === "mobile",
  });
  try {
    const loginPage = await loginContext.newPage();
    await loginAs(
      loginPage,
      credentials.email,
      credentials.password,
      role,
    );
    await verifyExpectedRoleRoute(loginPage, role);
    await loginContext.storageState({ path: storageStatePath });
  } catch (error) {
    await rm(storageStatePath, { force: true });
    throw error;
  } finally {
    await loginContext.close().catch(() => undefined);
  }

  let context: BrowserContext | undefined;
  try {
    context = await browser.newContext({
      baseURL,
      storageState: storageStatePath,
      viewport,
      isMobile: testInfo.project.name === "mobile",
      hasTouch: testInfo.project.name === "mobile",
    });
    const page = await context.newPage();
    await verifyExpectedRoleRoute(page, role);

    return {
      page,
      close: async () => {
        try {
          await context?.close();
        } finally {
          await rm(storageStatePath, { force: true });
        }
      },
    };
  } catch (error) {
    await context?.close().catch(() => undefined);
    await rm(storageStatePath, { force: true });
    throw error;
  }
}

export async function assertNoServerErrors(page: Page, route: string) {
  const errors: string[] = [];
  const onResponse = (response: { status: () => number; url: () => string }) => {
    if (response.status() >= 500) errors.push(`${response.status()} ${response.url()}`);
  };
  page.on("response", onResponse);
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).not.toBeEmpty();
  expect(errors, `server errors on ${route}`).toEqual([]);
  page.off("response", onResponse);
}
