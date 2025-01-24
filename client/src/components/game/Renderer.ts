import { Board, GameState, Paths } from "./types";

export class FlowFreeRenderer {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private cellSize: number;
	public initialized: boolean = false;

	constructor(container: HTMLDivElement, width: number, height: number) {
		this.canvas = document.createElement("canvas");
		this.canvas.width = width;
		this.canvas.height = height;
		this.ctx = this.canvas.getContext("2d")!;
		this.cellSize = width / 5;

		container.appendChild(this.canvas);
		this.initialized = true;
	}

	public render(state: GameState, boardSize: number): void {
		if (!this.initialized) return;
		this.cellSize = this.canvas.width / boardSize;
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.drawGrid(boardSize);
		this.drawBoard(state.board);
		this.drawPaths(state.paths);
	}

	private drawGrid(boardSize: number): void {
		this.ctx.strokeStyle = "#cccccc";
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
		board.forEach((row, y) => {
			row.forEach((cell, x) => {
				if (cell?.isEndpoint) {
					this.ctx.beginPath();
					this.ctx.fillStyle = cell.color;
					this.ctx.arc(
						x * this.cellSize + this.cellSize / 2,
						y * this.cellSize + this.cellSize / 2,
						this.cellSize / 3,
						0,
						Math.PI * 2
					);
					this.ctx.fill();
				}
			});
		});
	}

	private drawPaths(paths: Paths): void {
		Object.entries(paths).forEach(([color, path]) => {
			if (path.length > 1) {
				this.ctx.beginPath();
				this.ctx.strokeStyle = color;
				this.ctx.lineWidth = this.cellSize / 4;
				this.ctx.lineCap = "round";

				this.ctx.moveTo(path[0].x * this.cellSize + this.cellSize / 2, path[0].y * this.cellSize + this.cellSize / 2);

				for (let i = 1; i < path.length; i++) {
					this.ctx.lineTo(path[i].x * this.cellSize + this.cellSize / 2, path[i].y * this.cellSize + this.cellSize / 2);
				}
				this.ctx.stroke();
			}
		});
	}

	public destroy(): void {
		this.canvas.remove();
	}

	public getCanvas(): HTMLCanvasElement {
		return this.canvas;
	}
}
