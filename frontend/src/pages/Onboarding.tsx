import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { saveQuestionnaire } from "@/services/api";

interface Question {
  id: string;
  question: string;
  type: "numeric" | "options" | "scale" | "text";
  options?: { label: string; value: string }[];
  placeholder?: string;
  min?: number;
  max?: number;
  unit?: string;
}

const questions: Question[] = [
  {
    id: "age",
    question: "What is your age?",
    type: "numeric",
    placeholder: "e.g. 35",
    min: 18,
    max: 100,
    unit: "years",
  },
  {
    id: "industry",
    question: "Which industry do you work in?",
    type: "text",
    placeholder: "e.g. Finance",
  },
  {
    id: "work_hours",
    question: "How many hours do you work in a day?",
    type: "numeric",
    placeholder: "e.g. 8",
    min: 1,
    max: 16,
    unit: "hours",
  },
  {
    id: "pressure",
    question: "How would you rate your pressure at work?",
    type: "options",
    options: [
      { label: "Low", value: "low" },
      { label: "Medium", value: "medium" },
      { label: "High", value: "high" },
    ],
  },
  {
    id: "manager_support",
    question: "On a scale of 1–5, how supportive is your manager/employer?",
    type: "scale",
    options: [
      { label: "Never", value: "1" },
      { label: "Rarely", value: "2" },
      { label: "Somewhat", value: "3" },
      { label: "Mostly", value: "4" },
      { label: "Always", value: "5" },
    ],
  },
  {
    id: "sleep",
    question: "What is the average amount of sleep you get at night?",
    type: "numeric",
    placeholder: "e.g. 7",
    min: 1,
    max: 14,
    unit: "hours",
  },
  {
    id: "exercise",
    question: "How often do you exercise?",
    type: "scale",
    options: [
      { label: "Never", value: "1" },
      { label: "Rarely", value: "2" },
      { label: "Somewhat", value: "3" },
      { label: "Mostly", value: "4" },
      { label: "Everyday", value: "5" },
    ],
  },
  {
    id: "job_satisfaction",
    question: "How satisfied are you with your job?",
    type: "scale",
    options: [
      { label: "Never", value: "1" },
      { label: "Rarely", value: "2" },
      { label: "Somewhat", value: "3" },
      { label: "Mostly", value: "4" },
      { label: "Always", value: "5" },
    ],
  },
  {
    id: "work_life_balance",
    question: "Are you able to maintain a good work-life balance?",
    type: "scale",
    options: [
      { label: "Never", value: "1" },
      { label: "Rarely", value: "2" },
      { label: "Somewhat", value: "3" },
      { label: "Mostly", value: "4" },
      { label: "Always", value: "5" },
    ],
  },
  {
    id: "social",
    question: "Are you a social person?",
    type: "options",
    options: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" },
    ],
  },
  {
    id: "family",
    question: "Do you live with family?",
    type: "options",
    options: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" },
    ],
  },
  {
    id: "work_setup",
    question: "What is your current work setup?",
    type: "options",
    options: [
      { label: "Office", value: "office" },
      { label: "Hybrid", value: "hybrid" },
      { label: "Work From Home", value: "wfh" },
    ],
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, token, setProfileState } = useAuth();
  const { toast } = useToast();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [numericInput, setNumericInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const q = questions[currentIdx];
  const progress = (currentIdx / questions.length) * 100;
  const isLast = currentIdx === questions.length - 1;
  const hasAnswer =
    !!answers[q.id] ||
    (q.type === "numeric" && numericInput.trim() !== "") ||
    (q.type === "text" && textInput.trim() !== "");

  const selectOption = (value: string) => {
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
  };

  const goNext = async () => {
    const updatedAnswers = { ...answers };
    if (q.type === "numeric" && numericInput.trim()) {
      updatedAnswers[q.id] = numericInput.trim();
      setAnswers(updatedAnswers);
    }
    if (q.type === "text" && textInput.trim()) {
      updatedAnswers[q.id] = textInput.trim();
      setAnswers(updatedAnswers);
    }

    if (isLast) {
      if (!user || !token) {
        toast({ title: "Please log in to continue.", variant: "destructive" });
        navigate("/login");
        return;
      }

      setSubmitting(true);

      try {
        const response = await saveQuestionnaire(token, {
          age: updatedAnswers.age,
          industry: updatedAnswers.industry,
          work_hours: updatedAnswers.work_hours,
          pressure: updatedAnswers.pressure,
          manager_support: updatedAnswers.manager_support,
          sleep: updatedAnswers.sleep,
          exercise: updatedAnswers.exercise,
          job_satisfaction: updatedAnswers.job_satisfaction,
          work_life_balance: updatedAnswers.work_life_balance,
          social: updatedAnswers.social,
          family: updatedAnswers.family,
          work_setup: updatedAnswers.work_setup,
        });

        setProfileState(response.profile);
        toast({ title: "Questionnaire saved. Your dashboard is ready." });
        navigate("/dashboard");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to save questionnaire.";
        toast({ title: message, variant: "destructive" });
      } finally {
        setSubmitting(false);
      }

        return;
    }
    setCurrentIdx((i) => i + 1);
    setNumericInput("");
    setTextInput("");
  };

  const goBack = () => {
    if (currentIdx > 0) {
      setCurrentIdx((i) => i - 1);
      const prevQ = questions[currentIdx - 1];
      if (prevQ.type === "numeric") {
        setNumericInput(answers[prevQ.id] || "");
        setTextInput("");
      }
      if (prevQ.type === "text") {
        setTextInput(answers[prevQ.id] || "");
        setNumericInput("");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-6 py-4">
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <h1 className="font-display text-lg font-bold">
            <span className="text-gradient-brand">Destress</span>
          </h1>
          <span className="text-xs text-muted-foreground">
            {currentIdx + 1} of {questions.length}
          </span>
        </div>
      </header>

      <div className="px-6">
        <div className="mx-auto max-w-2xl">
          <Progress value={progress} className="h-1" />
        </div>
      </div>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={q.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-8"
            >
              <h2 className="font-display text-2xl md:text-3xl font-bold leading-tight">
                {q.question}
              </h2>

              {q.type === "numeric" && (
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={q.min}
                    max={q.max}
                    value={numericInput}
                    onChange={(e) => setNumericInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && hasAnswer && goNext()}
                    placeholder={q.placeholder}
                    className="w-32 rounded-xl border border-border bg-card px-4 py-3 font-display text-2xl font-bold text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
                    autoFocus
                  />
                  {q.unit && (
                    <span className="text-muted-foreground text-lg">{q.unit}</span>
                  )}
                </div>
              )}

              {q.type === "text" && (
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && hasAnswer && goNext()}
                    placeholder={q.placeholder}
                    className="w-full rounded-xl border border-border bg-card px-4 py-3 font-display text-2xl font-bold text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
                    autoFocus
                  />
                </div>
              )}

              {(q.type === "options" || q.type === "scale") && (
                <div
                  className={`grid gap-3 ${
                    q.options!.length <= 3
                      ? "grid-cols-1 sm:grid-cols-3"
                      : q.options!.length <= 5
                      ? "grid-cols-1 sm:grid-cols-5"
                      : "grid-cols-1"
                  }`}
                >
                  {q.options!.map((opt) => {
                    const selected = answers[q.id] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => selectOption(opt.value)}
                        className={`relative rounded-xl border px-4 py-4 text-left transition-all duration-200 ${
                          selected
                            ? "border-primary/50 bg-primary/10 shadow-[0_0_16px_hsl(var(--primary)/0.15)]"
                            : "border-border bg-card hover:border-primary/30 hover:bg-primary/5"
                        }`}
                      >
                        <span
                          className={`font-display text-sm font-semibold ${
                            selected ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {opt.label}
                        </span>
                        {selected && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          >
                            <Check className="h-4 w-4 text-primary" />
                          </motion.span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <footer className="px-6 py-6">
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <Button variant="ghost" onClick={goBack} disabled={currentIdx === 0} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button onClick={goNext} disabled={!hasAnswer || submitting} className="gap-2">
            {isLast ? (submitting ? "Saving…" : "Get Started") : "Continue"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default Onboarding;
