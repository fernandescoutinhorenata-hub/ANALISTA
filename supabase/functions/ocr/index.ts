import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')!
    
    // Config Supabase to verify user
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')! // Or SERVICE_ROLE for query
    
    // Service role pra burlar RLS e ler a tabela limits
    const sRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAdmin = createClient(supabaseUrl, sRoleKey)
    
    // Obter usuário do JWT
    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    })
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    // Rate Limiting: Máx 20 tentativas por usuário por hora
    const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count, error: rlError } = await supabaseAdmin
      .from('api_rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('action_type', 'ocr_invoke')
      .eq('identifier', user.id)
      .gt('created_at', umaHoraAtras)

    if (rlError) {
      console.error('[OCR] RL Error', rlError)
    } else if (count !== null && count >= 20) {
      return new Response(JSON.stringify({ error: 'Limite OCR atingido. Tente novamente em 1 hora.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    await supabaseAdmin.from('api_rate_limits').insert({ action_type: 'ocr_invoke', identifier: user.id })

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY') ?? ''
    if (!apiKey) {
      console.error('[OCR] ANTHROPIC_API_KEY não encontrada no ambiente')
      return new Response(JSON.stringify({ error: 'API key não configurada no servidor' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { base64Image, mediaType } = await req.json()
    console.log(`[OCR] Iniciando análise — user: ${user.id}, mediaType: ${mediaType}, tamanho base64: ${base64Image?.length ?? 0}`)

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
              text: `Analise esta imagem de resultado de partida do Free Fire e retorne APENAS um JSON válido, sem texto adicional, sem markdown, sem blocos de código.

ATENÇÃO — MAPEAMENTO EXATO DAS COLUNAS NA TELA:
A tela de resultado do Free Fire tem estas colunas nesta ordem:
K/D/A | DMG | DANO REAL | DERRUBADOS | CURA | LEVANTADOS | RESSURGIMENTO

REGRAS CRÍTICAS:
1. DERRUBADOS: É a 4ª coluna. Números PEQUENOS entre 0 e 15. NUNCA use o valor da coluna CURA (5ª coluna) aqui.
2. CURA: Tem valores ALTOS (500, 1000, 3000+). IGNORE essa coluna.
3. DANO: Use a coluna DMG (2ª coluna), números grandes como 1500-5000.
4. kills/mortes/assists: Vêm do K/D/A (1ª coluna), formato X/Y/Z.
5. ressurgimentos: Vem da coluna RESSURGIMENTO (7ª coluna).

Formato de retorno:
{
  "mapa": "NOME_DO_MAPA",
  "colocacao": 1,
  "jogadores": [
    { 
      "nome": "NOME_SEM_CLA", 
      "kills": 9, 
      "mortes": 0, 
      "assists": 3, 
      "dano": 3901, 
      "derrubados": 10, 
      "ressurgimentos": 4 
    }
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
