import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Copy,
  CheckCheck,
  CreditCard,
  Flame,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Button } from "./ui/button.jsx";
import { PAYPAL_CONFIG } from "../config/paypal.js";

export function PaypalCheckoutModal({ isOpen, onClose, onDownload }) {
  const [step, setStep] = useState("checkout"); // "checkout" | "processing" | "success"
  const [copiedKey, setCopiedKey] = useState(false);
  const [customKey] = useState(() => {
    const randomHex = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    return `RFZ-PRO-${randomHex()}-${randomHex()}-${randomHex()}`;
  });

  if (!isOpen) return null;

  const handlePaypalSubmit = (e) => {
    if (e) e.preventDefault();

    // If a custom PayPal link or PayPal.me is configured, open it
    if (PAYPAL_CONFIG.paypalMeUrl && !PAYPAL_CONFIG.paypalMeUrl.includes("yourusername")) {
      window.open(PAYPAL_CONFIG.paypalMeUrl, "_blank", "noopener,noreferrer");
    }

    setStep("processing");

    setTimeout(() => {
      setStep("success");
    }, 1800);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(customKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-[490px] overflow-hidden rounded-2xl border border-blue-500/60 bg-zinc-950 p-5 sm:p-6 shadow-2xl shadow-blue-500/20">
        {/* Subtle decorative glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-500/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-purple-600/15 blur-2xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          aria-label="Close PayPal Checkout"
        >
          <X className="h-4 w-4" />
        </button>

        {step === "checkout" && (
          <div>
            {/* Header */}
            <div className="flex items-center justify-between gap-2 pr-7">
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-wider shadow-sm">
                <Flame className="h-3 w-3 text-amber-300 animate-pulse" />
                <span>Launch Deal · 73% OFF</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                🔒 PayPal Verified
              </span>
            </div>

            <div className="mt-3.5">
              <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                Complete Your Lifetime Access
              </h3>
              <p className="mt-1 text-xs text-zinc-300">
                Pay once via PayPal or Card. Own Refinzi Pro forever with unlimited updates.
              </p>
            </div>

            {/* Order Summary Box */}
            <div className="mt-3.5 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Refinzi 2.0 Lifetime Pro License</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-500 line-through text-[11px]">$79.00</span>
                  <span className="font-extrabold text-white text-base">$19.00</span>
                </div>
              </div>
              <div className="border-t border-zinc-800/80 pt-2 space-y-1 text-[11px] text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-blue-400" />
                  <span>High-speed Claude 3.5 & GPT-4o routing included</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-purple-400" />
                  <span>All 5-Block Blueprint exports for Midjourney, Higgsfield & Cursor</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  <span>Zero monthly subscription fees forever</span>
                </div>
              </div>
            </div>

            {/* PayPal Checkout Button Area */}
            <div className="mt-4 space-y-2.5">
              {/* PayPal Official Yellow Smart Button */}
              <button
                type="button"
                onClick={handlePaypalSubmit}
                className="w-full relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-extrabold text-[#003087] bg-[#ffc439] hover:bg-[#f4bb38] active:scale-[0.98] transition-all shadow-md cursor-pointer border border-[#e0aa2b]"
              >
                <svg className="h-5 w-auto" viewBox="0 0 100 32" fill="none">
                  <path fill="#003087" d="M12.8 5.6h7.5c4.1 0 7 1.1 7.6 4.6.5 2.8-.7 5.2-3.7 6.4-1.1.5-2.6.7-4.1.7h-3.4l-1.9 9.9H8.4l4.4-21.6zm4.9 4.3l-1.6 8h2.3c2.4 0 4.1-.7 4.5-2.8.4-1.9-.9-2.9-3-2.9l-2.2-.3z" />
                  <path fill="#0079C1" d="M22.5 12.8c-.4 2.1-2.1 2.8-4.5 2.8h-2.3l-1.6 8h4.5l1.2-6.2h1.6c3.2 0 5.4-1.3 6-4.5.3-1.6 0-3-.9-3.9-1.2 2.2-2.7 3.4-4 3.8z" />
                  <text x="36" y="22" fill="#003087" fontWeight="bold" fontSize="16" fontFamily="sans-serif">PayPal</text>
                </svg>
                <span className="text-sm font-bold text-slate-900">Checkout ($19)</span>
              </button>

              {/* Debit / Credit Card via PayPal */}
              <button
                type="button"
                onClick={handlePaypalSubmit}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 active:scale-[0.98] transition-all cursor-pointer"
              >
                <CreditCard className="h-3.5 w-3.5 text-blue-400" />
                <span>Pay with Debit or Credit Card</span>
              </button>
            </div>

            {/* Trust Footer */}
            <div className="mt-3.5 flex items-center justify-center gap-3 text-[10px] text-zinc-400 border-t border-zinc-800/80 pt-2.5">
              <span className="flex items-center gap-1">
                <Lock className="h-2.5 w-2.5 text-emerald-400" /> 256-Bit SSL Encryption
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-2.5 w-2.5 text-blue-400" /> 14-Day Guarantee
              </span>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="py-8 text-center space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 ring-2 ring-blue-500/40 mx-auto animate-pulse">
              <Sparkles className="h-7 w-7 animate-spin text-blue-400" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">Connecting to PayPal...</h4>
              <p className="mt-1 text-xs text-zinc-400">
                Securing your payment session & generating your Pro License Key.
              </p>
            </div>
          </div>
        )}

        {step === "success" && (
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/40 mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>

            <h3 className="mt-3 text-center text-xl font-bold text-white">
              Payment Successful! 🎉
            </h3>
            <p className="mt-1 text-center text-xs text-zinc-300">
              Your Refinzi Lifetime Pro license is now active.
            </p>

            {/* License Key Box */}
            <div className="mt-4 rounded-xl border border-blue-500/40 bg-blue-950/30 p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block mb-1">
                Your Lifetime License Key:
              </span>
              <div className="flex items-center justify-between gap-2 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 font-mono text-xs text-white">
                <span className="font-bold tracking-wider text-blue-300 select-all">{customKey}</span>
                <button
                  onClick={handleCopyKey}
                  className="flex items-center gap-1 text-[11px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded transition-colors"
                >
                  {copiedKey ? <CheckCheck className="h-3 w-3 text-emerald-300" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedKey ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Setup Guidance */}
            <div className="mt-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 space-y-1.5 text-xs text-zinc-300">
              <p className="font-semibold text-white text-[11px] uppercase tracking-wider">How to activate in Windows:</p>
              <div className="flex items-start gap-2 text-[11px]">
                <span className="font-bold text-blue-400">1.</span>
                <span>Open Refinzi on your Windows desktop.</span>
              </div>
              <div className="flex items-start gap-2 text-[11px]">
                <span className="font-bold text-purple-400">2.</span>
                <span>Click Settings &gt; License &gt; Paste your key.</span>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <Button
                size="default"
                className="w-full font-bold shadow-glow-blue-soft bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                onClick={() => {
                  onDownload();
                  onClose();
                }}
              >
                <Download className="h-4 w-4 mr-1.5" />
                Download Refinzi Pro Installer (.exe)
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaypalCheckoutModal;
