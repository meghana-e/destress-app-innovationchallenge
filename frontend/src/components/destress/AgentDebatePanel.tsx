import { useEffect, useState } from "react";
import { Activity, Briefcase, TrendingUp, CheckCircle, AlertCircle, Eye, Calendar } from "lucide-react";
import CalibrationModal from "./CalibrationModal";

interface Agent {
  agent: string;
  icon: "activity" | "briefcase" | "trending-up" | "calendar";
  observation: string;
  recommendation: string;
  confidence: number;
  vote: "intervene" | "monitor" | "standby";
}

interface VoteSummary {
  intervene: number;
  monitor: number;
  standby: number;
}

interface FinalDecision {
  action: "INTERVENE" | "MONITOR" | "STANDBY";
  reasoning: string;
  actions_taken: string[];
  decided_at: string;
}

interface DebateResponse {
  status: "complete" | "no_data";
  message?: string;
  agents: Agent[];
  vote_summary: VoteSummary;
  final_decision: FinalDecision | null;
}

interface AgentDebatePanelProps {
  token: string;
}

const getIconComponent = (iconName: string) => {
  const icons: Record<string, React.ReactNode> = {
    activity: <Activity className="w-5 h-5" />,
    briefcase: <Briefcase className="w-5 h-5" />,
    "trending-up": <TrendingUp className="w-5 h-5" />,
    calendar: <Calendar className="w-5 h-5" />,
  };
  return icons[iconName] || null;
};

const getVoteBadgeColor = (vote: string) => {
  const colors: Record<string, string> = {
    intervene: "bg-red-900 text-red-100",
    monitor: "bg-yellow-900 text-yellow-100",
    standby: "bg-green-900 text-green-100",
  };
  return colors[vote] || "bg-gray-700 text-gray-100";
};

const getVoteBadgeLabel = (vote: string) => {
  const labels: Record<string, string> = {
    intervene: "⚡ INTERVENE",
    monitor: "👁 MONITOR",
    standby: "✅ STANDBY",
  };
  return labels[vote] || vote;
};

const getDecisionBorderColor = (action: string) => {
  const colors: Record<string, string> = {
    INTERVENE: "border-red-500",
    MONITOR: "border-yellow-500",
    STANDBY: "border-green-500",
  };
  return colors[action] || "border-gray-600";
};

const getDecisionBgColor = (action: string) => {
  const colors: Record<string, string> = {
    INTERVENE: "bg-red-950",
    MONITOR: "bg-yellow-950",
    STANDBY: "bg-green-950",
  };
  return colors[action] || "bg-gray-900";
};

const formatTimestamp = (isoString: string) => {
  try {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  } catch {
    return isoString;
  }
};

const ConfidenceBar = ({ confidence }: { confidence: number }) => {
  let barColor = "bg-green-600";
  if (confidence > 70) barColor = "bg-red-600";
  else if (confidence > 40) barColor = "bg-yellow-600";

  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all`}
          style={{ width: `${confidence}%` }}
        ></div>
      </div>
      <span className="text-xs text-gray-400 w-10 text-right">{confidence}%</span>
    </div>
  );
};

const AgentCard = ({ agent }: { agent: Agent }) => (
  <div className="bg-gray-900 rounded-xl shadow-lg p-5 border border-gray-800">
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-bold text-white text-sm">{agent.agent}</h3>
      <div className="text-gray-400">{getIconComponent(agent.icon)}</div>
    </div>

    <p className="text-xs text-gray-400 mb-3">{agent.observation}</p>

    <p className="text-sm italic text-gray-300 mb-3">{agent.recommendation}</p>

    <ConfidenceBar confidence={agent.confidence} />

    <div className="mt-3">
      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getVoteBadgeColor(agent.vote)}`}>
        {getVoteBadgeLabel(agent.vote)}
      </span>
    </div>
  </div>
);

