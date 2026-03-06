import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const COLORS = [
  "#e50914", "#3b82f6", "#10b981", "#f59e0b",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316",
];

const ICONS = ["📚", "⚖️", "🔬", "🧮", "📖", "🏛️", "💡", "🎯"];

interface CreateClassDialogProps {
  onCreated: () => void;
}

const CreateClassDialog = ({ onCreated }: CreateClassDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState(ICONS[0]);

  const generateCode = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    console.log("Creating classroom, user.id:", user.id);

    const { data, error } = await supabase.from("classrooms").insert({
      name,
      subject,
      description,
      color,
      icon,
      teacher_id: user.id,
      invite_code: generateCode(),
      invite_active: true,
    });

    setLoading(false);
    if (error) {
      toast.error("Erro ao criar turma");
      return;
    }

    toast.success("Turma criada!");
    setOpen(false);
    setName("");
    setSubject("");
    setDescription("");
    setColor(COLORS[0]);
    setIcon(ICONS[0]);
    onCreated();
  };

  const inputClass =
    "w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Nova Turma
        </button>
      </DialogTrigger>
      <DialogContent className="border-border bg-card sm:max-w-md" style={{ background: "#1a1a1a" }}>
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-foreground">Criar nova turma</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Nome da turma *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: Turma A - Manhã"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Disciplina *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              placeholder="Ex: Matemática"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição opcional..."
              rows={2}
              className={inputClass + " resize-none"}
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Cor</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-7 w-7 rounded-full transition-transform hover:scale-110"
                  style={{
                    background: c,
                    outline: color === c ? `2px solid ${c}` : "none",
                    outlineOffset: "2px",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Icon picker */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Ícone</label>
            <div className="flex gap-2">
              {ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className="h-9 w-9 rounded-lg text-lg transition-colors"
                  style={{
                    background: icon === ic ? color + "20" : "transparent",
                    border: icon === ic ? `1px solid ${color}40` : "1px solid transparent",
                  }}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Criando..." : "Criar turma"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateClassDialog;
