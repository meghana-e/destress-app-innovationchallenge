import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, Heart, Calendar, Brain, Volume2, CalendarOff, Music,
  Timer, Wind, ArrowRightLeft, Headphones, Shield, Activity,
  Clock, Pause, BarChart3,
} from "lucide-react";

/* ─── Types ─── */
type Mode = "focus" | "micro" | "deep";

interface Agent {
  name: string;
  icon: React.ElementType;
  colorToken: string;   // tailwind color token
  reasoning: string;
  vote: Mode;
  voteLabel: string;
  detail: string;
}

interface ActionItem {
  icon: React.ElementType;
  label: string;
}

interface TimelineEntry {
  time: string;
  mode: Mode;
  label: string;
}

/* ─── Data ─── */
const modeConfig: Record<Mode, { label: string; emoji: string; color: string; bg: string; glow: string }> = {
  focus:  { label: "Focus Mode",     emoji: "🔵", color: "text-focus",  bg: "bg-focus/10",  glow: "shadow-[0_0_24px_hsl(var(--focus)/0.25)]" },
  micro:  { label: "Micro Recovery", emoji: "🟡", color: "text-caution", bg: "bg-caution/10", glow: "shadow-[0_0_24px_hsl(var(--caution)/0.25)]" },
  deep:   { label: "Deep Recovery",  emoji: "🔴", color: "text-alert",  bg: "bg-alert/10",  glow: "shadow-[0_0_24px_hsl(var(--alert)/0.25)]" },
};

const agents: Agent[] = [
  {
    name: "Visual Agent",
    icon: Eye,
    colorToken: "focus",
    reasoning: "Facial tension and eye fatigue detected. Blink rate 40% below baseline.",
    vote: "focus",
    voteLabel: "Focus Mode",
    detail: "Concentration indicators high — not distress.",
  },
  {
    name: "Biometric Agent",
    icon: Heart,
    colorToken: "alert",
    reasoning: "Heart rate variability below baseline. HRV dropped 22% in last hour.",
    vote: "micro",
    voteLabel: "Micro Recovery",
    detail: "Sympathetic dominance rising — recovery window recommended.",
  },
  {
    name: "Calendar Agent",
    icon: Calendar,
    colorToken: "caution",
    reasoning: "Back-to-back meetings detected for the next 3 hours. Deadline in 2.5 hrs.",
    vote: "focus",
    voteLabel: "Focus Mode",
    detail: "Deadline proximity overrides recovery — protect focus window.",
  },
];

const finalMode: Mode = "focus";

const actionsByMode: Record<Mode, ActionItem[]> = {
  focus: [
    { icon: Music, label: "Concentration playlist started" },
    { icon: Volume2, label: "Slack set to Do Not Disturb" },
    { icon: Timer, label: "Deep work timer activated" },
  ],
  micro: [
    { icon: Pause, label: "10 minute break scheduled" },
    { icon: Wind, label: "Breathing exercise recommended" },
    { icon: CalendarOff, label: "Optional meeting moved" },
  ],
  deep: [
    { icon: CalendarOff, label: "Calendar buffer inserted" },
    { icon: BarChart3, label: "Meeting load reduced" },
    { icon: Activity, label: "Recovery activity suggested" },
  ],
};

const decisionExplanation =
  "2 of 3 agents recommend Focus Mode. Deadline proximity prioritized over recovery signals. Micro recovery scheduled after deadline window.";

const timeline: TimelineEntry[] = [
  { time: "10:30 AM", mode: "focus", label: "Focus Mode activated" },
  { time: "1:15 PM",  mode: "micro", label: "Micro Recovery recommended" },
  { time: "4:20 PM",  mode: "deep",  label: "Deep Recovery triggered" },
];

/* ─── Phases ─── */
const PHASE_DELAY = 800;   // ms between agents
const DEBATE_START = 3 * PHASE_DELAY;
const DECISION_REVEAL = DEBATE_START + 2000;
const ACTIONS_REVEAL = DECISION_REVEAL + 600;

