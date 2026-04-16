

export default function Upgrade() {
  const WHATSAPP_NUMBER = '5513981630304';

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
      {/* Icon/Emoji */}
      <div style={{ 
        fontSize: '4rem', 
        marginBottom: '1.5rem',
        filter: 'drop-shadow(0 0 20px rgba(124, 58, 237, 0.3))'
      }}>
        🔒
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
        Seu plano expirou
      </h1>

      <p style={{ 
        color: '#9CA3AF', 
        marginBottom: '2.5rem', 
        textAlign: 'center',
        maxWidth: '400px',
        lineHeight: 1.6
      }}>
        Renove sua assinatura para continuar acessando as métricas avançadas e o dashboard completo da sua squad.
      </p>
      
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Meu plano expirou e quero renovar meu acesso ao Celo Tracker.')}`}
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
        <span>Renovar agora via WhatsApp</span>
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
