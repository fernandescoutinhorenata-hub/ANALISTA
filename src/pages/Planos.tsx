import React, { useState } from 'react';
import { Check, Lock, ChevronLeft, Loader2, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const Planos: React.FC = () => {
    const [loadingPlano, setLoadingPlano] = useState<string | null>(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleAssinar = async (planoId: string) => {
        if (!user) {
            navigate('/login');
            return;
        }

        setLoadingPlano(planoId);
        try {
            const { data, error } = await supabase.functions.invoke('create-payment', {
                body: { 
                    plano: planoId, 
                    user_id: user.id, 
                    user_email: user.email 
                }
            });

            if (error) throw error;
            if (data?.init_point) {
                window.location.href = data.init_point;
            } else {
                throw new Error('URL de pagamento não recebida');
            }
        } catch (error: any) {
            console.error('Erro ao processar pagamento:', error);
            alert('Erro ao iniciar checkout: ' + (error.message || 'Tente novamente.'));
        } finally {
            setLoadingPlano(null);
        }
    };

    const planos = [
        {
            id: 'gratuito',
            nome: 'Gratuito',
            preco: '0',
            badge: 'Essencial',
            recursos: [
                { texto: 'Dashboard completo', check: true },
                { texto: 'Histórico de partidas', check: true },
                { texto: 'Radar de habilidades', check: true },
                { texto: 'Inserir dados manualmente', check: true },
                { texto: 'Leitura via IA (OCR)', check: false },
            ],
            botao: 'Plano atual'
        },
        {
            id: 'semanal',
            nome: 'Plano Semanal',
            preco: '10',
            badge: '7 dias de acesso',
            recursos: [
                { texto: 'Dashboard completo', check: true },
                { texto: 'Histórico de partidas', check: true },
                { texto: 'Radar de habilidades', check: true },
                { texto: 'Inserir dados manualmente', check: true },
                { texto: 'Leitura via IA (OCR)', check: true },
            ],
            botao: 'Assinar por R$10'
        },
        {
            id: 'mensal',
            nome: 'Plano Mensal',
            preco: '25',
            badge: '30 dias (Melhor valor)',
            popular: true,
            recursos: [
                { texto: 'Dashboard completo', check: true },
                { texto: 'Histórico de partidas', check: true },
                { texto: 'Radar de habilidades', check: true },
                { texto: 'Inserir dados manualmente', check: true },
                { texto: 'Leitura via IA (OCR)', check: true },
            ],
            botao: 'Assinar por R$25'
        }
    ];

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-6 md:p-12 font-['Inter',sans-serif] animate-reveal">
            {/* Header */}
            <header className="max-w-6xl mx-auto mb-16 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <button 
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-4 text-sm font-medium"
                    >
                        <ChevronLeft size={16} />
                        Voltar
                    </button>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Evolua seu Squad</h1>
                    <p className="text-[var(--text-secondary)] mt-2">Escolha o plano ideal para profissionalizar sua análise.</p>
                </div>
            </header>

            {/* Grid de Planos */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                {planos.map((plano) => (
                    <div 
                        key={plano.id}
                        className={`card relative p-8 flex flex-col transition-all duration-300 hover:translate-y-[-4px] ${plano.popular ? 'border-[var(--accent)] ring-2 ring-[var(--accent-glow)] scale-105 z-10' : ''}`}
                    >
                        {plano.popular && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[var(--accent)] text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-[var(--accent-glow)]">
                                MAIS POPULAR
                            </div>
                        )}
                        
                        <div className="badge badge-purple mb-6 self-start font-bold">
                            {plano.badge}
                        </div>

                        <div className="mb-8">
                            <h3 className="text-xl font-bold mb-1">{plano.nome}</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black">R${plano.preco}</span>
                                {plano.id !== 'gratuito' && <span className="text-[var(--text-secondary)] text-sm">/{plano.id === 'semanal' ? 'semana' : 'mês'}</span>}
                            </div>
                        </div>

                        <ul className="space-y-4 mb-10 flex-1">
                            {plano.recursos.map((rec, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                    {rec.check ? (
                                        <div className="bg-[var(--accent-green-muted)] p-0.5 rounded-full">
                                            <Check size={14} className="text-[var(--accent-green)] shrink-0" strokeWidth={3} />
                                        </div>
                                    ) : (
                                        <Lock size={16} className="text-[var(--text-tertiary)] shrink-0 mt-0.5" />
                                    )}
                                    <span className={`text-sm ${rec.check ? 'text-[var(--text-secondary)] font-medium' : 'text-[var(--text-tertiary)]'}`}>
                                        {rec.texto}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <button 
                            className={`w-full py-4 rounded-xl font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 ${
                                plano.id === 'gratuito' 
                                ? 'bg-[var(--bg-surface)] text-[var(--text-tertiary)] cursor-default' 
                                : 'btn-primary shadow-lg'
                            }`}
                            onClick={() => plano.id !== 'gratuito' && handleAssinar(plano.id)}
                            disabled={plano.id === 'gratuito' || (loadingPlano !== null)}
                        >
                            {loadingPlano === plano.id ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <>
                                    {plano.id !== 'gratuito' && <Zap size={14} className="fill-current" />}
                                    {plano.botao}
                                </>
                            )}
                        </button>
                    </div>
                ))}
            </div>

            {/* Footer Informativo */}
            <div className="max-w-4xl mx-auto mt-20 text-center">
                <p className="text-[var(--text-tertiary)] text-xs leading-relaxed max-w-2xl mx-auto">
                    Pagamento processado com segurança via <strong>Mercado Pago</strong>. 
                    Assinaturas são ativadas instantaneamente após a aprovação do pagamento. 
                    Para dúvidas, entre em contato com o suporte.
                </p>
            </div>
        </div>
    );
};
