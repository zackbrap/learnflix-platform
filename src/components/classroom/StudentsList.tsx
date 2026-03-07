import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Student {
  id: string;
  student_name: string;
  joined_at: string;
  user_id: string;
}

const StudentsList = ({ classroomId }: { classroomId: string }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("classroom_students")
        .select("id, student_name, joined_at, user_id")
        .eq("classroom_id", classroomId)
        .order("joined_at", { ascending: true });
      setStudents(data ?? []);
      setLoading(false);
    };
    fetchStudents();
  }, [classroomId]);

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  };

  if (loading) return <p className="text-muted-foreground text-sm">Carregando alunos...</p>;

  if (students.length === 0) return <p className="text-muted-foreground text-sm">Nenhum aluno inscrito ainda</p>;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground font-medium">
        {students.length} aluno{students.length !== 1 ? "s" : ""} matriculado{students.length !== 1 ? "s" : ""}
      </p>
      <div className="space-y-2">
        {students.map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-3 rounded-lg border border-border/60 px-4 py-3"
            style={{ background: "#1a1a1a" }}
          >
            <Avatar className="h-9 w-9">
              <AvatarFallback style={{ background: "#2a2a2a" }} className="text-xs font-bold text-foreground">
                {getInitials(s.student_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{s.student_name}</p>
              <p className="text-xs text-muted-foreground">Entrou em {formatDate(s.joined_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentsList;
