import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppSidebar from "@/components/AppSidebar";
import { Users, BookOpen, FileText, Eye, Inbox } from "lucide-react";

const Dashboard = () => {
  const [name, setName] = useState("");

  useEffect(() => {
    const fetchName = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", session.user.id)
          .single();
        if (data) setName(data.full_name);
      }
    };
    fetchName();
  }, []);

  const stats = [
    { label: "Turmas", value: "0", icon: Users },
    { label: "Alunos", value: "0", icon: BookOpen },
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
              Olá, {name || "Professor"}!
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
          <h2 className="font-display text-2xl text-foreground mb-4">Suas Turmas</h2>
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-16">
            <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma turma criada ainda</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
