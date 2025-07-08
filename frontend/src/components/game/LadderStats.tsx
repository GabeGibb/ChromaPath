import { formatGameTime } from "@/shared/utils";

export const LadderStats: React.FC<{
  currentBoardTime: number;
  totalTime: number;
  currentPaths: number;
  totalPaths: number;
  currentLevel: number;
  totalLevels: number;
}> = ({
  currentBoardTime,
  totalTime,
  currentPaths,
  totalPaths,
  currentLevel,
  totalLevels,
}) => {
  return (
    <>
      <div className="bg-base-200/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-base-300 shadow-lg">
        <div className="text-center">
          <div className="text-xs text-base-content/60 mb-1">Paths</div>
          <div className="text-lg font-bold text-secondary">
            {currentPaths}/{totalPaths}
          </div>
        </div>
      </div>

      {/* Current Board Time - Center Left */}
      <div className="bg-base-200/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-base-300 shadow-lg">
        <div className="text-center">
          <div className="text-xs text-base-content/60 mb-1">Board Time</div>
          <div className="text-lg font-mono font-bold text-primary">
            {formatGameTime(currentBoardTime)}
          </div>
        </div>
      </div>

      {/* Total Time - Center Right */}
      <div className="bg-base-200/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-base-300 shadow-lg">
        <div className="text-center">
          <div className="text-xs text-base-content/60 mb-1">Total Time</div>
          <div className="text-lg font-mono font-bold text-accent">
            {formatGameTime(totalTime)}
          </div>
        </div>
      </div>

      <div className="bg-base-200/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-base-300 shadow-lg">
        <div className="text-center">
          <div className="text-xs text-base-content/60 mb-1">Level</div>
          <div className="text-lg font-bold text-secondary">
            {currentLevel}/{totalLevels}
          </div>
        </div>
      </div>
    </>
  );
};
