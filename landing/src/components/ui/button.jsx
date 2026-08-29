import React from "react";

const variantClasses = {
  default:
    "bg-white text-zinc-950 hover:bg-zinc-200 font-bold shadow-md",
  primary:
    "bg-blue-600 text-white hover:bg-blue-500 font-bold shadow-lg shadow-blue-600/40",
  secondary:
    "bg-zinc-800 text-white border border-zinc-600 hover:border-zinc-400 hover:bg-zinc-700 font-semibold shadow-md",
  deal:
    "bg-amber-500 text-zinc-950 hover:bg-amber-400 font-bold shadow-lg shadow-amber-500/30",
  ghost:
    "bg-transparent text-zinc-300 hover:text-white hover:bg-white/[0.08] font-medium",
};

const sizeClasses = {
  xs: "px-3 py-1 text-xs rounded-lg",
  sm: "px-4 py-2 text-xs rounded-xl",
  default: "px-5 py-2.5 text-sm rounded-xl",
  lg: "px-7 py-3 text-sm sm:text-base rounded-xl",
  xl: "px-8 py-4 text-base sm:text-lg rounded-xl",
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
    "inline-flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none whitespace-nowrap",
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
