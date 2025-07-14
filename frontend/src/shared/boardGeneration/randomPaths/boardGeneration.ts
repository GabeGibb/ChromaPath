import { ChromaPathRenderer } from "@/components/game/renderer";
import {
  getDirection,
  getEmptyCells,
  getEmptyRegions,
  getValidNeighbors,
  isValidPath,
  removeNonEndpoints,
  shuffleArray,
} from "../../boardUtils";
import { Board, GameState, Point } from "../../types";
import { pathsHaveBetterSolution } from "./boardValidatorUtils";

export class BoardGenerator {
  private boardSize: number = 5;
  private board: Board = [];
  private readonly maxAttempts = 100000;
  private curColorIndex = 0;
  private minPathLength = 3;
  private maxPathLength = this.boardSize * this.boardSize;
  private maxNumPaths = 50;
  private renderer: ChromaPathRenderer | null = null;
  private pathStack: Point[][] = [];
  private doRender: boolean = false;

  constructor(renderer: ChromaPathRenderer | null) {
    if (this.doRender) this.renderer = renderer;
  }

  async generateBoard(boardSize: number): Promise<Board> {
    this.boardSize = boardSize;
    this.maxNumPaths = this.boardSize * 1.25;
    const start = performance.now();

    for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
      if (await this.generateValidBoard()) {
        // If board valid remove paths
        // console.log("attempts", attempt);
        console.log(
          "time for generation",
          (performance.now() - start) / 1000,
          "for board size",
          this.boardSize
        );
        return removeNonEndpoints(this.board);
      }
    }

    throw new Error("Failed to generate valid board after maximum attempts");
  }

  private initializeEmptyBoard(): Board {
    return Array(this.boardSize)
      .fill(null)
      .map(() => Array(this.boardSize).fill(null));
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
        boardSize: this.boardSize,
      },
      numConnectedPaths: 0,
    };
    this.renderer.render(gameState, this.boardSize);
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
          // await this.debugBoard(100);
          // console.log("starting validatrion");
          return !(await pathsHaveBetterSolution(
            this.board,
            this.curColorIndex
          ));
        }
      } else {
        // TODO: RECURSE
        await this.debugBoard(200);

        // ! BROKEN BACKTRACKING LOGIC
        // for (let i = 0; i < 1; i++) {
        // 	const lastPath = this.pathStack.pop();
        // 	if (!lastPath) {
        // 		return false;
        // 	}

        // 	// Remove last path
        // 	for (const point of lastPath) {
        // 		this.board[point.y][point.x] = null;
        // 	}
        // }

        // await this.debugBoard(500);

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

    // Arbitrarily loop through
    for (let j = 0; j < 3; j++) {
      const emptyCells = shuffleArray(getEmptyCells(this.board));
      for (let i = 0; i < emptyCells.length; i++) {
        if (await this.attemptPathPlacement(emptyCells[i] as Point)) {
          return true;
        }
      }
    }
    return false; // Return false if no valid placement was found
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

    // Place the path
    for (const point of path.slice(1, -1)) {
      this.board[point.y][point.x] = {
        pathIndex: this.curColorIndex,
        isEndpoint: false,
      };
    }

    // await this.debugBoard(100);

    // Check if board state is still valid after placing the path
    if (!(await this.hasPotentialForValidSolution())) {
      // If not valid remove the path
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

    for (let y = 0; y < this.boardSize; y++) {
      for (let x = 0; x < this.boardSize; x++) {
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

    // Weights favor continuing straight with occasional turns
    const curWeights = {
      straight: 100 + this.boardSize * this.boardSize, // TODO: INVESTIGATE??
      left: 100,
      right: 100,
    };

    while (queue.length > 0) {
      const weights = {
        straight: Math.random() * curWeights.straight, // High weight to favor straight paths
        left: Math.random() * curWeights.left, // Lower weights for turns
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

      // Check if this could be a valid ending
      if (
        path.length >= this.minPathLength &&
        (path.length == this.maxPathLength || neighbors.length === 0)
      ) {
        return path;
      }
      if (neighbors.length === 0) {
        return null;
      }

      // Get the previous point to determine current direction
      const prevPoint = path.length >= 2 ? path[path.length - 2] : null;

      // Sort neighbors by their directional weights
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
    // Region detection with enhanced validation
    const regions = getEmptyRegions(this.board);

    const totalEmptyCells = regions.reduce(
      (acc, region) => acc + region.length,
      0
    );
    // Check if there are too many empty cells
    if (
      totalEmptyCells >
      (this.maxNumPaths - this.curColorIndex) * this.boardSize
    ) {
      return false;
    }

    // Enhanced validation checks
    for (const region of regions) {
      // Check minimum path length
      if (region.length < this.minPathLength) {
        return false;
      }

      // ! Complex and slow?
      // Check for invalid patterns
      // if (!isValidRegionPattern(region)) {
      // 	return false;
      // }
    }

    return true;
  }
}
