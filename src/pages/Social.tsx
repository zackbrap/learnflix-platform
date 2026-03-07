import { useAuth } from "@/contexts/AuthContext";
import AppSidebar from "@/components/AppSidebar";
import { MessageSquare, Users, Heart, Share2 } from "lucide-react";

const Social = () => {
  const { profile } = useAuth();

  const features = [
    { icon: MessageSquare, title: "Fórum de discussão", desc: "Troque ideias com outros professores e alunos sobre metodologias e conteúdos." },
    { icon: Users, title: "Grupos de estudo", desc: "Crie ou participe de grupos colaborativos por área de conhecimento." },
    { icon: Heart, title: "Compartilhar materiais", desc: "Publique e descubra materiais didáticos criados pela comunidade." },
    { icon: Share2, title: "Networking", desc: "Conecte-se com educadores de todo o Brasil e compartilhe experiências." },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar variant={profile?.role === "student" ? "student" : "teacher"} />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <MessageSquare className="h-7 w-7 text-primary" />
            <h1 className="font-display text-3xl tracking-wide text-foreground">Comunidade</h1>
          </div>

          <div className="rounded-lg border border-border bg-card p-8 mb-8 text-center">
            <span className="text-5xl mb-4 block">🚀</span>
            <h2 className="font-display text-2xl text-foreground mb-2">Em desenvolvimento</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Estamos construindo um espaço incrível para a comunidade MYZION. Em breve você poderá interagir com outros educadores e alunos.
            </p>
          </div>

          <h3 className="text-lg font-semibold text-foreground mb-4">O que vem por aí</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f) => (
              <div key={f.title} className="rounded-lg border border-border bg-card p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <f.icon className="h-5 w-5 text-primary" />
                  <span className="font-medium text-foreground">{f.title}</span>
                </div>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Social;
