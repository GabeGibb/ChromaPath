"use client";
import React, { useEffect, useState } from "react";
import { BoardService, LadderBoard } from "@/services/boardService";
import GameCore from "@/components/game/GameCore";
import { Button, Card } from "@/components/ui";

const LadderSummary: React.FC<{
  totalTime: number;
  onRestart: () => void;
  onBack: () => void;
}> = ({ totalTime, onRestart, onBack }) => {
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
      <Card className="max-w-md w-full mx-4 text-center p-8">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-2xl font-bold text-success mb-2">
          Ladder Complete!
        </h2>
        <p className="mb-4 text-base-content/70">You finished all 11 levels!</p>
        <div className="bg-base-200 rounded-lg p-4 border border-base-300 mb-4">
          <div className="text-sm text-base-content/60 mb-1">Total Time</div>
          <div className="text-3xl font-mono font-bold text-primary">
            {formatTime(totalTime)}
          </div>
        </div>
        <Button onClick={onRestart} size="lg" className="w-full mb-2">
          Play Again
        </Button>
        <Button onClick={onBack} variant="outline" size="lg" className="w-full">
          Back to Game Menu
        </Button>
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
  const [totalTime, setTotalTime] = useState<number | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  // Fetch all boards on mount
  useEffect(() => {
    setLoading(true);
    setError(null);
    setBoards(null);
    setCurrent(0);
    setShowSummary(false);
    setTotalTime(null);
    setStartTime(null);
    BoardService.generateLadderBoards()
      .then((b) => {
        setBoards(b);
        setLoading(false);
        setStartTime(Date.now());
      })
      .catch((e) => {
        setError(e.message || "Failed to load ladder boards");
        setLoading(false);
      });
  }, []);

  // Handle board completion
  const handleBoardComplete = () => {
    if (!boards) return;
    if (current < boards.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      // Finished all
      if (startTime) setTotalTime(Date.now() - startTime);
      setShowSummary(true);
    }
  };

  // Restart ladder
  const handleRestart = () => {
    setBoards(null);
    setCurrent(0);
    setShowSummary(false);
    setTotalTime(null);
    setStartTime(null);
    setLoading(true);
    setError(null);
    BoardService.generateLadderBoards()
      .then((b) => {
        setBoards(b);
        setLoading(false);
        setStartTime(Date.now());
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

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        Loading ladder...
      </div>
    );
  if (error)
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-error">
        {error}
      </div>
    );
  if (!boards) return null;
  if (showSummary && totalTime !== null)
    return (
      <LadderSummary
        totalTime={totalTime}
        onRestart={handleRestart}
        onBack={handleBack}
      />
    );

  const board = boards[current];
  return (
    <div>
      <div className="flex flex-row justify-between items-center text-center space-y-0 relative px-12 pt-4">
        <div className="text-lg text-base-content/80">
          <div className="space-y-1">
            <div className="text-xs text-warning">Ladder Mode</div>
            <div className="text-sm font-semibold">
              Level {current + 1}/11 ({board.size}x{board.size})
            </div>
          </div>
        </div>
      </div>
      <GameCore
        boardSize={board.size}
        board={board.board}
        boardGenerating={false}
        boardError={null}
        showCompletionSummary={false}
        lastStats={null}
        onBoardComplete={handleBoardComplete}
        onNewLevel={() => {}}
        onReplayLevel={() => {}}
        onBoardErrorRetry={() => {}}
        showBoardSizeSelector={false}
      />
    </div>
  );
};

export default LadderGame;
