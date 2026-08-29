import React, { useState, useEffect } from "react";
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
  Rocket,
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
} from "lucide-react";
import { Button } from "./components/ui/button.jsx";
import { Card } from "./components/ui/card.jsx";
import { Badge } from "./components/ui/badge.jsx";
import { Accordion, AccordionItem } from "./components/ui/accordion.jsx";
import { Reveal } from "./components/Reveal.jsx";
import OrbCursor from "./components/OrbCursor.jsx";
import { PaypalCheckoutModal } from "./components/PaypalCheckoutModal.jsx";
import {
  CursorLogo,
  V0Logo,
  ClaudeLogo,
  ChatGptLogo,
  GeminiLogo,
  HiggsfieldLogo,
  MidjourneyLogo,
} from "./components/WorkspaceLogos.jsx";

/* ---------------------------------- data ---------------------------------- */

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "AI Blueprint & Demo", href: "#blueprint" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const WORKSPACES = [
  { name: "ChatGPT-4o", Logo: ChatGptLogo, desc: "Reasoning & System Logic" },
  { name: "Gemini 2.0", Logo: GeminiLogo, desc: "Deep Architecture & Telemetry" },
  { name: "Midjourney v6", Logo: MidjourneyLogo, desc: "Photoreal Optics & 35mm Lens" },
  { name: "Higgsfield AI", Logo: HiggsfieldLogo, desc: "Orbital Camera & Motion Physics" },
  { name: "Cursor Rules", Logo: CursorLogo, desc: "Production Code Specifications" },
  { name: "Claude 3.5", Logo: ClaudeLogo, desc: "Structured Logic & Artifacts" },
  { name: "v0 by Vercel", Logo: V0Logo, desc: "Component Scaffolding & Tokens" },
];

const BLUEPRINT_BLOCKS = [
  { icon: LayoutTemplate, label: "1. Hierarchical Layout Scaffolding" },
  { icon: Boxes, label: "2. Component Token & State Matrix" },
  { icon: PenLine, label: "3. Conversion Copy & Brand Voice" },
  { icon: MousePointerClick, label: "4. Motion Dynamics & Camera Physics" },
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
    desc: "Zero-rework master prompt packs calibrated for the exact context windows of ChatGPT-4o, Gemini 2.0, Midjourney v6, Higgsfield, Cursor & Claude.",
  },
];

const DEMO_PRESETS = [
  {
    id: "chatgpt",
    label: "ChatGPT-4o",
    icon: ChatGptLogo,
    badge: "Reasoning & Direct-Response",
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
    label: "Midjourney v6",
    icon: MidjourneyLogo,
    badge: "Photoreal Optics & Lens",
    raw: "A futuristic sports car driving in neon rainy city",
    rebuilt: `/imagine prompt: cinematic 35mm anamorphic wide tracking shot of an ultra-aerodynamic concept hypercar gliding through a rain-slicked Neo-Tokyo avenue at night, raytraced reflections shimmering in asphalt puddles, cyan and magenta neon ambiance, Cooke Anamorphic /i 35mm lens, f/1.4, subtle shutter motion blur, volumetric atmospheric mist and tire spray, photorealistic Octane render, hyper-detailed carbon fiber chassis, 8k resolution --ar 16:9 --style raw --v 6.0 --q 2 --s 750`,
    stats: "Octane 8K Cinematic Spec",
  },
  {
    id: "higgsfield",
    label: "Higgsfield AI",
    icon: HiggsfieldLogo,
    badge: "Cinematic Video Trajectories",
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
    label: "Gemini 2.0",
    icon: GeminiLogo,
    badge: "Deep Systems Architecture",
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
    badge: "Production Code Specifications",
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
    body: "Transform vague 1-line thoughts into comprehensive, multi-step chain-of-thought directives. Eliminate repetitive prompting and get authoritative, structured outputs immediately.",
    tag: "Reasoning & Copy",
  },
  {
    icon: Camera,
    title: "Midjourney & Generative Art",
    body: "Instantly inject optical focal lengths, anamorphic lenses, lighting vectors, rendering engines, and aspect parameters (--ar 16:9 --style raw) in a single keystroke.",
    tag: "AI Art & Design",
  },
  {
    icon: Video,
    title: "Higgsfield & Video Motion",
    body: "Generate cinematic 3D camera trajectories, orbital crane shots, particle dynamics, and temporal velocity prompts tuned specifically for Higgsfield AI video generation.",
    tag: "Video Generation",
  },
  {
    icon: TerminalSquare,
    title: "Cursor, v0 & Claude Blueprints",
    body: "Hold for 300ms to synthesize complete 5-block architectural specs: semantic section trees, state props, motion tokens, and model-tuned prompt rulepacks.",
    tag: "Frontend & Code",
  },
];

const TESTIMONIALS = [
  {
    name: "Alex Rivera",
    role: "Lead Prompt Engineer & UI Architect",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    text: "Refinzi completely eliminated my prompt iterations. I highlight my rough idea in Windows, tap Ctrl+Alt+Space, and ChatGPT gives me a production-ready system prompt instantly. It paid for itself in 10 minutes.",
    rating: 5,
    highlight: "Saves 2+ hours daily",
  },
  {
    name: "Marcus Chen",
    role: "AI Film Director & Midjourney Artist",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    text: "The Midjourney and Higgsfield prompt rebuilds are magical. It injects the exact camera angles, lighting physics, and lens parameters I need without me having to memorize complex syntax.",
    rating: 5,
    highlight: "Unreal Midjourney & Higgsfield specs",
  },
  {
    name: "Elena Rostova",
    role: "Fullstack Developer & Indie Builder",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    text: "The 5-Block Blueprint hold mode is a game changer for Cursor and v0. Instead of re-prompting 10 times, the AI builds the complete component with design tokens on the first attempt.",
    rating: 5,
    highlight: "1st-try flawless code",
  },
];

