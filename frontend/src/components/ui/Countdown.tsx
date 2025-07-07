"use client";
import React, { useEffect, useState } from "react";
import { useSound } from "@/services/sound/SoundContext";

interface CountdownProps {
  onComplete: () => void;
  className?: string;
}

const Countdown: React.FC<CountdownProps> = ({
  onComplete,
  className = "",
}) => {
  const [count, setCount] = useState(3);
  const [isVisible, setIsVisible] = useState(true);
  const { playSuccessSound, playHardClick } = useSound();

  useEffect(() => {
    if (count > 0) {
      // Play countdown sound
      playSuccessSound();

      const timer = setTimeout(() => {
        setCount(count - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (count === 0) {
      // Play start sound
      playHardClick();

      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [count, onComplete, playSuccessSound, playHardClick]);

  if (!isVisible) return null;

  return (
    <div
      className={`absolute inset-0 bg-base-300/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-10 ${className}`}
    >
      <div className="text-center space-y-2">
        <div className="text-6xl font-bold text-primary animate-pulse">
          {count > 0 ? count : "GO!"}
        </div>
        {count === 0 && (
          <div className="text-base-content font-semibold text-sm animate-bounce">
            Let&apos;s Play!
          </div>
        )}
      </div>
    </div>
  );
};

export default Countdown;
