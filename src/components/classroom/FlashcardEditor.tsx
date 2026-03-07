import { useState } from "react";
import { Plus, Upload, Save, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface FlashcardItem {
  question: string;
  answer: string;
}

interface FlashcardEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (title: string, cards: FlashcardItem[]) => void;
  initialCards?: FlashcardItem[];
  submitting?: boolean;
}

const FlashcardEditor = ({
  open,
  onOpenChange,
  onSave,
  initialCards = [],
  submitting = false,
}: FlashcardEditorProps) => {
  const [cards, setCards] = useState<FlashcardItem[]>(initialCards);
  const [title, setTitle] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");

  const addCard = () => {
    setCards([...cards, { question: "", answer: "" }]);
  };

  const removeCard = (index: number) => {
    setCards(cards.filter((_, i) => i !== index));
  };

  const updateCard = (index: number, field: "question" | "answer", value: string) => {
    const updated = [...cards];
    updated[index] = { ...updated[index], [field]: value };
    setCards(updated);
  };

  const handleImport = () => {
    try {
      const lines = importText.trim().split("\n").filter(Boolean);
      const imported: FlashcardItem[] = lines.map((line) => {
        const separators = ["\t", ";", " - ", " | "];
        for (const sep of separators) {
          if (line.includes(sep)) {
            const [question, ...rest] = line.split(sep);
            return { question: question.trim(), answer: rest.join(sep).trim() };
          }
        }
        return { question: line.trim(), answer: "" };
      });

      if (imported.length === 0) {
        toast({ title: "Nenhum card encontrado", variant: "destructive" });
        return;
      }

      setCards([...cards, ...imported]);
      setImportText("");
      setImportOpen(false);
      toast({ title: `${imported.length} card(s) importado(s)` });
    } catch {
      toast({ title: "Erro ao importar", variant: "destructive" });
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast({ title: "Informe o título dos flashcards", variant: "destructive" });
      return;
    }
    const valid = cards.filter((c) => c.question.trim() && c.answer.trim());
    if (valid.length === 0) {
      toast({ title: "Adicione pelo menos um card completo", variant: "destructive" });
      return;
    }
    onSave(title.trim(), valid);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{ background: "#1a1a1a", borderColor: "#2a2a2a" }}
        className="max-w-lg max-h-[85vh] flex flex-col"
      >
        <DialogHeader>
          <DialogTitle className="text-foreground">Editor de Flashcards</DialogTitle>
          <DialogDescription>Crie ou importe pares de pergunta e resposta.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 min-h-0 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Título *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Flashcards de Biologia"
              className="border-border/60 bg-background text-sm"
            />
          </div>

          {cards.length === 0 ? (
            <div
              className="rounded-lg border px-4 py-8 text-center"
              style={{ background: "#141414", borderColor: "#2a2a2a" }}
            >
              <p className="text-sm text-muted-foreground font-medium">
                Nenhum flashcard cadastrado
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Adicione manualmente ou importe uma lista
              </p>
            </div>
          ) : (
            cards.map((card, i) => (
              <div
                key={i}
                className="rounded-lg border p-3 space-y-2 relative"
                style={{ background: "#141414", borderColor: "#2a2a2a" }}
              >
                <button
                  onClick={() => removeCard(i)}
                  className="absolute top-2 right-2 text-muted-foreground hover:text-red-500 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Pergunta {i + 1}</Label>
                  <Input
                    value={card.question}
                    onChange={(e) => updateCard(i, "question", e.target.value)}
                    placeholder="Digite a pergunta..."
                    className="border-border/60 bg-background text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Resposta</Label>
                  <Input
                    value={card.answer}
                    onChange={(e) => updateCard(i, "answer", e.target.value)}
                    placeholder="Digite a resposta..."
                    className="border-border/60 bg-background text-sm"
                  />
                </div>
              </div>
            ))
          )

          {/* Import section */}
          {importOpen && (
            <div
              className="rounded-lg border p-3 space-y-2"
              style={{ background: "#141414", borderColor: "#2a2a2a" }}
            >
              <Label className="text-xs text-muted-foreground">
                Cole as linhas (separadas por tab, ; ou |)
              </Label>
              <Textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={"Pergunta 1\tResposta 1\nPergunta 2\tResposta 2"}
                className="border-border/60 bg-background text-sm min-h-[80px]"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleImport}
                  disabled={!importText.trim()}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50"
                  style={{ background: "#e50914" }}
                >
                  Confirmar
                </button>
                <button
                  onClick={() => { setImportOpen(false); setImportText(""); }}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border"
                  style={{ borderColor: "#2a2a2a" }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom actions */}
        <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: "#2a2a2a" }}>
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-muted-foreground/50"
            style={{ borderColor: "#2a2a2a" }}
          >
            <Upload className="h-3.5 w-3.5" /> Importar
          </button>
          <button
            onClick={addCard}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-muted-foreground/50"
            style={{ borderColor: "#2a2a2a" }}
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar Card
          </button>
          <button
            onClick={handleSave}
            disabled={submitting || cards.length === 0}
            className="ml-auto flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50"
            style={{ background: "#e50914" }}
          >
            <Save className="h-3.5 w-3.5" /> {submitting ? "Salvando..." : "Salvar Todos"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FlashcardEditor;
