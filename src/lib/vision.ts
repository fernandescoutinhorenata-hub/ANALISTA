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

    const { data, error } = await supabase.functions.invoke('ocr', {
        body: { base64Image, mediaType, prompt }
    })

    if (error) throw new Error(error.message)
    return data?.result || '{}'
}
