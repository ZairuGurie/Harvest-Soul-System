import React from "react";

type CardProps = React.HTMLAttributes<HTMLDivElement> & { accent?: boolean; glass?: boolean };

export default function Card({ children, className = "", accent = false, glass = true, ...props }: CardProps) {
  const baseGlass = "bg-white/92 backdrop-blur-md border border-harvest-gold/30 dark:bg-slate-950/92 dark:border-harvest-green/30 rounded-lg p-4 shadow-md";
  const baseSolid = "bg-white dark:bg-slate-900 border border-harvest-blue/20 dark:border-harvest-green/30 rounded-lg p-4 shadow-md";
  const base = glass ? baseGlass : baseSolid;
  const accentCls = accent ? "ring-2 ring-harvest-gold/40" : "";
  return (
    <div className={`${base} ${accentCls} ${className}`} {...props}>
      {children}
    </div>
  );
}
