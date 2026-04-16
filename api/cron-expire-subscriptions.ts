import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export default async function handler(req: Request) {
  // Verificar se é chamada autorizada do Vercel Cron
  // A Vercel envia um cabeçalho Authorization com um token que deve bater com o CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Atualizar assinaturas que expiraram (data_fim < agora e status ainda está 'ativo')
  const { data, error } = await supabase
    .from('subscriptions')
    .update({ status: 'expirado' })
    .lt('data_fim', new Date().toISOString())
    .eq('status', 'ativo')
    .select()

  if (error) {
    console.error('[Cron] Erro ao expirar assinaturas:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  console.log(`[Cron] Executado com sucesso. Assinaturas expiradas: ${data?.length ?? 0}`)
  
  return new Response(JSON.stringify({
    success: true,
    expirados: data?.length ?? 0
  }), { status: 200 })
}
