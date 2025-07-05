import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled = false,
  className = "",
  loading = false,
}) => {
  const variantMap = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    outline: "btn-outline",
    ghost: "btn-ghost",
  };

  const sizeMap = {
    sm: "btn-sm",
    md: "",
    lg: "btn-lg",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn ${variantMap[variant]} ${sizeMap[size]} font-bold transition-all duration-200 hover:scale-105 active:scale-95 ${className}`}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <span className="loading loading-spinner loading-sm"></span>
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
