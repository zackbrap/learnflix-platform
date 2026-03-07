import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppSidebar from "@/components/AppSidebar";
import { ArrowLeft } from "lucide-react";

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

const ClassroomPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [classroom, setClassroom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const variant = profile?.role === "teacher" ? "teacher" : "student";
  const backPath = variant === "teacher" ? "/dashboard" : "/aluno";

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
              <h1
                className="font-display text-[2rem] leading-tight tracking-wide text-foreground"
              >
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

          {/* Content sections */}
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
        </div>
      </main>
    </div>
  );
};

export default ClassroomPage;
