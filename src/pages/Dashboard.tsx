import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppSidebar from "@/components/AppSidebar";
import ClassroomCard from "@/components/ClassroomCard";
import CreateClassDialog from "@/components/CreateClassDialog";
import { Users, BookOpen, FileText, Eye, Inbox } from "lucide-react";
import { toast } from "sonner";

interface ClassroomWithCount {
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

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [classrooms, setClassrooms] = useState<ClassroomWithCount[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  const fetchClassrooms = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);

    const { data: rooms } = await supabase
      .from("classrooms")
      .select("*")
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false });

    if (!rooms || rooms.length === 0) {
      setClassrooms([]);
      setTotalStudents(0);
      setLoadingData(false);
      return;
    }

    // Fetch student counts per classroom
    const roomIds = rooms.map((r) => r.id);
    const { data: students } = await supabase
      .from("classroom_students")
      .select("classroom_id")
      .in("classroom_id", roomIds);

    const countMap: Record<string, number> = {};
    let total = 0;
    (students ?? []).forEach((s) => {
      countMap[s.classroom_id] = (countMap[s.classroom_id] || 0) + 1;
      total++;
    });

    setClassrooms(
      rooms.map((r) => ({ ...r, student_count: countMap[r.id] || 0 }))
    );
    setTotalStudents(total);
    setLoadingData(false);
  }, [user]);

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("classrooms").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir turma");
      return;
    }
    toast.success("Turma excluída");
    fetchClassrooms();
  };

  const stats = [
    { label: "Turmas", value: String(classrooms.length), icon: Users },
    { label: "Alunos", value: String(totalStudents), icon: BookOpen },
    { label: "Conteúdos", value: "0", icon: FileText },
    { label: "Acessos hoje", value: "0", icon: Eye },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar variant="teacher" />

      <main className="flex-1 overflow-y-auto">
        {/* Hero banner */}
        <div
          className="relative overflow-hidden px-8 py-10"
          style={{
            background: "linear-gradient(135deg, hsl(0 100% 5%), hsl(0 100% 8%), hsl(0 0% 8%))",
          }}
        >
          <div
            className="pointer-events-none absolute -top-20 -right-20 h-[400px] w-[400px] animate-pulse-glow"
            style={{
              background: "radial-gradient(ellipse at 80% 20%, hsl(357 91% 47% / 0.18) 0%, transparent 70%)",
            }}
          />
          <div className="relative z-10">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Painel do Professor
            </span>
            <h1 className="font-display text-5xl text-foreground mt-2">
              Olá, {profile?.full_name || "Professor"}!
            </h1>
            <p className="mt-2 text-muted-foreground max-w-lg">
              Gerencie suas turmas e conteúdos em um só lugar.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="px-8 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-border bg-card p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="font-display text-4xl text-foreground">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Suas Turmas */}
        <div className="px-8 pb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl text-foreground">Suas Turmas</h2>
            <CreateClassDialog onCreated={fetchClassrooms} />
          </div>

          {loadingData ? (
            <div className="flex items-center justify-center rounded-lg border border-border bg-card py-16">
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          ) : classrooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-16">
              <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma turma criada ainda</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {classrooms.map((c) => (
                <ClassroomCard key={c.id} classroom={c} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
