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
    const { data, error } = await supabase.functions.invoke('ocr', {
        body: { base64Image, mediaType }
    })

    if (error) throw new Error(error.message)
    return data?.result || '{}'
}
