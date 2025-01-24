import React, { useEffect, useRef, useState } from "react";
import { FlowFreeRenderer } from "./Renderer";
import { FlowFreeGame } from "./gameLogic";

interface Props {
	width?: number;
	height?: number;
	initialSize?: number;
}

const ChromaPath: React.FC<Props> = ({ width = 400, height = 400, initialSize = 5 }) => {
	const canvasRef = useRef<HTMLDivElement>(null);
	const gameRef = useRef<FlowFreeGame | null>(null);
	const rendererRef = useRef<FlowFreeRenderer | null>(null);
	const [boardSize, setBoardSize] = useState(initialSize);
	const [level, setLevel] = useState(1);

	useEffect(() => {
		if (!canvasRef.current) return;
		gameRef.current = new FlowFreeGame(boardSize);
		rendererRef.current = new FlowFreeRenderer(canvasRef.current, width, height);

		const renderer = rendererRef.current;
		const game = gameRef.current;

		renderer.render(game.getState(), boardSize);

		return () => {
			renderer.destroy();
		};
	}, []);

	useEffect(() => {
		if (!gameRef.current || !rendererRef.current || !rendererRef.current.initialized) return;

		const canvas = rendererRef.current.getCanvas();
		const cellSize = width / boardSize;

		const handlePointerDown = (event: PointerEvent) => {
			if (!gameRef.current || !rendererRef.current) return;

			const rect = canvas.getBoundingClientRect();
			const x = Math.floor((event.clientX - rect.left) / cellSize);
			const y = Math.floor((event.clientY - rect.top) / cellSize);

			if (x >= 0 && x < boardSize && y >= 0 && y < boardSize) {
				gameRef.current?.handleCellClick(x, y);
				rendererRef.current?.render(gameRef.current?.getState(), boardSize);
			}
		};

		const handlePointerMove = (event: PointerEvent) => {
			if (!gameRef.current || !rendererRef.current) return;

			const rect = canvas.getBoundingClientRect();
			const x = Math.floor((event.clientX - rect.left) / cellSize);
			const y = Math.floor((event.clientY - rect.top) / cellSize);

			if (x >= 0 && x < boardSize && y >= 0 && y < boardSize) {
				gameRef.current?.handleDrag(x, y);
				rendererRef.current?.render(gameRef.current?.getState(), boardSize);
			}
		};

		const handlePointerUp = () => {
			if (!gameRef.current || !rendererRef.current) return;

			gameRef.current?.endDrag();
			rendererRef.current?.render(gameRef.current?.getState(), boardSize);
		};

		canvas.addEventListener("pointerdown", handlePointerDown);
		canvas.addEventListener("pointermove", handlePointerMove);
		canvas.addEventListener("pointerup", handlePointerUp);

		return () => {
			canvas.removeEventListener("pointerdown", handlePointerDown);
			canvas.removeEventListener("pointermove", handlePointerMove);
			canvas.removeEventListener("pointerup", handlePointerUp);
		};
	}, [boardSize]);

	const handleNewLevel = () => {
		if (!gameRef.current || !rendererRef.current) return;
		gameRef.current?.reset(boardSize);
		rendererRef.current?.render(gameRef.current?.getState(), boardSize);
		setLevel((prev) => prev + 1);
	};

	return (
		<div className="flex flex-col items-center gap-4">
			<div className="text-xl font-bold">Flow Free - Level {level}</div>
			<div ref={canvasRef} className="border border-gray-300 rounded-lg shadow-lg" />
			<div className="flex gap-4">
				<button onClick={handleNewLevel} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
					New Level
				</button>
				<select
					value={boardSize}
					onChange={(e) => setBoardSize(Number(e.target.value))}
					className="px-4 py-2 border rounded"
				>
					<option value={5}>5x5</option>
					<option value={6}>6x6</option>
					<option value={7}>7x7</option>
				</select>
			</div>
		</div>
	);
};

export default ChromaPath;
