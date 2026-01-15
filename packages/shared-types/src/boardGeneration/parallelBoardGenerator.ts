import { Board } from "../types";
import { BoardGenerator } from "./boardGeneration";

/**
 * Board generator wrapper.
 * Now that generateBoard is synchronous, parallelism isn't beneficial
 * in the same JS thread. This wrapper is kept for API compatibility.
 */
export function generateBoardParallel(
    width: number,
    height: number,
    _numAttempts: number = 4
): Board {
    const start = Date.now();
    const generator = new BoardGenerator();
    const board = generator.generateBoard(width, height);
    const elapsed = Date.now() - start;
    console.log(`[GENERATOR] Success in ${elapsed}ms`);
    return board;
}

export class ParallelBoardGenerator {
    private numAttempts: number;

    constructor(numAttempts: number = 4) {
        this.numAttempts = numAttempts;
    }

    generateBoard(width: number, height: number): Board {
        return generateBoardParallel(width, height, this.numAttempts);
    }
}
