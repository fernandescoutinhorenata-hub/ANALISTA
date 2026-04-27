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
                        className="logo-img"
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


            <section className="content-section" style={{ background: '#0F0F0F' }}>
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

                    <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', 
                    gap: '16px', marginBottom: '32px' }}>
                    
                    <div className="info-card" style={{ background: '#171717', border: '1px solid #2C2C2C', 
                        borderRadius: '12px', padding: '24px', textAlign: 'left' }}>
                        <p style={{ color: '#5B5FFF', fontWeight: 600, marginBottom: '8px' }}>
                        • Copiando dado na mão
                        </p>
                        <p style={{ color: '#A1A1A1', fontSize: '14px', lineHeight: '1.6' }}>
                        Abrindo screenshot, olhando número por número, digitando na planilha. 
                        Isso não é análise — é trabalho braçal.
                        </p>
                    </div>

                    <div className="info-card" style={{ background: '#171717', border: '1px solid #2C2C2C', 
                        borderRadius: '12px', padding: '24px', textAlign: 'left' }}>
                        <p style={{ color: '#5B5FFF', fontWeight: 600, marginBottom: '8px' }}>
                        • Decisão de lineup no achismo
                        </p>
                        <p style={{ color: '#A1A1A1', fontSize: '14px', lineHeight: '1.6' }}>
                        Você escalou o jogador porque "parecia bem" na última rodada. 
                        Sem dado histórico, toda escolha é um chute.
                        </p>
                    </div>

                    <div className="info-card" style={{ background: '#171717', border: '1px solid #2C2C2C', 
                        borderRadius: '12px', padding: '24px', textAlign: 'left' }}>
                        <p style={{ color: '#5B5FFF', fontWeight: 600, marginBottom: '8px' }}>
                        • Relatório que fica obsoleto
                        </p>
                        <p style={{ color: '#A1A1A1', fontSize: '14px', lineHeight: '1.6' }}>
                        Passou horas montando o report da rodada. 
                        Amanhã tem mais uma e você começa do zero de novo.
                        </p>
                    </div>

                    <div className="info-card" style={{ background: '#171717', border: '1px solid #2C2C2C', 
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


            <section className="content-section" style={{ background: '#0F0F0F' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>

                    <p style={{ color: '#5B5FFF', fontSize: '12px', fontWeight: 600,
                    letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
                    POR QUE MUDAR?
                    </p>

                    <h2 style={{ color: '#EDEDED', fontSize: '32px', fontWeight: 700,
                    marginBottom: '8px' }}>
                    O jeito antigo <span style={{ color: '#5B5FFF' }}>custa mais</span>
                    </h2>
                    <h2 style={{ color: '#EDEDED', fontSize: '32px', fontWeight: 700,
                    marginBottom: '16px' }}>
                    do que parece
                    </h2>

                    <p style={{ color: '#A1A1A1', fontSize: '15px', maxWidth: '600px',
                    margin: '0 auto 48px', lineHeight: '1.7' }}>
                    Cada rodada analisada no Excel é tempo que você não passou treinando,
                    ajustando táticas ou estudando o adversário.
                    </p>

                    {/* Tabela comparativa */}
                    <div className="compare-table" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr',
                    border: '1px solid #2C2C2C', borderRadius: '12px', overflow: 'hidden',
                    marginBottom: '48px' }}>

                    {/* Headers */}
                    <div style={{ background: '#1A1A1A', padding: '16px',
                        borderBottom: '1px solid #2C2C2C', borderRight: '1px solid #2C2C2C' }}>
                        <p style={{ color: '#777', fontSize: '11px', letterSpacing: '0.1em',
                        textTransform: 'uppercase', marginBottom: '4px' }}>ANTES</p>
                        <p style={{ color: '#EDEDED', fontWeight: 600 }}>Planilha / manual</p>
                    </div>
                    <div style={{ background: '#11124D', padding: '16px',
                        borderBottom: '1px solid #2C2C2C' }}>
                        <p style={{ color: '#5B5FFF', fontSize: '11px', letterSpacing: '0.1em',
                        textTransform: 'uppercase', marginBottom: '4px' }}>COM CELO TRACKER</p>
                        <p style={{ color: '#EDEDED', fontWeight: 600 }}>Análise por IA</p>
                    </div>

                    {/* Row 1 */}
                    <div style={{ padding: '20px', borderBottom: '1px solid #1A1A1A',
                        borderRight: '1px solid #2C2C2C', textAlign: 'left' }}>
                        <p style={{ color: '#FF5252', fontSize: '11px', fontWeight: 600,
                        marginBottom: '6px' }}>✕ COLETA DE DADOS</p>
                        <p style={{ color: '#A1A1A1', fontSize: '13px', lineHeight: '1.6',
                        marginBottom: '8px' }}>
                        Abre o print, lê cada número, digita na planilha.
                        Um jogador por vez, uma rodada por vez.
                        </p>
                        <span style={{ background: '#2A0B0B', color: '#FF5252', fontSize: '11px',
                        padding: '3px 8px', borderRadius: '4px' }}>~45 min por rodada</span>
                    </div>
                    <div style={{ padding: '20px', borderBottom: '1px solid #1A1A1A',
                        textAlign: 'left' }}>
                        <p style={{ color: '#00E676', fontSize: '11px', fontWeight: 600,
                        marginBottom: '6px' }}>✓ COLETA DE DADOS</p>
                        <p style={{ color: '#A1A1A1', fontSize: '13px', lineHeight: '1.6',
                        marginBottom: '8px' }}>
                        Sobe a screenshot. A IA lê <strong style={{ color: '#EDEDED' }}>kills,
                        dano, mortes e posição</strong> automaticamente. Sem digitar nada.
                        </p>
                        <span style={{ background: '#052E1F', color: '#00E676', fontSize: '11px',
                        padding: '3px 8px', borderRadius: '4px' }}>~30 segundos</span>
                    </div>

                    {/* Row 2 */}
                    <div style={{ padding: '20px', borderBottom: '1px solid #1A1A1A',
                        borderRight: '1px solid #2C2C2C', textAlign: 'left' }}>
                        <p style={{ color: '#FF5252', fontSize: '11px', fontWeight: 600,
                        marginBottom: '6px' }}>✕ HISTÓRICO DE EVOLUÇÃO</p>
                        <p style={{ color: '#A1A1A1', fontSize: '13px', lineHeight: '1.6',
                        marginBottom: '8px' }}>
                        Guarda em abas separadas por rodada. Impossível comparar fases
                        diferentes sem montar tabela nova.
                        </p>
                        <span style={{ background: '#2A0B0B', color: '#FF5252', fontSize: '11px',
                        padding: '3px 8px', borderRadius: '4px' }}>Dado espalhado e perdido</span>
                    </div>
                    <div style={{ padding: '20px', borderBottom: '1px solid #1A1A1A',
                        textAlign: 'left' }}>
                        <p style={{ color: '#00E676', fontSize: '11px', fontWeight: 600,
                        marginBottom: '6px' }}>✓ HISTÓRICO DE EVOLUÇÃO</p>
                        <p style={{ color: '#A1A1A1', fontSize: '13px', lineHeight: '1.6',
                        marginBottom: '8px' }}>
                        <strong style={{ color: '#EDEDED' }}>Dashboard com histórico
                        completo</strong> por jogador, rodada e campeonato. Tudo junto, filtrável.
                        </p>
                        <span style={{ background: '#052E1F', color: '#00E676', fontSize: '11px',
                        padding: '3px 8px', borderRadius: '4px' }}>Tudo em um lugar</span>
                    </div>

                    {/* Row 3 */}
                    <div style={{ padding: '20px', borderBottom: '1px solid #1A1A1A',
                        borderRight: '1px solid #2C2C2C', textAlign: 'left' }}>
                        <p style={{ color: '#FF5252', fontSize: '11px', fontWeight: 600,
                        marginBottom: '6px' }}>✕ DECISÃO DE LINEUP</p>
                        <p style={{ color: '#A1A1A1', fontSize: '13px', lineHeight: '1.6',
                        marginBottom: '8px' }}>
                        Baseada em impressão geral e memória da última rodada.
                        Sem dado comparativo entre jogadores.
                        </p>
                        <span style={{ background: '#2A0B0B', color: '#FF5252', fontSize: '11px',
                        padding: '3px 8px', borderRadius: '4px' }}>Achismo disfarçado de análise</span>
                    </div>
                    <div style={{ padding: '20px', borderBottom: '1px solid #1A1A1A',
                        textAlign: 'left' }}>
                        <p style={{ color: '#00E676', fontSize: '11px', fontWeight: 600,
                        marginBottom: '6px' }}>✓ DECISÃO DE LINEUP</p>
                        <p style={{ color: '#A1A1A1', fontSize: '13px', lineHeight: '1.6',
                        marginBottom: '8px' }}>
                        Compara performance dos jogadores por fase, por campeonato, por métrica.
                        Dado real, não feeling.
                        </p>
                        <span style={{ background: '#052E1F', color: '#00E676', fontSize: '11px',
                        padding: '3px 8px', borderRadius: '4px' }}>Decisão com evidência</span>
                    </div>

                    {/* Row 4 */}
                    <div style={{ padding: '20px', borderRight: '1px solid #2C2C2C',
                        textAlign: 'left' }}>
                        <p style={{ color: '#FF5252', fontSize: '11px', fontWeight: 600,
                        marginBottom: '6px' }}>✕ CUSTO REAL</p>
                        <p style={{ color: '#A1A1A1', fontSize: '13px', lineHeight: '1.6',
                        marginBottom: '8px' }}>
                        Grátis em dinheiro. Mas 3–4 horas por semana em trabalho manual
                        = tempo que não foi treinamento.
                        </p>
                        <span style={{ background: '#2A0B0B', color: '#FF5252', fontSize: '11px',
                        padding: '3px 8px', borderRadius: '4px' }}>Caro em tempo</span>
                    </div>
                    <div style={{ padding: '20px', textAlign: 'left' }}>
                        <p style={{ color: '#00E676', fontSize: '11px', fontWeight: 600,
                        marginBottom: '6px' }}>✓ CUSTO REAL</p>
                        <p style={{ color: '#A1A1A1', fontSize: '13px', lineHeight: '1.6',
                        marginBottom: '8px' }}>
                        A partir de <strong style={{ color: '#EDEDED' }}>R$0 grátis</strong> para
                        começar. Plano completo por menos de R$1,50 por dia de campeonato.
                        </p>
                        <span style={{ background: '#052E1F', color: '#00E676', fontSize: '11px',
                        padding: '3px 8px', borderRadius: '4px' }}>Barato em tempo e dinheiro</span>
                    </div>
                    </div>

                    {/* Barra de tempo */}
                    <div style={{ background: '#171717', border: '1px solid #2C2C2C',
                    borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
                    <p style={{ color: '#EDEDED', fontSize: '14px', fontWeight: 600,
                        marginBottom: '20px' }}>Tempo gasto por semana de campeonato</p>
                    <div style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between',
                        marginBottom: '6px' }}>
                        <span style={{ color: '#A1A1A1', fontSize: '13px' }}>
                            Planilha manual (por rodada)
                        </span>
                        <span style={{ color: '#FF5252', fontSize: '13px' }}>~3–4 horas</span>
                        </div>
                        <div style={{ background: '#FF5252', height: '8px',
                        borderRadius: '4px', width: '90%' }}/>
                    </div>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between',
                        marginBottom: '6px' }}>
                        <span style={{ color: '#A1A1A1', fontSize: '13px' }}>Com Celo Tracker</span>
                        <span style={{ color: '#00E676', fontSize: '13px' }}>~5 minutos</span>
                        </div>
                        <div style={{ background: '#00E676', height: '8px',
                        borderRadius: '4px', width: '8%' }}/>
                    </div>
                    </div>

                    {/* Ancoragem de valor */}
                    <div style={{ background: '#11124D', border: '1px solid #5B5FFF',
                    borderRadius: '12px', padding: '32px', marginBottom: '32px' }}>
                    <p style={{ color: '#5B5FFF', fontSize: '11px', fontWeight: 600,
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        marginBottom: '16px' }}>ANCORAGEM DE VALOR</p>
                    <p style={{ color: '#EDEDED', fontSize: '16px', lineHeight: '1.8' }}>
                        Se você gasta <strong>3 horas por semana</strong> em trabalho manual
                        que vale R$20/hora, está perdendo{' '}
                        <strong>R$240/mês em tempo</strong> — só para manter uma planilha.
                        <br/>O plano Elite Squad custa <strong>R$25/mês</strong>. A conta é simples.
                    </p>
                    <button 
                        onClick={() => navigate('/login')}
                        style={{ marginTop: '24px', background: '#5B5FFF',
                        color: '#EDEDED', border: 'none', padding: '14px 32px',
                        borderRadius: '8px', fontSize: '15px', fontWeight: 600,
                        cursor: 'pointer' }}>
                        Quero evoluir por R$25/mês
                    </button>
                    </div>

                </div>
            </section>

            <div className="divider-l"></div>

            <section className="planos" id="planos">
                <div className="sec-wrap">
                    <PlanosWhatsApp className="planos-landing-override" />
                </div>
            </section>


            <section className="content-section" style={{ background: '#0F0F0F' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>

                    <div className="depoimentos-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: '16px', marginBottom: '64px' }}>

                    <div className="depo-box" style={{ background: '#171717', border: '1px solid #2C2C2C',
                        borderRadius: '12px', padding: '24px' }}>
                        <p style={{ color: '#EDEDED', fontSize: '14px', lineHeight: '1.7',
                        fontStyle: 'italic', marginBottom: '20px' }}>
                        "O Celo Tracker mudou como eu preparo minha equipe. Antes eu ficava
                        copiando dado na mão. Agora subo a screenshot e em segundos já sei
                        <strong> onde cada jogador precisa melhorar.</strong>"
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%',
                            background: '#5B5FFF', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '12px', fontWeight: 700,
                            color: '#EDEDED' }}>CR</div>
                            <div>
                            <p style={{ color: '#EDEDED', fontSize: '13px',
                                fontWeight: 600, margin: 0 }}>Coach Rafinha</p>
                            <p style={{ color: '#5B5FFF', fontSize: '11px',
                                margin: 0 }}>Head Coach — Liga DN</p>
                            </div>
                        </div>
                        <span style={{ color: '#FFC107' }}>★★★★★</span>
                        </div>
                    </div>

                    <div className="depo-box" style={{ background: '#171717', border: '1px solid #2C2C2C',
                        borderRadius: '12px', padding: '24px' }}>
                        <p style={{ color: '#EDEDED', fontSize: '14px', lineHeight: '1.7',
                        fontStyle: 'italic', marginBottom: '20px' }}>
                        "Antes eu passava horas no Excel tentando montar relatório de
                        campeonato. Agora <strong>em 5 minutos tenho tudo pronto</strong> pra
                        passar pro meu squad antes da próxima rodada."
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%',
                            background: '#00D1B2', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '12px', fontWeight: 700,
                            color: '#EDEDED' }}>CT</div>
                            <div>
                            <p style={{ color: '#EDEDED', fontSize: '13px',
                                fontWeight: 600, margin: 0 }}>Coach Thiaguinho</p>
                            <p style={{ color: '#5B5FFF', fontSize: '11px',
                                margin: 0 }}>Coach</p>
                            </div>
                        </div>
                        <span style={{ color: '#FFC107' }}>★★★★★</span>
                        </div>
                    </div>

                    <div className="depo-box" style={{ background: '#171717', border: '1px solid #2C2C2C',
                        borderRadius: '12px', padding: '24px' }}>
                        <p style={{ color: '#EDEDED', fontSize: '14px', lineHeight: '1.7',
                        fontStyle: 'italic', marginBottom: '20px' }}>
                        "Eu jogava sem saber meus números reais. Depois que meu coach começou
                        a usar o sistema, percebi que <strong>meu dano tava alto mas eu tava
                        derrubando pouco</strong>. Isso mudou meu jogo."
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%',
                            background: '#FF3EDB', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '12px', fontWeight: 700,
                            color: '#EDEDED' }}>DK</div>
                            <div>
                            <p style={{ color: '#EDEDED', fontSize: '13px',
                                fontWeight: 600, margin: 0 }}>Dark</p>
                            <p style={{ color: '#5B5FFF', fontSize: '11px',
                                margin: 0 }}>Jogador</p>
                            </div>
                        </div>
                        <span style={{ color: '#FFC107' }}>★★★★★</span>
                        </div>
                    </div>

                    <div className="depo-box" style={{ background: '#171717', border: '1px solid #2C2C2C',
                        borderRadius: '12px', padding: '24px' }}>
                        <p style={{ color: '#EDEDED', fontSize: '14px', lineHeight: '1.7',
                        fontStyle: 'italic', marginBottom: '20px' }}>
                        "Ferramenta séria para coach sério. Consigo ver a evolução de cada
                        jogador rodada a rodada e <strong>tomar decisão de lineup com dado
                        real</strong>, não com achismo."
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%',
                            background: '#FF8C00', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '12px', fontWeight: 700,
                            color: '#EDEDED' }}>CM</div>
                            <div>
                            <p style={{ color: '#EDEDED', fontSize: '13px',
                                fontWeight: 600, margin: 0 }}>Coach Matheuzin</p>
                            <p style={{ color: '#5B5FFF', fontSize: '11px',
                                margin: 0 }}>Coach</p>
                            </div>
                        </div>
                        <span style={{ color: '#FFC107' }}>★★★★★</span>
                        </div>
                    </div>
                    </div>

                    {/* Resumo do que vai ter */}
                    <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <p style={{ color: '#5B5FFF', fontSize: '12px', fontWeight: 600,
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        marginBottom: '24px' }}>RESUMINDO TUDO QUE VOCÊ VAI TER</p>

                    <div className="resumo-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr',
                        gap: '12px', marginBottom: '48px', textAlign: 'left' }}>
                        {[
                        ['OCR automático', '— sobe o print, a IA extrai tudo em segundos'],
                        ['Dashboard completo', 'com histórico por jogador, rodada e campeonato'],
                        ['Link público', '— qualquer jogador acessa sem criar conta'],
                        ['Filtros por liga e data', 'para comparar fases e campeonatos'],
                        ['Histórico preservado', 'mesmo quando o squad muda'],
                        ['Decisão de lineup', 'com dado real, não com achismo'],
                        ].map(([bold, rest], i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start',
                            gap: '10px', background: '#171717', border: '1px solid #2C2C2C',
                            borderRadius: '8px', padding: '16px' }}>
                            <span style={{ color: '#00E676', fontSize: '16px',
                            marginTop: '1px' }}>✓</span>
                            <p style={{ color: '#A1A1A1', fontSize: '13px',
                            lineHeight: '1.6', margin: 0 }}>
                            <strong style={{ color: '#EDEDED' }}>{bold}</strong>{rest}
                            </p>
                        </div>
                        ))}
                    </div>

                    <h2 style={{ color: '#EDEDED', fontSize: '32px', fontWeight: 700,
                        marginBottom: '8px' }}>
                        Tudo isso por{' '}
                        <span style={{ color: '#5B5FFF' }}>menos de R$1,50 por dia.</span>
                    </h2>
                    <p style={{ color: '#A1A1A1', fontSize: '14px', marginBottom: '32px' }}>
                        Começa grátis. Faz o upgrade quando quiser.{' '}
                        <strong style={{ color: '#EDEDED' }}>Sem contrato, sem formulário.</strong>
                    </p>

                    <a href="/login" style={{ display: 'block', maxWidth: '400px',
                        margin: '0 auto 12px', background: '#5B5FFF', color: '#EDEDED',
                        padding: '16px 32px', borderRadius: '8px', fontSize: '16px',
                        fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>
                        Quero começar grátis agora
                    </a>
                    <p style={{ color: '#777', fontSize: '12px', marginBottom: '16px' }}>
                        Acesso imediato · Cancele quando quiser ·{' '}
                        <span style={{ color: '#5B5FFF' }}>Sem cartão para o plano grátis</span>
                    </p>
                    <button 
                        onClick={() => navigate('/admin-celo/planos')}
                        style={{ display: 'block', maxWidth: '400px', width: '100%',
                        margin: '0 auto', border: '1px solid #2C2C2C', background: 'transparent', color: '#EDEDED',
                        padding: '14px 32px', borderRadius: '8px', fontSize: '15px',
                        fontWeight: 600, textDecoration: 'none', textAlign: 'center', cursor: 'pointer' }}>
                        Ver todos os planos →
                    </button>
                    </div>

                </div>
            </section>

            <footer>
                <a href="#" className="logo">
                    <img 
                        src={logo} 
                        alt="CTracker" 
                        className="logo-img"
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
