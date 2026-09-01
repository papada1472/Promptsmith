import React, { useState } from "react";
import { Check, X, Sparkles, Zap, Shield, Layers, Key, Lock, ArrowRight, Laptop } from "lucide-react";
import { Reveal } from "./Reveal.jsx";

const STACK_MATRIX = [
  {
    tool: "ChatGPT / Claude",
    icon: "💬",
    withoutRefinzi: "Vague 1-liner → generic output & endless re-prompting",
    withRefinzi: "Structured 5-block blueprint → authoritative, production-ready response",
    benefit: "Zero trial-and-error iterations",
  },
  {
    tool: "Midjourney / Higgsfield",
    icon: "🎨",
    withoutRefinzi: "\"cyberpunk car\" → 20 expensive fast-hour re-rolls",
    withRefinzi: "Optical lens vectors + lighting physics + aspect ratios on 1st try",
    benefit: "Saves fast-hours & GPU credits",
  },
  {
    tool: "Cursor / v0 / Claude Code",
    icon: "💻",
    withoutRefinzi: "\"build a landing page\" → broken components & hallucinations",
    withRefinzi: "5-Block architecture spec: section trees, design tokens & strict rules",
    benefit: "1st-try compiling frontend code",
  },
  {
    tool: "Gemini / OpenRouter (BYOK)",
    icon: "⚡",
    withoutRefinzi: "Raw prompts → massive context window & token waste",
    withRefinzi: "Model-calibrated system tokens → maximum token efficiency",
    benefit: "Cuts API costs by 60–80%",
  },
];

const FRICTION_MATRIX = [
  {
    dimension: "Context Switching",
    manual: "Tab → tab → tab (distracting)",
    extensions: "Locked to web browser only",
    refinzi: "Zero — works inside ANY Windows app",
    highlight: true,
  },
  {
    dimension: "API Key Ownership",
    manual: "N/A",
    extensions: "Their keys, 2x–5x price markup",
    refinzi: "Your keys, 0% markup forever (BYOK)",
    highlight: true,
  },
  {
    dimension: "Privacy & Data Retention",
    manual: "Pasted to 3rd party web apps",
    extensions: "Prompts logged on SaaS cloud servers",
    refinzi: "Local-first, DPAPI encrypted, zero logging",
    highlight: true,
  },
  {
    dimension: "Execution Speed",
    manual: "30–60 seconds per prompt",
    extensions: "10–15 seconds",
    refinzi: "<2 seconds in-place (1-Click)",
    highlight: true,
  },
  {
    dimension: "Output Quality",
    manual: "Depends entirely on prompt luck",
    extensions: "Static generic templates",
    refinzi: "Model-calibrated 5-Block Blueprint engine",
    highlight: true,
  },
];

