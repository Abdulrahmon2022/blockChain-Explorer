import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "outline";
}

export function Badge({ children, variant = "primary", className = "", ...props }: BadgeProps) {
  const baseStyles = "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border shrink-0";
  
  const variants = {
    primary: "bg-brand-soft text-brand-primary border-brand-border",
    secondary: "bg-bg-secondary text-text-secondary border-border-default",
    success: "bg-state-success-soft text-state-success border-state-success-border",
    danger: "bg-state-error-soft text-state-error border-state-error-border",
    warning: "bg-state-warning-soft text-state-warning border-state-warning-border",
    info: "bg-state-info-soft text-state-info border-state-info-border",
    outline: "border border-border-default text-text-secondary",
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
}
