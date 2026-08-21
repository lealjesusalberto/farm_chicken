import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { useExchangeRate } from '../hooks/useExchangeRate';
import { useGameConfig } from '../contexts/GameConfigContext';
import { Users, CreditCard, Settings, LogOut, Search, Check, Pause, Ban, Swords, Activity, Eye } from 'lucide-react';
import Swal from 'sweetalert2';

export function AdminDashboard({ onLogout, onImpersonate }) {
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [allChickens, setAllChickens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentWeather, setCurrentWeather] = useState('sunny');
  const [oracleRate, setOracleRate] = useState(100);
  const [newOracleRate, setNewOracleRate] = useState('');
  const [activeTab, setActiveTab] = useState('transactions');
  const [txTab, setTxTab] = useState('pending');
  const { rate, loading: rateLoading } = useExchangeRate();
  const { chickenTypes, foxIntervalHours } = useGameConfig();
  const [newFoxInterval, setNewFoxInterval] = useState('');
  const [editingChicken, setEditingChicken] = useState(null);
  
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

    // Escuchar Actividad
    const unsubActivity = onSnapshot(collection(db, 'activityLogs'), (snap) => {
      setActivityLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt));
    }, (error) => {
      console.error("Error cargando logs:", error);
    });

    return () => {
      unsubTx();
      unsubUsers();
      unsubWeather();
      unsubChickens();
      unsubOracle();
      unsubActivity();
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
      
      await setDoc(weatherRef, { type, start: now, history });
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

  const updateFoxInterval = async () => {
    if (!newFoxInterval || isNaN(newFoxInterval) || Number(newFoxInterval) <= 0) return Swal.fire('Error', 'Ingresa un valor válido en horas', 'error');
    try {
      await updateDoc(doc(db, 'config', 'gameSettings'), { foxIntervalHours: Number(newFoxInterval) });
      setNewFoxInterval('');
      Swal.fire('Actualizado', 'Frecuencia de zorros actualizada.', 'success');
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'No se pudo actualizar', 'error');
    }
  };

  const handleSaveChicken = async (e) => {
    e.preventDefault();
    try {
      let updatedTypes = [...chickenTypes];
      if (editingChicken.isNew) {
        delete editingChicken.isNew;
        updatedTypes.push(editingChicken);
      } else {
        const idx = updatedTypes.findIndex(c => c.id === editingChicken.id);
        if (idx !== -1) updatedTypes[idx] = editingChicken;
      }
      
      await updateDoc(doc(db, 'config', 'gameSettings'), { chickenTypes: updatedTypes });
      setEditingChicken(null);
      Swal.fire('Guardado', 'La gallina se guardó correctamente.', 'success');
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo guardar la gallina', 'error');
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

  const handleToggleArenaAccess = async (u) => {
    try {
      await updateDoc(doc(db, 'users', u.id), { hasArenaAccess: !u.hasArenaAccess });
      Swal.fire('Actualizado', `Acceso a la Arena ${!u.hasArenaAccess ? 'concedido' : 'revocado'} para ${u.name || u.email}.`, 'success');
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'No se pudo actualizar el acceso a la arena', 'error');
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
        
        <button onClick={() => setActiveTab('activity')} style={{ background: activeTab === 'activity' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: activeTab === 'activity' ? '#fcd535' : '#fff', padding: '1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.8rem', fontWeight: 'bold', transition: 'all 0.2s', textAlign: 'left' }}>
          <Activity size={20} /> Actividad
        </button>

        <button onClick={() => setActiveTab('arena_report')} style={{ background: activeTab === 'arena_report' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: activeTab === 'arena_report' ? '#fcd535' : '#fff', padding: '1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.8rem', fontWeight: 'bold', transition: 'all 0.2s', textAlign: 'left' }}>
          <Swords size={20} /> Reporte de Arena
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
      <div className="admin-content-area" style={{ flex: 1, padding: '2rem', overflowY: 'auto', maxHeight: '100vh', background: 'rgba(0,0,0,0.2)' }}>
        
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
              <div className="admin-user-card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', paddingRight: '1rem' }}>
                {users.map(u => {
                  const status = u.status || 'approved';
                  let statusColor = '#4ade80';
                  let statusText = 'Aprobado';
                  if (status === 'pending') { statusColor = '#fcd535'; statusText = 'Pendiente'; }
                  if (status === 'suspended') { statusColor = '#f97316'; statusText = 'Suspendido'; }
                  if (status === 'blocked') { statusColor = '#ff4c4c'; statusText = 'Bloqueado'; }
                  
                  const userChickens = allChickens.filter(c => c.userId === u.id);
                  const totalDailyEggs = userChickens.reduce((sum, c) => {
                    const type = chickenTypes.find(t => t.id === c.typeId);
                    if (!type) return sum;
                    const cPower = c.clonePower !== undefined ? c.clonePower : 100;
                    return sum + (type.incomePerEgg * (cPower / 100));
                  }, 0);
                  const totalDailyUSDT = (totalDailyEggs / oracleRate).toFixed(2);
                  
                  return (
                    <div key={u.id} className="admin-user-card" style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${status === 'pending' ? '#fcd535' : 'rgba(255,255,255,0.1)'}`, borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div className="admin-user-card-title" style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#fff' }}>{u.name || 'Sin Nombre'}</div>
                          <div style={{ fontSize: '0.85rem', color: '#aaa', marginTop: '0.2rem' }}>CI: {u.cedula || 'N/A'}</div>
                        </div>
                        <span style={{ padding: '0.3rem 0.6rem', borderRadius: '20px', background: `${statusColor}22`, color: statusColor, fontWeight: 'bold', fontSize: '0.75rem' }}>
                          {statusText}
                        </span>
                      </div>

                      <div className="admin-user-card-info" style={{ background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.9rem', color: '#ddd' }}>📧 {u.email}</div>
                        <div style={{ fontSize: '0.9rem', color: '#ddd', marginTop: '0.3rem' }}>📱 {u.phone || 'Sin teléfono'}</div>
                      </div>

                      <div className="admin-user-card-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 1fr', gap: '0.5rem', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '0.8rem 0' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.75rem', color: '#aaa', textTransform: 'uppercase' }}>Saldo ($)</div>
                          <div className="admin-user-card-stats-val" style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '1.1rem' }}>${(u.balance || 0).toFixed(2)}</div>
                        </div>
                        <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)' }}></div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.75rem', color: '#aaa', textTransform: 'uppercase' }}>Huevos (H)</div>
                          <div className="admin-user-card-stats-val" style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>{(u.eggBalance || 0).toFixed(1)}</div>
                        </div>
                        <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)' }}></div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.75rem', color: '#aaa', textTransform: 'uppercase' }}>Prod/Día</div>
                          <div className="admin-user-card-stats-val" style={{ color: '#fcd535', fontWeight: 'bold', fontSize: '1.1rem' }}>{totalDailyEggs.toFixed(1)} <span style={{fontSize:'0.7rem'}}>H</span></div>
                          <div style={{ fontSize: '0.75rem', color: '#4ade80' }}>~${totalDailyUSDT}</div>
                        </div>
                      </div>

                      {userChickens.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ fontSize: '0.85rem', color: '#aaa', fontWeight: 'bold' }}>Gallinas ({userChickens.length}):</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem' }}>
                            {userChickens.map((c, i) => {
                              const type = chickenTypes.find(t => t.id === c.typeId);
                              if (!type) return null;
                              return (
                                <div key={c.id || i} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <img src={type.img} alt={type.name} style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: type.auraColor || '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{type.name}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {type.incomePerEgg} H / {(type.eggTime / 3600000).toFixed(1)}h
                                    </div>
                                    {c.clonePower && c.clonePower < 100 && (
                                      <div style={{ fontSize: '0.65rem', color: '#ff4c4c', fontWeight: 'bold' }}>CLON {c.clonePower}%</div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.85rem', color: '#aaa', fontStyle: 'italic', textAlign: 'center' }}>No tiene gallinas</div>
                      )}

                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: 'auto', paddingTop: '1rem' }}>
                        {status !== 'approved' && (
                          <button title="Aprobar Usuario" onClick={() => handleApproveUser(u)} style={{ cursor: 'pointer', border: 'none', borderRadius: '50%', background: '#4ade80', color: '#000', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                            <Check size={18} strokeWidth={3} />
                          </button>
                        )}
                        {status !== 'suspended' && (
                          <button title="Suspender Usuario" onClick={() => handleSuspendUser(u)} style={{ cursor: 'pointer', border: 'none', borderRadius: '50%', background: '#f97316', color: '#fff', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                            <Pause size={18} strokeWidth={3} />
                          </button>
                        )}
                        {status !== 'blocked' && (
                          <button title="Bloquear Usuario" onClick={() => handleBlockUser(u)} style={{ cursor: 'pointer', border: 'none', borderRadius: '50%', background: '#ff4c4c', color: '#fff', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                            <Ban size={18} strokeWidth={3} />
                          </button>
                        )}
                        <button title={u.hasArenaAccess ? "Revocar acceso a Arena" : "Conceder acceso a Arena"} onClick={() => handleToggleArenaAccess(u)} style={{ cursor: 'pointer', border: 'none', borderRadius: '50%', background: u.hasArenaAccess ? '#a855f7' : 'rgba(255,255,255,0.1)', color: '#fff', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                          <Swords size={18} strokeWidth={3} />
                        </button>
                        <button title="Ver Granja (Modo Fantasma)" onClick={() => onImpersonate(u)} style={{ cursor: 'pointer', border: 'none', borderRadius: '50%', background: '#3b82f6', color: '#fff', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                          <Eye size={18} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="glass-panel" style={{ padding: '2rem', minHeight: '80vh' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}><Activity size={24} /> Historial de Actividad</h3>
            <p style={{ color: '#aaa', marginBottom: '2rem' }}>Monitorea las compras, intercambios y uso de recursos de los usuarios en tiempo real.</p>
            
            {activityLogs.length === 0 ? (
              <p style={{ color: '#aaa' }}>No hay actividad registrada aún.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#fcd535' }}>Fecha y Hora</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#fcd535' }}>Usuario</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#fcd535' }}>Acción</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#fcd535' }}>Detalles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityLogs.map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '1rem', color: '#aaa' }}>{new Date(log.createdAt).toLocaleString()}</td>
                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{log.email}</td>
                        <td style={{ padding: '1rem', color: '#4ade80' }}>{log.action}</td>
                        <td style={{ padding: '1rem' }}>{log.details}</td>
                      </tr>
                    ))}
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
                  🦋 Mariposas (Aumenta x0.3)
                </button>
                <button onClick={() => changeWeather('volcano')} style={{ border: 'none', padding: '1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', background: currentWeather === 'volcano' ? '#dc2626' : 'rgba(255,255,255,0.1)', color: currentWeather === 'volcano' ? '#fff' : '#fff' }}>
                  🌋 Volcán (Evento Huevo Fuego)
                </button>
                <button onClick={() => changeWeather('aurora')} style={{ border: 'none', padding: '1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', background: currentWeather === 'aurora' ? '#10b981' : 'rgba(255,255,255,0.1)', color: currentWeather === 'aurora' ? '#000' : '#fff' }}>
                  🌌 Auroras Boreales (Acelera x1.9)
                </button>
              </div>
            </div>
            
            {/* Control de Zorros */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3>🦊 Frecuencia de Zorros</h3>
              <p style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '1.5rem', lineHeight: '1.4' }}>
                Establece cada cuántas horas (en promedio) ataca un zorro a una gallina.
              </p>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <p style={{ margin: 0, fontSize: '1.2rem' }}>Frecuencia Actual: <strong style={{ color: '#ff4c4c' }}>1 cada {foxIntervalHours} horas</strong></p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="number" 
                  step="0.1"
                  value={newFoxInterval} 
                  onChange={(e) => setNewFoxInterval(e.target.value)} 
                  placeholder="Horas (Ej: 4 o 0.5)"
                  style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: 'none', outline: 'none' }}
                />
                <button 
                  onClick={updateFoxInterval}
                  style={{ background: '#ff4c4c', color: '#fff', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Actualizar
                </button>
              </div>
            </div>
            
            {/* Gestión de Gallinas */}
            <div className="glass-panel" style={{ padding: '2rem', gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3>🐔 Gestión de Gallinas</h3>
                <button 
                  onClick={() => setEditingChicken({ id: Date.now().toString(), name: '', price: 100, incomePerEgg: 5, eggTime: 14400000, img: '', depletedImg: '', eggImg: '', description: '', foodType: 'common', foodBagsRequired: 1, isSpecial: false, isNew: true })}
                  style={{ background: '#4ade80', color: '#000', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  + Crear Nueva
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', textAlign: 'left' }}>
                      <th style={{ padding: '0.5rem' }}>Img</th>
                      <th style={{ padding: '0.5rem' }}>Nombre</th>
                      <th style={{ padding: '0.5rem' }}>Precio</th>
                      <th style={{ padding: '0.5rem' }}>Rendimiento /Huevo</th>
                      <th style={{ padding: '0.5rem' }}>Tiempo /Huevo (hrs)</th>
                      <th style={{ padding: '0.5rem' }}>Tipo</th>
                      <th style={{ padding: '0.5rem' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chickenTypes.map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.5rem' }}><img src={c.img} alt={c.name} style={{ width: '40px', height: '40px', objectFit: 'contain' }} /></td>
                        <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{c.name}</td>
                        <td style={{ padding: '0.5rem', color: '#fcd535' }}>{c.price} CKF</td>
                        <td style={{ padding: '0.5rem', color: '#4ade80' }}>{c.incomePerEgg} Huevos</td>
                        <td style={{ padding: '0.5rem' }}>{(c.eggTime / 3600000).toFixed(2)} hrs</td>
                        <td style={{ padding: '0.5rem' }}>{c.isSpecial ? '⭐ Especial' : 'Básica'}</td>
                        <td style={{ padding: '0.5rem' }}>
                          <button onClick={() => setEditingChicken({...c})} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '0.3rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>Editar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
          </div>
        )}

        {/* Modal de Edición de Gallina */}
        {editingChicken && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative' }}>
              <button onClick={() => setEditingChicken(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>✖</button>
              <h2 style={{ marginBottom: '1.5rem', color: '#fcd535' }}>{editingChicken.isNew ? 'Crear Gallina' : 'Editar Gallina'}</h2>
              <form onSubmit={handleSaveChicken} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: '#aaa' }}>Nombre</label>
                    <input type="text" required value={editingChicken.name} onChange={e => setEditingChicken({...editingChicken, name: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: 'none', outline: 'none' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: '#aaa' }}>ID (Identificador único)</label>
                    <input type="text" required disabled={!editingChicken.isNew} value={editingChicken.id} onChange={e => setEditingChicken({...editingChicken, id: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: 'none', outline: 'none', opacity: editingChicken.isNew ? 1 : 0.5 }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: '#aaa' }}>Precio (CKF)</label>
                    <input type="number" required value={editingChicken.price} onChange={e => setEditingChicken({...editingChicken, price: Number(e.target.value)})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: 'none', outline: 'none' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: '#aaa' }}>Ganancia por Huevo (Huevos)</label>
                    <input type="number" required value={editingChicken.incomePerEgg} onChange={e => setEditingChicken({...editingChicken, incomePerEgg: Number(e.target.value)})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: 'none', outline: 'none' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: '#aaa' }}>Tiempo por Huevo (Horas)</label>
                    <input type="number" step="0.1" required value={editingChicken.eggTime / 3600000} onChange={e => setEditingChicken({...editingChicken, eggTime: Number(e.target.value) * 3600000})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: 'none', outline: 'none' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: '#aaa' }}>Sacos de Comida Requeridos</label>
                    <input type="number" required value={editingChicken.foodBagsRequired} onChange={e => setEditingChicken({...editingChicken, foodBagsRequired: Number(e.target.value)})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: 'none', outline: 'none' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: '#aaa' }}>Descripción / Habilidad</label>
                  <input type="text" required value={editingChicken.description} onChange={e => setEditingChicken({...editingChicken, description: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: 'none', outline: 'none' }} />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: '#aaa' }}>Ruta de Imagen (URL o /img/...)</label>
                    <input type="text" required value={editingChicken.img} onChange={e => setEditingChicken({...editingChicken, img: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: 'none', outline: 'none' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: '#aaa' }}>Imagen Agotada (Opcional)</label>
                    <input type="text" value={editingChicken.depletedImg} onChange={e => setEditingChicken({...editingChicken, depletedImg: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: 'none', outline: 'none' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editingChicken.isSpecial} onChange={e => setEditingChicken({...editingChicken, isSpecial: e.target.checked, foodType: e.target.checked ? 'special' : 'common'})} style={{ width: '20px', height: '20px' }} />
                    Es Gallina Especial (USA Maíz Especial)
                  </label>
                </div>

                <button type="submit" style={{ background: '#4ade80', color: '#000', border: 'none', padding: '1rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '1rem', fontSize: '1.1rem' }}>
                  Guardar Gallina
                </button>
              </form>
            </div>
          </div>
        )}
        
        {activeTab === 'arena_report' && (
          <div className="glass-panel" style={{ padding: '2rem', minHeight: '80vh' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}><Swords color="#fcd535" /> Reporte de Jugadores en Arena</h3>
            
            <p style={{ marginBottom: '2rem', color: '#cbd5e1' }}>Lista de usuarios que han jugado en el Coliseo Voxel y su progreso (Oleada actual):</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              {users.filter(u => u.arenaWave && u.arenaWave > 1).sort((a,b) => b.arenaWave - a.arenaWave).map(u => (
                <div key={u.id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#fcd535' }}>{u.name || 'Sin Nombre'}</div>
                  <div style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '1rem' }}>{u.email}</div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px' }}>
                    <span style={{ fontWeight: 'bold' }}>Oleada Alcanzada:</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4ade80' }}>{u.arenaWave}</span>
                  </div>
                </div>
              ))}
              
              {users.filter(u => u.arenaWave && u.arenaWave > 1).length === 0 && (
                <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', color: '#aaa' }}>
                  Aún no hay usuarios registrados que hayan avanzado en la Arena.
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
