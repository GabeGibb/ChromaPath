import React from "react";
import { GameStats } from "@chromapath/shared/src";
import { Button } from "../ui";

interface CompletionSummaryProps {
  stats: GameStats;
  onContinue: () => void;
  onReplay: () => void;
}

const CompletionSummary: React.FC<CompletionSummaryProps> = ({
  stats,
  onContinue,
  onReplay,
}) => {
  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const getTimeTaken = (): string => {
    if (!stats.endTime) return "0s";
    return formatTime(stats.endTime - stats.startTime);
  };

  const getEfficiency = (): string => {
    const timeTaken = stats.endTime ? stats.endTime - stats.startTime : 0;
    const seconds = timeTaken / 1000;
    const movesPerSecond =
      seconds > 0 ? (stats.totalMoves / seconds).toFixed(1) : "0";
    return `${movesPerSecond} moves/sec`;
  };

  const getPathsPerSecond = (): string => {
    const timeTaken = stats.endTime ? stats.endTime - stats.startTime : 0;
    const seconds = timeTaken / 1000;
    const pathsPerSecond =
      seconds > 0 ? (stats.pathsCompleted / seconds).toFixed(2) : "0";
    return `${pathsPerSecond} paths/sec`;
  };

  return (
    <div className="absolute inset-0 bg-base-300/95 backdrop-blur-sm flex items-center justify-center z-20">
      <div className="bg-base-200 rounded-lg shadow-2xl p-6 max-w-md w-full mx-4 border border-base-300">
        <div className="text-center space-y-4">
          {/* Header */}
          <div className="space-y-2">
            <div className="text-4xl">🎉</div>
            <h2 className="text-2xl font-bold text-primary">Level Complete!</h2>
            <p className="text-base-content/70 text-sm">
              {stats.boardSize}x{stats.boardSize} Puzzle Solved
            </p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="bg-base-300 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">
                {getTimeTaken()}
              </div>
              <div className="text-xs text-base-content/70">Time Taken</div>
            </div>

            <div className="bg-base-300 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-secondary">
                {stats.totalMoves}
              </div>
              <div className="text-xs text-base-content/70">Total Moves</div>
            </div>

            <div className="bg-base-300 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-accent">
                {stats.pathsCompleted}
              </div>
              <div className="text-xs text-base-content/70">
                Paths Completed
              </div>
            </div>

            <div className="bg-base-300 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-info">
                {getEfficiency()}
              </div>
              <div className="text-xs text-base-content/70">Efficiency</div>
            </div>

            <div className="bg-base-300 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-warning">
                {getPathsPerSecond()}
              </div>
              <div className="text-xs text-base-content/70">
                Paths per Second
              </div>
            </div>

            <div className="bg-base-300 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-success">
                {stats.pathsCompleted > 0
                  ? Math.round(stats.totalMoves / stats.pathsCompleted)
                  : 0}
              </div>
              <div className="text-xs text-base-content/70">
                Avg Moves per Path
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onReplay}
              className="flex-1"
            >
              Replay Level
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onContinue}
              className="flex-1"
            >
              Next Level
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletionSummary;
