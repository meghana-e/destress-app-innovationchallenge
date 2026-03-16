import { useState } from "react";
import { motion } from "framer-motion";

type TimeRange = "today" | "yesterday" | "3days" | "week";

const hours = ["8AM", "9AM", "10AM", "11AM", "12PM", "1PM", "2PM", "3PM", "4PM", "5PM", "6PM", "7PM"];

const generateRow = (seed: number) =>
  hours.map((_, i) => Math.round(15 + Math.sin(seed + i * 0.7) * 30 + Math.cos(seed * 2 + i) * 20 + Math.random() * 10));

const dataByRange: Record<TimeRange, { label: string; rows: { label: string; data: number[] }[] }> = {
  today: {
    label: "Today",
    rows: [{ label: "Today", data: generateRow(1) }],
  },
  yesterday: {
    label: "Yesterday",
    rows: [{ label: "Yesterday", data: generateRow(2) }],
  },
  "3days": {
    label: "Last 3 Days",
    rows: [
      { label: "Day 1", data: generateRow(3) },
      { label: "Day 2", data: generateRow(4) },
      { label: "Day 3", data: generateRow(5) },
    ],
  },
  week: {
    label: "Last Week",
    rows: [
      { label: "Mon", data: [20, 35, 55, 70, 40, 30, 25, 80, 65, 45, 50, 60] },
      { label: "Tue", data: [15, 25, 40, 50, 35, 28, 20, 55, 45, 35, 30, 25] },
      { label: "Wed", data: [30, 45, 65, 85, 55, 40, 35, 90, 75, 60, 55, 70] },
      { label: "Thu", data: [10, 20, 30, 45, 30, 22, 18, 40, 35, 25, 20, 15] },
      { label: "Fri", data: [25, 40, 60, 75, 50, 38, 30, 70, 55, 40, 65, 80] },
    ],
  },
};

const rangeOptions: { value: TimeRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "3days", label: "Last 3 Days" },
  { value: "week", label: "Last Week" },
];

const getColor = (val: number) => {
  if (val < 30) return "bg-calm/20";
  if (val < 50) return "bg-calm/40";
  if (val < 65) return "bg-caution/40";
  if (val < 80) return "bg-caution/70";
  return "bg-alert/70";
};

const CognitiveHeatmap = () => {
  const [range, setRange] = useState<TimeRange>("today");
  const data = dataByRange[range];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Cognitive Load Heatmap</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Stress intensity across hours of the day.
          </p>
        </div>

        {/* Dropdown */}
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as TimeRange)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
        >
          {rangeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Heatmap Grid */}
      <div className="rounded-xl border border-border bg-card p-5 overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Hour labels */}
          <div className="flex ml-12 mb-2">
            {hours.map((h) => (
              <div key={h} className="flex-1 text-center text-xs text-muted-foreground">{h}</div>
            ))}
          </div>
          {/* Rows */}
          {data.rows.map((row, di) => (
            <div key={row.label + range} className="flex items-center gap-2 mb-1">
              <span className="w-10 text-right text-xs text-muted-foreground">{row.label}</span>
              <div className="flex flex-1 gap-1">
                {row.data.map((val, hi) => (
                  <motion.div
                    key={hi}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (di * 12 + hi) * 0.008 }}
                    className={`flex-1 h-10 rounded-md ${getColor(val)} flex items-center justify-center`}
                    title={`${row.label} ${hours[hi]}: ${val}%`}
                  >
                    <span className="text-[10px] font-medium text-foreground/60">{val}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 ml-12 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-calm/20" /> Low</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-calm/40" /> Moderate</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-caution/40" /> Elevated</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-caution/70" /> High</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-alert/70" /> Critical</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CognitiveHeatmap;
