import { useState } from "react";
import { ArrowLeft, Check, X, ChevronRight, RotateCcw } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

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

interface QuestionViewerProps {
  content: Tables<"contents">;
  onBack: () => void;
}

const QuestionViewer = ({ content, onBack }: QuestionViewerProps) => {
  const data = content.data as unknown as { questions: QuestionItem[] } | null;
  const questions = data?.questions ?? [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<(boolean | null)[]>(questions.map(() => null));
  const [finished, setFinished] = useState(false);

  const current = questions[currentIndex];
  const totalCorrect = results.filter((r) => r === true).length;

  const handleSelect = (altIndex: number) => {
    if (revealed) return;
    setSelectedAnswer(altIndex);
  };

  const handleConfirm = () => {
    if (selectedAnswer === null) return;
    setRevealed(true);
    const updated = [...results];
    updated[currentIndex] = selectedAnswer === current.correctIndex;
    setResults(updated);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setRevealed(false);
    } else {
      setFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setRevealed(false);
    setResults(questions.map(() => null));
    setFinished(false);
  };

  if (questions.length === 0) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <div className="rounded-lg border px-4 py-8 text-center" style={{ background: "#1a1a1a", borderColor: "#2a2a2a" }}>
          <p className="text-sm text-muted-foreground">Nenhuma questão encontrada.</p>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="space-y-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <div className="rounded-lg border p-6 text-center space-y-4" style={{ background: "#1a1a1a", borderColor: "#2a2a2a" }}>
          <h2 className="text-xl font-bold text-foreground">Resultado</h2>
          <p className="text-3xl font-bold" style={{ color: "#10b981" }}>
            {totalCorrect} / {questions.length}
          </p>
          <p className="text-sm text-muted-foreground">
            {totalCorrect === questions.length ? "Parabéns! Tudo certo!" : totalCorrect >= questions.length / 2 ? "Bom trabalho!" : "Continue praticando!"}
          </p>
          <button
            onClick={handleRestart}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
            style={{ background: "#e50914" }}
          >
            <RotateCcw className="h-4 w-4" /> Refazer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <span className="text-xs text-muted-foreground font-medium">
          {currentIndex + 1} / {questions.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "#2a2a2a" }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%`, background: "#e50914" }}
        />
      </div>

      <h2 className="text-lg font-bold text-foreground">{content.title}</h2>

      {/* Question */}
      <div className="rounded-lg border p-5 space-y-4" style={{ background: "#1a1a1a", borderColor: "#2a2a2a" }}>
        <p className="text-sm font-medium text-foreground leading-relaxed">{current.enunciado}</p>

        <div className="space-y-2">
          {current.alternatives.map((alt, altIdx) => {
            let borderColor = "#2a2a2a";
            let bg = "#141414";

            if (revealed) {
              if (altIdx === current.correctIndex) {
                borderColor = "rgba(16, 185, 129, 0.5)";
                bg = "rgba(16, 185, 129, 0.08)";
              } else if (altIdx === selectedAnswer) {
                borderColor = "rgba(239, 68, 68, 0.5)";
                bg = "rgba(239, 68, 68, 0.08)";
              }
            } else if (altIdx === selectedAnswer) {
              borderColor = "rgba(229, 9, 20, 0.5)";
              bg = "rgba(229, 9, 20, 0.08)";
            }

            return (
              <button
                key={altIdx}
                onClick={() => handleSelect(altIdx)}
                disabled={revealed}
                className="w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors disabled:cursor-default"
                style={{ background: bg, borderColor }}
              >
                <span className="text-xs font-bold text-muted-foreground w-4">{alt.label}</span>
                <span className="text-sm text-foreground flex-1">{alt.text}</span>
                {revealed && altIdx === current.correctIndex && (
                  <Check className="h-4 w-4 flex-shrink-0" style={{ color: "#10b981" }} />
                )}
                {revealed && altIdx === selectedAnswer && altIdx !== current.correctIndex && (
                  <X className="h-4 w-4 flex-shrink-0" style={{ color: "#ef4444" }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action button */}
      <div className="flex justify-end">
        {!revealed ? (
          <button
            onClick={handleConfirm}
            disabled={selectedAnswer === null}
            className="flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 hover:opacity-90"
            style={{ background: "#e50914" }}
          >
            Confirmar
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
            style={{ background: "#e50914" }}
          >
            {currentIndex < questions.length - 1 ? "Próxima" : "Ver Resultado"} <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default QuestionViewer;
