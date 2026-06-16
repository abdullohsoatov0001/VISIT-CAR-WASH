"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { forwardRef, ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger" | "glass";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  glow?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconPosition = "left",
      glow = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary:
        "bg-brand-blue hover:bg-brand-blue-dark text-white border border-brand-blue/30 hover:border-brand-blue/60",
      secondary:
        "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300",
      ghost:
        "bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent",
      outline:
        "bg-transparent hover:bg-brand-blue/10 text-brand-blue border border-brand-blue/40 hover:border-brand-blue",
      danger:
        "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-300",
      glass:
        "bg-white/70 hover:bg-white/90 text-slate-700 border border-slate-200 hover:border-slate-300 backdrop-blur-md",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-10 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2",
      xl: "h-14 px-8 text-lg gap-2.5",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          "relative inline-flex items-center justify-center font-medium rounded-xl",
          "transition-all duration-200 ease-out",
          "focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:ring-offset-2 focus:ring-offset-white",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
          "select-none cursor-pointer",
          glow && "glow-blue",
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || loading}
        {...(props as any)}
      >
        {/* Shimmer on hover */}
        <span
          className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none"
          aria-hidden="true"
        >
          <span className="absolute inset-0 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </span>

        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4 text-current"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          <>
            {icon && iconPosition === "left" && (
              <span className="flex-shrink-0">{icon}</span>
            )}
            {children}
            {icon && iconPosition === "right" && (
              <span className="flex-shrink-0">{icon}</span>
            )}
          </>
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

export default Button;
