import React, { useState, useEffect, useRef } from "react";
import {
  Download,
  Menu,
  X,
  MousePointer,
  Layers,
  Zap,
  Check,
  LayoutTemplate,
  Boxes,
  PenLine,
  MousePointerClick,
  TerminalSquare,
  Sparkles,
  ShieldCheck,
  Globe,
  Clock,
  Star,
  Copy,
  CheckCheck,
  ArrowRight,
  Flame,
  Camera,
  Video,
  Bot,
  Laptop,
  CheckCircle2,
  Lock,
  ChevronRight,
  Apple,
  Smartphone,
} from "lucide-react";
import { Button } from "./components/ui/button.jsx";
import { Card } from "./components/ui/card.jsx";
import { Badge } from "./components/ui/badge.jsx";
import { Accordion, AccordionItem } from "./components/ui/accordion.jsx";
import { Reveal } from "./components/Reveal.jsx";
import OrbCursor from "./components/OrbCursor.jsx";
import { PaypalCheckoutModal } from "./components/PaypalCheckoutModal.jsx";
import { NonWindowsModal } from "./components/NonWindowsModal.jsx";
import { CurrencyBadge } from "./components/CurrencySelector.jsx";
import { SocialProofToast } from "./components/SocialProofToast.jsx";
import { initAnalytics, trackEvent } from "./utils/analytics.js";
import {
  SUPPORTED_CURRENCIES,
  detectCountryAndCurrencyAsync,
  detectLocalCurrencyOffline,
} from "./utils/currency.js";
import {
  CursorLogo,
  V0Logo,
  VercelLogo,
  ClaudeLogo,
  ChatGptLogo,
  GeminiLogo,
  HiggsfieldLogo,
  MidjourneyLogo,
} from "./components/WorkspaceLogos.jsx";

