import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { InputData } from './pages/InputData';
import { SharedDashboard } from './pages/SharedDashboard';

import { ProtectedRoute } from './components/ProtectedRoute';
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login mode="login" />} />
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
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
