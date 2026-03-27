
-- 1. Criar tabela de eventos de pagamento (Idempotência) se não existir
CREATE TABLE IF NOT EXISTS payment_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mp_payment_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    amount NUMERIC,
    plan_type TEXT,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    raw_response JSONB
);

-- 2. Função Atômica para Ativação de Assinatura
CREATE OR REPLACE FUNCTION activate_subscription_atomic(
    p_mp_payment_id TEXT,
    p_user_id UUID,
    p_amount NUMERIC,
    p_plan_type TEXT,
    p_days_to_add INTEGER,
    p_raw_response JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    v_data_inicio TIMESTAMPTZ := NOW();
    v_data_fim TIMESTAMPTZ := NOW() + (p_days_to_add || ' days')::INTERVAL;
BEGIN
    -- Verificar Idempotência (se já foi processado)
    IF EXISTS (SELECT 1 FROM payment_events WHERE mp_payment_id = p_mp_payment_id) THEN
        RETURN TRUE; -- Já processado, retornar sucesso silencioso
    END IF;

    -- Registrar evento de pagamento
    INSERT INTO payment_events (mp_payment_id, user_id, amount, plan_type, raw_response)
    VALUES (p_mp_payment_id, p_user_id, p_amount, p_plan_type, p_raw_response);

    -- Atualizar ou Inserir Assinatura (Tabela: subscriptions conforme visto no código)
    INSERT INTO subscriptions (user_id, plano, status, data_inicio, data_fim, created_at)
    VALUES (p_user_id, p_plan_type, 'ativo', v_data_inicio, v_data_fim, v_data_inicio)
    ON CONFLICT (user_id) DO UPDATE 
    SET plano = p_plan_type,
        status = 'ativo',
        data_inicio = v_data_inicio,
        data_fim = v_data_fim,
        created_at = v_data_inicio;

    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Erro em activate_subscription_atomic: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
