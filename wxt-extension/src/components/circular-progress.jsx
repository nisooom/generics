const CircularProgress = ({
  score = 75,
  maxScore = 100,
  size = 200,
  strokeWidth = 20,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / maxScore) * circumference;
  const offset = circumference - progress;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative">
        <svg width={size} height={size} className="-rotate-90 transform">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />

          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="stroke-primary transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Score text in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-primary text-xl font-bold">{score}</span>
        </div>
      </div>
    </div>
  );
};

export default CircularProgress;
