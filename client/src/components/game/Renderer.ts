import { Board, GameState } from "./Types";

export class ChromaPathRenderer {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private cellSize: number;
	public initialized: boolean = false;

	constructor(container: HTMLDivElement) {
		this.canvas = document.createElement("canvas");
		this.canvas.width = container.clientWidth;
		this.canvas.height = container.clientHeight;
		this.ctx = this.canvas.getContext("2d")!;
		this.cellSize = this.canvas.width / 5;

		container.appendChild(this.canvas);
		this.initialized = true;
	}

	public render(state: GameState, boardSize: number): void {
		if (!this.initialized) return;
		this.cellSize = this.canvas.width / boardSize;
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.drawGrid(boardSize);
		this.drawBoard(state.board);
		this.drawHover(state);
		this.drawPaths(state);
	}

	public resize(container: HTMLDivElement) {
		this.canvas.width = container.clientWidth;
		this.canvas.height = container.clientHeight;
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

	private drawPaths(state: GameState): void {
		const paths = state.paths;
		Object.entries(paths).forEach(([color, path]) => {
			if (path.length > 1) {
				this.ctx.beginPath();
				this.ctx.strokeStyle = color;
				this.ctx.lineWidth = this.cellSize / 4;
				this.ctx.lineCap = "round";
				this.ctx.lineJoin = "round"; // Add this line to make the paths rounded

				this.ctx.moveTo(path[0].x * this.cellSize + this.cellSize / 2, path[0].y * this.cellSize + this.cellSize / 2);

				for (let i = 1; i < path.length; i++) {
					this.ctx.lineTo(path[i].x * this.cellSize + this.cellSize / 2, path[i].y * this.cellSize + this.cellSize / 2);
				}
				this.ctx.stroke();
			}
		});
	}

	private drawHover(state: GameState): void {
		const mouseX = state.mouseX;
		const mouseY = state.mouseY;
		const mousePosX = mouseX * this.cellSize;
		const mousePosY = mouseY * this.cellSize;

		// Remove cell-based calculation to allow smooth movement
		const gradient = this.ctx.createRadialGradient(mousePosX, mousePosY, 0, mousePosX, mousePosY, this.cellSize * 2);

		// gradient.addColorStop(0, "rgba(255, 255, 255, 0.2)");
		// gradient.addColorStop(0.2, "rgba(255, 255, 255, 0.05)");
		// gradient.addColorStop(1, "rgba(255, 255, 255, 0.01)");

		// Draw larger gradient area for smoother effect
		this.ctx.fillStyle = gradient;
		this.ctx.fillRect(mousePosX - this.cellSize * 2, mousePosY - this.cellSize * 2, this.cellSize * 4, this.cellSize * 4);

		// Get current cell
		const cellX = Math.floor(mouseX);
		const cellY = Math.floor(mouseY);

		// Highlight current cell
		this.ctx.fillStyle = "rgba(255, 255, 255, 0.01)";
		this.ctx.fillRect(cellX * this.cellSize, cellY * this.cellSize, this.cellSize, this.cellSize);

		// Glowing border
		this.ctx.strokeStyle = "rgba(255, 255, 255, 0.01)";
		this.ctx.lineWidth = 2;
		this.ctx.strokeRect(cellX * this.cellSize, cellY * this.cellSize, this.cellSize, this.cellSize);
	}

	public destroy(): void {
		this.canvas.remove();
	}

	public getCanvas(): HTMLCanvasElement {
		return this.canvas;
	}
}
