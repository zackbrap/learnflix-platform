import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-muted-foreground">Carregando...</p>
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

export function RoleRoute({ children, role }: { children: React.ReactNode; role: string }) {
  const { profile, loading } = useAuth();
  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-muted-foreground">Carregando...</p>
    </div>
  );
  if (!profile || profile.role !== role) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

export function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-muted-foreground">Carregando...</p>
    </div>
  );
  if (user && profile) {
    return <Navigate to={profile.role === "teacher" ? "/dashboard" : "/aluno"} replace />;
  }
  return <>{children}</>;
}
