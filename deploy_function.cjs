const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const TOKEN = 'sbp_1abf3efde6d064b3aee0756fad32a556b2fdc41c';
const PROJECT_REF = 'idegcrfymkgkjphluuda';
const FUNCTION_NAME = 'get-all-users';

const functionCode = fs.readFileSync(
    path.join(__dirname, 'supabase', 'functions', 'get-all-users', 'index.ts'),
    'utf-8'
);

// Boundary para multipart
const boundary = '----FormBoundary' + Date.now();

// Montar o metadata JSON part
const metaPart = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="metadata"',
    'Content-Type: application/json',
    '',
    JSON.stringify({ entrypoint_path: 'index.ts', import_map: null })
].join('\r\n');

// Part do arquivo index.ts
const filePart = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="file"; filename="index.ts"',
    'Content-Type: text/typescript',
    '',
    functionCode
].join('\r\n');

const body = Buffer.from([metaPart, filePart, `--${boundary}--`].join('\r\n') + '\r\n');

// Tentar criar (POST) ou atualizar (PATCH)
function deploy(method, extraPath = '') {
    return new Promise((resolve, reject) => {
        const opts = {
            hostname: 'api.supabase.com',
            path: `/v1/projects/${PROJECT_REF}/functions${extraPath}`,
            method,
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': body.length,
            }
        };
        const req = https.request(opts, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve({ status: res.statusCode, data }));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

console.log(`Fazendo deploy de ${FUNCTION_NAME}...`);

(async () => {
    // Tentar POST (criar)
    let res = await deploy('POST', '');
    console.log(`POST Status: ${res.status}`, res.data);
    
    if (res.status === 409) {
        // Já existe — atualizar com PATCH
        res = await deploy('PATCH', `/${FUNCTION_NAME}`);
        console.log(`PATCH Status: ${res.status}`, res.data);
    }
    
    if (res.status === 200 || res.status === 201) {
        console.log('✅ Edge Function implantada com sucesso!');
    } else {
        console.log('❌ Falha no deploy.');
    }
})();
