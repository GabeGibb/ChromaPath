"use client";
import React, { useEffect, useState } from "react";

interface GamePreviewProps {
  className?: string;
}

const GamePreview: React.FC<GamePreviewProps> = ({ className = "" }) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Sample board data for preview
  const previewBoard = [
    [
      { color: 0, isEndpoint: true },
      { color: 0, isEndpoint: false },
      { color: 0, isEndpoint: false },
      { color: 0, isEndpoint: false },
      { color: 0, isEndpoint: true },
    ],
    [null, null, { color: 1, isEndpoint: false }, null, null],
    [
      { color: 1, isEndpoint: true },
      { color: 1, isEndpoint: false },
      { color: 1, isEndpoint: false },
      { color: 1, isEndpoint: false },
      { color: 1, isEndpoint: false },
    ],
    [null, null, { color: 2, isEndpoint: false }, null, null],
    [
      { color: 2, isEndpoint: true },
      { color: 2, isEndpoint: false },
      { color: 2, isEndpoint: false },
      { color: 2, isEndpoint: false },
      { color: 2, isEndpoint: true },
    ],
  ];

  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % 4);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getCellColor = (
    cell: { color: number; isEndpoint: boolean } | null
  ) => {
    if (!cell) return "bg-base-200";

    const baseColor = colors[cell.color % colors.length];

    if (cell.isEndpoint) {
      return `${baseColor} ring-2 ring-white ring-offset-2 ring-offset-base-300`;
    }

    return baseColor;
  };

  const getCellContent = (
    cell: { color: number; isEndpoint: boolean } | null
  ) => {
    if (!cell) return null;

    if (cell.isEndpoint) {
      return <div className="w-3 h-3 bg-white rounded-full opacity-80" />;
    }

    return null;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl" />

      {/* Game board preview */}
      <div className="relative bg-base-100 rounded-2xl p-6 shadow-2xl border border-base-300">
        <div className="grid grid-cols-5 gap-1 w-48 h-48 mx-auto">
          {previewBoard.map((row, y) =>
            row.map((cell, x) => (
              <div
                key={`${x}-${y}`}
                className={`
                  aspect-square rounded-md transition-all duration-500 ease-out
                  ${getCellColor(cell)}
                  ${currentStep >= 1 && cell ? "animate-pulse" : ""}
                `}
              >
                {getCellContent(cell)}
              </div>
            ))
          )}
        </div>

        {/* Floating elements */}
        <div className="absolute -top-4 -right-4 w-8 h-8 bg-accent rounded-full animate-bounce" />
        <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-secondary rounded-full animate-ping" />
        <div className="absolute top-1/2 -left-6 w-4 h-4 bg-primary rounded-full animate-pulse" />
      </div>

      {/* Connection lines animation */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 200 200">
          <path
            d="M 20 20 Q 100 50 180 20"
            stroke="url(#gradient1)"
            strokeWidth="3"
            fill="none"
            className={`transition-all duration-1000 ${
              currentStep >= 2 ? "opacity-100" : "opacity-0"
            }`}
          />
          <path
            d="M 20 100 Q 100 130 180 100"
            stroke="url(#gradient2)"
            strokeWidth="3"
            fill="none"
            className={`transition-all duration-1000 delay-300 ${
              currentStep >= 3 ? "opacity-100" : "opacity-0"
            }`}
          />
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};

export default GamePreview;
