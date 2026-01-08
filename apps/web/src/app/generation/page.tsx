import React from "react";
import Link from "next/link";
import { Button, Card, LoadingSpinner } from "@/components/ui";

const Generation: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-base-300 via-base-200 to-base-300 pt-8 pb-8">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            Board Generation
          </h1>
          <p className="text-xl text-base-content/80 max-w-2xl mx-auto">
            Discover how ChromaPath creates infinite unique puzzles with exactly
            one solution
          </p>
        </div>

        {/* Overview */}
        <Card variant="elevated" className="space-y-6">
          <h2 className="text-2xl font-bold text-primary">How It Works</h2>
          <p className="text-neutral-300 leading-relaxed">
            ChromaPath generates puzzles by creating a grid, placing colored
            endpoints, generating paths between them, and ensuring the final
            puzzle has exactly one solution. The process becomes more
            computationally intensive as board size increases due to the
            exponential growth in possible path combinations.
          </p>
        </Card>

        {/* Generation Process */}
        <Card variant="elevated" className="space-y-6">
          <h2 className="text-2xl font-bold text-secondary">
            Generation Process
          </h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-content rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-200 mb-2">
                  Grid Creation
                </h3>
                <p className="text-neutral-400">
                  We start with a blank grid of the specified size (5x5 to
                  12x12). The grid serves as the canvas where we&apos;ll place
                  endpoints and generate paths. Larger grids provide more space
                  for complex puzzles but require significantly more
                  computation.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-secondary text-secondary-content rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-200 mb-2">
                  Path Generation
                </h3>
                <p className="text-neutral-400">
                  For each pair of matching endpoints, we generate a valid path
                  that connects them. Paths must be continuous, avoid crossing
                  other paths, and respect the constraint that every cell must
                  eventually be filled. We use weighted random walks that favor
                  straight paths with occasional turns to create natural-looking
                  solutions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-accent text-accent-content rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-200 mb-2">
                  Constraint Validation
                </h3>
                <p className="text-neutral-400">
                  After placing each path, we validate that the board still has
                  potential for a complete solution. This includes checking that
                  remaining empty regions are large enough for additional paths,
                  that no cells become isolated, and that the total number of
                  paths needed doesn&apos;t exceed what can fit in the remaining
                  space.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-info text-info-content rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-200 mb-2">
                  Solution Verification
                </h3>
                <p className="text-neutral-400">
                  Once the grid is fully filled, we verify that the puzzle has
                  exactly one solution. This involves checking if removing any
                  combination of paths would allow for alternative solutions. If
                  multiple solutions exist, the board is rejected and we start
                  over. This step is the most computationally expensive,
                  especially for larger boards.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Path Constraints */}
        <Card variant="elevated" className="space-y-6">
          <h2 className="text-2xl font-bold text-accent">
            Path Constraints & Requirements
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-200">
                Grid Filling Requirements
              </h3>
              <ul className="space-y-2 text-neutral-400">
                <li>
                  • <strong>Complete Coverage:</strong> Every cell must be
                  filled with a path
                </li>
                <li>
                  • <strong>No Crossings:</strong> Paths cannot intersect or
                  overlap
                </li>
                <li>
                  • <strong>Continuous Paths:</strong> Each path must be a
                  single connected line
                </li>
                <li>
                  • <strong>Endpoint Pairs:</strong> Each color must have
                  exactly two endpoints
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-200">
                Validation Checks
              </h3>
              <ul className="space-y-2 text-neutral-400">
                <li>
                  • <strong>Region Analysis:</strong> Check that empty regions
                  can accommodate remaining paths
                </li>
                <li>
                  • <strong>Isolation Prevention:</strong> Ensure no cells
                  become unreachable
                </li>
                <li>
                  • <strong>Path Length Validation:</strong> Verify minimum and
                  maximum path lengths
                </li>
                <li>
                  • <strong>Solution Uniqueness:</strong> Confirm exactly one
                  valid solution exists
                </li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Computational Complexity */}
        <Card variant="elevated" className="space-y-6">
          <h2 className="text-2xl font-bold text-warning">
            Computational Complexity
          </h2>
          <div className="space-y-4">
            <p className="text-neutral-300 leading-relaxed">
              The generation process becomes exponentially more complex as board
              size increases. This is due to the combinatorial explosion of
              possible path arrangements and the need to verify solution
              uniqueness.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-base-100/50 rounded-xl">
                <div className="text-2xl font-bold text-primary">5×5</div>
                <div className="text-sm text-neutral-400">~50ms</div>
              </div>
              <div className="text-center p-4 bg-base-100/50 rounded-xl">
                <div className="text-2xl font-bold text-secondary">8×8</div>
                <div className="text-sm text-neutral-400">~200ms</div>
              </div>
              <div className="text-center p-4 bg-base-100/50 rounded-xl">
                <div className="text-2xl font-bold text-accent">10×10</div>
                <div className="text-sm text-neutral-400">~800ms</div>
              </div>
              <div className="text-center p-4 bg-base-100/50 rounded-xl">
                <div className="text-2xl font-bold text-info">12×12</div>
                <div className="text-sm text-neutral-400">~2-5s</div>
              </div>
            </div>
            <p className="text-neutral-400 text-sm">
              Generation times vary based on complexity and solution
              verification requirements. Larger boards require more attempts to
              find valid configurations.
            </p>
          </div>
        </Card>

        {/* Demo Section */}
        <Card variant="elevated" className="space-y-6">
          <h2 className="text-2xl font-bold text-info">Generation Demo</h2>
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-4">
              <LoadingSpinner size="lg" />
              <div className="text-neutral-300">
                <div className="font-semibold">Generating Board...</div>
                <div className="text-sm text-neutral-400">
                  This simulates the actual generation process
                </div>
              </div>
            </div>
            <p className="text-neutral-400 text-sm">
              In the actual game, boards are generated server-side and cached
              for instant delivery. The generation process typically takes 50ms
              to 5 seconds depending on board size and complexity.
            </p>
          </div>
        </Card>

        {/* Statistics */}
        <Card variant="elevated" className="space-y-6">
          <h2 className="text-2xl font-bold text-warning">
            Generation Statistics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">99.9%</div>
              <div className="text-sm text-neutral-400">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary">∞</div>
              <div className="text-sm text-neutral-400">
                Unique Combinations
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">1</div>
              <div className="text-sm text-neutral-400">Solution Per Board</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-info">100K</div>
              <div className="text-sm text-neutral-400">Max Attempts</div>
            </div>
          </div>
        </Card>

        {/* CTA */}
        <div className="text-center space-y-4">
          <Link href="/game">
            <Button size="lg" className="min-w-[200px]">
              Try It Yourself
            </Button>
          </Link>
          <div>
            <Link href="/info">
              <Button
                variant="ghost"
                className="text-neutral-400 hover:text-neutral-200"
              >
                ← Back to Game Info
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Generation;
