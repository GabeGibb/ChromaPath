import {
  Board,
  GameState,
  GameStats,
  getValidNeighbors,
  Point,
  removeNonEndpoints,
} from "@/shared";

// Import the sound context type
import type { SoundContextType } from "./sound/SoundContext";

export class ChromaPathGame {
  private state: GameState;
  private boardSize: number = 0;
  private soundService: SoundContextType;

  constructor(soundService: SoundContextType) {
    this.soundService = soundService;
    this.state = this.initializeState();
  }

  public updateSoundService(soundService: SoundContextType): void {
    this.soundService = soundService;
  }

  private initializeState(newBoard: Board = []): GameState {
    const endpointGroups = newBoard.reduce((groups, row) => {
      row.forEach((cell) => {
        if (cell?.isEndpoint) {
          if (!groups[cell.pathIndex]) {
            groups[cell.pathIndex] = [];
          }
          groups[cell.pathIndex].push(cell);
        }
      });
      return groups;
    }, {} as Record<number, (typeof newBoard)[0]>);

    const paths = Object.keys(endpointGroups).map(() => []);

    const stats: GameStats = {
      startTime: Date.now(),
      endTime: null,
      totalMoves: 0,
      pathsCompleted: 0,
      boardSize: newBoard.length,
    };

    // Play success sound
    this.soundService.playSuccessSound();

    return {
      board: newBoard,
      paths,
      currentPathIndex: null,
      startPoint: null,
      completed: false,
      mouseX: -1,
      mouseY: -1,
      preciseMouseX: -1,
      preciseMouseY: -1,
      stats,
      numConnectedPaths: 0,
    };
  }

  private isValidMove(x: number, y: number, pathIndex: number): boolean {
    const cell = this.state.board[y][x];

    // Check if position is already part of another path
    for (let i = 0; i < this.state.paths.length; i++) {
      const path = this.state.paths[i];
      if (i !== pathIndex && path.some((p) => p.x === x && p.y === y)) {
        return false;
      }
    }

    // Check if the cell is part of the same color or is empty
    if (cell && cell.pathIndex !== pathIndex) {
      return false;
    }

    return true;
  }

  public handleCellClick(x: number, y: number): void {
    const cell = this.state.board[y][x];
    // Handle endpoint clicks
    if (cell?.isEndpoint) {
      this.state.currentPathIndex = cell.pathIndex;
      this.state.startPoint = { x, y };
      this.state.paths[cell.pathIndex] = [{ x, y }];
      this.updateBoardFromPaths();
    }
    // Check if clicked on any existing path
    for (let i = 0; i < this.state.paths.length; i++) {
      const path = this.state.paths[i];

      // Find the index of the clicked point in this path
      const clickedIndex = path.findIndex((p) => p.x === x && p.y === y);

      if (clickedIndex !== -1) {
        this.state.currentPathIndex = i;
        this.state.startPoint = path[0];
        // Slice up to the clicked point's position + 1, not the path index
        this.state.paths[i] = path.slice(0, clickedIndex + 1);
        this.updateBoardFromPaths();
        return;
      }
    }
  }

  public handleMouseMove(x: number, y: number): void {
    this.state.mouseX = x;
    this.state.mouseY = y;
  }

  public setPreciseMouse(x: number, y: number): void {
    this.state.preciseMouseX = x;
    this.state.preciseMouseY = y;
  }

  private updateBoardFromPaths(): void {
    // Clear all non-endpoint cells first
    for (let y = 0; y < this.boardSize; y++) {
      for (let x = 0; x < this.boardSize; x++) {
        const cell = this.state.board[y][x];
        if (cell && !cell.isEndpoint) {
          this.state.board[y][x] = null;
        }
      }
    }

    // Update board with current paths
    for (let pathIndex = 0; pathIndex < this.state.paths.length; pathIndex++) {
      const path = this.state.paths[pathIndex];
      for (const point of path) {
        // Don't overwrite endpoints
        const existingCell = this.state.board[point.y][point.x];
        if (!existingCell?.isEndpoint) {
          this.state.board[point.y][point.x] = {
            pathIndex,
            isEndpoint: false,
          };
        }
      }
    }

    // Update path completion count
    this.updatePathCompletionCount();
    // Update connected paths count
    this.updateConnectedPathsCount();
  }

  private incrementMoves(): void {
    this.state.stats.totalMoves++;
  }

