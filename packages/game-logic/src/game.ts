import {
  Board,
  GameState,
  GameStats,
  Point,
  SoundService,
  HapticService,
  getValidNeighbors,
  removeNonEndpoints,
} from "@chromapath/shared-types";

// Noop implementations for platforms without sound/haptics
const noopSoundService: SoundService = {
  soundEnabled: false,
  playSoftClick: () => {},
  playHardClick: () => {},
  playSuccessSound: () => {},
};

const noopHapticService: HapticService = {
  lightTap: () => {},
  mediumTap: () => {},
  heavyTap: () => {},
  success: () => {},
};

export interface GameServices {
  sound?: SoundService;
  haptics?: HapticService;
}

export class ChromaPathGame {
  private state: GameState;
  private boardWidth: number = 0;
  private boardHeight: number = 0;
  private soundService: SoundService;
  private hapticService: HapticService;

  private dragConnectionCooldown: boolean = false;
  private dragConnectionCooldownTime: number = 200;

  constructor(services?: GameServices) {
    this.soundService = services?.sound ?? noopSoundService;
    this.hapticService = services?.haptics ?? noopHapticService;
    this.state = this.initializeState();
  }

  public updateServices(services: GameServices): void {
    if (services.sound) this.soundService = services.sound;
    if (services.haptics) this.hapticService = services.haptics;
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
      boardWidth: newBoard.length > 0 ? newBoard[0].length : 0,
      boardHeight: newBoard.length,
    };

    this.soundService.playSuccessSound();
    this.hapticService.success();

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

    for (let i = 0; i < this.state.paths.length; i++) {
      const path = this.state.paths[i];
      if (i !== pathIndex && path.some((p) => p.x === x && p.y === y)) {
        return false;
      }
    }

    if (cell && cell.pathIndex !== pathIndex) {
      return false;
    }

