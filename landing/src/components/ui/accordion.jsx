import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Accessible accordion in the Shadcn UI style (hand-rolled, no Radix dependency).
 * Multiple items may be open at once — standard for landing-page FAQs.
 */
export function Accordion({ children, className = "", ...props }) {
  return (
    <div
      className={`w-full rounded-xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800 overflow-hidden ${className}`}
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
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-sm font-medium text-zinc-50 transition-all duration-200 hover:bg-zinc-800/40 cursor-pointer"
      >
        <span>{question}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        id={panelId}
        role="region"
        hidden={!open}
        className="grid px-6 pb-5 text-sm leading-relaxed text-zinc-400"
      >
        <span>{answer}</span>
      </div>
    </div>
  );
}

export default Accordion;
