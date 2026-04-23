import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, Users, Activity, Shield, 
    FileSpreadsheet, DollarSign, CreditCard, 
    PlusCircle, AlertCircle, ChevronRight, 
    LogOut, Menu, Lock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.png';

interface SidebarLayoutProps {
    children: React.ReactNode;
    activeTab?: string;
    isSubscriber?: boolean;
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({ 
    children, 
    activeTab, 
    isSubscriber = false 
}) => {
    const { signOut } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const navItems = [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, path: '/?tab=overview', premium: false },
        { id: 'rounds', label: 'Rodadas', icon: PlusCircle, path: '/?tab=rounds', premium: false },
        { id: 'players', label: 'Jogadores', icon: Users, path: '/?tab=players', premium: false },
        { id: 'coletivo', label: 'Coletivo', icon: Activity, path: '/coletivo', premium: false },
        { id: 'quebras', label: 'Quebras', icon: Shield, path: '/quebras', premium: true },
        { id: 'history', label: 'Análise', icon: FileSpreadsheet, path: '/?tab=history', premium: true },
    ];

    return (
        <div className="min-h-screen w-full flex bg-[var(--bg-main)]">
            {/* Overlay para mobile */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col transform transition-transform duration-300 ease-in-out 
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                md:relative md:translate-x-0 bg-[var(--bg-surface)] border-r border-[var(--border-default)]`}
            >
                {/* Logo Section */}
                <div 
                    className="flex items-center cursor-pointer transition-all duration-300 group px-6 py-6" 
                    onClick={() => navigate('/')}
                >
                    <img 
                        src={logo} 
                        alt="CTracker" 
                        style={{ height: '32px', width: 'auto' }} 
                        className="transition-all duration-500 group-hover:scale-105" 
                    />
                </div>

                {/* Nav Items */}
                <nav className="flex-1 px-4 flex flex-col overflow-y-auto custom-scrollbar">
                    <div className="text-label mb-2 mt-2 px-2 text-[var(--text-disabled)] tracking-[0.1em]">ANÁLISE</div>
                    <div className="flex flex-col gap-1">
                        {navItems.filter(i => ['overview', 'rounds', 'players', 'coletivo'].includes(i.id)).map((item) => {
                            const isActive = activeTab === item.id;
                            const isLocked = item.premium && !isSubscriber;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        if (isLocked) {
                                            navigate('/planos', { 
                                                state: { message: "Esta funcionalidade é exclusiva para assinantes. Assine um plano para ter acesso completo." } 
                                            });
                                            return;
                                        }
                                        navigate(item.path);
                                        setIsSidebarOpen(false);
                                    }}
                                    className={`nav-item w-full flex items-center justify-between ${isActive ? 'active' : ''} ${isLocked ? 'opacity-80' : ''}`}
                                >
                                    <div className="flex items-center gap-[10px]">
                                        <item.icon size={18} />
                                        <span className="font-medium text-[14px]">{item.label}</span>
                                    </div>
                                    {isLocked && <Lock size={12} className="text-[var(--text-tertiary)]" />}
                                </button>
                            );
                        })}
                    </div>

                    <div className="text-label mb-2 mt-6 px-2 text-[var(--text-disabled)] tracking-[0.1em]">TÁTICO</div>
                    <div className="flex flex-col gap-1">
                        {navItems.filter(i => ['quebras', 'history'].includes(i.id)).map((item) => {
                            const isActive = activeTab === item.id;
                            const isLocked = item.premium && !isSubscriber;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        if (isLocked) {
                                            navigate('/planos', { 
                                                state: { message: "Esta funcionalidade é exclusiva para assinantes. Assine um plano para ter acesso completo." } 
                                            });
                                            return;
                                        }
                                        navigate(item.path);
                                        setIsSidebarOpen(false);
                                    }}
                                    className={`nav-item w-full flex items-center justify-between ${isActive ? 'active' : ''} ${isLocked ? 'opacity-80' : ''}`}
                                >
                                    <div className="flex items-center gap-[10px]">
                                        <item.icon size={18} />
                                        <span className="font-medium text-[14px]">{item.label}</span>
                                    </div>
                                    {isLocked && <Lock size={12} className="text-[var(--text-tertiary)]" />}
                                </button>
                            );
                        })}
                    </div>

                    <div className="text-label mb-2 mt-6 px-2 text-[var(--text-disabled)] tracking-[0.1em]">CONTA</div>
                    <div className="flex flex-col gap-1">
                        <button
                            onClick={() => { navigate('/afiliado'); setIsSidebarOpen(false); }}
                            className={`nav-item w-full flex items-center gap-[10px] ${activeTab === 'afiliados' ? 'active' : ''}`}
                        >
                            <DollarSign size={18} />
                            <span className="font-medium text-[14px]">Afiliados</span>
                        </button>

                        <button
                            onClick={() => { navigate('/admin-celo/planos'); setIsSidebarOpen(false); }}
                            className={`nav-item w-full flex items-center gap-[10px] ${activeTab === 'planos' ? 'active' : ''}`}
                        >
                            <CreditCard size={18} />
                            <span className="font-medium text-[14px]">Planos</span>
                        </button>

                        <button
                            onClick={() => { navigate('/?tab=security'); setIsSidebarOpen(false); }}
                            className={`nav-item w-full flex items-center gap-[10px] ${activeTab === 'security' ? 'active' : ''}`}
                        >
                            <Lock size={18} />
                            <span className="font-medium text-[14px]">Segurança</span>
                        </button>
                    </div>

                    <div className="pt-4 mt-6 border-t border-[var(--border-default)] mb-4">
                        <button
                            onClick={() => navigate('/input')}
                            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white w-full flex items-center justify-center gap-2 transition-all duration-150 rounded-[10px] font-semibold text-[14px] py-[12px]"
                        >
                            <PlusCircle size={18} />
                            Inserir Dados
                        </button>
                    </div>
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 space-y-2 border-t border-white/10">
                    <a
                        href="https://wa.me/13981630304"
                        target="_blank"
                        rel="noreferrer"
                        className="btn-ghost w-full flex items-center justify-between"
                    >
                        <span className="flex items-center gap-2">
                            <AlertCircle size={16} /> Suporte Técnico
                        </span>
                        <ChevronRight size={12} />
                    </a>
                    <button
                        onClick={() => signOut()}
                        className="btn-ghost w-full flex items-center gap-2 text-[var(--accent-red)] hover:bg-[var(--accent-red)]/10 border-transparent hover:border-[var(--accent-red)]/20"
                    >
                        <LogOut size={16} /> Sair da Conta
                    </button>
                    <div className="pt-4 text-center">
                        <p className="text-label">
                            Criado por <span className="text-[var(--accent)] font-bold">@CeloCoach</span>
                        </p>
                    </div>
                </div>
            </aside>

            {/* Content Wrapper */}
            <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden h-20 flex items-center justify-between px-6 bg-[var(--bg-main)]/80 backdrop-blur-md border-b border-[var(--border-default)] sticky top-0 z-30">
                    <button onClick={() => setIsSidebarOpen(true)} className="btn-ghost p-2">
                        <Menu size={20} />
                    </button>
                    <img src={logo} alt="CTracker" style={{ height: '32px', width: 'auto' }} />
                    <div className="w-10" /> {/* Spacer */}
                </header>
                
                {children}
            </div>
        </div>
    );
};
