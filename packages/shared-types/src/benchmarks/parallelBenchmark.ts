// Parallel board generation benchmark

import { generateBoardParallel } from "../boardGeneration/parallelBoardGenerator";

async function main() {
    const sizes = [
        { width: 15, height: 15, runs: 2 },
        { width: 20, height: 20, runs: 1 },
    ];

    console.log("=== PARALLEL BENCHMARK ===\n");
    console.log(`Using 8 child processes\n`);

    for (const { width, height, runs } of sizes) {
        console.log(`--- ${width}x${height} (${runs} runs) ---`);
        const times: number[] = [];

        for (let i = 0; i < runs; i++) {
            const start = Date.now();
            try {
                await generateBoardParallel(width, height, 8);
                const elapsed = Date.now() - start;
                times.push(elapsed);
                console.log(`  Run ${i + 1}: ${elapsed}ms`);
            } catch (error) {
                console.log(`  Run ${i + 1}: FAILED - ${error}`);
            }
        }

        if (times.length > 0) {
            const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
            const min = Math.min(...times);
            const max = Math.max(...times);
            console.log(`  AVG: ${avg}ms | MIN: ${min}ms | MAX: ${max}ms\n`);
        }
    }
}

main().catch(console.error);
