import React from "react";
import { Sun, Moon } from "lucide-react";
import { trackEvent } from "../utils/analytics.js";

export function ThemeToggle({ theme = "dark", onToggleTheme, className = "" }) {
  const isDark = theme === "dark";

  const handleToggle = () => {
    const nextTheme = isDark ? "light" : "dark";
    onToggleTheme(nextTheme);
    trackEvent("theme_toggled", { theme: nextTheme });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className={`relative inline-flex h-10 w-10 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-white/10 bg-zinc-900/80 text-zinc-300 hover:text-white hover:border-white/20 hover:bg-zinc-800 transition-all cursor-pointer shadow-sm touch-manipulation ${
        !isDark ? "!bg-zinc-100 !border-zinc-300 !text-zinc-800 hover:!bg-zinc-200" : ""
      } ${className}`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 transition-transform rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 text-blue-600 transition-transform rotate-0 hover:-rotate-12" />
      )}
    </button>
  );
}

export default ThemeToggle;
