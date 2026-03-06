import { useNavigate } from "react-router-dom";
import { Users, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Classroom {
  id: string;
  name: string;
  subject: string;
  description: string;
  color: string;
  icon: string;
  invite_code: string;
  invite_active: boolean;
  student_count?: number;
}

interface ClassroomCardProps {
  classroom: Classroom;
  onDelete: (id: string) => void;
}

const ClassroomCard = ({ classroom, onDelete }: ClassroomCardProps) => {
  const navigate = useNavigate();

  const copyInviteLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = window.location.origin + "/convite/" + classroom.invite_code;
    navigator.clipboard.writeText(url);
    toast.success("Link de convite copiado!");
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(classroom.id);
  };

  return (
    <div
      onClick={() => navigate(`/turma/${classroom.id}`)}
      className="group cursor-pointer rounded-lg border transition-transform hover:scale-[1.02]"
      style={{
        background: "#1a1a1a",
        borderColor: "#2a2a2a",
      }}
    >
      {/* Color bar */}
      <div className="h-1 rounded-t-lg" style={{ background: classroom.color }} />

      <div className="p-5">
        {/* Top row */}
        <div className="flex items-center justify-between mb-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-lg"
            style={{ background: classroom.color + "20" }}
          >
            {classroom.icon}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={copyInviteCode}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground hover:bg-foreground/10"
              title="Copiar código de convite"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleDelete}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-red-400 hover:bg-red-400/10"
              title="Excluir turma"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Subject badge */}
        <span
          className="inline-block rounded-full px-2.5 py-0.5 text-[0.7rem] font-medium mb-2"
          style={{
            background: classroom.color + "20",
            color: classroom.color,
          }}
        >
          {classroom.subject}
        </span>

        {/* Name */}
        <h3 className="text-[0.95rem] font-bold text-foreground mb-1">{classroom.name}</h3>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-4 min-h-[2rem]">
          {classroom.description || "Sem descrição"}
        </p>

        {/* Bottom row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{classroom.student_count ?? 0} alunos</span>
          </div>
          <span className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
            Gerenciar →
          </span>
        </div>
      </div>
    </div>
  );
};

export default ClassroomCard;
