import React, { useState } from 'react';
import { Coins, TrendingUp, PlusCircle, Landmark, X } from 'lucide-react';
import Swal from 'sweetalert2';

export function Dashboard({ balance, eggBalance, incomePerDay, onRecharge, onWithdraw, rate, pendingRecharges = [], userData }) {
  const [showRecharge, setShowRecharge] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // States para Recarga
  const [amountBs, setAmountBs] = useState('');
  const [reference, setReference] = useState('');

  // States para Retiro
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [binanceId, setBinanceId] = useState('');

  const handleRecharge = () => {
    const numBs = Number(amountBs);
    if (numBs <= 0 || !reference || !rate) {
      return Swal.fire('Atención', 'Por favor, ingresa un monto válido, la referencia y espera a que cargue la tasa', 'warning');
    }
    
    const amountUsd = numBs / rate;
    onRecharge(amountUsd, reference, numBs);
    
    setShowRecharge(false);
    setReference('');
    setAmountBs('');
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="dashboard-stats" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Saldo Disponible (CKF)</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', background: 'rgba(252, 213, 53, 0.2)', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fcd535', letterSpacing: '0.5px', color: '#fcd535', marginRight: '0.5rem', marginTop: '0.2rem' }}>CKF/USDT</span>
              {balance.toFixed(2)} CKF
            </p>
          </div>
          <div style={{ borderLeft: '1px solid var(--glass-border)', paddingLeft: '2rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Monedas Huevo</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🥚 {Math.floor(eggBalance || 0)}
            </p>
          </div>
          <div style={{ borderLeft: '1px solid var(--glass-border)', paddingLeft: '2rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Producción Diaria</p>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-main)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={20} color="var(--accent-color)" /> +{incomePerDay.toFixed(2)} CKF
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            className="btn-primary" 
            onClick={() => { setShowRecharge(!showRecharge); setShowWithdraw(false); setShowHistory(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <PlusCircle size={20} /> Recargar
          </button>
          
          <button 
            className="btn-primary" 
            onClick={() => { setShowWithdraw(!showWithdraw); setShowRecharge(false); setShowHistory(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ff4c4c', color: 'white' }}
          >
            <Landmark size={20} /> Retirar
          </button>
          
          <button 
            className="btn-primary" 
            onClick={() => { setShowHistory(!showHistory); setShowRecharge(false); setShowWithdraw(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#3b82f6', color: 'white' }}
          >
            <TrendingUp size={20} /> Historial
          </button>
        </div>
      </div>

      {pendingRecharges.length > 0 && (
        <div style={{ marginTop: '0.5rem', background: 'rgba(255, 204, 0, 0.1)', border: '1px solid rgba(255, 204, 0, 0.3)', padding: '1rem', borderRadius: '8px' }}>
          <h4 style={{ color: '#ffcc00', marginBottom: '0.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ffcc00', animation: 'pulse 1.5s infinite' }}></span>
            Recargas en proceso de validación
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pendingRecharges.map(tx => (
              <li key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', color: '#ddd', fontSize: '0.85rem' }}>
                <span>{tx.type === 'withdrawal' ? '📤 Retiro' : '📥 Recarga'} - Ref: {tx.reference || tx.binanceId}</span>
                <span style={{ fontWeight: 'bold', color: tx.type === 'withdrawal' ? '#ff4c4c' : '#4ade80' }}>
                  {tx.type === 'withdrawal' ? '-' : '+'}{(tx.amount || 0).toFixed(2)} CKF
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showRecharge && (
        <div className="recharge-modal" style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Landmark size={20} /> Datos de Binance Pay</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Método: <strong style={{ color: '#fcd535' }}>Binance Pay</strong></p>
            <p style={{ color: 'var(--text-muted)' }}>Pay ID: <strong style={{ color: 'white' }}>29252891</strong></p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Reportar Recarga</h3>
              <button onClick={() => setShowRecharge(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <input 
              type="number" 
              placeholder="Monto enviado en USDT" 
              value={amountBs} 
              onChange={(e) => setAmountBs(e.target.value)} 
              style={{ padding: '0.8rem', borderRadius: '8px', border: 'none', outline: 'none', background: 'rgba(255,255,255,0.9)', color: '#000' }} 
            />
            
            <input 
              type="text" 
              placeholder="Número de Referencia (Ej: 123456789)" 
              value={reference} 
              onChange={(e) => setReference(e.target.value)} 
              style={{ padding: '0.8rem', borderRadius: '8px', border: 'none', outline: 'none', background: 'rgba(255,255,255,0.9)', color: '#000' }} 
            />
            
            <button className="btn-primary" onClick={() => {
              const numUsdt = Number(amountBs);
              if (numUsdt <= 0 || !reference) return Swal.fire('Atención', 'Ingresa un monto y referencia válidos', 'warning');
              onRecharge(numUsdt, reference, numUsdt);
              setShowRecharge(false);
              setReference('');
              setAmountBs('');
            }} style={{ background: '#fcd535', color: '#000', fontWeight: 'bold' }}>
              Confirmar Solicitud
            </button>
          </div>
        </div>
      )}

      {showWithdraw && (
        <div className="recharge-modal" style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div style={{ background: 'rgba(255, 76, 76, 0.1)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,76,76,0.3)' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ff4c4c' }}><Landmark size={20} /> Retirar Fondos</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>El monto será descontado inmediatamente de tu saldo y enviado a revisión.</p>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Los retiros se pagan exclusivamente por <strong>Binance Pay (1 CKF = 1 USDT)</strong>.</p>
            <p style={{ color: '#ffcc00', marginTop: '1rem', fontSize: '0.85rem', borderLeft: '3px solid #ffcc00', paddingLeft: '10px' }}>⚠️ Se aplicará un fee del <strong>10%</strong> a todos los retiros para mantener la economía de la granja.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Solicitar Retiro</h3>
              <button onClick={() => setShowWithdraw(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <input 
              type="number" 
              placeholder="Monto a retirar en CKF" 
              value={withdrawAmount} 
              onChange={(e) => setWithdrawAmount(e.target.value)} 
              style={{ padding: '0.8rem', borderRadius: '8px', border: 'none', outline: 'none', background: 'rgba(255,255,255,0.9)', color: '#000' }} 
            />
            
            {Number(withdrawAmount) > 0 && (
              <p style={{ color: '#4ade80', fontSize: '0.85rem', margin: '-0.5rem 0 0 0' }}>
                Recibirás: <strong>{(Number(withdrawAmount) * 0.9).toFixed(2)} CKF</strong> <span style={{ color: '#ff4c4c' }}>(10% de comisión)</span>
              </p>
            )}
            
            <input 
              type="text" 
              placeholder="Tu Binance Pay ID o Correo" 
              value={binanceId} 
              onChange={(e) => setBinanceId(e.target.value)} 
              style={{ padding: '0.8rem', borderRadius: '8px', border: 'none', outline: 'none', background: 'rgba(255,255,255,0.9)', color: '#000' }} 
            />
            
            <button className="btn-primary" onClick={() => {
              const numUsdt = Number(withdrawAmount);
              if (numUsdt < 20) return Swal.fire('Atención', 'El monto mínimo de retiro es de 20 CKF', 'warning');
              if (!binanceId) return Swal.fire('Atención', 'Ingresa tu Binance ID', 'warning');
              
              Swal.fire({
                title: 'Confirmar Retiro',
                html: `¿Estás seguro que deseas retirar <b>${numUsdt} CKF</b>?<br/><br/>Recibirás: <b>${(numUsdt * 0.9).toFixed(2)} USDT en Binance</b><br/>(10% de comisión por retiro).`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ff4c4c',
                cancelButtonColor: '#3b82f6',
                confirmButtonText: 'Sí, retirar',
                cancelButtonText: 'Cancelar'
              }).then((result) => {
                if (result.isConfirmed) {
                  onWithdraw(numUsdt, binanceId);
                  setShowWithdraw(false);
                  setWithdrawAmount('');
                  setBinanceId('');
                }
              });
            }} style={{ background: '#ff4c4c', color: '#fff', fontWeight: 'bold' }}>
              Solicitar Retiro
            </button>
          </div>
        </div>
      )}

      {showHistory && (
        <div className="history-modal" style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><TrendingUp size={20} /> Historial de Ingresos</h3>
            <button onClick={() => setShowHistory(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
          </div>
          
          {(!userData?.dailyIncome || Object.keys(userData.dailyIncome).length === 0) ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Aún no has recolectado ganancias de tus gallinas.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {Object.keys(userData.dailyIncome).sort((a, b) => b.localeCompare(a)).map(dateStr => {
                const amount = userData.dailyIncome[dateStr];
                
                // Formatear la fecha
                const today = new Date().toISOString().split('T')[0];
                const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                
                let label = dateStr;
                if (dateStr === today) label = 'Hoy';
                else if (dateStr === yesterday) label = 'Ayer';
                
                return (
                  <li key={dateStr} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                    <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '1.1rem' }}>{label}</span>
                    <span style={{ fontWeight: 'bold', color: '#4ade80', fontSize: '1.1rem' }}>+{(amount).toFixed(2)} CKF</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

    </div>
  );
}
