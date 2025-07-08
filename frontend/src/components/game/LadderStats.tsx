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
  const formatTime = (milliseconds: number): string => {
    const totalSeconds = milliseconds / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const hundredths = Math.floor((totalSeconds % 1) * 100);

    if (minutes > 0) {
      return `${minutes}m ${seconds.toString().padStart(2, "0")}.${hundredths
        .toString()
        .padStart(2, "0")}s`;
    }
    return `${seconds}.${hundredths.toString().padStart(2, "0")}s`;
  };

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
            {formatTime(currentBoardTime)}
          </div>
        </div>
      </div>

      {/* Total Time - Center Right */}
      <div className="bg-base-200/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-base-300 shadow-lg">
        <div className="text-center">
          <div className="text-xs text-base-content/60 mb-1">Total Time</div>
          <div className="text-lg font-mono font-bold text-accent">
            {formatTime(totalTime)}
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
