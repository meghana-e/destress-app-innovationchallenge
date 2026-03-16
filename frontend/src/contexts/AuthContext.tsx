import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { AuthResponse, AuthUser, UserProfile, getCurrentUser } from "@/services/api";

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  token: string | null;
  loading: boolean;
  setAuthSession: (session: AuthResponse) => void;
  setProfileState: (profile: UserProfile) => void;
  refreshProfile: () => Promise<UserProfile | null>;
  signOut: () => Promise<void>;
}

const STORAGE_KEY = "destress_auth_session";

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  token: null,
  loading: true,
  setAuthSession: () => {},
  setProfileState: () => {},
  refreshProfile: async () => null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const persistSession = (payload: { token: string; user: AuthUser; profile: UserProfile }) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

const clearStoredSession = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const boot = async () => {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setLoading(false);
        return;
      }

      try {
        const parsed = JSON.parse(raw) as { token: string; user: AuthUser; profile: UserProfile };
        const current = await getCurrentUser(parsed.token);
        setToken(parsed.token);
        setUser(current.user);
        setProfile(current.profile);
        persistSession({ token: parsed.token, user: current.user, profile: current.profile });
      } catch {
        clearStoredSession();
        setToken(null);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    void boot();
  }, []);

  const setAuthSession = (session: AuthResponse) => {
    setToken(session.token);
    setUser(session.user);
    setProfile(session.profile);
    persistSession(session);
  };

  const setProfileState = (nextProfile: UserProfile) => {
    setProfile(nextProfile);
    if (token && user) {
      persistSession({ token, user, profile: nextProfile });
    }
  };

  const refreshProfile = async () => {
    if (!token) return null;

    const current = await getCurrentUser(token);
    setUser(current.user);
    setProfile(current.profile);
    persistSession({ token, user: current.user, profile: current.profile });
    return current.profile;
  };

  const signOut = async () => {
    clearStoredSession();
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, token, loading, setAuthSession, setProfileState, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
