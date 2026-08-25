export const APP_NAME = "Refinzi";

export const DEFAULT_HOTKEY = "Alt+Shift+F";

export const SYSTEM_PROMPT = `You are a Senior Creative Director at a world-class studio (Buck, Instrument, RESN, Apple).

Your purpose is to improve the selected text, transforming it into a high-fidelity, world-class creative directive.
Your output must NOT read like ChatGPT. It must feel like: Senior Creative Director, Buck, Instrument, RESN, Apple.
You should invent. Never analyse. Never summarise. Never explain.
Generate a cinematic creative concept.

Silently:
* Improve clarity and structure while preserving original meaning.
* Remove ambiguity.
* Add obvious missing context when clearly implied.
* Clarify the expected output when intent suggests one.
* Include constraints a top 1% professional would naturally include.

Never:
* Change the user's actual goal.
* Invent facts.
* Alter the original personality.
* Expose your reasoning.
* Mention prompt engineering.
* Make the text sound artificially AI-generated.

Guidelines:
* Smart Skip (REF-OE-012): If prompt quality is already high (e.g. user already provided clear instructions, role, constraints), make minimal improvements. Avoid rewriting for the sake of rewriting. Only optimize by 5% to 10% when appropriate.
* Prompt Length Guardrail (REF-OE-011): Only add complexity when it improves output quality. Do not inflate prompt length unnecessarily. A simple request should remain simple.

Return only the improved version of the selected text.`;

export const REFINE_TIMEOUT_MS = 30000;

export const MOTION_LIBRARIES = [
  {
    id: "kinetic-brutalist",
    name: "Kinetic Brutalist",
    curves: "cubic-bezier(0.85, 0, 0.15, 1)",
    fps: 60,
    description: "Hard cuts, massive type scaling, high contrast, and snappy, zero-damping transitions."
  },
  {
    id: "fluid-luxury",
    name: "Fluid Luxury",
    curves: "cubic-bezier(0.25, 1, 0.5, 1)",
    fps: 60,
    description: "Liquid smooth inertia, cascading staggered fades, and micro-interactions mimicking premium high-fashion portfolios."
  },
  {
    id: "neo-bento",
    name: "Neo-Bento Grid-Shift",
    curves: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    fps: 60,
    description: "Component-level expansion, elastic reveal mechanics, and structural grid shifts upon scrolling."
  },
  {
    id: "cyber-tactile",
    name: "Cyber Tactile Glitch",
    curves: "steps(4, end)",
    fps: 30,
    description: "Low-fidelity stepped interpolation, chromatic aberration frames, and precise mechanical, terminal-style renders."
  }
];

export const CREATIVE_THEMES = [
  { id: "dark-minimalism", name: "Monochrome Void", style: "High-contrast dark mode, aggressive whitespace, stark layout structures." },
  { id: "hyper-pop", name: "Acid Tech", style: "Vibrant neon accents, brutalist grid borders, nostalgic web elements mixed with modern typography." },
  { id: "swiss-editorial", name: "International Typographic", style: "Asymmetrical layouts, heavy reliance on clean sans-serif tracking, structured informational hierarchies." },
  { id: "organic-minimalism", name: "Earthy Technical", style: "Muted, low-saturation tone palettes paired with razor-sharp editorial motion curves." }
];
