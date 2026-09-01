import React from "react";

const variantClasses = {
  default:
    "bg-white text-zinc-950 hover:bg-zinc-100 font-semibold shadow-sm",
  primary:
    "bg-blue-600 text-white hover:bg-blue-500 font-semibold shadow-md shadow-blue-600/25 border border-blue-400/30",
  secondary:
    "bg-zinc-900 text-zinc-200 border border-zinc-700/70 hover:border-zinc-500 hover:bg-zinc-800 hover:text-white font-medium",
  deal:
    "bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 hover:from-amber-400 hover:to-orange-400 font-bold shadow-md shadow-amber-500/25 border border-amber-300/40",
  ghost:
    "bg-transparent text-zinc-400 hover:text-white hover:bg-white/[0.06] font-medium",
};

const sizeClasses = {
  xs: "px-2.5 py-1 text-xs rounded-lg gap-1.5",
  sm: "px-3.5 py-1.5 text-xs rounded-lg gap-1.5 font-medium",
  default: "px-4 py-2 text-xs sm:text-sm rounded-xl gap-2",
  lg: "px-5 py-2.5 text-sm rounded-xl gap-2 font-semibold",
  xl: "px-6 py-3 text-sm sm:text-base rounded-xl gap-2.5 font-semibold",
};

export function Button({
  children,
  variant = "primary",
  size = "default",
  className = "",
  asChild = false,
  ...props
}) {
  const classes = [
    "inline-flex items-center justify-center transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none whitespace-nowrap",
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.default,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (asChild) {
    return (
      <a className={classes} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

export default Button;
