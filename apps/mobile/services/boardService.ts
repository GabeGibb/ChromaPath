/**
 * Board Service for Mobile
 *
 * Fetches boards from the API queue, with bundled boards as offline fallback.
 * Freeplay mode: all levels unlocked, endless boards via API.
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

// API base URL — set via EXPO_PUBLIC_API_URL env var, or defaults to production
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://chromapath.vercel.app';

// How many levels to show per board size
const LEVELS_PER_SIZE = 50;

// Level definition
export interface Level {
  id: number;
  width: number;
  height: number;
  label: string;
  boardIndex: number; // Which board from the pool to use (fallback only)
}

// Category definition
export interface Category {
  id: string;
  name: string;
  color: string;
  levels: Level[];
}

function makeLevels(startId: number, count: number, width: number, height: number): Level[] {
  return Array.from({ length: count }, (_, i) => ({
    id: startId + i,
    width,
    height,
    label: `${width}×${height}`,
    boardIndex: i,
  }));
}

// Define categories with their levels
export const CATEGORIES: Category[] = [
  {
    id: 'easy',
    name: 'Easy',
    color: '#4CAF50',
    levels: [
      ...makeLevels(1, LEVELS_PER_SIZE, 5, 5),
      ...makeLevels(LEVELS_PER_SIZE + 1, LEVELS_PER_SIZE, 6, 6),
      ...makeLevels(LEVELS_PER_SIZE * 2 + 1, LEVELS_PER_SIZE, 7, 7),
    ],
  },
  {
    id: 'medium',
    name: 'Medium',
    color: '#FFC107',
    levels: [
      ...makeLevels(1, LEVELS_PER_SIZE, 8, 8),
      ...makeLevels(LEVELS_PER_SIZE + 1, LEVELS_PER_SIZE, 9, 9),
      ...makeLevels(LEVELS_PER_SIZE * 2 + 1, LEVELS_PER_SIZE, 10, 10),
    ],
  },
  {
    id: 'hard',
    name: 'Hard',
    color: '#FF9800',
    levels: [
      ...makeLevels(1, LEVELS_PER_SIZE, 11, 11),
      ...makeLevels(LEVELS_PER_SIZE + 1, LEVELS_PER_SIZE, 12, 12),
      ...makeLevels(LEVELS_PER_SIZE * 2 + 1, LEVELS_PER_SIZE, 13, 13),
    ],
  },
  {
    id: 'expert',
    name: 'Expert',
    color: '#F44336',
    levels: [
      ...makeLevels(1, LEVELS_PER_SIZE, 14, 14),
      ...makeLevels(LEVELS_PER_SIZE + 1, LEVELS_PER_SIZE, 15, 15),
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
  // Try API first — always gives a fresh unique board
  const apiBoard = await fetchBoardFromAPI(level.width, level.height);
  if (apiBoard) return apiBoard;

  // Fallback to bundled (wraps around if boardIndex > available boards)
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
