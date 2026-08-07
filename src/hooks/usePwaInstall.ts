import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getInstallUiState,
  isPwaInstalled,
  readCurrentPwaEnvironment,
  type PwaEnvironment,
} from "../services/pwa-install";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const PWA_INSTALLED_KEY = "antifake.pwaInstalled";
const PWA_INSTALL_STATUS_EVENT = "antifake:pwa-install-status";

function readStoredInstalled() {
  try {
    return localStorage.getItem(PWA_INSTALLED_KEY) === "true";
  } catch {
    return false;
  }
}

function persistInstalled(installed: boolean) {
  try {
    if (installed) {
      localStorage.setItem(PWA_INSTALLED_KEY, "true");
    } else {
      localStorage.removeItem(PWA_INSTALLED_KEY);
    }
  } catch {
    // Standalone detection still works when storage is unavailable.
  }
  window.dispatchEvent(new Event(PWA_INSTALL_STATUS_EVENT));
}

const getEnvironment = (): PwaEnvironment => readCurrentPwaEnvironment();

export function usePwaInstall() {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [environment, setEnvironment] = useState(getEnvironment);
  const [promptAvailable, setPromptAvailable] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(() =>
    isPwaInstalled({
      isStandalone: environment.isStandalone,
      storedInstalled: readStoredInstalled(),
    }),
  );

  useEffect(() => {
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const syncEnvironment = () => setEnvironment(getEnvironment());
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferredPrompt.current = event as BeforeInstallPromptEvent;
      setPromptAvailable(true);
      setInstalled(false);
      persistInstalled(false);
    };
    const handleInstalled = () => {
      deferredPrompt.current = null;
      setPromptAvailable(false);
      setInstalled(true);
      persistInstalled(true);
    };

    displayMode.addEventListener("change", syncEnvironment);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      displayMode.removeEventListener("change", syncEnvironment);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    const event = deferredPrompt.current;
    if (!event || environment.platform === "ios") return "unavailable" as const;

    setInstalling(true);
    try {
      await event.prompt();
      const { outcome } = await event.userChoice;
      deferredPrompt.current = null;
      setPromptAvailable(false);
      if (outcome === "accepted") {
        setInstalled(true);
        persistInstalled(true);
      }
      return outcome;
    } finally {
      setInstalling(false);
    }
  }, [environment.platform]);

  const uiState = useMemo(
    () =>
      getInstallUiState({
        isStandalone: environment.isStandalone || installed,
        platform: environment.platform,
        promptAvailable,
      }),
    [environment, installed, promptAvailable],
  );

  return { environment, uiState, installing, install };
}

export function usePwaInstalledStatus() {
  const readInstalled = () => {
    const environment = getEnvironment();
    return isPwaInstalled({
      isStandalone: environment.isStandalone,
      storedInstalled: readStoredInstalled(),
    });
  };
  const [installed, setInstalled] = useState(readInstalled);

  useEffect(() => {
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const syncInstalled = () => setInstalled(readInstalled());
    const handleInstalled = () => {
      persistInstalled(true);
      setInstalled(true);
    };
    const handleInstallAvailable = () => {
      persistInstalled(false);
      setInstalled(false);
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === PWA_INSTALLED_KEY) syncInstalled();
    };

    if (displayMode.matches) persistInstalled(true);
    displayMode.addEventListener("change", syncInstalled);
    window.addEventListener("appinstalled", handleInstalled);
    window.addEventListener("beforeinstallprompt", handleInstallAvailable);
    window.addEventListener(PWA_INSTALL_STATUS_EVENT, syncInstalled);
    window.addEventListener("storage", handleStorage);

    return () => {
      displayMode.removeEventListener("change", syncInstalled);
      window.removeEventListener("appinstalled", handleInstalled);
      window.removeEventListener("beforeinstallprompt", handleInstallAvailable);
      window.removeEventListener(PWA_INSTALL_STATUS_EVENT, syncInstalled);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return installed;
}
