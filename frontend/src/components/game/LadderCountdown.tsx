import { useSound } from "@/services/sound/SoundContext";
import { useState, useEffect } from "react";

export const LadderCountdown: React.FC<{
  onComplete: () => void;
}> = ({ onComplete }) => {
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

      setIsVisible(false);
      onComplete();
    }
  }, [count, onComplete, playSuccessSound, playHardClick]);

  if (!isVisible) return null;

  return (
    <div className="text-center space-y-2">
      <div className="text-6xl font-bold text-primary animate-pulse">
        {count > 0 ? count : "GO!"}
      </div>
    </div>
  );
};
