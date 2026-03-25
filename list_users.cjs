const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://idegcrfymkgkjphluuda.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkZWdjcmZ5bWtna2pwaGx1dWRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE4Nzc5OCwiZXhwIjoyMDg2NzYzNzk4fQ.ymS4J8PUuE7yDkJiCLNPxX0ycOlh5HfbU4LOsWxqHxQ'
);

(async () => {
    const { data: profiles, error: profileError } = await supabase
        .from('perfis')
        .select('id, email, nome');
    
    if (profileError) {
        console.error('Erro ao listar usuários:', profileError.message);
        return;
    }
    
    console.log('Total de usuários:', profiles.length);
    profiles.forEach(p => console.log(`- ${p.email} (${p.nome || 'Sem Nome'})`));
})();
