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
      .select('id')
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
