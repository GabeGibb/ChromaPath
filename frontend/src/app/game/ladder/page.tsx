"use client";
import React, { useEffect, useState } from "react";
import { BoardService, LadderBoard } from "@/services/boardService";
import GameCore from "@/components/game/GameCore";
import { Button, Card, LoadingSpinner } from "@/components/ui";
import { useSound } from "@/services/sound/SoundContext";
import { GameStats } from "@/shared";

const LadderCountdown: React.FC<{
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

      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [count, onComplete, playSuccessSound, playHardClick]);

  if (!isVisible) return null;

  return (
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
  );
};

const LadderStats: React.FC<{
  currentBoardTime: number;
  totalTime: number;
  currentPaths: number;
  totalPaths: number;
  currentLevel: number;
  totalLevels: number;
}> = ({
  currentBoardTime,
  totalTime,
  currentPaths,
  totalPaths,
  currentLevel,
  totalLevels,
}) => {
  const formatTime = (milliseconds: number): string => {
    const totalSeconds = milliseconds / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const hundredths = Math.floor((totalSeconds % 1) * 100);

    if (minutes > 0) {
      return `${minutes}m ${seconds.toString().padStart(2, "0")}.${hundredths
        .toString()
        .padStart(2, "0")}s`;
    }
    return `${seconds}.${hundredths.toString().padStart(2, "0")}s`;
  };

  return (
    <>
      <div className="bg-base-200/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-base-300 shadow-lg">
        <div className="text-center">
          <div className="text-xs text-base-content/60 mb-1">Paths</div>
          <div className="text-lg font-bold text-secondary">
            {currentPaths}/{totalPaths}
          </div>
        </div>
      </div>

      {/* Current Board Time - Center Left */}
      <div className="bg-base-200/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-base-300 shadow-lg">
        <div className="text-center">
          <div className="text-xs text-base-content/60 mb-1">Board Time</div>
          <div className="text-lg font-mono font-bold text-primary">
            {formatTime(currentBoardTime)}
          </div>
        </div>
      </div>

      {/* Total Time - Center Right */}
      <div className="bg-base-200/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-base-300 shadow-lg">
        <div className="text-center">
          <div className="text-xs text-base-content/60 mb-1">Total Time</div>
          <div className="text-lg font-mono font-bold text-accent">
            {formatTime(totalTime)}
          </div>
        </div>
      </div>

      <div className="bg-base-200/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-base-300 shadow-lg">
        <div className="text-center">
          <div className="text-xs text-base-content/60 mb-1">Level</div>
          <div className="text-lg font-bold text-secondary">
            {currentLevel}/{totalLevels}
          </div>
        </div>
      </div>
    </>
  );
};

const LadderSummary: React.FC<{
  totalTime: number;
  onRestart: () => void;
  onBack: () => void;
  totalLevels: number;
  aggregatedStats: {
    totalMoves: number;
    totalPathsCompleted: number;
    averageTimePerLevel: number;
    averageMovesPerLevel: number;
    averagePathsPerLevel: number;
    efficiency: string;
    pathsPerSecond: string;
    averageMovesPerPath: number;
  };
}> = ({ totalTime, onRestart, onBack, totalLevels, aggregatedStats }) => {
  const formatTime = (milliseconds: number): string => {
    const totalSeconds = milliseconds / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const hundredths = Math.floor((totalSeconds % 1) * 100);
    if (minutes > 0) {
      return `${minutes}m ${seconds.toString().padStart(2, "0")}.${hundredths
        .toString()
        .padStart(2, "0")}s`;
    }
    return `${seconds}.${hundredths.toString().padStart(2, "0")}s`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Card className="max-w-2xl w-full mx-4 text-center p-8">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-2xl font-bold text-success mb-2">
          Ladder Complete!
        </h2>
        <p className="mb-6 text-base-content/70">
          You finished all {totalLevels} levels!
        </p>

        {/* Main Time Display */}
        <div className="bg-base-200 rounded-lg p-4 border border-base-300 mb-6">
          <div className="text-sm text-base-content/60 mb-1">Total Time</div>
          <div className="text-4xl font-mono font-bold text-primary">
            {formatTime(totalTime)}
          </div>
        </div>

        {/* Aggregated Statistics */}
        <div className="grid grid-cols-2 gap-4 py-4 mb-6">
          <div className="bg-base-300 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-secondary">
              {aggregatedStats.totalMoves}
            </div>
            <div className="text-xs text-base-content/70">Total Moves</div>
          </div>

          <div className="bg-base-300 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-accent">
              {aggregatedStats.totalPathsCompleted}
            </div>
            <div className="text-xs text-base-content/70">
              Total Paths Completed
            </div>
          </div>

          <div className="bg-base-300 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-info">
              {formatTime(aggregatedStats.averageTimePerLevel)}
            </div>
            <div className="text-xs text-base-content/70">
              Avg Time per Level
            </div>
          </div>

          <div className="bg-base-300 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-warning">
              {aggregatedStats.efficiency}
            </div>
            <div className="text-xs text-base-content/70">
              Overall Efficiency
            </div>
          </div>

          <div className="bg-base-300 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-success">
              {aggregatedStats.pathsPerSecond}
            </div>
            <div className="text-xs text-base-content/70">Paths per Second</div>
          </div>

          <div className="bg-base-300 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-primary">
              {aggregatedStats.averageMovesPerPath}
            </div>
            <div className="text-xs text-base-content/70">
              Avg Moves per Path
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button onClick={onRestart} size="lg" className="flex-1">
            Play Again
          </Button>
          <Button
            onClick={onBack}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            Back to Game Menu
          </Button>
        </div>
      </Card>
    </div>
  );
};

