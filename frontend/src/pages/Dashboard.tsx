import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Activity, BarChart3, Zap, Shield, Lightbulb,
  LayoutDashboard, TrendingDown, Menu, X, Settings as SettingsIcon, LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AgentDebatePanel from "@/components/destress/AgentDebatePanel";
import BurnoutTrajectoryTracker from "@/components/destress/StressFingerprint";
import CognitiveHeatmap from "@/components/destress/CognitiveHeatmap";
import InterventionMemory from "@/components/destress/InterventionMemory";
import PrivacyDashboard from "@/components/destress/PrivacyDashboard";
import StressPatternInsights from "@/components/destress/StressPatternInsights";
import StressLevelBar from "@/components/destress/StressLevelBar";
import WorkdayCountdown from "@/components/destress/WorkdayCountdown";
import StatusOrb from "@/components/destress/StatusOrb";
import SettingsPage from "@/pages/Settings";
import { DashboardResponse, getDashboard } from "@/services/api";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "debate", label: "AI Decision Engine", icon: Brain },
  { id: "burnout", label: "Burnout Tracker", icon: Activity },
  { id: "heatmap", label: "Cognitive Heatmap", icon: BarChart3 },
  { id: "insights", label: "Insights", icon: Lightbulb },
  { id: "interventions", label: "Interventions", icon: Zap },
  { id: "privacy", label: "Privacy Settings", icon: Shield },
  { id: "settings", label: "Settings", icon: SettingsIcon },
] as const;

type NavId = (typeof navItems)[number]["id"];

const Dashboard = () => {
  const { user, profile, token, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState<NavId>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (loading || !user || !token) {
      return;
    }

    if (!profile?.onboarding_completed) {
      navigate("/onboarding", { replace: true });
      return;
    }

    const loadDashboard = async () => {
      try {
        const response = await getDashboard(token);
        setDashboardData(response);
      } finally {
        setFetching(false);
      }
    };

    void loadDashboard();
  }, [loading, navigate, profile?.onboarding_completed, token, user]);

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed z-40 top-0 left-0 h-full w-60 border-r border-border bg-card flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <TrendingDown className="h-4 w-4 text-primary" />
          </div>
          <h1 className="font-display text-lg font-bold">
            <span className="text-gradient-brand">Destress</span>
          </h1>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveNav(item.id); setSidebarOpen(false); }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-border px-3 py-3">
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        </div>

        <div className="border-t border-border px-5 py-4 flex items-center gap-3">
          <StatusOrb />
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="font-display text-xs font-semibold text-calm">Focus Mode</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-4 border-b border-border/50 px-6 py-3 lg:py-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground">
            <Menu className="h-5 w-5" />
          </button>
          <h2 className="font-display text-lg font-semibold">
            {navItems.find((n) => n.id === activeNav)?.label}
          </h2>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto max-w-6xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeNav}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                {activeNav === "dashboard" && <DashboardOverview onNavigate={setActiveNav} dashboardData={dashboardData} userName={user.full_name} />}
                {activeNav === "debate" && <AgentDebatePanel token={token || ""} />}
                {activeNav === "burnout" && <BurnoutTrajectoryTracker />}
                {activeNav === "heatmap" && <CognitiveHeatmap />}
                {activeNav === "insights" && <StressPatternInsights />}
                {activeNav === "interventions" && <InterventionMemory />}
                {activeNav === "privacy" && <PrivacyDashboard />}
                {activeNav === "settings" && <SettingsPage />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

/* ─── Dashboard Overview ─── */
const DashboardOverview = ({
  onNavigate,
  dashboardData,
  userName,
}: {
  onNavigate: (id: NavId) => void;
  dashboardData: DashboardResponse | null;
  userName: string;
}) => {
  const assessment = dashboardData?.latest_assessment;
  const currentLevel = assessment?.strain_index ?? 0;
  const burnoutColor = currentLevel >= 65 ? "text-alert" : currentLevel >= 35 ? "text-caution" : "text-calm";

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-xs font-medium text-muted-foreground">Welcome back</p>
        <h3 className="mt-1 font-display text-2xl font-bold">{userName || "Destress user"}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {assessment?.nudge || "Complete your questionnaire to generate stress insights for the dashboard."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StressLevelBar level={currentLevel} />
        <WorkdayCountdown />
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between">
          <p className="text-xs font-medium text-muted-foreground">AI Decision</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-focus/10">
              <Brain className="h-5 w-5 text-focus" />
            </div>
            <div>
              <p className="font-display text-lg font-bold text-focus">
                {assessment?.dnd_mode.status === "ACTIVE" ? "Focus Protection On" : "Focus Protection Off"}
              </p>
              <p className="text-xs text-muted-foreground">{assessment?.dnd_mode.reason || "No decision available yet."}</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate("debate")}
            className="mt-3 text-xs text-primary hover:underline self-start"
          >
            View AI Decision Engine →
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold">Latest Questionnaire Snapshot</h3>
            <button onClick={() => onNavigate("settings")} className="text-xs text-primary hover:underline">
              Edit profile →
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 text-sm text-muted-foreground">
            <div>Work hours: <span className="text-foreground">{dashboardData?.questionnaire?.work_hours || "-"}</span></div>
            <div>Pressure: <span className="text-foreground capitalize">{dashboardData?.questionnaire?.pressure || "-"}</span></div>
            <div>Sleep: <span className="text-foreground">{dashboardData?.questionnaire?.sleep || "-"}</span></div>
            <div>Work setup: <span className="text-foreground capitalize">{dashboardData?.questionnaire?.work_setup || "-"}</span></div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold">Burnout Risk</h3>
            <button onClick={() => onNavigate("burnout")} className="text-xs text-primary hover:underline">
              Full tracker →
            </button>
          </div>
          <div className="flex items-end gap-4">
            <div>
              <p className={`font-display text-3xl font-bold ${burnoutColor}`}>{assessment?.burnout_risk || "-"}</p>
              <p className="text-xs text-muted-foreground">{assessment?.weekly_trend || "No trend available yet."}</p>
            </div>
            <p className="text-xs text-muted-foreground mb-1">
              {assessment?.top_factors?.[0] || "Submit the questionnaire to populate personalized risk factors."}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold">Recent Insights</h3>
          <button onClick={() => onNavigate("insights")} className="text-xs text-primary hover:underline">
            All insights →
          </button>
        </div>
        <div className="space-y-2">
          {(assessment?.top_factors?.length ? assessment.top_factors : ["No saved questionnaire data yet."]).map((text, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-caution shrink-0" />
              {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
