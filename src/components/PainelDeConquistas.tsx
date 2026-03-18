import React, { useEffect, useState } from 'react';
import {
    Sword, Zap, Trophy, HeartPulse, Flame, Shield, Users,
    Star, Lock, Award
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ─── Mapeamento de ícones pelo nome salvo no banco ─────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
    Sword,
    Zap,
    Trophy,
    HeartPulse,
    Flame,
    Shield,
    Users,
    Star,
    Award,
};

interface Conquista {
    id: string;
    titulo: string;
    descricao: string;
    icone: string;
    created_at: string;
}

interface PainelDeConquistasProps {
    jogadorId: string;
    nomeJogador?: string;
}

// ─── Chip de Raridade ─────────────────────────────────────────────────────────
const getRaridade = (index: number): { label: string; color: string; classes: string } => {
    if (index === 0) return { label: 'Lendária', color: '#F59E0B', classes: 'badge-purple !text-[#F59E0B] !bg-[#F59E0B15]' };
    if (index === 1) return { label: 'Épica', color: '#A855F7', classes: 'badge-purple' };
    if (index === 2) return { label: 'Rara', color: '#3B82F6', classes: 'badge-blue' };
    return { label: 'Comum', color: '#10B981', classes: 'badge-green' };
};

// ─── Card de Conquista ────────────────────────────────────────────────────────
const ConquistaCard: React.FC<{ conquista: Conquista; index: number }> = ({ conquista, index }) => {
    const IconComponent = ICON_MAP[conquista.icone] || Award;
    const raridade = getRaridade(index);
    const dataFormatada = new Date(conquista.created_at).toLocaleDateString('pt-BR');

    return (
        <div className="card relative flex flex-col gap-4 p-5 transition-all duration-300 hover:border-[var(--accent-glow)] !bg-[var(--bg-card)]">
            {/* Chip de raridade */}
            <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${raridade.classes}`}>
                {raridade.label}
            </span>

            {/* Ícone */}
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--bg-hover)] border border-[var(--border-subtle)]">
                <IconComponent size={22} style={{ color: raridade.color }} />
            </div>

            {/* Texto */}
            <div className="flex flex-col gap-1 flex-1">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {conquista.titulo}
                </h3>
                <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
                    {conquista.descricao}
                </p>
            </div>

            {/* Data */}
            <p className="text-[10px] font-medium text-[var(--text-tertiary)] mt-2">
                Desbloqueada em {dataFormatada}
            </p>
        </div>
    );
};

// ─── Painel de Conquistas ─────────────────────────────────────────────────────
export const PainelDeConquistas: React.FC<PainelDeConquistasProps> = ({ jogadorId, nomeJogador }) => {
    const [conquistas, setConquistas] = useState<Conquista[]>([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    useEffect(() => {
        if (!jogadorId) return;

        const fetchConquistas = async () => {
            setLoading(true);
            setErro(null);
            const { data, error } = await supabase
                .from('conquistas_jogadores')
                .select('*')
                .eq('jogador_id', jogadorId)
                .order('created_at', { ascending: false });

            if (error) {
                setErro('Não foi possível carregar as conquistas.');
            } else {
                setConquistas(data || []);
            }
            setLoading(false);
        };

        fetchConquistas();
    }, [jogadorId]);

    if (loading) {
        return (
            <div className="card p-8 flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-[var(--accent-muted)] border-t-[var(--accent)] rounded-full animate-spin" />
                <p className="text-xs font-medium text-[var(--text-tertiary)]">
                    Carregando Conquistas...
                </p>
            </div>
        );
    }

    if (erro) {
        return (
            <div className="card p-8 text-center border-red-500/20">
                <p className="text-sm text-red-500 font-medium">{erro}</p>
            </div>
        );
    }

    return (
        <div className="card p-6 !bg-transparent border-none">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-[var(--accent-muted)] text-[var(--accent)]">
                        <Award size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-[var(--text-primary)]">
                            Conquistas
                        </h2>
                        <p className="text-xs text-[var(--text-tertiary)]">
                            {nomeJogador ? `${nomeJogador} · ` : ''}{conquistas.length} medalha{conquistas.length !== 1 ? 's' : ''} desbloqueada{conquistas.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                {/* Contadores por raridade */}
                <div className="hidden sm:flex items-center gap-2">
                    {[
                        { label: '🏆', count: conquistas.filter((_, i) => i === 0).length },
                        { label: '💜', count: conquistas.filter((_, i) => i === 1).length },
                        { label: '💙', count: conquistas.filter((_, i) => i === 2).length },
                        { label: '💚', count: conquistas.filter((_, i) => i >= 3).length },
                    ].map((r, i) => (
                        <span
                            key={i}
                            className="badge border border-[var(--border-default)] bg-[var(--bg-hover)] text-[var(--text-secondary)] px-3 py-1"
                        >
                            {r.label} {r.count}
                        </span>
                    ))}
                </div>
            </div>

            {/* Grid de Conquistas */}
            {conquistas.length === 0 ? (
                <div className="card flex flex-col items-center justify-center py-12 gap-4 bg-[var(--bg-surface)]/50">
                    <div className="p-5 rounded-2xl bg-[var(--bg-hover)] border border-[var(--border-subtle)]">
                        <Lock size={32} className="text-[var(--text-tertiary)]" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-bold text-[var(--text-secondary)]">Nenhuma conquista ainda</p>
                        <p className="text-xs text-[var(--text-tertiary)] mt-1">
                            Registre partidas incríveis para desbloquear medalhas!
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {conquistas.map((conquista, index) => (
                        <ConquistaCard key={conquista.id} conquista={conquista} index={index} />
                    ))}
                </div>
            )}
        </div>
    );
};
