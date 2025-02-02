// Helper function to determine sign of a number
function sign(x: number): number {
	if (x === 0) return x;
	return x < 0 ? -1 : 1;
}

type GridPosition = [number, number];
type GridValue = string;
type GridMap = Map<string, GridValue>;

class UnionFind {
	private uf: Map<string, string>;

	constructor(initial?: Map<string, string>) {
		this.uf = initial || new Map();
	}

	union(a: GridPosition, b: GridPosition): void {
		const aParent = this.find(a);
		const bParent = this.find(b);
		this.uf.set(this.posToKey(aParent), this.posToKey(bParent));
	}

	find(a: GridPosition): GridPosition {
		const key = this.posToKey(a);
		if (!this.uf.has(key) || this.uf.get(key) === key) {
			return a;
		}
		// Path compression
		const parent = this.keyToPos(this.uf.get(key)!);
		const ultimate = this.find(parent);
		this.uf.set(key, this.posToKey(ultimate));
		return ultimate;
	}

	private posToKey(pos: GridPosition): string {
		return `${pos[0]},${pos[1]}`;
	}

	private keyToPos(key: string): GridPosition {
		const [x, y] = key.split(",").map(Number);
		return [x, y];
	}
}

class Grid {
	public readonly w: number;
	public readonly h: number;
	private grid: GridMap;

	constructor(w: number, h: number) {
		this.w = w;
		this.h = h;
		this.grid = new Map();
	}

	set(pos: GridPosition, val: GridValue): void {
		this.grid.set(`${pos[0]},${pos[1]}`, val);
	}

	get(pos: GridPosition): GridValue {
		return this.grid.get(`${pos[0]},${pos[1]}`) || " ";
	}

	has(pos: GridPosition): boolean {
		return this.grid.has(`${pos[0]},${pos[1]}`);
	}

	delete(pos: GridPosition): void {
		this.grid.delete(`${pos[0]},${pos[1]}`);
	}

	clear(): void {
		this.grid.clear();
	}

	values(): IterableIterator<GridValue> {
		return this.grid.values();
	}

	entries(): IterableIterator<[string, GridValue]> {
		return this.grid.entries();
	}

	shrink(): Grid {
		const smallGrid = new Grid(Math.floor(this.w / 2), Math.floor(this.h / 2));
		for (let y = 0; y < Math.floor(this.h / 2); y++) {
			for (let x = 0; x < Math.floor(this.w / 2); x++) {
				smallGrid.set([x, y], this.get([2 * x + 1, 2 * y + 1]));
			}
		}
		return smallGrid;
	}

	testPath(
		path: { xys: (dx0: number, dy0: number) => Generator<GridPosition> },
		x0: number,
		y0: number,
		dx0: number = 0,
		dy0: number = 1
	): boolean {
		for (const [x, y] of path.xys(dx0, dy0)) {
			const newX = x0 - x + y;
			const newY = y0 + x + y;
			if (newX < 0 || newX >= this.w || newY < 0 || newY >= this.h) {
				return false;
			}
			if (this.has([newX, newY])) {
				return false;
			}
		}
		return true;
	}

	drawPath(
		path: { xys: (dx0: number, dy0: number) => Generator<GridPosition> },
		x0: number,
		y0: number,
		dx0: number = 0,
		dy0: number = 1,
		loop: boolean = false
	): void {
		const positions = Array.from(path.xys(dx0, dy0));

		if (loop) {
			positions.push(positions[1]);
		}

		for (let i = 1; i < positions.length - 1; i++) {
			const [xp, yp] = positions[i - 1];
			const [x, y] = positions[i];
			const [xn, yn] = positions[i + 1];
			const newX = x0 - x + y;
			const newY = y0 + x + y;

			// Get the character based on the path direction and rotation
			const xDiff = xn - xp;
			const yDiff = yn - yp;
			const rotation = sign((x - xp) * (yn - y) - (xn - x) * (y - yp));

			// Define the character mapping
			const charMap: Record<string, GridValue> = {
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

			const key = `${xDiff},${yDiff},${rotation}`;
			this.set([newX, newY], charMap[key]);
		}
	}

	makeTubes(): [Grid, UnionFind] {
		const uf = new UnionFind();
		const tubeGrid = new Grid(this.w, this.h);

		for (let x = 0; x < this.w; x++) {
			let d: GridValue = "-";
			for (let y = 0; y < this.h; y++) {
				const current = this.get([x, y]);
				const connections: Record<string, Array<[number, number]>> = {
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

				const key = `${current}${d}`;
				if (connections[key]) {
					for (const [dx, dy] of connections[key]) {
						uf.union([x, y], [x + dx, y + dy]);
					}
				}

				const tubeChar: Record<string, GridValue> = {
					"/-": "┐",
					"\\-": "┌",
					"/|": "└",
					"\\|": "┘",
					" -": "-",
					" |": "|",
				};

				tubeGrid.set([x, y], tubeChar[key] || "x");

				if ("\\v^/".includes(current)) {
					d = d === "-" ? "|" : "-";
				}
			}
		}

		return [tubeGrid, uf];
	}

	clearPath(path: { xys: (dx0: number, dy0: number) => Generator<GridPosition> }, x: number, y: number): void {
		const pathGrid = new Grid(this.w, this.h);
		pathGrid.drawPath(path, x, y, 0, 1, true);

		const [tubeGrid] = pathGrid.makeTubes();
		for (const [key, value] of tubeGrid.entries()) {
			if (value === "|") {
				const [px, py] = key.split(",").map(Number);
				this.delete([px, py]);
			}
		}
	}
}

export { Grid, sign, UnionFind };
