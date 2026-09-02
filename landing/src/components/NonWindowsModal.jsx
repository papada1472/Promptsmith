import React, { useState } from "react";
import { X, Apple, Smartphone, Check, Send, Download, Sparkles } from "lucide-react";
import { Button } from "./ui/button.jsx";
import { trackEvent } from "../utils/analytics.js";

export function NonWindowsModal({ isOpen, onClose, osType = "mac", onDownloadWindowsAnyway }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const isMac = osType === "mac";
  const isMobile = osType === "ios" || osType === "android";
  const isLinux = osType === "linux";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    setLoading(true);
    trackEvent("non_windows_capture", { os: osType, email });

    // Store in localStorage for persistence
    try {
      const waitlist = JSON.parse(localStorage.getItem("refinzi_waitlist") || "[]");
      waitlist.push({ email, os: osType, timestamp: new Date().toISOString() });
      localStorage.setItem("refinzi_waitlist", JSON.stringify(waitlist));
    } catch (_) {}

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-[440px] overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950 p-5 sm:p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        {!submitted ? (
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20 mb-3.5">
              {isMac ? (
                <Apple className="h-5 w-5" />
              ) : isMobile ? (
                <Smartphone className="h-5 w-5" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
            </div>

            <h3 className="text-xl font-bold text-white tracking-tight">
              {isMac
                ? "Refinzi for macOS is coming soon!"
                : isMobile
                ? "Get the Windows download link on your PC"
                : "Refinzi for Linux is in development"}
            </h3>

            <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
              {isMac
                ? "Refinzi 2.0 is currently native on Windows 10 & 11. Drop your email to join the VIP macOS waitlist and get early access."
                : isMobile
                ? "Send the direct Windows installer (.exe) link to your inbox so you can set it up when you're back at your desk."
                : "Join the Linux preview list and get notified the moment builds are available."}
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-2.5">
              <div className="relative">
                <label htmlFor="waitlist-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="waitlist-email"
                  name="email"
                  type="email"
                  required
                  aria-label="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full rounded-xl border border-white/[0.1] bg-zinc-900/80 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <Button
                type="submit"
                size="default"
                variant="primary"
                disabled={loading}
                className="w-full font-bold py-2.5"
              >
                <Send className="h-3.5 w-3.5 mr-1" />
                {loading
                  ? "Saving..."
                  : isMac
                  ? "Get Notified for Mac 🍏"
                  : isMobile
                  ? "Email Me the Download Link 📲"
                  : "Join Linux Waitlist"}
              </Button>
            </form>

            <div className="mt-4 border-t border-white/[0.06] pt-3 text-center">
              <p className="text-[11px] text-zinc-500">
                On a Windows PC right now?{" "}
                <button
                  type="button"
                  onClick={() => {
                    onDownloadWindowsAnyway();
                    onClose();
                  }}
                  className="text-blue-400 underline hover:text-blue-300 font-medium"
                >
                  Download Windows (.exe) anyway
                </button>
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-3 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/30 mx-auto">
              <Check className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">You're on the list! 🎉</h4>
              <p className="mt-1 text-xs text-zinc-400">
                We've noted <span className="text-blue-300 font-medium">{email}</span>. You'll receive updates as soon as builds drop.
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={onClose} className="mt-2 w-full">
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default NonWindowsModal;
