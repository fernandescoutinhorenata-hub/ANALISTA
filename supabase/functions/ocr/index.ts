import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// LÓGICA DE EXTRAÇÃO (v17 ESTÁVEL):
// - O K/D/A no Free Fire aparece como um campo composto (ex: 10/1/3) logo ABAIXO do nickname do jogador.
// - As colunas da tabela à direita começam diretamente com o Dano (DMG), que deve ser mapeado separadamente.
// - Regras de extração documentadas em: supabase/functions/ocr/PARSING_RULES.md

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

    // Rate Limiting: Máx 50 tentativas por usuário por hora (Aumentado para testes)
    const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count, error: rlError } = await supabaseAdmin
      .from('api_rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('action_type', 'ocr_invoke')
      .eq('identifier', user.id)
      .gt('created_at', umaHoraAtras)

    if (rlError) {
      console.error('[OCR] RL Error', rlError)
    } else if (count !== null && count >= 50) {
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
        model: 'claude-3-5-haiku-20241022',
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

ESTRUTURA VISUAL DA LINHA DO JOGADOR:
[CLÃ + NICK] -> Abaixo dele tem o [K/D/A] (ex: 9/1/3) -> Ao lado começam as colunas numéricas:
[DMG] | [DANO REAL] | [DERRUBADOS] | [CURA] | [LEVANTADOS] | [RESSURGIMENTO] | [% CABEÇA]

REGRAS DE EXTRAÇÃO — CRÍTICO:

1. NICKNAME: Extraia apenas o Nick, removendo tags de clã (ex: "7RS Mgking" -> "Mgking").
2. K/D/A (Kills/Deaths/Assists): Localizado LOGO ABAIXO do nick. Formato numérico X/Y/Z. 
   - Kills = primeiro número (X)
   - Mortes = segundo número (Y) 
   - Assists = terceiro número (Z)
   IMPORTANTE: Não confunda o K/D/A com as colunas à direita.

3. ESTATÍSTICAS (Colunas à direita do Nick/KDA):
   - dano (DMG): Primeira coluna numérica após o bloco do nick. Valores altos (ex: 4126).
   - derrubados: Terceira coluna numérica da tabela. NUNCA use o valor da coluna CURA ou Kills para este campo.
   - ressurgimentos: Sexta coluna numérica (geralmente 0 ou 1).

4. GERAL:
   - mapa: Nome do mapa no topo (ex: BERMUDA, PURGATÓRIO).
   - colocacao: Número em destaque no topo (ex: #1, #3). "BOOYAH" = 1.

Formato de retorno obrigatório:
{
  "mapa": "NOME_DO_MAPA",
  "colocacao": 1,
  "jogadores": [
    { 
      "nome": "NickDoJogador", 
      "kills": 10, 
      "mortes": 1, 
      "assists": 3, 
      "dano": 4126, 
      "derrubados": 8, 
      "ressurgimentos": 0 
    }
  ]
}

IMPORTANTE: Retorne SOMENTE o JSON puro.`
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