/* ---------------------------------- data ---------------------------------- */

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "AI Demo", href: "#demo" },
  { label: "5-Block Blueprint", href: "#blueprint" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const WORKSPACES = [
  { name: "ChatGPT", Logo: ChatGptLogo },
  { name: "Gemini", Logo: GeminiLogo },
  { name: "Midjourney", Logo: MidjourneyLogo },
  { name: "Higgsfield", Logo: HiggsfieldLogo },
  { name: "Cursor", Logo: CursorLogo },
  { name: "Claude", Logo: ClaudeLogo },
  { name: "Vercel", Logo: VercelLogo },
];

const BLUEPRINT_BLOCKS = [
  { icon: LayoutTemplate, label: "1. Hierarchical Layout Scaffolding" },
  { icon: Boxes, label: "2. Component Token & State Matrix" },
  { icon: PenLine, label: "3. Conversion Copy & Brand Voice" },
  { icon: MousePointerClick, label: "4. Motion Dynamics & Physics" },
  { icon: TerminalSquare, label: "5. Production-Ready Prompt Pack" },
];

const BLUEPRINT_DETAILS = [
  {
    icon: LayoutTemplate,
    title: "1. Structural Layout Scaffolding",
    desc: "Complete section trees, responsive breakpoint shifts, and CSS grid spacing scales. Eliminates layout guessing on the first generation.",
  },
  {
    icon: Boxes,
    title: "2. Component & State Matrix",
    desc: "Tokenized UI assets, component variants (hover, active, focus, disabled), ARIA accessibility roles, and boundary conditions.",
  },
  {
    icon: PenLine,
    title: "3. Conversion Copy Engine",
    desc: "Direct-response headlines, contextual value propositions, and precise microcopy tailored for ChatGPT, Claude, and Gemini.",
  },
  {
    icon: Video,
    title: "4. Motion Dynamics & Camera Physics",
    desc: "Liquid cubic-bezier spring curves for web UIs, or 3D orbital camera vectors and volumetric lighting physics tuned for Higgsfield & Midjourney.",
  },
  {
    icon: TerminalSquare,
    title: "5. Production Prompt Pack",
    desc: "Zero-rework master prompt packs calibrated for the exact context windows of ChatGPT, Gemini, Midjourney, Higgsfield, Cursor & Claude.",
  },
];

const DEMO_PRESETS = [
  {
    id: "chatgpt",
    label: "ChatGPT",
    icon: ChatGptLogo,
    badge: "Reasoning & Copy",
    raw: "Write a high-converting email sequence for my SaaS product launch",
    rebuilt: `Role & Objective: Act as an elite Direct-Response SaaS Copywriter and Growth Architect.

Deliverable: Design an 8-part launch sequence engineered across 3 psychological buyer phases:

Phase 1: The Open Loop & Problem Agitation (Emails 1-3)
- Agitate the core workflow bottleneck; reveal the engineering breakthrough behind the solution.
- Micro-case studies: Customer quote snippet + quantified time saved.

Phase 2: Product Breakdown & Social Proof (Emails 4-5)
- Feature matrix mapped 1:1 to measurable business ROI.
- Interactive video unboxing breakdown + verified testimonials.

Phase 3: Expiring Launch Incentive & Close (Emails 6-8)
- Expiring founder tier pricing with real-time countdown urgency.
- Overcoming top 3 objections with direct technical guarantees.

Constraints & Tone:
- Subject Lines: 3 variants per email (Curiosity, Pain, Social Proof) under 42 characters.
- Body: 140-180 words, punchy single-thought paragraphs, 1 distinct CTA with dynamic UTM tracking.`,
    stats: "+420% Quality & Detail",
  },
  {
    id: "midjourney",
    label: "Midjourney",
    icon: MidjourneyLogo,
    badge: "Photoreal Optics",
    raw: "A futuristic sports car driving in neon rainy city",
    rebuilt: `/imagine prompt: cinematic 35mm anamorphic wide tracking shot of an ultra-aerodynamic concept hypercar gliding through a rain-slicked Neo-Tokyo avenue at night, raytraced reflections shimmering in asphalt puddles, cyan and magenta neon ambiance, Cooke Anamorphic /i 35mm lens, f/1.4, subtle shutter motion blur, volumetric atmospheric mist and tire spray, photorealistic Octane render, hyper-detailed carbon fiber chassis, 8k resolution --ar 16:9 --style raw --v 6.0 --q 2 --s 750`,
    stats: "Octane 8K Cinematic Spec",
  },
  {
    id: "higgsfield",
    label: "Higgsfield AI",
    icon: HiggsfieldLogo,
    badge: "Video Trajectories",
    raw: "An astronaut exploring a crystal cave on another planet",
    rebuilt: `[Camera Vector: Smooth 360-degree orbital crane shot descending from subterranean crystal ceiling to human eye-level].

Scene & Physics Specifications:
- Subject: Lone explorer in matte-white titanium spacesuit with dynamic visor reflection.
- Environment: Massive bioluminescent amethyst cavern pulsating with gentle violet and teal luminescence.
- Particle Dynamics: Sub-zero micro-gravity crystal dust drifting through volumetric sun rays; realistic planetary gravitational drag on footsteps.
- Lighting & Optics: Internal helmet rim light + external subterranean glow, 4K 60fps temporal velocity coherence, liquid fluid dynamics.`,
    stats: "Camera Vector & Physics Mapped",
  },
  {
    id: "gemini",
    label: "Gemini",
    icon: GeminiLogo,
    badge: "Systems Architecture",
    raw: "Build a real-time analytics dashboard with WebSockets",
    rebuilt: `Architecture Specification: High-Throughput Real-Time Telemetry & Analytics Dashboard.

Technical Requirements:
1. Streaming Ingestion Pipeline: Bi-directional WebSocket stream with exponential backoff heartbeat, binary frame compression, and automatic reconnect fallback.
2. High-Performance State: Normalized circular ring buffer retaining 10,000 active datapoints with Web Worker computation offloading to guarantee zero UI thread blocking.
3. GPU Charting Engine: Canvas/WebGL GPU-accelerated rendering locked at 60fps with dynamic downsampling and threshold alerts.
4. Interface & Accessibility: Dark-mode glassmorphism, 12-column responsive layout tokens, and ARIA-live regions for screen reader compliance.`,
    stats: "Full Architecture Blueprint",
  },
  {
    id: "cursor",
    label: "Cursor Rules",
    icon: CursorLogo,
    badge: "Production Code",
    raw: "Make a responsive pricing table with toggle and tooltip",
    rebuilt: `Task: Build a production-grade, accessible Pricing Matrix in React & Tailwind CSS.

Architecture & State:
- Compound Component Pattern: <Pricing.Root>, <Pricing.Toggle>, and <Pricing.Card>.
- State: Monthly / Annual toggle with an animated 20% discount badge.
- Tiers: 3-tier layout (Starter, Pro [Elevated with subtle ambient glow], Enterprise).
- Interactive Microcopy: Tooltips detailing custom SLAs and data guarantees.

Motion & Accessibility:
- Kinetic hover elevation with cubic-bezier(0.25, 1, 0.5, 1) and active click spring feedback.
- Full keyboard navigation (Arrow keys, Space/Enter toggle) and aria-expanded indicators.`,
    stats: "Zero-Boilerplate Cursor Ready",
  },
];

const USE_CASES = [
  {
    icon: Bot,
    title: "ChatGPT & Gemini Reasoning",
    body: "Transform vague 1-line thoughts into structured, multi-step chain-of-thought directives. Get authoritative, deep outputs immediately.",
    tag: "Reasoning & Copy",
  },
  {
    icon: Camera,
    title: "Midjourney & Generative Art",
    body: "Inject optical focal lengths, anamorphic lenses, lighting vectors, and rendering parameters (--ar 16:9 --style raw) in a single keystroke.",
    tag: "AI Art & Design",
  },
  {
    icon: Video,
    title: "Higgsfield & Video Motion",
    body: "Generate cinematic 3D camera trajectories, orbital crane shots, particle dynamics, and temporal velocity prompts tuned for AI video.",
    tag: "Video Generation",
  },
  {
    icon: TerminalSquare,
    title: "Cursor, v0 & Claude Blueprints",
    body: "Hold 300ms to synthesize 5-block architectural specs: semantic section trees, state props, motion tokens, and model-tuned rules.",
    tag: "Frontend & Code",
  },
];

const TESTIMONIALS = [
  {
    name: "Alex Rivera",
    role: "Lead Prompt Engineer & UI Architect",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    text: "Refinzi completely eliminated my prompt iterations. I highlight my rough idea in Windows, tap Ctrl+Alt+Space, and ChatGPT gives me a production-ready system prompt instantly.",
    rating: 5,
    highlight: "Saves 2+ hours daily",
  },
  {
    name: "Marcus Chen",
    role: "AI Film Director & Midjourney Artist",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    text: "The Midjourney and Higgsfield prompt rebuilds are magical. It injects the exact camera angles, lighting physics, and lens parameters without memorizing complex syntax.",
    rating: 5,
    highlight: "Unreal Midjourney specs",
  },
  {
    name: "Elena Rostova",
    role: "Fullstack Developer & Indie Builder",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    text: "The 5-Block Blueprint hold mode is a game changer for Cursor. Instead of re-prompting 10 times, the AI builds the complete component with design tokens on the 1st attempt.",
    rating: 5,
    highlight: "1st-try flawless code",
  },
];

const FAQS = [
  {
    question: "How does Refinzi work in Windows?",
    answer:
      "Refinzi runs quietly as a lightweight Windows companion. Highlight text in ANY Windows app (ChatGPT, Discord, VS Code, Browser, Figma, Notion, Terminal) and press Ctrl+Alt+Space to rebuild active text directly in-place without copy-pasting.",
  },
  {
    question: "What is the difference between Free BYOK and Lifetime Pro?",
    answer:
      "Refinzi Free (BYOK) allows you to bring your own API keys (Gemini, OpenRouter, etc.) forever with zero subscription. Refinzi Lifetime Pro gives you instant zero-setup managed high-speed routing via Claude 3.5 Sonnet and GPT-4o, unlimited 5-Block Blueprint synthesis, cloud sync, and all future updates for a single one-time payment.",
  },
  {
    question: "How does Refinzi adapt prompts for Midjourney, Higgsfield, and ChatGPT?",
    answer:
      "Refinzi analyzes the context and intent of your input. For Midjourney, it formats camera optics, lighting vectors, and aspect ratios. For Higgsfield AI, it engineers 3D camera trajectories and physical motion dynamics. For ChatGPT, Gemini, Cursor, and Claude, it structures chain-of-thought reasoning and production component trees.",
  },
  {
    question: "Is my data private and secure?",
    answer:
      "Yes, 100%. Refinzi is local-first. Your selected clipboard text and custom API keys never touch our servers. Inference requests travel directly and securely between your machine and your chosen AI provider.",
  },
  {
    question: "What are the Windows system requirements?",
    answer:
      "Refinzi 2.0 runs natively on Windows 10 and Windows 11 (64-bit). The installer is only 84 MB, consumes less than 40 MB of RAM, and executes with zero perceptible latency.",
  },
];

/* ----------------------------- ambient glows ------------------------------ */

function HeroGlows() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-28 left-1/2 h-[360px] w-[600px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[120px]" />
      <div className="absolute right-[10%] top-[15%] h-[240px] w-[240px] rounded-full bg-purple-600/10 blur-[110px]" />
    </div>
  );
}

/* --------------------------- Lifetime Offer Modal ------------------------- */

