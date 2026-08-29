import React from "react";

export function Card({ className = "", glow = false, ...props }) {
  return (
    <div
      className={`rounded-2xl transition-all duration-200 ${
        glow ? "luxury-surface-glow" : "luxury-surface"
      } ${className}`}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }) {
  return <div className={`flex flex-col space-y-1.5 p-5 sm:p-6 ${className}`} {...props} />;
}

export function CardTitle({ className = "", ...props }) {
  return (
    <h3
      className={`text-lg font-bold tracking-tight text-white ${className}`}
      {...props}
    />
  );
}

export function CardDescription({ className = "", ...props }) {
  return (
    <p className={`text-xs sm:text-sm text-zinc-400 leading-relaxed ${className}`} {...props} />
  );
}

export function CardContent({ className = "", ...props }) {
  return <div className={`p-5 sm:p-6 pt-0 ${className}`} {...props} />;
}

export function CardFooter({ className = "", ...props }) {
  return (
    <div className={`flex items-center p-5 sm:p-6 pt-0 ${className}`} {...props} />
  );
}

export default Card;
