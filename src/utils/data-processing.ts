
import { z } from 'zod';
import type { DashboardData, ExcelRow, GeneralMetrics, MapMetric, PlayerRow, PlayerMetrics } from '../types';

// Zod Schema for Row Validation
const RowSchema = z.object({
    Data: z.union([z.string(), z.number()]).optional(),
    Campeonato: z.string().optional(),
    Rodada: z.number().or(z.string().transform(Number)).optional(),
    Mapa: z.string().optional(),
    Equipe: z.string().optional(),
    Colocacao: z.number().or(z.string().transform(Number)).optional(),
    Kill: z.number().or(z.string().transform(Number)).default(0),
    "Pontos/Posicao": z.number().or(z.string().transform(Number)).default(0),
    Pontos_Total: z.number().or(z.string().transform(Number)).default(0),
    Booyah: z.string().optional(),
    "Quebra de Call": z.string().optional(),
    "Resultado quebra": z.string().optional(),
});

const PlayerSchema = z.object({
    Data: z.union([z.string(), z.number()]).optional(),
    Equipe: z.string().optional(),
    Modo: z.string().optional(),
    Mapa: z.string().optional(),
    Posicao: z.number().optional().or(z.string().transform(val => Number(val) || 0)),
    Player: z.string(),
    Kill: z.number().or(z.string().transform(val => Number(val) || 0)),
    Morte: z.number().or(z.string().transform(val => Number(val) || 0)),
    Assistencia: z.number().optional().or(z.string().transform(val => Number(val) || 0)),
    Queda: z.number().optional().or(z.string().transform(val => Number(val) || 0)),
    "Dano causado": z.number().or(z.string().transform(val => Number(val) || 0)),
    "Derrubados": z.number().optional().or(z.string().transform(val => Number(val) || 0)),
    "Ressurgimento": z.number().optional().or(z.string().transform(val => Number(val) || 0)),
});

// Helper to normalize keys (handling accents, case, spaces)
const normalizeKey = (key: string) => {
    return key.toString().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
};

// Helper to process player data
const processPlayerMetrics = (players: PlayerRow[]): PlayerMetrics => {
    let totalKills = 0;
    let totalDano = 0;

    // Track maximums
    let maxKills = { player: 'N/A', kills: 0, team: '-' };
    let maxDamage = { player: 'N/A', damage: 0, team: '-' };
    let maxAssists = { player: 'N/A', assists: 0, team: '-' };

    // Aggregate simple stats
    players.forEach(p => {
        totalKills += p.Kill || 0;
        totalDano += p["Dano causado"] || 0;

        if (p.Kill > maxKills.kills) {
            maxKills = { player: p.Player, kills: p.Kill, team: p.Equipe };
        }
        if (p["Dano causado"] > maxDamage.damage) {
            maxDamage = { player: p.Player, damage: p["Dano causado"], team: p.Equipe };
        }
        if ((p.Assistencia || 0) > maxAssists.assists) {
            maxAssists = { player: p.Player, assists: p.Assistencia || 0, team: p.Equipe };
        }
    });

    // Approximate KD (Total Kills / Total Deaths)
    const totalDeaths = players.reduce((acc, p) => acc + (p.Morte || 0), 0);
    const kdRatio = totalDeaths > 0 ? Number((totalKills / totalDeaths).toFixed(2)) : totalKills;

    return {
        totalKills,
        totalDano,
        kdRatio,
        mvp: maxKills,
        topDamage: maxDamage,
        topAssists: maxAssists
    };
};

