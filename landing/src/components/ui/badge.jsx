import React from "react";

const variantClasses = {
  default: "border-transparent bg-blue-500 text-white font-bold",
  outline:
    "border border-blue-500/20 bg-blue-500/10 text-blue-400 font-semibold uppercase",
  muted: "border border-zinc-800 bg-zinc-900 text-zinc-400",
};

export function Badge({ children, className = "", variant = "default", ...props }) {
  const classes = [
    "inline-flex items-center rounded-full px-3 py-1 text-xs tracking-widest transition-colors duration-200",
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
