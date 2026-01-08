import { create } from 'zustand';
import {
  Board,
  GameState,
  BoardGenerator,
} from '@chromapath/shared-types';
import { ChromaPathGame } from '@chromapath/game-logic';
import * as Haptics from 'expo-haptics';

interface GameStore {
  // State
  board: Board | null;
  gameState: GameState | null;
  isGenerating: boolean;
  isCompleted: boolean;
  timer: number;
  numConnectedPaths: number;
  totalPaths: number;
  boardWidth: number;
  boardHeight: number;
  showNumbers: boolean;

  // Internal
  game: ChromaPathGame | null;
  timerInterval: ReturnType<typeof setInterval> | null;

  // Actions
  generateBoard: (width: number, height: number) => Promise<void>;
  handleCellClick: (x: number, y: number) => void;
  handleDrag: (x: number, y: number) => boolean;
  handleMouseMove: (x: number, y: number) => void;
  endDrag: () => void;
  refreshPaths: (hardReset?: boolean) => void;
  updateFromGameState: () => void;
  startTimer: () => void;
  stopTimer: () => void;
  setShowNumbers: (show: boolean) => void;
}

// Non-blocking haptic feedback service - uses setImmediate to not block JS thread
const hapticService = {
  lightTap: () => {
    setImmediate(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  },
  mediumTap: () => {
    setImmediate(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  },
  heavyTap: () => {
    setImmediate(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
  },
  success: () => {
    setImmediate(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  },
};

// Sound service (placeholder - can be implemented with expo-av later)
const soundService = {
  soundEnabled: true,
  playSoftClick: () => {},
  playHardClick: () => {},
  playSuccessSound: () => {},
};

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  board: null,
  gameState: null,
  isGenerating: false,
  isCompleted: false,
  timer: 0,
  numConnectedPaths: 0,
  totalPaths: 0,
  boardWidth: 5,
  boardHeight: 5,
  showNumbers: false,
  game: null,
  timerInterval: null,

  generateBoard: async (width: number, height: number) => {
    set({ isGenerating: true, isCompleted: false, boardWidth: width, boardHeight: height });
    get().stopTimer();

    try {
      const generator = new BoardGenerator();
      const board = await generator.generateBoard(width, height);

      const game = new ChromaPathGame({
        sound: soundService,
        haptics: hapticService,
      });

      game.reset(board);
      const state = game.getState();

      set({
        board,
        game,
        gameState: state,
        isGenerating: false,
        numConnectedPaths: state.numConnectedPaths,
        totalPaths: state.paths.length,
        timer: 0,
      });

      get().startTimer();
    } catch (error) {
      console.error('Failed to generate board:', error);
      set({ isGenerating: false });
    }
  },

  handleCellClick: (x: number, y: number) => {
    const { game } = get();
    if (!game) return;

    game.handleCellClick(x, y);
    get().updateFromGameState();
  },

  handleDrag: (x: number, y: number) => {
    const { game } = get();
    if (!game) return false;

    const completed = game.handleDrag(x, y);
    get().updateFromGameState();

    if (completed) {
      get().stopTimer();
      set({ isCompleted: true });
      hapticService.success();
    }

    return completed;
  },

  // Only update the game's internal state, don't trigger React re-render
  handleMouseMove: (x: number, y: number) => {
    const { game } = get();
    if (!game) return;
    game.handleMouseMove(x, y);
    // Don't call updateFromGameState here - it will be called by handleDrag
  },

  endDrag: () => {
    const { game } = get();
    if (!game) return;

    game.endDrag();
    get().updateFromGameState();
  },

  refreshPaths: (hardReset = false) => {
    const { game } = get();
    if (!game) return;

    game.refreshPaths(hardReset);
    get().updateFromGameState();

    if (hardReset) {
      set({ timer: 0, isCompleted: false });
      get().startTimer();
    }
  },

  updateFromGameState: () => {
    const { game } = get();
    if (!game) return;

    const state = game.getState();
    set({
      gameState: state,
      numConnectedPaths: state.numConnectedPaths,
      board: state.board,
    });
  },

  startTimer: () => {
    const { timerInterval } = get();
    if (timerInterval) clearInterval(timerInterval);

    const interval = setInterval(() => {
      const { gameState, isCompleted } = get();
      if (gameState && !isCompleted) {
        set({ timer: Date.now() - gameState.stats.startTime });
      }
    }, 10);

    set({ timerInterval: interval });
  },

  stopTimer: () => {
    const { timerInterval } = get();
    if (timerInterval) {
      clearInterval(timerInterval);
      set({ timerInterval: null });
    }
  },

  setShowNumbers: (show: boolean) => {
    set({ showNumbers: show });
  },
}));
