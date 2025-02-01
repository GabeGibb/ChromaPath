// Types and enums
enum Step {
	T = 0,
	L = 1,
	R = 2,
}

type Position = [number, number];
type Direction = [number, number];

export class Path {
	private steps: Step[];
	constructor(steps: Step[]) {
		this.steps = steps;
	}

	*xys(dx: number = 0, dy: number = 1): Generator<Position> {
		let x = 0,
			y = 0;
		yield [x, y];

		for (const step of this.steps) {
			x += dx;
			y += dy;
			yield [x, y];

			if (step === Step.L) {
				[dx, dy] = [-dy, dx];
			} else if (step === Step.R) {
				[dx, dy] = [dy, -dx];
			} else if (step === Step.T) {
				x += dx;
				y += dy;
				yield [x, y];
			}
		}
	}

	test(): boolean {
		const positions = new Set<string>();
		for (const [x, y] of this.xys()) {
			const posKey = `${x},${y}`;
			if (positions.has(posKey)) {
				return false;
			}
			positions.add(posKey);
		}
		return true;
	}

	testLoop(): boolean {
		const positions = new Set<string>();
		const points = Array.from(this.xys());

		for (const [x, y] of points) {
			const posKey = `${x},${y}`;
			positions.add(posKey);
		}

		const firstPos = points[0];
		const lastPos = points[points.length - 1];
		const isLoop = firstPos[0] === lastPos[0] && firstPos[1] === lastPos[1];

		return points.length === positions.size || (points.length === positions.size + 1 && isLoop);
	}

	winding(): number {
		let rightCount = 0;
		let leftCount = 0;

		for (const step of this.steps) {
			if (step === Step.R) rightCount++;
			else if (step === Step.L) leftCount++;
		}

		return rightCount - leftCount;
	}
}

function unrotate(x: number, y: number, dx: number, dy: number): Position {
	while (dx !== 0 || dy !== 1) {
		[x, y] = [-y, x];
		[dx, dy] = [-dy, dx];
	}
	return [x, y];
}

export class Mitm {
	private inv: Map<string, Step[][]> = new Map();
	private list: [Step[], number, number, number, number][] = [];

	constructor(private lrPrice: number, private tPrice: number) {}

	private keyFor(x: number, y: number, dx: number, dy: number): string {
		return `${x},${y},${dx},${dy}`;
	}

	prepare(budget: number): void {
		const dx0 = 0,
			dy0 = 1;
		for (const [path, [x, y], [dx, dy]] of this.goodPaths(0, 0, dx0, dy0, budget)) {
			this.list.push([path, x, y, dx, dy]);
			const key = this.keyFor(x, y, dx, dy);
			if (!this.inv.has(key)) {
				this.inv.set(key, []);
			}
			this.inv.get(key)!.push(path);
		}
	}

	*goodPaths(
		x: number,
		y: number,
		dx: number,
		dy: number,
		budget: number,
		seen: Set<string> = new Set()
	): Generator<[Step[], Position, Direction]> {
		if (budget >= 0) {
			yield [[], [x, y], [dx, dy]];
		}
		if (budget <= 0) {
			return;
		}

		const posKey = `${x},${y}`;
		seen.add(posKey);

		const x1 = x + dx,
			y1 = y + dy;
		const pos1Key = `${x1},${y1}`;

		if (!seen.has(pos1Key)) {
			for (const [path, pos, dir] of this.goodPaths(x1, y1, -dy, dx, budget - this.lrPrice, seen)) {
				yield [[Step.L, ...path], pos, dir];
			}
			for (const [path, pos, dir] of this.goodPaths(x1, y1, dy, -dx, budget - this.lrPrice, seen)) {
				yield [[Step.R, ...path], pos, dir];
			}

			seen.add(pos1Key);
			const x2 = x1 + dx,
				y2 = y1 + dy;
			const pos2Key = `${x2},${y2}`;

			if (!seen.has(pos2Key)) {
				for (const [path, pos, dir] of this.goodPaths(x2, y2, dx, dy, budget - this.tPrice, seen)) {
					yield [[Step.T, ...path], pos, dir];
				}
			}
			seen.delete(pos1Key);
		}
		seen.delete(posKey);
	}

	private lookup(dx: number, dy: number, xn: number, yn: number, dxn: number, dyn: number): Step[][] {
		const [xt, yt] = unrotate(xn, yn, dx, dy);
		const [dxt, dyt] = unrotate(dxn, dyn, dx, dy);
		return this.inv.get(this.keyFor(xt, yt, dxt, dyt)) || [];
	}

	randPath(xn: number, yn: number, dxn: number, dyn: number): Path | null {
		const seen = new Set<string>();

		while (true) {
			seen.clear();
			let path: Step[] = [];
			let x = 0,
				y = 0;
			let dx = 0,
				dy = 1;

			seen.add(`${x},${y}`);

			// Try random walk for twice the manhattan distance
			const maxSteps = 2 * (Math.abs(xn) + Math.abs(yn));

			for (let step = 0; step < maxSteps; step++) {
				// Sample with weights proportional to prices
				const r = Math.random() * (2 / this.tPrice + 2 / this.lrPrice);
				let nextStep: Step;

				if (r < 1 / this.lrPrice) {
					nextStep = Step.L;
				} else if (r < 2 / this.lrPrice) {
					nextStep = Step.R;
				} else {
					nextStep = Step.T;
				}

				path.push(nextStep);
				x += dx;
				y += dy;

				const posKey = `${x},${y}`;
				if (seen.has(posKey)) {
					break;
				}
				seen.add(posKey);

				if (nextStep === Step.L) {
					[dx, dy] = [-dy, dx];
				} else if (nextStep === Step.R) {
					[dx, dy] = [dy, -dx];
				} else if (nextStep === Step.T) {
					x += dx;
					y += dy;
					const newPosKey = `${x},${y}`;
					if (seen.has(newPosKey)) {
						break;
					}
					seen.add(newPosKey);
				}

				// Check if we've reached the target
				if (x === xn && y === yn) {
					return new Path(path);
				}

				// Try to complete path using lookup table
				const ends = this.lookup(dx, dy, xn - x, yn - y, dxn, dyn);
				if (ends.length > 0) {
					const endPath = ends[Math.floor(Math.random() * ends.length)];
					return new Path([...path, ...endPath]);
				}
			}
		}
	}

	randLoop(clock: number = 0): Path | null {
		while (true) {
			const idx = Math.floor(Math.random() * this.list.length);
			const [path, x, y, dx, dy] = this.list[idx];
			const path2s = this.lookup(dx, dy, -x, -y, 0, 1);

			if (path2s.length > 0) {
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
}
