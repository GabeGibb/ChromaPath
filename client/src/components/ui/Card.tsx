import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "outlined";
}

const Card: React.FC<CardProps> = ({
  children,
  className = "",
  variant = "default",
}) => {
  const variantClasses = {
    default: "bg-base-200 border border-base-300",
    elevated: "bg-base-200 border border-base-300 shadow-2xl",
    outlined: "bg-transparent border-2 border-base-300",
  };

  return (
    <div className={`card ${variantClasses[variant]} ${className}`}>
      <div className="card-body">{children}</div>
    </div>
  );
};

export default Card;
