import { RefreshCcw, Volume2, VolumeX, ArrowLeft } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { ChromaPathGame } from "../components/game/game-logic";
import { ChromaPathRenderer } from "../components/game/renderer";
import CompletionSummary from "../components/game/CompletionSummary";
import BoardService from "../services/board";
import { LocalStorageService } from "../services/localStorage/localStorage";
import { Button, LoadingSpinner } from "../components/ui";
import soundService from "../services/sound";
import { GameStats } from "@chromapath/shared/src";

interface Props {
  initialSize?: number;
}

const Game: React.FC<Props> = ({ initialSize = 5 }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<ChromaPathGame | null>(null);
  const rendererRef = useRef<ChromaPathRenderer | null>(null);
  const [boardSize, setBoardSize] = useState(initialSize);
  const [boardGenerating, setBoardGenerating] = useState<boolean>(true);
  const [numPaths, setNumPaths] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showCompletionSummary, setShowCompletionSummary] =
    useState<boolean>(false);
  const [isReplaying, setIsReplaying] = useState<boolean>(false);
  const [lastStats, setLastStats] = useState<GameStats | null>(null);

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
      if (gameActionsNotReady) return;

      const rect = canvas.getBoundingClientRect();
      const canvasWidth = rect.width;
      const cellSize = canvasWidth / boardSize;

      const x = Math.floor((event.clientX - rect.left) / cellSize);
      const y = Math.floor((event.clientY - rect.top) / cellSize);
      const clampedX = Math.max(0, Math.min(x, boardSize - 1));
      const clampedY = Math.max(0, Math.min(y, boardSize - 1));

      game.handleCellClick(clampedX, clampedY);
      const state = game.getState();
      if (state) renderer.render(state, boardSize);
    };

    const handlePointerMove = (event: PointerEvent | Touch) => {
      if (gameActionsNotReady) return;

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
      const state = game.getState();
      if (state) renderer.render(state, boardSize);
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      handlePointerMove(touch);
    };

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      handlePointerDown(touch);
    };

    const handlePointerUp = () => {
      if (gameActionsNotReady) return;

      const gameComplete = game.endDrag();
      const state = game.getState();
      if (state) renderer.render(state, boardSize);

      if (gameComplete) {
        soundService.playSuccessSound();
        setShowCompletionSummary(true);
        setIsReplaying(false);
        setLastStats(null);
      }
    };

    const handleWindowResize = () => {
      if (gameActionsNotReady || !canvasRef.current) return;
      renderer.resize(canvasRef.current);
      const state = game.getState();
      if (state) renderer.render(state, boardSize);
    };

    const preventSideSwipe = (event: TouchEvent) => {
      // Check if the touch is within the canvas bounds
      if (event.touches[0].clientX !== 0) {
        event.preventDefault(); // Only prevent default for touches inside canvas
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
  }, [boardSize, gameActionsNotReady]);

  const handleNewLevel = async () => {
    if (gameActionsNotReady && !boardGenerating) return;

    setBoardGenerating(true);
    setShowCompletionSummary(false);
    setIsReplaying(false);
    setLastStats(null);

    // ! OTHER BOARD GEN??
    // const boardGenerator = new BoardGenerator(rendererRef.current!);
    // const board = await boardGenerator.generateBoard(boardSize);
    // const board = generatePuzzle({ width: boardSize, height: boardSize });
    // console.log(board);
    const board = await BoardService.getRandomBoard(boardSize);

    setBoardGenerating(false);
    if (!board) return;

    gameRef.current?.reset(board);
    const state = gameRef.current?.getState();
    setNumPaths(state?.paths.length ?? 0);
    if (state) rendererRef.current?.render(state, boardSize);
  };

  const handleReplayLevel = async () => {
    if (gameActionsNotReady && !boardGenerating) return;

    // Store the current stats before hiding the summary
    if (gameRef.current) {
      setLastStats(gameRef.current.getState()?.stats!);
    }

    setShowCompletionSummary(false);
    setIsReplaying(true);

    gameRef.current?.refreshPaths();
    const state = gameRef.current?.getState();
    setNumPaths(state?.paths.length ?? 0);
    if (state) rendererRef.current?.render(state, boardSize);
  };

  const handleBackToStats = () => {
    setShowCompletionSummary(true);
    setIsReplaying(false);
  };

  useEffect(() => {
    handleNewLevel();
  }, [boardSize]);

  useEffect(() => {
    if (!canvasRef.current) return;
    rendererRef.current = new ChromaPathRenderer(canvasRef.current!);
    gameRef.current = new ChromaPathGame();
    handleNewLevel();

    return () => {
      rendererRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (!rendererRef.current) return;
    const settings = LocalStorageService.getSettings();
    const showNumbers = settings ? settings.show_numbers : false;
    rendererRef.current.showNumbers = showNumbers;
    rendererRef.current.render(gameRef.current?.getState()!, boardSize);
  }, []);

  // Initialize sound state
  useEffect(() => {
    const settings = LocalStorageService.getSettings();
    const soundEnabled = settings ? settings.sound_enabled !== false : true;
    setSoundEnabled(soundEnabled);
    soundService.setEnabled(soundEnabled);
  }, []);

  return (
    <div className="h-screen bg-gradient-to-br from-base-300 via-base-200 to-base-300 pt-4 pb-4 flex flex-col items-center justify-between gap-2 touch-none select-none">
      {/* Game Header */}
      <div className="text-center space-y-0 relative">
        {isReplaying && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToStats}
            className="absolute left-0 top-0 min-w-[40px] p-2"
          >
            <ArrowLeft size={16} />
          </Button>
        )}
        <div className="text-lg text-base-content/80">
          {isReplaying && (
            <div className="text-xs text-warning mb-1">Replaying Level</div>
          )}
          Paths: <span className="font-bold text-primary">{numPaths}</span>
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
        {showCompletionSummary &&
          (lastStats || gameRef.current?.getState()?.stats) && (
            <CompletionSummary
              stats={lastStats || gameRef.current?.getState()?.stats!}
              onContinue={handleNewLevel}
              onReplay={handleReplayLevel}
            />
          )}
        <div
          ref={canvasRef}
          className="w-[95dvw] h-[95dvw] md:w-[75dvh] md:h-[75dvh] border-2 border-base-300 rounded-lg shadow-2xl overscroll-none overflow-hidden bg-base-200"
        />
      </div>

      {/* Game Controls */}
      <div className="flex flex-row gap-2 justify-center items-center max-w-2xl mx-auto px-2 py-1">
        <Button
          onClick={handleNewLevel}
          loading={boardGenerating}
          disabled={boardGenerating}
          size="sm"
          className="min-w-[80px]"
        >
          New
        </Button>

        <select
          value={boardSize}
          onChange={(e) => setBoardSize(Number(e.target.value))}
          className="select select-bordered select-sm bg-base-200 text-base-content focus:outline-none focus:border-primary transition-colors min-w-[70px]"
          disabled={boardGenerating}
        >
          {Array.from({ length: 11 }, (_, i) => (
            <option key={i + 5} value={i + 5}>
              {i + 5}x{i + 5}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-1 text-base-content">
          <span className="text-xs">Show Numbers</span>
          <input
            type="checkbox"
            defaultChecked={LocalStorageService.getSettings()?.show_numbers}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              if (!gameRef.current || !rendererRef.current) return;
              rendererRef.current.showNumbers = e.target.checked;
              rendererRef.current.render(
                gameRef.current?.getState()!,
                boardSize
              );

              LocalStorageService.setSettings({
                show_numbers: e.target.checked,
              });
            }}
            className="checkbox checkbox-primary checkbox-sm"
          />
        </label>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const newSoundState = !soundEnabled;
            setSoundEnabled(newSoundState);
            soundService.setEnabled(newSoundState);

            // Save to localStorage
            LocalStorageService.setSettings({
              sound_enabled: newSoundState,
            });
          }}
          className="min-w-[40px] p-2"
        >
          {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            if (!gameRef.current || !rendererRef.current) return;
            gameRef.current?.refreshPaths();
            rendererRef.current.render(gameRef.current?.getState()!, boardSize);
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

export default Game;
