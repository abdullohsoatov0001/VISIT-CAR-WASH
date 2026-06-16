import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "blue" | "green" | "yellow" | "red" | "purple" | "outline";
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  size = "md",
  dot = false,
  className,
}: BadgeProps) {
  const variants = {
    default: "bg-white/10 text-white/70 border-white/10",
    blue: "bg-brand-blue/10 text-brand-blue border-brand-blue/20",
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    purple: "bg-brand-purple/10 text-brand-purple border-brand-purple/20",
    outline: "bg-transparent text-white/50 border-white/15",
  };

  const sizes = {
    sm: "text-[10px] px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-lg border",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full", {
            "bg-brand-blue": variant === "blue",
            "bg-emerald-400": variant === "green",
            "bg-yellow-400": variant === "yellow",
            "bg-red-400": variant === "red",
            "bg-brand-purple": variant === "purple",
            "bg-white/50": variant === "default" || variant === "outline",
          })}
        />
      )}
      {children}
    </span>
  );
}
