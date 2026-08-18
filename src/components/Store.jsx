import React from 'react';
import { CHICKEN_TYPES } from '../hooks/useGameEngine';
import { ShoppingCart, Info } from 'lucide-react';

export function Store({ balance, onBuy, onBuyMysteryEgg, onBuyCorn, rate }) {
  return (
    <div style={{ padding: '1rem' }}>
      
      <h3 style={{ margin: '1rem 0 0.5rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Consumibles Especiales</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Mystery Egg Section */}
        <div className="glass-panel store-item" style={{ padding: '1rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(252,213,53,0.15))', border: '1px solid rgba(252,213,53,0.4)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '60px', height: '60px', background: '#fcd535', filter: 'blur(30px)', opacity: 0.5 }}></div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#fcd535', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>✨ Huevo Misterioso</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.8rem', maxWidth: '300px', margin: '0 auto 0.5rem auto', lineHeight: '1.2' }}>
            Obtén una gallina al azar. ¡Podría ser legendaria!
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <img src="/img/mystery_egg.png" alt="Huevo Misterioso" style={{ width: '70px', height: '70px', objectFit: 'contain', filter: 'drop-shadow(0 4px 10px rgba(252,213,53,0.4))' }} />
          </div>
          
          <button className="btn-primary store-btn" style={{ opacity: balance >= 3 ? 1 : 0.4, cursor: balance >= 3 ? 'pointer' : 'not-allowed', background: balance >= 3 ? '#fcd535' : 'rgba(255,255,255,0.1)', color: balance >= 3 ? '#000' : '#fff' }} onClick={onBuyMysteryEgg} disabled={balance < 3}>
            {balance >= 3 ? 'Comprar por $3' : 'Sin Saldo ($3)'}
          </button>
        </div>

        {/* Super Corn Section */}
        <div className="glass-panel store-item" style={{ padding: '1rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(74,222,128,0.15))', border: '1px solid rgba(74,222,128,0.4)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-10px', left: '-10px', width: '60px', height: '60px', background: '#4ade80', filter: 'blur(30px)', opacity: 0.4 }}></div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>🌽 Súper Maíz</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.8rem', maxWidth: '300px', margin: '0 auto 0.5rem auto', lineHeight: '1.2' }}>
            Multiplica velocidad 2x por 24 horas.
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <img src="/img/super_corn.png" alt="Súper Maíz" style={{ width: '70px', height: '70px', objectFit: 'contain', filter: 'drop-shadow(0 4px 10px rgba(74,222,128,0.4))' }} />
          </div>
          
          <button className="btn-primary store-btn" style={{ opacity: balance >= 5 ? 1 : 0.4, cursor: balance >= 5 ? 'pointer' : 'not-allowed', background: balance >= 5 ? '#4ade80' : 'rgba(255,255,255,0.1)', color: balance >= 5 ? '#000' : '#fff', padding: '0.5rem', fontSize: '0.85rem' }} onClick={onBuyCorn} disabled={balance < 5}>
            {balance >= 5 ? 'Comprar por $5' : 'Sin Saldo ($5)'}
          </button>
        </div>
      </div>

      <h3 style={{ margin: '1rem 0 0.5rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Gallinas</h3>
      <div className="store-grid">
        {CHICKEN_TYPES.map(chicken => (
          <div key={chicken.id} className="glass-panel store-item" style={{ padding: '1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', position: 'relative', height: '100%' }}>
            
            {/* Info Button Hover */}
            <div className="info-tooltip" title={`Esta gallina produce $${chicken.incomePerEgg} USDT por huevo. Tiempo por huevo: ${(chicken.eggTime / (60*60*1000)).toFixed(1)} horas. Max: 5 huevos por ciclo.`} style={{ position: 'absolute', top: '10px', right: '10px', cursor: 'help', opacity: 0.7 }}>
              <Info size={16} />
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem', color: chicken.color }}>{chicken.name}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: '1.2', margin: 0 }}>
                {chicken.description}
              </p>
            </div>
            
            <img src={chicken.img} alt={chicken.name} style={{ height: '90px', objectFit: 'contain', margin: '0.75rem 0' }} />
            
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <span style={{ color: '#aaa' }}>Producción:</span>
                <span style={{ color: '#4ade80', fontWeight: 'bold' }}>+${((24 / (chicken.eggTime/(60*60*1000))) * chicken.incomePerEgg).toFixed(2)}/día</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                <span style={{ color: '#aaa' }}>Retorno:</span>
                <span style={{ color: '#fff' }}>
                  {Math.ceil(chicken.price / ((24 / (chicken.eggTime/(60*60*1000))) * chicken.incomePerEgg))} días
                </span>
              </div>
              
              <button 
                className="btn-primary store-btn" 
                style={{ 
                  width: '100%', padding: '0.6rem', fontSize: '0.9rem',
                  opacity: balance >= chicken.price ? 1 : 0.4, 
                  cursor: balance >= chicken.price ? 'pointer' : 'not-allowed',
                  background: balance >= chicken.price ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)'
                }}
                onClick={() => onBuy(chicken.id)}
                disabled={balance < chicken.price}
              >
                {balance >= chicken.price ? `Comprar $${chicken.price}` : 'Sin Saldo'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
