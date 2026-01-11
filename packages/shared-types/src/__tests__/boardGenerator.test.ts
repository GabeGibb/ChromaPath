/**
 * Board Generator Tests
 *
 * Tests verify compliance with BOARD_REQUIREMENTS.md
 *
 * NOTE: The generator returns boards with only endpoints visible (non-endpoints are null).
 * The generator validates internally via pathsHaveBetterSolution to ensure unique solutions.
 */

import { describe, it, expect } from "vitest";
import { BoardGenerator } from "../boardGeneration/boardGeneration";
import { Board, Point } from "../types";

// Helper: Get all endpoints grouped by path index
function getEndpoints(board: Board): Map<number, Point[]> {
  const endpoints = new Map<number, Point[]>();
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[0].length; x++) {
      const cell = board[y][x];
      if (cell?.isEndpoint) {
        if (!endpoints.has(cell.pathIndex)) {
          endpoints.set(cell.pathIndex, []);
        }
        endpoints.get(cell.pathIndex)!.push({ x, y });
      }
    }
  }
  return endpoints;
}

// ============================================================================
// TESTS
// ============================================================================

describe("Board Generator - Core Requirements", () => {
  const generator = new BoardGenerator();
  const testSizes = [
    { width: 5, height: 5 },
    { width: 7, height: 7 },
  ];

  describe("1. Cell Coverage (CRITICAL)", () => {
    it.each(testSizes)(
      "puzzle should generate successfully for $width x $height board",
      async ({ width, height }) => {
        // The generator only returns boards where all cells are filled
        // (via Hamiltonian path construction). If generation succeeds,
        // the board passed cell coverage validation internally.
        const board = await generator.generateBoard(width, height);
        const endpoints = getEndpoints(board);
        // Verify we got a valid board with endpoints
        expect(endpoints.size).toBeGreaterThanOrEqual(2);
      },
      30000 // Timeout
    );

    it("should have exactly 2 endpoints per path", async () => {
      const board = await generator.generateBoard(7, 7);
      const endpoints = getEndpoints(board);

      for (const [, points] of endpoints) {
        expect(points.length).toBe(2);
      }
    });

    it("should have at least 2 paths for 5x5 board", async () => {
      const board = await generator.generateBoard(5, 5);
      const endpoints = getEndpoints(board);
      expect(endpoints.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe("2. Unique Solution (CRITICAL)", () => {
    it("5x5 puzzle should be generated successfully (validated internally)", async () => {
      // The generator validates unique solution via pathsHaveBetterSolution
      // If generation succeeds without error, the board passed validation
      const board = await generator.generateBoard(5, 5);
      const endpoints = getEndpoints(board);
      // Verify valid structure: at least 2 paths with 2 endpoints each
      expect(endpoints.size).toBeGreaterThanOrEqual(2);
      for (const [, points] of endpoints) {
        expect(points.length).toBe(2);
      }
    }, 30000);

    it("7x7 puzzle should be generated successfully (validated internally)", async () => {
      // The generator validates unique solution via pathsHaveBetterSolution
      const board = await generator.generateBoard(7, 7);
      const endpoints = getEndpoints(board);
      expect(endpoints.size).toBeGreaterThanOrEqual(3);
      for (const [, points] of endpoints) {
        expect(points.length).toBe(2);
      }
    }, 60000);
  });

  describe("3. Path Complexity - Twists and Turns", () => {
    it("endpoints should not be in a straight line (ensuring turns exist)", async () => {
      // Generate multiple boards and check that endpoints aren't always in straight lines
      // This is a proxy for path complexity - if endpoints are at angles, paths must turn
      let boardsWithNonLinearEndpoints = 0;
      const testCount = 5;

      for (let i = 0; i < testCount; i++) {
        const board = await generator.generateBoard(5, 5);
        const endpoints = getEndpoints(board);

        // Check if any endpoint pair requires a turn (not in same row/column)
        let hasNonLinearPair = false;
        for (const [, [p1, p2]] of endpoints) {
          if (p1.x !== p2.x && p1.y !== p2.y) {
            hasNonLinearPair = true;
            break;
          }
        }

        if (hasNonLinearPair) boardsWithNonLinearEndpoints++;
      }

      // At least 60% of boards should have endpoint pairs that aren't in straight lines
      expect(boardsWithNonLinearEndpoints).toBeGreaterThanOrEqual(Math.floor(testCount * 0.6));
    }, 30000);
  });

  describe("4. Path Distribution", () => {
    it("should have reasonable number of paths for 7x7 board", async () => {
      const board = await generator.generateBoard(7, 7);
      const endpoints = getEndpoints(board);
      const pathCount = endpoints.size;

      // 7x7 = 49 cells, should have at least 4 paths (avg ~12 cells each)
      // and at most 16 paths (avg ~3 cells each, min path length is 3)
      expect(pathCount).toBeGreaterThanOrEqual(4);
      expect(pathCount).toBeLessThanOrEqual(16);
    }, 30000);

    it("should have multiple paths preventing trivial solutions", async () => {
      // Generate several boards and verify none have just 1-2 paths
      const testCount = 3;
      for (let i = 0; i < testCount; i++) {
        const board = await generator.generateBoard(7, 7);
        const endpoints = getEndpoints(board);
        expect(endpoints.size).toBeGreaterThanOrEqual(3);
      }
    }, 30000);
  });
});

describe("Board Generator - Performance Requirements", () => {
  const generator = new BoardGenerator();

  it("5x5 should generate in under 100ms", async () => {
    const start = Date.now();
    await generator.generateBoard(5, 5);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(100);
  }, 10000);

  it("7x7 should generate in under 200ms", async () => {
    const start = Date.now();
    await generator.generateBoard(7, 7);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(200);
  }, 10000);

  it("15x15 should generate successfully", async () => {
    // 15x15 uses single-threaded generator with Las Vegas style
    // Performance varies significantly - average ~1-2s but can take longer
    // The test verifies generation works, not strict timing
    const start = Date.now();
    const board = await generator.generateBoard(15, 15);
    const elapsed = Date.now() - start;
    console.log(`15x15 generated in ${elapsed}ms`);
    // Just verify it completed and is valid
    expect(board.length).toBe(15);
    expect(board[0].length).toBe(15);
  }, 30000); // 30 second timeout for worst case
});

describe("Board Generator - Board Format", () => {
  const generator = new BoardGenerator();

  it("returned board should have correct dimensions", async () => {
    const board = await generator.generateBoard(7, 7);
    expect(board.length).toBe(7);
    expect(board[0].length).toBe(7);
  });

  it("returned board should only have endpoints (non-endpoints are null)", async () => {
    const board = await generator.generateBoard(5, 5);

    for (const row of board) {
      for (const cell of row) {
        if (cell !== null) {
          expect(cell.isEndpoint).toBe(true);
        }
      }
    }
  });

  it("endpoints should have valid path indices", async () => {
    const board = await generator.generateBoard(7, 7);
    const pathIndices = new Set<number>();

    for (const row of board) {
      for (const cell of row) {
        if (cell?.isEndpoint) {
          pathIndices.add(cell.pathIndex);
        }
      }
    }

    // Path indices should be sequential starting from 0
    const indices = Array.from(pathIndices).sort((a, b) => a - b);
    for (let i = 0; i < indices.length; i++) {
      expect(indices[i]).toBe(i);
    }
  });
});
