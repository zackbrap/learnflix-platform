import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute, RoleRoute, AuthRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Aluno from "./pages/Aluno";
import JoinClass from "./pages/JoinClass";
import ClassroomPage from "./pages/ClassroomPage";
import LessonPage from "./pages/LessonPage";
import ComingSoon from "./pages/ComingSoon";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function RoleBasedHome() {
  const { profile, loading } = useAuth();
  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-muted-foreground">Carregando...</p>
    </div>
  );
  if (profile?.role === "student") return <Aluno />;
  return <Dashboard />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <RoleRoute role="teacher">
                  <Dashboard />
                </RoleRoute>
              </ProtectedRoute>
            } />
            <Route path="/aluno" element={
              <ProtectedRoute>
                <RoleRoute role="student">
                  <Aluno />
                </RoleRoute>
              </ProtectedRoute>
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <RoleBasedHome />
              </ProtectedRoute>
            } />
            <Route path="/turma/:id" element={
              <ProtectedRoute>
                <ClassroomPage />
              </ProtectedRoute>
            } />
            <Route path="/estatisticas" element={<ProtectedRoute><ComingSoon /></ProtectedRoute>} />
            <Route path="/social" element={<ProtectedRoute><ComingSoon /></ProtectedRoute>} />
            <Route path="/config" element={<ProtectedRoute><ComingSoon /></ProtectedRoute>} />
            <Route path="/convite/:code" element={<JoinClass />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
