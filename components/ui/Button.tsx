import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-brand-primary/50 disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    primary:
      "bg-brand-primary text-white hover:bg-brand-hover active:bg-brand-active",
    secondary:
      "bg-bg-tertiary border border-border-default text-text-primary hover:border-border-hover hover:bg-bg-secondary",
    outline:
      "border border-border-default text-text-secondary hover:bg-bg-secondary hover:text-text-primary hover:border-border-hover",
    ghost:
      "text-text-secondary hover:bg-bg-secondary hover:text-text-primary",
    danger:
      "bg-state-error text-white hover:bg-state-error/90",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
