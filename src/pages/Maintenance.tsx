import React from 'react';

export const Maintenance: React.FC = () => {
    return (
        <div className="min-h-screen bg-[var(--bg-main)] flex flex-col items-center justify-center p-6 relative overflow-hidden font-['Inter',sans-serif]">
            {/* Background Grid Sutil */}
            <div className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{ 
                        backgroundImage: `
                            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
                        `, 
                        backgroundSize: '40px 40px' 
                    }} />

            <div className="relative z-10 flex flex-col items-center text-center animate-reveal">
                <img
                    src="/image_10.png"
                    alt="Celo Logo"
                    className="w-48 h-auto mb-10 transition-all duration-700 hover:scale-105"
                />
                
                <div className="space-y-4 max-w-lg">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] leading-tight tracking-tight">
                        Em manutenção
                    </h1>
                    <p className="text-[var(--text-secondary)] text-lg leading-relaxed font-medium">
                        Estamos preparando novidades. <br className="hidden md:block" /> Voltamos em breve.
                    </p>
                </div>

                <div className="mt-16 w-12 h-1 bg-[var(--accent)] rounded-full animate-pulse opacity-50" />
            </div>

            <style>{`
                @keyframes reveal {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-reveal {
                    animation: reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
};
