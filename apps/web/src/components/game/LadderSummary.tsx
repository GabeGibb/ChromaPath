import { formatGameTime } from "@/shared/utils";
import { Card, Button } from "../ui";

export const LadderSummary: React.FC<{
  totalTime: number;
  onRestart: () => void;
  onBack: () => void;
  totalLevels: number;
  aggregatedStats: {
    totalMoves: number;
    totalPathsCompleted: number;
    averageTimePerLevel: number;
    averageMovesPerLevel: number;
    averagePathsPerLevel: number;
    efficiency: string;
    pathsPerSecond: string;
    averageMovesPerPath: number;
  };
}> = ({ totalTime, onRestart, onBack, totalLevels, aggregatedStats }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] h-full bg-base-200 ">
      <Card className="max-w-2xl w-full mx-4 text-center p-8">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-2xl font-bold text-success mb-2">
          Ladder Complete!
        </h2>
        <p className="mb-6 text-base-content/70">
          You finished all {totalLevels} levels!
        </p>

        {/* Main Time Display */}
        <div className="bg-base-200 rounded-lg p-4 border border-base-300 mb-6">
          <div className="text-sm text-base-content/60 mb-1">Total Time</div>
          <div className="text-4xl font-mono font-bold text-primary">
            {formatGameTime(totalTime)}
          </div>
        </div>

        {/* Aggregated Statistics */}
        <div className="grid grid-cols-2 gap-4 py-4 mb-6">
          <div className="bg-base-300 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-secondary">
              {aggregatedStats.totalMoves}
            </div>
            <div className="text-xs text-base-content/70">Total Moves</div>
          </div>

          <div className="bg-base-300 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-accent">
              {aggregatedStats.totalPathsCompleted}
            </div>
            <div className="text-xs text-base-content/70">
              Total Paths Completed
            </div>
          </div>

          <div className="bg-base-300 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-info">
              {formatGameTime(aggregatedStats.averageTimePerLevel)}
            </div>
            <div className="text-xs text-base-content/70">
              Avg Time per Level
            </div>
          </div>

          <div className="bg-base-300 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-warning">
              {aggregatedStats.efficiency}
            </div>
            <div className="text-xs text-base-content/70">
              Overall Efficiency
            </div>
          </div>

          <div className="bg-base-300 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-success">
              {aggregatedStats.pathsPerSecond}
            </div>
            <div className="text-xs text-base-content/70">Paths per Second</div>
          </div>

          <div className="bg-base-300 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-primary">
              {aggregatedStats.averageMovesPerPath}
            </div>
            <div className="text-xs text-base-content/70">
              Avg Moves per Path
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button onClick={onRestart} size="lg" className="flex-1">
            Play Again
          </Button>
          <Button
            onClick={onBack}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            Back to Game Menu
          </Button>
        </div>
      </Card>
    </div>
  );
};
