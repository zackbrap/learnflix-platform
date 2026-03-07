import { useNavigate } from "react-router-dom";
import { PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const ComingSoon = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center" style={{ background: "#141414" }}>
      <div className="flex items-center gap-2 mb-8">
        <PlayCircle className="h-6 w-6 text-primary" />
        <span className="font-display text-2xl tracking-wider text-primary">MYZION</span>
      </div>
      <span className="text-6xl mb-4">🚧</span>
      <h1 className="font-display text-[2rem] tracking-wide text-foreground mb-2">Em breve</h1>
      <p className="text-sm text-muted-foreground mb-8">Esta funcionalidade está sendo desenvolvida</p>
      <Button variant="outline" onClick={() => navigate(-1)}>Voltar</Button>
    </div>
  );
};

export default ComingSoon;
