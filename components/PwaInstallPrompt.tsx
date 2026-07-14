"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      if (!dismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Service worker registration failed:", error);
      });
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setIsVisible(false);
    setDeferredPrompt(null);
    if (outcome === "accepted") {
      localStorage.setItem("pwa-install-dismissed", "true");
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed right-4 left-4 z-[60] rounded-card border border-border bg-surface p-4 shadow-lg bottom-[calc(72px+env(safe-area-inset-bottom))] md:bottom-4 md:right-4 md:left-auto md:w-96">
      <p className="text-sm font-medium text-fg">
        Install Hidden Champions
      </p>
      <p className="mt-1 text-sm text-muted">
        Install for faster uploads and notifications when new requests match
        your specialties.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleInstall}
          className="flex-1 btn-primary px-3 py-2 text-sm"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="flex-1 btn-outline px-3 py-2 text-sm"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
