import { canAddPointToPath, getDirection, getEmptyCells, getEmptyRegions, getValidNeighbors, removeNonEndpoints, shuffleArray } from "../boardUtils";
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

    generateBoard(width: number, height: number): Board {
        this.boardWidth = width;
        this.boardHeight = height;
        this.maxNumPaths = Math.max(width, height) * 1;
        const start = performance.now();

        for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
            if (this.generateValidBoard()) {
                console.log("time for generation", (performance.now() - start) / 1000, "for board size", `${this.boardWidth}x${this.boardHeight}`);
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

    private generateValidBoard(): boolean {
        this.curColorIndex = 0;
        this.pathStack = [];
        this.board = this.initializeEmptyBoard();
        let stepsWithoutProgress = 0;
        const maxStepsWithoutProgress = this.maxNumPaths * 3;

        while (true) {
            if (this.curColorIndex >= this.maxNumPaths) {
                return false;
            }

            const emptyBefore = getEmptyCells(this.board).length;

            if (this.placeColorEndpoints() && this.curColorIndex < this.maxNumPaths) {
                this.curColorIndex++;
                stepsWithoutProgress = 0; // Reset on success

                const emptyAfter = getEmptyCells(this.board).length;
                if (emptyAfter === 0) {
                    return !pathsHaveBetterSolution(this.board, this.curColorIndex);
                }

                // Early termination: if too many empty cells for remaining paths
                const remainingPaths = this.maxNumPaths - this.curColorIndex;
                const avgNeeded = emptyAfter / Math.max(1, remainingPaths);
                if (avgNeeded > this.boardWidth * this.boardHeight * 0.8) {
                    // Each path would need to be unreasonably long - bail early
                    return false;
                }
            } else {
                stepsWithoutProgress++;
                if (stepsWithoutProgress > maxStepsWithoutProgress) {
                    return false; // Prevent hanging
                }
                return false; // Current path failed, try new board
            }
        }
    }

    private placeColorEndpoints(): boolean {
        // First priority: cells that MUST be path endpoints (only 1 neighbor)
        const blockedPaths = this.findBlockedPaths();
        if (blockedPaths.length > 0) {
            for (const blockedPath of blockedPaths) {
                for (let i = 0; i < 5; i++) {
                    if (this.attemptPathPlacement(blockedPath)) {
                        return true;
                    }
                }
            }
            return false;
        }

        // Second priority: corners and edges (naturally lead to longer paths)
        const emptyCells = getEmptyCells(this.board);
        const corners: Point[] = [];
        const edges: Point[] = [];
        const interior: Point[] = [];

        for (const cell of emptyCells) {
            const isTop = cell.y === 0;
            const isBottom = cell.y === this.boardHeight - 1;
            const isLeft = cell.x === 0;
            const isRight = cell.x === this.boardWidth - 1;

            if ((isTop || isBottom) && (isLeft || isRight)) {
                corners.push(cell);
            } else if (isTop || isBottom || isLeft || isRight) {
                edges.push(cell);
            } else {
                interior.push(cell);
            }
        }

        // Try corners first, then edges, then interior
        const prioritizedCells = [...shuffleArray(corners), ...shuffleArray(edges), ...shuffleArray(interior)];

        for (let j = 0; j < 2; j++) {
            for (const cell of prioritizedCells) {
                if (!this.board[cell.y][cell.x] && this.attemptPathPlacement(cell)) {
                    return true;
                }
            }
        }
        return false;
    }

    private attemptPathPlacement(start: Point): boolean {
        this.board[start.y][start.x] = {
            pathIndex: this.curColorIndex,
            isEndpoint: true,
        };

        // Calculate target path length based on remaining cells and paths
        const emptyCells = getEmptyCells(this.board).length + 1; // +1 for start we just placed
        const remainingPaths = this.maxNumPaths - this.curColorIndex;
        // Weight toward longer paths early - progressFactor ranges from ~1.5 (early) to ~1.0 (late)
        const progressFactor = 1 + 0.5 * (1 - this.curColorIndex / this.maxNumPaths);
        const targetLength = Math.max(this.minPathLength, Math.floor((emptyCells / Math.max(1, remainingPaths)) * progressFactor));

        // Try multiple path variations from this start point (backtracking)
        const maxPathAttempts = 5;
        for (let attempt = 0; attempt < maxPathAttempts; attempt++) {
            const path = this.findRandomValidPathFromStart(start, targetLength);

            if (!path) {
                continue; // Try again with different random choices
            }

            const end = path[path.length - 1];
            this.board[end.y][end.x] = {
                pathIndex: this.curColorIndex,
                isEndpoint: true,
            };

            // Use index-based iteration to avoid array allocation from slice()
            for (let i = 1; i < path.length - 1; i++) {
                const point = path[i];
                this.board[point.y][point.x] = {
                    pathIndex: this.curColorIndex,
                    isEndpoint: false,
                };
            }

            if (this.hasPotentialForValidSolution()) {
                this.pathStack.push(path);
                return true;
            }

            // Clear this path and try again
            this.board[end.y][end.x] = null;
            for (let i = 1; i < path.length - 1; i++) {
                this.board[path[i].y][path[i].x] = null;
            }
        }

        // All attempts failed, clear start point
        this.board[start.y][start.x] = null;
        return false;
    }

    private findBlockedPaths(): Point[] {
        const blockedPaths: Point[] = [];

        for (let y = 0; y < this.boardHeight; y++) {
            for (let x = 0; x < this.boardWidth; x++) {
                const cell = this.board[y][x];
                if (!cell) {
                    const neighbors = getValidNeighbors(this.board, { x, y }, new Set(), false);
                    if (neighbors.length === 1) {
                        blockedPaths.push({ x, y });
                    }
                }
            }
        }

        return blockedPaths;
    }

    private findRandomValidPathFromStart(start: Point, targetLength: number): Point[] | null {
        const visited = new Set<number>();
        const pathSet = new Set<number>();
        const path: Point[] = [start];
        let point = start;
        const width = this.boardWidth;

        // Add start to both sets
        const startKey = start.y * width + start.x;
        visited.add(startKey);
        pathSet.add(startKey);

        const straightBias = 100 + width * this.boardHeight;

        while (path.length < this.maxPathLength) {
            // Get neighbors using numeric visited set
            const neighbors = this.getValidNeighborsNumeric(point, visited);
            const validNeighbors: Array<{ p: Point; score: number }> = [];

            for (const neighbor of neighbors) {
                // O(1) incremental validation
                if (!canAddPointToPath(pathSet, neighbor.x, neighbor.y, point.x, point.y, width)) {
                    continue;
                }

                // Calculate heuristic score - higher = better choice
                let score = 0;
                const nKey = neighbor.y * width + neighbor.x;

                // 1. Count how many empty neighbors this cell has (openness)
                const openness = this.countEmptyNeighbors(neighbor.x, neighbor.y, visited, nKey);

                // 2. Check if moving here would isolate any adjacent cells
                const wouldIsolate = this.wouldCreateIsolation(neighbor.x, neighbor.y, visited, nKey);
                if (wouldIsolate) {
                    score -= 10000; // Heavy penalty - avoid isolating cells
                }

                // 3. Prefer cells with fewer exits (visit dead-ends before they're blocked)
                // #4 improvement: More aggressive priority for constrained cells
                if (openness === 1) {
                    score += 8000; // Very high priority for dead-end cells - must visit now or lose them
                } else if (openness === 2) {
                    score += 3000; // High priority for near-dead-ends
                } else if (openness === 3) {
                    score += 500; // Slight priority for semi-constrained cells
                }
                // Note: cells with 4 exits get no bonus - plenty of time to visit them

                // 4. Check if any neighbors of this cell are becoming constrained
                // This helps us visit regions before they become unreachable
                const constrainedNeighborBonus = this.countConstrainedNeighbors(neighbor.x, neighbor.y, visited, nKey);
                score += constrainedNeighborBonus * 1000;

                // 5. Add direction bias (prefer straight lines for aesthetics)
                // #6 improvement: Reduce straight bias when near-trapped to allow escape turns
                const prevPoint = path.length >= 2 ? path[path.length - 2] : null;
                const direction = getDirection(prevPoint, point, neighbor);
                if (direction === "straight") {
                    // When openness is low, reduce straight bias to allow necessary turns
                    const adjustedBias = openness <= 2 ? straightBias * 0.3 : straightBias;
                    score += adjustedBias * Math.random();
                } else {
                    // When constrained, turns are more valuable
                    const turnBonus = openness <= 2 ? 200 : 100;
                    score += turnBonus * Math.random();
                }

                // 6. Small random factor
                score += Math.random() * 50;

                validNeighbors.push({ p: neighbor, score });
            }

            // No valid moves - return path if long enough
            if (validNeighbors.length === 0) {
                return path.length >= this.minPathLength ? path : null;
            }

            // Reached target - can stop (but allow some randomness to continue)
            if (path.length >= targetLength && Math.random() < 0.3) {
                return path;
            }

            // Sort by score (highest first)
            validNeighbors.sort((a, b) => b.score - a.score);

            const neighbor = validNeighbors[0].p;
            const neighborKey = neighbor.y * width + neighbor.x;
            path.push(neighbor);
            pathSet.add(neighborKey);
            visited.add(neighborKey);
            point = neighbor;
        }

        // Reached max path length
        return path.length >= this.minPathLength ? path : null;
    }

    // Count empty neighbors of a cell (excluding the cell itself if in visited)
    private countEmptyNeighbors(x: number, y: number, visited: Set<number>, selfKey: number): number {
        const dx = [0, 1, 0, -1];
        const dy = [-1, 0, 1, 0];
        let count = 0;

        for (let i = 0; i < 4; i++) {
            const nx = x + dx[i];
            const ny = y + dy[i];
            if (nx < 0 || nx >= this.boardWidth || ny < 0 || ny >= this.boardHeight) continue;
            if (this.board[ny][nx]) continue; // occupied
            const nKey = ny * this.boardWidth + nx;
            if (visited.has(nKey) || nKey === selfKey) continue;
            count++;
        }
        return count;
    }

    // Count how many neighbors of (x,y) have only 1-2 exits (constrained)
    // This helps detect regions that are becoming hard to reach
    private countConstrainedNeighbors(x: number, y: number, visited: Set<number>, selfKey: number): number {
        const dx = [0, 1, 0, -1];
        const dy = [-1, 0, 1, 0];
        let constrainedCount = 0;

        for (let i = 0; i < 4; i++) {
            const nx = x + dx[i];
            const ny = y + dy[i];
            if (nx < 0 || nx >= this.boardWidth || ny < 0 || ny >= this.boardHeight) continue;
            if (this.board[ny][nx]) continue; // occupied
            const nKey = ny * this.boardWidth + nx;
            if (visited.has(nKey) || nKey === selfKey) continue;

            // Count this neighbor's exits (after we would move to selfKey)
            let neighborExits = 0;
            for (let j = 0; j < 4; j++) {
                const nnx = nx + dx[j];
                const nny = ny + dy[j];
                if (nnx < 0 || nnx >= this.boardWidth || nny < 0 || nny >= this.boardHeight) continue;
                if (this.board[nny][nnx]) continue;
                const nnKey = nny * this.boardWidth + nnx;
                if (visited.has(nnKey) || nnKey === selfKey) continue;
                neighborExits++;
            }

            // If this neighbor would have only 1-2 exits, it's becoming constrained
            if (neighborExits <= 2) {
                constrainedCount++;
            }
        }
        return constrainedCount;
    }

    // Check if moving to (x,y) would isolate any adjacent empty cell
    private wouldCreateIsolation(x: number, y: number, visited: Set<number>, selfKey: number): boolean {
        const dx = [0, 1, 0, -1];
        const dy = [-1, 0, 1, 0];

        // Check each neighbor of the target cell
        for (let i = 0; i < 4; i++) {
            const nx = x + dx[i];
            const ny = y + dy[i];
            if (nx < 0 || nx >= this.boardWidth || ny < 0 || ny >= this.boardHeight) continue;
            if (this.board[ny][nx]) continue; // occupied cell, skip
            const nKey = ny * this.boardWidth + nx;
            if (visited.has(nKey) || nKey === selfKey) continue; // already visited or self

            // Count how many exits this neighbor would have after we move
            let exits = 0;
            for (let j = 0; j < 4; j++) {
                const nnx = nx + dx[j];
                const nny = ny + dy[j];
                if (nnx < 0 || nnx >= this.boardWidth || nny < 0 || nny >= this.boardHeight) continue;
                if (this.board[nny][nnx]) continue;
                const nnKey = nny * this.boardWidth + nnx;
                if (visited.has(nnKey) || nnKey === selfKey) continue;
                exits++;
            }

            if (exits === 0) {
                return true; // This move would isolate the neighbor
            }
        }
        return false;
    }

    // Numeric version of getValidNeighbors to avoid string key allocation
    private getValidNeighborsNumeric(point: Point, visited: Set<number>): Point[] {
        const result: Point[] = [];
        const dx = [0, 1, 0, -1];
        const dy = [-1, 0, 1, 0];

        for (let i = 0; i < 4; i++) {
            const x = point.x + dx[i];
            const y = point.y + dy[i];

            if (x >= 0 && x < this.boardWidth && y >= 0 && y < this.boardHeight && !this.board[y][x] && !visited.has(y * this.boardWidth + x)) {
                result.push({ x, y });
            }
        }

        return result;
    }

    private hasPotentialForValidSolution(): boolean {
        const regions = getEmptyRegions(this.board);

        const totalEmptyCells = regions.reduce((acc, region) => acc + region.length, 0);
        const remainingPaths = this.maxNumPaths - this.curColorIndex;
        // Allow windy paths - each path can cover up to half the board
        const maxPathLength = Math.floor((this.boardWidth * this.boardHeight) / 2);
        if (totalEmptyCells > remainingPaths * maxPathLength) {
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
