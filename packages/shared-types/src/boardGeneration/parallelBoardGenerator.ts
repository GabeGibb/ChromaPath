import { Board } from "../types";
import { BoardGenerator } from "./boardGeneration";

/**
 * Concurrent board generator using Promise.race.
 * Runs multiple generators concurrently and takes the first successful result.
 * While not true parallelism (single JS thread), this helps with variance -
 * if one generator gets unlucky with random paths, another might succeed faster.
 */
export async function generateBoardParallel(
    width: number,
    height: number,
    numAttempts: number = 4
): Promise<Board> {
    const start = Date.now();

    // For small boards, single attempt is fast enough
    if (width * height < 64) {
        const generator = new BoardGenerator();
        return generator.generateBoard(width, height);
    }

    // Run multiple generators concurrently
    const attempts = Array.from({ length: numAttempts }, async (_, i) => {
        const generator = new BoardGenerator();
        const board = await generator.generateBoard(width, height);
        return { board, attemptId: i };
    });

    // Race - first to complete wins
    const result = await Promise.race(attempts);
    const elapsed = Date.now() - start;
    console.log(`[PARALLEL] Success in ${elapsed}ms (attempt ${result.attemptId + 1})`);

    return result.board;
}

export class ParallelBoardGenerator {
    private numAttempts: number;

    constructor(numAttempts: number = 4) {
        this.numAttempts = numAttempts;
    }

    async generateBoard(width: number, height: number): Promise<Board> {
        return generateBoardParallel(width, height, this.numAttempts);
    }
}
