export type PwaPlatform = "desktop" | "android" | "ios";
export type PwaBrowser = "chrome" | "edge" | "safari" | "other";

export type NavigatorSnapshot = {
  userAgent: string;
  platform?: string;
  maxTouchPoints?: number;
  standalone?: boolean;
};

export type PwaEnvironment = {
  platform: PwaPlatform;
  browser: PwaBrowser;
  isStandalone: boolean;
};

export type InstallUiState = {
  status: "installed" | "ready" | "manual";
  showInstallButton: boolean;
};

export function isPwaInstalled({
  isStandalone,
  storedInstalled,
}: {
  isStandalone: boolean;
  storedInstalled: boolean;
}) {
  return isStandalone || storedInstalled;
}

export function detectPwaEnvironment(
  navigatorSnapshot: NavigatorSnapshot,
  displayModeStandalone: boolean,
): PwaEnvironment {
  const userAgent = navigatorSnapshot.userAgent;
  const isIPadOs =
    navigatorSnapshot.platform === "MacIntel" &&
    (navigatorSnapshot.maxTouchPoints ?? 0) > 1;
  const isIos = /iPhone|iPad|iPod/i.test(userAgent) || isIPadOs;
  const isAndroid = /Android/i.test(userAgent);

  let browser: PwaBrowser = "other";
  if (/EdgA?\//i.test(userAgent)) {
    browser = "edge";
  } else if (/CriOS|Chrome\//i.test(userAgent)) {
    browser = "chrome";
  } else if (/Safari\//i.test(userAgent)) {
    browser = "safari";
  }

  return {
    platform: isIos ? "ios" : isAndroid ? "android" : "desktop",
    browser,
    isStandalone:
      displayModeStandalone || navigatorSnapshot.standalone === true,
  };
}

export function getInstallUiState({
  isStandalone,
  promptAvailable,
  platform = "desktop",
}: {
  isStandalone: boolean;
  promptAvailable: boolean;
  platform?: PwaPlatform;
}): InstallUiState {
  if (isStandalone) {
    return { status: "installed", showInstallButton: false };
  }

  if (platform !== "ios" && promptAvailable) {
    return { status: "ready", showInstallButton: true };
  }

  return { status: "manual", showInstallButton: false };
}

export function readCurrentPwaEnvironment(): PwaEnvironment {
  return detectPwaEnvironment(
    navigator as NavigatorSnapshot,
    window.matchMedia("(display-mode: standalone)").matches,
  );
}
