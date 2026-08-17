import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { Store } from './components/Store';
import { Farm } from './components/Farm';
import { AdminDashboard } from './components/AdminDashboard';
import { useGameEngine } from './hooks/useGameEngine';
import { useExchangeRate } from './hooks/useExchangeRate';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { Eye, EyeOff, ShoppingCart, Wallet, LogOut, Coins, TrendingUp, X } from 'lucide-react';
import { LandingPage } from './components/LandingPage';
import './App.css';

function Auth({ initialMode = false, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('Venezuela');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegister, setIsRegister] = useState(initialMode);
  const [error, setError] = useState('');

  const COUNTRIES = {
    Venezuela: {
      flag: '🇻🇪',
      states: ["Amazonas", "Anzoátegui", "Apure", "Aragua", "Barinas", "Bolívar", "Carabobo", "Cojedes", "Delta Amacuro", "Falcón", "Guárico", "Lara", "Mérida", "Miranda", "Monagas", "Nueva Esparta", "Portuguesa", "Sucre", "Táchira", "Trujillo", "La Guaira", "Yaracuy", "Zulia", "Distrito Capital"]
    },
    Colombia: {
      flag: '🇨🇴',
      states: ["Amazonas", "Antioquia", "Arauca", "Atlántico", "Bolívar", "Boyacá", "Caldas", "Caquetá", "Casanare", "Cauca", "Cesar", "Chocó", "Córdoba", "Cundinamarca", "Guainía", "Guaviare", "Huila", "La Guajira", "Magdalena", "Meta", "Nariño", "Norte de Santander", "Putumayo", "Quindío", "Risaralda", "San Andrés", "Santander", "Sucre", "Tolima", "Valle del Cauca", "Vaupés", "Vichada", "Bogotá"]
    },
    Peru: {
      flag: '🇵🇪',
      states: ["Amazonas", "Áncash", "Apurímac", "Arequipa", "Ayacucho", "Cajamarca", "Callao", "Cusco", "Huancavelica", "Huánuco", "Ica", "Junín", "La Libertad", "Lambayeque", "Lima", "Loreto", "Madre de Dios", "Moquegua", "Pasco", "Piura", "Puno", "San Martín", "Tacna", "Tumbes", "Ucayali"]
    },
    Argentina: {
      flag: '🇦🇷',
      states: ["Buenos Aires", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán", "CABA"]
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        if (!name || !phone || !state || !country) return setError('Todos los campos son obligatorios');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const { setDoc, doc } = await import('firebase/firestore');
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          name, phone, country, state, email, balance: 0
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-panel">
      <button 
        type="button" 
        onClick={onBack} 
        style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.9rem', padding: '0.5rem 1rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.3rem', transition: 'all 0.3s' }}
      >
        ← Volver
      </button>

      <div style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
        <img src="/img/app_icon.png" alt="Logo" style={{ width: '80px', height: '80px', borderRadius: '20px', marginBottom: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} />
        <h2 style={{ fontSize: '1.8rem', color: '#fff', margin: 0 }}>{isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
          {isRegister ? 'Únete a la granja más rentable' : 'Bienvenido de vuelta a tu granja'}
        </p>
      </div>

      {error && <p style={{ background: 'rgba(255, 76, 76, 0.2)', color: '#ff4c4c', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 'bold' }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {isRegister && (
          <>
            <input type="text" placeholder="Nombre Completo" value={name} onChange={e => setName(e.target.value)} style={{ padding: '1rem', borderRadius: '8px', border: 'none', outline: 'none', background: 'rgba(255,255,255,0.9)', color: '#000' }} required={isRegister} />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <select value={country} onChange={e => { setCountry(e.target.value); setState(''); }} style={{ padding: '1rem', borderRadius: '8px', border: 'none', outline: 'none', background: 'rgba(255,255,255,0.9)', color: '#000', cursor: 'pointer' }} required={isRegister}>
                {Object.entries(COUNTRIES).map(([cName, cData]) => (
                  <option key={cName} value={cName}>{cData.flag} {cName}</option>
                ))}
              </select>
              <input type="tel" placeholder="Teléfono" value={phone} onChange={e => setPhone(e.target.value)} style={{ padding: '1rem', borderRadius: '8px', border: 'none', outline: 'none', background: 'rgba(255,255,255,0.9)', color: '#000' }} required={isRegister} />
            </div>

            <select value={state} onChange={e => setState(e.target.value)} style={{ padding: '1rem', borderRadius: '8px', border: 'none', outline: 'none', background: 'rgba(255,255,255,0.9)', color: '#000', cursor: 'pointer' }} required={isRegister}>
              <option value="" disabled>Seleccione un Estado/Región...</option>
              {COUNTRIES[country]?.states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </>
        )}

        <input type="email" placeholder="Correo Electrónico" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: '1rem', borderRadius: '8px', border: 'none', outline: 'none', background: 'rgba(255,255,255,0.9)', color: '#000' }} required />
        
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input type={showPassword ? "text" : "password"} placeholder="Contraseña (mín 6 letras)" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: 'none', outline: 'none', background: 'rgba(255,255,255,0.9)', color: '#000' }} required />
          <div style={{ position: 'absolute', right: '10px', cursor: 'pointer', color: '#666' }} onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </div>
        </div>

        <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>
          {isRegister ? 'Registrarse' : 'Entrar'}
        </button>
      </form>
      <p style={{ marginTop: '1.5rem', cursor: 'pointer', color: 'var(--accent-color)', fontWeight: 'bold' }} onClick={() => setIsRegister(!isRegister)}>
        {isRegister ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
      </p>
    </div>
  );
}

function MainApp({ user }) {
  const { balance, chickens, buyChicken, collectEggs, rechargeBalance, incomePerDay, pendingRecharges } = useGameEngine(user);
  const { rate, loading: rateLoading } = useExchangeRate();
  const [showStore, setShowStore] = useState(false);
  const [showWallet, setShowWallet] = useState(false);

  return (
    <div className="game-container">
      
      {/* Game Header (Mobile First) */}
      <header className="game-header">
        <div className="game-stats-pill">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>
            <Coins size={18} /> 
            <span style={{ fontSize: '1.2rem' }}>${balance.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#fff', fontSize: '0.9rem', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '0.5rem' }}>
            <TrendingUp size={14} color="var(--accent-color)" /> +${incomePerDay.toFixed(2)}/d
          </div>
        </div>
        
        <button onClick={() => signOut(auth)} style={{ background: 'rgba(255,0,0,0.2)', border: 'none', color: '#ff4c4c', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
          <LogOut size={20} />
        </button>
      </header>

      {/* Main Farm Area (Fills remaining space) */}
      <main style={{ flex: 1, position: 'relative', width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
        <Farm chickens={chickens} onCollect={collectEggs} />
      </main>

      {/* Bottom Action Bar */}
      <footer className="game-bottom-bar">
        <button className="game-fab" onClick={() => setShowWallet(true)}>
          <Wallet size={24} />
        </button>
        <button className="game-fab" onClick={() => setShowStore(true)} style={{ background: 'var(--primary-color)', borderColor: 'var(--primary-color)' }}>
          <ShoppingCart size={24} />
        </button>
      </footer>

      {/* Modals for Store and Wallet */}
      {showStore && (
        <div className="game-modal-overlay">
          <div className="game-modal-content">
            <button className="close-modal-btn" onClick={() => setShowStore(false)}><X size={20} /></button>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ShoppingCart size={24} /> Tienda de Gallinas</h2>
            </div>
            <Store balance={balance} onBuy={buyChicken} rate={rate} />
          </div>
        </div>
      )}

      {showWallet && (
        <div className="game-modal-overlay">
          <div className="game-modal-content">
            <button className="close-modal-btn" onClick={() => setShowWallet(false)}><X size={20} /></button>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Wallet size={24} /> Billetera</h2>
            </div>
            {/* The Dashboard acts as our Wallet view now */}
            <Dashboard 
              balance={balance} 
              incomePerDay={incomePerDay} 
              onRecharge={rechargeBalance} 
              rate={rate}
              pendingRecharges={pendingRecharges}
            />
          </div>
        </div>
      )}

    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>Conectando a Firebase...</div>;

  if (!user) {
    if (showAuth) {
      return (
        <div className="auth-wrapper">
          <Auth initialMode={isRegister} onBack={() => setShowAuth(false)} />
        </div>
      );
    }
    return (
      <LandingPage 
        onLogin={() => { setIsRegister(false); setShowAuth(true); }} 
        onRegister={() => { setIsRegister(true); setShowAuth(true); }} 
      />
    );
  }

  if (user.email === 'admin@farmchicken.com') {
    return (
      <div className="layout-container" style={{ background: '#0f172a', minHeight: '100vh', width: '100vw', margin: 0, overflow: 'auto' }}>
        <AdminDashboard onLogout={() => signOut(auth)} />
      </div>
    );
  }

  return <MainApp user={user} />;
}
