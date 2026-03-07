import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PlayCircle } from "lucide-react";
import { toast } from "sonner";

const JoinClass = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();

  const [classroom, setClassroom] = useState<any>(null);
  const [status, setStatus] = useState<
    "loading" | "not-logged" | "teacher" | "invalid" | "already" | "ready"
  >("loading");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setStatus("not-logged");
      return;
    }

    if (profile?.role === "teacher") {
      setStatus("teacher");
      return;
    }

    const fetchClassroom = async () => {
      const { data } = await supabase
        .from("classrooms")
        .select("*")
        .eq("invite_code", code)
        .eq("invite_active", true)
        .maybeSingle();

      if (!data) {
        setStatus("invalid");
        return;
      }

      setClassroom(data);

      const { data: existing } = await supabase
        .from("classroom_students")
        .select("id")
        .eq("classroom_id", data.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        setStatus("already");
      } else {
        setStatus("ready");
      }
    };

    fetchClassroom();
  }, [authLoading, user, profile, code]);

  const handleJoin = async () => {
    if (!user || !profile || !classroom) return;
    setJoining(true);

    const { error } = await supabase.from("classroom_students").insert({
      classroom_id: classroom.id,
      user_id: user.id,
      student_name: profile.full_name,
    });

    setJoining(false);
    if (error) {
      console.error("Join error:", error);
      toast.error("Erro ao entrar na turma");
      return;
    }

    toast.success("Você entrou na turma!");
    navigate("/aluno");
  };

  const cardClass =
    "w-full max-w-md rounded-lg border p-8 text-center"
  const cardStyle = { background: "#1a1a1a", borderColor: "#2a2a2a" };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#141414" }}
    >
      <div className={cardClass} style={cardStyle}>
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <PlayCircle className="h-8 w-8 text-primary" />
          <span className="font-display text-3xl tracking-wider text-primary">
            MYZION
          </span>
        </div>

        {status === "loading" && (
          <p className="text-muted-foreground">Carregando...</p>
        )}

        {status === "not-logged" && (
          <>
            <p className="text-muted-foreground mb-6">
              Para entrar na turma, faça login ou crie sua conta
            </p>
            <button
              onClick={() => navigate(`/auth?redirect=/convite/${code}`)}
              className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 mb-3"
            >
              Fazer login
            </button>
            <button
              onClick={() => navigate(`/auth?mode=register&redirect=/convite/${code}`)}
              className="w-full rounded-lg border py-3 font-semibold text-foreground transition-colors hover:bg-secondary"
              style={{ borderColor: "#2a2a2a" }}
            >
              Criar conta gratuita
            </button>
          </>
        )}

        {status === "teacher" && (
          <p className="text-muted-foreground">
            Esta página é exclusiva para alunos
          </p>
        )}

        {status === "invalid" && (
          <p className="text-muted-foreground">
            Convite inválido ou expirado
          </p>
        )}

        {status === "already" && (
          <>
            <p className="text-muted-foreground mb-4">
              Você já está nesta turma
            </p>
            <button
              onClick={() => navigate("/aluno")}
              className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Ir para a turma
            </button>
          </>
        )}

        {status === "ready" && classroom && (
          <>
            <div
              className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full text-2xl"
              style={{ background: classroom.color + "20" }}
            >
              {classroom.icon}
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">
              {classroom.name}
            </h2>
            <span
              className="inline-block rounded-full px-2.5 py-0.5 text-[0.7rem] font-medium mb-4"
              style={{
                background: classroom.color + "20",
                color: classroom.color,
              }}
            >
              {classroom.subject}
            </span>
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {joining ? "Entrando..." : "Entrar na turma"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default JoinClass;
