import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classroomId: string;
  nextOrder: number;
  onCreated: () => void;
}

const CreateLessonDialog = ({ open, onOpenChange, classroomId, nextOrder, onCreated }: Props) => {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("lessons").insert({
      classroom_id: classroomId,
      title: title.trim(),
      description: description.trim() || null,
      lesson_date: date || null,
      order_index: nextOrder,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao criar aula", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Aula criada!" });
    setTitle("");
    setDate("");
    setDescription("");
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ background: "#1a1a1a", borderColor: "#2a2a2a" }}>
        <DialogHeader>
          <DialogTitle style={{ color: "#e50914" }}>Nova Aula</DialogTitle>
          <DialogDescription>Preencha os dados da aula</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-foreground text-xs">Título da aula *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Introdução ao tema"
              className="border-border/60 bg-background"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-foreground text-xs">Data da aula</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border-border/60 bg-background"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-foreground text-xs">Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição opcional"
              className="border-border/60 bg-background min-h-[80px]"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || !title.trim()}
            className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
            style={{ background: "#e50914" }}
          >
            {loading ? "Criando..." : "Criar aula"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateLessonDialog;
