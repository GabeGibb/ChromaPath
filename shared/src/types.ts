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

export type GameStats = {
  startTime: number;
  endTime: number | null;
  totalMoves: number;
  pathsCompleted: number;
  boardSize: number;
};

export type GameState = {
  board: Board;
  paths: Paths;
  currentPathIndex: number | null;
  startPoint: Point | null;
  completed: boolean;
  mouseX: number;
  mouseY: number;
  preciseMouseX: number;
  preciseMouseY: number;
  stats: GameStats;
};
