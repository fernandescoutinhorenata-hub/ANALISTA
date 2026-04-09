/**
 * Proxy para Claude Vision via Supabase Edge Function.
 * Resolve o bloqueio de CORS que impede chamadas diretas ao api.anthropic.com no browser.
 */
import { supabase } from './supabase'

export async function readScreenshot(base64Image: string, mediaType: string): Promise<string> {
    /**
     * Instruções para padronização de nomes:
     * Extrair APENAS o nome sem clã/guild, prefixos (GRT, RUSH, LOUD) ou símbolos (#, .).
     */
    const prompt = `Para o nome do jogador, extraia APENAS o nome sem clã/guild. 
Remova qualquer prefixo de clã (ex: GRT, RUSH, LOUD) e símbolos (#, ., espaços extras).
Retorne apenas o nick limpo. Ex: 'GRT COACH7' -> 'COACH7', 'GRT.HEROXIT7' -> 'HEROXIT7'.
Player name column may contain: clan tag + nickname + decorative symbols.
Return ONLY the nickname (middle or last Latin word).
Ignore any Japanese, Chinese, or special unicode characters.
Return names in UPPERCASE Latin characters only.`;

    const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ base64Image, mediaType, prompt })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Erro desconhecido no OCR' }));
        throw new Error(err.error || `Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data.result || '{}';
}
