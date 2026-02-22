export interface ExcelRow {
    Data: string | number;
    Campeonato: string;
    Rodada: number;
    Mapa: string;
    Equipe: string;
    Colocacao: number;
    Kill: number;
    "Pontos/Posicao": number;
    Pontos_Total: number;
    Booyah: string;
    "Quebra de Call": string;
    "Resultado quebra": string;
}

export interface PlayerRow {
    Data: string | number;
    Equipe: string;
    Modo: string;
    Mapa: string;
    Posicao: number;
    Player: string;
    Kill: number;
    Morte: number;
    Assistencia: number;
    Queda: number;
    "Dano causado": number;
    "Derrubados": number;
    "Ressurgimento": number;
}

export interface MapMetric {
    mapa: string;
    quedas: number;
    totalKills: number;
    mediaKills: number;
    totalPontos: number;
    totalBooyahs: number;
    percentBooyah: number;
    tentativasCall: number;
    callsGanhas: number;
    percentSucessoCall: number;
    // New Metrics
    consistency: number; // Standard Deviation of points
    avgPlacement: number;
}

export interface GeneralMetrics {
    totalQuedas: number;
    totalKills: number;
    mediaKills: number;
    totalPontos: number;
    mediaPontos: number;
    totalBooyahs: number;
    percentBooyah: number;
    totalQuebras: number;
    callsGanhas: number;
    callsPerdidas: number;
    percentSucessoCall: number;
    avgPlacement: number;
    consistencyScore: number;
    rankings: {
        byKills: { label: string; value: number }[];
        byPoints: { label: string; value: number }[];
        byBooyah: { label: string; value: number }[];
        byConsistency: { label: string; value: number }[];
    };
}

export interface PlayerMetrics {
    totalKills: number;
    totalDano: number;
    kdRatio: number; // Kill/Death
    mvp: { player: string; kills: number; team: string };
    topDamage: { player: string; damage: number; team: string };
    topAssists: { player: string; assists: number; team: string };
}

export interface DashboardData {
    general: GeneralMetrics;
    byMap: MapMetric[];
    rawData: ExcelRow[];
    playerData: PlayerRow[];
    playerMetrics: PlayerMetrics;
}
