import React, { useState } from 'react';
import { Check, Lock, X, CreditCard, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Planos: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPlano, setSelectedPlano] = useState<{nome: string, preco: string} | null>(null);
    const navigate = useNavigate();

    const openModal = (nome: string, preco: string) => {
        setSelectedPlano({ nome, preco });
        setIsModalOpen(true);
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
                { texto: 'Leitura de screenshot (OCR)', check: false },
            ],
            botao: 'Plano atual',
            botaoEstilo: 'btn-ghost opacity-50 cursor-not-allowed w-full',
            popular: false
        },
        {
            id: 'semanal',
            nome: 'Plano Semanal',
            preco: '10',
            badge: '7 dias',
            recursos: [
                { texto: 'Dashboard completo', check: true },
                { texto: 'Histórico de partidas', check: true },
                { texto: 'Radar de habilidades', check: true },
                { texto: 'Inserir dados manualmente', check: true },
                { texto: 'Leitura de screenshot (OCR)', check: true },
            ],
            botao: 'Assinar por R$10',
            botaoEstilo: 'btn-primary w-full',
            popular: false
        },
        {
            id: 'mensal',
            nome: 'Plano Mensal',
            preco: '20',
            badge: 'Mais popular',
            recursos: [
                { texto: 'Dashboard completo', check: true },
                { texto: 'Histórico de partidas', check: true },
                { texto: 'Radar de habilidades', check: true },
                { texto: 'Inserir dados manualmente', check: true },
                { texto: 'Leitura de screenshot (OCR)', check: true },
            ],
            botao: 'Assinar por R$20',
            botaoEstilo: 'btn-primary w-full',
            popular: true
        }
    ];

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-6 md:p-12 font-['Inter',sans-serif]">
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
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Escolha seu plano</h1>
                    <p className="text-[var(--text-secondary)] mt-2">Desbloqueie o poder total da análise de dados.</p>
                </div>
            </header>

            {/* Grid de Planos */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                {planos.map((plano) => (
                    <div 
                        key={plano.id}
                        className={`card relative p-8 flex flex-col transition-all duration-300 hover:translate-y-[-4px] ${plano.popular ? 'border-[var(--accent)] ring-1 ring-[var(--accent-glow)]' : ''}`}
                    >
                        {plano.popular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--accent)] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                {plano.badge}
                            </div>
                        )}
                        {!plano.popular && (
                             <div className="badge badge-purple mb-6 self-start">
                                {plano.badge}
                            </div>
                        )}

                        <div className="mb-8">
                            <h3 className="text-xl font-bold mb-1">{plano.nome}</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-extrabold">R${plano.preco}</span>
                                {plano.id !== 'gratuito' && <span className="text-[var(--text-secondary)] text-sm">/{plano.id === 'semanal' ? 'semana' : 'mês'}</span>}
                            </div>
                        </div>

                        <ul className="space-y-4 mb-10 flex-1">
                            {plano.recursos.map((rec, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                    {rec.check ? (
                                        <Check size={18} className="text-[var(--accent-green)] shrink-0" />
                                    ) : (
                                        <Lock size={18} className="text-[var(--text-tertiary)] shrink-0" />
                                    )}
                                    <span className={`text-sm ${rec.check ? 'text-[var(--text-secondary)]' : 'text-[var(--text-tertiary)]'}`}>
                                        {rec.texto}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <button 
                            className={plano.botaoEstilo}
                            onClick={() => plano.id !== 'gratuito' && openModal(plano.nome, plano.preco)}
                            disabled={plano.id === 'gratuito'}
                        >
                            {plano.botao}
                        </button>
                    </div>
                ))}
            </div>

            {/* Modal PIX */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl w-full max-w-md p-8 relative animate-reveal shadow-2xl">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-[var(--accent-muted)] rounded-full flex items-center justify-center mb-6">
                                <CreditCard size={32} className="text-[var(--accent)]" />
                            </div>
                            
                            <h2 className="text-2xl font-bold mb-2">Pagamento via PIX</h2>
                            <p className="text-[var(--text-secondary)] text-sm mb-8">
                                Você selecionou o <strong>{selectedPlano?.nome}</strong> por <strong>R${selectedPlano?.preco}</strong>.
                            </p>

                            <div className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 rounded-lg mb-8 text-center">
                                <span className="text-label mb-2 block uppercase">Chave PIX</span>
                                <code className="text-[var(--accent)] font-mono text-sm break-all font-bold">
                                    CHAVE_PIX_AQUI
                                </code>
                            </div>

                            <div className="bg-[var(--accent-muted)] p-5 rounded-lg border border-[var(--accent-glow)] text-left mb-8">
                                <p className="text-xs text-[var(--text-primary)] leading-relaxed italic">
                                    "Após o pagamento, envie o comprovante para <strong>@celocoach</strong> no Instagram. Seu plano será ativado em até 2 horas."
                                </p>
                            </div>

                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="btn-primary w-full py-4 text-sm font-bold uppercase tracking-widest"
                            >
                                Entendi, fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
