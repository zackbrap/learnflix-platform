import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppSidebar from "@/components/AppSidebar";
import { Settings, User, Mail, School, Lock, Save } from "lucide-react";
import { toast } from "sonner";

const Configuracoes = () => {
  const { user, profile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [school, setSchool] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setSchool(profile.school || "");
    }
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("O nome não pode estar vazio");
      return;
    }
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim(), school: school.trim() || null })
        .eq("id", user.id);
      if (error) throw error;
      toast.success("Perfil atualizado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar perfil");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("A nova senha deve ter pelo menos 8 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    setSavingPassword(true);
    try {
      // Verify current password by re-signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      });
      if (signInError) {
        toast.error("Senha atual incorreta");
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Senha alterada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar senha");
    } finally {
      setSavingPassword(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar variant={profile?.role === "student" ? "student" : "teacher"} />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="flex items-center gap-3">
            <Settings className="h-7 w-7 text-primary" />
            <h1 className="font-display text-3xl tracking-wide text-foreground">Configurações</h1>
          </div>

          {/* Profile Section */}
          <form onSubmit={handleSaveProfile} className="rounded-lg border border-border bg-card p-6 space-y-5">
            <h2 className="font-semibold text-lg text-foreground flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> Informações do perfil
            </h2>

            <div className="space-y-1">
              <label className="text-sm text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Nome completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Email
              </label>
              <input
                type="email"
                value={user?.email ?? ""}
                disabled
                className={`${inputClass} opacity-60 cursor-not-allowed`}
              />
              <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted-foreground flex items-center gap-1.5">
                <School className="h-3.5 w-3.5" /> Instituição educacional
              </label>
              <input
                type="text"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="Nome da escola ou instituição"
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {savingProfile ? "Salvando..." : "Salvar perfil"}
            </button>
          </form>

          {/* Password Section */}
          <form onSubmit={handleChangePassword} className="rounded-lg border border-border bg-card p-6 space-y-5">
            <h2 className="font-semibold text-lg text-foreground flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" /> Alterar senha
            </h2>

            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Senha atual</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Nova senha</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className={inputClass}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Confirmar nova senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              <Lock className="h-4 w-4" />
              {savingPassword ? "Alterando..." : "Alterar senha"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Configuracoes;
