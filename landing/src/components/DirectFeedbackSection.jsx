import React, { useState } from "react";
import { Lightbulb, Phone, Calendar, Send, CheckCircle2, Sparkles, ExternalLink, MessageSquare } from "lucide-react";
import { Reveal } from "./Reveal.jsx";
import { Badge } from "./ui/badge.jsx";

const CAL_LINK = "https://cal.com/rahul-mangla-ub8se9/30min";
const WHATSAPP_URL = "https://wa.me/919971271291?text=Hi%20Rahul,%20I'm%20reaching%20out%20about%20Refinzi!";
const WHATSAPP_NUMBER = "+91-9971271291";

export function DirectFeedbackSection() {
  const [feedbackType, setFeedbackType] = useState("feature");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setIsSubmitting(true);

    const payload = {
      _subject: `[Refinzi Feedback] ${feedbackType.toUpperCase()} - ${new Date().toLocaleDateString()}`,
      category: feedbackType.toUpperCase(),
      message: message.trim(),
      email: email.trim() || "Anonymous",
      submittedAt: new Date().toLocaleString(),
      _template: "table",
      _captcha: "false"
    };

    try {
      await fetch("https://formsubmit.co/ajax/contact@refinzi.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });
    } catch (_) {}

    try {
      const existing = JSON.parse(localStorage.getItem("refinzi_user_feedback") || "[]");
      existing.push(payload);
      localStorage.setItem("refinzi_user_feedback", JSON.stringify(existing));
    } catch (_) {}

    setIsSubmitting(false);
    setSubmitted(true);
    setTimeout(() => {
      setMessage("");
      setSubmitted(false);
    }, 3500);
  };

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
    <section className="py-10 sm:py-14 border-t border-white/[0.06] bg-zinc-950/40 relative overflow-hidden" id="feedback">
      <div className="mx-auto max-w-[1140px] px-4 sm:px-6">
        <Reveal>
          <div className="text-center max-w-lg mx-auto">
            <Badge variant="outline" className="text-blue-400 border-blue-500/30 bg-blue-950/20 text-[11px]">
              ⚡ Direct Line
            </Badge>
            <h2 className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-white">
              Direct Feedback & Founder Channels
            </h2>
            <p className="mt-1 text-zinc-400 text-xs">
              We ship weekly. Tell us what to build or connect with the architect directly.
            </p>
          </div>
        </Reveal>

        {/* 3-Block Matching Grid */}
        <div className="mt-7 grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          
          {/* Block 1: Fast Direct Feedback Form */}
          <Reveal delay={0}>
            <div className="luxury-surface rounded-2xl p-4 sm:p-5 border border-white/[0.08] hover:border-blue-500/30 transition-all flex flex-col justify-between h-full group">
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                      <Lightbulb className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-bold text-white">Send Direct Idea</span>
                  </div>
                  <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-full">
                    Instant
                  </span>
                </div>

                {/* Category Pills */}
                <div className="mt-3 flex gap-1">
                  <button
                    type="button"
                    onClick={() => setFeedbackType("feature")}
                    className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                      feedbackType === "feature"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    💡 Feature
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackType("bug")}
                    className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                      feedbackType === "bug"
                        ? "bg-purple-600 text-white shadow-sm"
                        : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    🐛 Bug
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackType("general")}
                    className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                      feedbackType === "general"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    💬 Idea
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-2.5 space-y-2">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={2}
                    placeholder={
                      feedbackType === "feature"
                        ? "What would make Refinzi 10x better for you?"
                        : feedbackType === "bug"
                        ? "What went wrong? Tell us..."
                        : "Share any setup or feature ideas..."
                    }
                    className="w-full rounded-xl bg-zinc-950/80 border border-white/[0.08] p-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none font-sans"
                    required
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email (optional, for reply)"
                    className="w-full rounded-xl bg-zinc-950/80 border border-white/[0.08] px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-blue-500/50 focus:outline-none font-sans"
                  />

                  <button
                    type="submit"
                    disabled={isSubmitting || submitted || !message.trim()}
                    className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      submitted
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-md shadow-blue-500/20 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    }`}
                  >
                    {submitted ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        <span>Received! Thank you.</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-3 w-3" />
                        <span>{isSubmitting ? "Sending..." : "Submit to Engineering"}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </Reveal>

          {/* Block 2: WhatsApp Instant Line */}
          <Reveal delay={70}>
            <div className="luxury-surface rounded-2xl p-4 sm:p-5 border border-white/[0.08] hover:border-emerald-500/30 transition-all flex flex-col justify-between h-full group">
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                      <Phone className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-bold text-white">Instant WhatsApp</span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Live
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Chat directly with Rahul. Get quick onboarding help, request custom API models, or report issues.
                  </p>
                  <div className="rounded-xl bg-zinc-950/70 p-2.5 border border-emerald-500/20 text-xs font-mono text-emerald-300 flex items-center justify-between">
                    <span>{WHATSAPP_NUMBER}</span>
                    <span className="text-[10px] text-zinc-400">Avg &lt; 10m</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2.5 border-t border-white/[0.06]">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-all"
                >
                  <span>Chat on WhatsApp</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </Reveal>

          {/* Block 3: Cal.com 30-Min 1-on-1 */}
          <Reveal delay={140}>
            <div className="luxury-surface rounded-2xl p-4 sm:p-5 border border-white/[0.08] hover:border-purple-500/30 transition-all flex flex-col justify-between h-full group">
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                      <Calendar className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-bold text-white">1-on-1 Walkthrough</span>
                  </div>
                  <span className="text-[10px] font-semibold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-full">
                    30 Min
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Book a video session with the founder. We will optimize your workflow, configure your custom models, and demo power tips.
                  </p>
                  <div className="rounded-xl bg-zinc-950/70 p-2.5 border border-purple-500/20 text-xs text-zinc-300 space-y-1">
                    <div className="flex items-center gap-1 text-zinc-300 font-medium text-[11px]">
                      <Sparkles className="h-3 w-3 text-purple-400" />
                      <span>Workflow & Model Optimization</span>
                    </div>
                    <div className="text-[10px] text-zinc-400">Instant Google Meet invite</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2.5 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={handleOpenCal}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 transition-all cursor-pointer"
                >
                  <span>Book 30-Min Call</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </div>
          </Reveal>

        </div>
      </div>
    </section>
  );
}

export default DirectFeedbackSection;
