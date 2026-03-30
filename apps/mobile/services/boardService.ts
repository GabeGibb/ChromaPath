/**
 * Board Service for Mobile
 *
 * Fetches boards from the API queue, with bundled boards as offline fallback.
 */

import { Board, BoardGenerator } from '@chromapath/shared-types';

// Static imports for all board sizes (Metro requires this)
import boards5x5 from '../assets/boards/boards-5x5.json';
import boards6x6 from '../assets/boards/boards-6x6.json';
import boards7x7 from '../assets/boards/boards-7x7.json';
import boards8x8 from '../assets/boards/boards-8x8.json';
import boards9x9 from '../assets/boards/boards-9x9.json';
import boards10x10 from '../assets/boards/boards-10x10.json';
import boards11x11 from '../assets/boards/boards-11x11.json';
import boards12x12 from '../assets/boards/boards-12x12.json';
import boards13x13 from '../assets/boards/boards-13x13.json';
import boards14x14 from '../assets/boards/boards-14x14.json';
import boards15x15 from '../assets/boards/boards-15x15.json';
import boards15x16 from '../assets/boards/boards-15x16.json';
import boards15x17 from '../assets/boards/boards-15x17.json';
import boards15x18 from '../assets/boards/boards-15x18.json';
import boards15x19 from '../assets/boards/boards-15x19.json';
import boards15x20 from '../assets/boards/boards-15x20.json';

// API base URL — set via EXPO_PUBLIC_API_URL env var, or defaults to production
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://chromapath.vercel.app';

// Level definition
export interface Level {
  id: number;
  width: number;
  height: number;
  label: string;
  boardIndex: number; // Which board from the pool to use
}

// Category definition
export interface Category {
  id: string;
  name: string;
  color: string;
  levels: Level[];
}

// Define categories with their levels
export const CATEGORIES: Category[] = [
  {
    id: 'easy',
    name: 'Easy',
    color: '#4CAF50',
    levels: [
      // 5x5 levels (1-10)
      ...Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        width: 5,
        height: 5,
        label: '5×5',
        boardIndex: i,
      })),
      // 6x6 levels (11-20)
      ...Array.from({ length: 10 }, (_, i) => ({
        id: i + 11,
        width: 6,
        height: 6,
        label: '6×6',
        boardIndex: i,
      })),
      // 7x7 levels (21-30)
      ...Array.from({ length: 10 }, (_, i) => ({
        id: i + 21,
        width: 7,
        height: 7,
        label: '7×7',
        boardIndex: i,
      })),
    ],
  },
  {
    id: 'medium',
    name: 'Medium',
    color: '#FFC107',
    levels: [
      // 8x8 levels (1-10)
      ...Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        width: 8,
        height: 8,
        label: '8×8',
        boardIndex: i,
      })),
      // 9x9 levels (11-20)
      ...Array.from({ length: 10 }, (_, i) => ({
        id: i + 11,
        width: 9,
        height: 9,
        label: '9×9',
        boardIndex: i,
      })),
      // 10x10 levels (21-30)
      ...Array.from({ length: 10 }, (_, i) => ({
        id: i + 21,
        width: 10,
        height: 10,
        label: '10×10',
        boardIndex: i,
      })),
    ],
  },
  {
    id: 'hard',
    name: 'Hard',
    color: '#FF9800',
    levels: [
      // 11x11 levels (1-10)
      ...Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        width: 11,
        height: 11,
        label: '11×11',
        boardIndex: i,
      })),
      // 12x12 levels (11-20)
      ...Array.from({ length: 10 }, (_, i) => ({
        id: i + 11,
        width: 12,
        height: 12,
        label: '12×12',
        boardIndex: i,
      })),
      // 13x13 levels (21-30)
      ...Array.from({ length: 10 }, (_, i) => ({
        id: i + 21,
        width: 13,
        height: 13,
        label: '13×13',
        boardIndex: i,
      })),
    ],
  },
  {
    id: 'expert',
    name: 'Expert',
    color: '#F44336',
    levels: [
      // 14x14 levels (1-10)
      ...Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        width: 14,
        height: 14,
        label: '14×14',
        boardIndex: i,
      })),
      // 15x15 levels (11-20)
      ...Array.from({ length: 10 }, (_, i) => ({
        id: i + 11,
        width: 15,
        height: 15,
        label: '15×15',
        boardIndex: i,
      })),
    ],
  },
  {
    id: 'master',
    name: 'Master',
    color: '#9C27B0',
    levels: [
      // 15x16 levels (1-10)
      ...Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        width: 15,
        height: 16,
        label: '15×16',
        boardIndex: i,
      })),
      // 15x17 levels (11-20)
      ...Array.from({ length: 10 }, (_, i) => ({
        id: i + 11,
        width: 15,
        height: 17,
        label: '15×17',
        boardIndex: i,
      })),
      // 15x18 levels (21-30)
      ...Array.from({ length: 10 }, (_, i) => ({
        id: i + 21,
        width: 15,
        height: 18,
        label: '15×18',
        boardIndex: i,
      })),
      // 15x19 levels (31-40)
      ...Array.from({ length: 10 }, (_, i) => ({
        id: i + 31,
        width: 15,
        height: 19,
        label: '15×19',
        boardIndex: i,
      })),
      // 15x20 levels (41-50)
      ...Array.from({ length: 10 }, (_, i) => ({
        id: i + 41,
        width: 15,
        height: 20,
        label: '15×20',
        boardIndex: i,
      })),
    ],
  },
];