export const processData = (rawData: unknown[], rawPlayerData?: unknown[]): DashboardData => {
    // 1. Validate & Normalize General Data (Sheet 1)
    const validRows: ExcelRow[] = [];
    rawData.forEach((row: any) => {
        const newRow: any = {};
        Object.keys(row).forEach(key => {
            const nKey = normalizeKey(key);
            if (nKey === 'data') newRow.Data = row[key];
            else if (nKey === 'campeonato') newRow.Campeonato = row[key];
            else if (nKey === 'rodada') newRow.Rodada = row[key];
            else if (nKey === 'mapa') newRow.Mapa = row[key]?.toString().trim();
            else if (nKey === 'equipe') newRow.Equipe = row[key];
            else if (nKey === 'colocacao') newRow.Colocacao = row[key];
            else if (nKey === 'kill' || nKey === 'kills') newRow.Kill = row[key];
            else if (nKey.includes('pontosposicao')) newRow["Pontos/Posicao"] = row[key];
            else if (nKey.includes('pontostotal')) newRow.Pontos_Total = row[key];
            else if (nKey === 'booyah') newRow.Booyah = row[key]?.toString().trim().toUpperCase();
            else if (nKey.includes('quebradecall')) newRow["Quebra de Call"] = row[key]?.toString().trim().toUpperCase();
            else if (nKey.includes('resultadoquebra')) newRow["Resultado quebra"] = row[key]?.toString().trim();
        });

        const result = RowSchema.safeParse(newRow);
        if (result.success) {
            validRows.push(result.data as ExcelRow);
        }
    });

    // 2. Validate & Normalize Player Data (Sheet 2)
    const validPlayers: PlayerRow[] = [];
    if (rawPlayerData) {
        rawPlayerData.forEach((row: any) => {
            const normalized: any = {};
            Object.keys(row).forEach(key => {
                const cleanKey = key.trim();
                normalized[cleanKey] = row[key];
                if (cleanKey === "Assistência") normalized["Assistencia"] = row[key];
            });

            const result = PlayerSchema.safeParse(normalized);
            if (result.success) {
                validPlayers.push(result.data as PlayerRow);
            }
        });
    }

    // 3. Process General Metrics
    const general: GeneralMetrics = {
        totalQuedas: 0,
        totalKills: 0,
        mediaKills: 0,
        totalPontos: 0,
        mediaPontos: 0,
        totalBooyahs: 0,
        percentBooyah: 0,
        totalQuebras: 0,
        callsGanhas: 0,
        callsPerdidas: 0,
        percentSucessoCall: 0,
        consistencyScore: 0,
        avgPlacement: 0,
        rankings: {
            byKills: [],
            byPoints: [],
            byBooyah: [],
            byConsistency: []
        }
    };

    const mapStats: Record<string, MapMetric> = {};
    let successfulCalls = 0;
    let failedCalls = 0;
    let totalPlacement = 0;

    validRows.forEach(row => {
        general.totalQuedas++;
        general.totalKills += row.Kill;
        general.totalPontos += row.Pontos_Total;

        if (row.Booyah === 'SIM') general.totalBooyahs++;

        if (row["Quebra de Call"] === 'SIM') {
            general.totalQuebras++;
            if (row["Resultado quebra"] === 'GANHOU') {
                successfulCalls++;
            } else if (row["Resultado quebra"] === 'PERDEU') {
                failedCalls++;
            }
        }

        totalPlacement += row.Colocacao;

        if (!mapStats[row.Mapa]) {
            mapStats[row.Mapa] = {
                mapa: row.Mapa,
                quedas: 0,
                totalKills: 0,
                mediaKills: 0,
                totalPontos: 0,
                totalBooyahs: 0,
                percentBooyah: 0,
                tentativasCall: 0,
                callsGanhas: 0,
                percentSucessoCall: 0,
                consistency: 0,
                avgPlacement: 0,
            };
        }

        const m = mapStats[row.Mapa];
        m.quedas++;
        m.totalKills += row.Kill;
        m.totalPontos += row.Pontos_Total;
        if (row.Booyah === 'SIM') m.totalBooyahs++;
        if (row["Quebra de Call"] === 'SIM') {
            m.tentativasCall++;
            if (row["Resultado quebra"] === 'GANHOU') m.callsGanhas++;
        }
    });

    general.mediaKills = Number((general.totalKills / (general.totalQuedas || 1)).toFixed(2));
    general.mediaPontos = Number((general.totalPontos / (general.totalQuedas || 1)).toFixed(2));
    general.percentBooyah = Number(((general.totalBooyahs / (general.totalQuedas || 1)) * 100).toFixed(1));
    general.callsGanhas = successfulCalls;
    general.callsPerdidas = failedCalls;
    general.percentSucessoCall = general.totalQuebras > 0
        ? Number(((successfulCalls / general.totalQuebras) * 100).toFixed(1))
        : 0;
    general.avgPlacement = Number((totalPlacement / (general.totalQuedas || 1)).toFixed(1));

    const byMap = Object.values(mapStats).map(m => {
        m.mediaKills = Number((m.totalKills / m.quedas).toFixed(2));
        m.percentBooyah = Number(((m.totalBooyahs / m.quedas) * 100).toFixed(1));
        m.percentSucessoCall = m.tentativasCall > 0
            ? Number(((m.callsGanhas / m.tentativasCall) * 100).toFixed(1))
            : 0;

        const mapRows = validRows.filter(r => r.Mapa === m.mapa);
        const points = mapRows.map(r => r.Pontos_Total);
        const mean = points.reduce((a, b) => a + b, 0) / points.length;
        const variance = points.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / points.length;
        m.consistency = Number(Math.sqrt(variance).toFixed(2));

        return m;
    });

    general.rankings.byKills = byMap
        .sort((a, b) => b.totalKills - a.totalKills)
        .map(m => ({ label: m.mapa, value: m.totalKills }));

    general.rankings.byBooyah = byMap
        .sort((a, b) => b.totalBooyahs - a.totalBooyahs)
        .map(m => ({ label: m.mapa, value: m.totalBooyahs }));

    general.rankings.byConsistency = byMap
        .sort((a, b) => a.consistency - b.consistency)
        .map(m => ({ label: m.mapa, value: m.consistency }));

    const allPoints = validRows.map(r => r.Pontos_Total);
    const globalMean = allPoints.reduce((a, b) => a + b, 0) / (allPoints.length || 1);
    const globalVariance = allPoints.reduce((a, b) => a + Math.pow(b - globalMean, 2), 0) / (allPoints.length || 1);
    general.consistencyScore = Number(Math.sqrt(globalVariance).toFixed(2));

    const playerMetrics = processPlayerMetrics(validPlayers);

    return {
        general,
        byMap,
        rawData: validRows.sort((a, b) => (Number(a.Rodada) || 0) - (Number(b.Rodada) || 0)),
        playerData: validPlayers,
        playerMetrics
    };
};
