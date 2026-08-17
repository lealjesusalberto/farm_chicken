import React from 'react';
import { CHICKEN_TYPES } from '../hooks/useGameEngine';
import { ShoppingCart, Info } from 'lucide-react';

export function Store({ balance, onBuy, rate }) {
  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ShoppingCart /> Tienda de Gallinas
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        {CHICKEN_TYPES.map(chicken => (
          <div key={chicken.id} className="glass-panel store-item" style={{ padding: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <div className="tooltip-container" style={{ position: 'absolute', top: '10px', right: '10px' }}>
              <Info size={20} color="var(--text-muted)" />
              <div className="tooltip-content">
                <p>🥚 5 huevos en 23 horas</p>
                <p>💰 ${chicken.incomePerEgg.toFixed(2)} por huevo</p>
                <p>⏳ Límite: 24h para recoger o se pierden</p>
              </div>
            </div>
            <div style={{ 
              width: '120px', height: '120px', marginBottom: '1rem', 
              display: 'flex', justifyContent: 'center', alignItems: 'center', 
              borderRadius: '50%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)'
            }}>
              <img src={chicken.img} alt={chicken.name} style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Gallina {chicken.name}</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Precio: <span style={{ color: 'white', fontWeight: 'bold' }}>${chicken.price}</span> {rate && <span style={{ fontSize: '0.85rem' }}>(~ {(chicken.price * rate).toFixed(2)} Bs)</span>}</p>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Produce: <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>${(chicken.incomePerEgg * 5).toFixed(2)}/día</span> {rate && <span style={{ fontSize: '0.85rem' }}>(~ {(chicken.incomePerEgg * 5 * rate).toFixed(2)} Bs)</span>}</p>
            
            <button 
              className="btn-primary" 
              style={{ 
                width: '100%', 
                opacity: balance >= chicken.price ? 1 : 0.3, 
                cursor: balance >= chicken.price ? 'pointer' : 'not-allowed',
                background: balance >= chicken.price ? '' : 'rgba(255,255,255,0.1)',
                boxShadow: balance >= chicken.price ? '' : 'none'
              }}
              onClick={() => onBuy(chicken.id)}
              disabled={balance < chicken.price}
            >
              Comprar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
