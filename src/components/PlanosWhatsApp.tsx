import React from 'react';
import { MessageCircle, ShieldCheck } from 'lucide-react';

interface PlanosWhatsAppProps {
  className?: string;
}

const WppIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const FeatureItem = ({ text }: { text: string }) => (
  <li style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.86rem', color: '#9ca3af', padding: '0.35rem 0' }}>
    <CheckIcon />
    {text}
  </li>
);

export const PlanosWhatsApp: React.FC<PlanosWhatsAppProps> = ({ className = '' }) => {
  const WHATSAPP_NUMBER = '5513981630304';

  const handlePlanClick = (text: string) => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className={`w-full max-w-5xl mx-auto px-6 py-12 ${className}`}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
          padding: '0.28rem 0.9rem', borderRadius: '100px',
          fontSize: '0.72rem', fontWeight: 700, color: '#a78bfa',
          letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '1rem'
        }}>
          PLANOS
        </div>
        <h2 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 'clamp(1.8rem, 3vw, 2.8rem)',
          fontWeight: 800, lineHeight: 1.1, letterSpacing: '-1px',
          color: '#f1f0ff', marginBottom: '0.8rem'
        }}>
          Simples. <span style={{ color: '#a78bfa' }}>Sem enrolação.</span>
        </h2>
        <p style={{ color: '#9ca3af', fontSize: '0.95rem', lineHeight: 1.75, maxWidth: '420px', margin: '0 auto' }}>
          Começa de graça e cresce conforme sua squad evolui. Ativação via WhatsApp na hora.
        </p>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.4rem' }}>

        {/* CARD 1 — GRATUITO */}
        <div style={{
          background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '20px', padding: '2.5rem 2rem', textAlign: 'left', transition: 'transform .3s',
          display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '.72rem', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#6b7280', marginBottom: '.9rem' }}>
            GRATUITO
          </div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '3rem', fontWeight: 800, lineHeight: 1, marginBottom: '.3rem', color: '#f1f0ff' }}>
            R$0 <span style={{ fontSize: '.82rem', color: '#6b7280', fontWeight: 400 }}>/ para sempre</span>
          </div>
          <div style={{ minHeight: '1.4rem', marginBottom: '1.8rem' }} />
          <ul style={{ listStyle: 'none', marginBottom: '2rem', flex: 1 }}>
            <FeatureItem text="4 leituras automáticas via OCR" />
            <FeatureItem text="Acesso limitado às métricas" />
            <FeatureItem text="Dashboard básico da squad" />
            <FeatureItem text="Link público da squad" />
          </ul>

        </div>

        {/* CARD 2 — MODO COMPETITIVO */}
        <div style={{
          background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '20px', padding: '2.5rem 2rem', textAlign: 'left', transition: 'transform .3s',
          display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '.72rem', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#6b7280', marginBottom: '.9rem' }}>
            MODO COMPETITIVO
          </div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '3rem', fontWeight: 800, lineHeight: 1, marginBottom: '.3rem', color: '#f1f0ff' }}>
            R$10 <span style={{ fontSize: '.82rem', color: '#6b7280', fontWeight: 400 }}>/ semana</span>
          </div>
          <div style={{ minHeight: '1.4rem', marginBottom: '1.8rem' }} />
          <ul style={{ listStyle: 'none', marginBottom: '2rem', flex: 1 }}>
            <FeatureItem text="Leituras ilimitadas via OCR" />
            <FeatureItem text="Dashboard completo da squad" />
            <FeatureItem text="Filtros por liga e data" />
            <FeatureItem text="Link público da squad" />
            <FeatureItem text="Suporte via WhatsApp" />
          </ul>
          <button
            onClick={() => handlePlanClick('Olá! Quero o plano Semanal do Celo Tracker!')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.55rem',
              width: '100%', padding: '.9rem', borderRadius: '10px', border: 'none',
              background: '#25d366', color: '#fff',
              fontFamily: "'Inter', sans-serif", fontSize: '.9rem', fontWeight: 700,
              cursor: 'pointer', transition: 'all .2s'
            }}
          >
            <WppIcon />
            Quero o plano
          </button>
        </div>

        {/* CARD 3 — ELITE SQUAD */}
        <div style={{
          background: 'rgba(255,255,255,0.025)', border: '1px solid #7c3aed',
          borderRadius: '20px', padding: '2.5rem 2rem', textAlign: 'left',
          position: 'relative', boxShadow: '0 0 50px rgba(124,58,237,0.12)',
          transition: 'transform .3s', display: 'flex', flexDirection: 'column'
        }}>
          <div style={{
            position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
            background: 'linear-gradient(90deg,#7c3aed,#9333ea)', color: '#fff',
            fontSize: '.68rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase',
            padding: '.28rem 1.1rem', borderRadius: '100px', whiteSpace: 'nowrap'
          }}>
            MAIS POPULAR
          </div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '.72rem', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#6b7280', marginBottom: '.9rem' }}>
            ELITE SQUAD
          </div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '3rem', fontWeight: 800, lineHeight: 1, marginBottom: '.3rem', color: '#f1f0ff' }}>
            R$25 <span style={{ fontSize: '.82rem', color: '#6b7280', fontWeight: 400 }}>/ mês</span>
          </div>
          <div style={{ fontSize: '.78rem', fontWeight: 600, color: '#22c55e', marginBottom: '1.8rem' }}>
            Economize R$15 vs semanal
          </div>
          <ul style={{ listStyle: 'none', marginBottom: '2rem', flex: 1 }}>
            <FeatureItem text="Tudo do Modo Competitivo" />
            <FeatureItem text="Histórico completo de campeonatos" />
            <FeatureItem text="Relatório de rodadas detalhado" />
            <FeatureItem text="Suporte prioritário" />
            <FeatureItem text="Cupom de afiliado exclusivo (20%)" />
          </ul>
          <button
            onClick={() => handlePlanClick('Olá! Quero o plano Elite Squad do Celo Tracker!')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.55rem',
              width: '100%', padding: '.9rem', borderRadius: '10px', border: 'none',
              background: 'linear-gradient(135deg,#7c3aed,#9333ea)', color: '#fff',
              fontFamily: "'Inter', sans-serif", fontSize: '.9rem', fontWeight: 700,
              cursor: 'pointer', transition: 'all .2s'
            }}
          >
            <WppIcon />
            Quero o plano
          </button>
        </div>

      </div>

      {/* Footer */}
      <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap', opacity: 0.4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={16} color="#fff" />
          <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#fff' }}>Protocolo Seguro</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageCircle size={16} color="#fff" />
          <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#fff' }}>WhatsApp Sync</span>
        </div>
      </div>

    </div>
  );
};
