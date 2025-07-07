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
            Discover the algorithms behind ChromaPath&apos;s infinite puzzle
            generation
          </p>
        </div>

        {/* Overview */}
        <Card variant="elevated" className="space-y-6">
          <h2 className="text-2xl font-bold text-primary">How It Works</h2>
          <p className="text-neutral-300 leading-relaxed">
            ChromaPath uses advanced procedural generation algorithms to create
            unique, solvable puzzles. Each board is generated using a
            combination of path-finding algorithms, constraint satisfaction, and
            validation techniques to ensure every puzzle has exactly one
            solution.
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
                  Grid Initialization
                </h3>
                <p className="text-neutral-400">
                  A blank grid of the specified size is created. The algorithm
                  then strategically places colored endpoints on the grid,
                  ensuring they are positioned to allow for valid path
                  connections.
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
                  For each pair of matching endpoints, the algorithm generates a
                  valid path using advanced pathfinding techniques. Paths are
                  created to avoid conflicts while maintaining puzzle
                  solvability.
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
                  The generated board is validated to ensure it meets all puzzle
                  requirements: exactly one solution, no impossible
                  configurations, and balanced difficulty based on board size.
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
                  The final step verifies that the puzzle has exactly one valid
                  solution using backtracking algorithms. If multiple solutions
                  exist, the board is regenerated.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Technical Details */}
        <Card variant="elevated" className="space-y-6">
          <h2 className="text-2xl font-bold text-accent">
            Technical Implementation
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-200">
                Algorithms Used
              </h3>
              <ul className="space-y-2 text-neutral-400">
                <li>
                  • <strong>A* Pathfinding:</strong> For efficient path
                  generation
                </li>
                <li>
                  • <strong>Backtracking:</strong> For solution validation
                </li>
                <li>
                  • <strong>Constraint Satisfaction:</strong> For puzzle
                  balancing
                </li>
                <li>
                  • <strong>Random Walk:</strong> For endpoint placement
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-200">
                Optimization Features
              </h3>
              <ul className="space-y-2 text-neutral-400">
                <li>
                  • <strong>Parallel Processing:</strong> Multiple boards
                  generated simultaneously
                </li>
                <li>
                  • <strong>Caching:</strong> Pre-generated boards for instant
                  play
                </li>
                <li>
                  • <strong>Difficulty Scaling:</strong> Adjusts complexity with
                  board size
                </li>
                <li>
                  • <strong>Memory Management:</strong> Efficient resource usage
                </li>
              </ul>
            </div>
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
              for instant delivery. The generation process typically takes
              50-200ms depending on board size and complexity.
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
              <div className="text-3xl font-bold text-primary">~50ms</div>
              <div className="text-sm text-neutral-400">
                Average Generation Time
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary">99.9%</div>
              <div className="text-sm text-neutral-400">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">∞</div>
              <div className="text-sm text-neutral-400">
                Unique Combinations
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-info">1</div>
              <div className="text-sm text-neutral-400">Solution Per Board</div>
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
