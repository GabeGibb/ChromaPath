import { Path } from "./mitm";

// Type definitions for grid coordinates and values
type Coordinate = [number, number];
type GridValue = string;
type GridContent = Map<string, GridValue>;

function sign(x: number): number {
	if (x === 0) return x;
	return x < 0 ? -1 : 1;
}

// TODO: This can be improvved
export class UnionFind {
	private uf: Map<string, string>;

	constructor(initial?: Map<string, string>) {
		this.uf = initial || new Map();
	}

	serialize(a: Coordinate): string {
		return `${a[0]},${a[1]}`;
	}

	deserialize(s: string): Coordinate {
		const [x, y] = s.split(",").map(Number);
		return [x, y];
	}

	union(a: Coordinate, b: Coordinate): void {
		const aParent = this.find(a);
		const bParent = this.find(b);
		this.uf.set(this.serialize(aParent), this.serialize(bParent));
	}

	find(a: Coordinate): Coordinate {
		const serializedA = this.serialize(a);
		if (!this.uf.has(serializedA)) {
			return a;
		}

		const parent = this.deserialize(this.uf.get(serializedA)!);
		if (this.serialize(parent) === serializedA) {
			return parent;
		}

		// Path compression
		const finalParent = this.find(parent);
		this.uf.set(serializedA, this.serialize(finalParent));
		return finalParent;
	}
}

export class Grid {
	public w: number;
	public h: number;
	public grid: GridContent;

	constructor(w: number, h: number) {
		this.w = w;
		this.h = h;
		this.grid = new Map();
	}

	set(key: Coordinate, val: GridValue): void {
		this.grid.set(`${key[0]},${key[1]}`, val);
	}

	get(key: Coordinate): GridValue {
		return this.grid.get(`${key[0]},${key[1]}`) || " ";
	}

	entries(): [Coordinate, GridValue][] {
		return Array.from(this.grid.entries()).map(([key, value]) => {
			const [x, y] = key.split(",").map(Number);
			return [[x, y], value];
		});
	}

	has(key: Coordinate): boolean {
		return this.grid.has(`${key[0]},${key[1]}`);
	}

	delete(key: Coordinate): void {
		this.grid.delete(`${key[0]},${key[1]}`);
	}

	clear(): void {
		this.grid.clear();
	}

	values(): GridValue[] {
		return Array.from(this.grid.values());
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

	testPath(path: Path, x0: number, y0: number, dx0: number = 0, dy0: number = 1): boolean {
		for (const [x, y] of path.xys(dx0, dy0)) {
			const testX = x0 - x + y;
			const testY = y0 + x + y;
			// All conditions must be true for each point
			if (!(0 <= testX && testX < this.w && 0 <= testY && testY < this.h && !this.has([testX, testY]))) {
				return false;
			}
		}
		return true;
	}

	drawPath(path: Path, x0: number, y0: number, dx0: number = 0, dy0: number = 1, loop: boolean = false): void {
		const ps: Coordinate[] = Array.from(path.xys(dx0, dy0));

		if (loop) {
			const [firstX, firstY] = ps[0];
			const [lastX, lastY] = ps[ps.length - 1];
			// Match Python's assert style
			if (firstX !== lastX || firstY !== lastY) {
				throw new Error(`${path}, ${ps}`); // Match Python's assert message
			}
			ps.push(ps[1]);
		}

		const charMap: Record<string, string> = {
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

		for (let i = 1; i < ps.length - 1; i++) {
			const [xp, yp] = ps[i - 1];
			const [x, y] = ps[i];
			const [xn, yn] = ps[i + 1];

			const xDiff = xn - xp;
			const yDiff = yn - yp;
			const cross = sign((x - xp) * (yn - y) - (xn - x) * (y - yp));

			// Access grid using array-style indexing to match Python
			const key = `${xDiff},${yDiff},${cross}`;
			const char = charMap[key];

			// TODO: SUSPECT
			if (char) {
				this.set([x0 - x + y, y0 + x + y], char);
			}
		}
	}

	makeTubes(): [Grid, UnionFind] {
		const uf = new UnionFind();
		const tubeGrid = new Grid(this.w, this.h);

		const unionDirections: Record<string, Coordinate[]> = {
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

		const charMap: Record<string, string> = {
			"/-": "┐",
			"\\-": "┌",
			"/|": "└",
			"\\|": "┘",
			" -": "-",
			" |": "|",
		};

		// TODO: SUSPECT

		for (let x = 0; x < this.w; x++) {
			let d = "-";
			for (let y = 0; y < this.h; y++) {
				const key = this.get([x, y]) + d;

				// Handle unions
				const directions = unionDirections[key] || [];
				for (const [dx, dy] of directions) {
					uf.union([x, y], [x + dx, y + dy]);
				}

				// Set tube grid character
				tubeGrid.set([x, y], charMap[key] || "x");

				// Update direction
				if ("\\/v^".includes(this.get([x, y]))) {
					d = d === "-" ? "|" : "-";
				}
			}
		}

		return [tubeGrid, uf];
	}

	// TODO: SUSPECT
	clearPath(path: Path, x: number, y: number): void {
		const pathGrid = new Grid(this.w, this.h);
		pathGrid.drawPath(path, x, y, 0, 1, true);

		const tubeGrid = pathGrid.makeTubes();

		for (const [coord, val] of tubeGrid[0].entries()) {
			if (val === "|") {
				this.delete(coord);
			}
		}
	}
}
