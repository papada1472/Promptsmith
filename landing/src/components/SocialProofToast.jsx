import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

const RECENT_ACTIVITIES = [
  { name: "Dev in London", flag: "🇬🇧", action: "claimed Lifetime Pro", time: "2m ago" },
  { name: "Alex R. in Munich", flag: "🇩🇪", action: "downloaded Refinzi for Windows", time: "4m ago" },
  { name: "Engineer in SF", flag: "🇺🇸", action: "activated Cursor blueprint", time: "6m ago" },
  { name: "Priya in Bengaluru", flag: "🇮🇳", action: "unlocked Lifetime Deal", time: "7m ago" },
  { name: "Marcus in Tokyo", flag: "🇯🇵", action: "downloaded Midjourney pack", time: "11m ago" },
  { name: "Indie in Toronto", flag: "🇨🇦", action: "claimed Lifetime Pro", time: "14m ago" },
];

export function SocialProofToast({ onOpenOffer }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    const initialTimer = setTimeout(() => {
      setVisible(true);
    }, 4000);

    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % RECENT_ACTIVITIES.length);
        setVisible(true);
      }, 800);
    }, 18000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [dismissed]);

  if (dismissed || !visible) return null;

  const item = RECENT_ACTIVITIES[currentIndex];

  return (
    <aside
      aria-label="Recent user activity"
      className="fixed bottom-4 left-4 z-30 hidden sm:flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-zinc-950/85 py-2 px-3 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200 max-w-xs"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-900 border border-white/[0.08] text-xs">
        <span>{item.flag}</span>
      </div>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={onOpenOffer}>
        <div className="flex items-center gap-1">
          <p className="text-[11px] font-semibold text-zinc-200 truncate">{item.name}</p>
          <span className="text-[9px] text-zinc-500">• {item.time}</span>
        </div>
        <p className="text-[10px] text-blue-400 font-medium truncate">
          {item.action}
        </p>
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="rounded p-0.5 text-zinc-500 hover:text-zinc-300 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="h-3 w-3" />
      </button>
    </aside>
  );
}

export default SocialProofToast;
