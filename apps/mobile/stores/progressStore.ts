import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CATEGORIES } from '@/services/boardService';

interface LevelProgress {
  completed: boolean;
  bestTime?: number;
}

interface CategoryProgress {
  [levelId: number]: LevelProgress;
}

interface ProgressState {
  // Progress data: categoryId -> levelId -> progress
  progress: Record<string, CategoryProgress>;

  // Actions
  completeLevel: (categoryId: string, levelId: number, time: number) => void;
  isLevelUnlocked: (categoryId: string, levelId: number) => boolean;
  isLevelCompleted: (categoryId: string, levelId: number) => boolean;
  isCategoryUnlocked: (categoryId: string) => boolean;
  getBestTime: (categoryId: string, levelId: number) => number | undefined;
  getCompletedCount: (categoryId: string) => number;
  getTotalLevels: (categoryId: string) => number;
  resetProgress: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      progress: {},

      completeLevel: (categoryId: string, levelId: number, time: number) => {
        set((state) => {
          const categoryProgress = state.progress[categoryId] || {};
          const existingProgress = categoryProgress[levelId] || { completed: false };

          return {
            progress: {
              ...state.progress,
              [categoryId]: {
                ...categoryProgress,
                [levelId]: {
                  completed: true,
                  bestTime: existingProgress.bestTime
                    ? Math.min(existingProgress.bestTime, time)
                    : time,
                },
              },
            },
          };
        });
      },

      isLevelUnlocked: (categoryId: string, levelId: number) => {
        const state = get();

        // First level of first category is always unlocked
        if (categoryId === 'easy' && levelId === 1) {
          return true;
        }

        // Check if category is unlocked
        if (!state.isCategoryUnlocked(categoryId)) {
          return false;
        }

        // Level 1 of any unlocked category is unlocked
        if (levelId === 1) {
          return true;
        }

        // Previous level must be completed
        const categoryProgress = state.progress[categoryId] || {};
        const prevLevel = categoryProgress[levelId - 1];
        return prevLevel?.completed === true;
      },

      isLevelCompleted: (categoryId: string, levelId: number) => {
        const state = get();
        const categoryProgress = state.progress[categoryId] || {};
        return categoryProgress[levelId]?.completed === true;
      },

      isCategoryUnlocked: (categoryId: string) => {
        // First category always unlocked
        if (categoryId === 'easy') {
          return true;
        }

        const state = get();
        const categoryIndex = CATEGORIES.findIndex((c) => c.id === categoryId);

        if (categoryIndex <= 0) {
          return true;
        }

        // Previous category must have at least 10 levels completed
        const prevCategory = CATEGORIES[categoryIndex - 1];
        const prevProgress = state.progress[prevCategory.id] || {};
        const completedCount = Object.values(prevProgress).filter(
          (p) => p.completed
        ).length;

        return completedCount >= 10;
      },

      getBestTime: (categoryId: string, levelId: number) => {
        const state = get();
        const categoryProgress = state.progress[categoryId] || {};
        return categoryProgress[levelId]?.bestTime;
      },

      getCompletedCount: (categoryId: string) => {
        const state = get();
        const categoryProgress = state.progress[categoryId] || {};
        return Object.values(categoryProgress).filter((p) => p.completed).length;
      },

      getTotalLevels: (categoryId: string) => {
        const category = CATEGORIES.find((c) => c.id === categoryId);
        return category?.levels.length || 0;
      },

      resetProgress: () => {
        set({ progress: {} });
      },
    }),
    {
      name: 'chromapath-progress',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
