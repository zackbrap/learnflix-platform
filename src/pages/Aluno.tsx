import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppSidebar from "@/components/AppSidebar";
import { Play, Inbox, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ScheduledItem {
  id: string;
  title: string;
  type: string;
  scheduled_at: string;
  classroom_name: string;
  classroom_color: string;
  lesson_title: string;
}

const Aluno = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduled, setScheduled] = useState<ScheduledItem[]>([]);
  const [scheduledLoading, setScheduledLoading] = useState(true);

  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("classroom_students")
        .select("classroom_id, classrooms(id, name, subject, description, color, icon)")
        .eq("user_id", user.id);
      console.log("data:", data, "error:", error);
      if (data && data.length > 0) {
        const rooms = data
          .map((e: any) => e.classrooms)
          .filter(Boolean);
        setClassrooms(rooms);
      }
      setLoading(false);
    };
    fetchEnrollments();
  }, [user]);

  useEffect(() => {
    const fetchScheduled = async () => {
      if (!user) return;
      setScheduledLoading(true);

      const { data: enrollments } = await supabase
        .from("classroom_students")
        .select("classroom_id")
        .eq("user_id", user.id);

      if (!enrollments || enrollments.length === 0) {
        setScheduledLoading(false);
        return;
      }

      const classroomIds = enrollments.map((e) => e.classroom_id);

      const { data: lessons } = await supabase
        .from("lessons")
        .select("id, title, classroom_id")
        .in("classroom_id", classroomIds)
        .eq("is_visible", true);

      if (!lessons || lessons.length === 0) {
        setScheduledLoading(false);
        return;
      }

      const lessonIds = lessons.map((l) => l.id);

      const { data: contents } = await supabase
        .from("contents")
        .select("id, title, type, scheduled_at, lesson_id")
        .in("lesson_id", lessonIds)
        .in("type", ["revisao", "simulado"])
        .not("scheduled_at", "is", null)
        .gt("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true });

      if (!contents || contents.length === 0) {
        setScheduled([]);
        setScheduledLoading(false);
        return;
      }

      const { data: classroomData } = await supabase
        .from("classrooms")
        .select("id, name, color")
        .in("id", classroomIds);

      const classroomMap = new Map(
        (classroomData || []).map((c) => [c.id, c])
      );
      const lessonMap = new Map(
        lessons.map((l) => [l.id, l])
      );

      const items: ScheduledItem[] = contents.map((c) => {
        const lesson = lessonMap.get(c.lesson_id);
        const classroom = lesson ? classroomMap.get(lesson.classroom_id) : null;
        return {
          id: c.id,
          title: c.title,
          type: c.type,
          scheduled_at: c.scheduled_at!,
          classroom_name: classroom?.name || "",
          classroom_color: classroom?.color || "#e50914",
          lesson_title: lesson?.title || "",
        };
      });

      setScheduled(items);
      setScheduledLoading(false);
    };
    fetchScheduled();
  }, [user]);

  const formatScheduleDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) +
      " às " +
      d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const getTimeRemaining = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `em ${days}d ${hours}h`;
    if (hours > 0) return `em ${hours}h`;
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `em ${mins}min`;
  };

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

        {/* Atividades Agendadas */}
        {(scheduledLoading || scheduled.length > 0) && (
          <div className="px-8 py-6">
            <div className="flex items-center gap-2 mb-4">
              <CalendarClock className="h-5 w-5 text-amber-400" />
              <h2 className="font-display text-2xl text-foreground">Atividades Agendadas</h2>
            </div>

            {scheduledLoading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-[72px] rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {scheduled.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 rounded-lg border px-4 py-3 transition-colors"
                    style={{ background: "#1a1a1a", borderColor: "#2a2a2a" }}
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-lg"
                      style={{ background: item.classroom_color + "22" }}
                    >
                      {item.type === "simulado" ? "📋" : "📖"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {item.classroom_name} · {item.lesson_title}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-medium text-amber-400">
                        {getTimeRemaining(item.scheduled_at)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatScheduleDate(item.scheduled_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Minhas Turmas */}
        <div className="px-8 py-6">
          <h2 className="font-display text-2xl text-foreground mb-4">Minhas Turmas</h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-[200px] rounded-lg" />
              ))}
            </div>
          ) : classrooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-16">
              <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Você ainda não participa de nenhuma turma</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {classrooms.map((c: any) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/turma/${c.id}`)}
                  className="cursor-pointer rounded-lg overflow-hidden transition-transform hover:scale-[1.03]"
                  style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
                >
                  <div className="h-1.5 w-full" style={{ background: c.color || "#e50914" }} />
                  <div className="p-4">
                    <div className="text-2xl mb-2">{c.icon || "📚"}</div>
                    <span className="text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm mb-2 inline-block"
                      style={{ background: (c.color || "#e50914") + "22", color: c.color || "#e50914" }}>
                      {c.subject}
                    </span>
                    <p className="font-bold text-foreground text-sm mt-1">{c.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {c.description || "Sem descrição"}
                    </p>
                  </div>
                </div>
              ))}
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
