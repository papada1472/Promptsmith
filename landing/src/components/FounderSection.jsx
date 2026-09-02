import React from "react";
import { ShieldCheck, Heart, Github, Mail, Sparkles, Terminal, Calendar, Phone, ExternalLink } from "lucide-react";
import { Reveal } from "./Reveal.jsx";

const CAL_LINK = "https://cal.com/rahul-mangla-ub8se9/30min";
const WHATSAPP_URL = "https://wa.me/919971271291?text=Hi%20Rahul,%20I'm%20reaching%20out%20about%20Refinzi!";
const WHATSAPP_NUMBER = "+91-9971271291";

export function FounderSection() {
  const handleOpenCal = () => {
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
    <section className="py-12 sm:py-16 border-t border-white/[0.06] bg-zinc-950/40" id="founder">
      <div className="mx-auto max-w-[860px] px-4 sm:px-6">
        <Reveal>
          <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-b from-blue-950/20 to-zinc-950 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="pointer-events-none absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-blue-600/10 blur-3xl" />

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 text-center sm:text-left">
              {/* Founder Avatar with subtle ring */}
              <div className="relative shrink-0">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-0.5 shadow-lg shadow-blue-500/20">
                  <div className="h-full w-full rounded-2xl bg-zinc-950 flex flex-col items-center justify-center text-2xl font-bold text-white overflow-hidden">
                    <span className="text-3xl select-none">👨‍💻</span>
                  </div>
                </div>
                <div className="absolute -bottom-1.5 -right-1.5 rounded-full bg-emerald-500 p-1 ring-2 ring-zinc-950">
                  <ShieldCheck className="h-3 w-3 text-zinc-950" />
                </div>
              </div>

              {/* Story Content */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center justify-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-white">Rahul Mangla</h3>
                    <p className="text-xs text-blue-400 font-medium">Creator & Lead Architect of Refinzi</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <a
                      href="https://github.com/papada1472/refinzi"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="GitHub Repository (opens in a new tab)"
                      aria-label="GitHub Repository (opens in a new tab)"
                      className="min-h-[44px] inline-flex items-center gap-1.5 text-xs font-mono text-zinc-200 hover:text-white bg-zinc-900 border border-white/10 px-3 py-2 rounded-xl transition-colors touch-manipulation"
                    >
                      <Github className="h-3.5 w-3.5" />
                      <span>GitHub</span>
                    </a>
                    <a
                      href="mailto:contact@refinzi.com"
                      className="min-h-[44px] inline-flex items-center gap-1.5 text-xs font-mono text-zinc-200 hover:text-white bg-zinc-900 border border-white/10 px-3 py-2 rounded-xl transition-colors touch-manipulation"
                    >
                      <Mail className="h-3.5 w-3.5 text-blue-400" />
                      <span>contact@refinzi.com</span>
                    </a>
                  </div>
                </div>

                <p className="text-sm sm:text-base text-zinc-100 font-medium italic leading-relaxed">
                  "I was re-prompting ChatGPT 10 times for every email. Re-rolling Midjourney 20 times per image. I built Refinzi so I'd never have to context-switch again. One click. Perfect output. Every time."
                </p>
                <p className="text-xs text-blue-300 font-semibold">
                  — Rahul Mangla, Founder
                </p>

                {/* Direct Action Hub for Founder */}
                <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <button
                    type="button"
                    onClick={handleOpenCal}
                    className="min-h-[44px] inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer touch-manipulation"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Book 30-Min Call with Rahul</span>
                  </button>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 px-4 py-2.5 rounded-xl transition-all cursor-pointer touch-manipulation"
                  >
                    <Phone className="h-4 w-4 text-emerald-400" />
                    <span>WhatsApp {WHATSAPP_NUMBER}</span>
                  </a>
                </div>

                {/* Guarantee Note */}
                <div className="pt-1 flex items-center justify-center sm:justify-start gap-2 text-xs text-emerald-400 font-medium">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>Personal 14-Day Money-Back Guarantee on all Pro orders</span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default FounderSection;
