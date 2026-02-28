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
const getRaridade = (index: number): { label: string; color: string; glow: string } => {
    if (index === 0) return { label: 'Lendária', color: '#F59E0B', glow: '#F59E0B40' };
    if (index === 1) return { label: 'Épica', color: '#A855F7', glow: '#A855F740' };
    if (index === 2) return { label: 'Rara', color: '#3B82F6', glow: '#3B82F640' };
    return { label: 'Comum', color: '#10B981', glow: '#10B98140' };
};

// ─── Card de Conquista ────────────────────────────────────────────────────────
const ConquistaCard: React.FC<{ conquista: Conquista; index: number }> = ({ conquista, index }) => {
    const IconComponent = ICON_MAP[conquista.icone] || Award;
    const raridade = getRaridade(index);
    const dataFormatada = new Date(conquista.created_at).toLocaleDateString('pt-BR');

    return (
        <div
            className="grupo relative flex flex-col gap-4 rounded-xl p-5 transition-all duration-300 cursor-default"
            style={{
                backgroundColor: '#0F0F11',
                border: `1px solid ${raridade.color}30`,
                boxShadow: '0 0 0 0 transparent',
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 24px 0 ${raridade.glow}`;
                (e.currentTarget as HTMLDivElement).style.borderColor = `${raridade.color}80`;
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 0 transparent';
                (e.currentTarget as HTMLDivElement).style.borderColor = `${raridade.color}30`;
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
            }}
        >
            {/* Chip de raridade */}
            <span
                className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${raridade.color}15`, color: raridade.color }}
            >
                {raridade.label}
            </span>

            {/* Ícone */}
            <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                    backgroundColor: `${raridade.color}15`,
                    boxShadow: `0 0 16px 0 ${raridade.glow}`,
                }}
            >
                <IconComponent size={22} style={{ color: raridade.color }} />
            </div>

            {/* Texto */}
            <div className="flex flex-col gap-1 flex-1">
                <h3
                    className="text-sm font-black uppercase tracking-tight leading-tight"
                    style={{ color: '#FFFFFF' }}
                >
                    {conquista.titulo}
                </h3>
                <p className="text-[11px] leading-relaxed" style={{ color: '#71717A' }}>
                    {conquista.descricao}
                </p>
            </div>

            {/* Data */}
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#3D3D40' }}>
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
            <div
                className="rounded-xl p-8 flex flex-col items-center gap-4"
                style={{ backgroundColor: '#161618', border: '1px solid #2D2D30' }}
            >
                <div className="w-8 h-8 border-2 border-[#A855F7]/20 border-t-[#A855F7] rounded-full animate-spin" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#71717A]">
                    Carregando Conquistas...
                </p>
            </div>
        );
    }

    if (erro) {
        return (
            <div
                className="rounded-xl p-8 text-center"
                style={{ backgroundColor: '#161618', border: '1px solid #2D2D30' }}
            >
                <p className="text-[11px] text-[#EF4444] font-bold">{erro}</p>
            </div>
        );
    }

    return (
        <div
            className="rounded-xl p-6"
            style={{ backgroundColor: '#161618', border: '1px solid #2D2D30' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div
                        className="p-2.5 rounded-lg"
                        style={{ backgroundColor: '#A855F710', color: '#A855F7' }}
                    >
                        <Award size={18} />
                    </div>
                    <div>
                        <h2
                            className="text-sm font-black uppercase tracking-[0.15em]"
                            style={{ color: '#FFFFFF' }}
                        >
                            Conquistas
                        </h2>
                        <p className="text-[10px]" style={{ color: '#71717A' }}>
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
                            className="text-[10px] font-black px-2 py-1 rounded-lg"
                            style={{ backgroundColor: '#0B0B0C', border: '1px solid #2D2D30', color: '#A1A1AA' }}
                        >
                            {r.label} {r.count}
                        </span>
                    ))}
                </div>
            </div>

            {/* Grid de Conquistas */}
            {conquistas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div
                        className="p-5 rounded-2xl"
                        style={{ backgroundColor: '#0B0B0C', border: '1px solid #2D2D30' }}
                    >
                        <Lock size={32} style={{ color: '#3D3D40' }} />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-bold text-[#71717A]">Nenhuma conquista ainda</p>
                        <p className="text-[11px] text-[#3D3D40] mt-1">
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
