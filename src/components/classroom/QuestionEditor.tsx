import { useState } from "react";
import { Plus, Upload, Save, Trash2, GripVertical } from "lucide-react";
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

interface Alternative {
  label: string;
  text: string;
}

interface QuestionItem {
  enunciado: string;
  time: number;
  alternatives: Alternative[];
  correctIndex: number;
}

interface QuestionEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (title: string, questions: QuestionItem[]) => void;
  submitting?: boolean;
  editorTitle: string;
  editorDescription: string;
}

const LABELS = ["A", "B", "C", "D", "E"];

const createEmptyQuestion = (): QuestionItem => ({
  enunciado: "",
  time: 30,
  alternatives: [
    { label: "A", text: "" },
    { label: "B", text: "" },
    { label: "C", text: "" },
    { label: "D", text: "" },
  ],
  correctIndex: 0,
});

const QuestionEditor = ({
  open,
  onOpenChange,
  onSave,
  submitting = false,
  editorTitle,
  editorDescription,
}: QuestionEditorProps) => {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [title, setTitle] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");

  const addQuestion = () => {
    setQuestions([...questions, createEmptyQuestion()]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof QuestionItem, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateAlternative = (qIndex: number, altIndex: number, text: string) => {
    const updated = [...questions];
    const alts = [...updated[qIndex].alternatives];
    alts[altIndex] = { ...alts[altIndex], text };
    updated[qIndex] = { ...updated[qIndex], alternatives: alts };
    setQuestions(updated);
  };

  const addAlternative = (qIndex: number) => {
    const updated = [...questions];
    const alts = updated[qIndex].alternatives;
    if (alts.length >= 5) return;
    const nextLabel = LABELS[alts.length] || String.fromCharCode(65 + alts.length);
    updated[qIndex] = {
      ...updated[qIndex],
      alternatives: [...alts, { label: nextLabel, text: "" }],
    };
    setQuestions(updated);
  };

  const removeAlternative = (qIndex: number, altIndex: number) => {
    const updated = [...questions];
    const alts = updated[qIndex].alternatives.filter((_, i) => i !== altIndex);
    // Re-label
    const relabeled = alts.map((a, i) => ({ ...a, label: LABELS[i] || String.fromCharCode(65 + i) }));
    let correctIdx = updated[qIndex].correctIndex;
    if (altIndex === correctIdx) correctIdx = 0;
    else if (altIndex < correctIdx) correctIdx--;
    updated[qIndex] = { ...updated[qIndex], alternatives: relabeled, correctIndex: Math.min(correctIdx, relabeled.length - 1) };
    setQuestions(updated);
  };

  const setCorrect = (qIndex: number, altIndex: number) => {
    updateQuestion(qIndex, "correctIndex", altIndex);
  };

  const handleImport = () => {
    try {
      const blocks = importText.trim().split(/\n\s*\n/);
      const imported: QuestionItem[] = [];

      for (const block of blocks) {
        const lines = block.trim().split("\n").filter(Boolean);
        if (lines.length < 2) continue;

        const enunciado = lines[0].trim();
        const alternatives: Alternative[] = [];
        let correctIndex = 0;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          const match = line.match(/^([A-E])\)\s*(.*)/i);
          if (match) {
            const isCorrect = line.startsWith("*") || match[2].endsWith("*");
            const text = match[2].replace(/\*$/g, "").trim();
            if (isCorrect) correctIndex = alternatives.length;
            alternatives.push({ label: match[1].toUpperCase(), text });
          }
        }

        if (alternatives.length >= 2) {
          imported.push({ enunciado, time: 30, alternatives, correctIndex });
        }
      }

      if (imported.length === 0) {
        toast({ title: "Nenhuma questão encontrada", description: "Use o formato: Enunciado na primeira linha, alternativas A) B) C) D) nas linhas seguintes. Separe questões com linha em branco.", variant: "destructive" });
        return;
      }

      setQuestions([...questions, ...imported]);
      setImportText("");
      setImportOpen(false);
      toast({ title: `${imported.length} questão(ões) importada(s)` });
    } catch {
      toast({ title: "Erro ao importar", variant: "destructive" });
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast({ title: "Informe o título", variant: "destructive" });
      return;
    }
    const valid = questions.filter((q) => q.enunciado.trim() && q.alternatives.length >= 2 && q.alternatives.every((a) => a.text.trim()));
    if (valid.length === 0) {
      toast({ title: "Adicione pelo menos uma questão completa", variant: "destructive" });
      return;
    }
    onSave(title.trim(), valid);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{ background: "#1a1a1a", borderColor: "#2a2a2a" }}
        className="max-w-2xl max-h-[90vh] flex flex-col"
      >
        <DialogHeader>
          <DialogTitle className="text-foreground">{editorTitle}</DialogTitle>
          <DialogDescription>{editorDescription}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 min-h-0 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Título *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Exercício de Revisão - Unidade 1"
              className="border-border/60 bg-background text-sm"
            />
          </div>

          {/* Import section */}
          <div
            onClick={() => setImportOpen(!importOpen)}
            className="rounded-lg border px-4 py-3 cursor-pointer transition-colors hover:border-muted-foreground/30 flex items-center gap-2"
            style={{ background: "#141414", borderColor: "#2a2a2a" }}
          >
            <Upload className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium" style={{ color: "#10b981" }}>Importar questões em lote</span>
          </div>

          {importOpen && (
            <div
              className="rounded-lg border p-3 space-y-2"
              style={{ background: "#141414", borderColor: "#2a2a2a" }}
            >
              <Label className="text-xs text-muted-foreground">
                Cole as questões (enunciado + alternativas A) B) C) D), separadas por linha em branco). Marque a correta com <span className="font-semibold text-emerald-400">*</span> no início da linha.
              </Label>
              <Textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={"Qual a capital do Brasil?\nA) São Paulo\nB) Rio de Janeiro\n*C) Brasília\nD) Salvador\n\nQuem descobriu o Brasil?\n*A) Cabral\nB) Colombo\nC) Vespúcio\nD) Magalhães"}
                className="border-border/60 bg-background text-sm min-h-[100px]"
              />
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleImport(); }}
                  disabled={!importText.trim()}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50"
                  style={{ background: "#e50914" }}
                >
                  Confirmar
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setImportOpen(false); setImportText(""); }}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border"
                  style={{ borderColor: "#2a2a2a" }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Questions */}
          {questions.length === 0 ? (
            <div
              className="rounded-lg border px-4 py-8 text-center"
              style={{ background: "#141414", borderColor: "#2a2a2a" }}
            >
              <p className="text-sm text-muted-foreground font-medium">Nenhuma questão cadastrada</p>
              <p className="text-xs text-muted-foreground mt-1">Adicione manualmente ou importe em lote</p>
            </div>
          ) : (
            questions.map((q, qIdx) => (
              <div
                key={qIdx}
                className="rounded-lg border p-4 space-y-3"
                style={{ background: "#141414", borderColor: "#2a2a2a" }}
              >
                {/* Question header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">Questão {qIdx + 1}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Tempo (s):</span>
                      <Input
                        type="number"
                        value={q.time}
                        onChange={(e) => updateQuestion(qIdx, "time", parseInt(e.target.value) || 30)}
                        className="w-16 h-7 text-xs text-center border-border/60 bg-background"
                        min={5}
                      />
                    </div>
                    <button
                      onClick={() => removeQuestion(qIdx)}
                      className="text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Enunciado */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">Enunciado</Label>
                  <Textarea
                    value={q.enunciado}
                    onChange={(e) => updateQuestion(qIdx, "enunciado", e.target.value)}
                    placeholder="Digite a pergunta..."
                    className="border-border/60 bg-background text-sm min-h-[80px]"
                  />
                </div>

                {/* Alternatives */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Alternativas (selecione a correta)</Label>
                  {q.alternatives.map((alt, altIdx) => (
                    <div
                      key={altIdx}
                      className="flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors"
                      style={{
                        background: q.correctIndex === altIdx ? "rgba(16, 185, 129, 0.08)" : "#1a1a1a",
                        borderColor: q.correctIndex === altIdx ? "rgba(16, 185, 129, 0.3)" : "#2a2a2a",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setCorrect(qIdx, altIdx)}
                        className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
                        style={{
                          borderColor: q.correctIndex === altIdx ? "#10b981" : "#555",
                          background: q.correctIndex === altIdx ? "#10b981" : "transparent",
                        }}
                      >
                        {q.correctIndex === altIdx && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </button>
                      <span className="text-xs font-bold text-foreground w-4">{alt.label}</span>
                      <Input
                        value={alt.text}
                        onChange={(e) => updateAlternative(qIdx, altIdx, e.target.value)}
                        placeholder={`Alternativa ${alt.label}`}
                        className="flex-1 border-0 bg-transparent text-sm h-7 p-0 focus-visible:ring-0"
                      />
                      {q.alternatives.length > 2 && (
                        <button
                          onClick={() => removeAlternative(qIdx, altIdx)}
                          className="text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}

                  {q.alternatives.length < 5 && (
                    <button
                      onClick={() => addAlternative(qIdx)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mt-1"
                    >
                      <Plus className="h-3 w-3" /> Adicionar alternativa
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom actions */}
        <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: "#2a2a2a" }}>
          <button
            onClick={addQuestion}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-muted-foreground/50"
            style={{ borderColor: "#2a2a2a" }}
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar Questão
          </button>
          <button
            onClick={handleSave}
            disabled={submitting || questions.length === 0}
            className="ml-auto flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50"
            style={{ background: "#e50914" }}
          >
            <Save className="h-3.5 w-3.5" /> {submitting ? "Salvando..." : "Salvar Tudo"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionEditor;
