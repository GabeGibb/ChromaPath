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

  const getCompletionRate = (): string => {
    // For ChromaPath, completion means all paths are connected
    // This is a simplified calculation based on completed paths
    const totalPaths = stats.boardSize * stats.boardSize;
    const completionRate = Math.min(
      (stats.pathsCompleted / totalPaths) * 100,
      100
    ).toFixed(1);
    return `${completionRate}%`;
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
          </div>

          {/* Additional Stats */}
          <div className="bg-base-300 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-base-content/70">
                Board Coverage:
              </span>
              <span className="text-sm font-semibold">
                {getCompletionRate()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-base-content/70">
                Average Moves per Path:
              </span>
              <span className="text-sm font-semibold">
                {stats.pathsCompleted > 0
                  ? Math.round(stats.totalMoves / stats.pathsCompleted)
                  : 0}
              </span>
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
