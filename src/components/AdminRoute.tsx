import React from 'react';
import { useAdminAuth } from '../hooks/useAdminAuth';

// Componente de Rota Protegida para Administradores
export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, loading } = useAdminAuth();

  // Admin confirmado (cache ou banco) — renderiza imediatamente sem aguardar loading
  if (isAdmin) {
    return <>{children}</>;
  }

  // Ainda verificando credenciais
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-main)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-primary)',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-4 border-[var(--accent)] border-t-transparent animate-spin rounded-full" />
          <p className="text-xs font-black uppercase tracking-widest opacity-50">
            Validando Credenciais Celo Master...
          </p>
        </div>
      </div>
    );
  }

  // Não é admin e não está carregando — o hook já redirecionou
  return null;
};
