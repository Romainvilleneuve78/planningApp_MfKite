"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      (window.navigator as { standalone?: boolean }).standalone === true)
  );
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showAndroid, setShowAndroid] = useState(false);
  const [showIOS, setShowIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed or dismissed this session
    if (isInStandaloneMode()) return;
    if (sessionStorage.getItem("pwa-prompt-dismissed")) return;

    if (isIOS()) {
      // Show iOS instruction after a short delay
      const timer = setTimeout(() => setShowIOS(true), 3000);
      return () => clearTimeout(timer);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowAndroid(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    setShowAndroid(false);
    setShowIOS(false);
    setDismissed(true);
    sessionStorage.setItem("pwa-prompt-dismissed", "1");
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowAndroid(false);
      setDeferredPrompt(null);
    }
  }

  if (dismissed || (!showAndroid && !showIOS)) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl shadow-black/10 border border-gray-100 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-indigo-200">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Installer Mon Planning</p>
            {showAndroid && (
              <p className="text-xs text-gray-400 mt-0.5">
                Accédez rapidement depuis votre écran d&apos;accueil.
              </p>
            )}
            {showIOS && (
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                Appuyez sur{" "}
                <svg className="inline w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>{" "}
                puis <strong>Sur l&apos;écran d&apos;accueil</strong>.
              </p>
            )}
          </div>
          <button
            onClick={dismiss}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {showAndroid && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={dismiss}
              className="flex-1 py-2 rounded-xl text-xs font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              Plus tard
            </button>
            <button
              onClick={handleInstall}
              className="flex-1 py-2 rounded-xl text-xs font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 shadow-md shadow-indigo-200 hover:shadow-indigo-300 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Installer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
