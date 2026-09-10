"use client";

import React from "react";
import Link from "next/link";

type ButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "href"> & {
  variant?: "primary" | "ghost" | "outline";
  href?: string;
};

export default function Button({ variant = "primary", className = "", href, children, ...props }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<string, string> = {
    primary:
      "bg-harvest-gradient text-white hover:opacity-95 hover:shadow-md focus:ring-harvest-blue/50 shadow-sm active:scale-[0.98]",
    ghost:
      "bg-transparent text-harvest-green-dark hover:bg-harvest-green/10 dark:text-emerald-200 dark:hover:bg-harvest-green/20 focus:ring-harvest-green/30",
    outline:
      "bg-transparent border border-harvest-blue/30 text-harvest-blue-dark hover:bg-harvest-blue/5 hover:border-harvest-blue/50 dark:border-sky-700 dark:text-sky-200 dark:hover:bg-sky-900/30",
  };

  const cls = `${base} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }

  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