const FAQS = [
  {
    question: "How does Refinzi work in Windows?",
    answer:
      "Refinzi runs quietly as an ambient, ultra-lightweight Windows companion. Whenever you highlight text in ANY Windows app (ChatGPT-4o, Discord, VS Code, Browser, Figma, Notion, Terminal) and press Ctrl+Alt+Space or click the Orb, Refinzi captures the text and injects an expert prompt or full 5-block architectural blueprint directly in-place.",
  },
  {
    question: "How does Refinzi adapt prompts for Midjourney, Higgsfield, and ChatGPT?",
    answer:
      "Refinzi analyzes the context and intent of your input. For Midjourney v6, it formats camera optics, lighting vectors, and aspect ratios. For Higgsfield AI, it engineers 3D camera trajectories and physical motion dynamics. For ChatGPT-4o, Gemini 2.0, Cursor, and Claude 3.5, it structures chain-of-thought reasoning and production component trees.",
  },
  {
    question: "What is included in the Lifetime Pro Launch Deal?",
    answer:
      "During our 2.0 Launch, you can secure a Lifetime Pro License for a one-time payment of $19 (regular $79). This includes lifetime software updates, zero recurring subscription fees, priority Claude 3.5 Sonnet / GPT-4o high-speed routing, and cloud sync. Or, you can use Refinzi Free forever with your own API keys (BYOK).",
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
      <div className="absolute -top-32 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-blue-500/15 blur-[140px]" />
      <div className="absolute right-[8%] top-[20%] h-[320px] w-[320px] rounded-full bg-purple-600/10 blur-[130px]" />
    </div>
  );
}

/* --------------------------- Lifetime Offer Modal ------------------------- */

