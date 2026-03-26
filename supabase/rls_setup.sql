-- Enable RLS on all tables
ALTER TABLE IF EXISTS perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS partidas_geral ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS performance_jogadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ip_registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS conquistas_jogadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS squad_jogadores ENABLE ROW LEVEL SECURITY;

-- 1. perfis (users only read/write their own profile)
DROP POLICY IF EXISTS "Usuário vê e edita seu próprio perfil" ON perfis;
CREATE POLICY "Usuário vê e edita seu próprio perfil" 
ON perfis FOR ALL 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- 2. subscriptions (users only see their own sub)
DROP POLICY IF EXISTS "Usuário vê sua própria assinatura" ON subscriptions;
CREATE POLICY "Usuário vê sua própria assinatura" 
ON subscriptions FOR SELECT 
USING (auth.uid() = user_id);

-- (Only service role can INSERT/UPDATE subscriptions via mp-webhook)
DROP POLICY IF EXISTS "Apenas service role edita subscriptions" ON subscriptions;
-- No policy added for INSERT/UPDATE so only service_role (bypasses RLS) can modify it.

-- 3. partidas_geral
DROP POLICY IF EXISTS "Usuário vê suas partidas" ON partidas_geral;
CREATE POLICY "Usuário vê suas partidas" 
ON partidas_geral FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 4. performance_jogadores
DROP POLICY IF EXISTS "Usuário vê seus dados de jogadores" ON performance_jogadores;
CREATE POLICY "Usuário vê seus dados de jogadores" 
ON performance_jogadores FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 5. conquistas_jogadores
DROP POLICY IF EXISTS "Usuário vê suas conquistas" ON conquistas_jogadores;
CREATE POLICY "Usuário vê suas conquistas" 
ON conquistas_jogadores FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 6. ip_registros
DROP POLICY IF EXISTS "Apenas service role e bloqueio via edge function" ON ip_registros;
-- No policies at all: only service role can read/write to ip_registros (enforced by lack of policies)

-- 7. squad_jogadores
DROP POLICY IF EXISTS "Usuário vê seus jogadores" ON squad_jogadores;
CREATE POLICY "Usuário vê seus jogadores" 
ON squad_jogadores FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 8. Rate Limiting Table (Created for Edge Functions)
CREATE TABLE IF NOT EXISTS api_rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action_type VARCHAR(50) NOT NULL,
  identifier VARCHAR(100) NOT NULL, -- Either IP or User ID
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Housekeeping index for quick counting
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_action ON api_rate_limits(action_type, identifier, created_at);

-- RLS para api_rate_limits (Apenas service role escreve/ler)
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;
