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
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    // Service role pra burlar RLS e ler a tabela limits
    const sRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAdmin = createClient(supabaseUrl, sRoleKey)
    
    // Obter usuário do JWT
    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    })
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      console.error('[OCR] Auth Error or user missing')
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    // Rate Limiting: Máx 50 tentativas por usuário por hora
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
      console.warn(`[OCR] Rate limit hit for user ${user.id}: ${count}`)
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
    console.log(`[OCR] Chamando Anthropic — user: ${user.id}, model: claude-3-haiku-20240307`)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
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
              text: 'Extraia os dados da partida do Free Fire em JSON conforme as regras padrão.'
            }
          ]
        }]
      })
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error(`[OCR] Erro API Anthropic: ${response.status} - ${errorBody}`)
      return new Response(JSON.stringify({ error: `Erro na API: ${response.status}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || '{}'
    
    return new Response(JSON.stringify({ result: text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[OCR] Erro Geral:', (error as Error).message)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
