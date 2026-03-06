import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppSidebar from "@/components/AppSidebar";
import { Play, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const Aluno = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [enrolledClassrooms, setEnrolledClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnrolled = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      const { data: enrollments, error } = await supabase
        .from("classroom_students")
        .select("classroom_id, classrooms(*)")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching enrollments:", error);
      } else if (enrollments) {
        const classrooms = enrollments
          .map((e: any) => e.classrooms)
          .filter(Boolean);
        setEnrolledClassrooms(classrooms);
      }
      setLoading(false);
    };
    fetchEnrolled();
  }, [user]);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar variant="student" />

      <main className="flex-1 overflow-y-auto">
        {/* Hero banner */}
        <div
          className="relative overflow-hidden px-8 py-10"
          style={{
            background: "linear-gradient(135deg, hsl(0 100% 5%), hsl(0 100% 9%), hsl(0 0% 8%))",
          }}
        >
          <div
            className="pointer-events-none absolute -top-20 -right-20 h-[400px] w-[400px] animate-pulse-glow"
            style={{
              background: "radial-gradient(ellipse at 80% 20%, hsl(357 91% 47% / 0.18) 0%, transparent 70%)",
            }}
          />
          <div className="relative z-10">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Bem-vindo de volta
            </span>
            <h1 className="font-display text-5xl text-foreground mt-2">
              Olá, {profile?.full_name || "Aluno"}!
            </h1>
            <div className="mt-5 flex gap-3">
              <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                <Play className="h-4 w-4" />
                Continuar estudando
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg border border-foreground/20 bg-foreground/5 px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/10">
                Ver todas as turmas
              </button>
            </div>
          </div>
        </div>

        {/* Minhas Turmas */}
        <div className="px-8 py-6">
          <h2 className="font-display text-2xl text-foreground mb-4">Minhas Turmas</h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-[200px] rounded-lg" />
              ))}
            </div>
          ) : enrolledClassrooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrolledClassrooms.map((classroom: any) => (
                <div
                  key={classroom.id}
                  onClick={() => navigate(`/turma/${classroom.id}`)}
                  className="group cursor-pointer rounded-lg border transition-transform hover:scale-[1.02]"
                  style={{ background: "#1a1a1a", borderColor: "#2a2a2a" }}
                >
                  <div className="h-1 rounded-t-lg" style={{ background: classroom.color }} />
                  <div className="p-5">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full text-lg mb-3"
                      style={{ background: classroom.color + "20" }}
                    >
                      {classroom.icon}
                    </div>
                    <span
                      className="inline-block rounded-full px-2.5 py-0.5 text-[0.7rem] font-medium mb-2"
                      style={{ background: classroom.color + "20", color: classroom.color }}
                    >
                      {classroom.subject}
                    </span>
                    <h3 className="text-[0.95rem] font-bold text-foreground mb-1">{classroom.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
                      {classroom.description || "Sem descrição"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-16">
              <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Você ainda não participa de nenhuma turma</p>
            </div>
          )}
        </div>

        {/* Disponível para você */}
        <div className="px-8 pb-10">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-display text-2xl text-foreground">Disponível para você</h2>
            <Badge className="bg-primary text-primary-foreground border-none text-xs">Premium</Badge>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-16">
            <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Em breve novos conteúdos</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Aluno;
