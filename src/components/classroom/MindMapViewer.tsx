import { useState, useCallback, useRef, useEffect } from "react";
import { ArrowLeft, Save, Loader2, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import MindMapEditor from "./MindMapEditor";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import type { Node, Edge } from "@xyflow/react";

interface MindMapViewerProps {
  content: Tables<"contents">;
  onBack: () => void;
  isTeacher?: boolean;
}

export default function MindMapViewer({ content, onBack, isTeacher = false }: MindMapViewerProps) {
  const { user } = useAuth();
  const [mapNodes, setMapNodes] = useState<Node[]>([]);
  const [mapEdges, setMapEdges] = useState<Edge[]>([]);
  const [savingMap, setSavingMap] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (content.data) {
      const d = content.data as any;
      if (d.nodes) setMapNodes(d.nodes);
      if (d.edges) setMapEdges(d.edges);
    }
    // Load notes
    if (user) {
      supabase
        .from("content_notes")
        .select("note")
        .eq("content_id", content.id)
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.note) setNotes(data.note);
        });
    }
  }, [content, user]);

  const handleMapChange = useCallback((nodes: Node[], edges: Edge[]) => {
    setMapNodes(nodes);
    setMapEdges(edges);
  }, []);

  const saveMap = async () => {
    setSavingMap(true);
    const { error } = await supabase
      .from("contents")
      .update({ data: { nodes: mapNodes, edges: mapEdges } as any })
      .eq("id", content.id);
    setSavingMap(false);
    if (error) { toast({ title: "Erro ao salvar mapa", variant: "destructive" }); return; }
    toast({ title: "Mapa mental salvo!" });
  };

  const saveNotes = async () => {
    if (!user) return;
    setSavingNotes(true);
    const { data: existing } = await supabase
      .from("content_notes")
      .select("id")
      .eq("content_id", content.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from("content_notes").update({ note: notes }).eq("id", existing.id);
    } else {
      await supabase.from("content_notes").insert({ content_id: content.id, user_id: user.id, note: notes });
    }
    setSavingNotes(false);
    toast({ title: "Anotações salvas!" });
  };

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
          <h1 className="text-lg font-extrabold text-foreground truncate">{content.title}</h1>
          <div className="flex items-center gap-2">
            {isTeacher && (
              <Button onClick={saveMap} disabled={savingMap} size="sm" className="gap-2">
                {savingMap ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar
              </Button>
            )}
            <Button onClick={() => setFullscreen(false)} size="sm" variant="outline" className="gap-1">
              <Minimize2 className="h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
        <div className="flex-1">
          <MindMapEditor
            initialNodes={mapNodes.length > 0 ? mapNodes : undefined}
            initialEdges={mapEdges.length > 0 ? mapEdges : undefined}
            readOnly={!isTeacher}
            onChange={handleMapChange}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-foreground">{content.title}</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => setFullscreen(true)} size="sm" variant="outline" className="gap-1">
            <Maximize2 className="h-4 w-4" /> Tela cheia
          </Button>
          {isTeacher && (
            <Button onClick={saveMap} disabled={savingMap} size="sm" className="gap-2">
              {savingMap ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar Mapa
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2" style={{ minHeight: '500px' }}>
          <MindMapEditor
            initialNodes={mapNodes.length > 0 ? mapNodes : undefined}
            initialEdges={mapEdges.length > 0 ? mapEdges : undefined}
            readOnly={!isTeacher}
            onChange={handleMapChange}
          />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-3">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col flex-1 gap-3">
            <h2 className="text-sm font-bold text-card-foreground">📝 Minhas Anotações</h2>
            <p className="text-xs text-muted-foreground">Explore o mapa mental e registre seus insights.</p>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Escreva suas anotações aqui..."
              className="flex-1 min-h-[300px] resize-none text-sm"
            />
            <Button onClick={saveNotes} disabled={savingNotes} className="gap-2 w-full">
              {savingNotes ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar Anotações
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
