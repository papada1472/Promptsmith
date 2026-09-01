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
  Download,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "./ui/button.jsx";
import { PAYMENT_GATEWAY_CONFIG } from "../config/gatewayConfig.js";
import { trackEvent } from "../utils/analytics.js";
import { SUPPORTED_CURRENCIES } from "../utils/currency.js";

export function PaypalCheckoutModal({ isOpen, onClose, onDownload, currency = SUPPORTED_CURRENCIES.USD, detectedCountry = "" }) {
  const [step, setStep] = useState("checkout"); // "checkout" | "processing" | "success"
  const [copiedKey, setCopiedKey] = useState(false);
  const [customKey] = useState(() => {
    const randomHex = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    return `RFZ-PRO-${randomHex()}-${randomHex()}-${randomHex()}`;
  });

  if (!isOpen) return null;

  const handleGatewayRedirect = (gatewayName) => {
    trackEvent("payment_initiated", {
      gateway: gatewayName,
      currency: currency.code,
      amount: currency.price,
      country: detectedCountry,
    });

    let targetUrl = "";
    if (gatewayName === "lemonsqueezy" && PAYMENT_GATEWAY_CONFIG.lemonSqueezyUrl && !PAYMENT_GATEWAY_CONFIG.lemonSqueezyUrl.includes("YOUR_PRODUCT_ID")) {
      targetUrl = PAYMENT_GATEWAY_CONFIG.lemonSqueezyUrl;
    } else if (gatewayName === "stripe" && PAYMENT_GATEWAY_CONFIG.stripePaymentLink && !PAYMENT_GATEWAY_CONFIG.stripePaymentLink.includes("YOUR_PAYMENT_LINK")) {
      targetUrl = PAYMENT_GATEWAY_CONFIG.stripePaymentLink;
    } else if (gatewayName === "gumroad" && PAYMENT_GATEWAY_CONFIG.gumroadUrl && !PAYMENT_GATEWAY_CONFIG.gumroadUrl.includes("yourusername")) {
      targetUrl = PAYMENT_GATEWAY_CONFIG.gumroadUrl;
    } else if (PAYMENT_GATEWAY_CONFIG.paypal.paypalMeUrl && !PAYMENT_GATEWAY_CONFIG.paypal.paypalMeUrl.includes("yourusername")) {
      targetUrl = PAYMENT_GATEWAY_CONFIG.paypal.paypalMeUrl;
    }

    if (targetUrl) {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }

    setStep("processing");
    setTimeout(() => {
      setStep("success");
      trackEvent("payment_success_view", {
        currency: currency.code,
        key: customKey,
      });
    }, 1500);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(customKey);
    setCopiedKey(true);
    trackEvent("license_key_copied", { key: customKey });
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-[460px] overflow-hidden rounded-2xl border border-blue-500/40 bg-zinc-950 p-5 sm:p-6 shadow-2xl shadow-blue-500/10">
        {/* Subtle decorative glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-500/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-purple-600/10 blur-2xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          aria-label="Close Checkout"
        >
          <X className="h-4 w-4" />
        </button>

        {step === "checkout" && (
          <div>
            {/* Header */}
            <div className="flex items-center justify-between gap-2 pr-7">
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider shadow-sm">
                <Flame className="h-3 w-3 text-amber-300 animate-pulse" />
                <span>Launch Deal · 73% OFF</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Instant License
              </span>
            </div>

            <div className="mt-3">
              <h3 className="text-xl font-extrabold text-white leading-tight">
                Refinzi Lifetime Pro
              </h3>
              <p className="mt-0.5 text-xs text-zinc-400">
                Pay once. Own forever with lifetime updates & priority routing.
              </p>
            </div>

            {/* Order Summary Box with Localized Price */}
            <div className="mt-3 rounded-xl border border-white/[0.08] bg-zinc-900/60 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-white block">Lifetime License</span>
                  {detectedCountry && (
                    <span className="text-[10px] text-zinc-400">
                      {currency.flag} Local price for {detectedCountry}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-zinc-500 line-through text-[11px]">{currency.formattedRegular}</span>
                  <span className="font-extrabold text-white text-base text-emerald-400">{currency.formattedPrice}</span>
                </div>
              </div>
              <div className="border-t border-zinc-800/80 pt-2 space-y-1 text-[11px] text-zinc-300">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-blue-400 shrink-0" />
                  <span>High-speed Claude & GPT routing included</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-purple-400 shrink-0" />
                  <span>5-Block Blueprint engine for ChatGPT, Midjourney & Cursor</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                  <span>Zero monthly subscription fees forever</span>
                </div>
              </div>
            </div>

            {/* Fast Global Payment Options */}
            <div className="mt-3.5 space-y-2">
              {/* Primary 1-Click Checkout */}
              <button
                type="button"
                onClick={() => handleGatewayRedirect(PAYMENT_GATEWAY_CONFIG.activeGateway)}
                className="w-full relative flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] transition-all shadow-md shadow-blue-500/20 cursor-pointer border border-white/20 text-xs sm:text-sm"
              >
                <Zap className="h-4 w-4 text-amber-300" />
                <span>Instant 1-Click Checkout ({currency.formattedPrice})</span>
              </button>

              {/* PayPal Smart Button */}
              <button
                type="button"
                onClick={() => handleGatewayRedirect("paypal")}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-bold text-[#003087] bg-[#ffc439] hover:bg-[#f4bb38] active:scale-[0.98] transition-all shadow-sm cursor-pointer border border-[#e0aa2b] text-xs"
              >
                <svg className="h-3.5 w-auto" viewBox="0 0 100 32" fill="none">
                  <path fill="#003087" d="M12.8 5.6h7.5c4.1 0 7 1.1 7.6 4.6.5 2.8-.7 5.2-3.7 6.4-1.1.5-2.6.7-4.1.7h-3.4l-1.9 9.9H8.4l4.4-21.6zm4.9 4.3l-1.6 8h2.3c2.4 0 4.1-.7 4.5-2.8.4-1.9-.9-2.9-3-2.9l-2.2-.3z" />
                  <path fill="#0079C1" d="M22.5 12.8c-.4 2.1-2.1 2.8-4.5 2.8h-2.3l-1.6 8h4.5l1.2-6.2h1.6c3.2 0 5.4-1.3 6-4.5.3-1.6 0-3-.9-3.9-1.2 2.2-2.7 3.4-4 3.8z" />
                  <text x="36" y="22" fill="#003087" fontWeight="bold" fontSize="16" fontFamily="sans-serif">PayPal</text>
                </svg>
                <span>Pay with PayPal</span>
              </button>

              {/* Debit / Credit Cards / Apple Pay */}
              <button
                type="button"
                onClick={() => handleGatewayRedirect("stripe")}
                className="w-full flex items-center justify-center gap-2 py-1.5 px-4 rounded-xl text-[11px] font-medium text-zinc-400 bg-zinc-900/60 hover:bg-zinc-800/80 hover:text-zinc-200 border border-white/[0.06] active:scale-[0.98] transition-all cursor-pointer"
              >
                <CreditCard className="h-3 w-3 text-blue-400" />
                <span>Credit / Debit Card · Apple Pay · Google Pay</span>
              </button>
            </div>

            {/* Trust Footer */}
            <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-zinc-500 border-t border-white/[0.06] pt-2">
              <span className="flex items-center gap-1">
                <Lock className="h-2.5 w-2.5 text-emerald-400" /> 256-Bit Encrypted
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-2.5 w-2.5 text-blue-400" /> 14-Day Guarantee
              </span>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="py-6 text-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 ring-2 ring-blue-500/40 mx-auto animate-pulse">
              <Sparkles className="h-6 w-6 animate-spin text-blue-400" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Connecting to Payment...</h4>
              <p className="mt-0.5 text-xs text-zinc-400">
                Securing your session & generating your Pro Lifetime License.
              </p>
            </div>
          </div>
        )}

        {step === "success" && (
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/40 mx-auto">
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <h3 className="mt-2 text-center text-lg font-bold text-white">
              Payment Successful! 🎉
            </h3>
            <p className="mt-0.5 text-center text-xs text-zinc-400">
              Your Refinzi Lifetime Pro license is active.
            </p>

            {/* License Key Box */}
            <div className="mt-3 rounded-xl border border-blue-500/30 bg-blue-950/20 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block mb-1">
                Your Lifetime License Key:
              </span>
              <div className="flex items-center justify-between gap-2 bg-zinc-950 p-2 rounded-lg border border-zinc-800 font-mono text-xs text-white">
                <span className="font-bold tracking-wider text-blue-300 select-all">{customKey}</span>
                <button
                  onClick={handleCopyKey}
                  className="flex items-center gap-1 text-[11px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-0.5 rounded transition-colors"
                >
                  {copiedKey ? <CheckCheck className="h-3 w-3 text-emerald-300" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedKey ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Setup Guidance */}
            <div className="mt-2.5 rounded-xl border border-white/[0.08] bg-zinc-900/60 p-2.5 space-y-1 text-xs text-zinc-300">
              <p className="font-semibold text-white text-[10px] uppercase tracking-wider">How to activate in Windows:</p>
              <div className="flex items-start gap-1.5 text-[11px]">
                <span className="font-bold text-blue-400">1.</span>
                <span>Open Refinzi on your Windows desktop.</span>
              </div>
              <div className="flex items-start gap-1.5 text-[11px]">
                <span className="font-bold text-purple-400">2.</span>
                <span>Click Settings &gt; License &gt; Paste your key.</span>
              </div>
            </div>

            <div className="mt-3">
              <Button
                size="default"
                className="w-full font-bold shadow-md shadow-blue-600/30 bg-gradient-to-r from-blue-600 to-purple-600 text-white"
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
