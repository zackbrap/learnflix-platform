import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppSidebar from "@/components/AppSidebar";
import { ArrowLeft, Plus } from "lucide-react";
import LessonCard from "@/components/classroom/LessonCard";
import CreateLessonDialog from "@/components/classroom/CreateLessonDialog";
import StudentsList from "@/components/classroom/StudentsList";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

const contentSections = [
  { icon: "📄", title: "PDFs" },
  { icon: "🎬", title: "Vídeos" },
  { icon: "🎙️", title: "Podcasts" },
  { icon: "🗺️", title: "Mapas Mentais" },
  { icon: "📊", title: "Infográficos" },
  { icon: "🃏", title: "Flashcards" },
  { icon: "📝", title: "Questões de Revisão" },
  { icon: "📋", title: "Simulados" },
];

type TeacherTab = "aulas" | "conteudos" | "alunos";

const ClassroomPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [classroom, setClassroom] = useState<Tables<"classrooms"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<TeacherTab>("aulas");
  const [lessons, setLessons] = useState<Tables<"lessons">[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const isTeacher = profile?.role === "teacher";
  const variant = isTeacher ? "teacher" : "student";
  const backPath = isTeacher ? "/dashboard" : "/aluno";

  useEffect(() => {
    const fetchClassroom = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from("classrooms")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) setNotFound(true);
      else setClassroom(data);
      setLoading(false);
    };
    fetchClassroom();
  }, [id]);

  const fetchLessons = useCallback(async () => {
    if (!id) return;
    setLessonsLoading(true);
    let query = supabase
      .from("lessons")
      .select("*")
      .eq("classroom_id", id)
      .order("lesson_date", { ascending: true });
    if (!isTeacher) {
      query = query.eq("is_visible" as any, true);
    }
    const { data } = await query;
    setLessons(data ?? []);
    setLessonsLoading(false);
  }, [id, isTeacher]);

  useEffect(() => {
    if (!id) return;
    // Fetch lessons for both teacher (aulas tab) and student view
    if (isTeacher ? activeTab === "aulas" : true) {
      fetchLessons();
    }
  }, [id, isTeacher, activeTab, fetchLessons]);

  const handleToggleVisibility = async (lesson: Tables<"lessons">) => {
    const currentVisible = (lesson as any).is_visible !== false;
    const { error } = await supabase.from("lessons").update({ is_visible: !currentVisible } as any).eq("id", lesson.id);
    if (error) {
      toast({ title: "Erro ao alterar visibilidade", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: currentVisible ? "Aula ocultada" : "Aula visível" });
    fetchLessons();
  };

  const handleDeleteLesson = async (lessonId: string) => {
    const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
    if (error) {
      toast({ title: "Erro ao excluir aula", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Aula excluída" });
    fetchLessons();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen" style={{ background: "#141414" }}>
        <AppSidebar variant={variant} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (notFound || !classroom) {
    return (
      <div className="flex min-h-screen" style={{ background: "#141414" }}>
        <AppSidebar variant={variant} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Turma não encontrada</p>
        </div>
      </div>
    );
  }

  const color = classroom.color || "#e50914";

  const teacherTabs: { key: TeacherTab; label: string }[] = [
    { key: "aulas", label: "Aulas" },
    { key: "conteudos", label: "Conteúdos" },
    { key: "alunos", label: "Alunos" },
  ];

  return (
    <div className="flex min-h-screen" style={{ background: "#141414" }}>
      <AppSidebar variant={variant} />
      <main className="flex-1 overflow-y-auto">
        <div className="h-1 w-full" style={{ background: color }} />

        <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
          {/* Back */}
          <button
            onClick={() => navigate(backPath)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>

          {/* Header */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{classroom.icon || "📚"}</span>
              <h1 className="font-display text-[2rem] leading-tight tracking-wide text-foreground">
                {classroom.name}
              </h1>
            </div>
            <span
              className="inline-block text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm"
              style={{ background: color + "22", color }}
            >
              {classroom.subject}
            </span>
            {classroom.description && (
              <p className="text-sm text-muted-foreground max-w-xl">{classroom.description}</p>
            )}
          </div>

          {/* TEACHER: Tabs */}
          {isTeacher && (
            <div className="flex gap-6 border-b border-border/60">
              {teacherTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`pb-2.5 text-sm font-semibold transition-colors ${
                    activeTab === tab.key
                      ? "text-foreground border-b-2"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  style={activeTab === tab.key ? { borderColor: "#e50914" } : undefined}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* TEACHER TAB CONTENT */}
          {isTeacher && activeTab === "aulas" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Aulas</h2>
                <button
                  onClick={() => setCreateOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:opacity-90"
                  style={{ background: "#e50914" }}
                >
                  <Plus className="h-3.5 w-3.5" /> Nova Aula
                </button>
              </div>
              {lessonsLoading ? (
                <p className="text-muted-foreground text-sm">Carregando aulas...</p>
              ) : lessons.length === 0 ? (
                <div
                  className="rounded-lg border px-4 py-8 text-center"
                  style={{ background: "#1a1a1a", borderColor: "#2a2a2a" }}
                >
                  <p className="text-xs text-muted-foreground">Nenhuma aula criada ainda</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {lessons.map((lesson) => (
                    <LessonCard
                      key={lesson.id}
                      lesson={lesson}
                      color={color}
                      showDelete
                      showVisibility
                      onClick={() => navigate(`/turma/${id}/aula/${lesson.id}`)}
                      onDelete={() => handleDeleteLesson(lesson.id)}
                      onToggleVisibility={() => handleToggleVisibility(lesson)}
                    />
                  ))}
                </div>
              )}
              <CreateLessonDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                classroomId={id!}
                nextOrder={lessons.length + 1}
                onCreated={fetchLessons}
              />
            </div>
          )}

          {isTeacher && activeTab === "conteudos" && (
            <div className="space-y-6">
              {contentSections.map((section) => (
                <div key={section.title}>
                  <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <span>{section.icon}</span> {section.title}
                  </h2>
                  <div
                    className="rounded-lg border border-border/60 px-4 py-6 text-center"
                    style={{ background: "#1a1a1a" }}
                  >
                    <p className="text-xs text-muted-foreground">Nenhum conteúdo disponível ainda</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isTeacher && activeTab === "alunos" && (
            <StudentsList classroomId={id!} />
          )}

          {/* STUDENT VIEW: Lessons list (no tabs) */}
          {!isTeacher && (
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Aulas</h2>
              {lessonsLoading ? (
                <p className="text-muted-foreground text-sm">Carregando aulas...</p>
              ) : lessons.length === 0 ? (
                <div
                  className="rounded-lg border px-4 py-8 text-center"
                  style={{ background: "#1a1a1a", borderColor: "#2a2a2a" }}
                >
                  <p className="text-xs text-muted-foreground">Nenhuma aula disponível ainda</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {lessons.map((lesson) => (
                    <LessonCard
                      key={lesson.id}
                      lesson={lesson}
                      color={color}
                      onClick={() => navigate(`/turma/${id}/aula/${lesson.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ClassroomPage;
