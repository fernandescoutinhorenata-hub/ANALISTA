import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY') ?? ''
    if (!apiKey) {
      console.error('[OCR] ANTHROPIC_API_KEY não encontrada no ambiente')
      return new Response(JSON.stringify({ error: 'API key não configurada no servidor' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { base64Image, mediaType } = await req.json()
    console.log(`[OCR] Iniciando análise — mediaType: ${mediaType}, tamanho base64: ${base64Image?.length ?? 0}`)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64Image }
            },
            {
              type: 'text',
              text: `Analise esta imagem de resultado de partida do Free Fire e retorne APENAS um JSON válido, sem markdown, sem blocos de código, sem texto adicional:
{
  "mapa": "BERMUDA",
  "colocacao": 10,
  "jogadores": [
    { "nome": "COACH7", "kills": 4, "mortes": 1, "assists": 2, "dano": 818, "derrubados": 4, "ressurgimentos": 1 }
  ]
}
KDA aparece como K/D/A abaixo do nome. Ex: 4/1/2 = kills:4, mortes:1, assists:2.
Para o nome do jogador, extraia APENAS o nome sem clã/guild. Remova qualquer prefixo de clã (ex: GRT, RUSH, LOUD) e símbolos (#, ., espaços extras). Retorne apenas o nick limpo. Ex: 'GRT COACH7' → 'COACH7', 'GRT.HEROXIT7' → 'HEROXIT7'.
IMPORTANTE: Retorne SOMENTE o JSON puro, sem nenhum texto antes ou depois.`
            }
          ]
        }]
      })
    })

    console.log(`[OCR] Status da resposta Anthropic: ${response.status}`)

    if (!response.ok) {
      const errorBody = await response.text()
      console.error(`[OCR] Erro na API Anthropic (${response.status}):`, errorBody)
      return new Response(JSON.stringify({ error: `Erro Anthropic ${response.status}: ${errorBody}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const data = await response.json()
    let text = data.content?.[0]?.text || '{}'
    console.log('[OCR] Resposta bruta do Claude:', text)

    // Limpar possível markdown ao redor do JSON (```json ... ``` ou ``` ... ```)
    text = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    // Validar que é um JSON antes de retornar
    try {
      JSON.parse(text)
    } catch {
      console.error('[OCR] Claude não retornou JSON válido:', text)
      return new Response(JSON.stringify({ error: `Claude retornou texto inválido: ${text.substring(0, 300)}` }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('[OCR] JSON limpo e válido, retornando ao cliente')
    return new Response(JSON.stringify({ result: text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[OCR] Erro inesperado:', (error as Error).message)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
