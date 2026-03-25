const https = require('https');

const TOKEN = 'sbp_1abf3efde6d064b3aee0756fad32a556b2fdc41c';
const PROJECT_REF = 'idegcrfymkgkjphluuda';

const sql = 'ALTER TABLE public.perfis DISABLE ROW LEVEL SECURITY; ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS \"Service role can read all perfis\" ON public.perfis; CREATE POLICY \"Service role can read all perfis\" ON public.perfis FOR SELECT USING (true);';

const data = JSON.stringify({ name: 'fix_rls_final', query: sql });

const options = {
    hostname: 'api.supabase.com',
    path: `/v1/projects/${PROJECT_REF}/database/migrations`,
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (d) => body += d);
    res.on('end', () => {
        console.log(`Status SQL: ${res.statusCode}`);
        console.log('Resposta:', body);
    });
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
