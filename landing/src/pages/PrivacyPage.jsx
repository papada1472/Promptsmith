import React from "react";
import { ArrowLeft, Shield, Lock, EyeOff, Server, Database, Mail } from "lucide-react";

export function PrivacyPage({ onNavigateHome }) {
  return (
    <div className="min-h-screen bg-[#08090c] text-zinc-300 font-sans selection:bg-blue-500/30 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#08090c]/90 backdrop-blur-xl px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-[900px] items-center justify-between">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-blue-400" />
            <span>Back to Home</span>
          </button>
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px]">🧠</span>
            <span>Refinzi 2.0</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[900px] px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">
          <Shield className="h-4 w-4" />
          <span>Legal & Privacy</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Privacy Policy
        </h1>
        <p className="mt-2 text-xs text-zinc-500">
          Last Updated: September 1, 2026 · Effective Date: September 1, 2026
        </p>

        <div className="my-8 border-t border-white/[0.08]" />

        <div className="space-y-8 text-sm leading-relaxed">
          <section className="rounded-2xl border border-blue-500/20 bg-blue-950/10 p-5">
            <div className="flex items-center gap-2 text-white font-bold mb-2">
              <Lock className="h-4 w-4 text-blue-400" />
              <span>Core Privacy Philosophy: Local-First & Zero Logging</span>
            </div>
            <p className="text-zinc-300 text-xs sm:text-sm">
              Refinzi 2.0 was architected from day one as an ambient desktop tool. We believe your prompts, code snippets, confidential documents, and creative ideas belong exclusively to you. <strong>Refinzi never stores, logs, intercepts, or trains models on the text you highlight or rebuild.</strong>
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <EyeOff className="h-4 w-4 text-purple-400" />
              1. Information We Do NOT Collect
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-300 text-xs sm:text-sm">
              <li><strong>Your Highlighted Prompts:</strong> Text selected with <code className="text-blue-300 font-mono">Ctrl+Alt+Space</code> is processed in memory and never written to disk or sent to Refinzi servers.</li>
              <li><strong>Your API Keys:</strong> In BYOK (Bring Your Own Key) mode, your Gemini or OpenRouter API keys are stored locally on your device in Windows encrypted storage.</li>
              <li><strong>Keystrokes or Screen Recording:</strong> Refinzi only listens for the registered global shortcut. It does not monitor or log background keystrokes.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Server className="h-4 w-4 text-emerald-400" />
              2. Information We Collect & Why
            </h2>
            <p className="text-xs sm:text-sm">
              We collect minimal, non-personally identifiable operational telemetry to maintain high app performance:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-300 text-xs sm:text-sm">
              <li><strong>Anonymized Website Analytics:</strong> Basic page load metrics (FCP, LCP), country-level location for currency display, and conversion counts.</li>
              <li><strong>License Verification:</strong> When activating Refinzi Pro, your license key is verified against our secure billing registry to grant perpetual updates.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Database className="h-4 w-4 text-amber-400" />
              3. Third-Party AI Service Providers
            </h2>
            <p className="text-xs sm:text-sm">
              When you rebuild a prompt, the request routes directly between your Windows client and the selected AI API provider:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-300 text-xs sm:text-sm">
              <li><strong>Google Gemini API:</strong> Governed by Google Cloud's Enterprise Data Privacy policy.</li>
              <li><strong>OpenRouter / Anthropic / OpenAI:</strong> Governed by their respective API zero-data-retention terms.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. GDPR & CCPA Compliance</h2>
            <p className="text-xs sm:text-sm">
              Under GDPR and CCPA regulations, you have the right to request deletion of any billing records associated with your email. Since Refinzi stores zero user content on remote servers, there is no personal prompt database to export or delete.
            </p>
          </section>

          <section className="rounded-2xl border border-white/[0.08] bg-zinc-900/60 p-5 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <Mail className="h-4 w-4 text-blue-400" />
              <span>Contact Privacy Officer</span>
            </div>
            <p className="text-xs text-zinc-400">
              For any questions regarding privacy or data rights, please reach out to our team:
            </p>
            <a
              href="mailto:contact@refinzi.com"
              className="text-xs font-mono text-blue-400 hover:text-blue-300 underline block"
            >
              contact@refinzi.com
            </a>
          </section>
        </div>
      </main>
    </div>
  );
}

export default PrivacyPage;
