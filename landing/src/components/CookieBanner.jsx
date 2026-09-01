import React, { useState, useEffect } from "react";
import { ShieldCheck, X } from "lucide-react";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const consent = localStorage.getItem("refinzi_cookie_consent");
      if (!consent) {
        setIsVisible(true);
      }
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("refinzi_cookie_consent", "accepted");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:max-w-md z-50 rounded-2xl border border-white/10 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-xl text-xs text-zinc-300 transition-all animate-fade-in">
      <div className="flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1">
          <p className="font-bold text-white text-xs">Local-First & Privacy Guaranteed</p>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Refinzi uses local storage and essential cookies to remember your theme & currency preferences. Zero prompt tracking or telemetry.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handleAccept}
              className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] transition-colors cursor-pointer"
            >
              Got it
            </button>
            <a
              href="/privacy/"
              className="text-[11px] text-zinc-400 hover:text-white underline"
            >
              Privacy Policy
            </a>
          </div>
        </div>
        <button
          onClick={handleAccept}
          className="text-zinc-500 hover:text-white transition-colors"
          aria-label="Close cookie banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default CookieBanner;
