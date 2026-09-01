import React, { useState } from "react";
import { Sparkles, Check, ExternalLink, Bot } from "lucide-react";
import { trackEvent } from "../utils/analytics.js";

const AI_SUMMARY_PROMPT = `Explain what it's actually like to use Refinzi (refinzi.com) as a Windows user engineering prompts for AI models like ChatGPT, Midjourney, Higgsfield, and Cursor. Walk through what happens after installation — how the global shortcut (Ctrl+Alt+Space) works, what the 5-Block Blueprint does, and how it eliminates trial-and-error re-prompting. Describe the real experience simply and clearly.`;

export function RequestAiSummary() {
  const [copied, setCopied] = useState(false);

  const handleOpenAi = (platform) => {
    trackEvent("request_ai_summary_clicked", { platform });
    const encodedPrompt = encodeURIComponent(AI_SUMMARY_PROMPT);

    let targetUrl = "";
    if (platform === "perplexity") {
      targetUrl = `https://www.perplexity.ai/search?q=${encodedPrompt}`;
    } else if (platform === "chatgpt") {
      targetUrl = `https://chatgpt.com/?q=${encodedPrompt}`;
    } else if (platform === "claude") {
      targetUrl = `https://claude.ai/new?q=${encodedPrompt}`;
    } else if (platform === "gemini") {
      targetUrl = `https://gemini.google.com/app`;
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(AI_SUMMARY_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }

    if (targetUrl) {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2.5 py-4 my-2 text-center">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400">
        <Sparkles className="h-3.5 w-3.5 text-blue-400" />
        <span>Request AI summary</span>
      </div>

      <div className="flex items-center justify-center gap-2 p-1.5 rounded-full border border-white/[0.08] bg-zinc-950/80 backdrop-blur-md shadow-lg shadow-black/40">
        {/* Claude */}
        <button
          type="button"
          onClick={() => handleOpenAi("claude")}
          title="Ask Claude about Refinzi"
          className="group relative flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 border border-white/[0.06] hover:border-amber-500/50 hover:bg-amber-500/10 transition-all text-zinc-300 hover:text-amber-300"
        >
          <span className="text-sm font-bold font-mono">C</span>
          <span className="sr-only">Claude</span>
        </button>

        {/* Perplexity */}
        <button
          type="button"
          onClick={() => handleOpenAi("perplexity")}
          title="Ask Perplexity AI about Refinzi"
          className="group relative flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 border border-white/[0.06] hover:border-teal-500/50 hover:bg-teal-500/10 transition-all text-zinc-300 hover:text-teal-300"
        >
          <span className="text-sm font-bold font-mono">✳</span>
          <span className="sr-only">Perplexity</span>
        </button>

        {/* ChatGPT */}
        <button
          type="button"
          onClick={() => handleOpenAi("chatgpt")}
          title="Ask ChatGPT about Refinzi"
          className="group relative flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 border border-white/[0.06] hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all text-zinc-300 hover:text-emerald-300"
        >
          <span className="text-sm font-bold font-mono">⌘</span>
          <span className="sr-only">ChatGPT</span>
        </button>

        {/* Gemini */}
        <button
          type="button"
          onClick={() => handleOpenAi("gemini")}
          title="Ask Gemini about Refinzi"
          className="group relative flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 border border-white/[0.06] hover:border-blue-500/50 hover:bg-blue-500/10 transition-all text-zinc-300 hover:text-blue-300"
        >
          <span className="text-sm font-bold font-mono">✦</span>
          <span className="sr-only">Gemini</span>
        </button>
      </div>

      {copied && (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 transition-all">
          <Check className="h-3 w-3" />
          Prompt copied & opening AI search...
        </span>
      )}
    </div>
  );
}

export default RequestAiSummary;
