import React from "react";
import Link from "next/link";
import { Button, GameModeCard } from "../components/ui";

const Home: React.FC = () => {
  const gameModes = [
    {
      title: "Classic Mode",
      description:
        "Individual puzzles with customizable board sizes. Perfect for quick sessions or extended play.",
      icon: "🎮",
      href: "/game",
      color: "from-blue-500 to-purple-600",
    },
    {
      title: "Ladder Mode",
      description:
        "11-level challenge with increasing difficulty. Can you complete the entire ladder?",
      icon: "🏆",
      href: "/game/ladder",
      color: "from-orange-500 to-red-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-300 via-base-200 to-base-300 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center space-y-12">
        {/* Hero Section */}
        <div className="space-y-8">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary">
              ChromaPath
            </h1>
            <p className="text-lg md:text-xl text-base-content/80 max-w-2xl mx-auto leading-relaxed">
              Connect colored paths through a grid. Challenge your mind with
              procedurally generated puzzles that are never the same twice.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            <div className="text-center p-4 bg-base-100/50 rounded-xl backdrop-blur-sm">
              <div className="text-2xl font-bold text-primary">∞</div>
              <div className="text-sm text-base-content/70">Unique Puzzles</div>
            </div>
            <div className="text-center p-4 bg-base-100/50 rounded-xl backdrop-blur-sm">
              <div className="text-2xl font-bold text-secondary">5-12</div>
              <div className="text-sm text-base-content/70">Board Sizes</div>
            </div>
            <div className="text-center p-4 bg-base-100/50 rounded-xl backdrop-blur-sm">
              <div className="text-2xl font-bold text-accent">2</div>
              <div className="text-sm text-base-content/70">Game Modes</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/game">
              <Button size="lg" className="min-w-[180px] text-lg">
                Start Playing
              </Button>
            </Link>
            <Link href="/info">
              <Button
                variant="outline"
                size="lg"
                className="min-w-[180px] text-lg"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </div>

        {/* Game Modes Preview */}
        <div className="grid md:grid-cols-2 gap-8 mt-16">
          {gameModes.map((mode, index) => (
            <GameModeCard
              key={index}
              title={mode.title}
              description={mode.description}
              icon={mode.icon}
              href={mode.href}
              color={mode.color}
              variant="compact"
            />
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
          <div className="text-center space-y-2">
            <div className="text-3xl">🎯</div>
            <div className="font-semibold text-sm">Intuitive Controls</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl">🧩</div>
            <div className="font-semibold text-sm">Procedural Generation</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl">⚡</div>
            <div className="font-semibold text-sm">Quick Sessions</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl">📱</div>
            <div className="font-semibold text-sm">Cross-Platform</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
