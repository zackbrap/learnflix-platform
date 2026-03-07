import { useState, useEffect } from "react";
import { ArrowLeft, ExternalLink, Save, Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import type { Tables } from "@/integrations/supabase/types";

function extractSpotifyEmbedUrl(url: string): string | null {
  // Matches spotify.com/episode/ID or spotify.com/show/ID
  const m = url.match(/open\.spotify\.com\/(episode|show|track|playlist)\/([a-zA-Z0-9]+)/);
  if (m) return `https://open.spotify.com/embed/${m[1]}/${m[2]}?theme=0`;
  return null;
}

interface PodcastViewerProps {
  content: Tables<"contents">;
  onBack: () => void;
}

const PodcastViewer = ({ content, onBack }: PodcastViewerProps) => {
  const { user } = useAuth();
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const spotifyEmbed = content.url ? extractSpotifyEmbedUrl(content.url) : null;

  useEffect(() => {
    if (!user?.id || !content.id) return;
    supabase
      .from("content_notes")
      .select("note")
      .eq("content_id", content.id)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.note) setNote(data.note);
      });
  }, [user?.id, content.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    const { error } = await supabase
      .from("content_notes")
      .upsert(
        { content_id: content.id, user_id: user.id, note, updated_at: new Date().toISOString() },
        { onConflict: "content_id,user_id" }
      );
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Anotações salvas!" });
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar à turma
      </button>

      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl md:text-2xl font-bold text-foreground">
          {content.title}
        </h1>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Flag className="h-3.5 w-3.5" />
            Relatar problema
          </button>
          {content.url && (
            <button
              onClick={() => window.open(content.url!, "_blank")}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              style={{ borderColor: "#2a2a2a" }}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Ouvir no Spotify
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Podcast embed */}
        <div className="flex-1 min-w-0">
          {spotifyEmbed ? (
            <iframe
              src={spotifyEmbed}
              width="100%"
              height="352"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-lg"
              style={{ border: "none" }}
              title="Spotify Player"
            />
          ) : content.url ? (
            <div
              className="rounded-lg border p-6 space-y-4"
              style={{ background: "#1a1a1a", borderColor: "#2a2a2a" }}
            >
              <div className="flex items-center gap-3">
                <span className="text-4xl">🎙️</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{content.title}</p>
                  <p className="text-xs text-muted-foreground">Podcast</p>
                </div>
              </div>
              <audio controls src={content.url} className="w-full" />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum link disponível</p>
          )}
        </div>

        {/* Notes panel */}
        <div
          className="w-full lg:w-80 shrink-0 rounded-lg border p-4 flex flex-col gap-3"
          style={{ background: "#1a1a1a", borderColor: "#2a2a2a" }}
        >
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            📝 Minhas Anotações
          </h3>
          <p className="text-xs text-muted-foreground">
            Pause o podcast e registre seus insights, dúvidas e pontos-chave.
          </p>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Escreva suas anotações aqui..."
            className="flex-1 min-h-[180px] border-border/60 bg-background text-sm resize-none"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 hover:opacity-90"
            style={{ background: "#e50914" }}
          >
            <Save className="h-4 w-4" />
            {saving ? "Salvando..." : "Salvar Anotações"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PodcastViewer;
