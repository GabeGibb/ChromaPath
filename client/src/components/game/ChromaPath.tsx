import React, { useEffect, useRef, useState } from "react";
import { ChromaPathGame } from "./GameLogic";
import { ChromaPathRenderer } from "./Renderer";

interface Props {
	width?: number;
	height?: number;
	initialSize?: number;
}

const ChromaPath: React.FC<Props> = ({ initialSize = 5 }) => {
	const canvasRef = useRef<HTMLDivElement>(null);
	const gameRef = useRef<ChromaPathGame | null>(null);
	const rendererRef = useRef<ChromaPathRenderer | null>(null);
	const [boardSize, setBoardSize] = useState(initialSize);

	useEffect(() => {
		if (!canvasRef.current) return;
		gameRef.current = new ChromaPathGame(boardSize);
		rendererRef.current = new ChromaPathRenderer(canvasRef.current);

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

		const handlePointerDown = (event: PointerEvent) => {
			if (!gameRef.current || !rendererRef.current) return;

			const rect = canvas.getBoundingClientRect();
			const canvasWidth = rect.width;
			const cellSize = canvasWidth / boardSize;

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
			const canvasWidth = rect.width;
			const cellSize = canvasWidth / boardSize;

			const x = Math.floor((event.clientX - rect.left) / cellSize);
			const y = Math.floor((event.clientY - rect.top) / cellSize);

			if (x >= 0 && x < boardSize && y >= 0 && y < boardSize) {
				gameRef.current?.handleDrag(x, y);
				rendererRef.current?.render(gameRef.current?.getState(), boardSize);
			}
		};

		const handleMouseMove = (event: MouseEvent) => {
			if (!gameRef.current || !rendererRef.current) return;

			const rect = canvas.getBoundingClientRect();
			const canvasWidth = rect.width;
			const cellSize = canvasWidth / boardSize;

			const x = Math.floor((event.clientX - rect.left) / cellSize);
			const y = Math.floor((event.clientY - rect.top) / cellSize);

			if (x >= 0 && x < boardSize && y >= 0 && y < boardSize) {
				gameRef.current?.handleMouseMove(x, y);
				rendererRef.current?.render(gameRef.current?.getState(), boardSize);
			}
		};

		const handlePointerUp = () => {
			if (!gameRef.current || !rendererRef.current) return;

			const gameComplete = gameRef.current?.endDrag();
			rendererRef.current?.render(gameRef.current?.getState(), boardSize);

			if (gameComplete) {
				handleNewLevel();
			}
		};

		const handleWindowResize = () => {
			if (!rendererRef.current) return;
			rendererRef.current.resize(canvasRef.current!);
		};

		canvas.addEventListener("pointerdown", handlePointerDown);
		canvas.addEventListener("pointermove", handlePointerMove);
		// canvas.addEventListener("pointerup", handlePointerUp);
		document.addEventListener("pointerup", handlePointerUp);
		canvas.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("resize", handleWindowResize);

		return () => {
			canvas.removeEventListener("pointerdown", handlePointerDown);
			canvas.removeEventListener("pointermove", handlePointerMove);
			// canvas.removeEventListener("pointerup", handlePointerUp);
			document.removeEventListener("pointerup", handlePointerUp);
		};
	}, [boardSize]);

	const handleNewLevel = () => {
		if (!gameRef.current || !rendererRef.current) return;
		gameRef.current?.reset(boardSize);
		rendererRef.current?.render(gameRef.current?.getState(), boardSize);
	};

	useEffect(() => {
		handleNewLevel();
	}, [boardSize]);

	return (
		<div className="h-full w-full flex flex-col justify-evenly items-center gap-4">
			<div className="text-2xl font-bold text-neutral-content">ChromaPath</div>
			<div
				ref={canvasRef}
				className="w-screen h-screen md:w-[800px] md:h-[800px] border border-neutral rounded-lg shadow-lg"
			/>
			<div className="flex gap-4">
				<button onClick={handleNewLevel} className="btn btn-primary">
					New Level
				</button>
				<select
					value={boardSize}
					onChange={(e) => setBoardSize(Number(e.target.value))}
					className="select w-full max-w-xs focus:outline-0 focus:border-0"
				>
					{Array.from({ length: 16 }, (_, i) => (
						<option key={i + 5} value={i + 5}>
							{i + 5}x{i + 5}
						</option>
					))}
				</select>
			</div>
		</div>
	);
};

export default ChromaPath;
