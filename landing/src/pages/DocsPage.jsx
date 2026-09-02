import React, { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Keyboard,
  Zap,
  Layers,
  Key,
  ShieldCheck,
  Download,
  Copy,
  Check,
  Search,
  ExternalLink,
  ChevronRight,
  Terminal,
} from "lucide-react";

export function DocsPage({ onNavigateHome, onDownload }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);

  const copyShortcut = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#08090c] text-zinc-300 font-sans selection:bg-blue-500/30 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#08090c]/90 backdrop-blur-xl px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-[1000px] items-center justify-between">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-blue-400" />
            <span>Back to Home</span>
          </button>
          <div className="flex items-center gap-2">
            <img src="/branding/logo-mark.webp" alt="Refinzi" width="20" height="20" loading="lazy" decoding="async" className="h-5 w-5 rounded object-contain hidden sm:inline" />
            <span className="text-xs font-bold text-white hidden sm:inline">Refinzi 2.0 Docs</span>
            <button
              onClick={onDownload}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 transition-all shadow-md shadow-blue-500/20"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download (.exe)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[1000px] px-4 py-10 sm:px-6 sm:py-14">
        {/* Header Hero */}
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Official User Manual</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Refinzi 2.0 Documentation
          </h1>
          <p className="mt-2 text-sm text-zinc-400 max-w-2xl">
            Everything you need to master ambient prompt rebuilding, model tuning, and 5-Block Blueprint synthesis in Windows.
          </p>
        </div>

        {/* Documentation Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quick Nav Sidebar */}
          <div className="space-y-2 md:sticky md:top-20 md:self-start">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2 px-2">Table of Contents</p>
            <a href="#quickstart" className="flex items-center justify-between p-2 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors">
              <span>1. Quickstart & Installation</span>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
            </a>
            <a href="#shortcuts" className="flex items-center justify-between p-2 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors">
              <span>2. Global Shortcut (Ctrl+Alt+Space)</span>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
            </a>
            <a href="#modes" className="flex items-center justify-between p-2 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors">
              <span>3. Tap Mode vs Blueprint Hold</span>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
            </a>
            <a href="#byok" className="flex items-center justify-between p-2 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors">
              <span>4. BYOK API Key Setup</span>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
            </a>
            <a href="#activation" className="flex items-center justify-between p-2 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors">
              <span>5. Pro License Activation</span>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
            </a>
          </div>

          {/* Detailed Content */}
          <div className="md:col-span-2 space-y-10 text-sm">
            {/* Section 1: Quickstart */}
            <section id="quickstart" className="space-y-3 rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-5 sm:p-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Download className="h-4 w-4 text-blue-400" />
                1. Quickstart & Installation
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300">
                Refinzi is a native 64-bit Windows utility compatible with <strong>Windows 10 & Windows 11</strong>.
              </p>
              <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm text-zinc-300">
                <li>Download the installer: <a href="https://github.com/papada1472/refinzi/releases/download/v2.0.0/Refinzi-Setup-v2.0.0.exe" className="text-blue-400 underline font-mono">Refinzi-Setup-v2.0.0.exe</a> (111.8 MB).</li>
                <li>Double click to install. Refinzi will launch automatically and appear in your Windows System Tray (near the clock).</li>
                <li>The ambient Orb overlay is now active and ready.</li>
              </ol>
            </section>

            {/* Section 2: Shortcuts */}
            <section id="shortcuts" className="space-y-3 rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-5 sm:p-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-purple-400" />
                2. Primary Action: 1-Click on the Ambient Orb (or Ctrl+Alt+Space)
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300">
                <strong>1-Click on the floating ambient Orb</strong> is your primary daily workflow. Highlight any raw idea anywhere in Windows and click the Orb (or press <kbd className="font-mono text-xs text-blue-300 font-bold bg-zinc-950 px-1.5 py-0.5 rounded border border-white/10">Ctrl+Alt+Space</kbd>) — Refinzi rebuilds it directly in-place in 2 seconds without copy-pasting:
              </p>
              <div className="p-3 rounded-xl bg-zinc-950 border border-white/10 flex items-center justify-between">
                <span className="font-mono text-xs text-blue-300 font-bold">1-Click on Orb · (Or Ctrl + Alt + Space)</span>
                <button
                  onClick={() => copyShortcut("Ctrl+Alt+Space")}
                  className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedKey ? "Copied" : "Copy Shortcut"}</span>
                </button>
              </div>
              <p className="text-xs text-zinc-400">
                Works inside <strong>ChatGPT Web, Claude, Cursor IDE, VS Code, Discord, Notion, Figma, Midjourney Discord, or any browser input</strong>.
              </p>
            </section>

            {/* Section 3: Modes */}
            <section id="modes" className="space-y-3 rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-5 sm:p-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400" />
                3. 1-Click on Orb (Primary) vs 300ms Hold (Secondary)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-950/20 space-y-1">
                  <span className="text-xs font-bold text-blue-400 block">⚡ 1-Click on Orb (Primary Use Case)</span>
                  <p className="text-[11px] text-zinc-300">
                    Instantly transforms your active prompt in-place for your target model (Midjourney lens flags, ChatGPT chain-of-thought, Cursor tokens).
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-950/20 space-y-1">
                  <span className="text-xs font-bold text-purple-400 block">🧠 300ms Hold (Secondary Blueprint)</span>
                  <p className="text-[11px] text-zinc-300">
                    Opens 5-Block Blueprint scaffolding: 1. Semantic Architecture, 2. Design Tokens, 3. Conversion Copy, 4. Micro-motions, 5. Model Rules.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4: BYOK */}
            <section id="byok" className="space-y-4 rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-5 sm:p-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Key className="h-4 w-4 text-emerald-400" />
                4. Bring Your Own Key (BYOK) & Top 10 Supported Models
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300">
                Refinzi allows 100% free usage with your personal API keys with zero markup. Switch between any of the Top 10 frontier LLMs with 1-click:
              </p>
              
              {/* Top 10 Models Table */}
              <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-zinc-950/60">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="border-b border-white/[0.08] bg-zinc-900/80 text-[11px] font-bold uppercase text-zinc-400">
                    <tr>
                      <th className="px-3 py-2">Model</th>
                      <th className="px-3 py-2">Provider</th>
                      <th className="px-3 py-2">Superpower</th>
                      <th className="px-3 py-2">Best For</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-[11px]">
                    <tr>
                      <td className="px-3 py-2 font-bold text-white">1. DeepSeek R1</td>
                      <td className="px-3 py-2 text-blue-400">DeepSeek / OpenRouter</td>
                      <td className="px-3 py-2 text-purple-300">🧠 Frontier CoT Reasoning</td>
                      <td className="px-3 py-2 text-zinc-400">Complex logic & system prompts</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold text-white">2. DeepSeek V3</td>
                      <td className="px-3 py-2 text-blue-400">DeepSeek / OpenRouter</td>
                      <td className="px-3 py-2 text-emerald-300">⚡ Sub-Second Speed</td>
                      <td className="px-3 py-2 text-zinc-400">Everyday fast transformations</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold text-white">3. Claude Sonnet 5</td>
                      <td className="px-3 py-2 text-blue-400">Anthropic / OpenRouter</td>
                      <td className="px-3 py-2 text-amber-300">👑 Top Code Scaffolding</td>
                      <td className="px-3 py-2 text-zinc-400">Cursor rules & full-stack architecture</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold text-white">4. Claude Opus 5</td>
                      <td className="px-3 py-2 text-blue-400">Anthropic / OpenRouter</td>
                      <td className="px-3 py-2 text-cyan-300">🧠 Frontier Logic & Nuance</td>
                      <td className="px-3 py-2 text-zinc-400">Deep technical specifications</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold text-white">5. OpenAI GPT-5.6 Terra</td>
                      <td className="px-3 py-2 text-blue-400">OpenAI / OpenRouter</td>
                      <td className="px-3 py-2 text-emerald-300">🌐 Flagship Multimodal</td>
                      <td className="px-3 py-2 text-zinc-400">Copywriting, design & creative</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold text-white">6. OpenAI o3-mini / o1</td>
                      <td className="px-3 py-2 text-blue-400">OpenAI / OpenRouter</td>
                      <td className="px-3 py-2 text-purple-300">🔬 Multi-Step Logic</td>
                      <td className="px-3 py-2 text-zinc-400">Algorithm and workflow planning</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold text-white">7. Google Gemini 3.7 Flash</td>
                      <td className="px-3 py-2 text-blue-400">Google AI Studio</td>
                      <td className="px-3 py-2 text-cyan-300">🚀 Flagship Next-Gen Speed</td>
                      <td className="px-3 py-2 text-zinc-400">Instant 1-click in-place prompts</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold text-white">8. Google Gemini 3.6 / 3.5 Flash</td>
                      <td className="px-3 py-2 text-blue-400">Google AI Studio</td>
                      <td className="px-3 py-2 text-indigo-300">⚡ Sub-Second Workhorse</td>
                      <td className="px-3 py-2 text-zinc-400">High-throughput prompt synthesis</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold text-white">9. Meta Llama 3.3 70B</td>
                      <td className="px-3 py-2 text-blue-400">OpenRouter (Free/Paid)</td>
                      <td className="px-3 py-2 text-pink-300">🦙 Open-Weights King</td>
                      <td className="px-3 py-2 text-zinc-400">Uncensored creative prompts</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold text-white">10. Qwen 2.5 Coder 32B</td>
                      <td className="px-3 py-2 text-blue-400">OpenRouter (Free/Paid)</td>
                      <td className="px-3 py-2 text-blue-300">💻 Elite Programming</td>
                      <td className="px-3 py-2 text-zinc-400">Code generation & scripts</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="pt-2">
                <p className="text-xs font-semibold text-white mb-1.5">How to Switch in Refinzi:</p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-zinc-300">
                  <li>Right-click the Refinzi Tray icon &gt; click <strong>Settings</strong>.</li>
                  <li>Click any model in the <strong>⚡ Top 10 LLM Fast Switch</strong> strip to activate it instantly.</li>
                  <li>Enter your API key (encrypted locally with Windows DPAPI AES-256).</li>
                  <li>Click <strong>Save & Test Connection</strong>. Refinzi will route all rebuilds through your chosen model!</li>
                </ul>
              </div>
            </section>

            {/* Section 5: License */}
            <section id="activation" className="space-y-3 rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-5 sm:p-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-400" />
                5. Pro License Activation
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300">
                If you purchased Refinzi Lifetime Pro:
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-xs text-zinc-300">
                <li>Open Refinzi Settings &gt; <strong>License</strong>.</li>
                <li>Paste your license key (e.g. <code className="font-mono text-blue-300 text-xs">RFZ-PRO-XXXX-XXXX-XXXX</code>).</li>
                <li>Click <strong>Activate License</strong>. All managed Claude & GPT models will immediately unlock!</li>
              </ol>
            </section>

            {/* Section 6: Direct Support & Contact */}
            <section id="support" className="space-y-4 rounded-2xl border border-blue-500/20 bg-blue-950/20 p-5 sm:p-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400" />
                6. Need Help or Have Feedback? Reach Out to Rahul
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300">
                Need guidance setting up your custom prompt presets, BYOK keys, or want to suggest a new feature? Connect directly:
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href="https://cal.com/rahul-mangla-ub8se9/30min"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-3.5 py-2 rounded-xl transition-all shadow-md shadow-blue-500/20"
                >
                  <span>📅 Book 30-Min Call with Rahul</span>
                </a>
                <a
                  href="https://wa.me/919971271291?text=Hi%20Rahul,%20I'm%20reaching%20out%20about%20Refinzi%20documentation!"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 px-3.5 py-2 rounded-xl transition-all"
                >
                  <span>💬 WhatsApp +91-9971271291</span>
                </a>
                <a
                  href="mailto:contact@refinzi.com"
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-300 hover:text-white bg-zinc-900 px-3 py-2 rounded-xl border border-white/10 transition-colors"
                >
                  <span>contact@refinzi.com</span>
                </a>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DocsPage;
