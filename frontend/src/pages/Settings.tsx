import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Trash2, Download, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { deleteQuestionnaire, updateProfile } from "@/services/api";

const pressureOptions = ["low", "medium", "high"];
const scaleOptions = ["1", "2", "3", "4", "5"];
const yesNoOptions = ["yes", "no"];
const setupOptions = ["office", "hybrid", "wfh"];

const scaleLabels: Record<string, Record<string, string>> = {
  manager_support: { "1": "Never", "2": "Rarely", "3": "Somewhat", "4": "Mostly", "5": "Always" },
  exercise: { "1": "Never", "2": "Rarely", "3": "Somewhat", "4": "Mostly", "5": "Everyday" },
  job_satisfaction: { "1": "Never", "2": "Rarely", "3": "Somewhat", "4": "Mostly", "5": "Always" },
  work_life_balance: { "1": "Never", "2": "Rarely", "3": "Somewhat", "4": "Mostly", "5": "Always" },
};

interface Profile {
  full_name: string;
  age: string;
  industry: string;
  work_hours: string;
  pressure: string;
  manager_support: string;
  sleep: string;
  exercise: string;
  job_satisfaction: string;
  work_life_balance: string;
  social: string;
  family: string;
  work_setup: string;
}

const defaultProfile: Profile = {
  full_name: "", age: "", industry: "", work_hours: "", pressure: "", manager_support: "",
  sleep: "", exercise: "", job_satisfaction: "", work_life_balance: "",
  social: "", family: "", work_setup: "",
};

const Settings = () => {
  const { user, profile: authProfile, token, signOut, setProfileState } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [saving, setSaving] = useState(false);
  const [monitoring, setMonitoring] = useState(true);

  useEffect(() => {
    if (!authProfile) return;

    setProfile({
      full_name: authProfile.full_name || "",
      age: authProfile.age || "",
      industry: authProfile.industry || "",
      work_hours: authProfile.work_hours || "",
      pressure: authProfile.pressure || "",
      manager_support: authProfile.manager_support || "",
      sleep: authProfile.sleep || "",
      exercise: authProfile.exercise || "",
      job_satisfaction: authProfile.job_satisfaction || "",
      work_life_balance: authProfile.work_life_balance || "",
      social: authProfile.social || "",
      family: authProfile.family || "",
      work_setup: authProfile.work_setup || "",
    });
  }, [authProfile]);

  const update = (field: keyof Profile, value: string) =>
    setProfile((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!user || !token) return;
    setSaving(true);

    try {
      const response = await updateProfile(token, profile);
      setProfileState(response.profile);
      toast({ title: "Profile updated successfully" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save profile.";
      toast({ title: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteData = async () => {
    if (!user || !token) return;

    try {
      const response = await deleteQuestionnaire(token);
      setProfile(defaultProfile);
      setProfileState(response.profile);
      toast({ title: "All personal data has been cleared" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to clear personal data.";
      toast({ title: message, variant: "destructive" });
    }
  };

  const OptionPicker = ({
    field,
    options,
    labels,
  }: {
    field: keyof Profile;
    options: string[];
    labels?: Record<string, string>;
  }) => (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = profile[field] === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => update(field, opt)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              selected
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border bg-secondary text-muted-foreground hover:border-primary/30"
            }`}
          >
            {labels ? labels[opt] : opt.charAt(0).toUpperCase() + opt.slice(1)}
          </button>
        );
      })}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-2xl"
    >
      {/* Account Details */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-5">
        <h3 className="font-display text-lg font-semibold">Account Details</h3>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input
              value={profile.full_name}
              onChange={(e) => update("full_name", e.target.value)}
              maxLength={100}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Age</Label>
              <Input
                type="number"
                min={18}
                max={100}
                value={profile.age}
                onChange={(e) => update("age", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Industry</Label>
              <Input
                value={profile.industry}
                onChange={(e) => update("industry", e.target.value)}
                maxLength={100}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled className="opacity-60" />
          </div>
        </div>
      </section>

      {/* Lifestyle & Work Profile */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-5">
        <h3 className="font-display text-lg font-semibold">Lifestyle & Work Profile</h3>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Average work hours per day</Label>
            <Input
              type="number"
              min={1}
              max={16}
              value={profile.work_hours}
              onChange={(e) => update("work_hours", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Average sleep (hours)</Label>
            <Input
              type="number"
              min={1}
              max={14}
              value={profile.sleep}
              onChange={(e) => update("sleep", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Work pressure level</Label>
          <OptionPicker field="pressure" options={pressureOptions} />
        </div>

        <div className="space-y-1.5">
          <Label>Manager support (1–5)</Label>
          <OptionPicker field="manager_support" options={scaleOptions} labels={scaleLabels.manager_support} />
        </div>

        <div className="space-y-1.5">
          <Label>Exercise frequency (1–5)</Label>
          <OptionPicker field="exercise" options={scaleOptions} labels={scaleLabels.exercise} />
        </div>

        <div className="space-y-1.5">
          <Label>Job satisfaction (1–5)</Label>
          <OptionPicker field="job_satisfaction" options={scaleOptions} labels={scaleLabels.job_satisfaction} />
        </div>

        <div className="space-y-1.5">
          <Label>Work-life balance (1–5)</Label>
          <OptionPicker field="work_life_balance" options={scaleOptions} labels={scaleLabels.work_life_balance} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Social person?</Label>
            <OptionPicker field="social" options={yesNoOptions} />
          </div>
          <div className="space-y-1.5">
            <Label>Live with family?</Label>
            <OptionPicker field="family" options={yesNoOptions} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Work setup</Label>
          <OptionPicker
            field="work_setup"
            options={setupOptions}
            labels={{ office: "Office", hybrid: "Hybrid", wfh: "Work From Home" }}
          />
        </div>

        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </section>

      {/* Privacy Controls */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-5">
        <h3 className="font-display text-lg font-semibold">Privacy Controls</h3>
        <p className="text-sm text-muted-foreground">
          Your stress insights are generated using your personal baseline and activity data.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => setMonitoring(!monitoring)}
            className="gap-2"
          >
            {monitoring ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {monitoring ? "Pause Monitoring" : "Resume Monitoring"}
          </Button>

          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Personal Data
          </Button>

          <Button
            variant="destructive"
            onClick={handleDeleteData}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete Account Data
          </Button>
        </div>
      </section>

      {/* Sign Out */}
      <Button variant="ghost" onClick={signOut} className="text-muted-foreground">
        Sign Out
      </Button>
    </motion.div>
  );
};

export default Settings;
