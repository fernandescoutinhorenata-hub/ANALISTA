import React, { useState } from 'react';

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const [senha, setSenha] = useState('');
  const [autenticado, setAutenticado] = useState(false);
  const [erro, setErro] = useState(false);

  // Senha secreta lida das variáveis de ambiente
  const SENHA_SECRETA = import.meta.env.VITE_ADMIN_PASSWORD;

  const handleLogin = () => {
    if (!SENHA_SECRETA) {
      console.error("VITE_ADMIN_PASSWORD não está configurado no .env");
      setErro(true);
      return;
    }
    if (senha === SENHA_SECRETA) {
      setAutenticado(true);
      setErro(false);
    } else {
      setErro(true);
    }
  };

  if (autenticado) return <>{children}</>;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-main)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
      backgroundSize: '40px 40px',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div className="card" style={{ width: 360, padding: 32, textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: 8, fontSize: 20, fontWeight: 700 }}>
          Protocolo Celo Master
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 24 }}>
          Insira a chave de criptografia para acessar o painel restrito.
        </p>
        <input
          type="password"
          className="input-base"
          placeholder="Senha secreta"
          value={senha}
          onChange={e => setSenha(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{ marginBottom: 12, textAlign: 'center' }}
        />
        {erro && (
          <p style={{ color: 'var(--accent-red)', fontSize: 12, marginBottom: 16, fontWeight: 600 }}>
            ACESSO NEGADO: Senha Incorreta.
          </p>
        )}
        <button 
          className="btn-primary" 
          style={{ width: '100%', padding: '14px' }} 
          onClick={handleLogin}
        >
          Autenticar Acesso
        </button>
      </div>
    </div>
  );
};
