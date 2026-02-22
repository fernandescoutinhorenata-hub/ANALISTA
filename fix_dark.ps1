$file = 'd:/DOCUMENTOS/PROJETO ANALISE/src/pages/Dashboard.tsx'
$content = Get-Content $file -Raw

# Backgrounds
$content = $content -replace 'bg-slate-950', 'bg-black'
$content = $content -replace 'bg-slate-900', 'bg-neutral-900'
$content = $content -replace 'bg-slate-800/50', 'bg-neutral-800/50'
$content = $content -replace 'bg-slate-800', 'bg-neutral-800'

# Borders
$content = $content -replace 'border-slate-800/50', 'border-neutral-800/50'
$content = $content -replace 'border-slate-800', 'border-neutral-800'
$content = $content -replace 'border-slate-700', 'border-neutral-700'

# Dividers
$content = $content -replace 'divide-slate-800', 'divide-neutral-800'

# Hover
$content = $content -replace 'hover:bg-slate-800', 'hover:bg-neutral-800'

# Text
$content = $content -replace 'text-slate-50', 'text-neutral-50'
$content = $content -replace 'text-slate-200', 'text-neutral-200'
$content = $content -replace 'text-slate-300', 'text-neutral-300'
$content = $content -replace 'text-slate-400', 'text-neutral-400'
$content = $content -replace 'text-slate-500', 'text-neutral-500'
$content = $content -replace 'text-slate-600', 'text-neutral-600'
$content = $content -replace 'text-slate-700', 'text-neutral-700'

# Inline hex colors (charts/tooltips)
$content = $content -replace '#0f172a', '#0a0a0a'
$content = $content -replace '#1e293b', '#262626'
$content = $content -replace '#475569', '#737373'
$content = $content -replace '94a3b8', 'a3a3a3'

Set-Content $file $content -Encoding UTF8
Write-Host 'Done'
