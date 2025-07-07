"use client";
import { RefreshCcw, Volume2, VolumeX, ArrowLeft } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { ChromaPathGame } from "@/services/game-logic";
import { ChromaPathRenderer } from "@/components/game/renderer";
import CompletionSummary from "@/components/game/CompletionSummary";
import BoardGenerationError from "@/components/game/BoardGenerationError";
import { useSetting } from "@/services/localStorage/SettingsContext";
import { Button, LoadingSpinner } from "@/components/ui";
import { useSound } from "@/services/sound/SoundContext";
import { GameStats } from "@/shared";
import { MAX_BOARD_SIZE, MIN_BOARD_SIZE } from "@/shared/consts";
import { BoardService } from "@/services/boardService";

const Game: React.FC = () => {
  const initialSize = 5; // Default size, can be made configurable via URL params or localStorage later
  const canvasRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<ChromaPathGame | null>(null);
  const rendererRef = useRef<ChromaPathRenderer | null>(null);

  // Use settings hooks
  const [showNumbers, setShowNumbers] = useSetting("show_numbers");
  const [timer, setTimer] = useState<number>(0);
  const soundService = useSound();

  // Helper function to render game state and update UI
  const renderGameState = () => {
    if (!gameRef.current || !rendererRef.current) return;
    const state = gameRef.current.getState();
    if (state) {
      rendererRef.current.render(state, boardSize);
      setNumCurrentPaths(state.numConnectedPaths);
    }
  };

  const [boardSize, setBoardSize] = useState(initialSize);
  const [boardGenerating, setBoardGenerating] = useState<boolean>(true);
  const [boardError, setBoardError] = useState<Error | null>(null);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [numPaths, setNumPaths] = useState<number>(0);
  const [numCurrentPaths, setNumCurrentPaths] = useState<number>(0);
  const [showCompletionSummary, setShowCompletionSummary] =
    useState<boolean>(false);
  const [isReplaying, setIsReplaying] = useState<boolean>(false);
  const [lastStats, setLastStats] = useState<GameStats | null>(null);

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

  // Implement some request animation frame to update the timer
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
        setShowCompletionSummary(true);
        setIsReplaying(false);
        setLastStats(null);
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

    // ! I DONT THINK THIS WORKS!!
    const preventSideSwipe = (event: TouchEvent) => {
      // Check if the touch is within the canvas bounds
      if (event.touches[0].clientX !== 0) {
        event.preventDefault();
      }
    };

    // Feature detection for different input types
    const supportsPointerEvents = window.PointerEvent !== undefined;
    const supportsTouchEvents =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;

    // Now conditionally add the event listeners
    if (supportsPointerEvents) {
      // Use pointer events for devices that support them (most modern browsers)
      document.addEventListener("pointerdown", handlePointerDown);
      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
    } else if (supportsTouchEvents) {
      // Fallback to touch events for older mobile devices
      canvas.addEventListener("touchstart", handleTouchStart);
      canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
      document.addEventListener("touchend", handlePointerUp);

      // Only add this touchmove prevention on touch devices
      // and only if the browser doesn't support pointer events
      document.addEventListener("touchmove", preventSideSwipe, {
        passive: false,
      });
    }

    // Resize event is universal
    window.addEventListener("resize", handleWindowResize);

    // Clean up function with conditional removals
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
  }, [boardSize, gameActionsNotReady, showCompletionSummary, boardError]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNewLevel = async () => {
    if (gameActionsNotReady && !boardGenerating) return;

    setBoardGenerating(true);
    setBoardError(null);
    setShowCompletionSummary(false);
    setIsReplaying(false);
    setLastStats(null);

    try {
      const boardData = await BoardService.generateBoard(boardSize);
      const board = boardData.board;

      setBoardGenerating(false);
      if (!board) {
        throw new Error("Invalid board data received");
      }

      gameRef.current?.reset(board);
      const state = gameRef.current?.getState();
      setNumPaths(state?.paths.length ?? 0);
      setNumCurrentPaths(state?.numConnectedPaths ?? 0);
      renderGameState();
    } catch (error) {
      setBoardGenerating(false);
      setBoardError(
        error instanceof Error ? error : new Error("Unknown error occurred")
      );
    }
  };

  const handleReplayLevel = async () => {
    if (gameActionsNotReady && !boardGenerating) return;

    // Store the current stats before hiding the summary (only if we don't already have lastStats)
    if (gameRef.current && !lastStats) {
      setLastStats({ ...gameRef.current.getState()?.stats! }); // eslint-disable-line
    }

    setShowCompletionSummary(false);
    setIsReplaying(true);

    gameRef.current?.refreshPaths();
    const state = gameRef.current?.getState();
    setNumPaths(state?.paths.length ?? 0);
    setNumCurrentPaths(state?.numConnectedPaths ?? 0);
    renderGameState();
  };

  const handleBackToStats = () => {
    setShowCompletionSummary(true);
    setIsReplaying(false);
  };

  useEffect(() => {
    handleNewLevel();
  }, [boardSize]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!canvasRef.current) return;
    rendererRef.current = new ChromaPathRenderer(canvasRef.current!);
    gameRef.current = new ChromaPathGame(soundService);
    handleNewLevel();

    return () => {
      rendererRef.current?.destroy();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.showNumbers = showNumbers;
    renderGameState();
  }, [showNumbers]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!gameRef.current) return;
    gameRef.current.updateSoundService(soundService);
  }, [soundService]);

  return (
    <div className="h-full bg-gradient-to-br from-base-300 via-base-200 to-base-300 xl:pt-4 pt-8 pb-8 flex flex-col items-center justify-center gap-2 touch-none select-none">
      {/* Game Header */}
      <div className="flex flex-row justify-between items-center text-center space-y-0 relative px-12">
        {isReplaying && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToStats}
            className="absolute left-0 top-1/2 -translate-y-1/2 min-w-[40px] p-2"
          >
            <ArrowLeft size={16} />
          </Button>
        )}
        <div className="text-lg text-base-content/80">
          {isReplaying && (
            <div className="text-xs text-warning mb-1">Replaying Level</div>
          )}
        </div>
      </div>

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
            onRetry={handleNewLevel}
            isRetrying={isRetrying}
          />
        )}
        {showCompletionSummary &&
          (lastStats || gameRef.current?.getState()?.stats) && (
            <CompletionSummary
              stats={lastStats || gameRef.current?.getState()?.stats!} // eslint-disable-line
              onContinue={handleNewLevel}
              onReplay={handleReplayLevel}
            />
          )}
        <div
          ref={canvasRef}
          className="w-[95dvw] h-[95dvw] md:w-[75dvh] md:h-[75dvh] border-2 border-base-300 rounded-lg shadow-2xl overscroll-none overflow-hidden bg-base-200"
        />
      </div>

      {/* Stats Display */}
      {!showCompletionSummary && !boardError && (
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
      )}

      {/* Game Controls */}
      <div className="flex flex-row gap-2 justify-center items-center max-w-2xl mx-auto px-2 py-1">
        <Button
          onClick={handleNewLevel}
          loading={boardGenerating}
          disabled={boardGenerating || isRetrying}
          size="sm"
          className="min-w-[80px]"
        >
          New
        </Button>

        <select
          value={boardSize}
          onChange={(e) => setBoardSize(Number(e.target.value))}
          className="select select-bordered select-sm bg-base-200 text-base-content focus:outline-none focus:border-primary transition-colors min-w-[70px]"
          disabled={boardGenerating || isRetrying}
        >
          {Array.from(
            { length: MAX_BOARD_SIZE - MIN_BOARD_SIZE + 1 },
            (_, i) => (
              <option key={i + MIN_BOARD_SIZE} value={i + MIN_BOARD_SIZE}>
                {i + MIN_BOARD_SIZE}x{i + MIN_BOARD_SIZE}
              </option>
            )
          )}
        </select>

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
          disabled={boardGenerating || isRetrying}
          className="min-w-[40px]"
        >
          <RefreshCcw size={14} />
        </Button>
      </div>
    </div>
  );
};

export default Game;