  private checkPathCompletion(pathIndex: number): boolean {
    const path = this.state.paths[pathIndex];
    if (path.length < 2) return false;

    const startPoint = path[0];
    const endPoint = path[path.length - 1];

    const startCell = this.state.board[startPoint.y][startPoint.x];
    const endCell = this.state.board[endPoint.y][endPoint.x];

    // Check if both start and end are endpoints of the same color
    return !!(
      (
        startCell?.isEndpoint &&
        endCell?.isEndpoint &&
        startCell.pathIndex === pathIndex &&
        endCell.pathIndex === pathIndex &&
        (startPoint.x !== endPoint.x || startPoint.y !== endPoint.y)
      ) // Ensure they're different points
    );
  }

  private updatePathCompletionCount(): void {
    let completedPaths = 0;
    for (let i = 0; i < this.state.paths.length; i++) {
      if (this.checkPathCompletion(i)) {
        completedPaths++;
      }
    }
    this.state.stats.pathsCompleted = completedPaths;
  }

  private updateConnectedPathsCount(): void {
    this.state.numConnectedPaths = this.state.paths.filter((path) => {
      if (path.length === 0) return false;

      const startPoint = path[0];
      const endPoint = path[path.length - 1];

      if (startPoint.x === endPoint.x && startPoint.y === endPoint.y) {
        return false;
      }

      // Check if start and end points are endpoints
      const startCell = this.state.board[startPoint.y]?.[startPoint.x];
      const endCell = this.state.board[endPoint.y]?.[endPoint.x];

      return startCell?.isEndpoint && endCell?.isEndpoint;
    }).length;
  }

  public handleDrag(x: number, y: number): void {
    if (this.state.currentPathIndex === null || !this.state.startPoint) return;

    const currentPath = this.state.paths[this.state.currentPathIndex];
    const lastPoint = currentPath[currentPath.length - 1];

    // Clamp coordinates to board bounds first
    const clampedX = Math.max(0, Math.min(x, this.boardSize - 1));
    const clampedY = Math.max(0, Math.min(y, this.boardSize - 1));

    // If the clamped position is not valid, find the closest valid point
    if (!this.isValidMove(clampedX, clampedY, this.state.currentPathIndex)) {
      const closestPoint = this.findClosestValidPoint(
        clampedX,
        clampedY,
        this.state.currentPathIndex
      );

      if (!closestPoint) return;

      // Use the closest valid point
      x = closestPoint.x;
      y = closestPoint.y;
    } else {
      // Use the clamped coordinates
      x = clampedX;
      y = clampedY;
    }

    // Handle backtracking
    const backtrackIndex = currentPath.findIndex((p) => p.x === x && p.y === y);
    if (backtrackIndex !== -1) {
      const newPath = currentPath.slice(0, backtrackIndex + 1);
      // Only update and play sound if the path actually changed
      if (newPath.length !== currentPath.length) {
        this.state.paths[this.state.currentPathIndex] = newPath;
        this.updateBoardFromPaths();
        // Play soft click sound for backtracking
        this.soundService.playSoftClick();
      }
      return;
    }

    // Check if at non-start endpoint
    const isAtEndpoint = this.isAtEndpoint(lastPoint, this.state.startPoint);
    const adjacentBeyond = isAtEndpoint && currentPath.length > 1;

    if (isAtEndpoint && currentPath.length > 1) return;

    // Handle adjacent moves
    if (
      Math.abs(x - lastPoint.x) + Math.abs(y - lastPoint.y) === 1 &&
      !adjacentBeyond
    ) {
      this.state.paths[this.state.currentPathIndex] = [
        ...currentPath,
        { x, y },
      ];
      this.updateBoardFromPaths();
      this.incrementMoves();

      // Check if this move connects to an endpoint
      const cell = this.state.board[y][x];
      if (cell?.isEndpoint && cell.pathIndex === this.state.currentPathIndex) {
        // Play hard click sound for connection
        this.soundService.playSoftClick();
        this.soundService.playHardClick();
      } else {
        // Play soft click sound for tile placement
        this.soundService.playSoftClick();
      }
      return;
    }

    // If current path is connected by two endpoints, dont allow any more moves
    if (this.state.paths[this.state.currentPathIndex].length > 1) {
      const startPoint = this.state.paths[this.state.currentPathIndex][0];
      const endPoint =
        this.state.paths[this.state.currentPathIndex][
          this.state.paths[this.state.currentPathIndex].length - 1
        ];
      if (
        this.isAtEndpoint(startPoint, this.state.startPoint) &&
        this.isAtEndpoint(endPoint, this.state.startPoint)
      ) {
        return;
      }
    }

    // Handle pathfinding for non-adjacent moves
    const curPathCopy = [...currentPath];
    for (let i = currentPath.length - 1; i >= 0; i--) {
      const visited = new Set<string>();
      for (const point of currentPath.slice(0, i)) {
        visited.add(`${point.x},${point.y}`);
      }
      if (this.findPathToPoint(currentPath[i], { x, y }, visited)) {
        const path = curPathCopy
          .slice(0, i)
          .concat(this.state.paths[this.state.currentPathIndex]);
        this.state.paths[this.state.currentPathIndex] = path;
        this.updateBoardFromPaths();
        this.incrementMoves();

        // Check if this pathfinding move connects to an endpoint
        const cell = this.state.board[y][x];
        if (
          cell?.isEndpoint &&
          cell.pathIndex === this.state.currentPathIndex
        ) {
          // Play hard click sound for connection
          this.soundService.playSoftClick();
          this.soundService.playHardClick();
        } else {
          // Play soft click sound for pathfinding tile placement
          this.soundService.playSoftClick();
        }
        return;
      }
    }
  }

