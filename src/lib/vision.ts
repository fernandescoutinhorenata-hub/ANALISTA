/**
 * Proxy para Claude Vision via Supabase Edge Function.
 * Resolve o bloqueio de CORS que impede chamadas diretas ao api.anthropic.com no browser.
 *
 * Interface da Edge Function (v27+):
 *   Request body: { image: string }  — base64 puro, sem prefixo data:image/...;base64,
 *   Response:     { jogadores: [...] } | { jogadores: [], erro: string }
 */
import { supabase } from './supabase'

export async function readScreenshot(base64Image: string, _mediaType: string): Promise<string> {
    // Adicionar expliciamente o token JWT no Header para mitigar falha de sincronização do client Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    // Edge Function espera o campo "image" com base64 puro (sem prefixo data URI)
    const { data, error } = await supabase.functions.invoke('ocr', {
        body: { image: base64Image },
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined
    })

    if (error) throw new Error(error.message)

    // A Edge Function retorna o objeto diretamente (ex: { jogadores: [...] })
    // Serializar para string para manter compatibilidade com o parser do InputData
    return JSON.stringify(data ?? {})
}
