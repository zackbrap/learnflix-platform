import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PlayCircle, GraduationCap, BookOpen } from "lucide-react";
import { toast } from "sonner";

type AuthMode = "login" | "register";
type Role = "teacher" | "student";

const Auth = () => {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const defaultMode = params.get("mode") === "register" ? "register" : "login";
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // Fetch profile to redirect based on role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (profile?.role === "teacher") {
          navigate("/dashboard");
        } else {
          navigate("/aluno");
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role },
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu email para confirmar.");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden">
      {/* Red glow effects */}
      <div
        className="pointer-events-none absolute top-0 left-0 w-[600px] h-[600px] animate-pulse-glow"
        style={{
          background: "radial-gradient(ellipse at 0% 0%, hsl(357 91% 47% / 0.12) 0%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 w-[600px] h-[600px] animate-pulse-glow"
        style={{
          background: "radial-gradient(ellipse at 100% 100%, hsl(357 91% 47% / 0.12) 0%, transparent 70%)",
          animationDelay: "2s",
        }}
      />

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="rounded-lg border border-border bg-card p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <PlayCircle className="h-8 w-8 text-primary" />
            <h1 className="font-display text-4xl tracking-wider text-primary">
              LEARNFLIX
            </h1>
          </div>
          <p className="text-center text-muted-foreground mb-8">
            Aprenda no seu ritmo
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <input
                    type="text"
                    placeholder="Nome completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>

                {/* Role selector */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("teacher")}
                    className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all ${
                      role === "teacher"
                        ? "border-primary bg-primary/10"
                        : "border-border bg-secondary hover:border-muted-foreground/30"
                    }`}
                  >
                    <BookOpen
                      className={`h-6 w-6 ${role === "teacher" ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        role === "teacher" ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      Professor
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("student")}
                    className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all ${
                      role === "student"
                        ? "border-primary bg-primary/10"
                        : "border-border bg-secondary hover:border-muted-foreground/30"
                    }`}
                  >
                    <GraduationCap
                      className={`h-6 w-6 ${role === "student" ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        role === "student" ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      Aluno
                    </span>
                  </button>
                </div>
              </>
            )}

            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Carregando..." : mode === "login" ? "Entrar" : "Criar conta"}
            </button>

            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="w-full rounded-lg border border-border py-3 font-semibold text-muted-foreground transition-all hover:text-foreground hover:border-muted-foreground/50"
            >
              {mode === "login" ? "Criar conta" : "Já tenho conta"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
