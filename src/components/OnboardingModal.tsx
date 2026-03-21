import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Trophy, LayoutDashboard, Camera, Check, 
    ChevronRight, ChevronLeft, X
} from 'lucide-react';

export const OnboardingModal: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(1);
    const navigate = useNavigate();

    useEffect(() => {
        const done = localStorage.getItem('onboarding_done');
        if (done !== 'true') {
            setIsOpen(true);
        }
    }, []);

    const handleClose = () => {
        localStorage.setItem('onboarding_done', 'true');
        setIsOpen(false);
    };

    const handleGoToPlans = () => {
        localStorage.setItem('onboarding_done', 'true');
        setIsOpen(false);
        navigate('/admin-celo/planos');
    };

    if (!isOpen) return null;

    const slides = [
        {
            id: 1,
            icon: <Trophy size={48} className="text-[var(--accent)]" />,
            title: "Bem-vindo ao Celo Tracker!",
            content: "A plataforma de análise definitiva para times competitivos de Free Fire. Acompanhe métricas, evolua seu squad e domine o cenário.",
            buttonText: "Próximo",
            showX: false
        },
        {
            id: 2,
            icon: <LayoutDashboard size={48} className="text-[var(--accent)]" />,
            title: "Tudo que você precisa",
            content: (
                <ul className="space-y-3 mt-4 text-left inline-block">
                    <li className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                        <div className="bg-[var(--accent-green-muted)] p-1 rounded-full text-[var(--accent-green)]"><Check size={12} strokeWidth={3} /></div>
                        Dashboard completo com métricas
                    </li>
                    <li className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                        <div className="bg-[var(--accent-green-muted)] p-1 rounded-full text-[var(--accent-green)]"><Check size={12} strokeWidth={3} /></div>
                        Histórico detalhado de partidas
                    </li>
                    <li className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                        <div className="bg-[var(--accent-green-muted)] p-1 rounded-full text-[var(--accent-green)]"><Check size={12} strokeWidth={3} /></div>
                        Radar de habilidades por jogador
                    </li>
                    <li className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                        <div className="bg-[var(--accent-green-muted)] p-1 rounded-full text-[var(--accent-green)]"><Check size={12} strokeWidth={3} /></div>
                        Inserção manual de dados
                    </li>
                </ul>
            ),
            buttonText: "Próximo",
            showX: false
        },
        {
            id: 3,
            icon: <div className="relative">
                    <Camera size={64} className="text-[var(--accent)]" />
                    <div className="absolute -top-2 -right-2 badge badge-purple border border-[var(--accent)] animate-bounce font-bold">PRO</div>
                  </div>,
            title: "Leitura automática via IA",
            content: (
                <div className="p-4 rounded-xl bg-[var(--accent-muted)] border border-[var(--accent-glow)] mt-4">
                    <p className="text-sm text-[var(--text-primary)] font-medium leading-relaxed italic">
                        "Tire um print do resultado da partida e deixe o Celo Tracker fazer o resto. Nossa IA lê os dados automaticamente em segundos."
                    </p>
                </div>
            ),
            buttonText: "Quero esse recurso",
            secondaryButton: "Continuar no gratuito",
            showX: true
        }
    ];

    const currentData = slides[currentSlide - 1];

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade">
            <div className="card w-full max-w-[480px] p-10 relative animate-reveal text-center shadow-2xl border-[var(--border-default)]">
                {currentData.showX && (
                    <button 
                        onClick={handleClose}
                        className="absolute top-6 right-6 p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        <X size={20} />
                    </button>
                )}

                <div className="flex flex-col items-center">
                    <div className="mb-8 p-6 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-inner">
                        {currentData.icon}
                    </div>

                    <h2 className="text-2xl font-extrabold mb-4 tracking-tight">{currentData.title}</h2>
                    
                    <div className="min-h-[100px] mb-8">
                        {typeof currentData.content === 'string' ? (
                            <p className="text-[var(--text-secondary)] leading-relaxed text-sm">
                                {currentData.content}
                            </p>
                        ) : (
                            currentData.content
                        )}
                    </div>

                    <div className="w-full space-y-3">
                        {currentSlide < 3 ? (
                            <button 
                                onClick={() => setCurrentSlide(prev => prev + 1)}
                                className="btn-primary w-full py-4 text-sm font-bold flex items-center justify-center gap-2 group"
                            >
                                {currentData.buttonText}
                                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        ) : (
                            <>
                                <button 
                                    onClick={handleGoToPlans}
                                    className="btn-primary w-full py-4 text-sm font-bold shadow-lg shadow-[var(--accent-glow)]"
                                >
                                    {currentData.buttonText}
                                </button>
                                <button 
                                    onClick={handleClose}
                                    className="btn-ghost w-full py-3 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] border-transparent"
                                >
                                    Continuar no plano gratuito
                                </button>
                            </>
                        )}
                    </div>

                    {/* Indicadores de Slide */}
                    <div className="flex items-center gap-2 mt-8">
                        {[1, 2, 3].map(i => (
                            <div 
                                key={i}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${currentSlide === i ? 'bg-[var(--accent)] w-6' : 'bg-[var(--border-strong)]'}`}
                            />
                        ))}
                    </div>

                    {currentSlide > 1 && (
                        <button 
                            onClick={() => setCurrentSlide(prev => prev - 1)}
                            className="absolute bottom-10 left-10 p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] flex items-center gap-1 text-xs font-semibold transition-colors"
                        >
                            <ChevronLeft size={16} />
                            Voltar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
