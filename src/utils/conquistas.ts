import { supabase } from '../lib/supabase';

// ─── Definição das Regras de Conquistas ────────────────────────────────────────
interface RegraConquista {
    titulo: string;
    descricao: string;
    icone: string;
    condicao: (stats: EstatisticasPartida) => boolean;
}

export interface EstatisticasPartida {
    kills: number;
    dano: number;
    assistencias: number;
    derrubados: number;
    ressurgimentos: number;
    mortes: number;
    colocacao: number;
}

const REGRAS: RegraConquista[] = [
    {
        titulo: 'MVP da Partida',
        descricao: 'Alcançou 15 ou mais kills em uma única partida.',
        icone: 'Sword',
        condicao: (s) => s.kills >= 15,
    },
    {
        titulo: 'Dano Massivo',
        descricao: 'Causou 2000 ou mais de dano em uma única partida.',
        icone: 'Zap',
        condicao: (s) => s.dano >= 2000,
    },
    {
        titulo: 'Booyah Master',
        descricao: 'Conquistou o 1° lugar (Booyah) na partida.',
        icone: 'Trophy',
        condicao: (s) => s.colocacao === 1,
    },
    {
        titulo: 'Anjo do Squad',
        descricao: 'Ressurgiu 3 ou mais companheiros na mesma partida.',
        icone: 'HeartPulse',
        condicao: (s) => s.ressurgimentos >= 3,
    },
    {
        titulo: 'Destruidor',
        descricao: 'Derrubou 10 ou mais inimigos em uma única partida.',
        icone: 'Flame',
        condicao: (s) => s.derrubados >= 10,
    },
    {
        titulo: 'Ghost',
        descricao: 'Terminou a partida sem morrer (mortes = 0) e ficou no Top 3.',
        icone: 'Shield',
        condicao: (s) => s.mortes === 0 && s.colocacao <= 3,
    },
    {
        titulo: 'Mestre do Apoio',
        descricao: 'Concedeu 8 ou mais assistências no mesmo jogo.',
        icone: 'Users',
        condicao: (s) => s.assistencias >= 8,
    },
];

// ─── Verifica e desbloqueia conquistas após uma partida ───────────────────────
export async function verificarDesbloqueioConquistas(
    jogadorId: string,
    dadosPartida: EstatisticasPartida
): Promise<string[]> {
    const conquistasDesbloqueadas: string[] = [];

    // Busca conquistas que o jogador já tem para evitar duplicatas
    const { data: existentes } = await supabase
        .from('conquistas_jogadores')
        .select('titulo')
        .eq('jogador_id', jogadorId);

    const titulosExistentes = new Set((existentes || []).map((c: any) => c.titulo));

    // Avalia cada regra
    const regrasPendentes = REGRAS.filter(
        (regra) => !titulosExistentes.has(regra.titulo) && regra.condicao(dadosPartida)
    );

    if (regrasPendentes.length === 0) return [];

    // Insere em lote as novas conquistas
    const inserirPayload = regrasPendentes.map((regra) => ({
        jogador_id: jogadorId,
        titulo: regra.titulo,
        descricao: regra.descricao,
        icone: regra.icone,
    }));

    const { error } = await supabase.from('conquistas_jogadores').insert(inserirPayload);

    if (!error) {
        regrasPendentes.forEach((r) => conquistasDesbloqueadas.push(r.titulo));
    }

    return conquistasDesbloqueadas;
}
