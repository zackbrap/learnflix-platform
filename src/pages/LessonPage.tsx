import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppSidebar from "@/components/AppSidebar";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import VideoViewer from "@/components/classroom/VideoViewer";
import PdfViewer from "@/components/classroom/PdfViewer";
import PodcastViewer from "@/components/classroom/PodcastViewer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Tables } from "@/integrations/supabase/types";

const contentTypes = [
  { type: "pdf", icon: "📄", label: "PDF" },
  { type: "video", icon: "🎬", label: "Vídeo" },
  { type: "podcast", icon: "🎙️", label: "Podcast" },
  { type: "mindmap", icon: "🗺️", label: "Mapa Mental" },
  { type: "infographic", icon: "🖼️", label: "Infográfico" },
  { type: "flashcard", icon: "🃏", label: "Flashcard" },
  { type: "question", icon: "📝", label: "Questões" },
  { type: "simulado", icon: "📋", label: "Simulado" },
];

const typeLabels: Record<string, { icon: string; label: string }> = {};
contentTypes.forEach((ct) => { typeLabels[ct.type] = { icon: ct.icon, label: ct.label }; });


const LessonPage = () => {
  const { id, lessonId } = useParams<{ id: string; lessonId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isTeacher = profile?.role === "teacher";
  const variant = isTeacher ? "teacher" : "student";

  const [lesson, setLesson] = useState<Tables<"lessons"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [contents, setContents] = useState<Tables<"contents">[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [viewContent, setViewContent] = useState<Tables<"contents"> | null>(null);
  const [activeVideo, setActiveVideo] = useState<Tables<"contents"> | null>(null);
  const [activePdf, setActivePdf] = useState<Tables<"contents"> | null>(null);
  const [activePodcast, setActivePodcast] = useState<Tables<"contents"> | null>(null);

  // Add content form state
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState("");
  const [contentTitle, setContentTitle] = useState("");
  const [contentUrl, setContentUrl] = useState("");
  const [contentData, setContentData] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [classroomColor, setClassroomColor] = useState("#e50914");

  useEffect(() => {
    const fetchLesson = async () => {
      if (!lessonId) return;
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("id", lessonId)
        .single();
      if (error || !data) {
        navigate(`/turma/${id}`);
        return;
      }
      setLesson(data);
      setLoading(false);
    };
    fetchLesson();
  }, [lessonId, id, navigate]);

  useEffect(() => {
    if (!id) return;
    supabase.from("classrooms").select("color").eq("id", id).single().then(({ data }) => {
      if (data?.color) setClassroomColor(data.color);
    });
  }, [id]);

  const fetchContents = useCallback(async () => {
    if (!lessonId) return;
    const { data } = await supabase
      .from("contents")
      .select("*")
      .eq("lesson_id", lessonId)
      .order("order_index", { ascending: true });
    setContents(data ?? []);
  }, [lessonId]);

  useEffect(() => { fetchContents(); }, [fetchContents]);

  const resetForm = () => {
    setStep(1);
    setSelectedType("");
    setContentTitle("");
    setContentUrl("");
    setContentData("");
    setFile(null);
  };

  const sanitizeFileName = (name: string): string => {
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();
  };

  const handleUpload = async (file: File): Promise<string | null> => {
    const safeName = sanitizeFileName(file.name);
    const path = `${lessonId}/${Date.now()}-${safeName}`;

    console.log("Uploading to path:", path);

    const { data, error } = await supabase.storage
      .from("contents")
      .upload(path, file, { upsert: false });
    if (error) {
      console.error("Upload error:", error);
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
      return null;
    }
    const { data: publicData } = supabase.storage
      .from("contents")
      .getPublicUrl(data.path);
    return publicData.publicUrl;
  };

  const handleAddContent = async () => {
    if (!contentTitle.trim() || !lessonId) return;
    setSubmitting(true);

    let finalUrl: string | null = null;

    if ((selectedType === "pdf" || selectedType === "infographic") && file) {
      finalUrl = await handleUpload(file);
      if (!finalUrl) {
        setSubmitting(false);
        return;
      }
    } else if (selectedType === "video" || selectedType === "podcast") {
      finalUrl = contentUrl || null;
    }

    const { error } = await supabase.from("contents").insert({
      lesson_id: lessonId,
      type: selectedType,
      title: contentTitle.trim(),
      url: finalUrl,
      data: contentData ? JSON.parse(contentData) : null,
      order_index: contents.length,
    });

    setSubmitting(false);
    if (error) {
      toast({ title: "Erro ao adicionar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Conteúdo adicionado!" });
    resetForm();
    setAddOpen(false);
    fetchContents();
  };

  const handleDeleteContent = async (contentId: string) => {
    const { error } = await supabase.from("contents").delete().eq("id", contentId);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Conteúdo excluído" });
    fetchContents();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("pt-BR");
  };

  // Group contents by type
  const grouped = contents.reduce<Record<string, Tables<"contents">[]>>((acc, c) => {
    if (!acc[c.type]) acc[c.type] = [];
    acc[c.type].push(c);
    return acc;
  }, {});

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

  const needsFileUpload = selectedType === "pdf" || selectedType === "infographic";
  const needsUrl = selectedType === "video" || selectedType === "podcast";
  const needsTextarea = ["mindmap", "flashcard", "question", "simulado"].includes(selectedType);

  return (
    <div className="flex min-h-screen" style={{ background: "#141414" }}>
      <AppSidebar variant={variant} />
      <main className="flex-1 overflow-y-auto">
        <div className="h-1 w-full" style={{ background: classroomColor }} />
        <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
          {activeVideo ? (
            <VideoViewer
              content={activeVideo}
              onBack={() => setActiveVideo(null)}
            />
          ) : activePdf ? (
            <PdfViewer
              content={activePdf}
              onBack={() => setActivePdf(null)}
            />
          ) : activePodcast ? (
            <PodcastViewer
              content={activePodcast}
              onBack={() => setActivePodcast(null)}
            />
          ) : (
            <>
              <button
                onClick={() => navigate(`/turma/${id}`)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para a turma
              </button>

              {/* Header */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h1 className="font-display text-[2rem] leading-tight tracking-wide text-foreground">
                    {lesson?.title}
                  </h1>
                  {isTeacher && (
                    <button
                      onClick={() => { resetForm(); setAddOpen(true); }}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:opacity-90"
                      style={{ background: "#e50914" }}
                    >
                      <Plus className="h-3.5 w-3.5" /> Adicionar Conteúdo
                    </button>
                  )}
                </div>
                {lesson?.lesson_date && (
                  <p className="text-sm text-muted-foreground">{formatDate(lesson.lesson_date)}</p>
                )}
                {lesson?.description && (
                  <p className="text-sm text-muted-foreground max-w-xl">{lesson.description}</p>
                )}
              </div>

              {/* Content sections */}
              {contents.length === 0 ? (
                <div
                  className="rounded-lg border px-4 py-8 text-center"
                  style={{ background: "#1a1a1a", borderColor: "#2a2a2a" }}
                >
                  <p className="text-xs text-muted-foreground">Nenhum conteúdo adicionado ainda</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(grouped).map(([type, items]) => (
                    <div key={type}>
                      <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                        <span>{typeLabels[type]?.icon || "📎"}</span> {typeLabels[type]?.label || type}
                      </h2>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => item.type === "video" ? setActiveVideo(item) : item.type === "pdf" ? setActivePdf(item) : item.type === "podcast" ? setActivePodcast(item) : setViewContent(item)}
                            className="flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors hover:border-muted-foreground/30"
                            style={{ background: "#1a1a1a", borderColor: "#2a2a2a" }}
                          >
                            <span>{typeLabels[item.type]?.icon || "📎"}</span>
                            <p className="text-sm font-medium text-foreground flex-1 truncate">{item.title}</p>
                            {isTeacher && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteContent(item.id); }}
                                className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Add Content Dialog */}
      <Dialog open={addOpen} onOpenChange={(o) => { if (!o) resetForm(); setAddOpen(o); }}>
        <DialogContent style={{ background: "#1a1a1a", borderColor: "#2a2a2a" }} className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ color: "#e50914" }}>Adicionar Conteúdo</DialogTitle>
            <DialogDescription>
              {step === 1 ? "Escolha o tipo de conteúdo" : `Preencha os dados do ${typeLabels[selectedType]?.label}`}
            </DialogDescription>
          </DialogHeader>

          {step === 1 && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              {contentTypes.map((ct) => (
                <button
                  key={ct.type}
                  onClick={() => { setSelectedType(ct.type); setStep(2); }}
                  className="flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:border-muted-foreground/50"
                  style={{ background: "#141414", borderColor: "#2a2a2a" }}
                >
                  <span className="text-2xl">{ct.icon}</span>
                  <span className="text-xs font-medium text-foreground">{ct.label}</span>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 pt-2">
              <button
                onClick={() => setStep(1)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" /> Voltar
              </button>

              <div className="space-y-1.5">
                <Label className="text-foreground text-xs">Título *</Label>
                <Input
                  value={contentTitle}
                  onChange={(e) => setContentTitle(e.target.value)}
                  placeholder="Título do conteúdo"
                  className="border-border/60 bg-background"
                />
              </div>

              {needsFileUpload && (
                <div className="space-y-1.5">
                  <Label className="text-foreground text-xs">
                    {selectedType === "pdf" ? "Arquivo PDF" : "Imagem"}
                  </Label>
                  <Input
                    type="file"
                    accept={selectedType === "pdf" ? ".pdf" : "image/*"}
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="border-border/60 bg-background"
                  />
                </div>
              )}

              {needsUrl && (
                <div className="space-y-1.5">
                  <Label className="text-foreground text-xs">
                    {selectedType === "video" ? "Link do vídeo (YouTube, etc)" : "Link do podcast"}
                  </Label>
                  <Input
                    value={contentUrl}
                    onChange={(e) => setContentUrl(e.target.value)}
                    placeholder="https://..."
                    className="border-border/60 bg-background"
                  />
                </div>
              )}

              {needsTextarea && (
                <div className="space-y-1.5">
                  <Label className="text-foreground text-xs">Conteúdo (JSON)</Label>
                  <Textarea
                    value={contentData}
                    onChange={(e) => setContentData(e.target.value)}
                    placeholder="Conteúdo em formato JSON"
                    className="border-border/60 bg-background min-h-[100px]"
                  />
                </div>
              )}

              <button
                onClick={handleAddContent}
                disabled={submitting || !contentTitle.trim()}
                className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
                style={{ background: "#e50914" }}
              >
                {submitting ? "Adicionando..." : "Adicionar"}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Content Viewer Dialog */}
      <Dialog open={!!viewContent} onOpenChange={(o) => { if (!o) setViewContent(null); }}>
        <DialogContent style={{ background: "#1a1a1a", borderColor: "#2a2a2a" }} className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">{viewContent?.title}</DialogTitle>
            <DialogDescription>{typeLabels[viewContent?.type || ""]?.label || ""}</DialogDescription>
          </DialogHeader>



          {viewContent?.type === "podcast" && viewContent.url && (
            <audio controls src={viewContent.url} className="w-full" />
          )}

          {viewContent?.type === "infographic" && viewContent.url && (
            <img src={viewContent.url} alt={viewContent.title} className="w-full rounded-lg" />
          )}

          {["mindmap", "flashcard", "question", "simulado"].includes(viewContent?.type || "") && (
            <div className="rounded-lg border px-4 py-8 text-center" style={{ background: "#141414", borderColor: "#2a2a2a" }}>
              <p className="text-sm text-muted-foreground">Em breve</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LessonPage;
