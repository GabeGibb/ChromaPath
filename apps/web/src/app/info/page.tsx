import { Button, Card } from "@/components/ui";
import React from "react";
import Link from "next/link";
import {
  MAX_BOARD_WIDTH,
  MAX_BOARD_HEIGHT,
  MIN_BOARD_WIDTH,
  MIN_BOARD_HEIGHT,
} from "@/shared/consts";

const Info: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-base-300 via-base-200 to-base-300 pt-8 pb-8">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            How to Play
          </h1>
          <p className="text-xl text-base-content/80 max-w-2xl mx-auto">
            Master the art of connecting colored paths in this minimalist puzzle
            game
          </p>
        </div>

        {/* What are Numberlink Puzzles */}
        <Card variant="elevated" className="space-y-6">
          <h2 className="text-2xl font-bold text-primary">
            What are Numberlink Puzzles?
          </h2>
          <div className="space-y-4">
            <p className="text-neutral-300 leading-relaxed">
              ChromaPath is based on Numberlink puzzles, a classic logic puzzle
              where you connect pairs of identical numbers or symbols with paths
              that fill the entire grid. In our version, we use colored
              endpoints instead of numbers, but the core concept remains the
              same.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-neutral-200">
                  Key Rules:
                </h3>
                <ul className="space-y-2 text-neutral-400 text-sm">
                  <li>• Connect each pair of colored endpoints</li>
                  <li>• Paths cannot cross each other</li>
                  <li>• Every cell must be filled with a path</li>
                  <li>• Each path must be continuous</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-neutral-200">
                  Puzzle Origins:
                </h3>
                <p className="text-neutral-400 text-sm">
                  Numberlink puzzles originated in Japan and are popular in
                  puzzle magazines and newspapers worldwide. They&apos;re known
                  for their elegant simplicity and satisfying solutions.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Game Rules */}
        <Card variant="elevated" className="space-y-6">
          <h2 className="text-2xl font-bold text-primary">Objective</h2>
          <p className="text-neutral-300 leading-relaxed">
            Connect all colored endpoints on the board by drawing paths between
            them. Each color must connect to its matching endpoint, and paths
            cannot cross each other. The goal is to fill the entire grid with
            connected paths.
          </p>
        </Card>

        {/* Controls */}
        <Card variant="elevated" className="space-y-6">
          <h2 className="text-2xl font-bold text-secondary">Controls</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-200">
                Mouse/Touch
              </h3>
              <ul className="space-y-2 text-neutral-400">
                <li>
                  • <strong>Click/Tap:</strong> Start drawing a path
                </li>
                <li>
                  • <strong>Drag:</strong> Continue drawing the path
                </li>
                <li>
                  • <strong>Release:</strong> Complete the path
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-200">
                Game Features
              </h3>
              <ul className="space-y-2 text-neutral-400">
                <li>
                  • <strong>New Level:</strong> Generate a new puzzle
                </li>
                <li>
                  • <strong>Board Size:</strong> Choose difficulty (
                  {MIN_BOARD_WIDTH}×{MIN_BOARD_HEIGHT} to {MAX_BOARD_WIDTH}×
                  {MAX_BOARD_HEIGHT})
                </li>
                <li>
                  • <strong>Show Numbers:</strong> Toggle path numbering
                </li>
                <li>
                  • <strong>Refresh:</strong> Reset current paths
                </li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Tips */}
        <Card variant="elevated" className="space-y-6">
          <h2 className="text-2xl font-bold text-accent">Tips & Strategies</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-200">
                Beginner Tips
              </h3>
              <ul className="space-y-2 text-neutral-400">
                <li>• Start with smaller board sizes (5x5 or 6x6)</li>
                <li>• Look for endpoints that are close together</li>
                <li>
                  • Use the &quot;Show Numbers&quot; feature to track paths
                </li>
                <li>• Don&apos;t be afraid to use the refresh button</li>
                <li>• Remember: every cell must be filled</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-200">
                Advanced Strategies
              </h3>
              <ul className="space-y-2 text-neutral-400">
                <li>• Plan your paths before drawing</li>
                <li>• Look for paths that must go through specific areas</li>
                <li>• Use the board edges to your advantage</li>
                <li>• Work from the outside in on larger boards</li>
                <li>• Identify cells that can only be reached by one path</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Game Features */}
        <Card variant="elevated" className="space-y-6">
          <h2 className="text-2xl font-bold text-info">Game Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="text-3xl">🎲</div>
              <h3 className="font-semibold text-neutral-200">
                Procedural Generation
              </h3>
              <p className="text-sm text-neutral-400">
                Every board is uniquely generated using advanced algorithms
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl">📱</div>
              <h3 className="font-semibold text-neutral-200">Cross-Platform</h3>
              <p className="text-sm text-neutral-400">
                Play seamlessly on desktop, tablet, or mobile devices
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl">⚙️</div>
              <h3 className="font-semibold text-neutral-200">Customizable</h3>
              <p className="text-sm text-neutral-400">
                Adjust board size and toggle visual aids to your preference
              </p>
            </div>
          </div>
        </Card>

        {/* CTA */}
        <div className="text-center space-y-4">
          <Link href="/game">
            <Button size="lg" className="min-w-[200px]">
              Start Playing Now
            </Button>
          </Link>
          <div>
            <Link href="/generation">
              <Button
                variant="ghost"
                className="text-neutral-400 hover:text-neutral-200"
              >
                Learn About Board Generation →
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Info;
