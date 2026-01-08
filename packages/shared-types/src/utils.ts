export const formatGameTime = (milliseconds: number): string => {
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
