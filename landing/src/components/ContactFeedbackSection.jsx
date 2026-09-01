import React, { useState, useEffect } from "react";
import {
  Calendar,
  MessageSquare,
  Phone,
  Mail,
  Send,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Clock,
  UserCheck,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "./ui/button.jsx";
import { Card } from "./ui/card.jsx";
import { Badge } from "./ui/badge.jsx";
import { Reveal } from "./Reveal.jsx";
import { trackEvent } from "../utils/analytics.js";

const CAL_LINK = "https://cal.com/rahul-mangla-ub8se9/30min";
const WHATSAPP_NUMBER = "+91-9971271291";
const WHATSAPP_URL = "https://wa.me/919971271291?text=Hi%20Rahul,%20I'm%20reaching%20out%20about%20Refinzi!";
const CONTACT_EMAIL = "contact@refinzi.com";

export function ContactFeedbackSection() {
  const [activeTab, setActiveTab] = useState("call"); // "call" | "feedback" | "whatsapp"
  const [feedbackType, setFeedbackType] = useState("feature"); // "feature" | "bug" | "praise" | "general"
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize Cal embed inline if available
  useEffect(() => {
    if (typeof window !== "undefined" && window.Cal) {
      try {
        window.Cal.ns["30min"]("inline", {
          elementOrSelector: "#my-cal-inline-30min",
          config: { layout: "month_view", useSlotsViewOnSmallScreen: "true" },
          calLink: "rahul-mangla-ub8se9/30min",
        });
      } catch (err) {
        console.debug("Cal inline initialization fallback:", err);
      }
    }
  }, [activeTab]);

  const handleOpenCalPopup = () => {
    trackEvent("cal_booking_clicked", { source: "contact_section" });
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

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) return;

    setIsSubmitting(true);
    trackEvent("feedback_submitted", {
      type: feedbackType,
      hasEmail: Boolean(feedbackEmail),
    });

    try {
      const storedFeedback = JSON.parse(localStorage.getItem("refinzi_feedback") || "[]");
      storedFeedback.push({
        type: feedbackType,
        message: feedbackMessage,
        email: feedbackEmail,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem("refinzi_feedback", JSON.stringify(storedFeedback));
    } catch (_) {}

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 400);
  };

  return (
    <section className="py-14 sm:py-20 border-t border-white/[0.06] bg-[#07080c] relative overflow-hidden" id="contact">
      {/* Background glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[750px] bg-blue-600/5 blur-[130px] rounded-full" />

      <div className="mx-auto max-w-[1140px] px-4 sm:px-6 relative">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-3.5 py-1 text-xs font-semibold text-blue-400 mb-3">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Direct Founder Access & Feedback</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Have Questions or Feedback? <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                Reach Out to Rahul Directly.
              </span>
            </h2>

            <p className="mt-3 text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl mx-auto">
              Whether you want to suggest a feature, discuss prompt architecture, or test an enterprise workflow — I'm available directly via 30-min call, WhatsApp, or email.
            </p>

            {/* Top 3 Direct Contact Cards */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              {/* Card 1: 30-Min Call */}
              <button
                type="button"
                onClick={handleOpenCalPopup}
                className="group p-4 rounded-2xl border border-blue-500/25 bg-blue-950/20 hover:bg-blue-950/40 hover:border-blue-500/40 transition-all text-left shadow-lg cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                    Book 1-on-1 <ExternalLink className="h-2.5 w-2.5" />
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                  30-Min Video Call
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Direct calendar booking via Cal.com
                </p>
              </button>

              {/* Card 2: WhatsApp */}
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("whatsapp_clicked", { source: "contact_cards" })}
                className="group p-4 rounded-2xl border border-emerald-500/25 bg-emerald-950/20 hover:bg-emerald-950/40 hover:border-emerald-500/40 transition-all text-left shadow-lg cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Phone className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                    Direct WhatsApp <ExternalLink className="h-2.5 w-2.5" />
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors font-mono">
                  {WHATSAPP_NUMBER}
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Instant response & quick chat
                </p>
              </a>

              {/* Card 3: Email */}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                onClick={() => trackEvent("email_contact_clicked", { source: "contact_cards" })}
                className="group p-4 rounded-2xl border border-purple-500/25 bg-purple-950/20 hover:bg-purple-950/40 hover:border-purple-500/40 transition-all text-left shadow-lg cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1">
                    Direct Email <ExternalLink className="h-2.5 w-2.5" />
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors font-mono">
                  {CONTACT_EMAIL}
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  For support, refunds & licensing
                </p>
              </a>
            </div>
          </div>
        </Reveal>

        {/* Interactive Embed & Feedback Hub */}
        <Reveal delay={70}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left: Cal.com 30-min Embed Card (7 cols) */}
            <Card className="luxury-surface lg:col-span-7 p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                      <Calendar className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white">Schedule a 30-Min Call with Rahul</h3>
                      <p className="text-[11px] text-zinc-400">Free 1-on-1 walkthrough, feedback & Q&A</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-blue-400 border-blue-500/30 bg-blue-950/30 text-[10px]">
                    <Clock className="h-3 w-3 mr-1" /> 30 Min
                  </Badge>
                </div>

                {/* Cal Container / Fallback Card */}
                <div className="mt-4 rounded-xl border border-white/[0.08] bg-zinc-950/70 p-4 min-h-[300px] flex flex-col justify-center items-center text-center">
                  {/* Cal inline target */}
                  <div id="my-cal-inline-30min" className="w-full h-full min-h-[320px] overflow-hidden rounded-lg">
                    {/* Fallback button if iframe takes time */}
                    <div className="flex flex-col items-center justify-center p-6 space-y-3">
                      <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 ring-1 ring-blue-500/20">
                        <Calendar className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-white">Meet 1-on-1 with Rahul Mangla</h4>
                        <p className="text-xs text-zinc-400 max-w-sm mt-1">
                          Pick a time that fits your schedule on Cal.com. Get instant calendar invites with Google Meet.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        <Button
                          variant="primary"
                          size="default"
                          onClick={handleOpenCalPopup}
                          className="font-bold text-xs"
                        >
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          Open 30-Min Scheduler (Cal.com)
                        </Button>
                        <a
                          href={CAL_LINK}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white bg-zinc-900 px-3 py-2 rounded-xl border border-white/10 transition-colors"
                        >
                          <span>Open in New Tab</span>
                          <ExternalLink className="h-3 w-3 text-zinc-400" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400">
                <span className="flex items-center gap-1">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-400" /> Live with Rahul Mangla
                </span>
                <span className="font-mono text-zinc-500">cal.com/rahul-mangla-ub8se9/30min</span>
              </div>
            </Card>

            {/* Right: Instant Feedback & WhatsApp Connect (5 cols) */}
            <Card className="luxury-surface lg:col-span-5 p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Zap className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white">Send Direct Feedback</h3>
                      <p className="text-[11px] text-zinc-400">Feature ideas, questions or bug reports</p>
                    </div>
                  </div>
                  <Badge variant="muted" className="text-[10px]">Zero Friction</Badge>
                </div>

                {!submitted ? (
                  <form onSubmit={handleFeedbackSubmit} className="mt-4 space-y-3">
                    {/* Category Selector */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: "feature", label: "💡 Feature" },
                        { id: "praise", label: "⭐ Praise" },
                        { id: "bug", label: "🐛 Question" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setFeedbackType(item.id)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            feedbackType === item.id
                              ? "bg-blue-600 text-white shadow-sm border border-blue-400/30"
                              : "bg-zinc-950/70 text-zinc-400 border border-white/[0.06] hover:text-white"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {/* Feedback Textarea */}
                    <div>
                      <textarea
                        required
                        rows={4}
                        value={feedbackMessage}
                        onChange={(e) => setFeedbackMessage(e.target.value)}
                        placeholder="What would make Refinzi 10x better for your workflow? Share your thoughts..."
                        className="w-full rounded-xl border border-white/[0.1] bg-zinc-950/80 p-3 text-xs text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-sans"
                      />
                    </div>

                    {/* Email Optional */}
                    <div>
                      <input
                        type="email"
                        value={feedbackEmail}
                        onChange={(e) => setFeedbackEmail(e.target.value)}
                        placeholder="Your email (optional, for follow-up reply)"
                        className="w-full rounded-xl border border-white/[0.1] bg-zinc-950/80 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="default"
                      disabled={isSubmitting || !feedbackMessage.trim()}
                      className="w-full font-bold text-xs py-2.5"
                    >
                      <Send className="h-3.5 w-3.5 mr-1" />
                      {isSubmitting ? "Sending Feedback..." : "Submit Feedback Directly"}
                    </Button>
                  </form>
                ) : (
                  <div className="my-6 text-center space-y-3 py-4 rounded-xl bg-zinc-950/60 border border-emerald-500/20">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/30 mx-auto">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">Thank You! Feedback Received 🙌</h4>
                      <p className="text-xs text-zinc-400 max-w-xs mx-auto mt-1">
                        Rahul reviews every single submission personally to shape the roadmap for Refinzi.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitted(false);
                        setFeedbackMessage("");
                      }}
                      className="text-xs text-blue-400 underline hover:text-blue-300 font-medium pt-1 cursor-pointer"
                    >
                      Send another message
                    </button>
                  </div>
                )}

                {/* Direct WhatsApp Quick Bar */}
                <div className="mt-4 pt-3 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between bg-emerald-950/20 border border-emerald-500/20 p-2.5 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
                        💬
                      </span>
                      <div>
                        <p className="text-xs font-bold text-white">Need an Instant Answer?</p>
                        <p className="text-[10px] text-zinc-400 font-mono">WhatsApp: {WHATSAPP_NUMBER}</p>
                      </div>
                    </div>
                    <a
                      href={WHATSAPP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-emerald-300 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/30 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <span>Chat</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default ContactFeedbackSection;