function LifetimeOfferModal({ isOpen, onClose, onDownload, onOpenCheckout }) {
  const [timeLeft, setTimeLeft] = useState(14 * 60 + 25);

  useEffect(() => {
    if (!isOpen) return;
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
      <div className="relative w-full max-w-[470px] overflow-hidden rounded-2xl border border-blue-500/50 bg-zinc-950 p-5 sm:p-6 shadow-2xl shadow-blue-500/20">
        {/* Subtle decorative glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-500/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-purple-600/15 blur-2xl" />

        {/* Top bar: Badge, Timer & Close */}
        <div className="flex items-center justify-between gap-2 pr-7">
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-wider shadow-sm">
            <Flame className="h-3 w-3 text-amber-300 animate-pulse" />
            <span>Launch Special · 73% OFF</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
            <Clock className="h-3 w-3" />
            <span>
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")} left
            </span>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          aria-label="Close offer modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Headline */}
        <div className="mt-3.5">
          <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-tight">
            Rebuild Any AI Prompt in 2s.{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              One-Time Access.
            </span>
          </h3>
          <p className="mt-1 text-xs text-zinc-300 leading-relaxed">
            Supercharge your prompts across <strong className="text-white">ChatGPT, Gemini, Midjourney, Higgsfield, Cursor & Claude</strong> with zero re-prompting friction.
          </p>
        </div>

        {/* Value List */}
        <div className="mt-3.5 rounded-xl border border-zinc-800/90 bg-zinc-900/60 p-3 space-y-1.5 text-xs text-zinc-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />
            <span><strong>Instant Hotkey:</strong> Rebuild active text in-place (<code>Ctrl+Alt+Space</code>).</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-purple-400 shrink-0" />
            <span><strong>5-Block Blueprint:</strong> Structure, Components, Copy, Motion & Prompts.</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />
            <span><strong>Multi-Model:</strong> Midjourney v6, Higgsfield Video, ChatGPT & Cursor.</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span><strong>Lifetime License:</strong> Pay once, own forever — zero recurring subscription fees.</span>
          </div>
        </div>

        {/* Pricing Box */}
        <div className="mt-3.5 flex items-center justify-between rounded-xl border border-blue-500/30 bg-blue-950/20 px-3.5 py-2.5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Refinzi Lifetime Pro</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-extrabold text-white">$19</span>
              <span className="text-xs line-through text-zinc-500">$79</span>
              <span className="text-[11px] text-emerald-400 font-semibold">Save $60 today</span>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-amber-300 bg-amber-950/50 border border-amber-500/40 px-2 py-0.5 rounded-md">
            🔥 28 spots remaining
          </span>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-col gap-2.5">
          <Button
            size="default"
            variant="primary"
            className="w-full font-bold text-xs sm:text-sm py-2.5 shadow-md shadow-blue-600/30"
            onClick={() => {
              onDownload();
              onClose();
            }}
          >
            <Download className="h-4 w-4 mr-1.5" />
            Download Free for Windows (.exe)
          </Button>
          <Button
            variant="deal"
            size="default"
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
            <Sparkles className="h-3.5 w-3.5 mr-1 text-amber-300" />
            Claim Lifetime Pro — $19
          </Button>
        </div>

        {/* Trust Badges */}
        <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-zinc-400 border-t border-zinc-800/80 pt-2.5">
          <span className="flex items-center gap-1">
            <Lock className="h-2.5 w-2.5 text-emerald-400" /> 100% Safe
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-2.5 w-2.5 text-blue-400" /> 14-Day Guarantee
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Laptop className="h-2.5 w-2.5 text-purple-400" /> Windows 10 / 11 Native
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-emerald-500/50 bg-zinc-950 p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
          aria-label="Close download modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/40 mx-auto">
          <Download className="h-6 w-6 animate-bounce" />
        </div>

        <h3 className="mt-4 text-center text-2xl font-bold text-white">
          Your Refinzi 2.0 Download Has Started!
        </h3>
        <p className="mt-2 text-center text-sm text-zinc-400">
          Get ready to transform your prompt workflows across ChatGPT-4o, Midjourney v6, Higgsfield AI, Gemini 2.0 & Cursor.
        </p>

        {/* 3 Step Setup Guide */}
        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Quick 3-Step Setup:</p>
          <div className="flex items-start gap-3 text-xs text-zinc-300">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 font-bold text-blue-400">1</span>
            <span>Open <code className="text-blue-300 bg-blue-950/40 px-1 py-0.5 rounded">Refinzi-Setup-2.0.0.exe</code> in your downloads folder.</span>
          </div>
          <div className="flex items-start gap-3 text-xs text-zinc-300">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 font-bold text-purple-400">2</span>
            <span>Refinzi will launch silently as an ambient Orb in your Windows desktop corner.</span>
          </div>
          <div className="flex items-start gap-3 text-xs text-zinc-300">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 font-bold text-emerald-400">3</span>
            <span>Select any text anywhere and press <kbd className="bg-zinc-800 text-white px-1.5 py-0.5 rounded border border-zinc-700 font-mono">Ctrl+Alt+Space</kbd>!</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Button
            size="lg"
            variant="primary"
            className="w-full font-bold shadow-md shadow-blue-600/30"
            onClick={onClose}
          >
            Got It, Let's Build! 🚀
          </Button>
          <p className="text-center text-[11px] text-zinc-500">
            Didn't start? <a href="#download" onClick={(e) => { e.preventDefault(); alert("Starting direct download for Refinzi-2.0.0.exe..."); }} className="text-blue-400 underline hover:text-blue-300">Click here to retry download</a>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- navbar -------------------------------- */

function Navbar({ onOpenOffer, onDownload }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#08090d]/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6">
        <a href="#" className="flex items-center gap-2.5 text-lg font-bold text-zinc-50 transition-colors hover:text-white">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-md shadow-blue-500/30">
            <span className="text-sm leading-none select-none">🧠</span>
            <span className="absolute inset-0 rounded-full ring-1 ring-white/20" aria-hidden="true" />
          </span>
          <span>Refinzi <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">2.0</span></span>
        </a>

        <ul className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="text-sm text-zinc-400 transition-colors hover:text-zinc-50 font-medium"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          <Button
            variant="deal"
            size="sm"
            onClick={onOpenOffer}
          >
            <Flame className="h-3.5 w-3.5" />
            Lifetime Deal $19
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onDownload}
          >
            <Download className="h-3.5 w-3.5" />
            Download for Windows
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className="rounded-lg border border-zinc-800 p-2 text-zinc-300 transition-colors hover:border-zinc-600 md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/[0.08] bg-[#08090d]/95 backdrop-blur-xl md:hidden">
          <ul className="mx-auto flex max-w-[1200px] flex-col gap-1 px-4 py-4">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-50 font-medium"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="pt-2 flex flex-col gap-2">
              <Button
                variant="deal"
                size="default"
                onClick={() => { setOpen(false); onOpenOffer(); }}
                className="w-full"
              >
                <Flame className="h-4 w-4" />
                Lifetime Deal — $19
              </Button>
              <Button
                variant="primary"
                size="default"
                onClick={() => { setOpen(false); onDownload(); }}
                className="w-full"
              >
                <Download className="h-4 w-4" />
                Download Free for Windows
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
  const [activeMode, setActiveMode] = useState("hold"); // "tap" | "hold"
  const [isHolding, setIsHolding] = useState(false);
  const [holdTimer, setHoldTimer] = useState(null);

  const startHold = () => {
    setIsHolding(true);
    const timer = setTimeout(() => {
      setActiveMode("hold");
      setIsHolding(false);
    }, 350);
    setHoldTimer(timer);
  };

  const endHold = () => {
    if (holdTimer) clearTimeout(holdTimer);
    setIsHolding(false);
  };

  return (
    <Card className="luxury-surface relative rounded-2xl p-5 sm:p-6 shadow-2xl">
      {/* Window chrome header */}
      <div className="mb-4 flex items-center justify-between">
        <div aria-hidden="true" className="flex gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-zinc-950 p-1 border border-white/[0.08]">
          <button
            type="button"
            onClick={() => setActiveMode("tap")}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
              activeMode === "tap"
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/40 font-bold shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            ⚡ Tap Mode
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("hold")}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
              activeMode === "hold"
                ? "bg-purple-500/20 text-purple-400 border border-purple-500/40 font-bold shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            🧠 Hold Mode (300ms)
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center">
        {/* Interactive glowing orb */}
        <div className="flex flex-col items-center">
          <div
            onMouseDown={startHold}
            onMouseUp={endHold}
            onMouseLeave={endHold}
            onClick={() => setActiveMode((prev) => (prev === "tap" ? "hold" : "tap"))}
            className={`relative flex items-center justify-center h-16 w-16 cursor-pointer rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-md shadow-blue-600/30 transition-all duration-300 ${
              isHolding ? "scale-90 ring-4 ring-purple-400 ring-offset-2 ring-offset-zinc-950" : "hover:scale-105 animate-pulse"
            }`}
            role="button"
            tabIndex={0}
            aria-label="Click or hold Refinzi Orb"
            title="Click for Tap mode, Hold for Blueprint mode"
          >
            <span className="text-xl select-none">{activeMode === "tap" ? "⚡" : "🧠"}</span>
          </div>
          <p className="mt-3 text-xs font-medium tracking-wide text-zinc-400 text-center">
            {activeMode === "tap"
              ? "⚡ Single Tap · In-place prompt rebuild active"
              : "🧠 Press & Hold 300ms · 5-Block Blueprint active"}
          </p>
        </div>

        {/* Connector line */}
        <div aria-hidden="true" className="my-3.5 h-5 w-px bg-gradient-to-b from-blue-500/50 to-transparent" />

        {/* Dynamic Display Panel */}
        {activeMode === "tap" ? (
          <div className="w-full rounded-xl border border-white/[0.1] bg-zinc-900/90 p-3.5 transition-all shadow-inner">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
                ⚡ Instant In-Place Rebuild
              </span>
              <Badge variant="muted" className="px-2 py-0.5 tracking-normal text-[11px] font-mono">Ctrl+Alt+Space</Badge>
            </div>
            <div className="flex flex-col gap-2 text-xs">
              <div className="rounded-lg bg-zinc-950/80 p-2.5 border border-white/[0.08]">
                <span className="text-zinc-400 block mb-1 font-mono uppercase text-[10px] font-semibold">Before (Selected Text)</span>
                <p className="text-zinc-200 font-mono">"cyberpunk sports car in rain"</p>
              </div>
              <div className="rounded-lg bg-blue-950/40 p-2.5 border border-blue-500/40">
                <span className="text-blue-300 block mb-1 font-mono uppercase text-[10px] font-semibold">After (Midjourney / ChatGPT Spec)</span>
                <p className="text-zinc-100 font-mono leading-relaxed text-[11px]">
                  "/imagine cinematic 35mm anamorphic wide shot of futuristic hypercar in neon rain, raytraced reflections, volumetric atmospheric haze --ar 16:9 --v 6.0"
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full rounded-xl border border-white/[0.1] bg-zinc-900/90 p-3.5 transition-all shadow-inner">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
                🧠 5-Block Architectural Blueprint
              </span>
              <Badge variant="muted" className="px-2 py-0.5 tracking-normal text-[11px] font-mono">Hold 300ms</Badge>
            </div>

            <div className="flex flex-col gap-1.5">
              {BLUEPRINT_BLOCKS.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-lg bg-zinc-950/80 border border-white/[0.08] px-3 py-2 text-xs text-zinc-100 font-medium transition-all hover:bg-zinc-800 hover:border-purple-500/40"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-purple-400" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function Hero({ onOpenOffer, onDownload }) {
  return (
    <section className="relative flex min-h-[85vh] items-center py-12 sm:py-16" id="hero">
      <HeroGlows />

      <div className="relative mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-12 sm:gap-14 px-4 sm:px-6 lg:grid-cols-2">
        {/* Left column */}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="border-blue-500/40 text-blue-400 bg-blue-950/40 font-bold px-3 py-1">
              ⚡ REFINZI 2.0 FOR WINDOWS
            </Badge>
            <span className="text-xs text-amber-300 font-bold flex items-center gap-1 bg-amber-500/15 border border-amber-500/40 px-2.5 py-1 rounded-full">
              <Flame className="h-3 w-3 text-amber-400 animate-pulse" /> Launch Special
            </span>
          </div>

          <h1 className="mt-5 text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-white">
            Stop Re-Prompting AI.{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Rebuild in 2 Seconds.
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-zinc-300">
            Highlight any rough text in Windows. Press <kbd className="bg-zinc-800 text-blue-400 px-2 py-1 rounded-lg border border-zinc-600 font-mono text-sm font-bold">Ctrl+Alt+Space</kbd>. Get a production-grade prompt rebuilt in-place — or hold 300ms for a full 5-block blueprint. Works with <strong className="text-white">ChatGPT, Gemini, Midjourney, Higgsfield, Cursor & Claude</strong>.
          </p>

          {/* Call to action buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button
              size="lg"
              variant="primary"
              onClick={onDownload}
            >
              <Download className="h-5 w-5" />
              Download Free for Windows
            </Button>
            <Button
              variant="deal"
              size="lg"
              onClick={onOpenOffer}
            >
              <Flame className="h-5 w-5" />
              Lifetime Deal — $19
            </Button>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-zinc-300 font-medium">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <Check className="h-3.5 w-3.5" /> 100% Free BYOK Version
            </span>
            <span className="flex items-center gap-1">
              <Check className="h-3.5 w-3.5 text-blue-400" /> Windows 10 & 11 Native
            </span>
            <span className="flex items-center gap-1">
              <Check className="h-3.5 w-3.5 text-purple-400" /> No Credit Card Required
            </span>
          </div>

          {/* Social Proof Strip */}
          <div className="mt-7 flex items-center gap-4 border-t border-white/[0.08] pt-5">
            <div className="flex -space-x-2 shrink-0">
              <img className="inline-block h-8 w-8 rounded-full ring-2 ring-zinc-950 object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="User 1" loading="lazy" decoding="async" />
              <img className="inline-block h-8 w-8 rounded-full ring-2 ring-zinc-950 object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" alt="User 2" loading="lazy" decoding="async" />
              <img className="inline-block h-8 w-8 rounded-full ring-2 ring-zinc-950 object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" alt="User 3" loading="lazy" decoding="async" />
              <img className="inline-block h-8 w-8 rounded-full ring-2 ring-zinc-950 object-cover" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80" alt="User 4" loading="lazy" decoding="async" />
            </div>
            <div>
              <div className="flex items-center text-amber-400 text-xs">
                {"★★★★★"}
                <span className="ml-1.5 font-bold text-white">4.9/5</span>
              </div>
              <p className="text-xs text-zinc-400">Loved by <strong className="text-zinc-100 font-bold">14,800+</strong> prompt creators & devs</p>
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
      <section className="border-y border-white/[0.08] bg-zinc-950/60 py-8 sm:py-10" id="workspaces">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 text-center">
          <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-zinc-400">
            Seamlessly feeds your favourite AI models & creative engines
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 items-center justify-center">
            {WORKSPACES.map(({ name, Logo, desc }) => (
              <div
                key={name}
                className="luxury-surface group flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-zinc-400 ring-1 ring-white/[0.08] group-hover:text-blue-400 group-hover:ring-blue-500/40 group-hover:scale-105 transition-all">
                  <Logo className="h-5 w-5" />
                </span>
                <span className="text-xs font-bold text-zinc-200 group-hover:text-white">
                  {name}
                </span>
                <span className="text-[10px] text-zinc-500 text-center leading-tight">
                  {desc}
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
    }, 300);
  };

  return (
    <section className="py-16 sm:py-20 relative overflow-hidden" id="demo">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto">
            <Badge variant="outline" className="text-purple-400 border-purple-500/40 bg-purple-950/20">
              ⚡ Try The Refinzi Transformation
            </Badge>
            <h2 className="mt-3.5 text-2xl sm:text-4xl font-bold tracking-tight text-white">
              See How Refinzi Supercharges Any Prompt
            </h2>
            <p className="mt-2 text-zinc-400 text-sm">
              Select an AI model below and see how raw thoughts turn into master execution blueprints in milliseconds.
            </p>
          </div>
        </Reveal>

        {/* Model Tabs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
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
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  isSelected
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md shadow-blue-500/25 border border-white/20"
                    : "bg-zinc-900/80 text-zinc-400 border border-white/[0.08] hover:text-zinc-200 hover:border-zinc-700"
                }`}
              >
                <Icon className="h-4 w-4" />
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Interactive Comparison Box */}
        <Reveal delay={100}>
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
            {/* Raw Input Box */}
            <Card className="luxury-surface flex flex-col justify-between p-5 sm:p-6">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Before: Rough User Thought
                  </span>
                  <Badge variant="muted" className="text-[11px]">Vague Prompt</Badge>
                </div>
                <div className="mt-4 rounded-xl bg-zinc-900/80 p-3.5 border border-white/[0.06] font-mono text-xs sm:text-sm text-zinc-300 break-words">
                  "{selectedPreset.raw}"
                </div>
                <p className="mt-3.5 text-xs text-zinc-500 leading-relaxed">
                  ⚠️ <strong>The bottleneck:</strong> Standard AI models produce generic, uninspired outputs from basic prompts, forcing you to re-prompt 5-10 times.
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-white/[0.08] flex items-center justify-between">
                <span className="text-xs text-zinc-400">Windows Global Shortcut</span>
                <kbd className="bg-zinc-900 text-blue-400 font-mono text-xs px-2.5 py-1 rounded border border-zinc-700">
                  Ctrl + Alt + Space
                </kbd>
              </div>
            </Card>

            {/* Rebuilt Output Box */}
            <Card className="luxury-surface-glow relative flex flex-col justify-between p-5 sm:p-6">
              <Badge className="absolute -top-3 right-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-[11px]">
                {selectedPreset.stats}
              </Badge>

              <div>
                <div className="flex items-center justify-between pb-3 border-b border-blue-500/20">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-400" />
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                      After: Rebuilt {selectedPreset.label} Spec
                    </span>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 px-3 py-1.5 rounded-lg border border-white/[0.1] transition-all"
                  >
                    {copied ? <CheckCheck className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? "Copied!" : "Copy Prompt"}</span>
                  </button>
                </div>

                <div className={`mt-4 rounded-xl bg-zinc-950/90 p-3.5 border border-blue-500/30 font-mono text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto break-words ${isRebuilding ? "opacity-50 animate-pulse" : ""}`}>
                  {selectedPreset.rebuilt}
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-blue-500/20 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Ready to paste into {selectedPreset.label}
                </span>
                <Button size="sm" variant="primary" onClick={onDownload}>
                   <Download className="h-3.5 w-3.5" /> Download Refinzi Free
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
      body: "Highlight rough instructions, vague ideas, or code anywhere in Windows (ChatGPT, Discord, VS Code, Browser, Figma).",
    },
    {
      icon: Layers,
      title: "2. Click or Hold the Orb",
      body: "Quick click or hotkey (Ctrl+Alt+Space) for instant in-place prompt rebuild ⚡. Press & hold for 300ms to synthesize the deep 5-block architectural Blueprint 🧠.",
    },
    {
      icon: Zap,
      title: "3. Instant 1st-Try Perfection",
      body: "Paste production-ready prompts into ChatGPT-4o, Midjourney v6, Higgsfield AI, Gemini 2.0, Cursor or Claude 3.5. Zero context switching.",
    },
  ];

  return (
    <section className="py-16 sm:py-20 border-t border-white/[0.08] bg-zinc-950/40" id="features">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto">
            <Badge variant="outline" className="text-blue-400 border-blue-500/40">⚡ How It Works</Badge>
            <h2 className="mt-3.5 text-2xl sm:text-4xl font-bold tracking-tight text-white">
              3 Steps. Zero Friction.
            </h2>
            <p className="mt-2 text-zinc-400 text-sm">
              No browser extensions. No window switching. Just highlight, click, and paste.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, index) => (
            <Reveal key={title} delay={index * 90}>
              <Card className="luxury-surface group h-full p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 ring-1 ring-blue-500/20">
                    <Icon className="h-5 w-5 text-blue-400 transition-transform group-hover:scale-110" />
                  </div>
                  <span className="text-xs font-mono font-bold text-zinc-500">
                    STEP {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="text-base font-bold text-zinc-100">{title}</h3>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-400">{body}</p>
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
    <section className="border-t border-white/[0.08] bg-zinc-950/60 py-16 sm:py-20" id="blueprint">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto">
            <Badge variant="outline" className="text-purple-400 border-purple-500/40 bg-purple-950/20">
              🧠 The 5-Block Blueprint Engine
            </Badge>
            <h2 className="mt-3.5 text-2xl sm:text-4xl font-bold tracking-tight text-zinc-50">
              Inside Every Blueprint
            </h2>
            <p className="mt-2 text-zinc-400 text-xs sm:text-sm">
              Hold the Orb for 300ms to synthesize an entire architectural specification — not just a prompt.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BLUEPRINT_DETAILS.map(({ icon: Icon, title, desc }, index) => (
            <Reveal key={title} delay={index * 70} className="h-full">
              <Card className="luxury-surface group h-full p-5 sm:p-6">
                <div className="mb-3.5 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 ring-1 ring-purple-500/20">
                  <Icon className="h-5 w-5 text-purple-400 transition-transform group-hover:scale-110" />
                </div>
                <h3 className="text-base font-bold text-zinc-100">{title}</h3>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-400">{desc}</p>
              </Card>
            </Reveal>
          ))}

          {/* Mini-CTA Card */}
          <Reveal delay={BLUEPRINT_DETAILS.length * 70} className="h-full">
            <Card className="luxury-surface-glow relative flex h-full flex-col justify-between overflow-hidden p-5 sm:p-6">
              <div>
                <Sparkles className="h-6 w-6 text-purple-400" />
                <h3 className="mt-3 text-base font-bold text-zinc-50">
                  Pre-Formatted for Your Model
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                  Every output is tuned for the exact context window of ChatGPT-4o, Midjourney, Higgsfield, Gemini, Cursor or Claude.
                </p>
              </div>
              <Button variant="primary" onClick={onDownload} size="default" className="mt-4 w-full">
                <Download className="h-4 w-4" />
                Try It Free On Windows
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
    <section className="py-16 sm:py-20 border-t border-white/[0.08]" id="use-cases">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto">
            <Badge variant="outline">🎯 Creative & Technical Workflows</Badge>
            <h2 className="mt-3.5 text-2xl sm:text-4xl font-bold tracking-tight text-zinc-50">
              One Ambient Orb, Endless Workflows
            </h2>
            <p className="mt-2 text-zinc-400 text-sm">
              From photorealistic Midjourney v6 art to complex fullstack Cursor architecture.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
          {USE_CASES.map(({ icon: Icon, title, body, tag }, index) => (
            <Reveal key={title} delay={index * 70} className="h-full">
              <Card className="luxury-surface group flex h-full flex-col justify-between p-6">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 ring-1 ring-blue-500/20">
                      <Icon className="h-5 w-5 text-blue-400 transition-transform group-hover:scale-110" />
                    </div>
                    <Badge variant="muted" className="text-xs">{tag}</Badge>
                  </div>
                  <h3 className="mt-4 text-base sm:text-lg font-bold text-zinc-100">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{body}</p>
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
    <section className="py-16 sm:py-20 border-t border-white/[0.08] bg-zinc-950/60">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto">
            <Badge variant="outline" className="text-amber-400 border-amber-500/40 bg-amber-950/20">
              ⭐ Verified User Reviews
            </Badge>
            <h2 className="mt-3.5 text-2xl sm:text-4xl font-bold tracking-tight text-white">
              Loved by 14,800+ Creators & Engineers
            </h2>
            <p className="mt-2 text-zinc-400 text-sm">
              Here is how Refinzi 2.0 transforms daily workflows.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, idx) => (
            <Reveal key={t.name} delay={idx * 80}>
              <Card className="luxury-surface h-full p-5 sm:p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-amber-400 text-xs mb-3">
                    {"★".repeat(t.rating)}
                  </div>
                  <p className="text-xs font-semibold text-blue-400 mb-2 uppercase tracking-wide">
                    "{t.highlight}"
                  </p>
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed italic">
                    "{t.text}"
                  </p>
                </div>

                <div className="mt-5 flex items-center gap-3 pt-3.5 border-t border-white/[0.08]">
                  <img src={t.avatar} alt={t.name} className="h-9 w-9 rounded-full object-cover ring-1 ring-zinc-700" loading="lazy" decoding="async" />
                  <div>
                    <h4 className="text-xs font-bold text-white">{t.name}</h4>
                    <p className="text-[11px] text-zinc-500">{t.role}</p>
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
  "Bring your own API keys (BYOK)",
  "Direct routing with 0% markup",
  "Daily Rebuild limit via Refinzi Gateway",
  "Full 5-Block Blueprint engine",
  "Tuned for ChatGPT-4o, Midjourney v6, Higgsfield AI, Gemini 2.0, Cursor & Claude 3.5",
  "Windows 10/11 ambient Orb integration",
];

const PRO_FEATURES = [
  "Everything in Free / BYOK",
  "Specialized Claude 3.5 Sonnet / GPT-4o high-speed routing",
  "Zero API setup required (Managed Gateway)",
  "Cloud sync your custom prompt presets",
  "Priority 24/7 direct support",
  "Lifetime free updates (No subscription ever)",
  "Early access to Mac / Linux builds",
];

function FeatureList({ items }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-xs sm:text-sm text-zinc-300">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Pricing({ onOpenOffer, onDownload }) {
  return (
    <section className="py-16 sm:py-20 border-t border-white/[0.08]" id="pricing">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto">
            <Badge variant="outline">Simple, Transparent Pricing</Badge>
            <h2 className="mt-3.5 text-2xl sm:text-4xl font-bold tracking-tight text-zinc-50">
              Start Rebuilding Today
            </h2>
            <p className="mt-2 text-zinc-400 text-sm">
              Download 100% free with your own keys, or lock in the Lifetime Pro deal.
            </p>
          </div>
        </Reveal>

        <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2 items-stretch">
          {/* Card 1 — Free / BYOK */}
          <Card className="luxury-surface flex flex-col justify-between p-6 sm:p-7">
            <div>
              <Badge variant="muted">Forever Free</Badge>
              <h3 className="mt-2.5 text-xl font-bold text-zinc-50">Free / BYOK</h3>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-bold text-zinc-50">$0</span>
                <span className="text-sm text-zinc-500">/ forever</span>
              </div>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                Perfect for creators and developers who want to use their own Gemini or OpenRouter keys.
              </p>

              <div className="my-5 border-t border-white/[0.08]" />
              <FeatureList items={FREE_FEATURES} />
            </div>

            <Button
              variant="secondary"
              size="lg"
              onClick={onDownload}
              className="mt-6 w-full"
            >
              <Download className="h-4 w-4" />
              Download Free for Windows
            </Button>
          </Card>

          {/* Card 2 — Pro Lifetime Deal */}
          <Card className="luxury-surface-glow relative flex flex-col justify-between p-6 sm:p-7">
            <Badge className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-amber-500 text-zinc-950 font-extrabold px-4 py-1 text-xs shadow-lg">
              🔥 LIMITED LAUNCH — 73% OFF
            </Badge>

            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Lifetime License</span>
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-950/30 text-[11px]">
                  Pay Once, Own Forever
                </Badge>
              </div>
              <h3 className="mt-2 text-xl font-bold text-zinc-50">Refinzi Lifetime Pro</h3>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-white">$19</span>
                <span className="text-base line-through text-zinc-500">$79</span>
                <span className="text-xs text-emerald-400 font-semibold">one-time payment</span>
              </div>
              <p className="mt-2 text-xs text-zinc-300 leading-relaxed">
                Zero configuration. Managed high-speed routing. No monthly subscription.
              </p>

              <div className="my-5 border-t border-blue-500/30" />
              <FeatureList items={PRO_FEATURES} />
            </div>

            <div className="mt-6">
              <Button
                variant="deal"
                size="lg"
                onClick={onOpenOffer}
                className="w-full py-3.5"
              >
                <Sparkles className="h-4 w-4" />
                Claim Lifetime Pro — $19
              </Button>
              <p className="mt-2.5 text-center text-[11px] text-zinc-400">
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
    <section className="py-16 sm:py-20 bg-zinc-950/60 border-t border-white/[0.08]" id="faq">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto">
            <Badge variant="outline">FAQ</Badge>
            <h2 className="mt-3.5 text-2xl sm:text-3xl font-bold tracking-tight text-zinc-50">
              Frequently Asked Questions
            </h2>
          </div>
        </Reveal>

        <Accordion className="mx-auto mt-10 max-w-2xl">
          {FAQS.map(({ question, answer }) => (
            <AccordionItem key={question} question={question} answer={answer} />
          ))}
        </Accordion>
      </div>
    </section>
  );
}

/* ---------------------------- final CTA + footer --------------------------- */

function FinalCTA({ onOpenOffer, onDownload }) {
  return (
    <section className="relative py-16 sm:py-20 text-center border-t border-white/[0.08]" id="download">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[350px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/15 blur-[140px]"
      />
      <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6">
        <Reveal>
          <Badge variant="outline" className="text-blue-400 border-blue-500/40 mb-3.5">
            🚀 Ready to Rebuild in 2 Seconds?
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Your AI Deserves Better Prompts.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-300 max-w-xl mx-auto leading-relaxed">
            Download Refinzi 2.0 and get flawless outputs from ChatGPT, Midjourney, Higgsfield, Gemini & Cursor — on the very first try.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              variant="primary"
              onClick={onDownload}
            >
              <Download className="h-5 w-5" />
              Download for Windows (Free)
            </Button>
            <Button
              variant="deal"
              size="lg"
              onClick={onOpenOffer}
            >
              <Flame className="h-5 w-5" />
              Claim Lifetime Pro — $19
            </Button>
          </div>

          <p className="mt-3.5 text-xs text-zinc-400">
            Windows 10/11 · 84 MB · 100% Virus-Free · Zero Configuration Required
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------- Sticky Conversion Bar ------------------------- */

function StickyConversionBar({ show, onOpenOffer, onDownload }) {
  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/[0.08] bg-[#08090d]/95 backdrop-blur-xl px-4 py-2.5 shadow-2xl transition-all animate-in slide-in-from-bottom-5">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4">
        <div className="hidden sm:flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xs shadow-sm">
            🧠
          </span>
          <div>
            <p className="text-xs font-bold text-white">Refinzi 2.0 for Windows</p>
            <p className="text-[11px] text-zinc-400">Transform any prompt in &lt;2s (Ctrl+Alt+Space)</p>
          </div>
        </div>

        <div className="flex w-full sm:w-auto items-center justify-end gap-2.5">
          <Button
            variant="deal"
            size="sm"
            onClick={onOpenOffer}
          >
            <Flame className="h-3.5 w-3.5" />
            $19 Lifetime
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={onDownload}
          >
            <Download className="h-3.5 w-3.5" />
            Download Free
          </Button>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/[0.08] py-8 bg-[#08090d] text-zinc-500 text-xs">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 px-4 sm:px-6 sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="text-sm">🧠</span>
          <span className="font-bold text-zinc-300">Refinzi 2.0</span>
          <span>— The ambient Windows prompt execution layer</span>
        </div>
        <nav aria-label="Legal" className="flex items-center gap-6">
          <a href="/privacy" className="text-zinc-500 transition-colors hover:text-zinc-200">Privacy Policy</a>
          <a href="/terms" className="text-zinc-500 transition-colors hover:text-zinc-200">Terms of Service</a>
          <a href="/docs" className="text-zinc-500 transition-colors hover:text-zinc-200">Documentation</a>
          <a href="mailto:support@refinzi.com" className="text-zinc-500 transition-colors hover:text-zinc-200">Support</a>
        </nav>
      </div>
    </footer>
  );
}

/* ---------------------------------- app ----------------------------------- */

export default function App() {
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isPaypalModalOpen, setIsPaypalModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);

  // Auto show lifetime offer popup once after 4.5 seconds
  useEffect(() => {
    const hasSeenPopup = sessionStorage.getItem("refinzi_offer_seen");
    if (!hasSeenPopup) {
      const timer = setTimeout(() => {
        setIsOfferModalOpen(true);
        sessionStorage.setItem("refinzi_offer_seen", "true");
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Performance-optimized scroll listener (rAF throttled)
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (window.scrollY > 350) {
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

  const handleTriggerDownload = () => {
    setIsDownloadModalOpen(true);
    // Trigger download
    const link = document.createElement("a");
    link.href = "#download-refinzi";
    link.setAttribute("download", "Refinzi-Setup-2.0.0.exe");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenCheckout = () => {
    setIsOfferModalOpen(false);
    setIsPaypalModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#08090d] font-sans text-zinc-50 selection:bg-blue-500/30 selection:text-white pb-12 sm:pb-0">
      <OrbCursor />
      <Navbar
        onOpenOffer={() => setIsOfferModalOpen(true)}
        onDownload={handleTriggerDownload}
      />
      <main>
        <Hero
          onOpenOffer={handleOpenCheckout}
          onDownload={handleTriggerDownload}
        />
        <TrustBar />
        <LiveDemoSection onDownload={handleTriggerDownload} />
        <Mechanism />
        <Blueprint onDownload={handleTriggerDownload} />
        <UseCases />
        <Testimonials />
        <Pricing
          onOpenOffer={handleOpenCheckout}
          onDownload={handleTriggerDownload}
        />
        <FAQ />
        <FinalCTA
          onOpenOffer={handleOpenCheckout}
          onDownload={handleTriggerDownload}
        />
      </main>
      <Footer />

      {/* Floating Lifetime Deal Button */}
      <button
        onClick={handleOpenCheckout}
        className={`fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-2xl hover:scale-105 transition-all duration-300 border border-white/20 ${
          showStickyBar ? "opacity-0 pointer-events-none translate-y-6" : "opacity-100 translate-y-0"
        }`}
        aria-label="Open PayPal checkout for lifetime deal"
      >
        <Flame className="h-4 w-4 animate-bounce" />
        <span>73% OFF Lifetime Deal</span>
      </button>

      {/* Popups & Modals */}
      <LifetimeOfferModal
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        onDownload={handleTriggerDownload}
        onOpenCheckout={handleOpenCheckout}
      />

      <PaypalCheckoutModal
        isOpen={isPaypalModalOpen}
        onClose={() => setIsPaypalModalOpen(false)}
        onDownload={handleTriggerDownload}
      />

      <DownloadSuccessModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />

      {/* Sticky Bottom Bar */}
      <StickyConversionBar
        show={showStickyBar}
        onOpenOffer={handleOpenCheckout}
        onDownload={handleTriggerDownload}
      />
    </div>
  );
}
