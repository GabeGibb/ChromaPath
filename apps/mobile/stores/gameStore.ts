import { create } from 'zustand';
import {
  Board,
  GameState,
} from '@chromapath/shared-types';
import { ChromaPathGame } from '@chromapath/game-logic';
import * as Haptics from 'expo-haptics';
import { Level } from '@/services/boardService';
import { useProgressStore } from './progressStore';

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
  hapticsEnabled: boolean;

  // Current level info
  currentCategoryId: string | null;
  currentLevel: Level | null;

  // Internal
  game: ChromaPathGame | null;
  timerInterval: ReturnType<typeof setInterval> | null;

  // Actions
  setCurrentLevel: (categoryId: string, level: Level, board: Board) => void;
  handleCellClick: (x: number, y: number) => void;
  handleDrag: (x: number, y: number) => boolean;
  handleMouseMove: (x: number, y: number) => void;
  endDrag: () => void;
  refreshPaths: (hardReset?: boolean) => void;
  updateFromGameState: () => void;
  startTimer: () => void;
  stopTimer: () => void;
  setShowNumbers: (show: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
}

// Track haptics enabled state (will be set by store)
let hapticsEnabledRef = true;

// Non-blocking haptic feedback service - uses setImmediate to not block JS thread
const hapticService = {
  lightTap: () => {
    if (!hapticsEnabledRef) return;
    setImmediate(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  },
  mediumTap: () => {
    if (!hapticsEnabledRef) return;
    setImmediate(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  },
  heavyTap: () => {
    if (!hapticsEnabledRef) return;
    setImmediate(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
  },
  success: () => {
    if (!hapticsEnabledRef) return;
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
  hapticsEnabled: true,
  currentCategoryId: null,
  currentLevel: null,
  game: null,
  timerInterval: null,

  setCurrentLevel: (categoryId: string, level: Level, board: Board) => {
    get().stopTimer();

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
      isCompleted: false,
      numConnectedPaths: state.numConnectedPaths,
      totalPaths: state.paths.length,
      timer: 0,
      boardWidth: level.width,
      boardHeight: level.height,
      currentCategoryId: categoryId,
      currentLevel: level,
    });

    get().startTimer();
  },

  handleCellClick: (x: number, y: number) => {
    const { game } = get();
    if (!game) return;

    game.handleCellClick(x, y);
    get().updateFromGameState();
  },

  handleDrag: (x: number, y: number) => {
    const { game, currentCategoryId, currentLevel, timer } = get();
    if (!game) return false;

    const completed = game.handleDrag(x, y);
    get().updateFromGameState();

    if (completed) {
      get().stopTimer();
      set({ isCompleted: true });
      hapticService.success();

      // Save progress
      if (currentCategoryId && currentLevel) {
        useProgressStore.getState().completeLevel(
          currentCategoryId,
          currentLevel.id,
          timer
        );
      }
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

  setHapticsEnabled: (enabled: boolean) => {
    hapticsEnabledRef = enabled;
    set({ hapticsEnabled: enabled });
  },
}));
