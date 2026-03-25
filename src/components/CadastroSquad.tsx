import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, Plus, Users, AlertCircle } from 'lucide-react';

export interface SquadPlayer {
    id: string;
    nome_oficial: string;
}

interface CadastroSquadProps {
    onSquadChange: (squad: SquadPlayer[]) => void;
}

export const CadastroSquad: React.FC<CadastroSquadProps> = ({ onSquadChange }) => {
    const { user } = useAuth();
    const [players, setPlayers] = useState<SquadPlayer[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) fetchSquad();
    }, [user]);

    const fetchSquad = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('squad_jogadores')
                .select('id, nome_oficial')
                .eq('user_id', user?.id)
                .order('criado_em', { ascending: true });

            if (error) throw error;
            setPlayers(data || []);
            onSquadChange(data || []);
        } catch (err: any) {
            console.error('Erro ao buscar squad:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !inputValue.trim()) return;
        if (players.length >= 6) {
            setError('Máximo de 6 jogadores atingido.');
            setTimeout(() => setError(''), 3000);
            return;
        }

        const nome = inputValue.trim().toUpperCase();
        if (players.some(p => p.nome_oficial === nome)) {
            setError('Jogador já cadastrado!');
            setTimeout(() => setError(''), 3000);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('squad_jogadores')
                .insert([{ user_id: user.id, nome_oficial: nome }])
                .select('id, nome_oficial')
                .single();

            if (error) throw error;
            
            const newPlayers = [...players, data];
            setPlayers(newPlayers);
            onSquadChange(newPlayers);
            setInputValue('');
        } catch (err: any) {
            console.error('Erro ao adicionar jogador:', err);
            setError('Erro ao salvar jogador.');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleRemove = async (id: string) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('squad_jogadores')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;
            
            const newPlayers = players.filter(p => p.id !== id);
            setPlayers(newPlayers);
            onSquadChange(newPlayers);
        } catch (err: any) {
            console.error('Erro ao remover jogador:', err);
        }
    };

    return (
        <div className="card p-6 mb-6 !bg-[#141416] border border-[#27272A] relative">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-[var(--accent-muted)] text-[var(--accent)]">
                    <Users size={20} />
                </div>
                <div>
                    <h3 className="text-heading text-lg tracking-wide uppercase">Jogadores Oficiais do Squad</h3>
                    <p className="text-label mt-1">Cadastre nomes para evitar duplicações por erros do OCR.</p>
                </div>
            </div>

            {error && (
                <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-sm px-4 py-2 rounded-lg mb-4 flex items-center gap-2">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            <div className="mb-6 flex flex-wrap gap-2">
                {players.map(p => (
                    <div key={p.id} className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#27272A] text-[#FAFAFA] border border-[#3F3F46]">
                        <span className="text-sm font-bold uppercase">{p.nome_oficial}</span>
                        <button onClick={() => handleRemove(p.id)} className="text-[#A1A1AA] hover:text-[#EF4444] transition-colors p-0.5">
                            <X size={14} />
                        </button>
                    </div>
                ))}
                {players.length === 0 && !loading && (
                    <p className="text-[#A1A1AA] text-sm italic">Nenhum jogador cadastrado. Adicione seu squad abaixo!</p>
                )}
            </div>

            <form onSubmit={handleAdd} className="flex gap-2">
                <input
                    type="text"
                    placeholder="Nome Oficial do Jogador..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    maxLength={20}
                    disabled={players.length >= 6}
                    className="flex-1 bg-[#18181B] border border-[#27272A] rounded-lg px-4 text-sm text-[#FAFAFA] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none disabled:opacity-50"
                />
                <button
                    type="submit"
                    disabled={players.length >= 6 || !inputValue.trim()}
                    className="btn-primary py-2 flex items-center gap-2 disabled:opacity-50"
                >
                    <Plus size={16} /> Adicionar
                </button>
            </form>
        </div>
    );
};