/* ─── Component ─── */
const AgentDebatePanel = () => {
  const [visibleAgents, setVisibleAgents] = useState(0);
  const [debating, setDebating] = useState(false);
  const [decided, setDecided] = useState(false);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    // Sequential agent reveal
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= agents.length; i++) {
      timers.push(setTimeout(() => setVisibleAgents(i), i * PHASE_DELAY));
    }
    // Debate phase
    timers.push(setTimeout(() => setDebating(true), DEBATE_START));
    // Decision reveal
    timers.push(setTimeout(() => { setDebating(false); setDecided(true); }, DECISION_REVEAL));
    // Actions reveal
    timers.push(setTimeout(() => setShowActions(true), ACTIONS_REVEAL));
    return () => timers.forEach(clearTimeout);
  }, []);

  const mode = modeConfig[finalMode];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="font-display text-2xl font-bold">Agent Debate Engine</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Three agents analyze your state, debate, and reach a unified recommendation.
        </p>
      </div>

      {/* Agent Cards + Debate Lines */}
      <div className="relative">
        <div className="grid gap-4 md:grid-cols-3">
          {agents.map((agent, i) => {
            const Icon = agent.icon;
            const vm = modeConfig[agent.vote];
            const visible = i < visibleAgents;
            return (
              <AnimatePresence key={agent.name}>
                {visible && (
                  <motion.div
                    initial={{ opacity: 0, y: 24, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 22 }}
                    className={`relative rounded-xl border border-border bg-card p-5 space-y-4 transition-shadow duration-700 ${
                      debating ? `shadow-[0_0_16px_hsl(var(--${agent.colorToken})/0.2)]` : ""
                    }`}
                  >
                    {/* Status dot */}
                    <span
                      className={`absolute right-4 top-4 h-2 w-2 rounded-full bg-${agent.colorToken} ${
                        debating ? "animate-pulse" : ""
                      }`}
                    />

                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-${agent.colorToken}/10`}>
                        <Icon className={`h-5 w-5 text-${agent.colorToken}`} />
                      </div>
                      <h3 className="font-display font-semibold">{agent.name}</h3>
                    </div>

                    <p className="text-sm text-muted-foreground">{agent.reasoning}</p>

                    <div className={`rounded-lg ${vm.bg} px-3 py-2`}>
                      <p className="text-xs font-medium text-muted-foreground">Recommendation</p>
                      <p className="font-display text-sm font-semibold">
                        {vm.emoji} {vm.label}
                      </p>
                    </div>

                    <p className="text-xs text-muted-foreground italic">{agent.detail}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            );
          })}
        </div>

        {/* Debate pulse connector */}
        <AnimatePresence>
          {debating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none flex items-center justify-center"
            >
              <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-2 backdrop-blur-sm">
                <ArrowRightLeft className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-xs font-medium text-primary">Agents debating…</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lead Agent Decision */}
      <AnimatePresence>
        {decided && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className={`rounded-xl border ${mode.bg} border-${finalMode === "focus" ? "focus" : finalMode === "micro" ? "caution" : "alert"}/30 p-6 space-y-5 ${mode.glow} transition-shadow duration-700`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${mode.bg}`}>
                <Brain className={`h-6 w-6 ${mode.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lead Agent Decision</p>
                <h3 className={`font-display text-xl font-bold ${mode.color}`}>
                  {mode.emoji} {mode.label}
                </h3>
              </div>
            </div>

            {/* Explanation */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {decisionExplanation}
            </p>

            {/* Autonomous Actions */}
            <AnimatePresence>
              {showActions && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-2"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Autonomous Actions Taken
                  </p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {actionsByMode[finalMode].map((action, i) => {
                      const AIcon = action.icon;
                      return (
                        <motion.div
                          key={action.label}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 px-3 py-3 hover:bg-secondary/80 transition-colors cursor-default"
                        >
                          <AIcon className={`h-4 w-4 ${mode.color} shrink-0`} />
                          <span className="text-sm">{action.label}</span>
                          <span className="ml-auto text-xs text-calm shrink-0">✓</span>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decision History Timeline */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <h3 className="font-display text-lg font-semibold">Decision History</h3>
            <div className="relative space-y-0">
              {/* Vertical line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

              {timeline.map((entry, i) => {
                const em = modeConfig[entry.mode];
                return (
                  <motion.div
                    key={entry.time}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.12 }}
                    className="relative flex items-center gap-4 py-2 pl-6"
                  >
                    <span className={`absolute left-0 h-3.5 w-3.5 rounded-full border-2 border-background bg-${entry.mode === "focus" ? "focus" : entry.mode === "micro" ? "caution" : "alert"}`} />
                    <span className="text-xs font-mono text-muted-foreground w-16 shrink-0">
                      {entry.time}
                    </span>
                    <span className="text-sm">{entry.label}</span>
                    <span className={`ml-auto text-xs font-medium ${em.color}`}>
                      {em.emoji} {em.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AgentDebatePanel;
