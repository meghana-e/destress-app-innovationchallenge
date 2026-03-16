export interface UserProfile {
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
  onboarding_completed: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  profile: UserProfile;
}

export interface AssessmentResponse {
  id: string;
  timestamp: string;
  strain_index: number;
  ml_stress_level: string;
  burnout_risk: string;
  weekly_trend: string;
  nudge: string;
  dnd_mode: {
    status: string;
    reason: string;
    muted: string[];
    allowed_through: string[];
    duration_minutes: number;
    expiry_time: string | null;
  };
  top_factors: string[];
  questionnaire: Omit<UserProfile, "onboarding_completed">;
}

export interface DashboardResponse {
  user: AuthUser;
  profile: UserProfile;
  questionnaire: Omit<UserProfile, "onboarding_completed"> | null;
  latest_assessment: AssessmentResponse | null;
  history: Array<{
    timestamp: string;
    strain_index: number;
    ml_stress_level: string;
  }>;
}

export interface QuestionnairePayload {
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

const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(payload?.detail || "Request failed.");
  }

  return payload as T;
}

export const signup = (data: { full_name: string; email: string; password: string }) =>
  request<AuthResponse>("/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const login = (data: { email: string; password: string }) =>
  request<AuthResponse>("/login", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getCurrentUser = (token: string) => request<{ user: AuthUser; profile: UserProfile }>("/me", {}, token);

export const getProfile = (token: string) => request<UserProfile>("/profile", {}, token);

export const updateProfile = (token: string, data: Partial<UserProfile>) =>
  request<{ user: AuthUser; profile: UserProfile }>("/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  }, token);

export const saveQuestionnaire = (token: string, data: QuestionnairePayload) =>
  request<{ profile: UserProfile; assessment: AssessmentResponse }>("/questionnaire", {
    method: "POST",
    body: JSON.stringify(data),
  }, token);

export const getQuestionnaire = (token: string) =>
  request<{ questionnaire: Omit<UserProfile, "onboarding_completed"> | null; assessment: AssessmentResponse | null }>("/questionnaire", {}, token);

export const deleteQuestionnaire = (token: string) =>
  request<{ profile: UserProfile }>("/questionnaire", {
    method: "DELETE",
  }, token);

export const getDashboard = (token: string) => request<DashboardResponse>("/dashboard", {}, token);