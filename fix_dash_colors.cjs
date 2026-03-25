const fs = require('fs');
const path = require('path');

const filePath = path.join('D:', 'DOCUMENTOS', 'PROJETO ANALISE', 'src', 'pages', 'Dashboard.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Replace bg-transparent with bg-[var(--bg-surface)] inside classNames, specifically for selects
const updated = content.replace(/className="bg-transparent text-sm/g, 'className="bg-[var(--bg-surface)] text-sm');

fs.writeFileSync(filePath, updated);
console.log('Fixed Dashboard selects background.');
