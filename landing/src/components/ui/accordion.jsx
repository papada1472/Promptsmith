import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Accessible accordion in the modern minimal style.
 */
export function Accordion({ children, className = "", ...props }) {
  return (
    <div
      className={`w-full rounded-2xl border border-white/[0.07] bg-zinc-950/60 divide-y divide-white/[0.06] overflow-hidden backdrop-blur-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function AccordionItem({ question, answer, className = "" }) {
  const [open, setOpen] = useState(false);
  const panelId = `accordion-panel-${question
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-xs sm:text-sm font-semibold text-zinc-200 transition-colors duration-150 hover:bg-white/[0.02] hover:text-white cursor-pointer select-none"
      >
        <span>{question}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 ${
            open ? "rotate-180 text-blue-400" : ""
          }`}
        />
      </button>
      <div
        id={panelId}
        role="region"
        hidden={!open}
        className="grid px-5 pb-4 pt-0 text-xs sm:text-sm leading-relaxed text-zinc-400"
      >
        <span>{answer}</span>
      </div>
    </div>
  );
}

export default Accordion;
