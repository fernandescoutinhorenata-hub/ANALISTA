import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Coletivo } from './pages/Coletivo';
import { InputData } from './pages/InputData';
import { Planos } from './pages/Planos';
import { AdminPanel } from './pages/AdminPanel';
import { PublicSquad } from './pages/PublicSquad';
import Quebras from './pages/Quebras';

import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { SubscriberRoute } from './components/SubscriberRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/login" element={<Login mode="login" />} />
          <Route path="/register" element={<Login mode="register" />} />
          <Route path="/planos" element={<Planos />} />
          
          {/* Acesso Público via Share Token */}
          <Route path="/squad/:token" element={<PublicSquad />} />
          
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
            path="/quebras" 
            element={
              <ProtectedRoute>
                <SubscriberRoute>
                  <Quebras />
                </SubscriberRoute>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analise" 
            element={
              <ProtectedRoute>
                <SubscriberRoute>
                  <Dashboard />
                </SubscriberRoute>
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
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
