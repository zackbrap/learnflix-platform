import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PlayCircle, Home, Users, BarChart3, MessageSquare, Settings, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AppSidebarProps {
  variant: "teacher" | "student";
}

const teacherNav = [
  { title: "Início", icon: Home, path: "/dashboard" },
  { title: "Turmas", icon: Users, path: "/dashboard/turmas" },
  { title: "Estatísticas", icon: BarChart3, path: "/dashboard/estatisticas" },
  { title: "Comunidade", icon: MessageSquare, path: "/dashboard/comunidade" },
  { title: "Configurações", icon: Settings, path: "/dashboard/config" },
];

const studentNav = [
  { title: "Início", icon: Home, path: "/aluno" },
  { title: "Turmas", icon: Users, path: "/aluno/turmas" },
  { title: "Comunidade", icon: MessageSquare, path: "/aluno/comunidade" },
  { title: "Configurações", icon: Settings, path: "/aluno/config" },
];

const AppSidebar = ({ variant }: AppSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<{ full_name: string; role: string } | null>(null);

  const navItems = variant === "teacher" ? teacherNav : studentNav;

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", session.user.id)
          .single();
        if (data) setProfile(data);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-border/60 bg-[hsl(0_0%_4%)] shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-6">
        <PlayCircle className="h-6 w-6 text-primary" />
        <span className="font-display text-2xl tracking-wider text-primary">LEARNFLIX</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.title}
              onClick={() => navigate(item.path)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-border/60 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{profile?.full_name ?? "..."}</p>
            <p className="text-xs text-muted-foreground capitalize">{profile?.role === "teacher" ? "Professor" : "Aluno"}</p>
          </div>
          <button onClick={handleLogout} className="text-muted-foreground hover:text-primary transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
