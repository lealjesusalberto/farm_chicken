import React, { useState, useEffect } from 'react';
import { CHICKEN_TYPES } from '../hooks/useGameEngine';

export function Farm({ chickens, onCollect }) {
  const [now, setNow] = useState(Date.now());
  
  // Actualizar la interfaz cada 10 segundos para ver cómo avanza la barra
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  if (chickens.length === 0) {
    return (
      <div className="glass-panel" style={{ 
        padding: '4rem 2rem', textAlign: 'center',
        backgroundImage: 'url(/img/farm_bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        boxShadow: 'inset 0 0 0 1000px rgba(0,0,0,0.75)'
      }}>
        <h2 style={{ color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Tu granja está vacía. ¡Compra gallinas para empezar!</h2>
      </div>
    );
  }

  return (
    <div className="farm-game-area" style={{ 
      minHeight: '100%', position: 'relative', overflow: 'hidden',
      backgroundImage: 'url(/img/farm_bg.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'bottom center',
      boxShadow: 'inset 0 0 0 1000px rgba(0,0,0,0.4)',
      padding: '5rem 1rem 6rem 1rem' // Espacio para el header y el bottom bar
    }}>
      <h2 className="hide-on-mobile" style={{ marginBottom: '2rem', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textAlign: 'center' }}>Tu Granja ({chickens.length} Gallinas)</h2>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem', justifyContent: 'center', zIndex: 1, position: 'relative', paddingBottom: '2rem' }}>
        {chickens.map((chicken) => {
          const type = CHICKEN_TYPES.find(c => c.id === chicken.typeId);
          const isDepleted = chicken.currentEggs >= 5;
          const currentImg = isDepleted ? type.depletedImg : type.img;

          // Lógica de progreso
          const timePassed = now - chicken.lastEggTime;
          const EGG_TIME_5 = type.eggTime * 5; // 23 horas
          const CYCLE_DURATION = 24 * 60 * 60 * 1000; // 24 horas
          
          let progress = 0;
          let timeLeftMins = 0;

          if (isDepleted) {
            // Última hora (ventana de gracia)
            progress = Math.min(100, Math.max(0, ((timePassed - EGG_TIME_5) / (CYCLE_DURATION - EGG_TIME_5)) * 100));
            timeLeftMins = Math.floor((CYCLE_DURATION - timePassed) / 60000);
          } else {
            // Progreso hacia el siguiente huevo
            progress = Math.min(100, Math.max(0, ((timePassed % type.eggTime) / type.eggTime) * 100));
          }

          return (
            <div key={chicken.id} className="animate-float" style={{ animationDelay: `${Math.random()}s`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div 
                style={{ 
                  cursor: chicken.currentEggs > 0 ? 'pointer' : 'default',
                  position: 'relative'
                }}
                onClick={() => onCollect(chicken.id)}
                title={chicken.currentEggs > 0 ? "¡Clic para recolectar!" : ""}
              >
                <img src={currentImg} alt="Gallina" style={{ height: '120px', objectFit: 'contain', filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.6))' }} />
                
                {/* Contenedor de huevos */}
                <div style={{ position: 'absolute', bottom: '-15px', right: '-20px', display: 'flex', gap: '-5px', flexWrap: 'wrap', width: '80px', pointerEvents: 'none' }}>
                  {Array.from({ length: chicken.currentEggs }).map((_, i) => (
                    <img 
                      key={i} 
                      src={type.eggImg} 
                      alt="Huevo" 
                      style={{ 
                        height: '35px', 
                        marginLeft: '-15px',
                        filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))'
                      }} 
                    />
                  ))}
                </div>
              </div>
              
              {/* Barra de progreso */}
              <div style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100px' }}>
                <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.6)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${progress}%`, 
                    background: isDepleted ? '#ff4c4c' : '#4ade80',
                    transition: 'width 1s linear'
                  }}></div>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#ddd', marginTop: '6px', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                  {isDepleted 
                    ? `¡Recoge! (${Math.max(0, timeLeftMins)}m)` 
                    : `Huevo ${chicken.currentEggs + 1}: ${Math.floor(progress)}%`}
                </div>
              </div>
              
              {chicken.currentEggs > 0 && (
                <span style={{ 
                  marginTop: '0.75rem', background: 'var(--accent-color)', color: 'white', 
                  padding: '4px 12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold', 
                  boxShadow: '0 2px 5px rgba(0,0,0,0.5)', cursor: 'pointer' 
                }} onClick={() => onCollect(chicken.id)}>
                  Recoger
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
