"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  glass?: boolean;
  gradient?: boolean;
  onClick?: () => void;
  delay?: number;
}

export function Card({
  children,
  className,
  hover = false,
  glow = false,
  glass = false,
  gradient = false,
  onClick,
  delay = 0,
}: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay, ease: [0.23, 1, 0.32, 1] }}
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
      onClick={onClick}
      className={cn(
        "rounded-2xl border transition-all duration-400",
        glass
          ? "bg-white/70 backdrop-blur-xl border-slate-200"
          : "bg-white border-slate-200",
        hover &&
          "cursor-pointer hover:border-brand-blue/30 hover:shadow-[0_20px_60px_rgba(14,165,233,0.1)]",
        glow && "shadow-[0_0_30px_rgba(14,165,233,0.1)]",
        gradient && "gradient-border",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  positive?: boolean;
  icon?: React.ReactNode;
  color?: "blue" | "purple" | "green" | "orange";
  delay?: number;
}

export function StatCard({
  label,
  value,
  change,
  positive = true,
  icon,
  color = "blue",
  delay = 0,
}: StatCardProps) {
  const colors = {
    blue: "text-brand-blue bg-brand-blue/10 border-brand-blue/20",
    purple: "text-brand-purple bg-brand-purple/10 border-brand-purple/20",
    green: "text-emerald-600 bg-emerald-50 border-emerald-200",
    orange: "text-orange-600 bg-orange-50 border-orange-200",
  };

  return (
    <Card delay={delay} hover className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "w-10 h-10 rounded-xl border flex items-center justify-center",
            colors[color]
          )}
        >
          {icon}
        </div>
        {change && (
          <span
            className={cn(
              "text-xs font-medium px-2 py-1 rounded-lg",
              positive
                ? "text-emerald-600 bg-emerald-50"
                : "text-red-600 bg-red-50"
            )}
          >
            {positive ? "↑" : "↓"} {change}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-slate-900 mb-1">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </Card>
  );
}
