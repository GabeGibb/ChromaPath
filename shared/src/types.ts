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
};
