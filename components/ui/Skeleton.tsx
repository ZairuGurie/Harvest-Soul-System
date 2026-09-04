"use client";

import React from "react";

type SkeletonProps = {
  className?: string;
};

export default function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-md ${className}`} />;
}
