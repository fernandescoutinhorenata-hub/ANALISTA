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
    const { plano, user_id, user_email } = await req.json()
    const accessToken = Deno.env.get('MP_ACCESS_TOKEN')

    console.log(`[CreatePayment] Iniciando para usuario ${user_id} (${user_email}), plano: ${plano}`);

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
      external_reference: `${user_id}|${plano}|${dias}`,
      back_urls: {
        success: 'https://analista-eight.vercel.app/admin-celo/planos?status=success',
        failure: 'https://analista-eight.vercel.app/admin-celo/planos?status=failure',
        pending: 'https://analista-eight.vercel.app/admin-celo/planos?status=pending'
      },
      auto_return: 'approved',
      payment_methods: {
        excluded_payment_types: [],
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
