import { motion } from "framer-motion";
import { Check, X, TrendingDown, Music, Wind, Calendar, Coffee } from "lucide-react";

const interventions = [
  {
    time: "Today 3:15 PM",
    type: "Lo-fi Music",
    icon: Music,
    accepted: true,
    stressBefore: 78,
    stressAfter: 52,
    effective: true,
  },
  {
    time: "Today 11:00 AM",
    type: "Breathing Exercise",
    icon: Wind,
    accepted: false,
    stressBefore: 65,
    stressAfter: 63,
    effective: false,
  },
  {
    time: "Yesterday 4:30 PM",
    type: "Calendar Buffer",
    icon: Calendar,
    accepted: true,
    stressBefore: 82,
    stressAfter: 45,
    effective: true,
  },
  {
    time: "Yesterday 2:00 PM",
    type: "Break Nudge",
    icon: Coffee,
    accepted: false,
    stressBefore: 58,
    stressAfter: 61,
    effective: false,
  },
  {
    time: "Mon 10:30 AM",
    type: "Lo-fi Music",
    icon: Music,
    accepted: true,
    stressBefore: 71,
    stressAfter: 48,
    effective: true,
  },
];

const learnings = [
  { text: "Lo-fi music reduces stress 33% faster than breathing exercises for you.", positive: true },
  { text: "You ignore 3 PM break nudges 80% of the time — removed from schedule.", positive: true },
  { text: "Calendar buffering has 92% acceptance rate and highest stress reduction.", positive: true },
  { text: "Morning interventions are 2x more effective than afternoon ones.", positive: true },
];

const InterventionMemory = () => (
  <div className="space-y-6">
    <div>
      <h2 className="font-display text-2xl font-bold">Intervention Memory</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Learning which regulation strategies actually work for you.
      </p>
    </div>

    {/* Intervention Log */}
    <div className="space-y-3">
      {interventions.map((iv, i) => {
        const Icon = iv.icon;
        const delta = iv.stressAfter - iv.stressBefore;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iv.accepted ? "bg-calm/10" : "bg-secondary"}`}>
              <Icon className={`h-5 w-5 ${iv.accepted ? "text-calm" : "text-muted-foreground"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-semibold">{iv.type}</span>
                {iv.accepted ? (
                  <span className="flex items-center gap-1 text-xs text-calm"><Check className="h-3 w-3" /> Accepted</span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><X className="h-3 w-3" /> Ignored</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{iv.time}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{iv.stressBefore}%</span>
                <span className="text-muted-foreground">→</span>
                <span className={delta < 0 ? "text-calm font-semibold" : "text-muted-foreground"}>
                  {iv.stressAfter}%
                </span>
              </div>
              {delta < 0 && (
                <div className="flex items-center justify-end gap-1 text-xs text-calm">
                  <TrendingDown className="h-3 w-3" />
                  {Math.abs(delta)}% reduction
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>

    {/* Learnings */}
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-3">
      <h3 className="font-display text-sm font-semibold text-primary">System Learnings</h3>
      {learnings.map((l, i) => (
        <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
          {l.text}
        </div>
      ))}
    </div>
  </div>
);

export default InterventionMemory;
