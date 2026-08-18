import React, { useState, useEffect } from 'react';
import { CHICKEN_TYPES, calculateEffectiveTime } from '../hooks/useGameEngine';

export function Farm({ chickens, userData, onCollect, onOpenEgg, onSell, onFeed, weatherData }) {
  const [now, setNow] = useState(Date.now());
  
  // Lógica de Día y Noche
  const currentHour = new Date(now).getHours();
  const isNight = currentHour >= 18 || currentHour < 6;
  const currentBg = isNight ? '/img/farm_bg_night.png' : '/img/farm_bg.jpg';
  
  // Actualizar la interfaz cada 10 segundos para ver cómo avanza la barra
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  if (chickens.length === 0) {
    return (
      <div className="glass-panel" style={{ 
        padding: '4rem 2rem', textAlign: 'center',
        backgroundImage: `url(${currentBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        boxShadow: 'inset 0 0 0 1000px rgba(0,0,0,0.75)'
      }}>
        <h2 style={{ color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Tu granja está vacía. ¡Compra gallinas para empezar!</h2>
        
        {/* Top Inventory Bar */}
        {(userData?.mysteryEggs > 0 || userData?.cornCount > 0) && (
          <div style={{ marginTop: '2rem', background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', width: 'fit-content', margin: '2rem auto' }}>
            
            {userData?.mysteryEggs > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <img src="/img/mystery_egg.png" alt="Huevos" style={{ width: '50px', height: '50px' }} />
                  <span style={{ position: 'absolute', top: '-5px', right: '-10px', background: '#fcd535', color: '#000', fontWeight: 'bold', borderRadius: '50%', padding: '2px 8px' }}>{userData.mysteryEggs}</span>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ margin: 0, color: '#fcd535', fontSize: '1.1rem' }}>Cesta de Huevos</h3>
                </div>
                <button className="btn-primary" onClick={onOpenEgg} style={{ marginLeft: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Abrir</button>
              </div>
            )}

            {userData?.cornCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: userData?.mysteryEggs > 0 ? '1px solid rgba(255,255,255,0.2)' : 'none', paddingLeft: userData?.mysteryEggs > 0 ? '2rem' : '0' }}>
                <div style={{ position: 'relative' }}>
                  <img src="/img/super_corn.png" alt="Súper Maíz" style={{ width: '50px', height: '50px' }} />
                  <span style={{ position: 'absolute', top: '-5px', right: '-10px', background: '#4ade80', color: '#000', fontWeight: 'bold', borderRadius: '50%', padding: '2px 8px' }}>{userData.cornCount}</span>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ margin: 0, color: '#4ade80', fontSize: '1.1rem' }}>Súper Maíz</h3>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    );
  }

  const weather = weatherData?.type || 'sunny';

  return (
    <div className="farm-game-area" style={{ 
      minHeight: '100%', position: 'relative', overflow: 'hidden',
      backgroundImage: `url(${currentBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'bottom center',
      boxShadow: 'inset 0 0 0 1000px rgba(0,0,0,0.4)',
      padding: '2rem 1rem'
    }}>
      {/* Weather Overlays */}
      {weather === 'rain' && <div className="weather-overlay weather-rain"></div>}
      {weather === 'thunder' && <div className="weather-overlay weather-thunder"></div>}
      {weather === 'snow' && <div className="weather-overlay weather-snow"></div>}
      {weather === 'rainbow' && <div className="weather-overlay weather-rainbow"></div>}
      {weather === 'stars' && <div className="weather-overlay weather-stars"></div>}

      {(userData?.mysteryEggs > 0 || userData?.cornCount > 0) && (
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '15px', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
          
          {userData?.mysteryEggs > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ position: 'relative' }}>
                <img src="/img/mystery_egg.png" alt="Huevos" style={{ width: '50px', height: '50px' }} />
                <span style={{ position: 'absolute', top: '-5px', right: '-10px', background: '#fcd535', color: '#000', fontWeight: 'bold', borderRadius: '50%', padding: '2px 8px' }}>{userData.mysteryEggs}</span>
              </div>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ margin: 0, color: '#fcd535', fontSize: '1.1rem' }}>Cesta de Huevos</h3>
              </div>
              <button className="btn-primary" onClick={onOpenEgg} style={{ marginLeft: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Abrir</button>
            </div>
          )}

          {userData?.cornCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: userData?.mysteryEggs > 0 ? '1px solid rgba(255,255,255,0.2)' : 'none', paddingLeft: userData?.mysteryEggs > 0 ? '2rem' : '0' }}>
              <div style={{ position: 'relative' }}>
                <img src="/img/super_corn.png" alt="Súper Maíz" style={{ width: '50px', height: '50px' }} />
                <span style={{ position: 'absolute', top: '-5px', right: '-10px', background: '#4ade80', color: '#000', fontWeight: 'bold', borderRadius: '50%', padding: '2px 8px' }}>{userData.cornCount}</span>
              </div>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ margin: 0, color: '#4ade80', fontSize: '1.1rem' }}>Súper Maíz</h3>
              </div>
            </div>
          )}

        </div>
      )}

      <h2 className="hide-on-mobile" style={{ marginBottom: '2rem', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textAlign: 'center' }}>Tu Granja ({chickens.length} Gallinas)</h2>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem', justifyContent: 'center', zIndex: 1, position: 'relative', paddingBottom: '2rem' }}>
        {chickens.map((chicken) => {
          const type = CHICKEN_TYPES.find(c => c.id === chicken.typeId);
          const isDepleted = chicken.currentEggs >= 5;
          const currentImg = isDepleted ? type.depletedImg : type.img;

          // Lógica de progreso
          const isBoosted = chicken.boostEndTime && now < chicken.boostEndTime;
          
          let effectiveTimePassed = calculateEffectiveTime(chicken.lastEggTime, now, chicken.boostStartTime, chicken.boostEndTime, weatherData?.history);
          
          let currentMultiplier = 1;
          if (weather === 'rain' || weather === 'thunder' || weather === 'snow') currentMultiplier = 0.5;
          if (weather === 'rainbow' || weather === 'stars') currentMultiplier = 2;
          
          const CYCLE_DURATION = 24 * 60 * 60 * 1000;
          const EGG_TIME_5 = type.eggTime * 5;
          
          let progress = 0;
          let timeLeftMins = 0;

          if (isDepleted) {
            // Última hora (ventana de gracia)
            progress = Math.min(100, Math.max(0, ((effectiveTimePassed - EGG_TIME_5) / (CYCLE_DURATION - EGG_TIME_5)) * 100));
            
            const remainingEffective = CYCLE_DURATION - effectiveTimePassed;
            let realTimeMultiplier = currentMultiplier;
            if (isBoosted) realTimeMultiplier *= 2;
            
            timeLeftMins = Math.floor((remainingEffective / realTimeMultiplier) / 60000);
          } else {
            // Progreso hacia el siguiente huevo
            progress = Math.min(100, Math.max(0, ((effectiveTimePassed % type.eggTime) / type.eggTime) * 100));
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
                {isBoosted && <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', color: '#4ade80', fontWeight: 'bold', fontSize: '0.8rem', whiteSpace: 'nowrap', textShadow: '0 2px 4px rgba(0,0,0,0.8)', zIndex: 2 }}>✨ 2x BOOST ✨</div>}
                <img src={currentImg} alt="Gallina" style={{ height: '120px', objectFit: 'contain', filter: isBoosted ? 'drop-shadow(0 0 15px rgba(74,222,128,0.8))' : 'drop-shadow(0 10px 10px rgba(0,0,0,0.6))', transition: 'all 0.3s' }} />
                
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
              
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {chicken.currentEggs > 0 && (
                  <span style={{ 
                    background: 'var(--accent-color)', color: 'white', 
                    padding: '4px 12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold', 
                    boxShadow: '0 2px 5px rgba(0,0,0,0.5)', cursor: 'pointer' 
                  }} onClick={() => onCollect(chicken.id)}>
                    Recoger
                  </span>
                )}
                <span style={{ 
                  background: 'rgba(255, 76, 76, 0.1)', color: '#ff4c4c', border: '1px solid rgba(255, 76, 76, 0.3)',
                  padding: '4px 12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold', 
                  cursor: 'pointer' 
                }} onClick={() => onSell(chicken.id)}>
                  Vender (${(type.price / 2).toFixed(2)})
                </span>
                
                {userData?.cornCount > 0 && !isBoosted && (
                  <span style={{ 
                    background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', border: '1px solid rgba(74, 222, 128, 0.3)',
                    padding: '4px 12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold', 
                    cursor: 'pointer', width: '100%', textAlign: 'center', marginTop: '0.25rem'
                  }} onClick={() => onFeed(chicken.id)}>
                    🌽 Alimentar
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
