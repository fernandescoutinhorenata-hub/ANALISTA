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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace(/^Bearer\s+/i, '')
    
    // Ignorando user_id vindo do body para evitar falsificações
    const { plano, user_email } = await req.json()
    
    const accessToken = Deno.env.get('MP_ACCESS_TOKEN')
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Autenticar com a anon_key para verificar o token do usuário
    const supabaseAnon = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '')
    const { data: { user }, error: userError } = await supabaseAnon.auth.getUser(token)

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const real_user_id = user.id

    // Service role para interações com o banco (rate limit, etc)
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Rate Limiting: Máx 5 tentativas por IP por hora
    const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count, error: rlError } = await supabase
      .from('api_rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('action_type', 'create-payment')
      .eq('identifier', ip)
      .gt('created_at', umaHoraAtras)

    if (rlError) {
      console.error('[CreatePayment] RL Error', rlError)
    } else if (count !== null && count >= 5) {
      return new Response(JSON.stringify({ error: 'Muitas tentativas de pagamento. Tente novamente em 1 hora.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Registrar tentativa
    await supabase.from('api_rate_limits').insert({ action_type: 'create-payment', identifier: ip })

    console.log(`[CreatePayment] Iniciando para usuario ${real_user_id} (${user_email}), plano: ${plano}`);

    if (!accessToken) {
      console.error('[CreatePayment] Erro: MP_ACCESS_TOKEN nao configurado nas variaveis de ambiente.');
      return new Response(JSON.stringify({ error: 'Secret MP_ACCESS_TOKEN ausente' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const valor = plano === 'semanal' ? 10 : 25
    const titulo = plano === 'semanal' ? 'Celo Tracker - Plano Semanal' : 'Celo Tracker - Plano Mensal'
    const dias = plano === 'semanal' ? 7 : 30

    const preference = {
      items: [{
        title: titulo,
        quantity: 1,
        unit_price: valor,
        currency_id: 'BRL'
      }],
      payer: { email: user_email },
      external_reference: `${real_user_id}|${plano}|${dias}`,
      back_urls: {
        success: 'https://analista-eight.vercel.app/admin-celo/planos?status=success',
        failure: 'https://analista-eight.vercel.app/admin-celo/planos?status=failure',
        pending: 'https://analista-eight.vercel.app/admin-celo/planos?status=pending'
      },
      auto_return: 'approved',
      payment_methods: {
        excluded_payment_types: [
          { id: "ticket" },
          { id: "debit_card" }
        ],
        installments: 1
      }
    }

    console.log('[CreatePayment] Chamando Mercado Pago...');
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preference)
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[CreatePayment] Erro na API do Mercado Pago:', data);
      return new Response(JSON.stringify({ error: 'Erro no Mercado Pago', details: data }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('[CreatePayment] Sucesso! ID Gerado:', data.id);

    return new Response(JSON.stringify({ 
      init_point: data.init_point,
      id: data.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[CreatePayment] Erro inesperado:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
