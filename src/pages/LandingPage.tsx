import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PlanosWhatsApp } from '../components/PlanosWhatsApp';
import logo from '../assets/logo.png';
import './LandingPage.css';

export const LandingPage: React.FC = () => {
    const { session, loading } = useAuth();
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [squads, setSquads] = useState(47);
    const [partidas, setPartidas] = useState(1243);
    const [prints, setPrints] = useState(3891);

    // Animating counters
    useEffect(() => {
        const intervalSquads = setInterval(() => {
            setSquads(prev => prev < 99 ? prev + 1 : prev);
        }, 8000);

        const intervalPartidas = setInterval(() => {
            setPartidas(prev => prev + 1);
        }, 5000);

        const intervalPrints = setInterval(() => {
            setPrints(prev => prev + 1);
        }, 3000);

        return () => {
            clearInterval(intervalSquads);
            clearInterval(intervalPartidas);
            clearInterval(intervalPrints);
        };
    }, []);

    // Carousel logic
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % 3);
        }, 3500);
        return () => clearInterval(interval);
    }, []);

    // Session check logic (NO REDIRECT LOOP)
    useEffect(() => {
        if (!loading && session) {
            navigate('/', { replace: true });
        }
    }, [session, loading, navigate]);

    const goToSlide = (n: number) => {
        setCurrentSlide(n);
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0F0F0F]">
                <div className="animate-spin h-8 w-8 border-4 border-[#5B5FFF]/30 border-t-[#5B5FFF] rounded-full" />
            </div>
        );
    }

    return (
        <div className="landing-page">
            <div className="urgency-bar">
                {squads} squads ativos <span className="urgency-sep">•</span> {partidas.toLocaleString('pt-BR')} partidas analisadas <span className="urgency-sep">•</span> {prints.toLocaleString('pt-BR')} prints lidos hoje
            </div>
            <nav>
                <a href="#" className="logo">
                    <img 
                        src={logo} 
                        alt="CTracker" 
                        style={{ height: '64px', width: 'auto', display: 'block' }} 
                    />
                </a>
                <ul className="nav-links">
                    <li><a href="#features">Funcionalidades</a></li>
                    <li><a href="#planos">Planos</a></li>
                    <li><a href="#depoimento">Depoimentos</a></li>
                </ul>
                <div className="nav-ctas">
                    <button onClick={() => navigate('/login')} className="btn-ghost-l">Entrar</button>
                    <button onClick={() => navigate('/login')} className="btn-nav-l">Começar agora</button>
                </div>
            </nav>

            <section className="hero">
                <div className="glow-1"></div>
                <div className="glow-2"></div>
                <div className="hero-inner">
                    <div>
                        <div className="hero-badge">Para coaches competitivos</div>
                        <h1>Chega de montar relatório de rodada<br /><span style={{ color: '#5B5FFF' }}>no Excel.</span></h1>
                        <p className="hero-desc">Sobe a screenshot. O Celo Tracker extrai kills, dano e posição em segundos. Sem digitar nada. Sem planilha. Sem trabalho manual.</p>
                        <div className="hero-ctas">
                            <a 
                                href="https://wa.me/5513981630304?text=Olá!%20Quero%20adquirir%20um%20plano%20do%20Celo%20Tracker!" 
                                className="btn-sec" 
                                style={{ borderColor: '#EDEDED', color: '#EDEDED', background: 'transparent' }}
                                target="_blank" 
                                rel="noreferrer"
                            >
                                Quero adquirir um plano
                            </a>
                            <a href="#features" className="btn-sec">Ver funcionalidades →</a>
                        </div>
                    </div>
                    <div className="hero-visual">
                        <div className="carousel-wrap">
                            <div className="carousel-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                                <img src="/dashboard1.jpg" alt="Dashboard Celo Tracker" className="carousel-img" />
                                <img src="/dashboard2.jpg" alt="Jogadores Celo Tracker" className="carousel-img" />
                                <img src="/dashboard3.jpg" alt="Analytics Celo Tracker" className="carousel-img" />
                            </div>
                            <div className="carousel-dots">
                                {[0, 1, 2].map((n) => (
                                    <span 
                                        key={n} 
                                        className={`dot ${currentSlide === n ? 'active' : ''}`} 
                                        onClick={() => goToSlide(n)}
                                    ></span>
                                ))}
                            </div>
                            <div className="carousel-overlay"></div>
                        </div>
                    </div>
                </div>
            </section>


            <section style={{ background: '#0F0F0F', padding: '80px 24px' }}>
                <div style={{ maxWidth: '860px', margin: '0 auto', textAlign: 'center' }}>
                    
                    <p style={{ color: '#5B5FFF', fontSize: '12px', fontWeight: 600, 
                    letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
                    VOCÊ SE RECONHECE AQUI?
                    </p>
                    
                    <h2 style={{ color: '#EDEDED', fontSize: '28px', fontWeight: 700, 
                    marginBottom: '8px' }}>
                    Todo coach competitivo já perdeu tempo
                    </h2>
                    <h2 style={{ color: '#5B5FFF', fontSize: '28px', fontWeight: 700, 
                    marginBottom: '48px' }}>
                    que deveria ter gasto treinando.
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', 
                    gap: '16px', marginBottom: '32px' }}>
                    
                    <div style={{ background: '#171717', border: '1px solid #2C2C2C', 
                        borderRadius: '12px', padding: '24px', textAlign: 'left' }}>
                        <p style={{ color: '#5B5FFF', fontWeight: 600, marginBottom: '8px' }}>
                        • Copiando dado na mão
                        </p>
                        <p style={{ color: '#A1A1A1', fontSize: '14px', lineHeight: '1.6' }}>
                        Abrindo screenshot, olhando número por número, digitando na planilha. 
                        Isso não é análise — é trabalho braçal.
                        </p>
                    </div>

                    <div style={{ background: '#171717', border: '1px solid #2C2C2C', 
                        borderRadius: '12px', padding: '24px', textAlign: 'left' }}>
                        <p style={{ color: '#5B5FFF', fontWeight: 600, marginBottom: '8px' }}>
                        • Decisão de lineup no achismo
                        </p>
                        <p style={{ color: '#A1A1A1', fontSize: '14px', lineHeight: '1.6' }}>
                        Você escalou o jogador porque "parecia bem" na última rodada. 
                        Sem dado histórico, toda escolha é um chute.
                        </p>
                    </div>

                    <div style={{ background: '#171717', border: '1px solid #2C2C2C', 
                        borderRadius: '12px', padding: '24px', textAlign: 'left' }}>
                        <p style={{ color: '#5B5FFF', fontWeight: 600, marginBottom: '8px' }}>
                        • Relatório que fica obsoleto
                        </p>
                        <p style={{ color: '#A1A1A1', fontSize: '14px', lineHeight: '1.6' }}>
                        Passou horas montando o report da rodada. 
                        Amanhã tem mais uma e você começa do zero de novo.
                        </p>
                    </div>

                    <div style={{ background: '#171717', border: '1px solid #2C2C2C', 
                        borderRadius: '12px', padding: '24px', textAlign: 'left' }}>
                        <p style={{ color: '#5B5FFF', fontWeight: 600, marginBottom: '8px' }}>
                        • Sem histórico de evolução
                        </p>
                        <p style={{ color: '#A1A1A1', fontSize: '14px', lineHeight: '1.6' }}>
                        Não sabe dizer se o jogador melhorou nos últimos 3 torneios. 
                        Só lembra da impressão geral, não dos números.
                        </p>
                    </div>
                    </div>

                    <div style={{ borderLeft: '3px solid #5B5FFF', padding: '20px 24px', 
                    background: '#171717', borderRadius: '0 12px 12px 0', 
                    textAlign: 'left', marginBottom: '32px' }}>
                    <p style={{ color: '#EDEDED', fontSize: '15px', fontStyle: 'italic', 
                        lineHeight: '1.7' }}>
                        "O Celo Tracker foi criado por coaches que viveram essas mesmas 
                        frustrações. A ideia é simples: você sobe o print, a IA lê tudo, 
                        e em segundos você tem o relatório pronto pra passar pro squad."
                    </p>
                    </div>

                    <button 
                        onClick={() => navigate('/login')}
                        style={{ background: 'transparent', border: '1px solid #EDEDED', 
                        color: '#EDEDED', padding: '14px 32px', borderRadius: '8px', 
                        fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}
                    >
                    Quero analisar sem planilha
                    </button>

                </div>
            </section>

            <section className="features" id="features">
                <div className="sec-wrap">
                    <div className="sec-header">
                        <div>
                            <div className="sec-tag">Funcionalidades</div>
                            <h2 className="sec-h2">Análise profissional para<br /><span>coaches competitivos</span></h2>
                        </div>
                        <p className="sec-sub">Do upload da screenshot ao relatório completo da rodada. Sem planilhas manuais, sem perder nenhum dado da partida.</p>
                    </div>
                    <div className="feat-grid">
                        <div className="feat-card">
                            <div className="feat-icon fi-p">
                                <svg xmlns="http://www.w3.org/2000/svg" stroke="#a78bfa" strokeWidth="1.5" width="22" height="22" fill="none" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>
                            </div>
                            <h3>OCR Automático</h3>
                            <p>Sobe a screenshot da partida e a IA extrai kills, mortes, dano e posição em segundos. Sem digitar nada.</p>
                        </div>
                        <div className="feat-card">
                            <div className="feat-icon fi-g">
                                <svg xmlns="http://www.w3.org/2000/svg" stroke="#a78bfa" strokeWidth="1.5" width="22" height="22" fill="none" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10" /><line x1="18" x2="18" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="16" /></svg>
                            </div>
                            <h3>Analytics em tempo real</h3>
                            <p>Dashboard com filtros por liga, data e campeonato. Veja a evolução de cada jogador rodada a rodada.</p>
                        </div>
                        <div className="feat-card">
                            <div className="feat-icon fi-b">
                                <svg xmlns="http://www.w3.org/2000/svg" stroke="#a78bfa" strokeWidth="1.5" width="22" height="22" fill="none" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                            </div>
                            <h3>Link público</h3>
                            <p>Compartilha o analytics da sua squad com qualquer pessoa via link único. Sem precisar criar conta.</p>
                        </div>
                        <div className="feat-card">
                            <div className="feat-icon fi-p">
                                <svg xmlns="http://www.w3.org/2000/svg" stroke="#a78bfa" strokeWidth="1.5" width="22" height="22" fill="none" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
                            </div>
                            <h3>Histórico por campeonato</h3>
                            <p>Separa os dados por torneio e liga. Compara performance entre fases e descobre onde sua equipe evolui.</p>
                        </div>
                        <div className="feat-card">
                            <div className="feat-icon fi-g">
                                <svg xmlns="http://www.w3.org/2000/svg" stroke="#a78bfa" strokeWidth="1.5" width="22" height="22" fill="none" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
                            </div>
                            <h3>Rodadas</h3>
                            <p>Acompanha a evolução da squad ao longo de um campeonato inteiro. Vê quais rodadas foram decisivas.</p>
                        </div>
                        <div className="feat-card">
                            <div className="feat-icon fi-b">
                                <svg xmlns="http://www.w3.org/2000/svg" stroke="#a78bfa" strokeWidth="1.5" width="22" height="22" fill="none" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            </div>
                            <h3>Sistema de afiliados</h3>
                            <p>Indica o Celo Tracker e ganha 20% de comissão em cada assinatura feita com seu cupom exclusivo.</p>
                        </div>
                    </div>
                </div>
            </section>

            <div className="divider-l"></div>

            <section className="planos" id="planos">
                <div className="sec-wrap">
                    <PlanosWhatsApp className="planos-landing-override" />
                </div>
            </section>

            <section className="depo" id="depoimento">
                <div className="depo-grid">
                    <div className="depo-card">
                        <div className="depo-quote" style={{ fontSize: '4rem', opacity: 0.2, position: 'absolute', top: '1rem', left: '1.5rem', fontFamily: 'serif' }}>"</div>
                        <p className="depo-text">"O Celo Tracker mudou como eu preparo minha equipe. Antes eu ficava copiando dado na mão. Agora subo a screenshot e em segundos já sei onde cada jogador precisa melhorar."</p>
                        <div className="depo-author">
                            <div className="depo-avatar">CR</div>
                            <div>
                                <div className="depo-name">Coach Rafinha</div>
                                <div className="depo-role">Head Coach — Liga DN</div>
                            </div>
                            <div className="stars">★★★★★</div>
                        </div>
                    </div>
                    
                    <div className="depo-card">
                        <div className="depo-quote" style={{ fontSize: '4rem', opacity: 0.2, position: 'absolute', top: '1rem', left: '1.5rem', fontFamily: 'serif' }}>"</div>
                        <p className="depo-text">"Antes do Celo Tracker eu passava horas no Excel tentando montar relatório de campeonato. Agora em 5 minutos tenho tudo pronto pra passar pro meu squad antes da próxima rodada."</p>
                        <div className="depo-author">
                            <div className="depo-avatar" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>CT</div>
                            <div>
                                <div className="depo-name">Coach Thiaguinho</div>
                                <div className="depo-role">Coach</div>
                            </div>
                            <div className="stars">★★★★★</div>
                        </div>
                    </div>

                    <div className="depo-card">
                        <div className="depo-quote" style={{ fontSize: '4rem', opacity: 0.2, position: 'absolute', top: '1rem', left: '1.5rem', fontFamily: 'serif' }}>"</div>
                        <p className="depo-text">"Eu jogava sem saber meus números reais. Depois que meu coach começou a usar o sistema, percebi que meu dano tava alto mas eu tava derrubando pouco. Isso mudou meu jogo."</p>
                        <div className="depo-author">
                            <div className="depo-avatar" style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}>DK</div>
                            <div>
                                <div className="depo-name">Dark</div>
                                <div className="depo-role">Jogador</div>
                            </div>
                            <div className="stars">★★★★★</div>
                        </div>
                    </div>

                    <div className="depo-card">
                        <div className="depo-quote" style={{ fontSize: '4rem', opacity: 0.2, position: 'absolute', top: '1rem', left: '1.5rem', fontFamily: 'serif' }}>"</div>
                        <p className="depo-text">"Ferramenta séria para coach sério. Consigo ver a evolução de cada jogador rodada a rodada e tomar decisão de lineup com dado real, não com achismo."</p>
                        <div className="depo-author">
                            <div className="depo-avatar" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>CM</div>
                            <div>
                                <div className="depo-name">Coach Matheuzin</div>
                                <div className="depo-role">Coach</div>
                            </div>
                            <div className="stars">★★★★★</div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="cta-sec">
                <div className="cta-inner">
                    <h2>Eleve o nível analítico<br /><span>da sua squad.</span></h2>
                    <p>Fale com a gente no WhatsApp e ative seu plano agora. Sem complicação, sem formulário.</p>
                    <a href="https://wa.me/5513981630304?text=Olá!%20Quero%20adquirir%20um%20plano%20do%20Celo%20Tracker!" className="btn-wpp" style={{ display: 'inline-flex', fontSize: '1rem', padding: '1rem 2.2rem' }} target="_blank" rel="noreferrer">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                        Quero adquirir um plano
                    </a>
                </div>
            </section>

            <footer>
                <a href="#" className="logo">
                    <img 
                        src={logo} 
                        alt="CTracker" 
                        style={{ height: '64px', width: 'auto', display: 'block' }} 
                    />
                </a>
                <ul className="footer-links">
                    <li><a href="#">Política de privacidade</a></li>
                    <li><a href="#">Termos de uso</a></li>
                </ul>
                <span className="footer-copy">© 2025 Celo Tracker. Todos os direitos reservados.</span>
            </footer>
        </div>
    );
};