    return true;
  }

  public handleCellClick(x: number, y: number): void {
    const cell = this.state.board[y][x];
    if (cell?.isEndpoint) {
      this.state.currentPathIndex = cell.pathIndex;
      this.state.startPoint = { x, y };
      this.state.paths[cell.pathIndex] = [{ x, y }];
      this.updateBoardFromPaths();
    }
    for (let i = 0; i < this.state.paths.length; i++) {
      const path = this.state.paths[i];

      const clickedIndex = path.findIndex((p) => p.x === x && p.y === y);

      if (clickedIndex !== -1) {
        this.state.currentPathIndex = i;
        this.state.startPoint = path[0];
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
    for (let y = 0; y < this.boardHeight; y++) {
      for (let x = 0; x < this.boardWidth; x++) {
        const cell = this.state.board[y][x];
        if (cell && !cell.isEndpoint) {
          this.state.board[y][x] = null;
        }
      }
    }

    for (let pathIndex = 0; pathIndex < this.state.paths.length; pathIndex++) {
      const path = this.state.paths[pathIndex];
      for (const point of path) {
        const existingCell = this.state.board[point.y][point.x];
        if (!existingCell?.isEndpoint) {
          this.state.board[point.y][point.x] = {
            pathIndex,
            isEndpoint: false,
          };
        }
      }
    }

    this.updatePathCompletionCount();
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

    return (
      this.isConnectedToEndpoint(startPoint, pathIndex) &&
      this.isConnectedToEndpoint(endPoint, pathIndex) &&
      (startPoint.x !== endPoint.x || startPoint.y !== endPoint.y)
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
    this.state.numConnectedPaths = this.state.paths.filter((path, idx) => {
      if (path.length === 0) return false;

      const startPoint = path[0];
      const endPoint = path[path.length - 1];

      if (startPoint.x === endPoint.x && startPoint.y === endPoint.y) {
        return false;
      }

      return (
        this.isConnectedToEndpoint(startPoint, idx) &&
        this.isConnectedToEndpoint(endPoint, idx)
      );
    }).length;
  }

  public handleDrag(x: number, y: number): boolean {
    if (this.dragConnectionCooldown) return false;

    if (this.state.currentPathIndex === null || !this.state.startPoint)
      return false;

    const currentPath = this.state.paths[this.state.currentPathIndex];
    const lastPoint = currentPath[currentPath.length - 1];

    const clampedX = Math.max(0, Math.min(x, this.boardWidth - 1));
    const clampedY = Math.max(0, Math.min(y, this.boardHeight - 1));

    if (!this.isValidMove(clampedX, clampedY, this.state.currentPathIndex)) {
      const closestPoint = this.findClosestValidPoint(
        clampedX,
        clampedY,
        this.state.currentPathIndex
      );

      if (!closestPoint) return false;

      x = closestPoint.x;
      y = closestPoint.y;
    } else {
      x = clampedX;
      y = clampedY;
    }

    const backtrackIndex = currentPath.findIndex((p) => p.x === x && p.y === y);
    if (backtrackIndex !== -1) {
      const newPath = currentPath.slice(0, backtrackIndex + 1);
      if (newPath.length !== currentPath.length) {
        this.state.paths[this.state.currentPathIndex] = newPath;
        this.updateBoardFromPaths();
        this.soundService.playSoftClick();
        this.hapticService.lightTap();
        this.incrementMoves();
      }
      return false;
    }

    const handleConnection = () => {
      this.soundService.playSoftClick();
      this.soundService.playHardClick();
      this.hapticService.mediumTap();
      this.dragConnectionCooldown = true;
      setTimeout(() => {
        this.dragConnectionCooldown = false;
      }, this.dragConnectionCooldownTime);
      if (this.checkCompletion()) {
        this.state.stats.endTime = Date.now();
        this.soundService.playSuccessSound();
        this.hapticService.success();
      }
      return this.checkCompletion();
    };

    const isAtEndpoint = this.isAtEndpointReusable(
      lastPoint,
      this.state.startPoint,
      this.state.currentPathIndex
    );

    const adjacentBeyond = isAtEndpoint && currentPath.length > 1;

    if (isAtEndpoint && currentPath.length > 1) return false;

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

      if (this.isConnectedToEndpoint({ x, y }, this.state.currentPathIndex)) {
        return handleConnection();
      } else {
        this.soundService.playSoftClick();
        this.hapticService.lightTap();
      }
      return false;
    }

    if (this.state.paths[this.state.currentPathIndex].length > 1) {
      const startPoint = this.state.paths[this.state.currentPathIndex][0];
      const endPoint =
        this.state.paths[this.state.currentPathIndex][
          this.state.paths[this.state.currentPathIndex].length - 1
        ];
      if (
        this.isAtEndpointReusable(
          startPoint,
          this.state.startPoint,
          this.state.currentPathIndex
        ) &&
        this.isAtEndpointReusable(
          endPoint,
          this.state.startPoint,
          this.state.currentPathIndex
        )
      ) {
        return false;
      }
    }

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

        if (this.isConnectedToEndpoint({ x, y }, this.state.currentPathIndex)) {
          return handleConnection();
        } else {
          this.soundService.playSoftClick();
          this.hapticService.lightTap();
        }
        return false;
      }
    }
    return false;
  }

  private findClosestValidPoint(
    x: number,
    y: number,
    pathIndex: number
  ): Point | null {
    if (this.isValidMove(x, y, pathIndex)) {
      return { x, y };
    }

    const currentPath = this.state.paths[pathIndex];
    const lastPathPoint = currentPath[currentPath.length - 1];

    const maxSearchRadius = 2;

    for (let radius = 1; radius <= maxSearchRadius; radius++) {
      const candidates: Point[] = [];

      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          if (Math.abs(dx) + Math.abs(dy) === radius) {
            const candidateX = x + dx;
            const candidateY = y + dy;

            if (
              candidateX >= 0 &&
              candidateX < this.boardWidth &&
              candidateY >= 0 &&
              candidateY < this.boardHeight
            ) {
              candidates.push({ x: candidateX, y: candidateY });
            }
          }
        }
      }

      candidates.sort((a, b) => {
        const distA = Math.sqrt(
          (a.x - lastPathPoint.x) ** 2 + (a.y - lastPathPoint.y) ** 2
        );
        const distB = Math.sqrt(
          (b.x - lastPathPoint.x) ** 2 + (b.y - lastPathPoint.y) ** 2
        );
        return distA - distB;
      });

      for (const candidate of candidates) {
        if (this.isValidMove(candidate.x, candidate.y, pathIndex)) {
          return candidate;
        }
      }
    }

    return null;
  }

  private isConnectedToEndpoint(
    point: Point,
    pathIndex: number,
    excludePoint?: Point
  ): boolean {
    const cell = this.state.board[point.y]?.[point.x];
    if (!cell?.isEndpoint) return false;
    if (cell.pathIndex !== pathIndex) return false;
    if (
      excludePoint &&
      point.x === excludePoint.x &&
      point.y === excludePoint.y
    )
      return false;
    return true;
  }

  private isAtEndpointReusable(
    point: Point,
    startPoint: Point,
    pathIndex: number
  ): boolean {
    return this.isConnectedToEndpoint(point, pathIndex, startPoint);
  }

  private findPathToPoint(
    start: Point,
    target: Point,
    visited = new Set<string>()
  ): boolean {
    const queue = [{ point: start, path: [start] }];

    while (queue.length > 0) {
      const { point, path } = queue.shift()!;

      if (
        path.length > 1 &&
        this.isAtEndpointReusable(point, start, this.state.currentPathIndex!) &&
        target.x !== point.x &&
        target.y !== point.y
      ) {
        continue;
      }

      if (this.checkPathCollision(path)) continue;
      if (
        (point.x === target.x && point.y === target.y) ||
        this.isAtEndpointReusable(point, start, this.state.currentPathIndex!)
      ) {
        if (this.state.currentPathIndex !== null) {
          this.state.paths[this.state.currentPathIndex] = path;

          if (
            this.isAtEndpointReusable(point, start, this.state.currentPathIndex)
          ) {
            this.soundService.playHardClick();
            this.hapticService.mediumTap();
          }
        }
        return true;
      }

      visited.add(`${point.x},${point.y}`);

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
    if (!currentPath.length) return false;

    for (const [pathIndex, path] of this.state.paths.entries()) {
      if (pathIndex === this.state.currentPathIndex) continue;

      const hasCollision = currentPath.some((currentPoint) =>
        path.some(
          (pathPoint) =>
            currentPoint.x === pathPoint.x && currentPoint.y === pathPoint.y
        )
      );

      if (hasCollision) return true;
    }

    const currentPathIndex = this.state.currentPathIndex;
    const currentPathEnd = currentPath[currentPath.length - 1];
    const currentPathStart = currentPath[0];
    for (let y = 0; y < this.boardHeight; y++) {
      for (let x = 0; x < this.boardWidth; x++) {
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

  public endDrag(): void {
    this.state.currentPathIndex = null;
    this.state.startPoint = null;
    this.dragConnectionCooldown = false;
  }

  public refreshPaths(hardReset: boolean = false): void {
    for (let i = 0; i < this.state.paths.length; i++) {
      this.state.paths[i] = [];
    }
    this.state.board = removeNonEndpoints(this.state.board);
    this.updateBoardFromPaths();
    if (hardReset) {
      this.state.stats.startTime = Date.now();
      this.state.stats.endTime = null;
    }
  }

  private checkCompletion(): boolean {
    for (let y = 0; y < this.boardHeight; y++) {
      for (let x = 0; x < this.boardWidth; x++) {
        if (this.state.board[y][x] === null) {
          return false;
        }
      }
    }

    for (let i = 0; i < this.state.paths.length; i++) {
      const path = this.state.paths[i];
      if (
        path.length < 2 ||
        !this.isConnectedToEndpoint(path[0], i) ||
        !this.isConnectedToEndpoint(path[path.length - 1], i)
      ) {
        return false;
      }
    }
    return true;
  }

  public getState(): GameState {
    return this.state;
  }

  public reset(newBoard: Board): void {
    this.boardWidth = newBoard.length > 0 ? newBoard[0].length : 0;
    this.boardHeight = newBoard.length;
    this.state = this.initializeState(newBoard);
    this.dragConnectionCooldown = false;
  }
}
