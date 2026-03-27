import React from 'react';
import { MessageCircle, Zap, X, Star, TrendingUp, Target, ShieldCheck, Activity } from 'lucide-react';

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
    <li className={`flex items-start gap-3 text-[13px] transition-all duration-300 ${available ? 'text-white group-hover:text-white' : 'text-white/30'}`}>
      <div className="mt-1 flex-shrink-0">
        {available ? (
          <div className="w-1.5 h-1.5 bg-[var(--accent-amber)] rotate-45 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
        ) : (
          <X size={12} className="opacity-30" strokeWidth={3} />
        )}
      </div>
      <div className="flex flex-col">
        <span className={`${!available ? 'line-through decoration-white/10' : ''}`}>{text}</span>
        {badge && (
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--accent-amber)] mt-1 opacity-80 group-hover:opacity-100 transition-opacity flex items-center gap-1">
             <Activity size={8} /> {badge}
          </span>
        )}
      </div>
    </li>
  );

  return (
    <div className={`w-full max-w-7xl mx-auto px-6 py-12 select-none ${className}`}>
      
      <div className="relative mb-24 text-center pt-12">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[400px] bg-[radial-gradient(circle,rgba(245,158,11,0.08)_0%,transparent_70%)] pointer-events-none" />
        
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 border border-white/5 bg-white/[0.02] rounded-full backdrop-blur-sm animate-fade">
          <Target size={12} className="text-[var(--accent-amber)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">SQUAD PERFORMANCE HUB</span>
        </div>

        <h2 className="text-5xl md:text-7xl font-[1000] tracking-[-0.04em] text-white leading-[1.1] mb-6">
          PARE DE JOGAR NO <br />
          <span className="inline-block text-transparent bg-clip-text bg-gradient-to-b from-[var(--accent-amber)] to-[#B48A00] py-2">ACHISMO.</span>
        </h2>
        
        <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto font-medium tracking-tight">
          Transforme seus resultados com análise de dados profissional utilizada por Pro Players.
        </p>
        
        <div className="mt-8 flex justify-center gap-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-1 w-8 bg-[var(--accent-amber)] opacity-20 rounded-full" />
          ))}
          <div className="h-1 w-16 bg-[var(--accent-amber)] rounded-full shadow-[0_0_10px_rgba(245,158,11,0.4)]" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-1 w-8 bg-[var(--accent-amber)] opacity-20 rounded-full" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 items-stretch perspective-1000">
        
        {/* CARD 1: Gratuito - Industrial Minimalist */}
        <div className="group relative flex flex-col p-10 bg-[#0C0C10] border border-white/5 hover:border-white/10 rounded-sm transition-all duration-500 animate-reveal [animation-delay:100ms] hover:z-20">
          <div className="mb-12">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--accent-green)] mb-6 flex items-center gap-2">
              <div className="w-1 h-1 bg-[var(--accent-green)] animate-pulse" />
              GRATUITO
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-white tracking-tighter">R$0</span>
              <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">/ para sempre</span>
            </div>
          </div>

          <ul className="space-y-6 mb-12 flex-1 border-t border-white/5 pt-8">
            <FeatureItem text="4 leituras automáticas" badge="limite de uso" />
            <FeatureItem text="Acesso limitado às métricas" />
            <FeatureItem text="Preenchimento manual" available={false} />
            <FeatureItem text="Sem radar de habilidades" available={false} />
            <FeatureItem text="Sem suporte prioritário" available={false} />
          </ul>

          <button className="relative w-full py-4 bg-transparent border border-white/10 hover:border-white text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all overflow-hidden group">
            <div className="absolute inset-0 bg-white/5 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
            <span className="relative">Testar agora</span>
          </button>
        </div>

        {/* CARD 2: Modo Competitivo - Blue Ops */}
        <div className="group relative flex flex-col p-10 bg-[#0E0E14] border border-white/5 hover:border-blue-500/20 rounded-sm transition-all duration-500 animate-reveal [animation-delay:200ms] lg:translate-y-[-10px] hover:z-20">
          <div className="mb-12">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 mb-6 flex items-center gap-2">
               <div className="w-1 h-1 bg-blue-400 animate-pulse" />
               MODO COMPETITIVO
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-white tracking-tighter">R$10</span>
              <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">/ semana</span>
            </div>
          </div>

          <ul className="space-y-6 mb-12 flex-1 border-t border-white/5 pt-8">
            <FeatureItem text="Preenchimento automático" />
            <FeatureItem text="Dashboard completo" />
            <FeatureItem text="Radar de habilidades" />
            <FeatureItem text="Agilidade e facilidade" />
            <FeatureItem text="Suporte prioritário via WhatsApp" />
          </ul>

          <button 
            onClick={() => handlePlanClick('Modo Competitivo', 'R$10/semana')}
            className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(37,99,235,0.2)] hover:shadow-[0_0_40px_rgba(37,99,235,0.4)]"
          >
            Quero subir de nível
          </button>
        </div>

        {/* CARD 3: Elite Squad - GOLDEN MASTER (HIGH TENSION) */}
        <div className="group relative flex flex-col p-10 bg-[#121218] border-2 border-[var(--accent-amber)]/30 scale-105 z-10 transition-all duration-700 animate-reveal [animation-delay:300ms] shadow-[0_0_60px_-15px_rgba(245,158,11,0.25)] lg:translate-y-[-20px] rounded-sm overflow-hidden">
          
          {/* Efeito Visual Interno */}
          <div className="absolute -right-20 -top-20 w-40 h-40 bg-[var(--accent-amber)] opacity-[0.03] blur-[60px] pointer-events-none group-hover:opacity-[0.08] transition-opacity duration-700" />
          
          {/* TOP BADGE - ELITE HUD */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 px-6 py-1 bg-[var(--accent-amber)] text-black text-[9px] font-black uppercase tracking-[0.5em] shadow-lg flex items-center gap-2">
            <Star size={10} fill="black" />
            MAIS POPULAR
          </div>

          <div className="mb-12 mt-4">
             <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--accent-amber)] mb-6 flex items-center gap-2">
               <div className="w-1 h-1 bg-[var(--accent-amber)] animate-pulse" />
               ELITE SQUAD
            </h3>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-4">
                <span className="text-6xl font-[1000] text-white tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">R$25</span>
                <span className="text-white/50 text-xl line-through font-bold italic leading-none">R$40</span>
              </div>
              <span className="text-white/60 text-[10px] font-black uppercase tracking-widest mt-1">/ mês de acesso pleno</span>
            </div>
            
            <div className="mt-8 inline-flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-[var(--accent-amber)]/10 to-transparent border-l-2 border-[var(--accent-amber)] animate-pulse">
              <TrendingUp size={14} className="text-[var(--accent-amber)]" />
              <span className="text-[10px] font-black text-white uppercase tracking-wider">Economize R$15 TODO MÊS</span>
            </div>
          </div>

          <ul className="space-y-6 mb-12 flex-1 border-t border-[var(--accent-amber)]/10 pt-8 relative">
             {/* Decoração Estilo HUD */}
            <div className="absolute top-4 -right-2 w-1 h-16 bg-gradient-to-b from-[var(--accent-amber)]/20 to-transparent flex flex-col gap-1 items-center">
                <div className="w-full h-1 bg-[var(--accent-amber)]/40" />
            </div>

            <FeatureItem text="Preenchimento automático" />
            <FeatureItem text="Prioridade na fila de leituras" />
            <FeatureItem text="Dashboard completo" />
            <FeatureItem text="Radar de habilidades" />
            <FeatureItem text="Agilidade e facilidade" />
            <FeatureItem text="Suporte prioritário via WhatsApp" />
          </ul>

          <button 
            onClick={() => handlePlanClick('Elite Squad', 'R$25/mês')}
            className="w-full py-5 bg-[var(--accent-amber)] hover:bg-[#FFD700] text-black text-[12px] font-black uppercase tracking-[0.3em] transition-all shadow-[0_10px_40px_rgba(245,158,11,0.2)] hover:shadow-[0_15px_50px_rgba(245,158,11,0.4)] flex items-center justify-center gap-3 relative group"
          >
            <Zap size={16} fill="black" />
            <span>Entrar para o Elite</span>
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-black/20" />
          </button>
        </div>

      </div>

      {/* FOOTER HUD */}
      <div className="mt-32 pt-12 border-t border-white/5 flex flex-col items-center gap-10">
        <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-20">
          <div className="flex items-center gap-3 grayscale invert">
            <img src="https://logopng.com.br/logos/pix-106.png" alt="PIX" className="h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">SISTEMA PIX</span>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-white" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white">PROTOCOLO SEGURO</span>
          </div>
          <div className="flex items-center gap-3">
            <MessageCircle size={20} className="text-white" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white">WHATSAPP SYNC</span>
          </div>
        </div>
        
        <div className="relative group cursor-help">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/70 text-center max-w-lg leading-loose group-hover:text-white transition-colors">
            PAGAMENTO VIA PIX OU TRANSFERÊNCIA DIRETO NO WHATSAPP. <br />
            SUA ASSINATURA É LIBERADA INSTANTANEAMENTE PELA CENTRAL CELO.
          </p>
          <div className="absolute -bottom-2 left-0 w-full h-[1px] bg-[var(--accent-amber)] scale-x-0 group-hover:scale-x-50 transition-transform duration-700 mx-auto" />
        </div>
      </div>
    </div>
  );
};
