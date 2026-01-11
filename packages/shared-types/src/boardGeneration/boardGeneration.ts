import {
  getDirection,
  getEmptyCells,
  getEmptyRegions,
  getValidNeighbors,
  isValidPath,
  removeNonEndpoints,
  shuffleArray,
} from "../boardUtils";
import { Board, GameState, Point } from "../types";
import { pathsHaveBetterSolution } from "./boardValidatorUtils";

// Debug renderer interface - implement platform-specific versions
export interface DebugRenderer {
  render(state: GameState, boardWidth: number, boardHeight: number): void;
}

export class BoardGenerator {
  private boardWidth: number = 5;
  private boardHeight: number = 5;
  private board: Board = [];
  private readonly maxAttempts = 500000;
  private curColorIndex = 0;
  private minPathLength = 3;
  private maxPathLength = this.boardWidth * this.boardHeight;
  private maxNumPaths = 50;
  private renderer: DebugRenderer | null = null;
  private pathStack: Point[][] = [];
  private doRender: boolean = false;

  constructor(renderer: DebugRenderer | null = null) {
    if (this.doRender) this.renderer = renderer;
  }

  async generateBoard(width: number, height: number): Promise<Board> {
    this.boardWidth = width;
    this.boardHeight = height;
    this.maxNumPaths = Math.max(width, height) * 1.35;
    const start = performance.now();

    for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
      if (await this.generateValidBoard()) {
        console.log(
          "time for generation",
          (performance.now() - start) / 1000,
          "for board size",
          `${this.boardWidth}x${this.boardHeight}`
        );
        return removeNonEndpoints(this.board);
      }
    }

    throw new Error("Failed to generate valid board after maximum attempts");
  }

  private initializeEmptyBoard(): Board {
    return Array(this.boardHeight)
      .fill(null)
      .map(() => Array(this.boardWidth).fill(null));
  }

  private async debugBoard(
    timeout: number = 100,
    board: Board = this.board
  ): Promise<void> {
    if (!this.renderer) return;
    const gameState: GameState = {
      board: board,
      paths: [],
      currentPathIndex: null,
      startPoint: null,
      completed: false,
      mouseX: -1,
      mouseY: -1,
      preciseMouseX: -1,
      preciseMouseY: -1,
      stats: {
        startTime: Date.now(),
        endTime: null,
        totalMoves: 0,
        pathsCompleted: 0,
        boardWidth: this.boardWidth,
        boardHeight: this.boardHeight,
      },
      numConnectedPaths: 0,
    };
    this.renderer.render(gameState, this.boardWidth, this.boardHeight);
    await new Promise((resolve) => setTimeout(resolve, timeout));
  }

  private async generateValidBoard(): Promise<boolean> {
    this.curColorIndex = 0;
    this.pathStack = [];
    this.board = this.initializeEmptyBoard();
    while (true) {
      if (this.curColorIndex >= this.maxNumPaths) {
        return false;
      }
      if (
        (await this.placeColorEndpoints()) &&
        this.curColorIndex < this.maxNumPaths
      ) {
        await this.debugBoard(200);
        this.curColorIndex++;

        if (getEmptyCells(this.board).length === 0) {
          return !(await pathsHaveBetterSolution(
            this.board,
            this.curColorIndex
          ));
        }
      } else {
        await this.debugBoard(200);
        return false;
      }
    }
  }

  private async placeColorEndpoints(): Promise<boolean> {
    const blockedPaths = this.findBlockedPaths();
    if (blockedPaths.length > 0) {
      for (const blockedPath of blockedPaths) {
        for (let i = 0; i < 5; i++) {
          if (await this.attemptPathPlacement(blockedPath)) {
            return true;
          }
        }
      }
      return false;
    }

    for (let j = 0; j < 3; j++) {
      const emptyCells = shuffleArray(getEmptyCells(this.board));
      for (let i = 0; i < emptyCells.length; i++) {
        if (await this.attemptPathPlacement(emptyCells[i] as Point)) {
          return true;
        }
      }
    }
    return false;
  }

  private async attemptPathPlacement(start: Point): Promise<boolean> {
    this.board[start.y][start.x] = {
      pathIndex: this.curColorIndex,
      isEndpoint: true,
    };
    const path = this.findRandomValidPathFromStart(start);

    if (!path) {
      this.board[start.y][start.x] = null;
      return false;
    }

    const end = path[path.length - 1];
    this.board[end.y][end.x] = {
      pathIndex: this.curColorIndex,
      isEndpoint: true,
    };

    for (const point of path.slice(1, -1)) {
      this.board[point.y][point.x] = {
        pathIndex: this.curColorIndex,
        isEndpoint: false,
      };
    }

    if (!(await this.hasPotentialForValidSolution())) {
      this.board[start.y][start.x] = null;
      this.board[end.y][end.x] = null;

      for (const point of path.slice(1, -1)) {
        this.board[point.y][point.x] = null;
      }
      return false;
    }
    this.pathStack.push(path);

    return true;
  }

  private findBlockedPaths(): Point[] {
    const blockedPaths: Point[] = [];

    for (let y = 0; y < this.boardHeight; y++) {
      for (let x = 0; x < this.boardWidth; x++) {
        const cell = this.board[y][x];
        if (!cell) {
          const neighbors = getValidNeighbors(
            this.board,
            { x, y },
            new Set(),
            false
          );
          if (neighbors.length === 1) {
            blockedPaths.push({ x, y });
          }
        }
      }
    }

    return blockedPaths;
  }

  private findRandomValidPathFromStart(start: Point): Point[] | null {
    const visited = new Set<string>();
    const queue: { point: Point; path: Point[] }[] = [
      {
        point: start,
        path: [start],
      },
    ];

    const curWeights = {
      straight: 100 + this.boardWidth * this.boardHeight,
      left: 100,
      right: 100,
    };

    while (queue.length > 0) {
      const weights = {
        straight: Math.random() * curWeights.straight,
        left: Math.random() * curWeights.left,
        right: Math.random() * curWeights.right,
      };
      const { point, path } = queue.shift()!;
      const key = `${point.x},${point.y}`;
      if (visited.has(key)) continue;
      visited.add(key);

      const neighbors = getValidNeighbors(
        this.board,
        point,
        visited,
        false
      ).filter((neighbor) => isValidPath(this.board, [...path, neighbor]));

      if (
        path.length >= this.minPathLength &&
        (path.length == this.maxPathLength || neighbors.length === 0)
      ) {
        return path;
      }
      if (neighbors.length === 0) {
        return null;
      }

      const prevPoint = path.length >= 2 ? path[path.length - 2] : null;

      const weightedNeighbors = neighbors.sort((a, b) => {
        const directionA = getDirection(prevPoint, point, a);
        const directionB = getDirection(prevPoint, point, b);

        const weightA = weights[directionA] || 0;
        const weightB = weights[directionB] || 0;

        return weightB - weightA;
      });

      const neighbor = weightedNeighbors[0];
      queue.push({
        point: neighbor,
        path: [...path, neighbor],
      });
    }

    return null;
  }

  private async hasPotentialForValidSolution(): Promise<boolean> {
    const regions = getEmptyRegions(this.board);

    const totalEmptyCells = regions.reduce(
      (acc, region) => acc + region.length,
      0
    );
    if (
      totalEmptyCells >
      (this.maxNumPaths - this.curColorIndex) *
        Math.max(this.boardWidth, this.boardHeight)
    ) {
      return false;
    }

    for (const region of regions) {
      if (region.length < this.minPathLength) {
        return false;
      }
    }

    return true;
  }
}
