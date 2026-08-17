import React, { useState } from 'react';
import { Coins, TrendingUp, PlusCircle, Landmark, X } from 'lucide-react';
import Swal from 'sweetalert2';

export function Dashboard({ balance, incomePerDay, onRecharge, rate, pendingRecharges = [] }) {
  const [showRecharge, setShowRecharge] = useState(false);
  const [amountBs, setAmountBs] = useState('');
  const [reference, setReference] = useState('');

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
        <div className="dashboard-stats" style={{ display: 'flex', gap: '2rem' }}>
          <div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Saldo Disponible</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Coins size={28} />
              ${balance.toFixed(2)} USDT
            </p>
            {rate && <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '-0.5rem' }}>~ {(balance * rate).toFixed(2)} Bs</p>}
          </div>
          <div style={{ borderLeft: '1px solid var(--glass-border)', paddingLeft: '2rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Producción Diaria</p>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-main)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={20} color="var(--accent-color)" /> +${incomePerDay.toFixed(2)} USDT
            </p>
            {rate && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>~ {(incomePerDay * rate).toFixed(2)} Bs al día</p>}
          </div>
        </div>
        
        <div>
          <button 
            className="btn-primary" 
            onClick={() => setShowRecharge(!showRecharge)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <PlusCircle size={20} /> Recargar Saldo
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
                <span>Ref: {tx.reference}</span>
                <span style={{ fontWeight: 'bold' }}>${(tx.amount || 0).toFixed(2)} USDT</span>
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
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Pay ID: <strong style={{ color: 'white' }}>123456789</strong> <span style={{fontSize: '0.8rem'}}>(Ejemplo)</span></p>
            <p style={{ color: 'var(--text-muted)' }}>Correo: <strong style={{ color: 'white' }}>admin@farmchicken.com</strong></p>
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

    </div>
  );
}
