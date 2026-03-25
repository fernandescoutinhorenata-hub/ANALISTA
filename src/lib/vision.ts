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
Retorne apenas o nick limpo. Ex: 'GRT COACH7' -> 'COACH7', 'GRT.HEROXIT7' -> 'HEROXIT7'`;

    const { data, error } = await supabase.functions.invoke('ocr', {
        body: { base64Image, mediaType, prompt }
    })

    if (error) throw new Error(error.message)
    return data?.result || '{}'
}
