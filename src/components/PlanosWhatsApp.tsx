import React from 'react';
import { Check, MessageCircle, Zap, Shield, Sparkles } from 'lucide-react';

interface PlanosWhatsAppProps {
  className?: string;
}

export const PlanosWhatsApp: React.FC<PlanosWhatsAppProps> = ({ className = '' }) => {
  const WHATSAPP_NUMBER = '5513981630304';
  
  const handlePlanClick = (plano: 'Semanal' | 'Mensal', preco: string) => {
    const text = encodeURIComponent(`Olá! Quero adquirir o plano ${plano} (${preco}) do Celo Tracker!`);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
  };

  return (
    <div className={`w-full max-w-5xl mx-auto px-4 py-12 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        
        {/* Plano Semanal */}
        <div className="group relative flex flex-col p-8 bg-[#141416] border border-white/5 rounded-[32px] transition-all hover:border-white/10 hover:translate-y-[-4px]">
          <div className="mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-4">
              Acesso Rápido
            </span>
            <h3 className="text-2xl font-bold text-white mb-1">Plano Semanal</h3>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-black text-white">R$10</span>
              <span className="text-white/40 text-sm font-medium">/semana</span>
            </div>
          </div>

          <ul className="space-y-4 mb-10 flex-1">
            {[
              'Dashboard Celo Master completo',
              'Histórico de partidas ilimitado',
              'Análise de Radar de habilidades',
              'Leituras de screenshot ilimitadas',
              'Suporte prioritário via WhatsApp'
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-white/60 font-medium">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-white/5 flex items-center justify-center">
                  <Check size={12} className="text-white/80" strokeWidth={3} />
                </div>
                {item}
              </li>
            ))}
          </ul>

          <button 
            onClick={() => handlePlanClick('Semanal', 'R$10/semana')}
            className="w-full py-4 bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-3 border border-white/5 group-hover:border-white/20"
          >
            <MessageCircle size={16} className="text-[#25D366]" />
            Adquirir Semanal
          </button>
        </div>

        {/* Plano Mensal */}
        <div className="group relative flex flex-col p-8 bg-[#18181B] border border-[#facc15]/30 rounded-[32px] transition-all hover:translate-y-[-4px] ring-1 ring-[#facc15]/20 shadow-[0_0_40px_-15px_rgba(250,204,21,0.2)]">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-[#facc15] text-black text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg z-10">
            Mais Popular
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
               <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#facc15]/10 text-[#facc15] text-[10px] font-black uppercase tracking-widest">
                <Sparkles size={10} className="fill-current" />
                Melhor Custo-Benefício
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">Plano Mensal</h3>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-black text-white">R$25</span>
              <span className="text-white/40 text-sm font-medium">/mês</span>
            </div>
            <p className="mt-3 text-[11px] font-bold text-[#facc15] uppercase tracking-wider flex items-center gap-1.5 opacity-90">
              <Shield size={12} /> Economize R$15 escolhendo o mensal
            </p>
          </div>

          <ul className="space-y-4 mb-10 flex-1">
            {[
              'Tudo do Plano Semanal',
              '30 dias de acesso ininterrupto',
              'Prioridade na fila de suporte',
              'Selo de Assinante Master',
              'Ideal para Coaches e Pro Players'
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-white font-medium">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#facc15]/20 flex items-center justify-center">
                  <Check size={12} className="text-[#facc15]" strokeWidth={3} />
                </div>
                {item}
              </li>
            ))}
          </ul>

          <button 
            onClick={() => handlePlanClick('Mensal', 'R$25/mês')}
            className="w-full py-4 bg-[#facc15] hover:bg-[#eab308] text-black text-xs font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-yellow-500/10"
          >
            <Zap size={16} className="fill-current" />
            Quero adquirir o Mensal
          </button>
        </div>

      </div>

      <div className="mt-12 text-center">
        <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] max-w-md mx-auto leading-relaxed">
          Pagamento manual via PIX ou Transferência direto no WhatsApp. Sua assinatura será liberada instantaneamente.
        </p>
      </div>
    </div>
  );
};
