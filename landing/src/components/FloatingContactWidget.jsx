import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  X,
  Phone,
  Calendar,
  Mail,
  Sparkles,
  ExternalLink,
  ChevronUp,
} from "lucide-react";
import { trackEvent } from "../utils/analytics.js";

const CAL_LINK = "https://cal.com/rahul-mangla-ub8se9/30min";
const WHATSAPP_URL = "https://wa.me/919971271291?text=Hi%20Rahul,%20I'm%20reaching%20out%20about%20Refinzi!";
const WHATSAPP_DISPLAY = "+91-9971271291";
const CONTACT_EMAIL = "contact@refinzi.com";

export function FloatingContactWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const widgetRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleOpenCal = () => {
    trackEvent("cal_booking_clicked", { source: "floating_widget" });
    setIsOpen(false);
    if (typeof window !== "undefined" && window.Cal) {
      try {
        window.Cal.ns["30min"]("modal", {
          calLink: "rahul-mangla-ub8se9/30min",
          config: { layout: "month_view", useSlotsViewOnSmallScreen: "true" },
        });
        return;
      } catch (_) {}
    }
    window.open(CAL_LINK, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      ref={widgetRef}
      className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-40 flex flex-col items-end"
    >
      {/* Speed Dial Menu */}
      {isOpen && (
        <div className="mb-3 w-72 rounded-2xl border border-white/[0.1] bg-[#0c0e14]/95 p-3.5 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-2 duration-150 space-y-2 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] px-1">
            <div className="flex items-center gap-1.5 text-white font-bold">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Reach Out to Rahul Directly</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-zinc-400 hover:text-white p-1 rounded-md transition-colors"
              aria-label="Close contact menu"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Action 1: WhatsApp */}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackEvent("whatsapp_clicked", { source: "floating_widget" });
              setIsOpen(false);
            }}
            className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/30 hover:bg-emerald-950/60 border border-emerald-500/20 hover:border-emerald-500/40 text-white transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-white group-hover:text-emerald-300">WhatsApp Chat</p>
                <p className="text-[10px] text-zinc-400 font-mono">{WHATSAPP_DISPLAY}</p>
              </div>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-emerald-400 opacity-60 group-hover:opacity-100 transition-opacity" />
          </a>

          {/* Action 2: Cal.com 30-Min Call */}
          <button
            type="button"
            onClick={handleOpenCal}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-blue-950/30 hover:bg-blue-950/60 border border-blue-500/20 hover:border-blue-500/40 text-white transition-all group cursor-pointer text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 shrink-0">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-white group-hover:text-blue-300">Book 30-Min Call</p>
                <p className="text-[10px] text-zinc-400">1-on-1 strategy & feedback</p>
              </div>
            </div>
            <Sparkles className="h-3.5 w-3.5 text-blue-400 opacity-60 group-hover:opacity-100 transition-opacity" />
          </button>

          {/* Action 3: Email */}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            onClick={() => {
              trackEvent("email_contact_clicked", { source: "floating_widget" });
              setIsOpen(false);
            }}
            className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/[0.06] text-white transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400 shrink-0">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-white group-hover:text-purple-300">Send Email</p>
                <p className="text-[10px] text-zinc-400 font-mono">{CONTACT_EMAIL}</p>
              </div>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-zinc-400 opacity-60 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          if (!isOpen) trackEvent("floating_contact_widget_opened");
        }}
        aria-label="Open contact and feedback channels"
        className="group flex min-h-[48px] items-center gap-2 rounded-full border border-blue-500/30 bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-white shadow-xl shadow-blue-500/20 backdrop-blur-md transition-all hover:scale-105 hover:shadow-blue-500/30 active:scale-95 cursor-pointer touch-manipulation"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <MessageCircle className="h-4 w-4" />
        <span className="text-xs font-bold hidden sm:inline">Contact / Book Call</span>
      </button>
    </div>
  );
}

export default FloatingContactWidget;
