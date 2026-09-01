import React from "react";
import { trackEvent } from "../utils/analytics.js";

const PROMPT_TEXT = `Explain what it's actually like to use Refinzi (refinzi.com) as a Windows user engineering prompts for AI models like ChatGPT, Midjourney, Higgsfield, and Cursor. Walk through what happens after installation — how the global shortcut (Ctrl+Alt+Space) works, what the 5-Block Blueprint does, and how it eliminates trial-and-error re-prompting. Focus on practical outcomes across prompt synthesis, 5-block architectural scaffolding, zero-markup BYOK vs Lifetime Pro routing, and in-place workflow across all Windows apps. Describe the real, day-to-day experience of using the service simply and clearly.`;

const ENCODED_PROMPT = encodeURIComponent(PROMPT_TEXT);

const AI_LINKS = [
  {
    name: "Claude",
    url: `https://claude.ai/new?q=${ENCODED_PROMPT}`,
    // Official Claude Logo Icon
    icon: (
      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-2h2v2zm0-4h-2V7h2v5.5z" opacity="0" />
        <path d="M17.5 7.5l-2.8 1.4c-.4-.7-.9-1.2-1.6-1.5l1.2-2.9c1.4.6 2.5 1.7 3.2 3zm-9.3.9L5.4 7c.7-1.3 1.8-2.4 3.2-3l1.2 2.9c-.7.3-1.2.8-1.6 1.5zm8.9 7.7l2.9 1.2c-.7 1.4-1.8 2.4-3.2 3l-1.2-2.9c.7-.3 1.2-.8 1.5-1.3zm-10.2 0c.3.5.8 1 1.5 1.3L7.2 20.3c-1.4-.6-2.5-1.6-3.2-3l2.9-1.2zM12 6.5c3 0 5.5 2.5 5.5 5.5s-2.5 5.5-5.5 5.5S6.5 15 6.5 12 9 6.5 12 6.5z" />
      </svg>
    ),
  },
  {
    name: "Perplexity",
    url: `https://www.perplexity.ai/search?q=${ENCODED_PROMPT}`,
    // Perplexity Asterism Icon
    icon: (
      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
        <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "ChatGPT",
    url: `https://chatgpt.com/?q=${ENCODED_PROMPT}`,
    // OpenAI ChatGPT Swirl Icon
    icon: (
      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
        <path d="M22.28 9.37a5.98 5.98 0 0 0-.52-4.94 6.08 6.08 0 0 0-6.41-2.88 5.99 5.99 0 0 0-4.63-2.12c-3.1 0-5.69 2.3-6 5.37a5.98 5.98 0 0 0-3.9 2.87 6.07 6.07 0 0 0 .76 6.96 5.98 5.98 0 0 0 .52 4.94 6.08 6.08 0 0 0 6.41 2.88 5.99 5.99 0 0 0 4.63 2.12c3.1 0 5.69-2.3 6-5.37a5.98 5.98 0 0 0 3.9-2.87 6.07 6.07 0 0 0-.76-6.96zM12 14.65a2.65 2.65 0 1 1 2.65-2.65A2.65 2.65 0 0 1 12 14.65z" />
      </svg>
    ),
  },
  {
    name: "Grok / Gemini",
    url: `https://gemini.google.com/app`,
    // Starburst Icon
    icon: (
      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
        <path d="M12 0l2.5 8.5L23 11l-8.5 2.5L12 22l-2.5-8.5L1 11l8.5-2.5z" />
      </svg>
    ),
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
        {AI_LINKS.map(({ name, url, icon }) => (
          <a
            key={name}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleClick(name)}
            title={`Ask ${name} to explain Refinzi`}
            aria-label={`Ask ${name} to explain Refinzi`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-zinc-900/90 text-zinc-400 transition-all hover:border-white/25 hover:bg-zinc-800 hover:text-white"
          >
            {icon}
          </a>
        ))}
      </div>
    </div>
  );
}

export default RequestAiSummary;
