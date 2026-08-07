import test from "node:test";
import assert from "node:assert/strict";
import {
  detectPwaEnvironment,
  getInstallUiState,
  isPwaInstalled,
} from "../src/services/pwa-install.ts";
import { PWA_NAVIGATION_FALLBACK_DENYLIST } from "../src/services/pwa-navigation.ts";

const desktopChrome = {
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36",
  platform: "Win32",
  maxTouchPoints: 0,
};

test("detects desktop Chrome without relying on user agent for standalone", () => {
  const environment = detectPwaEnvironment(desktopChrome, false);

  assert.equal(environment.platform, "desktop");
  assert.equal(environment.browser, "chrome");
  assert.equal(environment.isStandalone, false);
});

test("detects Edge before Chrome because both use Chromium", () => {
  const environment = detectPwaEnvironment(
    { ...desktopChrome, userAgent: `${desktopChrome.userAgent} Edg/140.0.0.0` },
    false,
  );

  assert.equal(environment.browser, "edge");
});

test("detects Android Chrome", () => {
  const environment = detectPwaEnvironment(
    {
      userAgent:
        "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36",
      platform: "Linux armv8l",
      maxTouchPoints: 5,
    },
    false,
  );

  assert.equal(environment.platform, "android");
  assert.equal(environment.browser, "chrome");
});

test("detects iPadOS desktop user agent using touch capability", () => {
  const environment = detectPwaEnvironment(
    {
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15",
      platform: "MacIntel",
      maxTouchPoints: 5,
    },
    false,
  );

  assert.equal(environment.platform, "ios");
  assert.equal(environment.browser, "safari");
});

test("installed state hides the install action", () => {
  assert.deepEqual(
    getInstallUiState({ isStandalone: true, promptAvailable: true }),
    { status: "installed", showInstallButton: false },
  );
});

test("installed state can be restored outside standalone mode", () => {
  assert.equal(
    isPwaInstalled({ isStandalone: false, storedInstalled: true }),
    true,
  );
  assert.equal(
    isPwaInstalled({ isStandalone: false, storedInstalled: false }),
    false,
  );
});

test("iOS uses Safari fallback instead of a fake install button", () => {
  assert.deepEqual(
    getInstallUiState({
      isStandalone: false,
      promptAvailable: false,
      platform: "ios",
    }),
    { status: "manual", showInstallButton: false },
  );
});

test("supported browser only shows action after beforeinstallprompt", () => {
  assert.deepEqual(
    getInstallUiState({
      isStandalone: false,
      promptAvailable: true,
      platform: "desktop",
    }),
    { status: "ready", showInstallButton: true },
  );
});

test("service worker never serves the SPA fallback for Firebase auth handlers", () => {
  const isDenied = (path) =>
    PWA_NAVIGATION_FALLBACK_DENYLIST.some((pattern) => pattern.test(path));

  assert.equal(isDenied("/__/auth/handler"), true);
  assert.equal(isDenied("/__/auth/iframe"), true);
  assert.equal(isDenied("/__/auth"), true);
  assert.equal(isDenied("/auth"), false);
});
