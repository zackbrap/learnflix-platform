import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single()
          .then(({ data }) => {
            if (data?.role === "teacher") navigate("/dashboard");
            else navigate("/aluno");
          });
      } else {
        navigate("/auth");
      }
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-muted-foreground">Carregando...</div>
    </div>
  );
};

export default Index;
