import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, Mic, BarChart3, Pause, Play, Trash2, Shield, Lock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

const signals = [
  { label: "Visual Monitoring", icon: Eye, description: "Facial tension & blink rate analysis", active: true },
  { label: "Audio Monitoring", icon: Mic, description: "Speech pace & tone analysis", active: false },
  { label: "Biometric Data", icon: BarChart3, description: "HRV & heart rate from wearable", active: true },
];

const PrivacyDashboard = () => {
  const [monitoring, setMonitoring] = useState(true);
  const [signalStates, setSignalStates] = useState(signals.map((s) => s.active));

  const toggleSignal = (i: number) => {
    setSignalStates((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Privacy & Consent</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Full transparency over what's monitored, stored, and processed.
        </p>
      </div>

      {/* Trust Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-start gap-3 rounded-xl border border-calm/30 bg-calm/5 p-4"
      >
        <Shield className="mt-0.5 h-5 w-5 text-calm" />
        <div>
          <p className="font-display text-sm font-semibold text-calm">Responsible AI-First Architecture</p>
          <p className="mt-1 text-xs text-muted-foreground">
            No raw video or audio is stored. All processing is local. Only derived metrics are retained. PDPA compliant.
          </p>
        </div>
      </motion.div>

      {/* Global Toggle */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4">
        <div className="flex items-center gap-3">
          {monitoring ? (
            <Pause className="h-5 w-5 text-calm" />
          ) : (
            <Play className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <p className="font-display text-sm font-semibold">
              {monitoring ? "Monitoring Active" : "Monitoring Paused"}
            </p>
            <p className="text-xs text-muted-foreground">Toggle to pause all monitoring</p>
          </div>
        </div>
        <Switch checked={monitoring} onCheckedChange={setMonitoring} />
      </div>

      {/* Signal Controls */}
      <div className="space-y-3">
        <h3 className="font-display text-sm font-semibold">Active Signals</h3>
        {signals.map((signal, i) => {
          const Icon = signal.icon;
          return (
            <div
              key={signal.label}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${signalStates[i] ? "bg-calm/10" : "bg-secondary"}`}>
                  <Icon className={`h-5 w-5 ${signalStates[i] ? "text-calm" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="text-sm font-medium">{signal.label}</p>
                  <p className="text-xs text-muted-foreground">{signal.description}</p>
                </div>
              </div>
              <Switch checked={signalStates[i]} onCheckedChange={() => toggleSignal(i)} />
            </div>
          );
        })}
      </div>

      {/* Data Storage Info */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h3 className="font-display text-sm font-semibold">Stored Data</h3>
        {[
          { label: "Derived stress metrics", stored: true },
          { label: "Intervention history", stored: true },
          { label: "Baseline fingerprint", stored: true },
          { label: "Raw video/audio", stored: false },
          { label: "Screenshots", stored: false },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            {item.stored ? (
              <span className="flex items-center gap-1 text-xs text-calm">
                <Lock className="h-3 w-3" /> Encrypted
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Not collected</span>
            )}
          </div>
        ))}
      </div>

      {/* Delete Data */}
      <Button variant="destructive" className="w-full gap-2">
        <Trash2 className="h-4 w-4" />
        Delete All Historical Data
      </Button>
    </div>
  );
};

export default PrivacyDashboard;