  private findClosestValidPoint(
    x: number,
    y: number,
    pathIndex: number
  ): Point | null {
    // First check if the target point itself is valid
    if (this.isValidMove(x, y, pathIndex)) {
      return { x, y };
    }

    // Get the last point of the current path to sort by distance to it
    const currentPath = this.state.paths[pathIndex];
    const lastPathPoint = currentPath[currentPath.length - 1];

    // Search in expanding circles around the target point
    const maxSearchRadius = 2; // Limit search radius for performance

    for (let radius = 1; radius <= maxSearchRadius; radius++) {
      const candidates: Point[] = [];

      // Generate all points at this radius
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          // Only include points at exactly this radius (Manhattan distance)
          if (Math.abs(dx) + Math.abs(dy) === radius) {
            const candidateX = x + dx;
            const candidateY = y + dy;

            // Check bounds
            if (
              candidateX >= 0 &&
              candidateX < this.boardSize &&
              candidateY >= 0 &&
              candidateY < this.boardSize
            ) {
              candidates.push({ x: candidateX, y: candidateY });
            }
          }
        }
      }

      // Sort candidates by distance to the last path point (Euclidean distance for smoother feel)
      candidates.sort((a, b) => {
        const distA = Math.sqrt(
          (a.x - lastPathPoint.x) ** 2 + (a.y - lastPathPoint.y) ** 2
        );
        const distB = Math.sqrt(
          (b.x - lastPathPoint.x) ** 2 + (b.y - lastPathPoint.y) ** 2
        );
        return distA - distB;
      });

