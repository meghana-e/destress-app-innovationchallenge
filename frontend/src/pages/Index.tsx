import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      navigate("/signup", { replace: true });
      return;
    }

    if (profile?.onboarding_completed) {
      navigate("/dashboard", { replace: true });
      return;
    }

    navigate("/onboarding", { replace: true });
  }, [loading, navigate, profile?.onboarding_completed, user]);

  return null;
};

export default Index;
