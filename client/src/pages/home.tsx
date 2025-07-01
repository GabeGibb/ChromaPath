import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card } from "../components/ui";

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-300 via-base-200 to-base-300 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Hero Section */}
        <div className="space-y-6">
          <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary animate-pulse">
            ChromaPath
          </h1>
          <p className="text-xl md:text-2xl text-base-content/80 max-w-2xl mx-auto leading-relaxed">
            A minimalist puzzle game where you connect colored paths through a
            grid. Challenge your mind with procedurally generated boards.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <Card variant="elevated" className="text-center">
            <div className="text-4xl mb-4">🎮</div>
            <h3 className="text-xl font-bold text-primary mb-2">
              Intuitive Gameplay
            </h3>
            <p className="text-base-content/70">
              Simple touch and drag controls make it easy to play on any device
            </p>
          </Card>

          <Card variant="elevated" className="text-center">
            <div className="text-4xl mb-4">🧩</div>
            <h3 className="text-xl font-bold text-secondary mb-2">
              Endless Puzzles
            </h3>
            <p className="text-base-content/70">
              Procedurally generated boards ensure no two games are ever the
              same
            </p>
          </Card>

          <Card variant="elevated" className="text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-accent mb-2">
              Quick Sessions
            </h3>
            <p className="text-base-content/70">
              Perfect for short breaks or extended puzzle-solving sessions
            </p>
          </Card>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
          <Button
            size="lg"
            onClick={() => navigate("/game")}
            className="min-w-[200px]"
          >
            Start Playing
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/info")}
            className="min-w-[200px]"
          >
            Learn More
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">∞</div>
            <div className="text-sm text-base-content/70">Unique Boards</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-secondary">5-15</div>
            <div className="text-sm text-base-content/70">Board Sizes</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-accent">🎯</div>
            <div className="text-sm text-base-content/70">Precision</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-info">📱</div>
            <div className="text-sm text-base-content/70">Cross-Platform</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
