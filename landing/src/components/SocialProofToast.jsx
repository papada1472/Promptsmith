import React, { useState, useEffect } from "react";
import { X, Sparkles, Zap, Lock, Key } from "lucide-react";

const WORKFLOW_TIPS = [
  {
    icon: Zap,
    title: "Windows Shortcut",
    desc: "Press Ctrl + Alt + Space to rebuild text without touching your mouse.",
  },
  {
    icon: Sparkles,
    title: "5-Block Blueprint",
    desc: "Hold the Orb for 300ms to generate complete UI component specs.",
  },
  {
    icon: Key,
    title: "Free BYOK Mode",
    desc: "Connect your Gemini or OpenRouter key for 100% free prompt synthesis.",
  },
  {
    icon: Lock,
    title: "Privacy First",
    desc: "Runs locally with Windows DPAPI encryption. Zero prompts logged.",
  },
];

export function SocialProofToast({ onOpenOffer }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    const initialTimer = setTimeout(() => {
      setVisible(true);
    }, 6000);

    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % WORKFLOW_TIPS.length);
        setVisible(true);
      }, 800);
    }, 20000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [dismissed]);

  if (dismissed || !visible) return null;

  const item = WORKFLOW_TIPS[currentIndex];
  const Icon = item.icon;

  return (
    <aside
      aria-label="Workflow tip"
      className="fixed bottom-4 left-4 z-30 hidden sm:flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-zinc-950/90 py-2 px-3 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200 max-w-xs"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs">
        <Icon className="h-3.5 w-3.5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="text-[11px] font-bold text-zinc-200 truncate">{item.title}</p>
        </div>
        <p className="text-[10px] text-zinc-400 truncate">
          {item.desc}
        </p>
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="rounded p-0.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
        aria-label="Dismiss tip"
      >
        <X className="h-3 w-3" />
      </button>
    </aside>
  );
}

export default SocialProofToast;
