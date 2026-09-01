import React from "react";
import { Check, X, Sparkles, Zap, Shield, Layers } from "lucide-react";
import { Reveal } from "./Reveal.jsx";

const COMPARISON_ROWS = [
  {
    feature: "Works in ANY Windows App (No switching tabs)",
    refinzi: true,
    chatgpt: false,
    extensions: "Browser only",
    promptPerfect: false,
  },
  {
    feature: "1-Click In-Place Prompt Transformation (Ctrl+Alt+Space)",
    refinzi: true,
    chatgpt: false,
    extensions: false,
    promptPerfect: false,
  },
  {
    feature: "Secondary 300ms Hold 5-Block Blueprint Engine",
    refinzi: true,
    chatgpt: false,
    extensions: false,
    promptPerfect: false,
  },
  {
    feature: "Pricing Model",
    refinzi: "Free BYOK / $12 Lifetime",
    chatgpt: "Free / $20/mo",
    extensions: "$10–$25/mo",
    promptPerfect: "$29–$99/mo",
  },
  {
    feature: "Local-First Privacy (Zero Prompt Logging)",
    refinzi: true,
    chatgpt: false,
    extensions: false,
    promptPerfect: false,
  },
  {
    feature: "Zero-Markup BYOK (Gemini / OpenRouter)",
    refinzi: true,
    chatgpt: false,
    extensions: false,
    promptPerfect: false,
  },
];

export function RefinziComparison() {
  return (
    <section className="py-12 sm:py-16 border-t border-white/[0.06] bg-zinc-950/50" id="comparison">
      <div className="mx-auto max-w-[1140px] px-4 sm:px-6">
        <Reveal>
          <div className="text-center max-w-xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-400 mb-2">
              <Sparkles className="h-3 w-3" />
              <span>Direct Comparison</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Why Creators Choose Refinzi Over Expensive SaaS Tools
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-zinc-400">
              No bloated web dashboards. No monthly subscription lock-in. Just pure, ambient Windows execution.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-zinc-900/50 backdrop-blur-md shadow-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] bg-zinc-950/80">
                  <th className="p-3.5 sm:p-4 font-semibold text-zinc-400 w-2/5">Capability</th>
                  <th className="p-3.5 sm:p-4 font-extrabold text-blue-400 bg-blue-950/30 border-x border-blue-500/20 text-center w-1/4">
                    <div className="flex items-center justify-center gap-1">
                      <span>🧠 Refinzi 2.0</span>
                    </div>
                  </th>
                  <th className="p-3.5 sm:p-4 font-semibold text-zinc-400 text-center">ChatGPT Projects</th>
                  <th className="p-3.5 sm:p-4 font-semibold text-zinc-400 text-center hidden sm:table-cell">Monthly Prompt SaaS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {COMPARISON_ROWS.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3.5 sm:p-4 font-medium text-zinc-200">
                      {row.feature}
                    </td>
                    <td className="p-3.5 sm:p-4 text-center bg-blue-950/20 border-x border-blue-500/20 font-bold">
                      {typeof row.refinzi === "boolean" ? (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-bold font-mono">{row.refinzi}</span>
                      )}
                    </td>
                    <td className="p-3.5 sm:p-4 text-center text-zinc-400">
                      {typeof row.chatgpt === "boolean" ? (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-zinc-500">
                          <X className="h-3.5 w-3.5" />
                        </span>
                      ) : (
                        <span className="text-zinc-400">{row.chatgpt}</span>
                      )}
                    </td>
                    <td className="p-3.5 sm:p-4 text-center text-zinc-400 hidden sm:table-cell">
                      {typeof row.promptPerfect === "boolean" ? (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-zinc-500">
                          <X className="h-3.5 w-3.5" />
                        </span>
                      ) : (
                        <span className="text-zinc-400 line-through">{row.promptPerfect}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default RefinziComparison;
