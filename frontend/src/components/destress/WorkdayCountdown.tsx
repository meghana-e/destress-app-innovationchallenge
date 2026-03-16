import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";

const WorkdayCountdown = () => {
  const [remaining, setRemaining] = useState({ hours: 3, minutes: 20 });

  useEffect(() => {
    // Simulate countdown from assumed 6PM end
    const endHour = 18;
    const update = () => {
      const now = new Date();
      const end = new Date();
      end.setHours(endHour, 0, 0, 0);
      const diff = Math.max(0, end.getTime() - now.getTime());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining({ hours: h, minutes: m });
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  const totalMinutes = remaining.hours * 60 + remaining.minutes;
  const totalWorkMinutes = 8 * 60;
  const progress = Math.max(0, Math.min(100, ((totalWorkMinutes - totalMinutes) / totalWorkMinutes) * 100));
  const circumference = 2 * Math.PI * 42;
  const strokeDash = (progress / 100) * circumference;

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col items-center gap-3">
      <p className="text-xs font-medium text-muted-foreground">Workday Remaining</p>
      <div className="relative h-28 w-28">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--secondary))" strokeWidth="6" />
          <motion.circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - strokeDash }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Clock className="h-3.5 w-3.5 text-muted-foreground mb-0.5" />
          <span className="font-display text-lg font-bold">
            {remaining.hours}h {remaining.minutes}m
          </span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">remaining today</p>
    </div>
  );
};

export default WorkdayCountdown;
