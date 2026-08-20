import React, { useState } from 'react';
import { useGameConfig } from '../contexts/GameConfigContext';
import { ShoppingCart, Info, ArrowRightLeft } from 'lucide-react';
import Swal from 'sweetalert2';

export function Store({ balance, eggBalance, onBuy, onBuyMysteryEgg, onBuyFood, exchangeUsdtToEggs, exchangeEggsToUsdt, rate, oracleRate = 100 }) {
  const { chickenTypes } = useGameConfig();
  const [exchangeAmount, setExchangeAmount] = useState('');
  const [operationMode, setOperationMode] = useState(null);
  
  const handleExchangeUsdt = () => {
    const amt = parseFloat(exchangeAmount);
    if (isNaN(amt) || amt <= 0) return Swal.fire('Error', 'Monto inválido', 'error');
    exchangeUsdtToEggs(amt);
    setExchangeAmount('');
    setOperationMode(null);
  };

  const handleExchangeEggs = () => {
    const amt = parseInt(exchangeAmount);
    if (isNaN(amt) || amt <= 0) return Swal.fire('Error', 'Monto inválido', 'error');
    exchangeEggsToUsdt(amt);
    setExchangeAmount('');
    setOperationMode(null);
  };

  return (
    <div style={{ padding: '1rem' }}>
      
      {/* ORÁCULO */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid var(--primary-color)' }}>
        <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)' }}>
          <ArrowRightLeft /> El Oráculo (Casa de Cambio)
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Tasa de Cambio Actual: <strong style={{ color: '#fff' }}>1 CKF = {oracleRate} Huevos</strong> <span style={{fontSize: '0.8rem', color: '#aaa'}}>(1 CKF = 1 USDT)</span>
        </p>
        
        {!operationMode ? (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => setOperationMode('buyEggs')} style={{ flex: 1, minWidth: '150px', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', transition: 'transform 0.2s' }}>
               <span style={{ fontSize: '1.1rem' }}>🛒 Comprar Huevos</span>
               <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>(Pagar con CKF)</span>
            </button>
            <button className="btn-primary" onClick={() => setOperationMode('sellEggs')} style={{ flex: 1, minWidth: '150px', padding: '1rem', background: '#fbbf24', color: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', transition: 'transform 0.2s' }}>
               <span style={{ fontSize: '1.1rem' }}>💰 Retirar CKF</span>
               <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>(Vender Huevos)</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
              <h4 style={{ margin: 0, color: operationMode === 'buyEggs' ? '#fcd535' : '#4ade80', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {operationMode === 'buyEggs' ? '🛒 Comprando Huevos' : '💰 Vendiendo Huevos'}
              </h4>
              <button onClick={() => { setOperationMode(null); setExchangeAmount(''); }} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.85rem' }}>
                Volver a opciones
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', color: '#ccc' }}>
                {operationMode === 'buyEggs' ? 'Monto a pagar en CKF:' : 'Monto a vender en Huevos:'}
              </label>
              <input 
                type="number" 
                placeholder="Ingresa el monto..." 
                value={exchangeAmount} 
                onChange={(e) => setExchangeAmount(e.target.value)}
                style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff', width: '100%', fontSize: '1.1rem' }}
                autoFocus
              />
              
              {exchangeAmount > 0 && (
                <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', borderLeft: `4px solid ${operationMode === 'buyEggs' ? '#fcd535' : '#4ade80'}`, marginTop: '0.5rem', animation: 'slideDown 0.3s ease' }}>
                  <span style={{ fontSize: '0.9rem', color: '#fff', display: 'block', marginBottom: '0.2rem' }}>
                    Recibirás en tu cuenta:
                  </span>
                  <strong style={{ fontSize: '1.4rem', color: operationMode === 'buyEggs' ? '#fcd535' : '#4ade80' }}>
                    {operationMode === 'buyEggs' 
                      ? `${(parseFloat(exchangeAmount) * oracleRate).toLocaleString('en-US')} 🥚 Huevos` 
                      : `${(parseFloat(exchangeAmount) / oracleRate).toFixed(2)} CKF`}
                  </strong>
                </div>
              )}
            </div>
            
            <button 
              className="btn-primary" 
              onClick={operationMode === 'buyEggs' ? handleExchangeUsdt : handleExchangeEggs} 
              style={{ 
                padding: '0.8rem', 
                background: operationMode === 'buyEggs' ? 'var(--primary-color)' : '#fbbf24', 
                color: operationMode === 'buyEggs' ? '#fff' : '#000', 
                width: '100%', 
                marginTop: '0.5rem', 
                opacity: exchangeAmount > 0 ? 1 : 0.5,
                cursor: exchangeAmount > 0 ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
                fontSize: '1.1rem'
              }}
              disabled={!exchangeAmount || exchangeAmount <= 0}
            >
              Confirmar Operación
            </button>
          </div>
        )}
      </div>

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
          
          <button className="btn-primary store-btn" style={{ opacity: eggBalance >= 200 ? 1 : 0.4, cursor: eggBalance >= 200 ? 'pointer' : 'not-allowed', background: eggBalance >= 200 ? '#fcd535' : 'rgba(255,255,255,0.1)', color: eggBalance >= 200 ? '#000' : '#fff' }} onClick={onBuyMysteryEgg} disabled={eggBalance < 200}>
            {eggBalance >= 200 ? 'Comprar por 200 Huevos' : 'Sin Huevos (200)'}
          </button>
        </div>

        {/* Saco de Maíz Común Section */}
        <div className="glass-panel store-item" style={{ padding: '1rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(74,222,128,0.15))', border: '1px solid rgba(74,222,128,0.4)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-10px', left: '-10px', width: '60px', height: '60px', background: '#4ade80', filter: 'blur(30px)', opacity: 0.4 }}></div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>🌽 Saco Común</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.8rem', maxWidth: '300px', margin: '0 auto 1rem auto', lineHeight: '1.2', minHeight: '40px' }}>
            Alimento diario para gallinas normales. (Obligatorio).
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <img src="/img/super_corn.png" alt="Saco Común" style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '50%', filter: 'drop-shadow(0 4px 10px rgba(74,222,128,0.4))' }} />
          </div>
          
          <div style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1rem', color: '#fcd535' }}>
            5 Huevos
          </div>
          
          <button 
            className="btn-primary store-btn" 
            style={{ 
              opacity: eggBalance >= 5 ? 1 : 0.4, 
              cursor: eggBalance >= 5 ? 'pointer' : 'not-allowed', 
              background: eggBalance >= 5 ? '#4ade80' : 'rgba(255,255,255,0.1)', 
              color: eggBalance >= 5 ? '#000' : '#fff' 
            }} 
            onClick={() => onBuyFood('common')} 
            disabled={eggBalance < 5}
          >
            {eggBalance >= 5 ? 'Comprar 1 Saco' : 'Sin Huevos (5)'}
          </button>
        </div>

        {/* Saco de Maíz Especial Section */}
        <div className="glass-panel store-item" style={{ padding: '1rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(168,85,247,0.15))', border: '1px solid rgba(168,85,247,0.4)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-10px', left: '-10px', width: '60px', height: '60px', background: '#a855f7', filter: 'blur(30px)', opacity: 0.4 }}></div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>✨ Saco Especial</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.8rem', maxWidth: '300px', margin: '0 auto 1rem auto', lineHeight: '1.2', minHeight: '40px' }}>
            Alimento diario para gallinas Especiales. (Obligatorio).
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <img src="/img/premium_corn.png" alt="Saco Especial" style={{ width: '70px', height: '70px', objectFit: 'contain', filter: 'drop-shadow(0 4px 10px rgba(168,85,247,0.4))' }} />
          </div>
          
          <div style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1rem', color: '#fcd535' }}>
            25 Huevos
          </div>
          
          <button 
            className="btn-primary store-btn" 
            style={{ 
              opacity: eggBalance >= 25 ? 1 : 0.4, 
              cursor: eggBalance >= 25 ? 'pointer' : 'not-allowed', 
              background: eggBalance >= 25 ? '#a855f7' : 'rgba(255,255,255,0.1)', 
              color: eggBalance >= 25 ? '#fff' : '#fff' 
            }} 
            onClick={() => onBuyFood('special')} 
            disabled={eggBalance < 25}
          >
            {eggBalance >= 25 ? 'Comprar 1 Saco' : 'Sin Huevos (25)'}
          </button>
        </div>
      </div>

      <h3 style={{ margin: '1rem 0 0.5rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Gallinas Normales</h3>
      <div className="store-grid">
        {chickenTypes.filter(c => !c.isSpecial).map(chicken => (
          <div key={chicken.id} className="glass-panel store-item" style={{ padding: '1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', position: 'relative', height: '100%' }}>
            
            <div className="info-tooltip" title={`Esta gallina produce ${chicken.incomePerEgg} Huevos por huevo puesto. Tiempo por huevo: ${(chicken.eggTime / (60*60*1000)).toFixed(1)} horas. Max: 5 huevos por ciclo.`} style={{ position: 'absolute', top: '10px', right: '10px', cursor: 'help', opacity: 0.7 }}>
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
                <span style={{ color: '#4ade80', fontWeight: 'bold' }}>+{((24 / (chicken.eggTime/(60*60*1000))) * chicken.incomePerEgg).toFixed(1)} Huevos/día</span>
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
                  opacity: eggBalance >= chicken.price ? 1 : 0.4, 
                  cursor: eggBalance >= chicken.price ? 'pointer' : 'not-allowed',
                  background: eggBalance >= chicken.price ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)'
                }}
                onClick={() => onBuy(chicken.id)}
                disabled={eggBalance < chicken.price}
              >
                {eggBalance >= chicken.price ? `Comprar ${chicken.price} H` : `Faltan Huevos (${chicken.price})`}
              </button>
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ margin: '2rem 0 0.5rem', color: '#fcd535', borderBottom: '1px solid rgba(252,213,53,0.3)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>✨ Gallinas Especiales</h3>
      <div className="store-grid">
        {chickenTypes.filter(c => c.isSpecial).map(chicken => (
          <div key={chicken.id} className="glass-panel store-item" style={{ padding: '1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', position: 'relative', height: '100%', border: '1px solid rgba(252,213,53,0.3)', background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(252,213,53,0.05))' }}>
            
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
                <span style={{ color: '#4ade80', fontWeight: 'bold' }}>+{((24 / (chicken.eggTime/(60*60*1000))) * chicken.incomePerEgg).toFixed(1)} H/día</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                <span style={{ color: '#aaa' }}>Retorno:</span>
                <span style={{ color: '#fcd535' }}>Variable</span>
              </div>
              
              <button 
                className="btn-primary store-btn" 
                style={{ 
                  width: '100%', padding: '0.6rem', fontSize: '0.9rem',
                  opacity: eggBalance >= chicken.price ? 1 : 0.4, 
                  cursor: eggBalance >= chicken.price ? 'pointer' : 'not-allowed',
                  background: eggBalance >= chicken.price ? '#fcd535' : 'rgba(255,255,255,0.1)',
                  color: eggBalance >= chicken.price ? '#000' : '#fff'
                }}
                onClick={() => onBuy(chicken.id)}
                disabled={eggBalance < chicken.price}
              >
                {eggBalance >= chicken.price ? `Comprar ${chicken.price} H` : `Faltan Huevos (${chicken.price})`}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
