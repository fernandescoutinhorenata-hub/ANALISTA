/**
 * Proxy para Claude Vision via Supabase Edge Function.
 * Resolve o bloqueio de CORS que impede chamadas diretas ao api.anthropic.com no browser.
 *
 * Interface da Edge Function (v27+):
 *   Request body: { image: string }  — base64 puro, sem prefixo data:image/...;base64,
 *   Response:     { jogadores: [...] } | { jogadores: [], erro: string }
 */
import { supabase } from './supabase'

export async function readScreenshot(base64Image: string, _mediaType: string, accessToken?: string): Promise<string> {
    const headers: Record<string, string> = {};
    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // A API original da Edge Function espera base64Image e mediaType explícitos.
    const { data, error } = await supabase.functions.invoke('ocr', {
        body: { base64Image, mediaType: _mediaType },
        headers: Object.keys(headers).length > 0 ? headers : undefined
    })

    if (error) throw new Error(error.message)

    // A Edge Function retorna o objeto diretamente (ex: { jogadores: [...] })
    // Serializar para string para manter compatibilidade com o parser do InputData
    return JSON.stringify(data ?? {})
}
