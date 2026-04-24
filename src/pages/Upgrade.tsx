// Redeploy trigger
import { useSearchParams } from 'react-router-dom';
import { Trophy, Lock } from 'lucide-react';

export default function Upgrade() {
  const WHATSAPP_NUMBER = '5513981630304';
  const [searchParams] = useSearchParams();
  
  const isNovo = searchParams.get('novo') === 'true';

  const content = {
    icon: isNovo ? <Trophy size={64} /> : <Lock size={64} />,
    title: isNovo ? "Escolha seu plano" : "Seu plano expirou",
    subtitle: isNovo 
      ? "Acesse todas as métricas da sua squad com um plano CTracker." 
      : "Renove sua assinatura para continuar acessando as métricas avançadas e o dashboard completo da sua squad.",
    button: isNovo ? "Assinar via WhatsApp" : "Renovar agora via WhatsApp",
    message: isNovo 
      ? 'Olá! Quero conhecer os planos e assinar o Celo Tracker.' 
      : 'Olá! Meu plano expirou e quero renovar meu acesso ao Celo Tracker.'
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0F0F0F',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontFamily: "'Inter', sans-serif",
      padding: '2rem'
    }}>
      {/* Icon Section */}
      <div style={{ 
        marginBottom: '1.5rem',
        filter: 'drop-shadow(0 0 20px rgba(124, 58, 237, 0.3))',
        color: '#7C3AED'
      }}>
        {content.icon}
      </div>

      <h1 style={{ 
        fontSize: '2rem', 
        fontWeight: 800,
        marginBottom: '1rem',
        textAlign: 'center',
        background: 'linear-gradient(to bottom, #FFFFFF, #9CA3AF)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        {content.title}
      </h1>

      <p style={{ 
        color: '#9CA3AF', 
        marginBottom: '2.5rem', 
        textAlign: 'center',
        maxWidth: '400px',
        lineHeight: 1.6
      }}>
        {content.subtitle}
      </p>
      
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(content.message)}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          background: '#7C3AED',
          color: '#fff',
          padding: '1rem 2.5rem',
          borderRadius: '12px',
          textDecoration: 'none',
          fontWeight: 700,
          fontSize: '1rem',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.4)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 15px 30px -5px rgba(124, 58, 237, 0.5)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(124, 58, 237, 0.4)';
        }}
      >
        <span>{content.button}</span>
      </a>

      <button
        onClick={() => window.history.back()}
        style={{
          marginTop: '1.5rem',
          background: 'none',
          border: 'none',
          color: '#6B7280',
          fontSize: '0.875rem',
          fontWeight: 600,
          cursor: 'pointer',
          textDecoration: 'underline'
        }}
      >
        Voltar
      </button>
    </div>
  );
}
