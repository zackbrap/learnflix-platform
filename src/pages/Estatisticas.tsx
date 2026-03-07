import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppSidebar from "@/components/AppSidebar";
import { BarChart3, Users, BookOpen, FileText } from "lucide-react";

interface Stats {
  totalClassrooms: number;
  totalStudents: number;
  totalLessons: number;
  totalContents: number;
}

const Estatisticas = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalClassrooms: 0, totalStudents: 0, totalLessons: 0, totalContents: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const [classrooms, students, lessons, contents] = await Promise.all([
        supabase.from("classrooms").select("id", { count: "exact", head: true }).eq("teacher_id", session.user.id),
        supabase.from("classroom_students").select("id, classroom_id, classrooms!inner(teacher_id)", { count: "exact", head: true }).eq("classrooms.teacher_id", session.user.id),
        supabase.from("lessons").select("id, classrooms!inner(teacher_id)", { count: "exact", head: true }).eq("classrooms.teacher_id", session.user.id),
        supabase.from("contents").select("id, lessons!inner(classrooms!inner(teacher_id))", { count: "exact", head: true }).eq("lessons.classrooms.teacher_id", session.user.id),
      ]);

      setStats({
        totalClassrooms: classrooms.count ?? 0,
        totalStudents: students.count ?? 0,
        totalLessons: lessons.count ?? 0,
        totalContents: contents.count ?? 0,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const cards = [
    { label: "Turmas", value: stats.totalClassrooms, icon: Users, color: "text-primary" },
    { label: "Alunos", value: stats.totalStudents, icon: Users, color: "text-blue-400" },
    { label: "Aulas", value: stats.totalLessons, icon: BookOpen, color: "text-green-400" },
    { label: "Conteúdos", value: stats.totalContents, icon: FileText, color: "text-yellow-400" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar variant={profile?.role === "student" ? "student" : "teacher"} />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <BarChart3 className="h-7 w-7 text-primary" />
            <h1 className="font-display text-3xl tracking-wide text-foreground">Estatísticas</h1>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {cards.map((card) => (
                <div key={card.label} className="rounded-lg border border-border bg-card p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{card.label}</span>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <p className="font-display text-4xl text-foreground">{card.value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">Gráficos detalhados e relatórios de desempenho em breve.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Estatisticas;
