import { useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface FlashcardViewerProps {
  content: Tables<"contents">;
  onBack: () => void;
}

interface FlashcardItem {
  question: string;
  answer: string;
}

const FlashcardViewer = ({ content, onBack }: FlashcardViewerProps) => {
  const cards: FlashcardItem[] = (content.data as any)?.cards ?? [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = cards[currentIndex];

  const goNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFlipped(false);
    }
  };

  const restart = () => {
    setCurrentIndex(0);
    setFlipped(false);
  };

  if (cards.length === 0) {
    return (
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <div
          className="rounded-lg border px-4 py-8 text-center"
          style={{ background: "#1a1a1a", borderColor: "#2a2a2a" }}
        >
          <p className="text-sm text-muted-foreground">Nenhum flashcard encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <p className="text-xs text-muted-foreground">
          {currentIndex + 1} / {cards.length}
        </p>
      </div>

      <h2 className="font-display text-lg font-semibold text-foreground">{content.title}</h2>

      {/* Card */}
      <div
        onClick={() => setFlipped(!flipped)}
        className="relative cursor-pointer rounded-xl border p-8 min-h-[280px] flex flex-col items-center justify-center text-center transition-all duration-300 hover:border-muted-foreground/40"
        style={{
          background: flipped ? "#1f2937" : "#1a1a1a",
          borderColor: flipped ? "#374151" : "#2a2a2a",
        }}
      >
        <p className="text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wider">
          {flipped ? "Resposta" : "Pergunta"}
        </p>
        <p className="text-base md:text-lg font-medium text-foreground leading-relaxed max-w-lg">
          {flipped ? card.answer : card.question}
        </p>
        <p className="text-xs text-muted-foreground mt-6">
          {flipped ? "" : "Clique para ver a resposta"}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="rounded-lg border p-2.5 text-foreground transition-colors hover:border-muted-foreground/50 disabled:opacity-30"
          style={{ borderColor: "#2a2a2a" }}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={restart}
          className="rounded-lg border px-4 py-2.5 text-xs font-medium text-foreground transition-colors hover:border-muted-foreground/50 flex items-center gap-1.5"
          style={{ borderColor: "#2a2a2a" }}
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reiniciar
        </button>
        <button
          onClick={goNext}
          disabled={currentIndex === cards.length - 1}
          className="rounded-lg border p-2.5 text-foreground transition-colors hover:border-muted-foreground/50 disabled:opacity-30"
          style={{ borderColor: "#2a2a2a" }}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default FlashcardViewer;
