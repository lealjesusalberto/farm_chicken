import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { useExchangeRate } from '../hooks/useExchangeRate';
import Swal from 'sweetalert2';

export function AdminDashboard({ onLogout }) {
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentWeather, setCurrentWeather] = useState('sunny');
  const { rate, loading: rateLoading } = useExchangeRate();

  useEffect(() => {
    // Escuchar transacciones en tiempo real
    const txQ = query(collection(db, 'transactions'), where('status', '==', 'pending'));
    const unsubTx = onSnapshot(txQ, (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      console.error("Error cargando transacciones:", error);
    });

    // Escuchar usuarios en tiempo real
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Error cargando usuarios:", error);
      setLoading(false);
    });

    // Escuchar clima en tiempo real
    const unsubWeather = onSnapshot(doc(db, 'global', 'weather'), (snap) => {
      if (snap.exists()) setCurrentWeather(snap.data().type || 'sunny');
    });

    return () => {
      unsubTx();
      unsubUsers();
      unsubWeather();
    };
  }, []);

  const changeWeather = async (type) => {
    try {
      const weatherRef = doc(db, 'global', 'weather');
      const snap = await getDoc(weatherRef);
      let history = [];
      const now = Date.now();
      
      if (snap.exists() && snap.data().history) {
        history = snap.data().history;
        if (history.length > 0 && history[history.length - 1].end === null) {
          history[history.length - 1].end = now;
        }
      }
      
      const twoDaysAgo = now - (48 * 60 * 60 * 1000);
      history = history.filter(h => h.end === null || h.end > twoDaysAgo);
      
      history.push({ type, start: now, end: null });
      
      await setDoc(weatherRef, { type, history });
      Swal.fire({
        title: 'Clima Actualizado',
        text: `El clima ha cambiado a ${type} para todos los jugadores.`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'Error cambiando el clima', 'error');
    }
  };

  const handleApprove = async (tx) => {
    try {
      const userRef = doc(db, 'users', tx.userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return Swal.fire('Error', 'Usuario no encontrado', 'error');
      
      // Solo agregamos balance si es un depósito. El retiro ya descontó el balance.
      if (tx.type !== 'withdrawal') {
        const newBalance = (userSnap.data().balance || 0) + tx.amount;
        await updateDoc(userRef, { balance: newBalance });
      }
      
      const txRef = doc(db, 'transactions', tx.id);
      await updateDoc(txRef, { status: 'approved' });
      
      Swal.fire('Aprobado', `Transacción de $${tx.amount.toFixed(2)} aprobada para ${tx.email}`, 'success');
      // No necesitamos fetchData() porque onSnapshot actualiza la lista automáticamente
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'Error aprobando transacción', 'error');
    }
  };

  const handleReject = async (tx) => {
    const isWithdrawal = tx.type === 'withdrawal';
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Quieres rechazar ${isWithdrawal ? 'el retiro' : 'la recarga'} de $${tx.amount.toFixed(2)} para ${tx.email}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, rechazar',
      cancelButtonText: 'Cancelar'
    });
    
    if (!result.isConfirmed) return;
    
    try {
      const txRef = doc(db, 'transactions', tx.id);
      
      // Si rechazamos un retiro, debemos DEVOLVER el saldo al usuario
      if (isWithdrawal) {
        const userRef = doc(db, 'users', tx.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const refundedBalance = (userSnap.data().balance || 0) + tx.amount;
          await updateDoc(userRef, { balance: refundedBalance });
        }
      }

      await updateDoc(txRef, { status: 'rejected' });
      Swal.fire('Rechazado', `La solicitud ha sido rechazada ${isWithdrawal ? '(saldo devuelto al jugador)' : ''}`, 'info');
      // No necesitamos fetchData() por onSnapshot
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'No se pudo rechazar', 'error');
    }
  };

  return (
    <div className="admin-container" style={{ color: '#fff' }}>
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem' }}>👑 Panel de Administrador</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <span style={{ fontSize: '1rem', background: 'rgba(252, 213, 53, 0.2)', color: '#fcd535', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 'bold' }}>
            Economía: Binance (USDT)
          </span>
          {!rateLoading && rate && (
            <span style={{ fontSize: '1rem', background: 'rgba(74, 222, 128, 0.2)', color: '#4ade80', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 'bold' }}>
              BCV: {rate.toFixed(2)} Bs
            </span>
          )}
        </div>
        <button className="btn-primary" onClick={onLogout} style={{ background: '#ff4c4c', padding: '1rem 2rem' }}>Cerrar Sesión</button>
      </div>

      <div className="admin-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* Solicitudes de Recarga */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3>💸 Solicitudes Pendientes</h3>
          {loading ? <p>Cargando...</p> : transactions.length === 0 ? <p style={{ color: '#aaa', marginTop: '1rem' }}>No hay recargas pendientes.</p> : (
            <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
              {transactions.map(tx => (
                <li key={tx.id} className="admin-tx-item" style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', marginBottom: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: 'bold', color: tx.type === 'withdrawal' ? '#ff4c4c' : '#fff' }}>
                      {tx.type === 'withdrawal' ? '📤 RETIRO' : '📥 RECARGA'} - {tx.email}
                    </p>
                    <p style={{ color: tx.type === 'withdrawal' ? '#ff4c4c' : '#fcd535', fontSize: '1.2rem', fontWeight: '800' }}>
                      ${(tx.amount || 0).toFixed(2)} USDT
                    </p>
                    <p style={{ fontSize: '0.9rem', color: '#ffcc00' }}>{tx.type === 'withdrawal' ? `Binance Pay: ${tx.binanceId}` : `Ref: ${tx.reference}`}</p>
                    <p style={{ fontSize: '0.8rem', color: '#aaa' }}>{new Date(tx.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="admin-tx-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleApprove(tx)} style={{ cursor: 'pointer', border: 'none', borderRadius: '8px', background: '#4ade80', color: '#000', padding: '0.5rem 1rem', fontWeight: 'bold' }}>Aprobar</button>
                    <button onClick={() => handleReject(tx)} style={{ cursor: 'pointer', border: 'none', borderRadius: '8px', background: '#ff4c4c', color: '#fff', padding: '0.5rem 1rem', fontWeight: 'bold' }}>Rechazar</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Control de Clima (Eventos) */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3>🌦️ Eventos Globales (Clima)</h3>
          <p style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '1.5rem', lineHeight: '1.4' }}>
            Activa eventos meteorológicos que afectan la producción de TODOS los jugadores en tiempo real.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button onClick={() => changeWeather('sunny')} style={{ border: 'none', padding: '1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', background: currentWeather === 'sunny' ? '#fcd535' : 'rgba(255,255,255,0.1)', color: currentWeather === 'sunny' ? '#000' : '#fff' }}>
              ☀️ Soleado (Normal)
            </button>
            <button onClick={() => changeWeather('rain')} style={{ border: 'none', padding: '1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', background: currentWeather === 'rain' ? '#3b82f6' : 'rgba(255,255,255,0.1)', color: currentWeather === 'rain' ? '#fff' : '#fff' }}>
              🌧️ Lluvia (Relentiza x2)
            </button>
            <button onClick={() => changeWeather('thunder')} style={{ border: 'none', padding: '1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', background: currentWeather === 'thunder' ? '#4f46e5' : 'rgba(255,255,255,0.1)', color: currentWeather === 'thunder' ? '#fff' : '#fff' }}>
              ⚡ Tormenta (Relentiza x2)
            </button>
            <button onClick={() => changeWeather('snow')} style={{ border: 'none', padding: '1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', background: currentWeather === 'snow' ? '#93c5fd' : 'rgba(255,255,255,0.1)', color: currentWeather === 'snow' ? '#000' : '#fff' }}>
              ❄️ Nieve (Relentiza x2)
            </button>
            <button onClick={() => changeWeather('rainbow')} style={{ border: 'none', padding: '1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', background: currentWeather === 'rainbow' ? '#ec4899' : 'rgba(255,255,255,0.1)', color: currentWeather === 'rainbow' ? '#fff' : '#fff' }}>
              🌈 Arcoíris (Acelera x0.5)
            </button>
            <button onClick={() => changeWeather('stars')} style={{ border: 'none', padding: '1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', background: currentWeather === 'stars' ? '#8b5cf6' : 'rgba(255,255,255,0.1)', color: currentWeather === 'stars' ? '#fff' : '#fff' }}>
              ✨ Estrellas (Acelera x0.5)
            </button>
          </div>
        </div>

        {/* Lista de Usuarios */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3>👥 Usuarios Registrados</h3>
          <p style={{ marginTop: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Actualización en tiempo real ⚡</p>
          
          {loading ? <p>Cargando...</p> : (
            <div style={{ maxHeight: '500px', overflowY: 'auto', overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '400px', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #444' }}>
                    <th style={{ padding: '0.5rem' }}>Nombre</th>
                    <th style={{ padding: '0.5rem' }}>Email / Tel</th>
                    <th style={{ padding: '0.5rem' }}>Estado</th>
                    <th style={{ padding: '0.5rem' }}>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <td style={{ padding: '0.5rem' }}>{u.name || '-'}</td>
                      <td style={{ padding: '0.5rem' }}>
                        <div>{u.email}</div>
                        <div style={{ fontSize: '0.8rem', color: '#aaa' }}>{u.phone}</div>
                      </td>
                      <td style={{ padding: '0.5rem' }}>{u.state || '-'}</td>
                      <td style={{ padding: '0.5rem', color: '#4ade80', fontWeight: 'bold' }}>${(u.balance || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
