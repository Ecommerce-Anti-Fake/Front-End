import type { PwaPlatform } from "./pwa-install";

export function shouldUseGoogleRedirect(platform: PwaPlatform) {
  return platform === "android" || platform === "ios";
}
