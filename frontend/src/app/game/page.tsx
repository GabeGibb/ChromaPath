"use client";
import { ArrowLeft } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { GameStats } from "@/shared";
import { BoardService } from "@/services/boardService";
import GameCore from "@/components/game/GameCore";
import { Board } from "@/shared/types";

const Game: React.FC = () => {
  const initialWidth = 5;
  const initialHeight = 5;

  // Game state
  const [boardWidth, setBoardWidth] = useState(initialWidth);
  const [boardHeight, setBoardHeight] = useState(initialHeight);
  const [board, setBoard] = useState<Board | null>(null);
  const [boardGenerating, setBoardGenerating] = useState<boolean>(true);
  const [boardError, setBoardError] = useState<Error | null>(null);
  const [showCompletionSummary, setShowCompletionSummary] =
    useState<boolean>(false);
  const [isReplaying, setIsReplaying] = useState<boolean>(false);
  const [lastStats, setLastStats] = useState<GameStats | null>(null);

  // Helper function to generate a new board
  const generateBoard = async (width: number, height: number) => {
    setBoardGenerating(true);
    setBoardError(null);
    setShowCompletionSummary(false);
    setIsReplaying(false);
    setLastStats(null);

    try {
      const boardData = await BoardService.generateBoard(width, height);
      setBoard(boardData.board);
      setBoardGenerating(false);
    } catch (error) {
      setBoardGenerating(false);
      setBoardError(
        error instanceof Error ? error : new Error("Unknown error occurred")
      );
    }
  };

  // Handle board size change
  const handleBoardSizeChange = (width: number, height: number) => {
    setBoardWidth(width);
    setBoardHeight(height);
    generateBoard(width, height);
  };

  // Handle board completion
  const handleBoardComplete = () => {
    setShowCompletionSummary(true);
    setIsReplaying(false);
    setLastStats(null);
  };

  // Handle new level request
  const handleNewLevel = () => {
    generateBoard(boardWidth, boardHeight);
  };

  // Handle replay level request
  const handleReplayLevel = () => {
    if (!lastStats) {
      setLastStats({ ...lastStats! });
    }
    setShowCompletionSummary(false);
    setIsReplaying(true);
  };

  // Handle back to stats
  const handleBackToStats = () => {
    setShowCompletionSummary(true);
    setIsReplaying(false);
  };

  // Handle board error retry
  const handleBoardErrorRetry = () => {
    generateBoard(boardWidth, boardHeight);
  };

  // Initialize with first board
  useEffect(() => {
    generateBoard(initialWidth, initialHeight);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Game Header */}
      {isReplaying && (
        <div className="flex flex-row justify-between items-center text-center space-y-0 relative px-12 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToStats}
            className="absolute left-0 top-1/2 -translate-y-1/2 min-w-[40px] p-2"
          >
            <ArrowLeft size={16} />
          </Button>
          <div className="text-lg text-base-content/80">
            <div className="text-xs text-warning mb-1">Replaying Level</div>
          </div>
        </div>
      )}

      {/* Game Core Component */}
      <GameCore
        boardWidth={boardWidth}
        boardHeight={boardHeight}
        board={board}
        boardGenerating={boardGenerating}
        boardError={boardError}
        showCompletionSummary={showCompletionSummary}
        lastStats={lastStats}
        onBoardComplete={handleBoardComplete}
        onNewLevel={handleNewLevel}
        onReplayLevel={handleReplayLevel}
        onBoardErrorRetry={handleBoardErrorRetry}
        showBoardSizeSelector={true}
        onBoardSizeChange={handleBoardSizeChange}
      />
    </div>
  );
};

export default Game;