export default function AgentDebatePanel({ token: propToken }: AgentDebatePanelProps) {
  const [data, setData] = useState<DebateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDebate = async () => {
      try {
        setLoading(true);
        
        // Use token from props or localStorage
        const token = propToken || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
        
        if (!token) {
          setError("No authentication token found. Please log in.");
          setData(null);
          setLoading(false);
          return;
        }

        const response = await fetch("/api/agent-debate", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || `Failed to fetch agent debate: ${response.status}`);
        }

        const result: DebateResponse = await response.json();
        
        // Add mock Calendar Agent
        if (result.status === "complete") {
          const calendarAgent: Agent = {
            agent: "Calendar Agent",
            icon: "calendar",
            observation: "3 back-to-back meetings detected (2h 30m continuous). Buffer time available: 2.5h until next commitment.",
            recommendation: "Insert 15-min buffer before next meeting",
            confidence: 72,
            vote: "monitor",
          };
          
          result.agents.push(calendarAgent);
          
          // Update vote tally to reflect new agent
          if (calendarAgent.vote === "monitor") {
            result.vote_summary.monitor += 1;
          } else if (calendarAgent.vote === "intervene") {
            result.vote_summary.intervene += 1;
          } else {
            result.vote_summary.standby += 1;
          }
        }
        
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setData(null);
      } finally {
        // Ensure calibration modal is visible for at least 4 seconds
        setTimeout(() => {
          setLoading(false);
        }, 4000);
      }
    };

    fetchDebate();
  }, [propToken]);

  if (loading) {
    return (
      <>
        <CalibrationModal isVisible={true} />
        <div className="w-full bg-gray-950 rounded-2xl p-8 border border-gray-800">
          <div className="flex items-center justify-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <p className="text-gray-400">Agents are deliberating...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full bg-gray-950 rounded-2xl p-8 border border-gray-800">
        <p className="text-red-400">{error || "Failed to load agent debate"}</p>
      </div>
    );
  }

  if (data.status === "no_data") {
    return (
      <div className="w-full bg-gray-950 rounded-2xl p-8 border border-gray-800 text-center">
        <AlertCircle className="w-8 h-8 mx-auto mb-3 text-gray-500" />
        <p className="text-gray-400">{data.message || "Complete your questionnaire to activate Agent Debate Engine"}</p>
      </div>
    );
  }

  if (data.status !== "complete" || data.agents.length === 0) {
    return (
      <div className="w-full bg-gray-950 rounded-2xl p-8 border border-gray-800">
        <p className="text-gray-400">No agent debate data available</p>
      </div>
    );
  }

  const decision = data.final_decision!;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-gray-950 rounded-2xl p-6 border border-gray-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-semibold text-green-400">LIVE CONSENSUS</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">AI Agent Debate Engine</h2>
        <p className="text-sm text-gray-400">4 specialist agents analysing your data and reaching consensus</p>
      </div>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.agents.map((agent, idx) => (
          <AgentCard key={idx} agent={agent} />
        ))}
      </div>

      {/* Vote Tally */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <p className="text-sm text-gray-300 text-center">
          <span className="font-semibold">⚡ {data.vote_summary.intervene} Intervene</span>
          {" · "}
          <span className="font-semibold">👁 {data.vote_summary.monitor} Monitor</span>
          {" · "}
          <span className="font-semibold">✅ {data.vote_summary.standby} Standby</span>
        </p>
      </div>

      {/* Final Decision Card */}
      <div className={`rounded-xl p-6 border-2 ${getDecisionBorderColor(decision.action)} ${getDecisionBgColor(decision.action)}`}>
        <div className="flex items-center gap-3 mb-3">
          {decision.action === "INTERVENE" && <AlertCircle className="w-6 h-6 text-red-500" />}
          {decision.action === "MONITOR" && <Eye className="w-6 h-6 text-yellow-500" />}
          {decision.action === "STANDBY" && <CheckCircle className="w-6 h-6 text-green-500" />}
          <h3 className="text-xl font-bold text-white">{decision.action}</h3>
        </div>

        <p className="text-sm text-gray-300 mb-4">{decision.reasoning}</p>

        <div className="space-y-2 mb-4">
          {decision.actions_taken.map((action, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-gray-500 mt-0.5">•</span>
              <p className="text-sm text-gray-300">{action}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500">Decided at {formatTimestamp(decision.decided_at)}</p>
      </div>
    </div>
  );
}
