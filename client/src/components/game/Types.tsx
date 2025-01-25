export type Point = {
	x: number;
	y: number;
};

export type Cell = {
	color: string;
	isEndpoint: boolean;
} | null;

export type Board = Cell[][];

export type Paths = {
	[color: string]: Point[];
};

export type GameState = {
	board: Board;
	paths: Paths;
	currentColor: string | null;
	startPoint: Point | null;
	completed: boolean;
	mouseX: number;
	mouseY: number;
};
