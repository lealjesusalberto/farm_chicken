import React, { useState, useEffect } from 'react';
import { X, User, History, LogOut, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { CHICKEN_TYPES } from '../hooks/useGameEngine';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';

const COUNTRIES = {
  'Venezuela': { iconUrl: 'https://flagcdn.com/w80/ve.png' },
  'Colombia': { iconUrl: 'https://flagcdn.com/w80/co.png' },
  'Argentina': { iconUrl: 'https://flagcdn.com/w80/ar.png' },
  'Mexico': { iconUrl: 'https://flagcdn.com/w80/mx.png' },
  'Peru': { iconUrl: 'https://flagcdn.com/w80/pe.png' },
  'Chile': { iconUrl: 'https://flagcdn.com/w80/cl.png' },
  'Ecuador': { iconUrl: 'https://flagcdn.com/w80/ec.png' },
  'Espana': { iconUrl: 'https://flagcdn.com/w80/es.png' },
  'USA': { iconUrl: 'https://flagcdn.com/w80/us.png' }
};

export function Sidebar({ isOpen, onClose, userData, balance, eggBalance, chickens, onLogout }) {
  const [history, setHistory] = useState([]);
  const [oracleRate, setOracleRate] = useState(100);

  useEffect(() => {
    const unsubOracle = onSnapshot(doc(db, 'config', 'oracle'), (snap) => {
      if (snap.exists() && snap.data().rate) {
        setOracleRate(snap.data().rate);
      }
    });
    return () => unsubOracle();
  }, []);

  useEffect(() => {
    if (!isOpen || !userData?.id) return;
    const q = query(collection(db, 'transactions'), where('userId', '==', userData.id));
    const unsub = onSnapshot(q, (snap) => {
      const txs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      txs.sort((a,b) => b.createdAt - a.createdAt);
      setHistory(txs.slice(0, 4));
    });
    return () => unsub();
  }, [isOpen, userData?.id]);

  if (!isOpen) return null;

  // Calcular Nivel y XP
  const currentXp = userData?.xp || 0;
  const currentLevel = Math.floor(currentXp / 100) + 1;
  const xpProgress = currentXp % 100;

  // Calcular Producción Diaria de Huevos
  let dailyIncome = 0;
  let totalEggsPerDay = 0;
  
  chickens.forEach(chicken => {
    const type = CHICKEN_TYPES.find(t => t.id === chicken.typeId);
    if (!type) return;
    
    let passiveMultiplier = 1;
    const powerFactor = chicken.clonePower !== undefined ? chicken.clonePower / 100 : (chicken.isHalfSpecial ? 0.5 : 1);
    
    if (chicken.typeId === 's_chef') {
      passiveMultiplier = 1 + (0.5 * powerFactor);
    } else if (chicken.typeId === 's_robin') {
      passiveMultiplier = 1 + (1.0 * powerFactor);
    }
    
    // Asumimos clima soleado y sin boost para la estimación base
    const eggTimeHours = type.eggTime / (1000 * 60 * 60);
    const cyclesPerDay = (24 / eggTimeHours) * passiveMultiplier;
    
    const clonePower = chicken.clonePower !== undefined ? chicken.clonePower : 100;
    totalEggsPerDay += cyclesPerDay * type.incomePerEgg * (clonePower / 100);
  });

  const dailyUSDT = totalEggsPerDay / oracleRate;



  return (
    <>
      <div 
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 1000, backdropFilter: 'blur(3px)',
          animation: 'fadeIn 0.2s ease-out'
        }}
      />
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: '320px', maxWidth: '85vw',
        background: 'var(--card-bg)', borderRight: '1px solid var(--glass-border)',
        zIndex: 1001, display: 'flex', flexDirection: 'column',
        boxShadow: '4px 0 20px rgba(0,0,0,0.5)',
        animation: 'slideRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Cabecera del Sidebar */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <img 
              src={COUNTRIES[userData?.country || 'Venezuela']?.iconUrl || 'https://flagcdn.com/w80/ve.png'} 
              alt="Country Flag" 
              style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-color)' }} 
            />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', textTransform: 'capitalize' }}>{userData?.name || userData?.email?.split('@')[0] || 'Jugador'}</h3>
              <span style={{ fontSize: '0.8rem', color: '#ccc' }}>Jugador Activo</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.5rem' }}>
            <X size={24} />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Nivel y Experiencia */}
          <section>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem 0', color: '#4ade80' }}><Activity size={18} /> Nivel Actual</h4>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 'bold' }}>Lv. {currentLevel}</span>
                <span style={{ color: '#ccc', fontSize: '0.9rem' }}>{Math.floor(xpProgress)} / 100 XP</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${xpProgress}%`, height: '100%', background: '#4ade80', transition: 'width 0.3s ease' }}></div>
              </div>
            </div>
          </section>

          {/* Estadísticas */}
          <section>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem 0', color: 'var(--accent-color)' }}><TrendingUp size={18} /> Producción Diaria</h4>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <span style={{ color: '#ccc', fontSize: '0.8rem', display: 'block', marginBottom: '0.2rem' }}>Huevos Est.</span>
                <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#fbbf24' }}>+{Math.floor(totalEggsPerDay)} H/d</span>
              </div>
              <div>
                <span style={{ color: '#ccc', fontSize: '0.8rem', display: 'block', marginBottom: '0.2rem' }}>Equiv. USDT</span>
                <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#4ade80' }}>~${dailyUSDT.toFixed(2)}/d</span>
              </div>
            </div>
          </section>

          {/* Historial (Dummy) */}
          <section>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem 0', color: '#fff' }}><History size={18} /> Transacciones</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {history.length === 0 && <p style={{color:'#aaa', fontSize:'0.8rem', textAlign:'center', marginTop:'1rem'}}>No hay transacciones aún</p>}
              {history.map((tx, i) => {
                const isRecharge = tx.type === 'deposit';
                const statusColor = tx.status === 'approved' ? '#4ade80' : (tx.status === 'rejected' ? '#ff4c4c' : '#fcd535');
                let statusText = 'Pendiente';
                if (tx.status === 'approved') statusText = 'Completado';
                if (tx.status === 'rejected') statusText = 'Rechazado';
                
                const dateObj = tx.createdAt ? new Date(tx.createdAt) : new Date();
                const dateStr = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

                return (
                <div key={tx.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: isRecharge ? 'rgba(74, 222, 128, 0.2)' : 'rgba(244, 63, 94, 0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <DollarSign size={16} color={isRecharge ? '#4ade80' : '#ff4c4c'} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{isRecharge ? 'Recarga' : 'Retiro'}</div>
                      <div style={{ fontSize: '0.7rem', color: '#ccc' }}>{dateStr}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: isRecharge ? '#4ade80' : '#ff4c4c' }}>
                      {isRecharge ? '+' : '-'}${Number(tx.amount || 0).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: statusColor }}>{statusText}</div>
                  </div>
                </div>
              )})}
              <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary-color)', cursor: 'pointer' }}>Ver todo el historial</span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer del Sidebar (Logout) */}
        <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button 
            onClick={() => { onClose(); onLogout(); }}
            style={{ width: '100%', padding: '0.8rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#ff4c4c', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.2)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'}
          >
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      </div>
    </>
  );
}
