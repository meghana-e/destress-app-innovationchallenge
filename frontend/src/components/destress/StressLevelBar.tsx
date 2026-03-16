import { motion } from "framer-motion";

interface StressLevelBarProps {
  level: number; // 0-100
}

const getLabel = (level: number) => {
  if (level < 35) return "Low";
  if (level < 65) return "Medium";
  return "High";
};

const getColor = (level: number) => {
  if (level < 35) return "bg-calm";
  if (level < 65) return "bg-caution";
  return "bg-alert";
};

const StressLevelBar = ({ level }: StressLevelBarProps) => {
  const label = getLabel(level);
  const color = getColor(level);

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Current Stress Level</p>
        <span className={`text-xs font-semibold ${
          level < 35 ? "text-calm" : level < 65 ? "text-caution" : "text-alert"
        }`}>
          {label}
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${level}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <p className="text-center font-display text-2xl font-bold">{level}%</p>
    </div>
  );
};

export default StressLevelBar;
