export type Point = {
  x: number;
  y: number;
};

export type Cell = {
  pathIndex: number;
  isEndpoint: boolean;
} | null;

export type Board = Cell[][];

export type Paths = Point[][];

export type BoardDimensions = {
  width: number;
  height: number;
};

export type GameStats = {
  startTime: number;
  endTime: number | null;
  totalMoves: number;
  pathsCompleted: number;
  boardWidth: number;
  boardHeight: number;
};

export type GameState = {
  stats: GameStats;
  board: Board;
  paths: Paths;
  currentPathIndex: number | null;
  startPoint: Point | null;
  completed: boolean;
  mouseX: number;
  mouseY: number;
  preciseMouseX: number;
  preciseMouseY: number;
  numConnectedPaths: number;
};

// Sound service interface - platform agnostic
export interface SoundService {
  soundEnabled: boolean;
  playSoftClick: () => void;
  playHardClick: () => void;
  playSuccessSound: () => void;
}

// Haptic service interface - platform agnostic
export interface HapticService {
  lightTap: () => void;
  mediumTap: () => void;
  heavyTap: () => void;
  success: () => void;
}
