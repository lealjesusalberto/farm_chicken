import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useExchangeRate } from '../hooks/useExchangeRate';
import Swal from 'sweetalert2';

export function AdminDashboard({ onLogout }) {
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { rate, loading: rateLoading } = useExchangeRate();

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log("Cargando usuarios...");
      const usersSnap = await getDocs(collection(db, 'users'));
      const uList = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(uList);

      console.log("Cargando transacciones...");
      const txQ = query(collection(db, 'transactions'), where('status', '==', 'pending'));
      const txSnap = await getDocs(txQ);
      const txList = txSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTransactions(txList);
      console.log("Carga completa");
    } catch (e) {
      console.error("Error en fetchData:", e);
      Swal.fire('Error de Conexión', e.message || 'No se pudieron cargar los datos de Firebase. Revisa las reglas de seguridad o tu conexión.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      fetchData();
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
      fetchData();
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

        {/* Lista de Usuarios */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3>👥 Usuarios Registrados</h3>
          <button onClick={fetchData} style={{ marginTop: '1rem', marginBottom: '1rem', cursor: 'pointer', border: 'none', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '0.5rem 1rem' }}>Refrescar</button>
          
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
