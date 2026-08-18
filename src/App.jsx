import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { Store } from './components/Store';
import { Farm } from './components/Farm';
import { Basket } from './components/Basket';
import { AdminDashboard } from './components/AdminDashboard';
import { useGameEngine } from './hooks/useGameEngine';
import { useExchangeRate } from './hooks/useExchangeRate';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { LogOut, Coins, ShieldCheck, Wallet, ShoppingCart, ShoppingBag, TrendingUp, Link, Users, Eye, EyeOff, X } from 'lucide-react';
import { LandingPage } from './components/LandingPage';
import './App.css';
import { collection, setDoc, doc, getCountFromServer, onSnapshot } from 'firebase/firestore';

export const COUNTRIES = {
  Venezuela: {
    flag: '🇻🇪',
    iconUrl: 'https://flagcdn.com/w80/ve.png',
    states: ["Amazonas", "Anzoátegui", "Apure", "Aragua", "Barinas", "Bolívar", "Carabobo", "Cojedes", "Delta Amacuro", "Falcón", "Guárico", "Lara", "Mérida", "Miranda", "Monagas", "Nueva Esparta", "Portuguesa", "Sucre", "Táchira", "Trujillo", "La Guaira", "Yaracuy", "Zulia", "Distrito Capital"]
  },
  Colombia: {
    flag: '🇨🇴',
    iconUrl: 'https://flagcdn.com/w80/co.png',
    states: ["Amazonas", "Antioquia", "Arauca", "Atlántico", "Bolívar", "Boyacá", "Caldas", "Caquetá", "Casanare", "Cauca", "Cesar", "Chocó", "Córdoba", "Cundinamarca", "Guainía", "Guaviare", "Huila", "La Guajira", "Magdalena", "Meta", "Nariño", "Norte de Santander", "Putumayo", "Quindío", "Risaralda", "San Andrés", "Santander", "Sucre", "Tolima", "Valle del Cauca", "Vaupés", "Vichada", "Bogotá"]
  },
  Peru: {
    flag: '🇵🇪',
    iconUrl: 'https://flagcdn.com/w80/pe.png',
    states: ["Amazonas", "Áncash", "Apurímac", "Arequipa", "Ayacucho", "Cajamarca", "Callao", "Cusco", "Huancavelica", "Huánuco", "Ica", "Junín", "La Libertad", "Lambayeque", "Lima", "Loreto", "Madre de Dios", "Moquegua", "Pasco", "Piura", "Puno", "San Martín", "Tacna", "Tumbes", "Ucayali"]
  },
  Argentina: {
    flag: '🇦🇷',
    iconUrl: 'https://flagcdn.com/w80/ar.png',
    states: ["Buenos Aires", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán", "CABA"]
  }
};

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        if (!name || !phone || !state || !country) return setError('Todos los campos son obligatorios');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
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
            <input type="text" placeholder="Nombre Completo" value={name} onChange={e => setName(e.target.value)} style={{ padding: '1rem', borderRadius: '8px', border: 'none', outline: 'none', background: 'rgba(255,255,255,0.9)', color: '#000', width: '100%', boxSizing: 'border-box' }} required={isRegister} />
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
              <select value={country} onChange={e => { setCountry(e.target.value); setState(''); }} style={{ padding: '1rem', borderRadius: '8px', border: 'none', outline: 'none', background: 'rgba(255,255,255,0.9)', color: '#000', cursor: 'pointer', width: '100%', boxSizing: 'border-box' }} required={isRegister}>
                {Object.entries(COUNTRIES).map(([cName, cData]) => (
                  <option key={cName} value={cName}>{cData.flag} {cName}</option>
                ))}
              </select>
              <input type="tel" placeholder="Teléfono" value={phone} onChange={e => setPhone(e.target.value)} style={{ padding: '1rem', borderRadius: '8px', border: 'none', outline: 'none', background: 'rgba(255,255,255,0.9)', color: '#000', width: '100%', boxSizing: 'border-box' }} required={isRegister} />
            </div>

            <select value={state} onChange={e => setState(e.target.value)} style={{ padding: '1rem', borderRadius: '8px', border: 'none', outline: 'none', background: 'rgba(255,255,255,0.9)', color: '#000', cursor: 'pointer', width: '100%', boxSizing: 'border-box' }} required={isRegister}>
              <option value="" disabled>Seleccione un Estado/Región...</option>
              {COUNTRIES[country]?.states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </>
        )}

        <input type="email" placeholder="Correo Electrónico" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: '1rem', borderRadius: '8px', border: 'none', outline: 'none', background: 'rgba(255,255,255,0.9)', color: '#000', width: '100%', boxSizing: 'border-box' }} required />
        
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input type={showPassword ? "text" : "password"} placeholder="Contraseña (mín 6 letras)" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '1rem', borderRadius: '8px', border: 'none', outline: 'none', background: 'rgba(255,255,255,0.9)', color: '#000' }} required />
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
  const [weatherData, setWeatherData] = useState({ type: 'sunny', history: [] });
  const weather = weatherData.type || 'sunny';
  const { balance, userData, chickens, buyChicken, buyMysteryEgg, buyFood, feedChicken, openMysteryEgg, sellChicken, collectEggs, sellEggs, incubateEggs, addTestEggs, rechargeBalance, requestWithdrawal, incomePerDay, pendingRecharges } = useGameEngine(user, weatherData);
  const { rate, loading: rateLoading } = useExchangeRate();
  const [showStore, setShowStore] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [showBasket, setShowBasket] = useState(false);
  const [farmingUsers, setFarmingUsers] = useState(89);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'global', 'weather'), (docSnap) => {
      if (docSnap.exists()) {
        setWeatherData(docSnap.data());
      } else {
        const initial = { type: 'sunny', history: [{ type: 'sunny', start: Date.now(), end: null }] };
        setDoc(doc(db, 'global', 'weather'), initial);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snapshot = await getCountFromServer(collection(db, 'users'));
        setFarmingUsers(89 + snapshot.data().count);
      } catch (e) {
        console.error(e);
      }
    };
    fetchUsers();
  }, []);

  const currentXp = userData?.xp || 0;
  const currentLevel = Math.floor(currentXp / 100) + 1;
  const xpProgress = currentXp % 100;

  const weatherLabels = {
    rain: { icon: '🌧️', text: 'Relentiza x2', color: '#93c5fd' },
    thunder: { icon: '⚡', text: 'Relentiza x2', color: '#a78bfa' },
    snow: { icon: '❄️', text: 'Relentiza x2', color: '#bfdbfe' },
    rainbow: { icon: '🌈', text: 'Acelera x0.5', color: '#fbcfe8' },
    stars: { icon: '✨', text: 'Acelera x0.5', color: '#fef08a' }
  };

  return (
    <div className="game-container">
      
      {/* Game Header (Mobile First) */}
      <header className="game-header">
        <div className="game-stats-pill">
          {userData && (
            <div style={{ paddingRight: '0.5rem', borderRight: '1px solid rgba(255,255,255,0.2)', marginRight: '0.5rem', display: 'flex', alignItems: 'center' }}>
              <img 
                src={COUNTRIES[userData.country || 'Venezuela']?.iconUrl || 'https://flagcdn.com/w80/ve.png'} 
                alt="Country Flag" 
                style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }} 
              />
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '0.5rem', marginRight: '0.5rem', borderRight: '1px solid rgba(255,255,255,0.2)', width: '60px' }}>
            <span style={{ fontSize: '0.7rem', color: '#ccc', fontWeight: 'bold' }}>Lv.{currentLevel}</span>
            <div style={{ width: '100%', height: '4px', background: 'rgba(0,0,0,0.3)', borderRadius: '2px', overflow: 'hidden', marginTop: '2px' }}>
              <div style={{ width: `${xpProgress}%`, height: '100%', background: '#4ade80' }}></div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>
            <Coins size={18} /> 
            <span style={{ fontSize: '1.2rem' }}>${(balance || 0).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#fff', fontSize: '0.9rem', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '0.5rem' }}>
            <TrendingUp size={14} color="var(--accent-color)" /> +${incomePerDay.toFixed(2)}/d
          </div>
        </div>
        
        <div className="header-right-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          
          {weather !== 'sunny' && weatherLabels[weather] && (
            <div className="game-stats-pill animate-float weather-pill" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: weatherLabels[weather].color, fontSize: '0.85rem', border: `1px solid ${weatherLabels[weather].color}80`, background: 'rgba(0,0,0,0.6)', boxShadow: `0 0 10px ${weatherLabels[weather].color}40` }}>
              <span>{weatherLabels[weather].icon}</span>
              <span className="weather-text" style={{ fontWeight: 'bold' }}>{weatherLabels[weather].text}</span>
            </div>
          )}

          <div className="game-stats-pill hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fff', fontSize: '0.85rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 5px #4ade80', animation: 'pulse 2s infinite' }}></div>
            <Users size={14} style={{ color: '#ccc' }} />
            <span style={{ fontWeight: 'bold' }}>{farmingUsers}</span> 
            <span style={{ color: '#ccc' }}>farmeando</span>
          </div>
          
          <button onClick={() => auth.signOut()} title="Cerrar Sesión" style={{ background: 'rgba(255,0,0,0.2)', border: 'none', color: '#ff4c4c', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
            <LogOut size={20} color="#ff4c4c" />
          </button>
        </div>
      </header>

      {/* Main Farm Area (Fills remaining space) */}
      <main style={{ flex: 1, position: 'relative', width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
        <Farm chickens={chickens} userData={userData} weatherData={weatherData} onCollect={collectEggs} onOpenEgg={openMysteryEgg} onSell={sellChicken} onFeed={feedChicken} />
      </main>

      {/* Bottom Action Bar */}
      <footer className="game-bottom-bar" style={{ display: 'flex', justifyContent: 'center', gap: '2rem' }}>
        <button className="game-fab" onClick={() => setShowWallet(true)}>
          <Wallet size={24} />
        </button>
        <button className="game-fab" onClick={() => setShowBasket(true)} style={{ background: '#f97316', borderColor: '#f97316' }}>
          <ShoppingBag size={24} />
        </button>
        <button className="game-fab" onClick={() => setShowStore(true)} style={{ background: 'var(--primary-color)', borderColor: 'var(--primary-color)' }}>
          <ShoppingCart size={24} />
        </button>
      </footer>

      {/* Modals */}
      {showStore && (
        <div className="modal-overlay" onClick={() => setShowStore(false)} style={{ zIndex: 1000, padding: '1rem' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: 0, maxWidth: '1400px', width: '100%', height: '100%', maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}><ShoppingCart size={24} /> Tienda de Gallinas</h2>
              <button className="btn-icon" style={{ background: 'rgba(255,0,0,0.2)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', border: 'none', cursor: 'pointer' }} onClick={() => setShowStore(false)}>
                <X size={20} color="#ff4c4c" />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <Store balance={balance} onBuy={buyChicken} onBuyMysteryEgg={buyMysteryEgg} onBuyFood={buyFood} rate={rate} />
            </div>
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
              userData={userData}
              incomePerDay={incomePerDay} 
              onRecharge={rechargeBalance} 
              onWithdraw={requestWithdrawal}
              rate={rate}
              pendingRecharges={pendingRecharges}
            />
          </div>
        </div>
      )}

      {showBasket && (
        <div className="modal-overlay" onClick={() => setShowBasket(false)} style={{ zIndex: 1000, padding: '1rem' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: 0, maxWidth: '900px', width: '100%', height: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}><ShoppingBag size={24} /> Cesta & Incubadora</h2>
              <button className="btn-icon" style={{ background: 'rgba(255,0,0,0.2)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', border: 'none', cursor: 'pointer' }} onClick={() => setShowBasket(false)}>
                <X size={20} color="#ff4c4c" />
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <Basket userData={userData} onSellEggs={sellEggs} onIncubateEggs={incubateEggs} onAddTestEggs={addTestEggs} />
            </div>
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
