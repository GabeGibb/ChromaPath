import { Path } from "./mitm";

// Helper function to determine sign of a number
function sign(x: number): number {
	if (x === 0) return x;
	return x < 0 ? -1 : 1;
}

// UnionFind data structure implementation
class UnionFind {
	private uf: Record<string, string>;

	constructor(initial?: Record<string, string>) {
		this.uf = initial || {};
	}

	union(a: string, b: string): void {
		const aParent = this.find(a);
		const bParent = this.find(b);
		this.uf[aParent] = bParent;
	}

	find(a: string): string {
		if (this.uf[a] === undefined || this.uf[a] === a) {
			return a;
		}
		// Path compression
		const parent = this.find(this.uf[a]);
		this.uf[a] = parent;
		return parent;
	}
}

// Grid class implementation
class Grid {
	public grid: Map<string, string>;
	readonly w: number;
	readonly h: number;

	constructor(w: number, h: number) {
		this.w = w;
		this.h = h;
		this.grid = new Map();
	}

	print(): string {
		const res: string[] = [];
		for (let y = 0; y < this.h; y++) {
			let row = "";
			for (let x = 0; x < this.w; x++) {
				row += this.getItem([x, y]);
			}
			res.push(row);
		}
		return res.join("\n");
	}

	setItem(key: [number, number], val: string): void {
		this.grid.set(`${key[0]},${key[1]}`, val);
	}

	getItem(key: [number, number]): string {
		return this.grid.get(`${key[0]},${key[1]}`) || " ";
	}

	shrink(): Grid {
		const smallGrid = new Grid(Math.floor(this.w / 2), Math.floor(this.h / 2));
		for (let y = 0; y < Math.floor(this.h / 2); y++) {
			for (let x = 0; x < Math.floor(this.w / 2); x++) {
				smallGrid.setItem([x, y], this.getItem([2 * x + 1, 2 * y + 1]));
			}
		}
		return smallGrid;
	}

	testPath(path: Path, x0: number, y0: number, dx0: number = 0, dy0: number = 1): boolean {
		const positions = Array.from(path.xys(dx0, dy0));
		return positions.every(([x, y]) => {
			const gridX = x0 - x + y;
			const gridY = y0 + x + y;
			return gridX >= 0 && gridX < this.w && gridY >= 0 && gridY < this.h && !this.grid.has(`${gridX},${gridY}`);
		});
	}

	drawPath(path: Path, x0: number, y0: number, dx0: number = 0, dy0: number = 1, loop: boolean = false): void {
		const positions = Array.from(path.xys(dx0, dy0));
		if (loop) {
			if (
				positions[0][0] !== positions[positions.length - 1][0] ||
				positions[0][1] !== positions[positions.length - 1][1]
			) {
				throw new Error("Path must be a loop");
			}
			positions.push(positions[1]);
		}

		for (let i = 1; i < positions.length - 1; i++) {
			const [xp, yp] = positions[i - 1];
			const [x, y] = positions[i];
			const [xn, yn] = positions[i + 1];

			const characterMap: Record<string, string> = {
				"1,1,1": "<",
				"-1,-1,-1": "<",
				"1,1,-1": ">",
				"-1,-1,1": ">",
				"-1,1,1": "v",
				"1,-1,-1": "v",
				"-1,1,-1": "^",
				"1,-1,1": "^",
				"0,2,0": "\\",
				"0,-2,0": "\\",
				"2,0,0": "/",
				"-2,0,0": "/",
			};

			const key = [xn - xp, yn - yp, sign((x - xp) * (yn - y) - (xn - x) * (y - yp))].join(",");

			this.setItem([x0 - x + y, y0 + x + y], characterMap[key]);
		}
	}

	makeTubes(): [Grid, UnionFind] {
		const uf = new UnionFind();
		const tubeGrid = new Grid(this.w, this.h);

		for (let x = 0; x < this.w; x++) {
			let d = "-";
			for (let y = 0; y < this.h; y++) {
				const currentChar = this.getItem([x, y]);
				const unionDirections: Record<string, [number, number][]> = {
					"/-": [[0, 1]],
					"\\-": [
						[1, 0],
						[0, 1],
					],
					"/|": [[1, 0]],
					" -": [[1, 0]],
					" |": [[0, 1]],
					"v|": [[0, 1]],
					">|": [[1, 0]],
					"v-": [[0, 1]],
					">-": [[1, 0]],
				};

				const directions = unionDirections[currentChar + d] || [];
				for (const [dx, dy] of directions) {
					uf.union(`${x},${y}`, `${x + dx},${y + dy}`);
				}

				const tubeChar: Record<string, string> = {
					"/-": "┐",
					"\\-": "┌",
					"/|": "└",
					"\\|": "┘",
					" -": "-",
					" |": "|",
				};

				tubeGrid.setItem([x, y], tubeChar[currentChar + d] || "x");

				if ("\\/v^".includes(currentChar)) {
					d = d === "-" ? "|" : "-";
				}
			}
		}

		return [tubeGrid, uf];
	}

	clearPath(path: Path, x: number, y: number): void {
		const pathGrid = new Grid(this.w, this.h);
		pathGrid.drawPath(path, x, y, 0, 1, true);
		const [tubeGrid] = pathGrid.makeTubes();

		for (const [key, value] of tubeGrid.grid.entries()) {
			if (value === "|") {
				this.grid.delete(key);
			}
		}
	}
}

export { Grid, sign, UnionFind };
