import { Board, GameState } from "./Types";

export class ChromaPathRenderer {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private cellSize: number;
	public initialized: boolean = false;
	public showNumbers: boolean = true;

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
		this.drawHover(state);
		this.drawPaths(state);
		this.drawBoard(state.board);
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
		const colorToIndex = new Map<string, number>();
		let currentIndex = 1;

		// First pass - assign indices to colors
		// TODO: Could do if show numbers here
		board.forEach((row) => {
			row.forEach((cell) => {
				if (cell?.isEndpoint && !colorToIndex.has(cell.color)) {
					colorToIndex.set(cell.color, currentIndex++);
				}
			});
		});

		// Draw board
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

					if (this.showNumbers) {
						this.ctx.fillStyle = this.getHighContrastColor(cell.color);
						this.ctx.font = `${this.cellSize / 3}px Sour Gummy`;
						this.ctx.textAlign = "center";
						this.ctx.textBaseline = "middle";
						this.ctx.fillText(
							colorToIndex.get(cell.color)!.toString(),
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
		Object.entries(paths).forEach(([color, path]) => {
			if (path.length > 1) {
				this.ctx.beginPath();
				this.ctx.strokeStyle = color;
				this.ctx.lineWidth = this.cellSize / 4;
				this.ctx.lineCap = "round";
				this.ctx.lineJoin = "round"; // Add this line to make the paths rounded
				this.drawGradientCell(path[0].x, path[0].y, color);

				this.ctx.moveTo(path[0].x * this.cellSize + this.cellSize / 2, path[0].y * this.cellSize + this.cellSize / 2);
				for (let i = 1; i < path.length; i++) {
					this.drawGradientCell(path[i].x, path[i].y, color);

					this.ctx.lineTo(path[i].x * this.cellSize + this.cellSize / 2, path[i].y * this.cellSize + this.cellSize / 2);
				}
				this.ctx.stroke();
			}
		});
	}

	private drawHover(state: GameState): void {
		const mouseX = state.mouseX;
		const mouseY = state.mouseY;
		const color = state.currentColor || "rgb(255, 255, 255)";
		this.drawGradientCell(mouseX, mouseY, color, 0.02);
	}

	private drawGradientCell(x: number, y: number, color: string, aValue: number = 0.05): void {
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
		// gradient.addColorStop(0.2, `${color.slice(0, -1)}, ${aValue})`);
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
