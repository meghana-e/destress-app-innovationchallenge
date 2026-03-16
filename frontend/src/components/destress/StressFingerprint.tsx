import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Minus, AlertTriangle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const hrvData = Array.from({ length: 28 }, (_, i) => ({
  day: `Day ${i + 1}`,
  hrv: 62 - i * 0.5 + Math.sin(i * 0.8) * 8,
  baseline: 62,
}));

const metrics = [
  { label: "Avg HRV", value: "48 ms", trend: -15, status: "alert" as const },
  { label: "Heart Rate", value: "82 bpm", trend: 8, status: "caution" as const },
  { label: "Sleep Score", value: "72", trend: -5, status: "caution" as const },
  { label: "Avg Work Hours", value: "9.2h", trend: 12, status: "alert" as const },
  { label: "Meeting Density", value: "6.4/day", trend: 18, status: "alert" as const },
];

const statusColors = { calm: "text-calm", caution: "text-caution", alert: "text-alert" };

const BurnoutTrajectoryTracker = () => (
  <div className="space-y-6">
    <div>
      <h2 className="font-display text-2xl font-bold">Burnout Trajectory Tracker</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Long-term burnout risk trends based on your biometric and work data.
      </p>
    </div>

    {/* Burnout Alert */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-start gap-3 rounded-xl border border-caution/30 bg-caution/5 p-4"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 text-caution" />
      <div>
        <p className="font-display text-sm font-semibold text-caution">Burnout Trajectory Detected</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Your average HRV has dropped 12% compared to last month. Sleep below baseline for 8 consecutive days. Working hours increased 15%.
        </p>
      </div>
    </motion.div>

    {/* Metric Cards */}
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {metrics.map((m, i) => {
        const TrendIcon = m.trend < 0 ? TrendingDown : m.trend > 0 ? TrendingUp : Minus;
        return (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <p className="text-xs text-muted-foreground">{m.label}</p>
            <p className="mt-1 font-display text-xl font-bold">{m.value}</p>
            <div className={`mt-2 flex items-center gap-1 text-xs ${statusColors[m.status]}`}>
              <TrendIcon className="h-3 w-3" />
              <span>{m.trend !== 0 ? `${Math.abs(m.trend)}% from baseline` : "On baseline"}</span>
            </div>
          </motion.div>
        );
      })}
    </div>

    {/* HRV Trend Chart */}
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-4 font-display text-sm font-semibold">HRV Trend (28 Days)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={hrvData}>
            <defs>
              <linearGradient id="hrvGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(0,72%,55%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(0,72%,55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,20%,18%)" />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(215,15%,55%)" }} tickLine={false} axisLine={false} interval={6} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(215,15%,55%)" }} tickLine={false} axisLine={false} domain={[30, 75]} />
            <Tooltip
              contentStyle={{ background: "hsl(222,25%,11%)", border: "1px solid hsl(222,20%,18%)", borderRadius: 8, fontSize: 12 }}
            />
            <Area type="monotone" dataKey="baseline" stroke="hsl(174,62%,47%)" strokeDasharray="4 4" fill="none" strokeWidth={1} />
            <Area type="monotone" dataKey="hrv" stroke="hsl(0,72%,55%)" fill="url(#hrvGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex gap-6 text-xs text-muted-foreground">
        <span className="flex items-center gap-2"><span className="h-0.5 w-4 bg-calm inline-block" /> Baseline</span>
        <span className="flex items-center gap-2"><span className="h-0.5 w-4 bg-alert inline-block" /> Actual HRV</span>
      </div>
    </div>

    {/* Pattern Insights */}
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <h3 className="font-display text-sm font-semibold">Burnout Risk Insights</h3>
      {[
        "Your stress recovery is slowing — took 45 min avg last week vs 28 min baseline.",
        "Mondays show repeated spike patterns between 10 AM – 12 PM.",
        "Your average HRV has dropped 12% compared to last month.",
      ].map((insight, i) => (
        <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-caution shrink-0" />
          {insight}
        </div>
      ))}
    </div>
  </div>
);

export default BurnoutTrajectoryTracker;
