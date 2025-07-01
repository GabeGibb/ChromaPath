import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} relative`}>
        <div className="absolute inset-0 border-2 border-neutral-600 rounded-full"></div>
        <div className="absolute inset-0 border-2 border-transparent border-t-primary rounded-full animate-spin"></div>
        <div className="absolute inset-1 border-2 border-neutral-700 rounded-full"></div>
        <div
          className="absolute inset-1 border-2 border-transparent border-t-secondary rounded-full animate-spin"
          style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
        ></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
