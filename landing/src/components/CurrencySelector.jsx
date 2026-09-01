import React from "react";
import { ChevronDown } from "lucide-react";
import { SUPPORTED_CURRENCIES } from "../utils/currency.js";

export function CurrencyBadge({ currentCurrency, onSelectCurrency, detectedCountry }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900/80 border border-white/[0.08] px-2.5 py-1 text-xs text-zinc-300 shadow-sm backdrop-blur-md">
      <span className="text-xs select-none">{currentCurrency.flag}</span>
      <span className="text-[11px] font-medium text-zinc-300">
        Prices in <strong className="text-white font-semibold">{currentCurrency.code}</strong> ({currentCurrency.symbol})
      </span>
      {detectedCountry && detectedCountry !== "United States" && (
        <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded font-mono hidden md:inline">
          {detectedCountry}
        </span>
      )}
      <div className="relative ml-0.5">
        <select
          value={currentCurrency.code}
          onChange={(e) => {
            const selected = SUPPORTED_CURRENCIES[e.target.value];
            if (selected && onSelectCurrency) {
              onSelectCurrency(selected);
            }
          }}
          className="cursor-pointer appearance-none bg-transparent pr-4 pl-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 focus:outline-none"
          aria-label="Select pricing currency"
        >
          {Object.values(SUPPORTED_CURRENCIES).map((c) => (
            <option key={c.code} value={c.code} className="bg-zinc-900 text-zinc-200">
              {c.flag} {c.code} ({c.symbol})
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500" />
      </div>
    </div>
  );
}

export default CurrencyBadge;
