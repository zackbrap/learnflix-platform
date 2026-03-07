import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppSidebar from "@/components/AppSidebar";
import { ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

interface Student {
  id: string;
  student_name: string;
  joined_at: string;
  user_id: string;
}

const ClassroomPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [classroom, setClassroom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<"conteudos" | "alunos">("conteudos");
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const isTeacher = profile?.role === "teacher";
  const variant = isTeacher ? "teacher" : "student";
  const backPath = isTeacher ? "/dashboard" : "/aluno";

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from("classrooms")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) {
        setNotFound(true);
      } else {
        setClassroom(data);
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  useEffect(() => {
    if (!isTeacher || activeTab !== "alunos" || !id) return;
    const fetchStudents = async () => {
      setStudentsLoading(true);
      const { data } = await supabase
        .from("classroom_students")
        .select("id, student_name, joined_at, user_id")
        .eq("classroom_id", id)
        .order("joined_at", { ascending: true });
      setStudents(data ?? []);
      setStudentsLoading(false);
    };
    fetchStudents();
  }, [isTeacher, activeTab, id]);

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

  if (notFound) {
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

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="flex min-h-screen" style={{ background: "#141414" }}>
      <AppSidebar variant={variant} />
      <main className="flex-1 overflow-y-auto">
        {/* Color bar */}
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
              <p className="text-sm text-muted-foreground max-w-xl">
                {classroom.description}
              </p>
            )}
          </div>

          {/* Tabs (teacher only) */}
          {isTeacher && (
            <div className="flex gap-6 border-b border-border/60">
              {[
                { key: "conteudos" as const, label: "Conteúdos" },
                { key: "alunos" as const, label: "Alunos" },
              ].map((tab) => (
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

          {/* Content */}
          {activeTab === "conteudos" || !isTeacher ? (
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
                    <p className="text-xs text-muted-foreground">
                      Nenhum conteúdo disponível ainda
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {studentsLoading ? (
                <p className="text-muted-foreground text-sm">Carregando alunos...</p>
              ) : students.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum aluno inscrito ainda</p>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground font-medium">
                    {students.length} aluno{students.length !== 1 ? "s" : ""} matriculado{students.length !== 1 ? "s" : ""}
                  </p>
                  <div className="space-y-2">
                    {students.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center gap-3 rounded-lg border border-border/60 px-4 py-3"
                        style={{ background: "#1a1a1a" }}
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarFallback style={{ background: "#2a2a2a" }} className="text-xs font-bold text-foreground">
                            {getInitials(s.student_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{s.student_name}</p>
                          <p className="text-xs text-muted-foreground">Entrou em {formatDate(s.joined_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ClassroomPage;
