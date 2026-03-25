const { createClient } = require('@supabase/supabase-js');

// Service Role Key - bypassa RLS completamente
const supabase = createClient(
  'https://idegcrfymkgkjphluuda.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkZWdjcmZ5bWtna2pwaGx1dWRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE4Nzc5OCwiZXhwIjoyMDg2NzYzNzk4fQ.ymS4J8PUuE7yDkJiCLNPxX0ycOlh5HfbU4LOsWxqHxQ'
);

const sql = `
-- Permitir leitura de todos os perfis (necessário para o painel admin)
DROP POLICY IF EXISTS "Permitir leitura publica de perfis" ON public.perfis;
CREATE POLICY "Permitir leitura publica de perfis"
ON public.perfis
FOR SELECT
USING (true);

-- Permitir leitura de todas as assinaturas (necessário para o painel admin)
DROP POLICY IF EXISTS "Permitir leitura publica de subscriptions" ON public.subscriptions;
CREATE POLICY "Permitir leitura publica de subscriptions"
ON public.subscriptions
FOR SELECT
USING (true);
`;

(async () => {
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });
    if (error) {
        // Tentar via fetch direto na API de SQL
        console.log('RPC indisponível, tentando SQL direto...');
        const res = await fetch('https://idegcrfymkgkjphluuda.supabase.co/rest/v1/rpc/exec_sql', {
            method: 'POST',
            headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkZWdjcmZ5bWtna2pwaGx1dWRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE4Nzc5OCwiZXhwIjoyMDg2NzYzNzk4fQ.ymS4J8PUuE7yDkJiCLNPxX0ycOlh5HfbU4LOsWxqHxQ',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkZWdjcmZ5bWtna2pwaGx1dWRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE4Nzc5OCwiZXhwIjoyMDg2NzYzNzk4fQ.ymS4J8PUuE7yDkJiCLNPxX0ycOlh5HfbU4LOsWxqHxQ',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: sql }),
        });
        const txt = await res.text();
        console.log('Resposta:', txt);
    } else {
        console.log('✅ Policies criadas com sucesso!', data);
    }
})();
