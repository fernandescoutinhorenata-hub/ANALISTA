import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useSubscription } from './hooks/useSubscription';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Coletivo } from './pages/Coletivo';
import { InputData } from './pages/InputData';
import { Planos } from './pages/Planos';
import { AdminPanel } from './pages/AdminPanel';
import { PublicSquad } from './pages/PublicSquad';
import Quebras from './pages/Quebras';
import Afiliado from './pages/Afiliado';
import { LandingPage } from './pages/LandingPage';

import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { PlanoGuard } from './components/PlanoGuard';
import Upgrade from './pages/Upgrade';

function UpgradeGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { subscription, loading } = useSubscription(user?.id);

  if (loading) return null;

  if (subscription?.ativo) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('celo_referral', ref);
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/login" element={<Login mode="login" />} />
          <Route path="/register" element={<Login mode="register" />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/planos" element={<Planos />} />
          <Route 
            path="/upgrade" 
            element={
              <ProtectedRoute>
                <UpgradeGuard>
                  <Upgrade />
                </UpgradeGuard>
              </ProtectedRoute>
            } 
          />
          
          {/* Acesso Público via Share Token */}
          <Route path="/squad/:token" element={<PublicSquad />} />
          <Route path="/share/:token" element={<PublicSquad />} />
          
          {/* Dashboard e Input Principal - Protegidos por Login E Plano Ativo */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <PlanoGuard>
                  <Dashboard />
                </PlanoGuard>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/coletivo" 
            element={
              <ProtectedRoute>
                <PlanoGuard>
                  <Coletivo />
                </PlanoGuard>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/afiliado" 
            element={
              <ProtectedRoute>
                <PlanoGuard>
                  <Afiliado />
                </PlanoGuard>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/quebras" 
            element={
              <ProtectedRoute>
                <PlanoGuard>
                  <Quebras />
                </PlanoGuard>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analise" 
            element={
              <ProtectedRoute>
                <PlanoGuard>
                  <Dashboard />
                </PlanoGuard>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/input" 
            element={
              <ProtectedRoute>
                <PlanoGuard>
                  <InputData />
                </PlanoGuard>
              </ProtectedRoute>
            } 
          />

          {/* Rotas Administrativas de Acesso Rápido */}
          <Route 
            path="/admin-celo" 
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <Dashboard />
                </AdminRoute>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin-celo/input" 
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <InputData />
                </AdminRoute>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin-celo/planos" 
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <Planos />
                </AdminRoute>
              </ProtectedRoute>
            } 
          />

          {/* Painel Administrativo Mestre (Restrito por Senha) */}
          <Route 
            path="/celo-master" 
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