const LadderGame: React.FC = () => {
  const [boards, setBoards] = useState<LadderBoard[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalTime, setTotalTime] = useState<number>(0);
  const [currentBoardStartTime, setCurrentBoardStartTime] = useState<
    number | null
  >(null);
  const [currentBoardTime, setCurrentBoardTime] = useState<number>(0);
  const [showSummary, setShowSummary] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [currentPaths, setCurrentPaths] = useState<number>(0);
  const [totalPaths, setTotalPaths] = useState<number>(0);
  const [levelStats, setLevelStats] = useState<GameStats[]>([]);

  // Timer effect for current board time
  useEffect(() => {
    if (!currentBoardStartTime || showCountdown || showSummary) return;

    const interval = setInterval(() => {
      setCurrentBoardTime(Date.now() - currentBoardStartTime);
    }, 10);

    return () => clearInterval(interval);
  }, [currentBoardStartTime, showCountdown, showSummary]);

  // Timer effect for total time
  useEffect(() => {
    if (!startTime || showCountdown || showSummary) return;

    const interval = setInterval(() => {
      setTotalTime(Date.now() - startTime);
    }, 10);

    return () => clearInterval(interval);
  }, [startTime, showCountdown, showSummary]);

  // Fetch all boards on mount
  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    setLoading(true);
    setError(null);
    setBoards(null);
    setCurrent(0);
    setShowSummary(false);
    setTotalTime(0);
    setCurrentBoardTime(0);
    setStartTime(null);
    setCurrentBoardStartTime(null);
    setShowCountdown(false);
    setCurrentPaths(0);
    setTotalPaths(0);
    setLevelStats([]);
    BoardService.generateLadderBoards()
      .then((b) => {
        setBoards(b);
        setLoading(false);
        setShowCountdown(true);
      })
      .catch((e) => {
        setError(e.message || "Failed to load ladder boards");
        setLoading(false);
      });
  };

  // Handle board completion
  const handleBoardComplete = (stats: GameStats) => {
    if (!boards) return;

    // Store the stats for this level
    setLevelStats((prev) => [...prev, stats]);

    if (current < boards.length - 1) {
      setCurrent((c) => c + 1);
      // Reset current board timer for next level
      setCurrentBoardStartTime(Date.now());
      setCurrentBoardTime(0);
    } else {
      // Finished all levels
      setShowSummary(true);
    }
  };

  // Handle countdown completion
  const handleCountdownComplete = () => {
    setShowCountdown(false);
    const now = Date.now();
    setStartTime(now);
    setCurrentBoardStartTime(now);
  };

  // Handle board stats update
  const handleBoardStatsUpdate = (currentPaths: number, totalPaths: number) => {
    setCurrentPaths(currentPaths);
    setTotalPaths(totalPaths);
  };

  // Calculate aggregated stats
  const getAggregatedStats = () => {
    if (levelStats.length === 0) {
      return {
        totalMoves: 0,
        totalPathsCompleted: 0,
        averageTimePerLevel: 0,
        averageMovesPerLevel: 0,
        averagePathsPerLevel: 0,
        efficiency: "0 moves/sec",
        pathsPerSecond: "0 paths/sec",
        averageMovesPerPath: 0,
      };
    }

    const totalMoves = levelStats.reduce(
      (sum, stats) => sum + stats.totalMoves,
      0
    );
    const totalPathsCompleted = levelStats.reduce(
      (sum, stats) => sum + stats.pathsCompleted,
      0
    );
    const totalTimeSeconds = totalTime / 1000;

    const averageTimePerLevel = totalTime / levelStats.length;
    const averageMovesPerLevel = totalMoves / levelStats.length;
    const averagePathsPerLevel = totalPathsCompleted / levelStats.length;

    const efficiency =
      totalTimeSeconds > 0
        ? `${(totalMoves / totalTimeSeconds).toFixed(1)} moves/sec`
        : "0 moves/sec";
    const pathsPerSecond =
      totalTimeSeconds > 0
        ? `${(totalPathsCompleted / totalTimeSeconds).toFixed(2)} paths/sec`
        : "0 paths/sec";
    const averageMovesPerPath =
      totalPathsCompleted > 0
        ? Math.round(totalMoves / totalPathsCompleted)
        : 0;

    return {
      totalMoves,
      totalPathsCompleted,
      averageTimePerLevel,
      averageMovesPerLevel,
      averagePathsPerLevel,
      efficiency,
      pathsPerSecond,
      averageMovesPerPath,
    };
  };

  // Restart ladder
  const handleRestart = () => {
    setBoards(null);
    setCurrent(0);
    setShowSummary(false);
    setTotalTime(0);
    setCurrentBoardTime(0);
    setStartTime(null);
    setCurrentBoardStartTime(null);
    setShowCountdown(false);
    setCurrentPaths(0);
    setTotalPaths(0);
    setLevelStats([]);
    setLoading(true);
    setError(null);
    BoardService.generateLadderBoards()
      .then((b) => {
        setBoards(b);
        setLoading(false);
        setShowCountdown(true);
      })
      .catch((e) => {
        setError(e.message || "Failed to load ladder boards");
        setLoading(false);
      });
  };

  // Back to main game
  const handleBack = () => {
    window.location.href = "/game";
  };

  if (error)
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-error">
        {error}
      </div>
    );
  if (!boards)
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  if (showSummary)
    return (
      <LadderSummary
        totalTime={totalTime}
        onRestart={handleRestart}
        onBack={handleBack}
        totalLevels={boards.length}
        aggregatedStats={getAggregatedStats()}
      />
    );

  const board = boards[current];
  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-row justify-between items-center text-center space-y-0 relative px-12 pt-4 flex-shrink-0">
        <div className="text-lg text-base-content/80">
          <div className="space-y-1">
            <div className="text-xs text-warning">Ladder Mode</div>
            <div className="text-sm font-semibold">
              Level {current + 1}/{boards.length} ({board.size}x{board.size})
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <GameCore
          boardSize={board.size}
          board={board.board}
          boardGenerating={loading}
          boardError={null}
          showCompletionSummary={false}
          lastStats={null}
          onBoardComplete={handleBoardComplete}
          onNewLevel={initializeGame}
          onReplayLevel={() => {}}
          onBoardErrorRetry={() => {}}
          showBoardSizeSelector={false}
          countdownOverlay={
            showCountdown ? (
              <LadderCountdown onComplete={handleCountdownComplete} />
            ) : undefined
          }
          customStatsDisplay={
            <LadderStats
              currentBoardTime={currentBoardTime}
              totalTime={totalTime}
              currentPaths={currentPaths}
              totalPaths={totalPaths}
              currentLevel={current + 1}
              totalLevels={boards.length}
            />
          }
          onStatsUpdate={handleBoardStatsUpdate}
        />
      </div>
    </div>
  );
};

export default LadderGame;
