import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Inicializa o cliente Supabase com a Service Key para bypassar RLS
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Garantir que apenas requisições POST sejam aceitas
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { event, product, customer } = req.body;

    // Extração e normalização dos dados
    const email = customer.email.trim().toLowerCase();
    const nome = customer.name;
    const plano = product.name;

    console.log(`[Lowify] Evento: ${event} | Email: ${email} | Plano: ${plano}`);

    // Passo 1: Buscar user_id pelo email na tabela 'perfis'
    // (Usamos 'perfis' pois 'auth.users' não é acessível diretamente pelo cliente padrão public)
    const { data: userData } = await supabase
      .from('perfis')
      .select('id, referral_code')
      .eq('email', email)
      .maybeSingle();

    const userId = userData?.id ?? null;

    // Passo 2: Processar eventos
    if (event === 'sale.paid') {
      // Cálculo dos dias de acesso (7 para semanal, 30 para mensal)
      const diasDeAcesso = plano.toLowerCase().includes('semanal') ? 7 : 30;
      const dataFim = new Date();
      dataFim.setDate(dataFim.getDate() + diasDeAcesso);

      // Upsert na tabela subscriptions (conflito por email)
      // Nota: Usamos 'data_fim' para manter compatibilidade com o AdminPanel existente
      const { error } = await supabase
        .from('subscriptions')
        .upsert(
          {
            user_id: userId,
            email,
            nome,
            plano,
            status: 'ativo',
            data_inicio: new Date().toISOString(),
            data_fim: dataFim.toISOString(),
          },
          { onConflict: 'email' }
        );

      if (error) throw error;
      console.log(`[Lowify] ✅ Assinatura Ativada: ${email} — ${diasDeAcesso} dias`);

      // LÓGICA DE COMISSÃO DE AFILIADOS
      if (userId && userData?.referral_code) {
        try {
          // 1. Buscar o afiliado pelo código do cupom
          const { data: affiliate } = await supabase
            .from('affiliates')
            .select('id, commission_rate, total_sales, total_earned')
            .eq('coupon_code', userData.referral_code)
            .maybeSingle();

          if (affiliate) {
            // 2. Definir valor da venda e calcular comissão
            // Modo Competitivo = R$10.00 | Elite Squad = R$25.00
            const saleAmount = plano.toLowerCase().includes('elite') ? 25 : 10;
            const commissionRate = Number(affiliate.commission_rate || 20);
            const commissionAmount = saleAmount * (commissionRate / 100);

            // 3. Registrar a venda na tabela affiliate_sales
            await supabase
              .from('affiliate_sales')
              .insert({
                affiliate_id: affiliate.id,
                buyer_user_id: userId,
                plan_name: plano,
                sale_amount: saleAmount,
                commission_amount: commissionAmount,
                status: 'pending'
              });

            // 4. Atualizar estatísticas acumuladas do afiliado
            await supabase
              .from('affiliates')
              .update({
                total_sales: (affiliate.total_sales || 0) + 1,
                total_earned: Number(affiliate.total_earned || 0) + commissionAmount
              })
              .eq('id', affiliate.id);

            console.log(`[Affiliate] ✅ Comissão de R$${commissionAmount} registrada para o cupom ${userData.referral_code}`);
          }
        } catch (affError: any) {
          console.error('[Affiliate] ❌ Erro ao registrar comissão:', affError.message);
        }
      }
    }

    else if (event === 'sale.pending') {
      const { error } = await supabase
        .from('subscriptions')
        .upsert(
          {
            user_id: userId,
            email,
            nome,
            plano,
            status: 'pendente',
            data_fim: null,
          },
          { onConflict: 'email' }
        );

      if (error) throw error;
      console.log(`[Lowify] ⏳ Assinatura Pendente: ${email}`);
    }

    else if (event === 'sale.refund') {
      // Em caso de reembolso, marcamos como inativo (ou expirado conforme AdminPanel)
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'expirado' })
        .eq('email', email);

      if (error) throw error;
      console.log(`[Lowify] ❌ Assinatura Cancelada (Reembolso): ${email}`);
    }

    else {
      console.log(`[Lowify] Evento ignorado: ${event}`);
    }

    return res.status(200).json({ success: true });

  } catch (error: any) {
    console.error('[Lowify] Erro no processamento:', error.message);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Erro interno no servidor' 
    });
  }
}
