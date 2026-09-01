import React from "react";

const variantClasses = {
  default: "border-transparent bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold",
  outline:
    "border border-blue-500/25 bg-blue-950/30 text-blue-400 font-semibold uppercase tracking-wider",
  muted: "border border-zinc-800 bg-zinc-900/80 text-zinc-400 font-medium",
};

export function Badge({ children, className = "", variant = "default", ...props }) {
  const classes = [
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] transition-colors duration-150",
    variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}

export default Badge;
