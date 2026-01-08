import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";

interface BoardGenerationErrorProps {
  error: Error;
  onRetry: () => void;
  isRetrying?: boolean;
}

const BoardGenerationError: React.FC<BoardGenerationErrorProps> = ({
  error,
  onRetry,
  isRetrying = false,
}) => {
  return (
    <div className="absolute inset-0 bg-base-300/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
      <div className="bg-base-200 border border-error/20 rounded-lg p-6 max-w-sm mx-4 shadow-xl">
        <div className="text-center space-y-4">
          {/* Error Icon */}
          <div className="flex justify-center">
            <div className="bg-error/10 p-3 rounded-full">
              <AlertTriangle className="w-8 h-8 text-error" />
            </div>
          </div>

          {/* Error Title */}
          <div>
            <h3 className="text-lg font-semibold text-error mb-2">
              Board Generation Failed
            </h3>
            <p className="text-sm text-base-content/70 leading-relaxed">
              {error.message ||
                "An unexpected error occurred while generating the board."}
            </p>
          </div>

          {/* Retry Button */}
          <div className="pt-2">
            <Button
              onClick={onRetry}
              loading={isRetrying}
              disabled={isRetrying}
              variant="primary"
              size="sm"
              className="w-full"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </>
              )}
            </Button>
          </div>

          {/* Additional Info */}
          <div className="text-xs text-base-content/50 pt-2 border-t border-base-300">
            <p>This might be due to network issues or server problems.</p>
            <p>Please check your connection and try again.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardGenerationError;
