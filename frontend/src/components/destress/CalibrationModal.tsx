import { useEffect, useState } from "react";
import { Activity, Briefcase, TrendingUp, Zap } from "lucide-react";

interface CalibrationAgent {
  name: string;
  icon: React.ElementType;
  color: string;
}

const agents: CalibrationAgent[] = [
  {
    name: "Behavioural Signal Agent",
    icon: Activity,
    color: "from-red-500 to-red-600",
  },
  {
    name: "Context & Workload Agent",
    icon: Briefcase,
    color: "from-yellow-500 to-yellow-600",
  },
  {
    name: "Trend & Trajectory Agent",
    icon: TrendingUp,
    color: "from-green-500 to-green-600",
  },
];

interface CalibrationModalProps {
  isVisible: boolean;
}

export default function CalibrationModal({ isVisible }: CalibrationModalProps) {
  const [visibleAgents, setVisibleAgents] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [synthesizing, setSynthesizing] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setVisibleAgents(0);
      setProgress(0);
      setSynthesizing(false);
      return;
    }

    // Agent reveal timing
    const reveal1 = setTimeout(() => setVisibleAgents(1), 200);
    const reveal2 = setTimeout(() => setVisibleAgents(2), 700);
    const reveal3 = setTimeout(() => setVisibleAgents(3), 1200);

    // Synchronized progress animation for all agents
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 6;
      });
    }, 200);

    // Start synthesizing after all agents visible
    const synthesizeTimer = setTimeout(() => {
      setSynthesizing(true);
      // Complete all agents
      setProgress(100);
    }, 2500);

    return () => {
      clearTimeout(reveal1);
      clearTimeout(reveal2);
      clearTimeout(reveal3);
      clearTimeout(synthesizeTimer);
      clearInterval(progressInterval);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 border-2 border-purple-500/30 rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Zap className="w-6 h-6 text-purple-400 animate-pulse" />
            <h2 className="text-2xl font-bold text-white">Agent Calibration</h2>
            <Zap className="w-6 h-6 text-purple-400 animate-pulse" />
          </div>
          <p className="text-center text-sm text-gray-400">
            Initializing specialist agents...
          </p>
        </div>

        {/* Agents List */}
        <div className="space-y-4">
          {agents.map((agent, idx) => {
            const Icon = agent.icon;
            const isVisible = idx < visibleAgents;
            const displayProgress = isVisible ? progress : 0;

            return (
              <div
                key={idx}
                className={`transition-all duration-500 ${
                  isVisible
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-4"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${agent.color} flex items-center justify-center ${
                      isVisible ? "animate-pulse" : ""
                    }`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>

                  {/* Agent Info */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-white">
                        {agent.name}
                      </p>
                      <span className="text-xs text-gray-400">
                        {Math.round(displayProgress)}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${agent.color} transition-all duration-300 rounded-full`}
                        style={{ width: `${displayProgress}%` }}
                      ></div>
                    </div>

                    {/* Status Text */}
                    <p className="text-xs text-gray-500 mt-1">
                      {displayProgress < 50
                        ? "Initializing..."
                        : displayProgress < 90
                        ? "Processing..."
                        : "Ready"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Synthesis Status */}
        {synthesizing && (
          <div className="mt-8 pt-6 border-t border-gray-700">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="flex gap-1">
                <div
                  className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"
                  style={{ animationDelay: "100ms" }}
                ></div>
                <div
                  className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"
                  style={{ animationDelay: "200ms" }}
                ></div>
              </div>
            </div>
            <p className="text-center text-sm font-semibold text-cyan-400">
              Synthesizing consensus...
            </p>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            {visibleAgents < 3
              ? "Assembling expert panel..."
              : synthesizing
              ? "Analyzing stress patterns..."
              : "Agents ready"}
          </p>
        </div>
      </div>
    </div>
  );
}
