import { motion } from "framer-motion";
import { Lightbulb, TrendingUp, Clock, Users } from "lucide-react";

const insights = [
  {
    icon: Clock,
    text: "Based on last week's analysis, you were extremely stressed between 3 PM – 5 PM.",
    action: "Consider scheduling lighter tasks during this window.",
    color: "text-caution",
    bg: "bg-caution/10",
  },
  {
    icon: Users,
    text: "Your stress levels spike during back-to-back meetings.",
    action: "Add 10-minute buffers between meetings.",
    color: "text-alert",
    bg: "bg-alert/10",
  },
  {
    icon: TrendingUp,
    text: "Late evening work increases your stress by 30%.",
    action: "Set a hard stop at 7 PM to improve recovery.",
    color: "text-caution",
    bg: "bg-caution/10",
  },
  {
    icon: Lightbulb,
    text: "Monday mornings consistently show elevated stress patterns.",
    action: "Try a calming routine before your first meeting.",
    color: "text-focus",
    bg: "bg-focus/10",
  },
];

const StressPatternInsights = () => (
  <div className="space-y-6">
    <div>
      <h2 className="font-display text-2xl font-bold">Stress Pattern Insights</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        AI-detected patterns from your recent activity and stress data.
      </p>
    </div>

    <div className="grid gap-4 md:grid-cols-2">
      {insights.map((insight, i) => {
        const Icon = insight.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl border border-border bg-card p-5 space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${insight.bg}`}>
                <Icon className={`h-5 w-5 ${insight.color}`} />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Pattern Detected</span>
            </div>
            <p className="text-sm font-medium text-foreground">{insight.text}</p>
            <p className="text-xs text-muted-foreground italic">💡 {insight.action}</p>
          </motion.div>
        );
      })}
    </div>
  </div>
);

export default StressPatternInsights;
