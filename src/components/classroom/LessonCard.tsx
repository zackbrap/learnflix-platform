import { Trash2, Eye, EyeOff } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface LessonCardProps {
  lesson: Tables<"lessons">;
  color: string;
  showDelete?: boolean;
  showVisibility?: boolean;
  onClick: () => void;
  onDelete?: () => void;
  onToggleVisibility?: () => void;
}

const LessonCard = ({ lesson, color, showDelete, showVisibility, onClick, onDelete, onToggleVisibility }: LessonCardProps) => {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("pt-BR");
  };

  const isVisible = (lesson as any).is_visible !== false;

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-4 rounded-lg border px-4 py-4 cursor-pointer transition-colors hover:border-muted-foreground/30 ${!isVisible ? "opacity-50" : ""}`}
      style={{ background: "#1a1a1a", borderColor: "#2a2a2a" }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ background: color }}
      >
        {lesson.order_index ?? "—"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{lesson.title}</p>
        {lesson.lesson_date && (
          <p className="text-xs text-muted-foreground">{formatDate(lesson.lesson_date)}</p>
        )}
        {lesson.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{lesson.description}</p>
        )}
      </div>
      <div className="flex items-center gap-1">
        {showVisibility && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility?.();
            }}
            className={`transition-colors p-1 ${isVisible ? "text-muted-foreground hover:text-green-500" : "text-red-500 hover:text-green-500"}`}
          >
            {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        )}
        {showDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            className="text-muted-foreground hover:text-red-500 transition-colors p-1"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default LessonCard;
