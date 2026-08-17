import React from 'react';
import { Gamepad2, Landmark, Coins, LogIn, UserPlus } from 'lucide-react';

export function LandingPage({ onLogin, onRegister }) {
  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: 'var(--bg-dark)', color: 'var(--text-main)', overflowX: 'hidden' }}>
      
      {/* Hero Section */}
      <header style={{
        position: 'relative',
        width: '100%',
        height: '70vh',
        minHeight: '500px',
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
          background: 'linear-gradient(to right, #fb923c, #f43f5e)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          EggVerse
        </h1>
        <p style={{ fontSize: 'clamp(1rem, 4vw, 1.5rem)', maxWidth: '600px', marginBottom: '2.5rem', textShadow: '0 2px 10px rgba(0,0,0,0.8)', color: '#f8fafc' }}>
          ¡Construye tu granja virtual, cría gallinas y gana dinero real recolectando huevos de oro!
        </p>
        
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn-primary" onClick={onRegister} style={{ padding: '1rem 2.5rem', fontSize: '1.2rem' }}>
            <UserPlus size={24} /> Empezar a Jugar
          </button>
          <button className="btn-primary" onClick={onLogin} style={{ padding: '1rem 2.5rem', fontSize: '1.2rem', background: 'rgba(255,255,255,0.1)', color: '#fff', boxShadow: 'none' }}>
            <LogIn size={24} /> Iniciar Sesión
          </button>
        </div>
      </header>

      {/* How to Play Section */}
      <section style={{ padding: '5rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(2rem, 5vw, 2.5rem)', marginBottom: '4rem' }}>¿Cómo Funciona?</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '3rem' }}>
          {/* Paso 1 */}
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ background: 'rgba(251, 146, 60, 0.2)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Gamepad2 size={40} color="#fb923c" />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>1. Compra Gallinas</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Adquiere diferentes tipos de gallinas en la tienda. Cada una tiene un costo y un potencial de ganancias distinto.
            </p>
          </div>

          {/* Paso 2 */}
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ background: 'rgba(244, 63, 94, 0.2)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Coins size={40} color="#f43f5e" />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>2. Espera el Ciclo</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Las gallinas producirán 5 huevos a lo largo de 23 horas. ¡Recuerda entrar a tiempo para recolectarlos!
            </p>
          </div>

          {/* Paso 3 */}
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ background: 'rgba(74, 222, 128, 0.2)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Landmark size={40} color="#4ade80" />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>3. Retira tus Ganancias</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Vende los huevos y solicita el retiro de tus ganancias directamente a tu cuenta de Binance (USDT).
            </p>
          </div>
        </div>
      </section>

      {/* Economy Section */}
      <section style={{ padding: '5rem 2rem', background: 'rgba(0,0,0,0.3)', marginTop: '2rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 2.5rem)', marginBottom: '2rem' }}>Economía Global con Binance</h2>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: '800px', margin: '0 auto' }}>
            Todas las transacciones de depósito (para comprar saldo) y retiro (para sacar tus ganancias) se realizan de forma global e instantánea mediante Binance Pay (USDT), supervisadas y aprobadas por administradores reales.
          </p>
          <div style={{ display: 'inline-block' }}>
            <button className="btn-primary" onClick={onRegister} style={{ padding: '1rem 3rem', fontSize: '1.3rem' }}>
              ¡Comenzar mi Granja!
            </button>
          </div>
        </div>
      </section>

      <footer style={{ textAlign: 'center', padding: '2rem', borderTop: '1px solid var(--glass-border)', marginTop: 'auto' }}>
        <p style={{ color: 'var(--text-muted)' }}>&copy; 2026 EggVerse - Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
