import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const body = await req.json()
    
    if (body.type !== 'payment') {
      return new Response('ok', { status: 200 })
    }

    const accessToken = Deno.env.get('MP_ACCESS_TOKEN')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    const supabase = createClient(supabaseUrl, supabaseKey)

    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${body.data.id}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    const payment = await paymentResponse.json()

    if (payment.status !== 'approved') {
      return new Response('ok', { status: 200 })
    }

    const [user_id, plano, diasStr] = payment.external_reference.split('|')
    const dias = parseInt(diasStr)

    const dataInicio = new Date()
    const dataFim = new Date()
    dataFim.setDate(dataFim.getDate() + dias)

    const { error } = await supabase.from('subscriptions').upsert({
      user_id,
      plano,
      status: 'ativo',
      data_inicio: dataInicio.toISOString(),
      data_fim: dataFim.toISOString(),
      created_at: new Date().toISOString()
    }, { onConflict: 'user_id' })

    if (error) {
       console.error('Erro ao atualizar assinatura:', error);
       return new Response('error', { status: 500 })
    }

    return new Response('ok', { status: 200 })

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
