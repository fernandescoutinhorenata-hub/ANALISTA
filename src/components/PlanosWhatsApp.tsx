import React from 'react';
import { Check, MessageCircle, Zap, X, Star, TrendingUp } from 'lucide-react';

interface PlanosWhatsAppProps {
  className?: string;
}

export const PlanosWhatsApp: React.FC<PlanosWhatsAppProps> = ({ className = '' }) => {
  const WHATSAPP_NUMBER = '5513981630304';
  
  const handlePlanClick = (plano: string, preco: string) => {
    const text = encodeURIComponent(`Olá! Quero adquirir o plano ${plano} (${preco}) do Celo Tracker!`);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
  };

  const FeatureItem = ({ text, available = true, badge = '' }: { text: string, available?: boolean, badge?: string }) => (
    <li className={`flex items-start gap-3 text-sm transition-opacity ${available ? 'text-[var(--text-secondary)] font-medium' : 'text-[var(--text-tertiary)] opacity-50'}`}>
      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${available ? 'bg-[var(--accent-green-muted)]' : 'bg-white/5'}`}>
        {available ? (
          <Check size={12} className="text-[var(--accent-green)]" strokeWidth={3} />
        ) : (
          <X size={10} className="text-[var(--text-tertiary)]" strokeWidth={3} />
        )}
      </div>
      <div className="flex flex-col">
        <span className="leading-tight">{text}</span>
        {badge && (
          <span className="text-[9px] font-black uppercase tracking-widest text-[var(--accent-amber)] mt-1.5 flex items-center gap-1">
             {badge}
          </span>
        )}
      </div>
    </li>
  );

  return (
    <div className={`w-full max-w-6xl mx-auto px-4 py-8 ${className}`}>
      
      {/* Header Centralizado */}
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[var(--text-primary)]">
          Pare de jogar no <span className="text-[var(--accent-amber)]">achismo.</span>
        </h2>
        <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto opacity-70">
          Transforme seus resultados com análise de dados profissional.
        </p>
        <div className="h-px w-24 bg-[var(--accent-amber)] mx-auto opacity-40 rounded-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        
        {/* PLANO 1: Gratuito */}
        <div className="group relative flex flex-col p-8 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[32px] transition-all hover:bg-[var(--bg-hover)] animate-reveal [animation-delay:100ms]">
          <div className="mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-green-muted)] text-[var(--accent-green)] text-[10px] font-black uppercase tracking-widest mb-4 border border-[var(--accent-green-muted)]">
              GRATUITO
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-black text-[var(--text-primary)]">R$0</span>
              <span className="text-[var(--text-tertiary)] text-sm font-bold uppercase tracking-widest">/ para sempre</span>
            </div>
          </div>

          <ul className="space-y-5 mb-10 flex-1">
            <FeatureItem text="4 leituras automáticas" badge="limite de uso" />
            <FeatureItem text="Acesso limitado às métricas" />
            <FeatureItem text="Preenchimento manual" available={false} />
            <FeatureItem text="Sem radar de habilidades" available={false} />
            <FeatureItem text="Sem suporte prioritário" available={false} />
          </ul>

          <button 
            className="w-full py-4 bg-transparent border-2 border-[var(--border-strong)] hover:border-[var(--text-primary)] text-[var(--text-primary)] text-xs font-black uppercase tracking-widest rounded-2xl transition-all"
          >
            Testar agora
          </button>
        </div>

        {/* PLANO 2: Modo Competitivo */}
        <div className="group relative flex flex-col p-8 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[32px] transition-all hover:bg-[var(--bg-hover)] animate-reveal [animation-delay:200ms]">
          <div className="mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-4 border border-blue-500/20">
              MODO COMPETITIVO
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-black text-[var(--text-primary)]">R$10</span>
              <span className="text-[var(--text-secondary)] text-sm font-bold uppercase tracking-widest opacity-60">/ semana</span>
            </div>
          </div>

          <ul className="space-y-5 mb-10 flex-1">
            <FeatureItem text="Preenchimento automático" />
            <FeatureItem text="Dashboard completo" />
            <FeatureItem text="Radar de habilidades" />
            <FeatureItem text="Agilidade e facilidade" />
            <FeatureItem text="Suporte prioritário via WhatsApp" />
          </ul>

          <button 
            onClick={() => handlePlanClick('Modo Competitivo', 'R$10/semana')}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-[0_4px_16px_rgba(59,130,246,0.2)]"
          >
            Quero subir de nível
          </button>
        </div>

        {/* PLANO 3: Elite Squad (DESTAQUE) */}
        <div className="group relative flex flex-col p-8 bg-[#18181B] border border-[var(--accent-amber)]/40 rounded-[32px] transition-all hover:translate-y-[-8px] scale-105 z-10 animate-reveal [animation-delay:300ms] shadow-[0_20px_50px_-20px_rgba(245,158,11,0.2)]">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-2 bg-[var(--accent-amber)] text-black text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg flex items-center gap-2">
            <Star size={10} fill="black" />
            MAIS POPULAR
          </div>

          <div className="mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-amber)]/10 text-[var(--accent-amber)] text-[10px] font-black uppercase tracking-widest mb-4 border border-[var(--accent-amber)]/20">
               ELITE SQUAD
            </span>
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-4xl font-black text-[var(--text-primary)]">R$25</span>
                <span className="text-[var(--text-tertiary)] text-lg line-through font-bold">R$40</span>
              </div>
              <span className="text-[var(--text-secondary)] text-sm font-bold uppercase tracking-widest opacity-60">/ mês</span>
            </div>
            
            <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--accent-amber)]/5 border border-[var(--accent-amber)]/10">
              <TrendingUp size={14} className="text-[var(--accent-amber)]" />
              <span className="text-[10px] font-black text-[var(--accent-amber)] uppercase tracking-tight">Economize R$15 todo mês</span>
            </div>
          </div>

          <ul className="space-y-5 mb-10 flex-1">
            <FeatureItem text="Preenchimento automático" />
            <FeatureItem text="Prioridade na fila de leituras" />
            <FeatureItem text="Dashboard completo" />
            <FeatureItem text="Radar de habilidades" />
            <FeatureItem text="Agilidade e facilidade" />
            <FeatureItem text="Suporte prioritário via WhatsApp" />
          </ul>

          <button 
            onClick={() => handlePlanClick('Elite Squad', 'R$25/mês')}
            className="w-full py-4 bg-[var(--accent-amber)] hover:bg-[#FACC15] text-black text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-[0_8px_20px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2"
          >
            <Zap size={14} fill="black" />
            Entrar para o Elite
          </button>
        </div>

      </div>

      {/* Rodapé Informativo */}
      <div className="mt-20 pt-8 border-t border-[var(--border-subtle)] flex flex-col md:flex-row items-center justify-center gap-6 opacity-40">
        <div className="flex items-center gap-3">
           <img src="https://logopng.com.br/logos/pix-106.png" alt="PIX" className="h-4 grayscale invert" />
           <MessageCircle size={18} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-center">
          Pagamento via PIX ou Transferência direto no WhatsApp. Sua assinatura é liberada instantaneamente.
        </p>
      </div>
    </div>
  );
};
