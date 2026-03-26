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

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const body = await req.json()
  const { user_id, action } = body

  // Pegar IP real do request (Deno Deploy x-forwarded-for é seguro contra spoofing do client)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'

  // Rate Limiting: Máximo 20 tentativas por IP por hora
  const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count, error: rlError } = await supabase
    .from('api_rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('action_type', 'check_ip')
    .eq('identifier', ip)
    .gt('created_at', umaHoraAtras)

  if (rlError) {
    console.error('[CheckIP] RL Error', rlError)
  } else if (count !== null && count >= 20) {
    return new Response(JSON.stringify({ error: 'Muitas requisições. Tente novamente em 1 hora.' }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Registra a tentativa
  await supabase.from('api_rate_limits').insert({ action_type: 'check_ip', identifier: ip })

  if (action === 'check') {
    // Verificar se IP já tem registro
    const { data, error } = await supabase
      .from('ip_registros')
      .select('*')
      .eq('ip', ip)
      .maybeSingle()

    if (error) {
      console.error('Erro ao buscar IP:', error);
    }

    return new Response(JSON.stringify({ 
      bloqueado: !!data,
      ip 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  if (action === 'register') {
    // Registrar IP do novo usuário
    const { error } = await supabase
      .from('ip_registros')
      .upsert({ ip, user_id })

    if (error) {
      console.error('Erro ao registrar IP:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ error: 'Invalid action' }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
