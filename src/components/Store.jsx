import React from 'react';
import { CHICKEN_TYPES } from '../hooks/useGameEngine';
import { ShoppingCart, Info } from 'lucide-react';

export function Store({ balance, onBuy, rate }) {
  return (
    <div style={{ padding: '1rem' }}>
      <div className="store-grid">
        {CHICKEN_TYPES.map(chicken => (
          <div key={chicken.id} className="glass-panel store-item" style={{ padding: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', position: 'relative', height: '100%' }}>
            <div className="tooltip-container" style={{ position: 'absolute', top: '10px', right: '10px' }}>
              <Info size={20} color="var(--text-muted)" />
              <div className="tooltip-content">
                <p>🥚 5 huevos en 23 horas</p>
                <p>💰 ${chicken.incomePerEgg.toFixed(2)} por huevo</p>
                <p>⏳ Límite: 24h para recoger o se pierden</p>
              </div>
            </div>
            <div className="store-img-container">
              <img src={chicken.img} alt={chicken.name} style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
            </div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h3 className="store-title">Gallina {chicken.name}</h3>
              
              <div className="store-details">
                <p>Precio: <span className="highlight-price">${chicken.price}</span></p>
                {rate && <p className="bs-estimate">~ {(chicken.price * rate).toFixed(2)} Bs</p>}
                
                <p style={{ marginTop: '0.5rem' }}>Produce: <span className="highlight-income">${(chicken.incomePerEgg * 5).toFixed(2)}/día</span></p>
                {rate && <p className="bs-estimate">~ {(chicken.incomePerEgg * 5 * rate).toFixed(2)} Bs</p>}
              </div>
            </div>
            
            <button 
              className="btn-primary store-btn" 
              style={{ 
                opacity: balance >= chicken.price ? 1 : 0.4, 
                cursor: balance >= chicken.price ? 'pointer' : 'not-allowed',
                background: balance >= chicken.price ? '' : 'rgba(255,255,255,0.1)',
                boxShadow: balance >= chicken.price ? '' : 'none'
              }}
              onClick={() => onBuy(chicken.id)}
              disabled={balance < chicken.price}
            >
              {balance >= chicken.price ? 'Comprar' : 'Sin Saldo'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