export function RefinziComparison() {
  const [activeTab, setActiveTab] = useState("stack"); // "stack" | "friction"

  return (
    <section className="py-14 sm:py-20 border-t border-white/[0.06] bg-[#07080b] relative overflow-hidden" id="stack-layer">
      {/* Subtle background ambient glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] bg-blue-600/5 blur-[140px] rounded-full" />

      <div className="mx-auto max-w-[1140px] px-4 sm:px-6 relative">
        {/* Section Header */}
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-3.5 py-1 text-xs font-semibold text-blue-400 mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              <span>The Missing Prompt Engineering Layer</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              The Prompt Engineering Layer for Your Existing Stack
            </h2>
            <p className="mt-3 text-xs sm:text-base text-zinc-300 leading-relaxed">
              You already pay for <strong>ChatGPT Plus</strong>, <strong>Cursor Pro</strong>, and <strong>Midjourney</strong>. You already have <strong>Gemini</strong> and <strong>OpenRouter</strong> keys.
            </p>
            <p className="mt-1 text-xs sm:text-sm text-blue-400 font-semibold">
              Refinzi doesn't ask you to switch. It asks you to stop wasting them.
            </p>

            {/* Tab Switcher */}
            <div className="mt-6 inline-flex p-1 rounded-xl bg-zinc-900/90 border border-white/10 shadow-lg">
              <button
                onClick={() => setActiveTab("stack")}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === "stack"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Refinzi + Your AI Stack
              </button>
              <button
                onClick={() => setActiveTab("friction")}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === "friction"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                The BYOK & Speed Advantage
              </button>
            </div>
          </div>
        </Reveal>

        {/* Tab 1: Stack Matrix */}
        {activeTab === "stack" && (
          <Reveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STACK_MATRIX.map(({ tool, icon, withoutRefinzi, withRefinzi, benefit }) => (
                <div
                  key={tool}
                  className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-5 backdrop-blur-md hover:border-blue-500/30 transition-all shadow-xl space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl select-none">{icon}</span>
                      <h3 className="font-bold text-white text-sm sm:text-base">{tool}</h3>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      {benefit}
                    </span>
                  </div>

                  {/* Without vs With */}
                  <div className="space-y-2 text-xs">
                    <div className="rounded-xl bg-red-950/20 border border-red-500/20 p-2.5 flex items-start gap-2">
                      <X className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-red-400 block">Without Refinzi</span>
                        <p className="text-zinc-300 mt-0.5">{withoutRefinzi}</p>
                      </div>
                    </div>

                    <div className="rounded-xl bg-blue-950/30 border border-blue-500/30 p-2.5 flex items-start gap-2">
                      <Check className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-blue-400 block">With Refinzi (1-Click)</span>
                        <p className="text-white font-medium mt-0.5">{withRefinzi}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Banner callout */}
            <div className="mt-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-purple-950/20 to-blue-950/40 border border-blue-500/30 p-4 sm:p-5 text-center">
              <p className="text-xs sm:text-sm font-semibold text-zinc-200">
                💡 <span className="text-white">The Bottom Line:</span> You keep your existing AI subscriptions. Refinzi sits between your brain and your models, making every prompt worth <strong>10x more</strong> on the very first try.
              </p>
            </div>
          </Reveal>
        )}

        {/* Tab 2: Workflow Friction & BYOK Advantage Matrix */}
        {activeTab === "friction" && (
          <Reveal>
            <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-zinc-900/50 backdrop-blur-md shadow-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-zinc-950/80">
                    <th className="p-3.5 sm:p-4 font-semibold text-zinc-400 w-1/4">Workflow Dimension</th>
                    <th className="p-3.5 sm:p-4 font-semibold text-zinc-400 text-center">Manual Copy-Paste</th>
                    <th className="p-3.5 sm:p-4 font-semibold text-zinc-400 text-center hidden sm:table-cell">Browser Extensions</th>
                    <th className="p-3.5 sm:p-4 font-extrabold text-blue-400 bg-blue-950/30 border-x border-blue-500/20 text-center w-1/3">
                      <div className="flex items-center justify-center gap-1">
                        <span>🧠 Refinzi 2.0 (BYOK)</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {FRICTION_MATRIX.map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3.5 sm:p-4 font-medium text-zinc-200">
                        {row.dimension}
                      </td>
                      <td className="p-3.5 sm:p-4 text-center text-zinc-400">
                        {row.manual}
                      </td>
                      <td className="p-3.5 sm:p-4 text-center text-zinc-400 hidden sm:table-cell">
                        {row.extensions}
                      </td>
                      <td className="p-3.5 sm:p-4 text-center bg-blue-950/20 border-x border-blue-500/20 font-bold text-emerald-400">
                        {row.refinzi}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        )}

        {/* 3 Pillars of BYOK */}
        <Reveal>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/40 p-4 sm:p-5 space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                <Key className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-bold text-white">Your API Keys, Your Rates</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Connect your free Gemini or OpenRouter keys directly. We charge 0% markup and zero monthly fees.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/40 p-4 sm:p-5 space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
                <Lock className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-bold text-white">Your Prompts Stay Local</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Local-first Windows execution with DPAPI encryption. Zero cloud logging, zero prompt storage, zero telemetry.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/40 p-4 sm:p-5 space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20">
                <Layers className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-bold text-white">Your Stack Stays Intact</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Works inside ChatGPT, Cursor, VS Code, Discord, and Figma with 1-Click (Tap Ctrl+Alt+Space). We enhance, never replace.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default RefinziComparison;
