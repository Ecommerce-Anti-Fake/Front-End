import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getInstallUiState,
  readCurrentPwaEnvironment,
  type PwaEnvironment,
} from "../services/pwa-install";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const getEnvironment = (): PwaEnvironment => readCurrentPwaEnvironment();

export function usePwaInstall() {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [environment, setEnvironment] = useState(getEnvironment);
  const [promptAvailable, setPromptAvailable] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(environment.isStandalone);

  useEffect(() => {
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const syncEnvironment = () => setEnvironment(getEnvironment());
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferredPrompt.current = event as BeforeInstallPromptEvent;
      setPromptAvailable(true);
    };
    const handleInstalled = () => {
      deferredPrompt.current = null;
      setPromptAvailable(false);
      setInstalled(true);
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
