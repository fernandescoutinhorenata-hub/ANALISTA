
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'


// --- Configurações por Plano ---
const PLANNERS: Record<string, { amount: number; days: number }> = {
    'semanal': { amount: 10.0, days: 7 },
    'mensal': { amount: 25.0, days: 30 }
};

// --- Utilitário de Comparação de Tempo Constante (Timing-Safe) ---
function safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}

serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    // 1. Sempre retornar 200 para evitar retries infinitos do MP (excisão no caso de error explícito de infra/rate limit)
    try {
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                   req.headers.get('x-real-ip')?.trim() || 
                   'unknown';

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // --- RATE LIMITING ---
        // TODO/NOTA: Em produção, os IPs oficiais do Mercado Pago devem ser whitelistados aqui
        // para garantir que os servidores do MP não corram o risco de trigger de throttling.
        const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { count, error: rlError } = await supabase
            .from('api_rate_limits')
            .select('*', { count: 'exact', head: true })
            .eq('action_type', 'mp-webhook')
            .eq('identifier', ip)
            .gt('created_at', umaHoraAtras);

        if (rlError) {
             console.error('[mp-webhook] RL Error', rlError);
        } else if (count !== null && count >= 20) {
             return new Response(JSON.stringify({ error: 'Too Many Requests' }), { 
                 status: 429, 
                 headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
             });
        }

        await supabase.from('api_rate_limits').insert({ action_type: 'mp-webhook', identifier: ip });

        const body = await req.json();
        const headerSignature = req.headers.get('x-signature');
        const requestId = req.headers.get('x-request-id');
        const webhookSecret = Deno.env.get('MP_WEBHOOK_SECRET');
        const accessToken = Deno.env.get('MP_ACCESS_TOKEN');

        // --- VALIDAÇÃO 1: Assinatura HMAC ---
        if (!headerSignature || !webhookSecret) {
            console.warn('Webhook sem assinatura ou segredo não configurado.');
            return new Response('Unauthorized', { status: 401 });
        }

        const parts = headerSignature.split(',').reduce((acc: any, part) => {
            const [k, v] = part.split('=');
            acc[k.trim()] = v.trim();
            return acc;
        }, {});

        const ts = parts['ts'];
        const v1 = parts['v1'];
        const paymentId = body.data?.id;

        if (!ts || !v1 || !paymentId) {
            console.warn('Dados insuficientes para validação de assinatura.');
            return new Response('Bad Request', { status: 400 });
        }

        // --- VALIDAÇÃO COM CRYPTO NATIVO ---
        const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`;
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            "raw",
            encoder.encode(webhookSecret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );
        const signatureBuffer = await crypto.subtle.sign(
            "HMAC",
            key,
            encoder.encode(manifest)
        );
        const v1Computed = Array.from(new Uint8Array(signatureBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        if (!safeCompare(v1Computed, v1)) {
            console.error('Assinatura HMAC inválida. Tentativa de falsificação detectada.');
            return new Response('Forbidden', { status: 403 });
        }

        // --- VALIDAÇÃO 2: Verificação do Tipo do Evento ---
        if (body.type !== 'payment') {
            return new Response('ok', { status: 200 });
        }

        // --- VALIDAÇÃO 3: Busca Direta na API do Mercado Pago (Segurança Zero-Trust) ---
        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!mpResponse.ok) {
            console.error(`Erro ao consultar API do MP: ${mpResponse.statusText}`);
            return new Response('External API Error', { status: 200 }); // Retornamos 200 pro MP para parar o retry e investigamos internamente
        }

        const payment = await mpResponse.json();

        if (payment.status !== 'approved') {
            console.log(`Pagamento ${paymentId} não aprovado (status: ${payment.status})`);
            return new Response('ok', { status: 200 });
        }

        // --- VALIDAÇÃO 4: Integridade dos Dados (Valor e Prazo) ---
        // Esperamos external_reference como 'user_id|plano' (ex: 'uuid|mensal')
        const [userId, planType] = payment.external_reference?.split('|') || [];
        const planConfig = PLANNERS[planType];

        if (!userId || !planConfig) {
            console.error(`Referência externa inválida ou plano não encontrado: ${payment.external_reference}`);
            return new Response('Invalid Reference', { status: 200 });
        }

        // Verificar se o valor pago bate exatamente com o plano (prevenção de fraude de valor)
        if (Number(payment.transaction_amount) < planConfig.amount) {
            console.error(`Fraude detectada: Valor pago (R$ ${payment.transaction_amount}) menor que o plano (R$ ${planConfig.amount})`);
            return new Response('Fraud Detected', { status: 200 });
        }

        // --- PROCESSAMENTO ATÔMICO NO BANCO ---
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Chamamos a RPC atômica (Idempotência + Registro + Assinatura)
        const { data: success, error: rpcError } = await supabase.rpc('activate_subscription_atomic', {
            p_mp_payment_id: paymentId.toString(),
            p_user_id: userId,
            p_amount: Number(payment.transaction_amount),
            p_plan_type: planType,
            p_days_to_add: planConfig.days,
            p_raw_response: payment
        });

        if (rpcError || !success) {
            console.error('Falha ao processar assinatura atomicamente:', rpcError);
            return new Response('Database Error', { status: 200 });
        }

        console.log(`Sucesso: Pagamento ${paymentId} processado para usuário ${userId} (${planType})`);
        return new Response('ok', { status: 200 });

    } catch (e: any) {
        console.error('CRITICAL WEBHOOK ERROR:', e.message);
        return new Response('Internal error but ACK sent', { status: 200 });
    }
});