      // Check each candidate
      for (const candidate of candidates) {
        if (this.isValidMove(candidate.x, candidate.y, pathIndex)) {
          return candidate;
        }
      }
    }

    return null; // No valid point found within search radius
  }

  private isAtEndpoint(point: Point, startPoint: Point): boolean {
    const cell = this.state.board[point.y]?.[point.x];
    return !!(
      cell?.isEndpoint &&
      cell.pathIndex === this.state.currentPathIndex &&
      (point.x !== startPoint.x || point.y !== startPoint.y)
    );
  }

  private findPathToPoint(
    start: Point,
    target: Point,
    visited = new Set<string>()
  ): boolean {
    // const visited = new Set<string>();
    const queue = [{ point: start, path: [start] }];

    while (queue.length > 0) {
      const { point, path } = queue.shift()!;
      // Check if point is at endpoint

      if (
        path.length > 1 &&
        this.isAtEndpoint(point, start) &&
        target.x !== point.x &&
        target.y !== point.y
      ) {
        continue;
      }

      if (this.checkPathCollision(path)) continue; // Prevent infinite loops
      if (
        (point.x === target.x && point.y === target.y) ||
        this.isAtEndpoint(point, start)
      ) {
        // Found path
        if (this.state.currentPathIndex !== null) {
          this.state.paths[this.state.currentPathIndex] = path;

          // Play hard click sound for connection
          if (this.isAtEndpoint(point, start)) {
            this.soundService.playHardClick();
          }
        }
        return true;
      }

      visited.add(`${point.x},${point.y}`);

      // Get valid neighbors that are not in path, visited, or queue
      const neighbors = getValidNeighbors(
        this.state.board,
        point,
        visited,
        true
      ).filter(
        (n) =>
          !path.some((p) => p.x === n.x && p.y === n.y) &&
          !visited.has(`${n.x},${n.y}`) &&
          !queue.some((q) => q.point.x === n.x && q.point.y === n.y)
      );

      for (const neighbor of neighbors) {
        queue.push({ point: neighbor, path: [...path, neighbor] });
      }
    }
    return false;
  }

  private checkPathCollision(currentPath: Point[]): boolean {
    // Skip if no current path
    if (!currentPath.length) return false;

    // Check collision with other paths
    for (const [pathIndex, path] of this.state.paths.entries()) {
      // Skip checking against current color's path
      if (pathIndex === this.state.currentPathIndex) continue;

      // Check if any point in current path intersects with other paths
      const hasCollision = currentPath.some((currentPoint) =>
        path.some(
          (pathPoint) =>
            currentPoint.x === pathPoint.x && currentPoint.y === pathPoint.y
        )
      );

      if (hasCollision) return true;
    }

    // For currentPath make sure it does not intersect with any endpoint not of same color
    const currentPathIndex = this.state.currentPathIndex;
    const currentPathEnd = currentPath[currentPath.length - 1];
    const currentPathStart = currentPath[0];
    for (let y = 0; y < this.boardSize; y++) {
      for (let x = 0; x < this.boardSize; x++) {
        const cell = this.state.board[y][x];
        if (cell?.isEndpoint && cell.pathIndex !== currentPathIndex) {
          if (currentPath.some((p) => p.x === x && p.y === y)) {
            return true;
          }
          if (currentPathStart.x === x && currentPathStart.y === y) {
            return true;
          }
          if (currentPathEnd.x === x && currentPathEnd.y === y) {
            return true;
          }
        }
      }
    }

    return false;
  }

  public endDrag(): boolean {
    this.state.currentPathIndex = null;
    this.state.startPoint = null;
    const completed = this.checkCompletion();
    if (completed) {
      this.state.stats.endTime = Date.now();
    }
    return completed;
  }

  public refreshPaths(): void {
    for (let i = 0; i < this.state.paths.length; i++) {
      this.state.paths[i] = [];
    }
    this.state.board = removeNonEndpoints(this.state.board);
    this.updateBoardFromPaths();
    this.state.stats = {
      startTime: Date.now(),
      endTime: null,
      totalMoves: 0,
      pathsCompleted: 0,
      boardSize: this.boardSize,
    };
  }

  private checkCompletion(): boolean {
    // Check if all squares are filled
    let filledSquares = 0;
    for (let y = 0; y < this.boardSize; y++) {
      for (let x = 0; x < this.boardSize; x++) {
        if (this.state.board[y][x] !== null) {
          filledSquares++;
        }
      }
    }

    // Check if all paths have endpoints
    const endpointGroups = new Map<number, number>();
    for (let y = 0; y < this.boardSize; y++) {
      for (let x = 0; x < this.boardSize; x++) {
        const cell = this.state.board[y][x];
        if (cell?.isEndpoint) {
          const count = endpointGroups.get(cell.pathIndex) || 0;
          endpointGroups.set(cell.pathIndex, count + 1);
        }
      }
    }

    // Verify each path has exactly 2 endpoints
    for (const [pathIndex, endpointCount] of endpointGroups) {
      if (endpointCount !== 2) {
        return false;
      }
    }

    // Check if all paths are connected (no isolated tiles)
    for (let y = 0; y < this.boardSize; y++) {
      for (let x = 0; x < this.boardSize; x++) {
        const cell = this.state.board[y][x];
        if (cell && !cell.isEndpoint) {
          const neighbors = getValidNeighbors(
            this.state.board,
            { x, y },
            new Set(),
            true
          );
          let hasConnectedNeighbor = false;

          for (const neighbor of neighbors) {
            const neighborCell = this.state.board[neighbor.y][neighbor.x];
            if (neighborCell && neighborCell.pathIndex === cell.pathIndex) {
              hasConnectedNeighbor = true;
              break;
            }
          }

          if (!hasConnectedNeighbor) {
            return false;
          }
        }
      }
    }

    return filledSquares === this.boardSize * this.boardSize;
  }

  public getState(): GameState {
    return this.state;
  }

  public reset(newBoard: Board): void {
    this.boardSize = newBoard.length;
    this.state = this.initializeState(newBoard);
  }
}
