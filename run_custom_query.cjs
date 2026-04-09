const https = require('https');

const TOKEN = 'sbp_1abf3efde6d064b3aee0756fad32a556b2fdc41c';
const PROJECT_REF = 'idegcrfymkgkjphluuda';

const sql1 = `
SELECT DISTINCT campeonato, COUNT(*) as total
FROM partidas_geral
WHERE campeonato IN (
  'BAHIA LEAGUE', 'COPA WIND', 'LOTUS', 
  'TAÇA REVELATION', 'Bahia League', 'Copa Wind',
  'Lotus', 'Taça Revelation', 'TACA REVELATION',
  'bahia league', 'copa wind', 'lotus'
)
GROUP BY campeonato;
`;

const data1 = JSON.stringify({ query: sql1 });

const options = {
    hostname: 'api.supabase.com',
    path: `/v1/projects/${PROJECT_REF}/database/query`,
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data1)
    }
};

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (d) => body += d);
    res.on('end', () => {
        console.log(`Status SQL 1: ${res.statusCode}`);
        console.log('Result 1:', body);
    });
});

req.on('error', (e) => console.error(e));
req.write(data1);
req.end();
