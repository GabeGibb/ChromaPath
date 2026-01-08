"use client";
import React, { useState } from "react";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = "top",
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
    left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
    right: "left-full top-1/2 transform -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 transform -translate-x-1/2 border-t-base-300",
    bottom: "bottom-full left-1/2 transform -translate-x-1/2 border-b-base-300",
    left: "left-full top-1/2 transform -translate-y-1/2 border-l-base-300",
    right: "right-full top-1/2 transform -translate-y-1/2 border-r-base-300",
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onTouchStart={() => setIsVisible(true)}
      onTouchEnd={() => setTimeout(() => setIsVisible(false), 2000)}
    >
      {children}

      {isVisible && (
        <div className={`absolute z-50 ${positionClasses[position]}`}>
          <div className="bg-base-300 text-base-content px-3 py-2 rounded-lg shadow-lg max-w-xs text-sm">
            {content}
            {/* Arrow */}
            <div
              className={`absolute w-0 h-0 border-4 border-transparent ${arrowClasses[position]}`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
