import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
};

export function Button({
  className,
  variant = "default",
  size = "default",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variant === "default" &&
          "bg-[#102a43] text-white shadow-[0_8px_18px_-10px_rgba(16,42,67,0.65)] hover:-translate-y-0.5 hover:bg-[#193b5d]",
        variant === "outline" &&
          "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
        variant === "ghost" && "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
        size === "default" && "h-11 px-5 text-sm",
        size === "sm" && "h-9 px-3 text-xs",
        size === "icon" && "h-10 w-10",
        className,
      )}
      {...props}
    />
  );
}
