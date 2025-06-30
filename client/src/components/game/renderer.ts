import {
  Board,
  Cell,
  GameState,
  getDistancedColorArray,
  Point,
} from "@chromapath/shared";

export class ChromaPathRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cellSize: number;
  public initialized: boolean = false;
  public showNumbers: boolean = false;
  private debug: boolean = true;
  private colorsArray: string[] = [];

  constructor(container: HTMLDivElement) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
    this.ctx = this.canvas.getContext("2d")!;
    this.cellSize = this.canvas.width / 5;
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = "high";

    container.appendChild(this.canvas);
    this.initialized = true;
    this.colorsArray = getDistancedColorArray();
  }

  public render(state: GameState, boardSize: number): void {
    if (!this.initialized) return;
    this.cellSize = this.canvas.width / boardSize;
    // Draw black background
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawGrid(boardSize);
    this.drawHover(state);
    this.drawPaths(state);
    this.drawBoard(state.board);
  }

  public resize(container: HTMLDivElement) {
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
  }

  private drawGrid(boardSize: number): void {
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.lineWidth = 1;

    for (let i = 0; i <= boardSize; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(i * this.cellSize, 0);
      this.ctx.lineTo(i * this.cellSize, this.canvas.height);
      this.ctx.moveTo(0, i * this.cellSize);
      this.ctx.lineTo(this.canvas.width, i * this.cellSize);
      this.ctx.stroke();
    }
  }
  private drawBoard(board: Board): void {
    // Draw board
    board.forEach((row: Cell[], y: number) => {
      row.forEach((cell: Cell, x: number) => {
        if (cell?.isEndpoint) {
          const curColor = this.colorsArray[cell.pathIndex];
          this.ctx.beginPath();
          this.ctx.fillStyle = curColor;
          this.ctx.arc(
            x * this.cellSize + this.cellSize / 2,
            y * this.cellSize + this.cellSize / 2,
            this.cellSize / 3,
            0,
            Math.PI * 2
          );
          this.ctx.fill();

          if (this.showNumbers) {
            // const pixelRatio = window.devicePixelRatio || 1;
            this.ctx.fillStyle = this.getHighContrastColor(curColor);

            // Use a larger base font size
            const fontSize = Math.max(this.cellSize / 3, 16); // Ensure minimum size
            this.ctx.font = `${fontSize}px Sour Gummy`;

            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
            this.ctx.fillText(
              (cell.pathIndex + 1).toString(),
              x * this.cellSize + this.cellSize / 2,
              y * this.cellSize + this.cellSize / 2
            );
          }
        }
      });
    });
  }

  private getHighContrastColor(color: string): string {
    const r = parseInt(color.slice(4, 7));
    const g = parseInt(color.slice(9, 12));
    const b = parseInt(color.slice(14, 17));
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 125 ? "#000000" : "#ffffff";
  }

  private drawPaths(state: GameState): void {
    const paths = state.paths;
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      const color = this.colorsArray[i];
      if (path.length > 1) {
        this.drawSinglePath(path, color, state, i);
      }
    }
  }

  private drawSinglePath(
    path: Point[],
    color: string,
    state: GameState,
    pathIndex: number
  ): void {
    this.ctx.beginPath();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = this.cellSize / 4;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";

    // Helper function to get cell center coordinates
    const getCellCenter = (x: number, y: number) => ({
      x: x * this.cellSize + this.cellSize / 2,
      y: y * this.cellSize + this.cellSize / 2,
    });

    // Helper function to check if a direction is available
    const canMoveTo = (x: number, y: number): boolean => {
      if (
        x < 0 ||
        x >= state.board[0].length ||
        y < 0 ||
        y >= state.board.length
      ) {
        return false;
      }
      const cell = state.board[y][x];
      return cell === null || cell?.pathIndex === pathIndex;
    };

    // Draw confirmed path segments
    this.drawGradientCell(path[0].x, path[0].y, color);
    const startCenter = getCellCenter(path[0].x, path[0].y);
    this.ctx.moveTo(startCenter.x, startCenter.y);

    for (let j = 1; j < path.length; j++) {
      this.drawGradientCell(path[j].x, path[j].y, color);

      // Skip drawing line to last point if it's the current path and the cell is not occupied by this path
      if (
        j === path.length - 1 &&
        state.currentPathIndex === pathIndex &&
        path.length > 1
      ) {
        continue;
      }
      const center = getCellCenter(path[j].x, path[j].y);
      this.ctx.lineTo(center.x, center.y);
    }

    // Check if the path has two endpoints to stop drawing
    let hasTwoEndpoints = false;
    const endpoints = path.filter(
      (point) => state.board[point.y][point.x]?.isEndpoint
    );
    if (endpoints.length === 2) {
      hasTwoEndpoints = true;
    }
    const lastPoint = path[path.length - 1];
    if (hasTwoEndpoints) {
      const center = getCellCenter(lastPoint.x, lastPoint.y);
      this.ctx.lineTo(center.x, center.y);
      this.ctx.stroke();
      return;
    }

    // Draw interpolated path to mouse if this is the current path
    if (state.currentPathIndex === pathIndex && path.length > 0) {
      const lastPoint = path[path.length - 1];

      // Don't interpolate if the last point is occupied by a different path
      const lastCell = state.board[lastPoint.y][lastPoint.x];
      if (lastCell !== null && lastCell.pathIndex !== pathIndex) {
        this.ctx.stroke();
        return;
      }

      const lastCenter = getCellCenter(lastPoint.x, lastPoint.y);
      const mouseX = state.preciseMouseX * this.cellSize;
      const mouseY = state.preciseMouseY * this.cellSize;
      const deltaX = mouseX - lastCenter.x;
      const deltaY = mouseY - lastCenter.y;

      // Check available directions
      const directions = {
        right: canMoveTo(lastPoint.x + 1, lastPoint.y),
        left: canMoveTo(lastPoint.x - 1, lastPoint.y),
        down: canMoveTo(lastPoint.x, lastPoint.y + 1),
        up: canMoveTo(lastPoint.x, lastPoint.y - 1),
      };

      // Calculate target position based on mouse direction and available moves
      let targetX = lastCenter.x;
      let targetY = lastCenter.y;

      const isPrimaryHorizontal = Math.abs(deltaX) > Math.abs(deltaY);

      let direction: "horizontal" | "vertical" = "horizontal";
      if (isPrimaryHorizontal) {
        // Try horizontal movement first
        if (deltaX > 0 && directions.right) {
          const rightCenter = getCellCenter(lastPoint.x + 1, lastPoint.y);
          targetX = Math.min(mouseX, rightCenter.x);
          targetY = lastCenter.y;
        } else if (deltaX < 0 && directions.left) {
          const leftCenter = getCellCenter(lastPoint.x - 1, lastPoint.y);
          targetX = Math.max(mouseX, leftCenter.x);
          targetY = lastCenter.y;
        } else {
          // Fall back to vertical
          if (deltaY > 0 && directions.down) {
            const downCenter = getCellCenter(lastPoint.x, lastPoint.y + 1);
            targetX = lastCenter.x;
            targetY = Math.min(mouseY, downCenter.y);
          } else if (deltaY < 0 && directions.up) {
            const upCenter = getCellCenter(lastPoint.x, lastPoint.y - 1);
            targetX = lastCenter.x;
            targetY = Math.max(mouseY, upCenter.y);
          }
          direction = "vertical";
        }
      } else {
        // Try vertical movement first
        if (deltaY > 0 && directions.down) {
          const downCenter = getCellCenter(lastPoint.x, lastPoint.y + 1);
          targetX = lastCenter.x;
          targetY = Math.min(mouseY, downCenter.y);
          direction = "vertical";
        } else if (deltaY < 0 && directions.up) {
          const upCenter = getCellCenter(lastPoint.x, lastPoint.y - 1);
          targetX = lastCenter.x;
          targetY = Math.max(mouseY, upCenter.y);
          direction = "vertical";
        } else {
          // Fall back to horizontal
          if (deltaX > 0 && directions.right) {
            const rightCenter = getCellCenter(lastPoint.x + 1, lastPoint.y);
            targetX = Math.min(mouseX, rightCenter.x);
            targetY = lastCenter.y;
          } else if (deltaX < 0 && directions.left) {
            const leftCenter = getCellCenter(lastPoint.x - 1, lastPoint.y);
            targetX = Math.max(mouseX, leftCenter.x);
            targetY = lastCenter.y;
          }
        }
      }

      // Handle corner navigation - draw to center point if changing direction
      if (path.length >= 2) {
        const prevPoint = path[path.length - 2];
        const cellDeltaX = state.mouseX - prevPoint.x;
        const cellDeltaY = state.mouseY - prevPoint.y;
        let shouldDrawToCenter =
          (cellDeltaX !== 0 && direction === "vertical") ||
          (cellDeltaY !== 0 && direction === "horizontal");

        // Handle when the mouse is not on the latest cell for smoother drawing
        if (cellDeltaX !== 0 && cellDeltaY !== 0) {
          const lastPoint = path[path.length - 1];
          const deltaXBetweenPoints = lastPoint.x - prevPoint.x;
          const deltaYBetweenPoints = lastPoint.y - prevPoint.y;
          shouldDrawToCenter =
            (deltaXBetweenPoints !== 0 && direction === "vertical") ||
            (deltaYBetweenPoints !== 0 && direction === "horizontal");
        }

        if (shouldDrawToCenter) {
          this.ctx.lineTo(lastCenter.x, lastCenter.y);
        }
      }

      this.ctx.lineTo(targetX, targetY);
    }

    this.ctx.stroke();
  }

  private drawHover(state: GameState): void {
    const mouseX = state.mouseX;
    const mouseY = state.mouseY;
    const color = state.currentPathIndex
      ? this.colorsArray[state.currentPathIndex]
      : "rgb(255, 255, 255)";

    if (state.currentPathIndex) {
      if (this.determineIfCurrentPathIsAtMouse(state)) {
        this.drawGradientCell(mouseX, mouseY, color, 0.03);
      } else {
        return;
      }
    }
    this.drawGradientCell(mouseX, mouseY, color, 0.03);
  }

  private determineIfCurrentPathIsAtMouse(state: GameState): boolean {
    if (state.currentPathIndex === null) return false;
    const lastPoint =
      state.paths[state.currentPathIndex][
        state.paths[state.currentPathIndex].length - 1
      ];
    return lastPoint.x === state.mouseX && lastPoint.y === state.mouseY;
  }

  private drawGradientCell(
    x: number,
    y: number,
    color: string,
    aValue: number = 0.06
  ): void {
    const cellX = x * this.cellSize;
    const cellY = y * this.cellSize;

    const gradient = this.ctx.createRadialGradient(
      cellX + this.cellSize / 2,
      cellY + this.cellSize / 2,
      0,
      cellX + this.cellSize / 2,
      cellY + this.cellSize / 2,
      this.cellSize / 2
    );
    gradient.addColorStop(0, `${color.slice(0, -1)}, ${aValue})`);
    gradient.addColorStop(0.2, `${color.slice(0, -1)}, ${aValue})`);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(cellX, cellY, this.cellSize, this.cellSize);
  }

  public destroy(): void {
    this.canvas.remove();
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}
