import React, { useState, useEffect, useRef } from 'react';
import { CHICKEN_TYPES, calculateEffectiveTime } from '../hooks/useGameEngine';
import { Info, Volume2, VolumeX, Backpack, Flame, Sparkles } from 'lucide-react';
import Swal from 'sweetalert2';

export function Farm({ chickens, userData, onCollect, onOpenEgg, onOpenStarterEgg, onSell, onFeed, onScareFox, weatherData }) {
  const [now, setNow] = useState(Date.now());
  const [isMuted, setIsMuted] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isIncubating, setIsIncubating] = useState(false);
  const [particles, setParticles] = useState([]);
  const audioRef = useRef(null);

  const weather = weatherData?.type || 'sunny';
  const isFavorableEvent = ['rainbow', 'stars', 'bugs', 'butterflies'].includes(weather);
  const audioSrc = isFavorableEvent ? "/img/sound/event-sound.mp3" : "/img/sound/farm-sound.mp3";

  useEffect(() => {
    if (audioRef.current) {
      const wasPlaying = !audioRef.current.paused && !isMuted;
      audioRef.current.src = audioSrc;
      audioRef.current.load();
      if (wasPlaying) {
        audioRef.current.play().catch(e => console.log("Autoplay prevent", e));
      }
    }
  }, [audioSrc]);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Lógica de Día y Noche
  const currentHour = new Date(now).getHours();
  const isNight = currentHour >= 18 || currentHour < 6;
  const currentBg = isNight ? '/img/farm_bg_night.png' : '/img/farm_bg.jpg';
  
  // Actualizar la interfaz cada 10 segundos para ver cómo avanza la barra
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCollect = (e, chicken) => {
    if (chicken.currentEggs > 0) {
      const numParticles = 6;
      const newParticles = Array.from({length: numParticles}).map((_, i) => ({
        id: Date.now() + i + Math.random(),
        x: e.clientX,
        y: e.clientY,
        offsetX: (Math.random() - 0.5) * 120, // Explosión en X
        offsetY: (Math.random() - 0.5) * 120, // Explosión en Y
      }));
      setParticles(prev => [...prev, ...newParticles]);
      
      setTimeout(() => {
        setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
      }, 1000);
    }
    onCollect(chicken.id);
  };

  const toggleSound = () => {
    if (isMuted) {
      if (!audioRef.current.src || !audioRef.current.src.includes(audioSrc)) {
        audioRef.current.src = audioSrc;
        audioRef.current.load();
      }
      audioRef.current.play().catch(e => console.error("Autoplay prevent"));
      setIsMuted(false);
    } else {
      audioRef.current.pause();
      setIsMuted(true);
    }
  };

  const handleStarterEggClick = async () => {
    try {
      setIsIncubating(true);
      const result = await onOpenStarterEgg();
      if (!result.success) throw new Error(result.error);
      
      setTimeout(() => {
        setIsIncubating(false);
        Swal.fire({
          title: '¡Huevo Abierto!',
          text: `¡Felicidades! Has obtenido una Gallina ${result.wonType.name} Inicial (Poder al ${result.clonePower}%).`,
          imageUrl: result.wonType.img,
          imageWidth: 150,
          imageHeight: 150,
          imageAlt: 'Gallina ganada',
          confirmButtonText: '¡A Producir!',
          background: '#1e1e1e',
          color: '#fff'
        });
      }, 3500);
    } catch (e) {
      setIsIncubating(false);
      Swal.fire('Oops...', e.message, 'error');
    }
  };

  if (chickens.length === 0) {
    return (
      <div className="glass-panel" style={{ 
        padding: '4rem 2rem', textAlign: 'center',
        backgroundImage: `url(${currentBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        boxShadow: 'inset 0 0 0 1000px rgba(0,0,0,0.75)',
        position: 'relative',
        minHeight: '100vh'
      }}>
        {/* OVERLAY DE ANIMACIÓN DE INCUBADORA */}
        {isIncubating && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
            
            <div className="incubator-egg-container" style={{ position: 'relative' }}>
              <img src="/img/egg_4.png" alt="Huevo Incubando" className="egg-shake-glow" style={{ width: '150px', height: '150px', objectFit: 'contain' }} />
              
              <div className="light-beam beam-1"></div>
              <div className="light-beam beam-2"></div>
              <div className="light-beam beam-3"></div>
            </div>
            
            <h2 style={{ color: '#f97316', marginTop: '2rem', animation: 'pulse 1s infinite', textShadow: '0 0 10px #f97316' }}>
              Transmutando ADN...
            </h2>
            
            <style>{`
              .egg-shake-glow { animation: shake-glow 3.5s cubic-bezier(.36,.07,.19,.97) both; }
              @keyframes shake-glow {
                0% { transform: scale(1) translate3d(0, 0, 0); filter: drop-shadow(0 0 5px #f97316); }
                10%, 90% { transform: scale(1.1) translate3d(-2px, 0, 0); filter: drop-shadow(0 0 10px #f97316); }
                20%, 80% { transform: scale(1.15) translate3d(2px, 0, 0); filter: drop-shadow(0 0 20px #f97316); }
                30%, 50%, 70% { transform: scale(1.2) translate3d(-4px, 0, 0); filter: drop-shadow(0 0 40px #ff0000); }
                40%, 60% { transform: scale(1.25) translate3d(4px, 0, 0); filter: drop-shadow(0 0 60px #ff0000) brightness(1.5); }
                95% { transform: scale(1.5); filter: drop-shadow(0 0 100px #fff) brightness(3); opacity: 1; }
                100% { transform: scale(2); filter: drop-shadow(0 0 200px #fff) brightness(10); opacity: 0; }
              }
              .light-beam {
                position: absolute; top: 50%; left: 50%; width: 4px; height: 200px;
                background: linear-gradient(to top, transparent, #fff, transparent);
                transform-origin: center; opacity: 0;
                animation: beam-spin 2s ease-in-out infinite alternate;
              }
              .beam-1 { transform: translate(-50%, -50%) rotate(0deg); animation-delay: 1s; }
              .beam-2 { transform: translate(-50%, -50%) rotate(60deg); animation-delay: 1.5s; }
              .beam-3 { transform: translate(-50%, -50%) rotate(-60deg); animation-delay: 2s; }
              
              @keyframes beam-spin {
                0% { height: 0px; opacity: 0; filter: blur(2px); }
                50% { height: 300px; opacity: 0.8; filter: blur(5px); }
                100% { height: 500px; opacity: 1; filter: blur(8px); }
              }
            `}</style>
          </div>
        )}
        <audio ref={audioRef} loop />
        
        <div style={{ position: 'absolute', top: '80px', right: '20px', zIndex: 10 }}>
          <button onClick={toggleSound} style={{ background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', padding: '10px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </button>
        </div>

        <h2 style={{ color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Tu granja está vacía. ¡Compra gallinas para empezar!</h2>
        
        {userData?.freeStarterEgg > 0 && (
          <div style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(168,85,247,0.05))', border: '1px solid rgba(168,85,247,0.5)', padding: '1.5rem', borderRadius: '12px', margin: '2rem auto', maxWidth: '600px', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', backdropFilter: 'blur(10px)' }}>
            <img src="/img/egg_4.png" alt="Huevo de Bienvenida" style={{ width: '80px', height: '80px', objectFit: 'contain', filter: 'drop-shadow(0 0 15px rgba(168,85,247,0.8))' }} />
            <div style={{ flex: 1, textAlign: 'left' }}>
              <h3 style={{ color: '#d8b4fe', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} /> Huevo de Bienvenida ¡GRATIS!
              </h3>
              <p style={{ color: '#fff', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
                Tienes <strong>{userData.freeStarterEgg}</strong> Huevo(s) de Bienvenida disponibles. Ábrelo ahora para obtener tu primera gallina y comenzar a farmear.
              </p>
            </div>
            <button 
              className="btn-primary" 
              style={{ background: 'linear-gradient(90deg, #a855f7, #c084fc)', padding: '0.8rem 1.5rem', fontSize: '1.1rem', fontWeight: 'bold', margin: '0 auto' }}
              onClick={handleStarterEggClick}
            >
              <Flame size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
              Abrir Huevo
            </button>
          </div>
        )}

        {/* Top Inventory Bar */}
        {(userData?.mysteryEggs > 0 || userData?.cornCount > 0 || userData?.specialCornCount > 0) && (
          <div className="inventory-widget">
            {isMobile && (
              <button onClick={() => setIsInventoryOpen(!isInventoryOpen)} style={{ background: 'var(--primary-color)', border: 'none', color: '#fff', width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
                <Backpack size={24} />
                <span style={{ position: 'absolute', top: '0', right: '0', background: '#ff4c4c', fontSize: '0.6rem', padding: '2px 5px', borderRadius: '50%' }}>!</span>
              </button>
            )}
            
            {(!isMobile || isInventoryOpen) && (
            <div className={isMobile ? "inventory-widget-inner" : ""} style={{ display: 'flex', gap: isMobile ? '0.5rem' : '2rem', flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
              {userData?.mysteryEggs > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ position: 'relative' }}>
                    <img src="/img/mystery_egg.png" alt="Huevos" style={{ width: '40px', height: '40px' }} />
                    <span style={{ position: 'absolute', top: '-5px', right: '-10px', background: '#fcd535', color: '#000', fontWeight: 'bold', borderRadius: '50%', padding: '2px 8px' }}>{userData.mysteryEggs}</span>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: 0, color: '#fcd535', fontSize: '1rem' }}>Cesta de Huevos</h3>
                  </div>
                  <button className="btn-primary" onClick={onOpenEgg} style={{ marginLeft: '0.5rem', padding: '0.3rem 0.8rem', fontSize: '0.8rem', position: 'relative', zIndex: 100 }}>Abrir</button>
                </div>
              )}

              {userData?.cornCount > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ position: 'relative' }}>
                    <img src="/img/super_corn.png" alt="Saco Común" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                    <span style={{ position: 'absolute', top: '-5px', right: '-10px', background: '#4ade80', color: '#000', fontWeight: 'bold', borderRadius: '50%', padding: '2px 8px' }}>{userData.cornCount}</span>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: 0, color: '#4ade80', fontSize: '1rem' }}>Saco Común</h3>
                  </div>
                </div>
              )}

              {userData?.specialCornCount > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ position: 'relative' }}>
                    <img src="/img/premium_corn.png" alt="Saco Especial" style={{ width: '40px', height: '40px' }} />
                    <span style={{ position: 'absolute', top: '-5px', right: '-10px', background: '#a855f7', color: '#000', fontWeight: 'bold', borderRadius: '50%', padding: '2px 8px' }}>{userData.specialCornCount}</span>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: 0, color: '#a855f7', fontSize: '1rem' }}>Saco Especial</h3>
                  </div>
                </div>
              )}
            </div>
            )}
          </div>
        )}
      </div>
    );
  }



  return (
    <div className="farm-game-area" style={{ 
      minHeight: '100%', position: 'relative', overflow: 'hidden',
      backgroundImage: `url(${currentBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'bottom center',
      boxShadow: 'inset 0 0 0 1000px rgba(0,0,0,0.4)',
      padding: '2rem 1rem'
    }}>
      <audio ref={audioRef} loop />
      
      <div style={{ position: 'absolute', top: '80px', right: '20px', zIndex: 10 }}>
        <button onClick={toggleSound} style={{ background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', padding: '10px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
      </div>

      {/* Weather Overlays */}
      {weather === 'rain' && <div className="weather-overlay weather-rain"></div>}
      {weather === 'thunder' && <div className="weather-overlay weather-thunder"></div>}
      {weather === 'snow' && <div className="weather-overlay weather-snow"></div>}
      {weather === 'rainbow' && <div className="weather-overlay weather-rainbow"></div>}
      {weather === 'stars' && <div className="weather-overlay weather-stars"></div>}
      {weather === 'bugs' && <div className="weather-overlay weather-bugs"></div>}
      {weather === 'butterflies' && <div className="weather-overlay weather-butterflies"></div>}

      {(userData?.mysteryEggs > 0 || userData?.cornCount > 0 || userData?.specialCornCount > 0) && (
        <div className="inventory-widget">
          {isMobile && (
            <button onClick={() => setIsInventoryOpen(!isInventoryOpen)} style={{ background: 'var(--primary-color)', border: 'none', color: '#fff', width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
              <Backpack size={24} />
              <span style={{ position: 'absolute', top: '0', right: '0', background: '#ff4c4c', fontSize: '0.6rem', padding: '2px 5px', borderRadius: '50%' }}>!</span>
            </button>
          )}
          
          {(!isMobile || isInventoryOpen) && (
          <div className={isMobile ? "inventory-widget-inner" : ""} style={{ display: 'flex', gap: isMobile ? '0.5rem' : '2rem', flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
            
            {userData?.mysteryEggs > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <img src="/img/mystery_egg.png" alt="Huevos" style={{ width: '40px', height: '40px' }} />
                  <span style={{ position: 'absolute', top: '-5px', right: '-10px', background: '#fcd535', color: '#000', fontWeight: 'bold', borderRadius: '50%', padding: '2px 8px' }}>{userData.mysteryEggs}</span>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ margin: 0, color: '#fcd535', fontSize: '1rem' }}>Cesta de Huevos</h3>
                </div>
                <button className="btn-primary" onClick={onOpenEgg} style={{ marginLeft: '0.5rem', padding: '0.3rem 0.8rem', fontSize: '0.8rem', position: 'relative', zIndex: 100 }}>Abrir</button>
              </div>
            )}

            {userData?.cornCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <img src="/img/super_corn.png" alt="Saco Común" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  <span style={{ position: 'absolute', top: '-5px', right: '-10px', background: '#4ade80', color: '#000', fontWeight: 'bold', borderRadius: '50%', padding: '2px 8px' }}>{userData.cornCount}</span>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ margin: 0, color: '#4ade80', fontSize: '1rem' }}>Saco Común</h3>
                </div>
              </div>
            )}

            {userData?.specialCornCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <img src="/img/premium_corn.png" alt="Saco Especial" style={{ width: '40px', height: '40px' }} />
                  <span style={{ position: 'absolute', top: '-5px', right: '-10px', background: '#a855f7', color: '#000', fontWeight: 'bold', borderRadius: '50%', padding: '2px 8px' }}>{userData.specialCornCount}</span>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ margin: 0, color: '#a855f7', fontSize: '1rem' }}>Saco Especial</h3>
                </div>
              </div>
            )}

          </div>
          )}
        </div>
      )}

      <h2 className="hide-on-mobile" style={{ marginBottom: '2rem', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textAlign: 'center' }}>Tu Granja ({chickens.length} Gallinas)</h2>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem', justifyContent: 'center', zIndex: 1, position: 'relative', paddingBottom: '2rem', paddingTop: isMobile ? '120px' : '0px' }}>
        {chickens.map((chicken) => {
          const type = CHICKEN_TYPES.find(c => c.id === chicken.typeId);
          const isDepleted = chicken.currentEggs >= 5;
          const currentImg = isDepleted ? type.depletedImg : type.img;

          // Lógica de progreso
          const isBoosted = chicken.boostEndTime && now < chicken.boostEndTime;
          
          let effectiveTimePassed = calculateEffectiveTime(chicken.typeId, chicken.lastEggTime, now, chicken.boostStartTime, chicken.boostEndTime, weatherData?.history, chicken);
          
          let currentMultiplier = 1;
          
          // Lógica de UI para el multiplicador actual
          if (weather === 'rain') {
            if (chicken.typeId === 's_superman' || chicken.typeId === 's_granjero') currentMultiplier = 1;
            else currentMultiplier = 0.5;
          } else if (weather === 'snow') {
            if (chicken.typeId === 's_medico' || chicken.typeId === 's_granjero') currentMultiplier = 1;
            else currentMultiplier = 0.5;
          } else if (weather === 'thunder') {
            if (chicken.typeId === 's_mago') currentMultiplier = 2;
            else if (chicken.typeId === 's_granjero') currentMultiplier = 1;
            else currentMultiplier = 0.5;
          } else if (weather === 'rainbow' || weather === 'stars') {
            currentMultiplier = 2;
          } else if (weather === 'bugs') {
            currentMultiplier = 1.2;
          } else if (weather === 'butterflies') {
            currentMultiplier = 1.3;
          }
          
          const weatherColors = {
            rain: '#93c5fd',
            snow: '#bfdbfe',
            thunder: '#a78bfa',
            rainbow: '#fbcfe8',
            stars: '#fef08a',
            bugs: '#a3e635',
            butterflies: '#f472b6'
          };
          
          const weatherMultiplierOnly = currentMultiplier;
          
          if (chicken.typeId === 's_chef') currentMultiplier *= 1.5;
          
          const EGG_TIME_5 = type.eggTime * 5;
          const GRACE_PERIOD = 120 * 60 * 1000;
          const CYCLE_DURATION = EGG_TIME_5 + GRACE_PERIOD;
          
          let progress = 0;
          let timeLeftMins = 0;

          if (isDepleted) {
            // Última hora (ventana de gracia)
            progress = Math.min(100, Math.max(0, ((effectiveTimePassed - EGG_TIME_5) / (CYCLE_DURATION - EGG_TIME_5)) * 100));
            
            const remainingEffective = CYCLE_DURATION - effectiveTimePassed;
            let realTimeMultiplier = currentMultiplier;
            if (isBoosted) {
              const boostMultiplier = type.foodType === 'special' ? 2 : 1.5;
              realTimeMultiplier *= boostMultiplier;
            }
            
            timeLeftMins = Math.floor((remainingEffective / realTimeMultiplier) / 60000);
          } else {
            // Progreso hacia el siguiente huevo
            progress = Math.min(100, Math.max(0, ((effectiveTimePassed % type.eggTime) / type.eggTime) * 100));
          }

          return (
            <div key={chicken.id} className="animate-float" style={{ animationDelay: `${Math.random()}s`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div 
                style={{ 
                  cursor: 'default',
                  position: 'relative'
                }}
              >
                {isBoosted && <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', color: type.auraColor || '#4ade80', fontWeight: 'bold', fontSize: '0.8rem', whiteSpace: 'nowrap', textShadow: '0 2px 4px rgba(0,0,0,0.8)', zIndex: 2 }}>{type.foodType === 'special' ? '✨ 2x BOOST ✨' : '⚡ +50% Vel'}</div>}
                
                {chicken.isHalfSpecial && !chicken.isStarter && <div style={{ position: 'absolute', top: '5px', left: '0', background: 'rgba(255,0,0,0.7)', color: '#fff', fontSize: '0.65rem', padding: '2px 5px', borderRadius: '4px', zIndex: 3, fontWeight: 'bold', border: '1px solid #ff4c4c' }}>CLON {chicken.clonePower || 50}%</div>}
                
                {chicken.isStarter && <div style={{ position: 'absolute', top: '5px', left: '0', background: 'rgba(168, 85, 247, 0.8)', color: '#fff', fontSize: '0.65rem', padding: '2px 5px', borderRadius: '4px', zIndex: 3, fontWeight: 'bold', border: '1px solid #d8b4fe' }}>GRATIS {chicken.clonePower || 60}%</div>}
                
                {weather !== 'sunny' && weatherMultiplierOnly > 1 && (
                  <div className="floating-multiplier positive" style={{ color: weatherColors[weather] || '#4ade80' }}>
                    +{Math.round((weatherMultiplierOnly - 1) * 100)}% Vel
                  </div>
                )}
                
                {weather !== 'sunny' && weatherMultiplierOnly < 1 && (
                  <div className="floating-multiplier negative" style={{ color: weatherColors[weather] || '#ff4c4c' }}>
                    -{Math.round((1 - weatherMultiplierOnly) * 100)}% Vel
                  </div>
                )}
                
                {type.isSpecial && (
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      Swal.fire({
                        title: `<span style="color: var(--primary-color);">${type.name}</span>`, 
                        html: `<div style="text-align: left; font-size: 0.95rem; line-height: 1.5; padding: 0.5rem 0;">
                                <strong style="color: #fff;">Habilidad:</strong> <span style="color: #ddd;">${type.description}</span><br/><br/>
                                ${chicken.isHalfSpecial 
                                  ? `<div style="background: rgba(255,0,0,0.15); padding: 0.8rem; border-radius: 12px; border: 1px solid rgba(255,0,0,0.3); color: #ffcccc; font-size: 0.85rem;">⚠️ Este es un <b>CLON</b>. Su poder de producción está al <b>${chicken.clonePower || 50}%</b>.</div>` 
                                  : `<div style="background: rgba(251, 191, 36, 0.15); padding: 0.8rem; border-radius: 12px; border: 1px solid rgba(251, 191, 36, 0.3); color: #fde68a; font-size: 0.85rem;">✨ <b>Leyenda Original</b>. Su poder de producción está al <b>100%</b>.</div>`}
                              </div>`, 
                        icon: 'info',
                        iconColor: 'var(--primary-color)',
                        background: 'rgba(15, 23, 42, 0.9)',
                        color: '#fff',
                        confirmButtonText: 'Entendido',
                        buttonsStyling: false,
                        customClass: { 
                          popup: 'glass-panel small-info-modal',
                          confirmButton: 'btn-primary'
                        }
                      }); 
                    }}
                    style={{ position: 'absolute', top: '5px', right: '0', background: 'rgba(0,0,0,0.6)', border: '1px solid ' + (type.auraColor || '#ccc'), color: type.auraColor || '#fff', padding: '4px', borderRadius: '50%', cursor: 'pointer', zIndex: 3 }}
                    title="Ver Habilidad"
                  >
                    <Info size={14} />
                  </button>
                )}
                
                <img src={currentImg} alt="Gallina" style={{ height: '120px', objectFit: 'contain', filter: type.auraColor ? (chicken.isHalfSpecial ? `drop-shadow(0 0 10px ${type.auraColor}66)` : `drop-shadow(0 0 20px ${type.auraColor}99)`) : (isBoosted ? 'drop-shadow(0 0 15px rgba(74,222,128,0.8))' : 'drop-shadow(0 10px 10px rgba(0,0,0,0.6))'), opacity: (chicken.isHalfSpecial || chicken.isStarter) ? 0.85 : 1, transition: 'all 0.3s' }} />
                
                {chicken.hasFox && (
                  <div style={{ position: 'absolute', top: '10px', left: '-20px', zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <img src="/img/zorro.png" alt="Zorro Atacando" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
                    <button 
                      onClick={(e) => { e.stopPropagation(); onScareFox(chicken.id); }}
                      style={{ background: '#ff4c4c', color: '#fff', border: '1px solid #fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '2px', boxShadow: '0 2px 5px rgba(0,0,0,0.8)' }}
                    >
                      Espantar (10 H)
                    </button>
                  </div>
                )}
                
                {/* Botón Alimentar Flotante */}
                {!isBoosted && (
                  (() => {
                    const foodType = type.foodType || 'common';
                    const requiredBags = type.foodBagsRequired || 1;
                    const field = foodType === 'special' ? 'specialCornCount' : 'cornCount';
                    const userCorn = userData?.[field] || 0;
                    const canAfford = userCorn >= requiredBags;
                    const btnColor = foodType === 'special' ? '#a855f7' : '#4ade80';
                    const icon = foodType === 'special' ? '✨' : '🌽';
                    
                    return (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onFeed(chicken.id);
                        }}
                        style={{ 
                          position: 'absolute', bottom: '0', left: '-5px', 
                          background: canAfford ? `rgba(0,0,0,0.8)` : 'rgba(0,0,0,0.6)', 
                          color: canAfford ? btnColor : '#888', 
                          border: `1px solid ${canAfford ? btnColor : 'rgba(255,255,255,0.2)'}`,
                          padding: '4px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold', 
                          cursor: canAfford ? 'pointer' : 'not-allowed', zIndex: 3,
                          boxShadow: canAfford ? `0 0 8px ${btnColor}4D` : 'none',
                          display: 'flex', alignItems: 'center', gap: '3px'
                        }}
                        title={`Alimentar (${requiredBags} Saco${requiredBags > 1 ? 's' : ''})`}
                      >
                        {icon} x{requiredBags}
                      </button>
                    );
                  })()
                )}
                
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
                        filter: type.isSpecial ? `drop-shadow(0 2px 2px rgba(0,0,0,0.5)) drop-shadow(0 0 6px ${type.auraColor}) sepia(0.5) saturate(2) hue-rotate(-10deg)` : 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))',
                        position: 'relative',
                        zIndex: 10 + i
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
                  }} onClick={(e) => handleCollect(e, chicken)}>
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
                
              </div>
            </div>
          );
        })}
      </div>

      {/* Partículas de Recolección */}
      {particles.map(p => (
        <div 
          key={p.id} 
          className="coin-particle"
          style={{ 
            left: `${p.x}px`, 
            top: `${p.y}px`,
            '--tx': `calc(25vw - ${p.x}px)`,
            '--ty': `calc(10vh - ${p.y}px)`,
            '--ox': `${p.offsetX}px`,
            '--oy': `${p.offsetY}px`
          }}
        >
          🪙
        </div>
      ))}
    </div>
  );
}
