"use client";
import Link from "next/link";
import { GameModeCard } from "@/components/ui";

const PlayPage = () => {
  const gameModes = [
    {
      title: "Classic Mode",
      description: "Play individual levels at your own pace",
      icon: "🎮",
      href: "/game",
      features: [
        "Choose any level size",
        "Practice specific board types",
        "No time pressure",
        "Perfect for learning",
      ],
      color: "from-blue-500 to-purple-600",
    },
    {
      title: "Ladder Mode",
      description: "Complete multiple levels in sequence",
      icon: "🏆",
      href: "/game/ladder",
      features: [
        "Progressive difficulty",
        "Time-based challenges",
        "Score tracking",
        "Competitive gameplay",
      ],
      color: "from-orange-500 to-red-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            Choose Your Game Mode
          </h1>
          <p className="text-lg text-base-content/80 max-w-2xl mx-auto">
            Select how you want to play ChromaPath. Each mode offers a unique
            experience!
          </p>
        </div>

        {/* Game Mode Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {gameModes.map((mode, index) => (
            <GameModeCard
              key={index}
              title={mode.title}
              description={mode.description}
              icon={mode.icon}
              href={mode.href}
              features={mode.features}
              color={mode.color}
              variant="full"
            />
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center">
          <div className="bg-base-300/50 rounded-xl p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-base-content mb-2">
              New to ChromaPath?
            </h3>
            <p className="text-base-content/70 mb-4">
              We recommend starting with Classic Mode to learn the basics, then
              try Ladder Mode for a challenge!
            </p>
            <Link
              href="/info"
              className="inline-flex items-center gap-2 text-primary hover:text-primary-focus font-medium"
            >
              Learn more about the game
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayPage;
