const fs = require('fs');
const path = require('path');

const filePath = path.join('D:', 'DOCUMENTOS', 'PROJETO ANALISE', 'src', 'pages', 'Dashboard.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Replace ANY select className with a standardized one that ensures dark mode
// We target common patterns we've seen
const updated = content
    .replace(/className="outline-none cursor-pointer bg-transparent"/g, 'className="bg-zinc-950 text-white border-none py-1.5 px-2 rounded-md outline-none cursor-pointer"')
    .replace(/className="bg-transparent text-sm outline-none cursor-pointer text-\[var\(--text-primary\)\] min-w-\[160px\]"/g, 'className="bg-zinc-950 text-white border-none py-1.5 px-2 rounded-md outline-none cursor-pointer min-w-[160px]"')
    .replace(/className="bg-\[var\(--bg-surface\)\] text-sm outline-none cursor-pointer text-\[var\(--text-primary\)\] min-w-\[160px\]"/g, 'className="bg-zinc-950 text-white border-none py-1.5 px-2 rounded-md outline-none cursor-pointer min-w-[160px]"');

fs.writeFileSync(filePath, updated);
console.log('Normalized ALL selects in Dashboard.');
