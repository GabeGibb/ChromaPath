"use client";
import { RefreshCcw, Volume2, VolumeX } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { ChromaPathGame } from "@/services/game-logic";
import { ChromaPathRenderer } from "@/components/game/renderer";
import CompletionSummary from "@/components/game/CompletionSummary";
import BoardGenerationError from "@/components/game/BoardGenerationError";
import { useSetting } from "@/services/localStorage/SettingsContext";
import { Button, LoadingSpinner } from "@/components/ui";
import { useSound } from "@/services/sound/SoundContext";
import { GameStats } from "@/shared";
import { Board } from "@/shared/types";

interface GameCoreProps {
  // Game configuration
  boardSize: number;
  board: Board | null;
  boardGenerating: boolean;
  boardError: Error | null;

  // UI state
  showCompletionSummary: boolean;
  lastStats: GameStats | null;

  // Callbacks
  onBoardComplete: (stats: GameStats) => void;
  onNewLevel: () => void;
  onReplayLevel: () => void;
  onBoardErrorRetry: () => void;

  // Optional custom controls
  customControls?: React.ReactNode;
  showBoardSizeSelector?: boolean;
  onBoardSizeChange?: (size: number) => void;
}

const GameCore: React.FC<GameCoreProps> = ({
  boardSize,
  board,
  boardGenerating,
  boardError,
  showCompletionSummary,
  lastStats,
  onBoardComplete,
  onNewLevel,
  onReplayLevel,
  onBoardErrorRetry,
  customControls,
  showBoardSizeSelector = false,
  onBoardSizeChange,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<ChromaPathGame | null>(null);
  const rendererRef = useRef<ChromaPathRenderer | null>(null);

  // Use settings hooks
  const [showNumbers, setShowNumbers] = useSetting("show_numbers");
  const [timer, setTimer] = useState<number>(0);
  const soundService = useSound();

  // Game state
  const [numPaths, setNumPaths] = useState<number>(0);
  const [numCurrentPaths, setNumCurrentPaths] = useState<number>(0);

  // Helper function to render game state and update UI
  const renderGameState = () => {
    if (!gameRef.current || !rendererRef.current) return;
    const state = gameRef.current.getState();
    if (state) {
      rendererRef.current.render(state, boardSize);
      setNumCurrentPaths(state.numConnectedPaths);
    }
  };

  // Helper function to format time with hundredths precision
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

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      const gameState = gameRef.current?.getState();
      if (gameState && !showCompletionSummary && !boardGenerating) {
        setTimer(new Date().getTime() - gameState.stats.startTime);
      }
    }, 10);
    return () => clearInterval(interval);
  }, [showCompletionSummary, boardGenerating]);

  const gameActionsNotReady =
    !gameRef.current ||
    !rendererRef.current ||
    !rendererRef.current.initialized ||
    boardGenerating;

  // Initialize game components
  useEffect(() => {
    if (!canvasRef.current) return;
    rendererRef.current = new ChromaPathRenderer(canvasRef.current!);
    gameRef.current = new ChromaPathGame(soundService);

    return () => {
      rendererRef.current?.destroy();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update renderer settings
  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.showNumbers = showNumbers;
    renderGameState();
  }, [showNumbers]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update sound service
  useEffect(() => {
    if (!gameRef.current) return;
    gameRef.current.updateSoundService(soundService);
  }, [soundService]);

  // Reset game when board changes
  useEffect(() => {
    if (board && gameRef.current) {
      gameRef.current.reset(board);
      const state = gameRef.current.getState();
      setNumPaths(state?.paths.length ?? 0);
      setNumCurrentPaths(state?.numConnectedPaths ?? 0);
      renderGameState();
    }
  }, [board]); // eslint-disable-line react-hooks/exhaustive-deps

  // Event handlers
  useEffect(() => {
    if (gameActionsNotReady) return;
    const renderer = rendererRef.current!;
    const game = gameRef.current!;
    const canvas = renderer.getCanvas();

    const handlePointerDown = (event: PointerEvent | Touch) => {
      if (gameActionsNotReady || showCompletionSummary || boardError) return;

      const rect = canvas.getBoundingClientRect();
      const canvasWidth = rect.width;
      const cellSize = canvasWidth / boardSize;

      const x = Math.floor((event.clientX - rect.left) / cellSize);
      const y = Math.floor((event.clientY - rect.top) / cellSize);
      const clampedX = Math.max(0, Math.min(x, boardSize - 1));
      const clampedY = Math.max(0, Math.min(y, boardSize - 1));

      game.handleCellClick(clampedX, clampedY);
      renderGameState();
    };

    const handlePointerMove = (event: PointerEvent | Touch) => {
      if (gameActionsNotReady || showCompletionSummary || boardError) return;

      const rect = canvas.getBoundingClientRect();
      const canvasWidth = rect.width;
      const cellSize = canvasWidth / boardSize;

      const preciseX = (event.clientX - rect.left) / cellSize;
      const preciseY = (event.clientY - rect.top) / cellSize;
      const x = Math.floor(preciseX);
      const y = Math.floor(preciseY);
      const clampedX = Math.max(0, Math.min(x, boardSize - 1));
      const clampedY = Math.max(0, Math.min(y, boardSize - 1));

      game.handleDrag(clampedX, clampedY);
      game.setPreciseMouse(preciseX, preciseY);
      game.handleMouseMove(x, y);
      renderGameState();
    };

    const handlePointerUp = () => {
      if (gameActionsNotReady || showCompletionSummary || boardError) return;

      const gameComplete = game.endDrag();
      renderGameState();

      if (gameComplete) {
        soundService.playSuccessSound();
        const gameState = game.getState();
        if (gameState?.stats) {
          // ? Update timer since it's kinda janky
          if (gameState.stats.endTime) {
            setTimer(gameState.stats.endTime - gameState.stats.startTime);
          }
          onBoardComplete(gameState.stats);
        }
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      handlePointerMove(touch);
    };

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      handlePointerDown(touch);
    };

    const handleWindowResize = () => {
      if (gameActionsNotReady || !canvasRef.current) return;
      renderer.resize(canvasRef.current);
      renderGameState();
    };

    const preventSideSwipe = (event: TouchEvent) => {
      if (event.touches[0].clientX !== 0) {
        event.preventDefault();
      }
    };

    // Feature detection for different input types
    const supportsPointerEvents = window.PointerEvent !== undefined;
    const supportsTouchEvents =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;

    // Add event listeners
    if (supportsPointerEvents) {
      document.addEventListener("pointerdown", handlePointerDown);
      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
    } else if (supportsTouchEvents) {
      canvas.addEventListener("touchstart", handleTouchStart);
      canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
      document.addEventListener("touchend", handlePointerUp);
      document.addEventListener("touchmove", preventSideSwipe, {
        passive: false,
      });
    }

    window.addEventListener("resize", handleWindowResize);

    // Clean up function
    return () => {
      if (supportsPointerEvents) {
        document.removeEventListener("pointerdown", handlePointerDown);
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", handlePointerUp);
      } else if (supportsTouchEvents) {
        canvas.removeEventListener("touchstart", handleTouchStart);
        canvas.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handlePointerUp);
        document.removeEventListener("touchmove", preventSideSwipe);
      }

      window.removeEventListener("resize", handleWindowResize);
    };
  }, [
    boardSize,
    gameActionsNotReady,
    showCompletionSummary,
    boardError,
    onBoardComplete,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="h-full bg-gradient-to-br from-base-300 via-base-200 to-base-300 xl:pt-4 pt-8 pb-8 flex flex-col items-center justify-center gap-2 touch-none select-none">
      {/* Game Canvas */}
      <div className="relative flex-1 flex items-center justify-center">
        {boardGenerating && (
          <div className="absolute inset-0 bg-base-300/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
            <div className="text-center space-y-2">
              <LoadingSpinner size="md" />
              <div className="text-base-content font-semibold text-sm">
                Generating Board...
              </div>
            </div>
          </div>
        )}

        {boardError && (
          <BoardGenerationError
            error={boardError}
            onRetry={onBoardErrorRetry}
          />
        )}

        {showCompletionSummary &&
          (lastStats || gameRef.current?.getState()?.stats) && (
            <CompletionSummary
              // eslint-disable-next-line
              stats={lastStats || gameRef.current?.getState()?.stats!}
              onContinue={onNewLevel}
              onReplay={() => {
                onReplayLevel();
                gameRef.current?.refreshPaths(true);
                const state = gameRef.current?.getState();
                setNumPaths(state?.paths.length ?? 0);
                setNumCurrentPaths(state?.numConnectedPaths ?? 0);
                renderGameState();
              }}
            />
          )}

        <div
          ref={canvasRef}
          className="w-[95dvw] h-[95dvw] md:w-[75dvh] md:h-[75dvh] border-2 border-base-300 rounded-lg shadow-2xl overscroll-none overflow-hidden bg-base-200"
        />
      </div>

      {/* Stats Display */}
      <div className="flex justify-between items-center py-2 px-4 max-w-2xl mx-auto w-full">
        {/* Paths Counter - Left */}
        <div className="bg-base-200/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-base-300 shadow-lg">
          <div className="text-center">
            <div className="text-xs text-base-content/60 mb-1">Paths</div>
            <div className="text-lg font-bold text-secondary">
              {numCurrentPaths}/{numPaths}
            </div>
          </div>
        </div>

        {/* Timer - Center */}
        <div className="bg-base-200/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-base-300 shadow-lg">
          <div className="text-center">
            <div className="text-xs text-base-content/60 mb-1">Time</div>
            <div className="text-xl font-mono font-bold text-primary">
              {formatTime(timer)}
            </div>
          </div>
        </div>

        {/* Placeholder for balance - Right */}
        <div className="w-20"></div>
      </div>

      {/* Game Controls */}
      <div className="flex flex-row gap-2 justify-center items-center max-w-2xl mx-auto px-2 py-1">
        {/* Custom controls or default controls */}
        {customControls || (
          <>
            <Button
              onClick={onNewLevel}
              loading={boardGenerating}
              disabled={boardGenerating}
              size="sm"
              className="min-w-[80px]"
            >
              New
            </Button>

            {showBoardSizeSelector && onBoardSizeChange && (
              <select
                value={boardSize}
                onChange={(e) => onBoardSizeChange(Number(e.target.value))}
                className="select select-bordered select-sm bg-base-200 text-base-content focus:outline-none focus:border-primary transition-colors min-w-[70px]"
                disabled={boardGenerating}
              >
                {Array.from({ length: 16 - 5 + 1 }, (_, i) => (
                  <option key={i + 5} value={i + 5}>
                    {i + 5}x{i + 5}
                  </option>
                ))}
              </select>
            )}
          </>
        )}

        <label className="flex items-center gap-1 text-base-content">
          <span className="text-xs">Show Numbers</span>
          <input
            type="checkbox"
            checked={showNumbers}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              if (!gameRef.current || !rendererRef.current) return;
              rendererRef.current.showNumbers = e.target.checked;
              renderGameState();
              setShowNumbers(e.target.checked);
            }}
            className="checkbox checkbox-primary checkbox-sm"
          />
        </label>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            soundService.setSoundEnabled(!soundService.soundEnabled);
          }}
          className="min-w-[40px] p-2"
        >
          {soundService.soundEnabled ? (
            <Volume2 size={14} />
          ) : (
            <VolumeX size={14} />
          )}
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            if (!gameRef.current || !rendererRef.current) return;
            gameRef.current?.refreshPaths();
            renderGameState();
          }}
          disabled={boardGenerating}
          className="min-w-[40px]"
        >
          <RefreshCcw size={14} />
        </Button>
      </div>
    </div>
  );
};

export default GameCore;
