import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Coletivo } from './pages/Coletivo';
import { InputData } from './pages/InputData';
import { SharedDashboard } from './pages/SharedDashboard';
import { Planos } from './pages/Planos';
import { AdminPanel } from './pages/AdminPanel';

import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/login" element={<Login mode="login" />} />
          <Route path="/register" element={<Login mode="register" />} />
          <Route path="/planos" element={<Planos />} />
          
          {/* Dashboard e Input Principal */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/coletivo" 
            element={
              <ProtectedRoute>
                <Coletivo />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/input" 
            element={
              <ProtectedRoute>
                <InputData />
              </ProtectedRoute>
            } 
          />

          {/* Rotas Administrativas de Acesso Rápido */}
          <Route 
            path="/admin-celo" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin-celo/input" 
            element={
              <ProtectedRoute>
                <InputData />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin-celo/planos" 
            element={
              <ProtectedRoute>
                <Planos />
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

          {/* Links de Compartilhamento */}
          <Route path="/share/:userId" element={<SharedDashboard />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
