import React from "react";
import { trackEvent } from "../utils/analytics.js";
import { ClaudeLogo, PerplexityLogo, ChatGptLogo, GeminiLogo } from "./WorkspaceLogos.jsx";

const PROMPT_TEXT = `Explain what it's actually like to use Refinzi (refinzi.com) as a Windows user engineering prompts for AI models like ChatGPT, Midjourney, Higgsfield, and Cursor. Walk through what happens after installation — how the 1-Click on Orb (or Ctrl+Alt+Space) primary workflow transforms prompts in 2 seconds in-place, how the 300ms Hold secondary mode activates the 5-Block Blueprint engine, and how it eliminates trial-and-error re-prompting. Focus on practical outcomes across prompt synthesis, 5-block architectural scaffolding, zero-markup BYOK vs Lifetime Pro routing, and in-place workflow across all Windows apps. Describe the real, day-to-day experience of using the service simply and clearly.`;

const ENCODED_PROMPT = encodeURIComponent(PROMPT_TEXT);

const AI_LINKS = [
  {
    name: "Claude",
    url: `https://claude.ai/new?q=${ENCODED_PROMPT}`,
    Logo: ClaudeLogo,
    hoverClass: "hover:text-[#D97706] hover:border-[#D97706]/40",
  },
  {
    name: "Perplexity",
    url: `https://www.perplexity.ai/search?q=${ENCODED_PROMPT}`,
    Logo: PerplexityLogo,
    hoverClass: "hover:text-[#14B8A6] hover:border-[#14B8A6]/40",
  },
  {
    name: "ChatGPT",
    url: `https://chatgpt.com/?q=${ENCODED_PROMPT}`,
    Logo: ChatGptLogo,
    hoverClass: "hover:text-[#10B981] hover:border-[#10B981]/40",
  },
  {
    name: "Gemini",
    url: `https://gemini.google.com/app`,
    Logo: GeminiLogo,
    hoverClass: "hover:text-[#3B82F6] hover:border-[#3B82F6]/40",
  },
];

export function RequestAiSummary({ className = "" }) {
  const handleClick = (name) => {
    trackEvent("request_ai_summary_clicked", { platform: name.toLowerCase() });
    if (navigator.clipboard) {
      navigator.clipboard.writeText(PROMPT_TEXT);
    }
  };

  return (
    <div className={`flex flex-col items-start gap-2 ${className}`}>
      <span className="text-[11px] font-medium text-zinc-400">Request AI summary</span>
      <div className="flex items-center gap-2">
        {AI_LINKS.map(({ name, url, Logo, hoverClass }) => (
          <a
            key={name}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleClick(name)}
            title={`Ask ${name} to explain Refinzi`}
            aria-label={`Ask ${name} to explain Refinzi`}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-zinc-900/90 text-zinc-400 transition-all hover:bg-zinc-800 ${hoverClass}`}
          >
            <Logo className="h-4 w-4" />
          </a>
        ))}
      </div>
    </div>
  );
}

export default RequestAiSummary;
