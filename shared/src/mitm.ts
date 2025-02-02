// Define direction constants
enum Direction {
	T,
	L,
	R,
}

// Type for positions and directions
type Position = [number, number];

class Path {
	constructor(private steps: Direction[]) {}

	*xys(dx: number = 0, dy: number = 1): Generator<Position> {
		let x = 0,
			y = 0;
		yield [x, y];

		for (const step of this.steps) {
			x += dx;
			y += dy;
			yield [x, y];

			if (step === Direction.L) {
				[dx, dy] = [-dy, dx];
			} else if (step === Direction.R) {
				[dx, dy] = [dy, -dx];
			} else if (step === Direction.T) {
				x += dx;
				y += dy;
				yield [x, y];
			}
		}
	}

	testLoop(): boolean {
		const positions = Array.from(this.xys());
		const seen = new Set(positions.map((p) => `${p[0]},${p[1]}`));

		if (positions.length === seen.size) {
			return true;
		}

		const firstPos = positions[0];
		const lastPos = positions[positions.length - 1];
		return positions.length === seen.size + 1 && firstPos[0] === lastPos[0] && firstPos[1] === lastPos[1];
	}

	winding(): number {
		return this.steps.filter((s) => s === Direction.R).length - this.steps.filter((s) => s === Direction.L).length;
	}
}

function unrotate(x: number, y: number, dx: number, dy: number): [number, number] {
	while (dx !== 0 || dy !== 1) {
		[x, y] = [-y, x];
		[dx, dy] = [-dy, dx];
	}
	return [x, y];
}

class Mitm {
	private inv: Map<string, Direction[][]> = new Map();
	private list: Array<[Direction[], number, number, number, number]> = [];

	constructor(private lrPrice: number, private tPrice: number) {}

	private getKey(x: number, y: number, dx: number, dy: number): string {
		return `${x},${y},${dx},${dy}`;
	}

	prepare(budget: number): void {
		const [dx0, dy0] = [0, 1];
		for (const [path, [x, y, dx, dy]] of this.goodPaths(0, 0, dx0, dy0, budget)) {
			this.list.push([path, x, y, dx, dy]);
			const key = this.getKey(x, y, dx, dy);
			if (!this.inv.has(key)) {
				this.inv.set(key, []);
			}
			this.inv.get(key)!.push(path);
		}
	}

	randPath(xn: number, yn: number, dxn: number, dyn: number): Path {
		const seen = new Set<string>();
		const path: Direction[] = [];

		while (true) {
			seen.clear();
			path.length = 0;
			let [x, y, dx, dy] = [0, 0, 0, 1];
			seen.add(`${x},${y}`);

			for (let i = 0; i < 2 * (Math.abs(xn) + Math.abs(yn)); i++) {
				// Sample with weights
				const rand = Math.random() * (2 / this.tPrice + 2 / this.lrPrice);
				let step: Direction;
				if (rand < 1 / this.lrPrice) {
					step = Direction.L;
				} else if (rand < 2 / this.lrPrice) {
					step = Direction.R;
				} else {
					step = Direction.T;
				}

				path.push(step);
				x += dx;
				y += dy;

				const posKey = `${x},${y}`;
				if (seen.has(posKey)) break;
				seen.add(posKey);

				if (step === Direction.L) {
					[dx, dy] = [-dy, dx];
				} else if (step === Direction.R) {
					[dx, dy] = [dy, -dx];
				} else if (step === Direction.T) {
					x += dx;
					y += dy;
					const newPosKey = `${x},${y}`;
					if (seen.has(newPosKey)) break;
					seen.add(newPosKey);
				}

				if (x === xn && y === yn) {
					return new Path(path);
				}

				const ends = this.lookup(dx, dy, xn - x, yn - y, dxn, dyn);
				if (ends && ends.length > 0) {
					const randomEnd = ends[Math.floor(Math.random() * ends.length)];
					return new Path([...path, ...randomEnd]);
				}
			}
		}
	}

	randLoop(clock: number = 0): Path {
		while (true) {
			const [path, x, y, dx, dy] = this.list[Math.floor(Math.random() * this.list.length)];
			const path2s = this.lookup(dx, dy, -x, -y, 0, 1);

			if (path2s && path2s.length > 0) {
				const path2 = path2s[Math.floor(Math.random() * path2s.length)];
				const joined = new Path([...path, ...path2]);

				if (clock && joined.winding() !== clock * 4) {
					continue;
				}

				if (joined.testLoop()) {
					return joined;
				}
			}
		}
	}

	private *goodPaths(
		x: number,
		y: number,
		dx: number,
		dy: number,
		budget: number,
		seen: Set<string> = new Set()
	): Generator<[Direction[], [number, number, number, number]]> {
		if (budget >= 0) {
			yield [[], [x, y, dx, dy]];
		}
		if (budget <= 0) {
			return;
		}

		const posKey = `${x},${y}`;
		seen.add(posKey);

		const x1 = x + dx;
		const y1 = y + dy;
		const pos1Key = `${x1},${y1}`;

		if (!seen.has(pos1Key)) {
			// Try L turn
			for (const [path, end] of this.goodPaths(x1, y1, -dy, dx, budget - this.lrPrice, seen)) {
				yield [[Direction.L, ...path], end];
			}

			// Try R turn
			for (const [path, end] of this.goodPaths(x1, y1, dy, -dx, budget - this.lrPrice, seen)) {
				yield [[Direction.R, ...path], end];
			}

			seen.add(pos1Key);
			const x2 = x1 + dx;
			const y2 = y1 + dy;
			const pos2Key = `${x2},${y2}`;

			if (!seen.has(pos2Key)) {
				// Try T move
				for (const [path, end] of this.goodPaths(x2, y2, dx, dy, budget - this.tPrice, seen)) {
					yield [[Direction.T, ...path], end];
				}
			}
			seen.delete(pos1Key);
		}
		seen.delete(posKey);
	}

	private lookup(dx: number, dy: number, xn: number, yn: number, dxn: number, dyn: number): Direction[][] | undefined {
		const [xt, yt] = unrotate(xn, yn, dx, dy);
		const [dxt, dyt] = unrotate(dxn, dyn, dx, dy);
		return this.inv.get(this.getKey(xt, yt, dxt, dyt));
	}
}

// Export for use
export { Direction, Mitm, Path };