// Map of all bundled boards
const BUNDLED_BOARDS: Record<string, Board[]> = {
  '5x5': boards5x5 as Board[],
  '6x6': boards6x6 as Board[],
  '7x7': boards7x7 as Board[],
  '8x8': boards8x8 as Board[],
  '9x9': boards9x9 as Board[],
  '10x10': boards10x10 as Board[],
  '11x11': boards11x11 as Board[],
  '12x12': boards12x12 as Board[],
  '13x13': boards13x13 as Board[],
  '14x14': boards14x14 as Board[],
  '15x15': boards15x15 as Board[],
  '15x16': boards15x16 as Board[],
  '15x17': boards15x17 as Board[],
  '15x18': boards15x18 as Board[],
  '15x19': boards15x19 as Board[],
  '15x20': boards15x20 as Board[],
};

/**
 * Fetch a fresh board from the API queue
 */
async function fetchBoardFromAPI(width: number, height: number): Promise<Board | null> {
  try {
    const res = await fetch(`${API_URL}/api/puzzle/queue?width=${width}&height=${height}`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.board ?? null;
  } catch {
    return null;
  }
}

/**
 * Get a bundled board as fallback
 */
function getBundledBoard(width: number, height: number, boardIndex: number): Board {
  const key = `${width}x${height}`;
  const boards = BUNDLED_BOARDS[key];

  if (boards && boards.length > 0) {
    return boards[boardIndex % boards.length];
  }

  // Last resort: generate on device
  console.warn(`No bundled board for ${key}[${boardIndex}], generating...`);
  const generator = new BoardGenerator();
  return generator.generateBoard(width, height);
}

/**
 * Get a board for a specific level.
 * Tries the API first for a fresh puzzle, falls back to bundled boards.
 */
export async function getBoardForLevel(level: Level): Promise<Board> {
  // Try API first
  const apiBoard = await fetchBoardFromAPI(level.width, level.height);
  if (apiBoard) return apiBoard;

  // Fallback to bundled
  return getBundledBoard(level.width, level.height, level.boardIndex);
}

/**
 * Get a category by ID
 */
export function getCategory(categoryId: string): Category | undefined {
  return CATEGORIES.find(c => c.id === categoryId);
}

/**
 * Get a level by category and level ID
 */
export function getLevel(categoryId: string, levelId: number): Level | undefined {
  const category = getCategory(categoryId);
  return category?.levels.find(l => l.id === levelId);
}
