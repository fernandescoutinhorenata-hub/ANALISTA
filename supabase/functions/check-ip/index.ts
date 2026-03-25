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

  // Pegar IP real do request
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() 
    || req.headers.get('cf-connecting-ip') 
    || 'unknown'

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
