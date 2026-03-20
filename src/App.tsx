import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { InputData } from './pages/InputData';
// import { SharedDashboard } from './pages/SharedDashboard';
import { Maintenance } from './pages/Maintenance';
import { Planos } from './pages/Planos';

import { ProtectedRoute } from './components/ProtectedRoute';
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ────── MODO MANUTENÇÃO ATIVO ────── */}
          
          {/* Rotas administrativas permitidas */}
          <Route path="/login" element={<Login mode="login" />} />
          <Route path="/planos" element={<Planos />} />
          
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

          {/* Todas as outras rotas redirecionam para Manutenção */}
          <Route path="*" element={<Maintenance />} />

          {/* ROTAS ORIGINAIS (DESATIVADAS PARA O PÚBLICO)
          <Route path="/register" element={<Login mode="register" />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
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
          <Route path="/share/:userId" element={<SharedDashboard />} />
          */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
