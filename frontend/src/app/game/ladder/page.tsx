"use client";
import React, { useEffect, useState } from "react";
import { BoardService, LadderBoard } from "@/services/boardService";
import GameCore from "@/components/game/GameCore";
import { LoadingSpinner } from "@/components/ui";
import { GameStats } from "@/shared";
import { LadderCountdown } from "@/components/game/LadderCountdown";
import { LadderStats } from "@/components/game/LadderStats";
import { LadderSummary } from "@/components/game/LadderSummary";

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
      <div className="flex flex-row justify-between items-center text-center space-y-0 relative px-4 md:px-12 pt-2 md:pt-4 flex-shrink-0">
        <div className="text-base md:text-lg text-base-content/80">
          <div className="space-y-0.5 md:space-y-1">
            <div className="text-xs text-warning">Ladder Mode</div>
            <div className="text-xs md:text-sm font-semibold">
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
          disableBoard={showCountdown}
        />
      </div>
    </div>
  );
};

export default LadderGame;
