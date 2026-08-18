import React from 'react';
import { CHICKEN_TYPES } from '../hooks/useGameEngine';
import { ShoppingCart, Info } from 'lucide-react';
import Swal from 'sweetalert2';

export function Store({ balance, onBuy, onBuyMysteryEgg, onBuyFood, rate }) {
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
          
          <button className="btn-primary store-btn" style={{ opacity: balance >= 2 ? 1 : 0.4, cursor: balance >= 2 ? 'pointer' : 'not-allowed', background: balance >= 2 ? '#fcd535' : 'rgba(255,255,255,0.1)', color: balance >= 2 ? '#000' : '#fff' }} onClick={onBuyMysteryEgg} disabled={balance < 2}>
            {balance >= 2 ? 'Comprar por $2' : 'Sin Saldo ($2)'}
          </button>
        </div>

        {/* Saco de Maíz Común Section */}
        <div className="glass-panel store-item" style={{ padding: '1rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(74,222,128,0.15))', border: '1px solid rgba(74,222,128,0.4)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-10px', left: '-10px', width: '60px', height: '60px', background: '#4ade80', filter: 'blur(30px)', opacity: 0.4 }}></div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>🌽 Saco Común</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.8rem', maxWidth: '300px', margin: '0 auto 1rem auto', lineHeight: '1.2', minHeight: '40px' }}>
            Acelera la producción (+50%) por 12h. Exclusivo para gallinas normales.
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <img src="/img/super_corn.png" alt="Saco Común" style={{ width: '70px', height: '70px', objectFit: 'contain', filter: 'drop-shadow(0 4px 10px rgba(74,222,128,0.4))' }} />
          </div>
          
          <div style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1rem', color: '#fcd535' }}>
            $0.10
          </div>
          
          <button 
            className="btn-primary store-btn" 
            style={{ 
              opacity: balance >= 0.1 ? 1 : 0.4, 
              cursor: balance >= 0.1 ? 'pointer' : 'not-allowed', 
              background: balance >= 0.1 ? '#4ade80' : 'rgba(255,255,255,0.1)', 
              color: balance >= 0.1 ? '#000' : '#fff' 
            }} 
            onClick={() => onBuyFood('common')} 
            disabled={balance < 0.1}
          >
            {balance >= 0.1 ? 'Comprar 1 Saco' : 'Sin Saldo ($0.10)'}
          </button>
        </div>

        {/* Saco de Maíz Especial Section */}
        <div className="glass-panel store-item" style={{ padding: '1rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(168,85,247,0.15))', border: '1px solid rgba(168,85,247,0.4)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-10px', left: '-10px', width: '60px', height: '60px', background: '#a855f7', filter: 'blur(30px)', opacity: 0.4 }}></div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>✨ Saco Especial</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.8rem', maxWidth: '300px', margin: '0 auto 1rem auto', lineHeight: '1.2', minHeight: '40px' }}>
            Acelera la producción (+50%) por 12h. Exclusivo para gallinas Especiales.
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <img src="/img/premium_corn.png" alt="Saco Especial" style={{ width: '70px', height: '70px', objectFit: 'contain', filter: 'drop-shadow(0 4px 10px rgba(168,85,247,0.4))' }} />
          </div>
          
          <div style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1rem', color: '#fcd535' }}>
            $0.25
          </div>
          
          <button 
            className="btn-primary store-btn" 
            style={{ 
              opacity: balance >= 0.25 ? 1 : 0.4, 
              cursor: balance >= 0.25 ? 'pointer' : 'not-allowed', 
              background: balance >= 0.25 ? '#a855f7' : 'rgba(255,255,255,0.1)', 
              color: balance >= 0.25 ? '#fff' : '#fff' 
            }} 
            onClick={() => onBuyFood('special')} 
            disabled={balance < 0.25}
          >
            {balance >= 0.25 ? 'Comprar 1 Saco' : 'Sin Saldo ($0.25)'}
          </button>
        </div>
      </div>

      <h3 style={{ margin: '1rem 0 0.5rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Gallinas Normales</h3>
      <div className="store-grid">
        {CHICKEN_TYPES.filter(c => !c.isSpecial).map(chicken => (
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
                {balance >= chicken.price ? `Comprar $${chicken.price}` : `Sin Saldo ($${chicken.price})`}
              </button>
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ margin: '2rem 0 0.5rem', color: '#fcd535', borderBottom: '1px solid rgba(252,213,53,0.3)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>✨ Gallinas Especiales</h3>
      <div className="store-grid">
        {CHICKEN_TYPES.filter(c => c.isSpecial).map(chicken => (
          <div key={chicken.id} className="glass-panel store-item" style={{ padding: '1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', position: 'relative', height: '100%', border: '1px solid rgba(252,213,53,0.3)', background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(252,213,53,0.05))' }}>
            
            {/* Info Button Clickable */}
            <div 
              title="Ver Habilidad" 
              onClick={() => {
                Swal.fire({
                  title: chicken.name, 
                  html: `<b>Habilidad:</b> ${chicken.description}<br/><br/><i>Al comprar o encubar, puedes obtener la Leyenda Original o un Clon.</i>`, 
                  icon: 'info',
                  background: '#1e1e1e',
                  color: '#fff'
                });
              }}
              style={{ position: 'absolute', top: '10px', right: '10px', cursor: 'pointer', opacity: 0.9, background: 'rgba(0,0,0,0.5)', padding: '5px', borderRadius: '50%', border: '1px solid #fcd535' }}
            >
              <Info size={16} color="#fcd535" />
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem', color: '#fcd535' }}>{chicken.name}</h3>
              <p style={{ color: '#fff', fontSize: '0.75rem', lineHeight: '1.2', margin: 0, minHeight: '30px' }}>
                {chicken.description}
              </p>
            </div>
            
            <img src={chicken.img} alt={chicken.name} style={{ height: '90px', objectFit: 'contain', margin: '0.75rem 0', filter: 'drop-shadow(0 4px 8px rgba(252,213,53,0.3))' }} />
            
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <span style={{ color: '#aaa' }}>Base:</span>
                <span style={{ color: '#4ade80', fontWeight: 'bold' }}>+${((24 / (chicken.eggTime/(60*60*1000))) * chicken.incomePerEgg).toFixed(2)}/día</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                <span style={{ color: '#aaa' }}>Retorno:</span>
                <span style={{ color: '#fcd535' }}>Variable</span>
              </div>
              
              <button 
                className="btn-primary store-btn" 
                style={{ 
                  width: '100%', padding: '0.6rem', fontSize: '0.9rem',
                  opacity: balance >= chicken.price ? 1 : 0.4, 
                  cursor: balance >= chicken.price ? 'pointer' : 'not-allowed',
                  background: balance >= chicken.price ? '#fcd535' : 'rgba(255,255,255,0.1)',
                  color: balance >= chicken.price ? '#000' : '#fff'
                }}
                onClick={() => onBuy(chicken.id)}
                disabled={balance < chicken.price}
              >
                {balance >= chicken.price ? `Comprar $${chicken.price}` : `Sin Saldo ($${chicken.price})`}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
