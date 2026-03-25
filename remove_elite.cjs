const fs = require('fs');
const path = require('path');

const filePath = path.join('D:', 'DOCUMENTOS', 'PROJETO ANALISE', 'src', 'pages', 'Dashboard.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Regex to find and remove the entire Card containing "Classificação de Elite"
// It looks for <Card ...> ... Classificação de Elite ... </Card>
const regex = /<Card className="overflow-hidden p-0!">[\s\S]*?Classificação de Elite[\s\S]*?<\/Card>/;

const updatedContent = content.replace(regex, '');

if (content !== updatedContent) {
    fs.writeFileSync(filePath, updatedContent);
    console.log('Successfully removed Elite Ranking section.');
} else {
    console.log('Could not find Elite Ranking section.');
}
