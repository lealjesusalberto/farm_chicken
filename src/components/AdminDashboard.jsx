import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { useExchangeRate } from '../hooks/useExchangeRate';
import { CHICKEN_TYPES } from '../hooks/useGameEngine';
import { Users, CreditCard, Settings, LogOut, Search, Check, Pause, Ban } from 'lucide-react';
import Swal from 'sweetalert2';

export function AdminDashboard({ onLogout }) {
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [allChickens, setAllChickens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentWeather, setCurrentWeather] = useState('sunny');
  const [oracleRate, setOracleRate] = useState(100);
  const [newOracleRate, setNewOracleRate] = useState('');
  const [activeTab, setActiveTab] = useState('transactions');
  const [txTab, setTxTab] = useState('pending');
  const { rate, loading: rateLoading } = useExchangeRate();

  useEffect(() => {
    // Escuchar transacciones en tiempo real
    const txQ = query(collection(db, 'transactions'));
    const unsubTx = onSnapshot(txQ, (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt));
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

    // Escuchar gallinas globales
    const unsubChickens = onSnapshot(collection(db, 'chickens'), (snap) => {
      setAllChickens(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Escuchar Oráculo
    const unsubOracle = onSnapshot(doc(db, 'config', 'oracle'), (snap) => {
      if (snap.exists() && snap.data().rate) {
        setOracleRate(snap.data().rate);
        setNewOracleRate(snap.data().rate);
      }
    });

    return () => {
      unsubTx();
      unsubUsers();
      unsubWeather();
      unsubChickens();
      unsubOracle();
    };
  }, []);

  const changeOracleRate = async () => {
    const rateNum = Number(newOracleRate);
    if (isNaN(rateNum) || rateNum <= 0) return Swal.fire('Error', 'Ingresa una tasa válida', 'error');
    
    try {
      await setDoc(doc(db, 'config', 'oracle'), { rate: rateNum }, { merge: true });
      Swal.fire('¡Actualizado!', `El Oráculo ahora está en 1 CKF = ${rateNum} Huevos`, 'success');
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'No se pudo actualizar el Oráculo', 'error');
    }
  };

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

  const handleApproveUser = async (u) => {
    try {
      await updateDoc(doc(db, 'users', u.id), { status: 'approved', suspensionEnd: null });
      Swal.fire('Aprobado', `El usuario ${u.name || u.email} ha sido aprobado.`, 'success');
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'No se pudo aprobar al usuario', 'error');
    }
  };

  const handleBlockUser = async (u) => {
    try {
      const res = await Swal.fire({
        title: '¿Bloquear usuario?',
        text: `¿Estás seguro de bloquear permanentemente a ${u.name || u.email}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, bloquear',
        cancelButtonText: 'Cancelar'
      });
      if (res.isConfirmed) {
        await updateDoc(doc(db, 'users', u.id), { status: 'blocked' });
        Swal.fire('Bloqueado', 'Usuario bloqueado exitosamente.', 'success');
      }
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'No se pudo bloquear', 'error');
    }
  };

  const handleSuspendUser = async (u) => {
    try {
      const { value: hours } = await Swal.fire({
        title: 'Suspender Usuario',
        input: 'number',
        inputLabel: '¿Por cuántas horas deseas suspenderlo?',
        inputPlaceholder: 'Ej: 24',
        showCancelButton: true,
        inputValidator: (value) => {
          if (!value || value <= 0) {
            return 'Debes ingresar un número válido de horas';
          }
        }
      });
      if (hours) {
        const suspensionEnd = Date.now() + (hours * 3600 * 1000);
        await updateDoc(doc(db, 'users', u.id), { status: 'suspended', suspensionEnd });
        Swal.fire('Suspendido', `Usuario suspendido por ${hours} horas.`, 'success');
      }
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'No se pudo suspender', 'error');
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

  const pendingTxs = transactions.filter(t => t.status === 'pending');
  const approvedTxs = transactions.filter(t => t.status === 'approved');
  const rejectedTxs = transactions.filter(t => t.status === 'rejected');

  const renderTxList = (list, showActions) => {
    if (loading) return <p>Cargando...</p>;
    if (list.length === 0) return <p style={{ color: '#aaa', marginTop: '1rem' }}>No hay transacciones en esta categoría.</p>;
    
    return (
      <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
        {list.map(tx => (
          <li key={tx.id} className="admin-tx-item" style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', marginBottom: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <p style={{ fontWeight: 'bold', color: tx.type === 'withdrawal' ? '#ff4c4c' : '#fff' }}>
                {tx.type === 'withdrawal' ? '📤 RETIRO' : '📥 RECARGA'} - {tx.email}
              </p>
              <p style={{ color: tx.type === 'withdrawal' ? '#ff4c4c' : '#fcd535', fontSize: '1.2rem', fontWeight: '800' }}>
                {(tx.amount || 0).toFixed(2)} CKF
              </p>
              <p style={{ fontSize: '0.9rem', color: '#ffcc00' }}>{tx.type === 'withdrawal' ? `Binance Pay: ${tx.binanceId}` : `Ref: ${tx.reference}`}</p>
              <p style={{ fontSize: '0.8rem', color: '#aaa' }}>{new Date(tx.createdAt).toLocaleString()}</p>
            </div>
            {showActions ? (
              <div className="admin-tx-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button onClick={() => handleApprove(tx)} style={{ cursor: 'pointer', border: 'none', borderRadius: '8px', background: '#4ade80', color: '#000', padding: '0.5rem 1rem', fontWeight: 'bold' }}>Aprobar</button>
                <button onClick={() => handleReject(tx)} style={{ cursor: 'pointer', border: 'none', borderRadius: '8px', background: '#ff4c4c', color: '#fff', padding: '0.5rem 1rem', fontWeight: 'bold' }}>Rechazar</button>
              </div>
            ) : (
              <div style={{ padding: '0.3rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', background: tx.status === 'approved' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 76, 76, 0.2)', color: tx.status === 'approved' ? '#4ade80' : '#ff4c4c' }}>
                {tx.status === 'approved' ? 'APROBADO' : 'RECHAZADO'}
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="admin-container" style={{ color: '#fff', display: 'flex', minHeight: '100vh', width: '100%', margin: 0 }}>
      {/* Sidebar */}
      <div className="admin-sidebar" style={{ background: 'rgba(0,0,0,0.6)', borderRight: '1px solid rgba(255,255,255,0.1)', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 10 }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '2rem', textAlign: 'center', color: '#fcd535', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>👑 Panel Admin</h2>
        
        <button onClick={() => setActiveTab('transactions')} style={{ background: activeTab === 'transactions' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: activeTab === 'transactions' ? '#fcd535' : '#fff', padding: '1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.8rem', fontWeight: 'bold', transition: 'all 0.2s', textAlign: 'left' }}>
          <CreditCard size={20} /> Transacciones
          {pendingTxs.length > 0 && <span style={{ background: '#ff4c4c', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem', marginLeft: 'auto' }}>{pendingTxs.length}</span>}
        </button>

        <button onClick={() => setActiveTab('users')} style={{ background: activeTab === 'users' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: activeTab === 'users' ? '#fcd535' : '#fff', padding: '1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.8rem', fontWeight: 'bold', transition: 'all 0.2s', textAlign: 'left' }}>
          <Users size={20} /> Usuarios
        </button>
        
        <button onClick={() => setActiveTab('config')} style={{ background: activeTab === 'config' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: activeTab === 'config' ? '#fcd535' : '#fff', padding: '1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.8rem', fontWeight: 'bold', transition: 'all 0.2s', textAlign: 'left' }}>
          <Settings size={20} /> Configuración Global
        </button>
        
        <div style={{ flex: 1 }}></div>
        
        <button onClick={onLogout} style={{ background: 'rgba(255, 76, 76, 0.1)', border: '1px solid rgba(255,76,76,0.3)', color: '#ff4c4c', padding: '1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.8rem', fontWeight: 'bold', transition: 'all 0.2s', textAlign: 'left' }}>
          <LogOut size={20} /> Salir del Panel
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', maxHeight: '100vh', background: 'rgba(0,0,0,0.2)' }}>
        
        {(() => {
          const totalDeposits = transactions.filter(t => t.type === 'deposit' && t.status === 'approved').reduce((sum, t) => sum + Number(t.amount || 0), 0);
          const totalWithdrawals = transactions.filter(t => t.type === 'withdrawal' && t.status === 'approved').reduce((sum, t) => sum + Number(t.amount || 0), 0);
          const netBalance = totalDeposits - totalWithdrawals;
          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid rgba(74, 222, 128, 0.3)' }}>
                <h3 style={{ color: '#aaa', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Balance Neto en Caja</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4ade80' }}>${netBalance.toFixed(2)} USDT</div>
                <div style={{ fontSize: '0.85rem', color: '#ddd', marginTop: '0.5rem' }}>Ingresos: <span style={{color:'#4ade80'}}>${totalDeposits.toFixed(2)}</span> | Salidas: <span style={{color:'#ff4c4c'}}>${totalWithdrawals.toFixed(2)}</span></div>
              </div>
            </div>
          );
        })()}

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
          <span style={{ fontSize: '0.9rem', background: 'rgba(252, 213, 53, 0.2)', color: '#fcd535', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 'bold' }}>Economía: Binance (1 CKF = 1 USDT)</span>
          {!rateLoading && rate && (
            <span style={{ fontSize: '0.9rem', background: 'rgba(74, 222, 128, 0.2)', color: '#4ade80', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 'bold' }}>BCV: {rate.toFixed(2)} Bs</span>
          )}
        </div>

        {activeTab === 'transactions' && (
          <div className="glass-panel" style={{ padding: '2rem', minHeight: '80vh' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>💸 Gestión de Transacciones</h3>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', flexWrap: 'wrap' }}>
              <button onClick={() => setTxTab('pending')} style={{ background: txTab === 'pending' ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)', color: txTab === 'pending' ? '#000' : '#fff', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                Pendientes {pendingTxs.length > 0 && <span style={{ background: txTab === 'pending' ? '#000' : '#ff4c4c', color: txTab === 'pending' ? '#fcd535' : '#fff', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem' }}>{pendingTxs.length}</span>}
              </button>
              <button onClick={() => setTxTab('approved')} style={{ background: txTab === 'approved' ? '#4ade80' : 'rgba(255,255,255,0.1)', color: txTab === 'approved' ? '#000' : '#fff', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>Aprobadas ({approvedTxs.length})</button>
              <button onClick={() => setTxTab('rejected')} style={{ background: txTab === 'rejected' ? '#ff4c4c' : 'rgba(255,255,255,0.1)', color: txTab === 'rejected' ? '#fff' : '#fff', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>Rechazadas ({rejectedTxs.length})</button>
            </div>

            <div style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {txTab === 'pending' && renderTxList(pendingTxs, true)}
              {txTab === 'approved' && renderTxList(approvedTxs, false)}
              {txTab === 'rejected' && renderTxList(rejectedTxs, false)}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="glass-panel" style={{ padding: '1rem', minHeight: '80vh' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>👥 Usuarios Registrados</h3>
            {loading ? <p>Cargando...</p> : (
              <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', overflowX: 'auto' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'rgba(20,20,20,0.9)', zIndex: 5, whiteSpace: 'nowrap' }}>
                    <tr style={{ borderBottom: '1px solid #444' }}>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Nombre / CI</th>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Contacto</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Estado</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Saldo</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Gallinas</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Prod. Diaria</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => {
                      const status = u.status || 'approved';
                      let statusColor = '#4ade80';
                      let statusText = 'Aprobado';
                      if (status === 'pending') { statusColor = '#fcd535'; statusText = 'Pendiente'; }
                      if (status === 'suspended') { statusColor = '#f97316'; statusText = 'Suspendido'; }
                      if (status === 'blocked') { statusColor = '#ff4c4c'; statusText = 'Bloqueado'; }
                      
                      return (
                        <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: status === 'pending' ? 'rgba(252, 213, 53, 0.05)' : 'transparent' }}>
                          <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{u.name || '-'}</div>
                            <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '0.2rem' }}>CI: {u.cedula || 'N/A'}</div>
                          </td>
                          <td style={{ padding: '1rem', verticalAlign: 'middle', wordBreak: 'break-all' }}>
                            <div style={{ fontSize: '0.95rem' }}>{u.email}</div>
                            <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '0.2rem' }}>{u.phone}</div>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center', verticalAlign: 'middle' }}>
                            <span style={{ padding: '0.3rem 0.6rem', borderRadius: '20px', background: `${statusColor}22`, color: statusColor, fontWeight: 'bold', fontSize: '0.8rem' }}>
                              {statusText}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center', verticalAlign: 'middle', color: '#4ade80', fontWeight: 'bold', fontSize: '1.1rem' }}>
                            ${(u.balance || 0).toFixed(2)}
                          </td>
                          
                          {(() => {
                            const userChickens = allChickens.filter(c => c.userId === u.id);
                            const totalDailyEggs = userChickens.reduce((sum, c) => {
                              const type = CHICKEN_TYPES.find(t => t.id === c.typeId);
                              if (!type) return sum;
                              const cPower = c.clonePower !== undefined ? c.clonePower : 100;
                              return sum + (type.incomePerEgg * (cPower / 100));
                            }, 0);
                            const totalDailyUSDT = (totalDailyEggs / oracleRate).toFixed(2);
                            
                            return (
                              <>
                                <td style={{ padding: '1rem', textAlign: 'center', verticalAlign: 'middle' }}>
                                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{userChickens.length}</div>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'center', verticalAlign: 'middle' }}>
                                  <div style={{ fontWeight: 'bold', color: '#fcd535', fontSize: '1rem' }}>{totalDailyEggs.toFixed(1)} <span style={{fontSize:'0.7rem'}}>Huevos</span></div>
                                  <div style={{ fontSize: '0.8rem', color: '#4ade80', marginTop: '0.2rem' }}>~${totalDailyUSDT}</div>
                                </td>
                              </>
                            );
                          })()}

                          <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                              {status !== 'approved' && (
                                <button title="Aprobar Usuario" onClick={() => handleApproveUser(u)} style={{ cursor: 'pointer', border: 'none', borderRadius: '50%', background: '#4ade80', color: '#000', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                                  <Check size={16} strokeWidth={3} />
                                </button>
                              )}
                              {status !== 'suspended' && (
                                <button title="Suspender Usuario" onClick={() => handleSuspendUser(u)} style={{ cursor: 'pointer', border: 'none', borderRadius: '50%', background: '#f97316', color: '#fff', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                                  <Pause size={16} strokeWidth={3} />
                                </button>
                              )}
                              {status !== 'blocked' && (
                                <button title="Bloquear Usuario" onClick={() => handleBlockUser(u)} style={{ cursor: 'pointer', border: 'none', borderRadius: '50%', background: '#ff4c4c', color: '#fff', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                                  <Ban size={16} strokeWidth={3} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'config' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            {/* Control del Oráculo */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3>⚖️ Oráculo de Economía</h3>
              <p style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '1.5rem', lineHeight: '1.4' }}>
                Controla cuántos Huevos equivale 1 CKF. Afecta directamente los precios, retiros y recargas.
              </p>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <p style={{ margin: 0, fontSize: '1.2rem' }}>Tasa Actual: <strong style={{ color: '#fcd535' }}>1 CKF = {oracleRate} Huevos</strong></p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="number" 
                  value={newOracleRate} 
                  onChange={(e) => setNewOracleRate(e.target.value)} 
                  placeholder="Nueva tasa"
                  style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: 'none', outline: 'none' }}
                />
                <button 
                  onClick={changeOracleRate}
                  style={{ background: '#fcd535', color: '#000', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Actualizar
                </button>
              </div>
            </div>

            {/* Control de Clima */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3>🌦️ Eventos Globales (Clima)</h3>
              <p style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '1.5rem', lineHeight: '1.4' }}>
                Activa eventos meteorológicos que afectan la producción de TODOS los jugadores en tiempo real.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
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
                <button onClick={() => changeWeather('bugs')} style={{ border: 'none', padding: '1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', background: currentWeather === 'bugs' ? '#a3e635' : 'rgba(255,255,255,0.1)', color: currentWeather === 'bugs' ? '#000' : '#fff' }}>
                  🦟 Plaga (Aumenta x0.2)
                </button>
                <button onClick={() => changeWeather('butterflies')} style={{ border: 'none', padding: '1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', background: currentWeather === 'butterflies' ? '#f472b6' : 'rgba(255,255,255,0.1)', color: currentWeather === 'butterflies' ? '#000' : '#fff' }}>
                  🦋 Mariposas
                </button>
                <button onClick={() => changeWeather('aurora')} style={{ border: 'none', padding: '1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', background: currentWeather === 'aurora' ? '#10b981' : 'rgba(255,255,255,0.1)', color: currentWeather === 'aurora' ? '#000' : '#fff' }}>
                  🌌 Auroras Boreales (Acelera x1.9)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
