/**
 * Parser de OCR para screenshots de partidas Free Fire.
 * Recebe o texto bruto extraído pelo Google Vision e tenta identificar:
 *   - Mapa da partida
 *   - Colocação final (#1 → #12)
 *   - Estatísticas de até 4 jogadores (K/D/A, Dano, Derrubados, Ressurgimentos)
 */

export interface OCRJogador {
    nome: string;
    kills: number;
    mortes: number;
    assists: number;
    dano: number;
    derrubados: number;
    ressurgimentos: number;
}

export interface OCRResult {
    mapa: string;
    colocacao: number;
    jogadores: OCRJogador[];
}

// Mapas reconhecidos pelo Free Fire (variações e equivalências PT-BR / EN)
const MAPAS_EN = ['BERMUDA', 'KALAHARI', 'PURGATORY', 'ALPINE', 'NEXTERA'];
const MAPAS_PT: Record<string, string> = {
    'PURGATORIO': 'PURGATÓRIO',
    'PURGATORY':  'PURGATÓRIO',
    'NEXTERA':    'NOVA TERRA',
    'ALPINE':     'ALPINE',
    'KALAHARI':   'KALAHARI',
    'BERMUDA':    'BERMUDA',
};

export function parseScreenshot(text: string): OCRResult {
    const upper = text.toUpperCase();
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    // ── 1. MAPA ─────────────────────────────────────────────────────────────────
    const mapaFound = MAPAS_EN.find(m => upper.includes(m)) || 'BERMUDA';
    const mapa = MAPAS_PT[mapaFound] ?? mapaFound;

    // ── 2. COLOCAÇÃO — padrão #10 ou "10°" ou "10 º" ─────────────────────────
    const colocacaoMatch =
        text.match(/#\s*(\d{1,2})/)
        ?? text.match(/(\d{1,2})\s*[°º]/);
    const colocacao = colocacaoMatch
        ? Math.min(12, Math.max(1, parseInt(colocacaoMatch[1])))
        : 1;

    // ── 3. JOGADORES ─────────────────────────────────────────────────────────────
    // Padrão K/D/A:  4/1/2   ➜ kills=4 mortes=1 assists=2
    const kdaPattern = /(\d+)\/(\d+)\/(\d+)/g;
    const kdaMatches = [...text.matchAll(kdaPattern)];

    // Dano — números entre 500 e 29999 que aparecem próximos aos K/D/A
    const dmgPattern = /\b([5-9]\d{2}|[1-2]\d{4}|[1-9]\d{3})\b/g;
    const dmgMatches = [...text.matchAll(dmgPattern)];

    // Derrubados — pode aparecer como "KNOCK" ou linha com "Derr" ou número isolado após D/K/A
    // Heurística simples: 3º número após a linha K/D/A para cada jogador
    const nomes = extrairNomes(lines, kdaMatches.length);

    const jogadores: OCRJogador[] = kdaMatches.slice(0, 4).map((kda, i) => ({
        nome:         nomes[i] ?? `Jogador ${i + 1}`,
        kills:        parseInt(kda[1]) || 0,
        mortes:       parseInt(kda[2]) || 0,
        assists:      parseInt(kda[3]) || 0,
        dano:         dmgMatches[i] ? parseInt(dmgMatches[i][1]) : 0,
        derrubados:   0,
        ressurgimentos: 0,
    }));

    // Se não encontrou nenhum jogador via K/D/A, retorna 4 jogadores vazios
    if (jogadores.length === 0) {
        for (let i = 0; i < 4; i++) {
            jogadores.push({ nome: `Jogador ${i + 1}`, kills: 0, mortes: 0, assists: 0, dano: 0, derrubados: 0, ressurgimentos: 0 });
        }
    }

    return { mapa, colocacao, jogadores };
}

/**
 * Tenta extrair nomes de jogadores a partir das linhas antes de cada K/D/A.
 * Heurística: linha curta (3-16 chars) acima de um padrão X/X/X, sem dígitos dominantes.
 */
function extrairNomes(lines: string[], count: number): string[] {
    const nomes: string[] = [];
    for (let i = 0; i < lines.length && nomes.length < count; i++) {
        const linha = lines[i].trim();
        // Linha seguinte tem padrão N/N/N?
        const proxima = lines[i + 1] ?? '';
        if (/\d+\/\d+\/\d+/.test(proxima) && linha.length >= 2 && linha.length <= 20 && !/^\d/.test(linha)) {
            nomes.push(linha.substring(0, 20).toUpperCase());
        }
    }
    return nomes;
}
