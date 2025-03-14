import { Board, Cell, GameState, getDistancedColorArray } from "@chromapath/shared";

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
				if (cell?.isEndpoint || (this.debug && cell?.pathIndex != null)) {
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
						const pixelRatio = window.devicePixelRatio || 1;
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
		}
	}

	private drawHover(state: GameState): void {
		const mouseX = state.mouseX;
		const mouseY = state.mouseY;
		const color = state.currentPathIndex ? this.colorsArray[state.currentPathIndex] : "rgb(255, 255, 255)";
		this.drawGradientCell(mouseX, mouseY, color, 0.03);
	}

	private drawGradientCell(x: number, y: number, color: string, aValue: number = 0.06): void {
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