function LifetimeOfferModal({ isOpen, onClose, onDownload, onOpenCheckout, currency = SUPPORTED_CURRENCIES.USD, detectedCountry = "" }) {
  const [timeLeft, setTimeLeft] = useState(14 * 60 + 25);

  useEffect(() => {
    if (!isOpen) return;
    trackEvent("offer_modal_view", { currency: currency.code, country: detectedCountry });
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 14 * 60 + 25));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-[450px] overflow-hidden rounded-2xl border border-blue-500/40 bg-zinc-950 p-5 sm:p-6 shadow-2xl shadow-blue-500/10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-500/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-purple-600/10 blur-2xl" />

        {/* Top bar */}
        <div className="flex items-center justify-between gap-2 pr-7">
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider shadow-sm">
            <Flame className="h-3 w-3 text-amber-300 animate-pulse" />
            <span>Launch Deal · 73% OFF</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[10px] font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-full">
            <Clock className="h-2.5 w-2.5" />
            <span>
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          aria-label="Close offer modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Headline */}
        <div className="mt-3">
          <h3 className="text-xl font-extrabold tracking-tight text-white leading-tight">
            Refinzi Lifetime Pro Access
          </h3>
          <p className="mt-1 text-xs text-zinc-300">
            Pay once, own forever. Zero recurring subscriptions.
          </p>
        </div>

        {/* Value List */}
        <div className="mt-3 rounded-xl border border-white/[0.07] bg-zinc-900/60 p-3 space-y-1.5 text-xs text-zinc-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />
            <span><strong>Managed Fast Routing:</strong> Built-in Claude & GPT, zero API setup.</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-purple-400 shrink-0" />
            <span><strong>5-Block Blueprint Engine:</strong> Complete architectural code & prompts.</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span><strong>Lifetime Updates:</strong> All future Windows, Mac & Linux releases included.</span>
          </div>
        </div>

        {/* Pricing Box */}
        <div className="mt-3 flex items-center justify-between rounded-xl border border-blue-500/25 bg-blue-950/20 px-3.5 py-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
              Refinzi Lifetime Pro {currency.flag}
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-extrabold text-white">{currency.formattedPrice}</span>
              <span className="text-xs line-through text-zinc-500">{currency.formattedRegular}</span>
              <span className="text-[11px] text-emerald-400 font-semibold">Save 73%</span>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-amber-300 bg-amber-950/50 border border-amber-500/30 px-2 py-0.5 rounded-md">
            🔥 28 spots left
          </span>
        </div>

        {/* Action Buttons */}
        <div className="mt-3.5 flex flex-col gap-2">
          <Button
            size="default"
            variant="deal"
            className="w-full font-semibold text-xs sm:text-sm py-2"
            onClick={() => {
              if (onOpenCheckout) {
                onOpenCheckout();
              } else {
                window.location.href = "#pricing";
                onClose();
              }
            }}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            Claim Lifetime Pro — {currency.formattedPrice}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="w-full text-xs py-1.5"
            onClick={() => {
              onDownload();
              onClose();
            }}
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            Download Free BYOK Version (.exe)
          </Button>
        </div>

        {/* Trust Badges */}
        <div className="mt-2.5 flex items-center justify-center gap-3 text-[10px] text-zinc-400 border-t border-white/[0.06] pt-2">
          <span className="flex items-center gap-1">
            <Lock className="h-2.5 w-2.5 text-emerald-400" /> 100% Safe
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-2.5 w-2.5 text-blue-400" /> 14-Day Guarantee
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Laptop className="h-2.5 w-2.5 text-purple-400" /> Windows 10/11 Native
          </span>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- Download Started Modal ----------------------- */

function DownloadSuccessModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-[440px] overflow-hidden rounded-2xl border border-emerald-500/40 bg-zinc-950 p-5 sm:p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          aria-label="Close download modal"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/30 mx-auto">
          <Download className="h-5 w-5" />
        </div>

        <h3 className="mt-3 text-center text-lg font-bold text-white">
          Download Started!
        </h3>
        <p className="mt-1 text-center text-xs text-zinc-400">
          Refinzi 2.0 is downloading to your PC.
        </p>

        {/* 3 Step Setup Guide */}
        <div className="mt-4 rounded-xl border border-white/[0.07] bg-zinc-900/60 p-3 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">3-Step Quickstart:</p>
          <div className="flex items-start gap-2.5 text-xs text-zinc-300">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-500/20 font-bold text-blue-400 text-[10px]">1</span>
            <span>Open <code className="text-blue-300 bg-blue-950/40 px-1 py-0.2 rounded">Refinzi-Setup-2.0.0.exe</code>.</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-zinc-300">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-purple-500/20 font-bold text-purple-400 text-[10px]">2</span>
            <span>Refinzi launches as an ambient desktop Orb.</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-zinc-300">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 font-bold text-emerald-400 text-[10px]">3</span>
            <span>Highlight text anywhere and tap <kbd className="bg-zinc-800 text-white px-1.5 py-0.2 rounded border border-zinc-700 font-mono text-[10px]">Ctrl+Alt+Space</kbd>!</span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <Button
            size="default"
            variant="primary"
            className="w-full font-bold"
            onClick={onClose}
          >
            Launch & Build 🚀
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- navbar -------------------------------- */

function Navbar({ onOpenOffer, onDownload, currency = SUPPORTED_CURRENCIES.USD, osType = "windows" }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-[#08090c]/85 backdrop-blur-xl">
      <nav className="mx-auto flex h-14 max-w-[1140px] items-center justify-between px-4 sm:px-6">
        <a href="#" className="flex items-center gap-2 text-base font-bold text-zinc-50 transition-colors hover:text-white">
          <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-sm shadow-blue-500/30">
            <span className="text-xs leading-none select-none">🧠</span>
          </span>
          <span className="tracking-tight font-bold">Refinzi <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">2.0</span></span>
        </a>

        <ul className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="text-xs text-zinc-400 transition-colors hover:text-zinc-100 font-medium"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href="#pricing"
            onClick={(e) => {
              e.preventDefault();
              onOpenOffer();
            }}
            className="text-xs font-semibold text-zinc-400 hover:text-amber-300 transition-colors"
          >
            Lifetime {currency.formattedPrice}
          </a>
          <Button
            variant="primary"
            size="xs"
            onClick={onDownload}
          >
            {osType === "mac" ? (
              <>
                <Apple className="h-3 w-3" />
                Mac Beta
              </>
            ) : osType === "ios" || osType === "android" ? (
              <>
                <Smartphone className="h-3 w-3" />
                Get Link
              </>
            ) : (
              <>
                <Download className="h-3 w-3" />
                Download Free
              </>
            )}
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className="rounded-lg border border-white/[0.08] p-1.5 text-zinc-300 hover:text-white md:hidden"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/[0.06] bg-[#08090d]/95 backdrop-blur-xl md:hidden">
          <ul className="mx-auto flex max-w-[1140px] flex-col gap-1 px-4 py-3">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50 font-medium"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="pt-2 flex flex-col gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => { setOpen(false); onDownload(); }}
                className="w-full"
              >
                <Download className="h-3.5 w-3.5" />
                Download Free
              </Button>
              <Button
                variant="deal"
                size="sm"
                onClick={() => { setOpen(false); onOpenOffer(); }}
                className="w-full"
              >
                <Flame className="h-3.5 w-3.5" />
                Lifetime Deal — {currency.formattedPrice}
              </Button>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}

/* -------------------------------- hero ---------------------------------- */

function OrbMockup() {
  const [activeMode, setActiveMode] = useState("tap"); // "tap" | "hold"
  const [isHolding, setIsHolding] = useState(false);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const holdTimer = useRef(null);

  // Auto-cycle between Tap and Blueprint states every 4.5s unless user is interacting
  useEffect(() => {
    if (isUserInteracting) return;
    const interval = setInterval(() => {
      setActiveMode((prev) => (prev === "tap" ? "hold" : "tap"));
    }, 4500);
    return () => clearInterval(interval);
  }, [isUserInteracting]);

  const startHold = () => {
    setIsUserInteracting(true);
    setIsHolding(true);
    holdTimer.current = setTimeout(() => {
      setActiveMode("hold");
      setIsHolding(false);
    }, 300);
  };

  const endHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    setIsHolding(false);
  };

  return (
    <Card
      onMouseEnter={() => setIsUserInteracting(true)}
      onMouseLeave={() => setIsUserInteracting(false)}
      className="luxury-surface relative rounded-2xl p-4 sm:p-5 shadow-xl border border-white/[0.08]"
    >
      {/* Window chrome header */}
      <div className="mb-3 flex items-center justify-between">
        <div aria-hidden="true" className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700/80" />
          <span className="ml-2 text-[10px] font-mono text-zinc-500">refinzi-overlay.exe</span>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-zinc-950 p-0.5 border border-white/[0.06]">
          <button
            type="button"
            onClick={() => {
              setIsUserInteracting(true);
              setActiveMode("tap");
            }}
            className={`px-2 py-0.5 text-[11px] font-medium rounded-md transition-all ${
              activeMode === "tap"
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/40 font-bold shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            ⚡ Tap Mode
          </button>
          <button
            type="button"
            onClick={() => {
              setIsUserInteracting(true);
              setActiveMode("hold");
            }}
            className={`px-2 py-0.5 text-[11px] font-medium rounded-md transition-all ${
              activeMode === "hold"
                ? "bg-purple-500/20 text-purple-400 border border-purple-500/40 font-bold shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            🧠 Blueprint (300ms)
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center">
        {/* Interactive glowing orb bar */}
        <div className="flex items-center gap-3 w-full bg-zinc-950/70 p-2.5 rounded-xl border border-white/[0.05]">
          <div
            onMouseDown={startHold}
            onMouseUp={endHold}
            onMouseLeave={endHold}
            onClick={() => {
              setIsUserInteracting(true);
              setActiveMode((prev) => (prev === "tap" ? "hold" : "tap"));
            }}
            className={`relative flex shrink-0 items-center justify-center h-11 w-11 cursor-pointer rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-md shadow-blue-600/30 transition-all duration-200 ${
              isHolding ? "scale-90 ring-2 ring-purple-400 ring-offset-2 ring-offset-zinc-950" : "hover:scale-105 animate-pulse"
            }`}
            role="button"
            tabIndex={0}
            aria-label="Click or hold Refinzi Orb"
            title="Click for Tap mode, Hold for Blueprint mode"
          >
            <span className="text-base select-none">{activeMode === "tap" ? "⚡" : "🧠"}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {activeMode === "tap" ? "Single Tap Active" : "300ms Hold Active"}
            </p>
            <p className="text-[11px] text-zinc-400 truncate">
              {activeMode === "tap"
                ? "Rebuilds active prompt in-place instantly"
                : "Synthesizes complete 5-block architecture"}
            </p>
          </div>
          <kbd className="inline-flex items-center font-mono text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-900/90 text-blue-300 border border-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.15)] ring-1 ring-white/10 shrink-0 select-none">
            Ctrl+Alt+Space
          </kbd>
        </div>

        {/* Dynamic Display Panel */}
        {activeMode === "tap" ? (
          <div className="w-full mt-3 rounded-xl border border-white/[0.07] bg-zinc-950/80 p-3 text-xs shadow-inner transition-all">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.05] mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Live In-Place Prompt Transformation
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">0ms latency</span>
            </div>
            <div className="space-y-1.5">
              <div className="rounded-lg bg-zinc-900/60 p-2 border border-white/[0.04]">
                <span className="text-zinc-500 block mb-0.5 text-[9px] uppercase font-semibold">Raw User Highlight</span>
                <p className="text-zinc-300 font-mono text-[11px]">"cyberpunk sports car in rain"</p>
              </div>
              <div className="rounded-lg bg-blue-950/30 p-2 border border-blue-500/30">
                <span className="text-blue-300 block mb-0.5 text-[9px] uppercase font-semibold">Rebuilt Production Output</span>
                <p className="text-zinc-100 font-mono leading-relaxed text-[11px]">
                  "/imagine cinematic 35mm anamorphic wide tracking shot of hypercar in neon rain, raytraced reflections, volumetric mist --ar 16:9 --v 6.0"
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full mt-3 rounded-xl border border-white/[0.07] bg-zinc-950/80 p-3 text-xs shadow-inner transition-all">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.05] mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1">
                <Layers className="h-3 w-3" /> 5-Block Architectural Spec
              </span>
              <span className="text-[10px] text-purple-300 font-mono">Cursor / GPT ready</span>
            </div>

            <div className="space-y-1">
              {BLUEPRINT_BLOCKS.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-md bg-zinc-900/50 border border-white/[0.04] px-2.5 py-1.5 text-[11px] text-zinc-200 font-medium hover:bg-zinc-850 hover:border-purple-500/30 transition-colors"
                >
                  <Icon className="h-3 w-3 shrink-0 text-purple-400" />
                  <span className="truncate">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function Hero({ onOpenOffer, onDownload, currency = SUPPORTED_CURRENCIES.USD, osType = "windows", onOpenNonWindows }) {
  return (
    <section className="relative pt-8 pb-12 sm:pt-12 sm:pb-16" id="hero">
      <HeroGlows />

      <div className="relative mx-auto grid w-full max-w-[1140px] grid-cols-1 items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
        {/* Left column */}
        <div>
          {/* Eyebrow */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/25">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
              A silent Windows utility for AI creators
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/25">
              <Flame className="h-3 w-3 text-amber-400" />
              Launch Special 73% Off
            </span>
          </div>

          {/* H1 Headline */}
          <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.12] tracking-tight text-white">
            Stop Re-Prompting AI.{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Rebuild in 2 Seconds.
            </span>
          </h1>

          {/* Plain English Subheadline */}
          <p className="mt-4 max-w-xl text-sm sm:text-base leading-relaxed text-zinc-300">
            Select any text, hit{" "}
            <kbd className="inline-flex items-center font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-800 text-white border border-zinc-700 shadow-sm">
              Ctrl+Alt+Space
            </kbd>
            , and Refinzi rebuilds it into a production-ready prompt — inside ChatGPT, Midjourney, Cursor & more. No tab-switching, no copy-paste.
          </p>

          {/* Primary CTA + Secondary Link */}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            {osType === "mac" ? (
              <Button
                size="lg"
                variant="primary"
                onClick={onOpenNonWindows}
              >
                <Apple className="h-4 w-4 mr-1" />
                Join Mac Beta Waitlist
              </Button>
            ) : osType === "ios" || osType === "android" ? (
              <Button
                size="lg"
                variant="primary"
                onClick={onOpenNonWindows}
              >
                <Smartphone className="h-4 w-4 mr-1" />
                Email Me Download Link
              </Button>
            ) : (
              <Button
                size="lg"
                variant="primary"
                onClick={onDownload}
              >
                <Download className="h-4 w-4" />
                Download Free for Windows
              </Button>
            )}

            <a
              href="#pricing"
              onClick={(e) => {
                e.preventDefault();
                onOpenOffer();
              }}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white px-3 py-2 rounded-xl transition-colors group"
            >
              <span>See Lifetime Deal ({currency.formattedPrice})</span>
              <ArrowRight className="h-3.5 w-3.5 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>

          {/* Clear Free vs Paid Value Gap */}
          <div className="mt-4 space-y-1 text-xs text-zinc-400 font-medium">
            <div className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span><strong className="text-zinc-200">Free BYOK Mode</strong> — use your own API keys, zero subscription</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-blue-400 shrink-0" />
              <span><strong className="text-zinc-200">Lifetime Pro ({currency.formattedPrice})</strong> — built-in Claude & GPT routing + Blueprint packs</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-purple-400 shrink-0" />
              <span>Windows 10 & 11 Native · 84 MB · Zero perceptible latency</span>
            </div>
          </div>

          {/* Social Proof Strip */}
          <div className="mt-5 flex items-center gap-3.5 border-t border-white/[0.06] pt-4">
            <div className="flex -space-x-2 shrink-0">
              <img className="inline-block h-7 w-7 rounded-full ring-2 ring-zinc-950 object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="User 1" loading="lazy" decoding="async" />
              <img className="inline-block h-7 w-7 rounded-full ring-2 ring-zinc-950 object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" alt="User 2" loading="lazy" decoding="async" />
              <img className="inline-block h-7 w-7 rounded-full ring-2 ring-zinc-950 object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" alt="User 3" loading="lazy" decoding="async" />
              <img className="inline-block h-7 w-7 rounded-full ring-2 ring-zinc-950 object-cover" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80" alt="User 4" loading="lazy" decoding="async" />
            </div>
            <div>
              <div className="flex items-center text-amber-400 text-xs leading-none">
                {"★★★★★"}
                <span className="ml-1.5 font-bold text-white text-[11px]">4.9/5</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">Loved by <strong className="text-zinc-200">14,800+</strong> prompt creators & devs</p>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="relative lg:justify-self-end w-full max-w-lg">
          <OrbMockup />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- trust bar ------------------------------- */

function TrustBar() {
  return (
    <Reveal>
      <section className="border-y border-white/[0.06] bg-zinc-950/40 py-5 sm:py-6" id="workspaces">
        <div className="mx-auto max-w-[1140px] px-4 sm:px-6 text-center">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
            Engineered for top AI models & tools
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {WORKSPACES.map(({ name, Logo }) => (
              <div
                key={name}
                className="luxury-surface flex items-center gap-2 py-1.5 px-3 rounded-xl transition-all duration-150 hover:border-white/[0.15]"
              >
                <Logo className="h-4 w-4 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-300">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Reveal>
  );
}

/* ----------------------- Live Interactive Playground Demo ----------------- */

function LiveDemoSection({ onDownload }) {
  const [selectedPreset, setSelectedPreset] = useState(DEMO_PRESETS[0]);
  const [copied, setCopied] = useState(false);
  const [isRebuilding, setIsRebuilding] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedPreset.rebuilt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRebuild = () => {
    setIsRebuilding(true);
    setTimeout(() => {
      setIsRebuilding(false);
    }, 250);
  };

  return (
    <section className="py-12 sm:py-16 relative overflow-hidden" id="demo">
      <div className="mx-auto max-w-[1140px] px-4 sm:px-6">
        <Reveal>
          <div className="text-center max-w-xl mx-auto">
            <Badge variant="outline" className="text-purple-400 border-purple-500/30 bg-purple-950/20">
              ⚡ Interactive Demo
            </Badge>
            <h2 className="mt-2.5 text-2xl sm:text-3xl font-bold tracking-tight text-white">
              See How Refinzi Transforms Any Prompt
            </h2>
            <p className="mt-1.5 text-zinc-400 text-xs sm:text-sm">
              Select an AI model and see raw thoughts turn into master execution blueprints in milliseconds.
            </p>
          </div>
        </Reveal>

        {/* Model Tabs */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
          {DEMO_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isSelected = selectedPreset.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  setSelectedPreset(preset);
                  handleRebuild();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm shadow-blue-500/25 border border-white/20"
                    : "bg-zinc-900/70 text-zinc-400 border border-white/[0.06] hover:text-zinc-200 hover:border-zinc-700"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Interactive Comparison Box */}
        <Reveal delay={80}>
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
            {/* Raw Input Box */}
            <Card className="luxury-surface flex flex-col justify-between p-4 sm:p-5">
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06]">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Before: Rough Thought
                  </span>
                  <Badge variant="muted" className="text-[10px]">Vague Prompt</Badge>
                </div>
                <div className="mt-3 rounded-xl bg-zinc-950/70 p-3 border border-white/[0.05] font-mono text-xs text-zinc-300 break-words">
                  "{selectedPreset.raw}"
                </div>
                <p className="mt-2.5 text-xs text-zinc-400 leading-relaxed">
                  ⚠️ <strong>The bottleneck:</strong> Standard AI models generate generic, shallow responses from raw prompts, causing endless re-prompting.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[11px] text-zinc-400">Global Shortcut:</span>
                <kbd className="bg-zinc-900 text-blue-400 font-mono text-xs px-2 py-0.5 rounded border border-zinc-700">
                  Ctrl + Alt + Space
                </kbd>
              </div>
            </Card>

            {/* Rebuilt Output Box */}
            <Card className="luxury-surface-glow relative flex flex-col justify-between p-4 sm:p-5">
              <Badge className="absolute -top-2.5 right-5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-[10px]">
                {selectedPreset.stats}
              </Badge>

              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-blue-500/20">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                      After: Rebuilt {selectedPreset.label} Spec
                    </span>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[11px] text-zinc-300 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 px-2.5 py-1 rounded-lg border border-white/[0.08] transition-all"
                  >
                    {copied ? <CheckCheck className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copied ? "Copied!" : "Copy Prompt"}</span>
                  </button>
                </div>

                <div className={`mt-3 rounded-xl bg-zinc-950/90 p-3 border border-blue-500/25 font-mono text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto break-words ${isRebuilding ? "opacity-50 animate-pulse" : ""}`}>
                  {selectedPreset.rebuilt}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-blue-500/20 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="h-3 w-3" /> Ready for {selectedPreset.label}
                </span>
                <Button size="xs" variant="primary" onClick={onDownload}>
                   <Download className="h-3 w-3" /> Download Free
                 </Button>
              </div>
            </Card>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------ mechanism --------------------------------- */

function Mechanism() {
  const STEPS = [
    {
      icon: MousePointer,
      title: "1. Highlight Any Rough Prompt",
      body: "Highlight instructions or vague text anywhere in Windows (ChatGPT, Discord, VS Code, Browser, Figma).",
    },
    {
      icon: Layers,
      title: "2. Press Ctrl+Alt+Space",
      body: "Single tap for in-place prompt transformation ⚡. Hold 300ms for full 5-block architectural Blueprint 🧠.",
    },
    {
      icon: Zap,
      title: "3. Instant 1st-Try Perfection",
      body: "Paste production-ready prompts into ChatGPT, Midjourney, Higgsfield AI, Gemini, Cursor or Claude.",
    },
  ];

  return (
    <section className="py-12 sm:py-16 border-t border-white/[0.06] bg-zinc-950/30" id="features">
      <div className="mx-auto max-w-[1140px] px-4 sm:px-6">
        <Reveal>
          <div className="text-center max-w-xl mx-auto">
            <Badge variant="outline" className="text-blue-400 border-blue-500/30">⚡ How It Works</Badge>
            <h2 className="mt-2.5 text-2xl sm:text-3xl font-bold tracking-tight text-white">
              3 Steps. Zero Friction.
            </h2>
            <p className="mt-1.5 text-zinc-400 text-xs sm:text-sm">
              No browser extensions. No tab switching. Just highlight, hotkey, and build.
            </p>
          </div>
        </Reveal>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, index) => (
            <Reveal key={title} delay={index * 70}>
              <Card className="luxury-surface group h-full p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 ring-1 ring-blue-500/20">
                    <Icon className="h-4 w-4 text-blue-400 transition-transform group-hover:scale-110" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-zinc-500">
                    STEP {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-zinc-100">{title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">{body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------- blueprint detail ----------------------------- */

function Blueprint({ onDownload }) {
  return (
    <section className="border-t border-white/[0.06] bg-zinc-950/50 py-12 sm:py-16" id="blueprint">
      <div className="mx-auto max-w-[1140px] px-4 sm:px-6">
        <Reveal>
          <div className="text-center max-w-xl mx-auto">
            <Badge variant="outline" className="text-purple-400 border-purple-500/30 bg-purple-950/20">
              🧠 5-Block Blueprint Engine
            </Badge>
            <h2 className="mt-2.5 text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Inside Every Architectural Blueprint
            </h2>
            <p className="mt-1.5 text-zinc-400 text-xs sm:text-sm">
              Hold the Orb for 300ms to synthesize an entire architectural specification — not just a prompt.
            </p>
          </div>
        </Reveal>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BLUEPRINT_DETAILS.map(({ icon: Icon, title, desc }, index) => (
            <Reveal key={title} delay={index * 60} className="h-full">
              <Card className="luxury-surface group h-full p-4 sm:p-5">
                <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 ring-1 ring-purple-500/20">
                  <Icon className="h-4 w-4 text-purple-400 transition-transform group-hover:scale-110" />
                </div>
                <h3 className="text-sm font-bold text-zinc-100">{title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">{desc}</p>
              </Card>
            </Reveal>
          ))}

          {/* Mini-CTA Card */}
          <Reveal delay={BLUEPRINT_DETAILS.length * 60} className="h-full">
            <Card className="luxury-surface-glow relative flex h-full flex-col justify-between overflow-hidden p-4 sm:p-5">
              <div>
                <Sparkles className="h-5 w-5 text-purple-400" />
                <h3 className="mt-2.5 text-sm font-bold text-white">
                  Model-Calibrated Output
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-zinc-300">
                  Every output is tuned for the exact context window of ChatGPT, Midjourney, Higgsfield, Gemini, Cursor or Claude.
                </p>
              </div>
              <Button variant="primary" onClick={onDownload} size="xs" className="mt-3 w-full">
                <Download className="h-3 w-3" />
                Try Free On Windows
              </Button>
            </Card>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- use cases -------------------------------- */

function UseCases() {
  return (
    <section className="py-12 sm:py-16 border-t border-white/[0.06]" id="use-cases">
      <div className="mx-auto max-w-[1140px] px-4 sm:px-6">
        <Reveal>
          <div className="text-center max-w-xl mx-auto">
            <Badge variant="outline">🎯 Creative & Technical Workflows</Badge>
            <h2 className="mt-2.5 text-2xl sm:text-3xl font-bold tracking-tight text-white">
              One Ambient Shortcut, Endless Workflows
            </h2>
            <p className="mt-1.5 text-zinc-400 text-xs sm:text-sm">
              From photorealistic Midjourney art to complex fullstack Cursor architecture.
            </p>
          </div>
        </Reveal>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {USE_CASES.map(({ icon: Icon, title, body, tag }, index) => (
            <Reveal key={title} delay={index * 60} className="h-full">
              <Card className="luxury-surface group flex h-full flex-col justify-between p-5">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 ring-1 ring-blue-500/20">
                      <Icon className="h-4 w-4 text-blue-400 transition-transform group-hover:scale-110" />
                    </div>
                    <Badge variant="muted" className="text-[10px]">{tag}</Badge>
                  </div>
                  <h3 className="mt-3 text-sm sm:text-base font-bold text-zinc-100">{title}</h3>
                  <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-zinc-400">{body}</p>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- Social Proof ----------------------------- */

function Testimonials() {
  return (
    <section className="py-12 sm:py-16 border-t border-white/[0.06] bg-zinc-950/40">
      <div className="mx-auto max-w-[1140px] px-4 sm:px-6">
        <Reveal>
          <div className="text-center max-w-xl mx-auto">
            <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-950/20">
              ⭐ Verified Reviews
            </Badge>
            <h2 className="mt-2.5 text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Loved by 14,800+ Creators & Engineers
            </h2>
          </div>
        </Reveal>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, idx) => (
            <Reveal key={t.name} delay={idx * 60}>
              <Card className="luxury-surface h-full p-4 sm:p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-amber-400 text-xs mb-2">
                    {"★".repeat(t.rating)}
                  </div>
                  <p className="text-[11px] font-semibold text-blue-400 mb-1.5 uppercase tracking-wide">
                    "{t.highlight}"
                  </p>
                  <p className="text-xs text-zinc-300 leading-relaxed italic">
                    "{t.text}"
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-2.5 pt-3 border-t border-white/[0.06]">
                  <img src={t.avatar} alt={t.name} className="h-7 w-7 rounded-full object-cover ring-1 ring-zinc-700" loading="lazy" decoding="async" />
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">{t.name}</h4>
                    <p className="text-[10px] text-zinc-500 leading-tight">{t.role}</p>
                  </div>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- pricing --------------------------------- */

const FREE_FEATURES = [
  "Bring your own API keys (Gemini / OpenRouter)",
  "Direct routing with 0% markup",
  "Daily Rebuild limit via Refinzi Gateway",
  "Full 5-Block Blueprint engine",
  "Tuned for ChatGPT, Midjourney, Higgsfield, Gemini & Cursor",
  "Windows 10/11 ambient Orb integration",
];

const PRO_FEATURES = [
  "Everything in Free / BYOK",
  "Built-in managed Claude 3.5 Sonnet & GPT-4o routing",
  "Zero API setup or configuration required",
  "Cloud sync custom prompt presets",
  "Priority 24/7 direct support",
  "Lifetime free updates (No subscription forever)",
  "Early access to upcoming Mac & Linux builds",
];

function FeatureList({ items }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-xs text-zinc-300">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Pricing({ onOpenOffer, onDownload, currency = SUPPORTED_CURRENCIES.USD, onSelectCurrency, detectedCountry = "" }) {
  return (
    <section className="py-12 sm:py-16 border-t border-white/[0.06]" id="pricing">
      <div className="mx-auto max-w-[1140px] px-4 sm:px-6">
        <Reveal>
          <div className="text-center max-w-xl mx-auto flex flex-col items-center">
            <Badge variant="outline" className="mb-2">Transparent Pricing</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Start Rebuilding Today
            </h2>
            <p className="mt-1 text-zinc-400 text-xs sm:text-sm">
              Use Refinzi 100% free with your own API keys, or lock in the Lifetime Pro deal.
            </p>

            {/* Currency Selector Badge */}
            <div className="mt-3">
              <CurrencyBadge
                currentCurrency={currency}
                onSelectCurrency={onSelectCurrency}
                detectedCountry={detectedCountry}
              />
            </div>
          </div>
        </Reveal>

        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-5 md:grid-cols-2 items-stretch">
          {/* Card 1 — Free / BYOK */}
          <Card className="luxury-surface flex flex-col justify-between p-5 sm:p-6">
            <div>
              <Badge variant="muted">Forever Free</Badge>
              <h3 className="mt-2 text-lg font-bold text-zinc-50">Free / BYOK</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-zinc-50">{currency.symbol}0</span>
                <span className="text-xs text-zinc-500">/ forever</span>
              </div>
              <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
                Bring your own Gemini or OpenRouter API keys. Zero subscription cost forever.
              </p>

              <div className="my-4 border-t border-white/[0.06]" />
              <FeatureList items={FREE_FEATURES} />
            </div>

            <Button
              variant="secondary"
              size="default"
              onClick={onDownload}
              className="mt-5 w-full"
            >
              <Download className="h-3.5 w-3.5" />
              Download Free (.exe)
            </Button>
          </Card>

          {/* Card 2 — Pro Lifetime Deal */}
          <Card className="luxury-surface-glow relative flex flex-col justify-between p-5 sm:p-6">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-amber-500 text-zinc-950 font-extrabold px-3 py-0.5 text-[10px] shadow-md">
              🔥 LAUNCH DEAL — 73% OFF
            </Badge>

            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">Lifetime License</span>
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-950/30 text-[10px]">
                  Pay Once, Own Forever
                </Badge>
              </div>
              <h3 className="mt-1.5 text-lg font-bold text-white">Refinzi Lifetime Pro</h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{currency.formattedPrice}</span>
                <span className="text-sm line-through text-zinc-500">{currency.formattedRegular}</span>
                <span className="text-xs text-emerald-400 font-semibold font-mono">Save 73%</span>
              </div>
              <p className="mt-1 text-xs text-zinc-300 leading-relaxed">
                Zero API configuration. Built-in managed Claude & GPT models. Lifetime updates.
              </p>

              {/* Anti-Subscription Price Anchor */}
              <div className="mt-2.5 rounded-lg bg-blue-950/30 border border-blue-500/25 px-2.5 py-1.5 text-[10px] text-zinc-300 flex items-center justify-between">
                <span>vs Monthly SaaS Tools:</span>
                <span className="font-bold text-amber-300 line-through">~{currency.symbol}240/yr</span>
                <span className="font-bold text-emerald-400">Save {currency.symbol}{currency.saveAmount}+</span>
              </div>

              <div className="my-3 border-t border-blue-500/20" />
              <FeatureList items={PRO_FEATURES} />
            </div>

            <div className="mt-5">
              <Button
                variant="deal"
                size="default"
                onClick={onOpenOffer}
                className="w-full"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Claim Lifetime Pro — {currency.formattedPrice}
              </Button>
              <p className="mt-2 text-center text-[10px] text-zinc-400">
                🛡️ 14-Day Money-Back Guarantee · Instant License Key
              </p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------- faq ----------------------------------- */

function FAQ() {
  return (
    <section className="py-12 sm:py-16 bg-zinc-950/40 border-t border-white/[0.06]" id="faq">
      <div className="mx-auto max-w-[1140px] px-4 sm:px-6">
        <Reveal>
          <div className="text-center max-w-xl mx-auto">
            <Badge variant="outline">FAQ</Badge>
            <h2 className="mt-2.5 text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Frequently Asked Questions
            </h2>
          </div>
        </Reveal>

        <Accordion className="mx-auto mt-8 max-w-2xl">
          {FAQS.map(({ question, answer }) => (
            <AccordionItem key={question} question={question} answer={answer} />
          ))}
        </Accordion>
      </div>
    </section>
  );
}

/* ---------------------------- final CTA + footer --------------------------- */

function FinalCTA({ onOpenOffer, onDownload, currency = SUPPORTED_CURRENCIES.USD, osType = "windows", onOpenNonWindows }) {
  return (
    <section className="relative py-12 sm:py-16 text-center border-t border-white/[0.06]" id="download">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[280px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-[110px]"
      />
      <div className="relative mx-auto max-w-[1140px] px-4 sm:px-6">
        <Reveal>
          <Badge variant="outline" className="text-blue-400 border-blue-500/30 mb-2.5">
            🚀 Ready in 2 Seconds
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Your AI Deserves Better Prompts.
          </h2>
          <p className="mt-2.5 text-xs sm:text-sm text-zinc-300 max-w-lg mx-auto leading-relaxed">
            Get flawless outputs from ChatGPT, Midjourney, Higgsfield, Gemini & Cursor — on the very first try.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {osType === "mac" ? (
              <Button
                size="lg"
                variant="primary"
                onClick={onOpenNonWindows}
              >
                <Apple className="h-4 w-4 mr-1" />
                Join Mac Beta Waitlist
              </Button>
            ) : osType === "ios" || osType === "android" ? (
              <Button
                size="lg"
                variant="primary"
                onClick={onOpenNonWindows}
              >
                <Smartphone className="h-4 w-4 mr-1" />
                Email Me Download Link
              </Button>
            ) : (
              <Button
                size="lg"
                variant="primary"
                onClick={onDownload}
              >
                <Download className="h-4 w-4" />
                Download Free for Windows
              </Button>
            )}

            <Button
              variant="deal"
              size="lg"
              onClick={onOpenOffer}
            >
              <Flame className="h-4 w-4" />
              Claim Lifetime Pro — {currency.formattedPrice}
            </Button>
          </div>

          <p className="mt-3 text-[11px] text-zinc-500">
            Windows 10/11 · 84 MB · 100% Virus-Free · Zero Configuration Required
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------- Sticky Conversion Bar ------------------------- */

function StickyConversionBar({ show, onOpenOffer, onDownload, currency = SUPPORTED_CURRENCIES.USD, osType = "windows", onOpenNonWindows }) {
  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/[0.08] bg-[#08090c]/90 backdrop-blur-xl px-4 py-2 shadow-2xl transition-all animate-in slide-in-from-bottom-3">
      <div className="mx-auto flex max-w-[1140px] items-center justify-between gap-4">
        <div className="hidden sm:flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-[10px] shadow-sm">
            🧠
          </span>
          <div>
            <p className="text-xs font-bold text-white">Refinzi 2.0</p>
            <p className="text-[10px] text-zinc-400">Rebuild any prompt in &lt;2s (Ctrl+Alt+Space)</p>
          </div>
        </div>

        <div className="flex w-full sm:w-auto items-center justify-end gap-2.5">
          <button
            onClick={onOpenOffer}
            className="text-xs font-semibold text-zinc-300 hover:text-amber-300 px-2 py-1 transition-colors"
          >
            Lifetime {currency.formattedPrice}
          </button>
          <Button
            size="xs"
            variant="primary"
            onClick={osType === "windows" ? onDownload : onOpenNonWindows}
          >
            {osType === "mac" ? (
              <>
                <Apple className="h-3 w-3" />
                Mac Beta
              </>
            ) : osType === "ios" || osType === "android" ? (
              <>
                <Smartphone className="h-3 w-3" />
                Get Link
              </>
            ) : (
              <>
                <Download className="h-3 w-3" />
                Download Free
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-6 bg-[#08090c] text-zinc-500 text-[11px]">
      <div className="mx-auto flex max-w-[1140px] flex-col items-center justify-between gap-3 px-4 sm:px-6 sm:flex-row">
        <div className="flex items-center gap-1.5">
          <span>🧠</span>
          <span className="font-semibold text-zinc-300">Refinzi 2.0</span>
          <span>— Ambient Windows prompt layer</span>
        </div>
        <nav aria-label="Legal" className="flex items-center gap-4 text-zinc-500">
          <a href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy</a>
          <a href="/terms" className="hover:text-zinc-300 transition-colors">Terms</a>
          <a href="/docs" className="hover:text-zinc-300 transition-colors">Docs</a>
          <a href="mailto:support@refinzi.com" className="hover:text-zinc-300 transition-colors">Support</a>
        </nav>
      </div>
    </footer>
  );
}

/* ---------------------------------- app ----------------------------------- */

function detectClientOS() {
  if (typeof window === "undefined" || !navigator) return "windows";
  const ua = navigator.userAgent || navigator.vendor || window.opera || "";
  const platform = navigator.platform || "";
  if (/iPad|iPhone|iPod/.test(ua) || (platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
  if (/android/i.test(ua)) return "android";
  if (/Macintosh|Mac OS X/i.test(ua) || platform.startsWith("Mac")) return "mac";
  if (/Linux/i.test(ua) || platform.startsWith("Linux")) return "linux";
  return "windows";
}

export default function App() {
  const [currency, setCurrency] = useState(() => detectLocalCurrencyOffline().currency);
  const [detectedCountry, setDetectedCountry] = useState(() => detectLocalCurrencyOffline().country);
  const [osType, setOsType] = useState(() => detectClientOS());
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isPaypalModalOpen, setIsPaypalModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isNonWindowsModalOpen, setIsNonWindowsModalOpen] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    initAnalytics();
    trackEvent("page_view", { os: osType });

    detectCountryAndCurrencyAsync().then((res) => {
      if (res && res.currency) {
        setCurrency(res.currency);
        setDetectedCountry(res.country);
        trackEvent("geo_currency_detected", {
          country: res.country,
          countryCode: res.countryCode,
          currency: res.currency.code,
        });
      }
    });
  }, []);

  // Auto show lifetime offer popup once after 7 seconds for desktop Windows visitors
  useEffect(() => {
    const hasSeenPopup = sessionStorage.getItem("refinzi_offer_seen");
    if (!hasSeenPopup && osType === "windows") {
      const timer = setTimeout(() => {
        setIsOfferModalOpen(true);
        sessionStorage.setItem("refinzi_offer_seen", "true");
        trackEvent("offer_popup_auto_triggered");
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [osType]);

  // Throttled scroll listener
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (window.scrollY > 400) {
            setShowStickyBar(true);
          } else {
            setShowStickyBar(false);
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const DOWNLOAD_URL = "https://github.com/papada1472/Promptsmith/releases/download/v2.0.0/Refinzi-Setup-v2.0.0.exe";

  const handleTriggerDownload = (source = "unknown") => {
    if (osType !== "windows") {
      setIsNonWindowsModalOpen(true);
      trackEvent("non_windows_prompt_opened", { os: osType, source });
      return;
    }
    setIsDownloadModalOpen(true);
    trackEvent("download_initiated", { platform: "windows", source });
    const link = document.createElement("a");
    link.href = DOWNLOAD_URL;
    link.setAttribute("download", "Refinzi-Setup-v2.0.0.exe");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleForceWindowsDownload = () => {
    setIsDownloadModalOpen(true);
    trackEvent("force_windows_download", { platform: "windows", originalOS: osType });
    const link = document.createElement("a");
    link.href = DOWNLOAD_URL;
    link.setAttribute("download", "Refinzi-Setup-v2.0.0.exe");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenCheckout = (source = "unknown") => {
    setIsOfferModalOpen(false);
    setIsPaypalModalOpen(true);
    trackEvent("checkout_opened", { source, currency: currency.code });
  };

  const handleSelectCurrency = (newCurrency) => {
    setCurrency(newCurrency);
    trackEvent("currency_manually_switched", { currency: newCurrency.code });
  };

  return (
    <div className="min-h-screen bg-[#08090c] font-sans text-zinc-50 selection:bg-blue-500/30 selection:text-white pb-10 sm:pb-0">
      <OrbCursor />
      <Navbar
        currency={currency}
        osType={osType}
        onOpenOffer={() => handleOpenCheckout("navbar")}
        onDownload={() => handleTriggerDownload("navbar")}
      />
      <main>
        <Hero
          currency={currency}
          osType={osType}
          onOpenOffer={() => handleOpenCheckout("hero")}
          onDownload={() => handleTriggerDownload("hero")}
          onOpenNonWindows={() => setIsNonWindowsModalOpen(true)}
        />
        <TrustBar />
        <LiveDemoSection onDownload={() => handleTriggerDownload("demo")} />
        <Mechanism />
        <Blueprint onDownload={() => handleTriggerDownload("blueprint")} />
        <UseCases />
        <Testimonials />
        <Pricing
          currency={currency}
          detectedCountry={detectedCountry}
          onSelectCurrency={handleSelectCurrency}
          onOpenOffer={() => handleOpenCheckout("pricing")}
          onDownload={() => handleTriggerDownload("pricing")}
        />
        <FAQ />
        <FinalCTA
          currency={currency}
          osType={osType}
          onOpenOffer={() => handleOpenCheckout("final_cta")}
          onDownload={() => handleTriggerDownload("final_cta")}
          onOpenNonWindows={() => setIsNonWindowsModalOpen(true)}
        />
      </main>
      <Footer />

      {/* Social Proof Live Activity Toast (Clean bottom-left, no corner fighting) */}
      {!showStickyBar && (
        <SocialProofToast onOpenOffer={() => handleOpenCheckout("social_proof_toast")} />
      )}

      {/* Modals */}
      <NonWindowsModal
        isOpen={isNonWindowsModalOpen}
        osType={osType}
        onClose={() => setIsNonWindowsModalOpen(false)}
        onDownloadWindowsAnyway={handleForceWindowsDownload}
      />

      <LifetimeOfferModal
        isOpen={isOfferModalOpen}
        currency={currency}
        detectedCountry={detectedCountry}
        onClose={() => setIsOfferModalOpen(false)}
        onDownload={() => handleTriggerDownload("offer_modal")}
        onOpenCheckout={() => handleOpenCheckout("offer_modal")}
      />

      <PaypalCheckoutModal
        isOpen={isPaypalModalOpen}
        currency={currency}
        detectedCountry={detectedCountry}
        onClose={() => setIsPaypalModalOpen(false)}
        onDownload={() => handleTriggerDownload("checkout_modal")}
      />

      <DownloadSuccessModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />

      {/* Sticky Bottom Bar on scroll */}
      <StickyConversionBar
        show={showStickyBar}
        currency={currency}
        osType={osType}
        onOpenOffer={() => handleOpenCheckout("sticky_bar")}
        onDownload={() => handleTriggerDownload("sticky_bar")}
        onOpenNonWindows={() => setIsNonWindowsModalOpen(true)}
      />
    </div>
  );
}
