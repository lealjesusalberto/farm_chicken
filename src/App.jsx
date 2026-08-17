import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { Store } from './components/Store';
import { Farm } from './components/Farm';
import { AdminDashboard } from './components/AdminDashboard';
import { useGameEngine } from './hooks/useGameEngine';
import { useExchangeRate } from './hooks/useExchangeRate';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Eye, EyeOff } from 'lucide-react';
import './App.css';

function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');

  const VENEZUELA_STATES = [
    "Amazonas", "Anzoátegui", "Apure", "Aragua", "Barinas", "Bolívar", "Carabobo", "Cojedes", "Delta Amacuro", "Falcón", "Guárico", "Lara", "Mérida", "Miranda", "Monagas", "Nueva Esparta", "Portuguesa", "Sucre", "Táchira", "Trujillo", "La Guaira", "Yaracuy", "Zulia", "Distrito Capital"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        if (!name || !phone || !state) return setError('Todos los campos son obligatorios');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          name, phone, state, email, balance: 0
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', maxWidth: '400px', margin: '5vh auto', textAlign: 'center' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>{isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}</h2>
      {error && <p style={{ color: '#ff4c4c', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 'bold' }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {isRegister && (
          <>
            <input type="text" placeholder="Nombre Completo" value={name} onChange={e => setName(e.target.value)} style={{ padding: '1rem', borderRadius: '8px', border: 'none', outline: 'none', background: 'rgba(255,255,255,0.9)', color: '#000' }} required={isRegister} />
            <input type="tel" placeholder="Teléfono" value={phone} onChange={e => setPhone(e.target.value)} style={{ padding: '1rem', borderRadius: '8px', border: 'none', outline: 'none', background: 'rgba(255,255,255,0.9)', color: '#000' }} required={isRegister} />
            <select value={state} onChange={e => setState(e.target.value)} style={{ padding: '1rem', borderRadius: '8px', border: 'none', outline: 'none', background: 'rgba(255,255,255,0.9)', color: '#000' }} required={isRegister}>
              <option value="" disabled>Seleccione un Estado...</option>
              {VENEZUELA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
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

  return (
    <div className="layout-container">
      <div style={{ textAlign: 'center', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ textAlign: 'left' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: '800', background: 'linear-gradient(to right, var(--primary-color), var(--accent-color))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>
            EggVerse
          </h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>Firebase Cloud Edition</p>
            {!rateLoading && rate && (
              <span style={{ fontSize: '0.8rem', background: 'rgba(74, 222, 128, 0.2)', color: '#4ade80', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>
                BCV: {rate.toFixed(2)} Bs
              </span>
            )}
          </div>
        </div>
        <button className="btn-primary" onClick={() => signOut(auth)} style={{ background: 'rgba(255,255,255,0.1)', boxShadow: 'none' }}>
          Cerrar Sesión
        </button>
      </div>

      <Dashboard 
        balance={balance} 
        incomePerDay={incomePerDay} 
        onRecharge={rechargeBalance} 
        rate={rate}
        pendingRecharges={pendingRecharges}
      />

      <Farm chickens={chickens} onCollect={collectEggs} />
      
      <Store balance={balance} onBuy={buyChicken} rate={rate} />
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>Conectando a Firebase...</div>;

  if (!user) return (
    <div className="layout-container"><Auth /></div>
  );

  if (user.email === 'admin@farmchicken.com') {
    return (
      <div className="layout-container" style={{ background: '#0f172a', minHeight: '100vh', width: '100vw', margin: 0, overflow: 'auto' }}>
        <AdminDashboard onLogout={() => signOut(auth)} />
      </div>
    );
  }

  return <MainApp user={user} />;
}
