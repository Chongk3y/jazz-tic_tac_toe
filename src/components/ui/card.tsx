import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-slate-200/80 bg-white shadow-[0_18px_50px_-28px_rgba(16,42,67,0.35)]",
        className,
      )}
      {...props}
    />
  );
}
