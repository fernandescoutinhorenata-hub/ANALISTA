const fs = require('fs');
const path = require('path');

const filePath = path.join('D:', 'DOCUMENTOS', 'PROJETO ANALISE', 'src', 'pages', 'InputData.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

const modalCode = `
            {/* 📊 Modal de Detalhes da Partida (Pós-Salvamento) */}
            {isMatchDetailModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-reveal">
                    <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                            <HelpCircle size={100} />
                        </div>

                        <div className="flex flex-col gap-6 relative z-10">
                            <div className="flex flex-col items-center text-center gap-2">
                                <div className="w-12 h-12 rounded-xl bg-[var(--accent-muted)] flex items-center justify-center text-[var(--accent)] mb-2">
                                    <Zap size={24} fill="currentColor" />
                                </div>
                                <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">Detalhes da Partida</h3>
                                <p className="text-xs text-[var(--text-secondary)] font-medium">Preencha para análise completa do coach</p>
                            </div>

                            <div className="space-y-6 mt-4">
                                {/* Pergunta 1: Quebra de Call */}
                                <div className="space-y-3">
                                    <label className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                                        Houve quebra de call?
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => setCallDetail(p => ({ ...p, quebraCall: true }))}
                                            className={\`py-3 rounded-lg text-xs font-bold transition-all border \${callDetail.quebraCall === true ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'bg-[var(--bg-main)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}\`}
                                        >
                                            SIM
                                        </button>
                                        <button 
                                            onClick={() => setCallDetail(p => ({ ...p, quebraCall: false }))}
                                            className={\`py-3 rounded-lg text-xs font-bold transition-all border \${callDetail.quebraCall === false ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'bg-[var(--bg-main)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}\`}
                                        >
                                            NÃO
                                        </button>
                                    </div>
                                </div>

                                {/* Pergunta 2: Resultado */}
                                <div className="space-y-3">
                                    <label className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                                        Qual foi o resultado?
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => setCallDetail(p => ({ ...p, resultadoCall: 'win' }))}
                                            className={\`py-3 rounded-lg text-xs font-bold transition-all border \${callDetail.resultadoCall === 'win' ? 'bg-[var(--accent-green)] border-[var(--accent-green)] text-white' : 'bg-[var(--bg-main)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}\`}
                                        >
                                            WIN
                                        </button>
                                        <button 
                                            onClick={() => setCallDetail(p => ({ ...p, resultadoCall: 'loss' }))}
                                            className={\`py-3 rounded-lg text-xs font-bold transition-all border \${callDetail.resultadoCall === 'loss' ? 'bg-[var(--accent-red)] border-[var(--accent-red)] text-white' : 'bg-[var(--bg-main)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}\`}
                                        >
                                            LOSS
                                        </button>
                                    </div>
                                </div>

                                {/* Pergunta 3: Qual Call (Condicional) */}
                                {callDetail.quebraCall && (
                                    <div className="space-y-3 animate-reveal">
                                        <label className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                                            Em qual call quebramos?
                                        </label>
                                        <input 
                                            type="text"
                                            value={callDetail.qualCall}
                                            onChange={(e) => setCallDetail(p => ({ ...p, qualCall: e.target.value }))}
                                            placeholder="Ex: Call do final, call da zona..."
                                            className="w-full bg-[var(--bg-main)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-all"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-3 mt-4">
                                <button
                                    onClick={handleSaveCallDetails}
                                    disabled={loading || callDetail.quebraCall === null || callDetail.resultadoCall === null}
                                    className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-4 font-black uppercase tracking-widest text-xs rounded-xl shadow-xl shadow-[var(--accent-glow)] transition-all disabled:opacity-30"
                                >
                                    {loading ? 'SALVANDO...' : 'Salvar e Continuar'}
                                </button>
                                <button
                                    onClick={handleCloseDetailModal}
                                    className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-[10px] font-bold uppercase transition-colors py-2 tracking-widest"
                                >
                                    Pular e fechar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )
`;

if (!content.includes('isMatchDetailModalOpen')) {
    console.log('Error: state not found');
} else if (!content.includes('Match Detail Modal')) {
    const updated = content.replace(/<style>\{`/, `\n${modalCode}\n\n            <style>{\``);
    fs.writeFileSync(filePath, updated);
    console.log('Success adding Modal JSX');
} else {
    console.log('Modal already exists');
}
