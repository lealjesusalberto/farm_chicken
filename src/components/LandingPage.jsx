import React, { useState } from 'react';
import { Gamepad2, Landmark, Coins, LogIn, UserPlus, Users, Trophy, Wallet, CalendarDays, CheckCircle, Play } from 'lucide-react';

export function LandingPage({ onLogin, onRegister }) {
  const [investment, setInvestment] = useState(30);

  // Estimación de ROI optimista (Mejor escenario: ~5% diario con clima a favor y leyendas)
  const dailyIncome = investment * 0.05;
  const monthlyIncome = dailyIncome * 30;
  const sixMonthsIncome = dailyIncome * 180;
  const yearlyIncome = dailyIncome * 365;

  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: 'var(--bg-dark)', color: 'var(--text-main)', overflowX: 'hidden' }}>
      
      {/* Hero Section */}
      <header style={{
        position: 'relative',
        width: '100%',
        height: '60vh',
        minHeight: '450px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '2rem',
        backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.9)), url(/img/hero_banner.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <h1 style={{ 
          fontSize: 'clamp(3rem, 8vw, 5rem)', 
          fontWeight: '900', 
          marginBottom: '1rem',
          textShadow: '0 4px 20px rgba(0,0,0,0.8)',
          background: 'linear-gradient(to right, #fcd535, #f97316)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          EggVerse
        </h1>
        <p style={{ fontSize: 'clamp(1rem, 4vw, 1.5rem)', maxWidth: '600px', marginBottom: '2.5rem', textShadow: '0 2px 10px rgba(0,0,0,0.8)', color: '#f8fafc' }}>
          ¡Construye tu granja virtual, cría gallinas y gana dinero real!
        </p>
        
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn-primary" onClick={onRegister} style={{ padding: '1rem 2.5rem', fontSize: '1.2rem', background: 'linear-gradient(135deg, #fcd535, #f97316)', color: '#000' }}>
            <Play fill="#000" size={20} /> Unirme Ahora
          </button>
          <button className="btn-primary" onClick={onLogin} style={{ padding: '1rem 2.5rem', fontSize: '1.2rem', background: 'rgba(255,255,255,0.1)', color: '#fff', boxShadow: 'none' }}>
            <LogIn size={20} /> Iniciar Sesión
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
        
        {/* HOW IT WORKS */}
        <section className="glass-panel" style={{ padding: '2rem', textAlign: 'center', marginBottom: '2rem', borderTop: '4px solid #f97316' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '2rem', color: '#fff' }}>¿CÓMO FUNCIONA?</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
            {/* Step 1 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ background: '#4ade80', color: '#000', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginBottom: '0.5rem' }}>1</div>
              <h4 style={{ color: '#fff', marginBottom: '0.5rem', fontSize: '1rem' }}>RECARGA USDT</h4>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', height: '70px', marginBottom: '0.5rem' }}>
                 <Wallet size={40} color="#4ade80" />
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: '1.4' }}>Deposita USDT para obtener Monedas Huevo, la divisa principal de la granja.</p>
            </div>
            
            {/* Step 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ background: '#4ade80', color: '#000', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginBottom: '0.5rem' }}>2</div>
              <h4 style={{ color: '#fff', marginBottom: '0.5rem', fontSize: '1rem' }}>COMPRA GALLINAS</h4>
              <img src="/img/chicken_4.png" alt="Gallina" style={{ height: '70px', objectFit: 'contain', marginBottom: '0.5rem' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: '1.4' }}>Usa tus Huevos para adquirir gallinas en la tienda y empezar a producir.</p>
            </div>

            {/* Step 3 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ background: '#4ade80', color: '#000', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginBottom: '0.5rem' }}>3</div>
              <h4 style={{ color: '#fff', marginBottom: '0.5rem', fontSize: '1rem' }}>ALIMENTA Y RECOLECTA</h4>
              <img src="/img/egg_4.png" alt="Huevos" style={{ height: '70px', objectFit: 'contain', marginBottom: '0.5rem' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: '1.4' }}>Compra sacos de maíz y recoge constantemente los huevos que ponen tus gallinas.</p>
            </div>

            {/* Step 4 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ background: '#4ade80', color: '#000', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginBottom: '0.5rem' }}>4</div>
              <h4 style={{ color: '#fff', marginBottom: '0.5rem', fontSize: '1rem' }}>INCUBA Y CLONA</h4>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', height: '70px', marginBottom: '0.5rem' }}>
                 <Users size={40} color="#f97316" />
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: '1.4' }}>Usa la incubadora mística con tus huevos para descubrir Leyendas Originales o Clones.</p>
            </div>

            {/* Step 5 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ background: '#4ade80', color: '#000', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginBottom: '0.5rem' }}>5</div>
              <h4 style={{ color: '#fff', marginBottom: '0.5rem', fontSize: '1rem' }}>CAMBIA POR DINERO</h4>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', height: '70px', marginBottom: '0.5rem' }}>
                 <Coins size={50} color="#fcd535" />
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: '1.4' }}>Vende tu producción de huevos por USDT real y retíralo directo a tu cuenta de Binance.</p>
            </div>
          </div>
        </section>

        {/* LIVE FARM STATS */}
        <section className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', borderTop: '4px solid #4ade80' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '2rem', color: '#fff', margin: 0 }}>Estadísticas en Vivo</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(74,222,128,0.2)', padding: '4px 10px', borderRadius: '20px', color: '#4ade80', fontSize: '0.85rem', fontWeight: 'bold' }}>
              <div style={{ width: '8px', height: '8px', background: '#4ade80', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></div>
              Live
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div className="stat-card">
              <Wallet size={24} color="#f97316" />
              <div>
                <p className="stat-label">Retirado hoy</p>
                <p className="stat-value" style={{ color: '#4ade80' }}>$ 1,432</p>
              </div>
            </div>
            
            <div className="stat-card">
              <Users size={24} color="#3b82f6" />
              <div>
                <p className="stat-label">Jugadores online</p>
                <p className="stat-value">845 users</p>
              </div>
            </div>

            <div className="stat-card">
              <Trophy size={24} color="#fcd535" />
              <div>
                <p className="stat-label">Pago más alto de hoy</p>
                <p className="stat-value" style={{ color: '#4ade80' }}>$ 350</p>
              </div>
            </div>

            <div className="stat-card">
              <UserPlus size={24} color="#4ade80" />
              <div>
                <p className="stat-label">Unidos hoy</p>
                <p className="stat-value">+142 users</p>
              </div>
            </div>

            <div className="stat-card">
              <Landmark size={24} color="#a855f7" />
              <div>
                <p className="stat-label">Pagos realizados hoy</p>
                <p className="stat-value" style={{ color: '#fcd535' }}>84 pagos</p>
              </div>
            </div>

            <div className="stat-card">
              <Gamepad2 size={24} color="#ef4444" />
              <div>
                <p className="stat-label">Huevos farmeados hoy</p>
                <p className="stat-value">12,450</p>
              </div>
            </div>
          </div>
        </section>

        {/* FARM INCOME CALCULATOR */}
        <section className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', borderTop: '4px solid #3b82f6', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', color: '#fff', marginBottom: '1.5rem' }}>Ingresos de la Granja</h2>
          
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '2rem', marginBottom: '2rem' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 'bold' }}>Monto Inicial de Inversión</p>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#fff', marginBottom: '1.5rem', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
              ${investment}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
              <button onClick={() => setInvestment(Math.max(3, investment - 10))} className="calc-btn">-</button>
              <input 
                type="range" 
                min="3" 
                max="2000" 
                step="1" 
                value={investment} 
                onChange={(e) => setInvestment(Number(e.target.value))}
                className="custom-slider"
                style={{ flex: 1 }}
              />
              <button onClick={() => setInvestment(Math.min(2000, investment + 10))} className="calc-btn">+</button>
            </div>
          </div>

          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 'bold' }}>Escenario Óptimo Estimado (Mejor Rendimiento + Bonos)</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="income-card">
              <CalendarDays size={20} color="#f97316" />
              <div style={{ flex: 1, textAlign: 'left' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Por día (1)</p>
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4ade80' }}>${dailyIncome.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="income-card">
              <CalendarDays size={20} color="#f97316" />
              <div style={{ flex: 1, textAlign: 'left' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Por mes (30)</p>
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4ade80' }}>${monthlyIncome.toFixed(2)}</p>
              </div>
            </div>

            <div className="income-card">
              <CalendarDays size={20} color="#f97316" />
              <div style={{ flex: 1, textAlign: 'left' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>6 meses (180)</p>
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4ade80' }}>${sixMonthsIncome.toFixed(2)}</p>
              </div>
            </div>

            <div className="income-card">
              <CalendarDays size={20} color="#f97316" />
              <div style={{ flex: 1, textAlign: 'left' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Por año (365)</p>
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4ade80' }}>${yearlyIncome.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="glass-panel" style={{ padding: '2rem', borderTop: '4px solid #a855f7' }}>
          <h2 style={{ fontSize: '2rem', color: '#fff', marginBottom: '2rem', textAlign: 'center' }}>Lo que dicen los jugadores</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div className="testimonial-card">
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <img src="https://i.pravatar.cc/150?img=11" alt="Avatar" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', background: '#3b82f6', borderRadius: '50%', padding: '2px' }}>
                    <CheckCircle size={14} color="#fff" />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <h4 style={{ margin: 0, color: '#fff' }}>Tommy</h4>
                    <span style={{ fontSize: '0.7rem', color: '#aaa' }}>✓ Jugador verificado</span>
                  </div>
                  <p style={{ margin: '0 0 0.5rem 0', color: '#ddd', fontSize: '0.9rem', lineHeight: '1.4' }}>
                    Las primeras mejoras fueron muy fáciles de entender. Me encanta ver crecer la granja.
                  </p>
                  <div style={{ color: '#fcd535', letterSpacing: '2px' }}>★★★★★</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <img src="https://i.pravatar.cc/150?img=47" alt="Avatar" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', background: '#3b82f6', borderRadius: '50%', padding: '2px' }}>
                    <CheckCircle size={14} color="#fff" />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <h4 style={{ margin: 0, color: '#fff' }}>Lena89</h4>
                    <span style={{ fontSize: '0.7rem', color: '#aaa' }}>✓ Jugador verificado</span>
                  </div>
                  <p style={{ margin: '0 0 0.5rem 0', color: '#ddd', fontSize: '0.9rem', lineHeight: '1.4' }}>
                    La calculadora de recursos dejó muy claro qué cambia con cada mejora. ¡Pagan a tiempo!
                  </p>
                  <div style={{ color: '#fcd535', letterSpacing: '2px' }}>★★★★★</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <img src="https://i.pravatar.cc/150?img=68" alt="Avatar" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', background: '#3b82f6', borderRadius: '50%', padding: '2px' }}>
                    <CheckCircle size={14} color="#fff" />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <h4 style={{ margin: 0, color: '#fff' }}>FarmKing</h4>
                    <span style={{ fontSize: '0.7rem', color: '#aaa' }}>✓ Jugador verificado</span>
                  </div>
                  <p style={{ margin: '0 0 0.5rem 0', color: '#ddd', fontSize: '0.9rem', lineHeight: '1.4' }}>
                    Un juego simple con bonitas animaciones y funciona perfecto con Telegram.
                  </p>
                  <div style={{ color: '#fcd535', letterSpacing: '2px' }}>★★★★★</div>
                </div>
              </div>
            </div>
            
          </div>
        </section>

      </div>

      <footer style={{ textAlign: 'center', padding: '2rem', borderTop: '1px solid var(--glass-border)', marginTop: 'auto' }}>
        <p style={{ color: 'var(--text-muted)' }}>&copy; 2026 EggVerse - Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
