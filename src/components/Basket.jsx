import React, { useState } from 'react';
import { useGameConfig } from '../contexts/GameConfigContext';
import { Flame, Info, Sparkles } from 'lucide-react';
import Swal from 'sweetalert2';

export function Basket({ userData, onIncubateEggs, onOpenMysteryEgg, onOpenVolcanoEgg }) {
  const { chickenTypes } = useGameConfig();
  const [isIncubating, setIsIncubating] = useState(false);
  const [incubatingType, setIncubatingType] = useState(null);
  
  // Costos de incubación (Opción B: Difícil/Realista)
  const costMap = {
    '1': 1000,
    '2': 600,
    '3': 200,
    '4': 100
  };

  const handleIncubateClick = async (typeId) => {
    try {
      const type = chickenTypes.find(t => t.id === typeId);
      setIncubatingType(type);
      setIsIncubating(true);
      
      // Llamar al backend para procesar (ya descuenta huevos y añade gallina)
      const result = await onIncubateEggs(typeId);
      
      // Dejar que la animación corra por 3 segundos
      setTimeout(() => {
        setIsIncubating(false);
        Swal.fire({
          title: result.isHalfSpecial ? '¡Gallina Clonada!' : '¡Gallina Especial Original!',
          text: result.isHalfSpecial ? `Has obtenido un CLON de ${result.wonType.name} (Poder al ${result.clonePower}%).` : `¡Felicidades! Has obtenido a ${result.wonType.name} Original (Poderes al 100%).`,
          imageUrl: result.wonType.img,
          imageWidth: 150,
          imageHeight: 150,
          imageAlt: 'Gallina ganada',
          confirmButtonText: '¡Asombroso!',
          background: '#1e1e1e',
          color: '#fff'
        });
      }, 3500);
      
    } catch (e) {
      setIsIncubating(false);
      Swal.fire('Oops...', e.message, 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* OVERLAY DE ANIMACIÓN DE INCUBADORA */}
      {isIncubating && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRadius: '12px', overflow: 'hidden' }}>
          
          {/* Huevo que vibra y brilla */}
          <div className="incubator-egg-container" style={{ position: 'relative' }}>
            <img src={incubatingType?.eggImg || '/img/egg_1.png'} alt="Huevo Incubando" className="egg-shake-glow" style={{ width: '150px', height: '150px', objectFit: 'contain' }} />
            
            {/* Partículas / Rayos de luz simulados con divs en CSS absoluto */}
            <div className="light-beam beam-1"></div>
            <div className="light-beam beam-2"></div>
            <div className="light-beam beam-3"></div>
          </div>
          
          <h2 style={{ color: '#f97316', marginTop: '2rem', animation: 'pulse 1s infinite', textShadow: '0 0 10px #f97316' }}>
            Transmutando ADN...
          </h2>
          
          {/* Estilos CSS incrustados para esta animación */}
          <style>{`
            .egg-shake-glow {
              animation: shake-glow 3.5s cubic-bezier(.36,.07,.19,.97) both;
            }
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
              position: absolute;
              top: 50%;
              left: 50%;
              width: 4px;
              height: 200px;
              background: linear-gradient(to top, transparent, #fff, transparent);
              transform-origin: center;
              opacity: 0;
              animation: beam-spin 2s ease-in-out infinite alternate;
            }
            .beam-1 { transform: translate(-50%, -50%) rotate(0deg); animation-delay: 1s; }
            .beam-2 { transform: translate(-50%, -50%) rotate(60deg); animation-delay: 1.5s; }
            .beam-3 { transform: translate(-50%, -50%) rotate(-60deg); animation-delay: 2s; }
            
            @keyframes beam-spin {
              0% { height: 0px; opacity: 0; filter: blur(2px); }
              50% { height: 300px; opacity: 0.8; filter: blur(5px); }
              100% { height: 400px; opacity: 1; filter: blur(8px); }
            }
          `}</style>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', padding: '1.5rem 1.5rem 0', borderBottom: '1px solid var(--glass-border)', justifyContent: 'center', alignItems: 'center' }}>
        <h2 style={{ margin: 0, paddingBottom: '1rem', color: '#f97316', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Flame size={24} /> Incubadora Mística
        </h2>
      </div>

      <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
        <div>

            {(userData?.volcanoEggs > 0 || userData?.mysteryEggs > 0) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                
                {userData?.volcanoEggs > 0 && (
                  <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid #dc2626' }}>
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1rem' }}>
                      <img 
                        src="/img/egg_white.png" 
                        alt="Huevo Volcánico" 
                        style={{ 
                          width: '80px', 
                          height: '80px', 
                          objectFit: 'contain',
                          filter: 'drop-shadow(0 0 10px red) drop-shadow(0 0 20px orange)',
                          animation: 'pulse 1s infinite alternate'
                        }} 
                      />
                      <span style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#dc2626', color: '#fff', fontWeight: 'bold', borderRadius: '50%', padding: '4px 10px' }}>{userData.volcanoEggs}</span>
                    </div>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#fca5a5' }}>Huevo de Volcán</h4>
                    <button className="btn-primary" onClick={onOpenVolcanoEgg} style={{ width: '100%', background: 'linear-gradient(90deg, #dc2626, #f97316)', padding: '0.8rem' }}>
                      <Sparkles size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                      Eclosionar
                    </button>
                  </div>
                )}

                {userData?.mysteryEggs > 0 && (
                  <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid #fcd535' }}>
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1rem' }}>
                      <img src="/img/mystery_egg.png" alt="Huevo Misterioso" style={{ width: '80px', height: '80px', objectFit: 'contain', filter: 'drop-shadow(0 4px 15px rgba(252,213,53,0.5))' }} />
                      <span style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#fcd535', color: '#000', fontWeight: 'bold', borderRadius: '50%', padding: '4px 10px' }}>{userData.mysteryEggs}</span>
                    </div>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#fef08a' }}>Huevo Misterioso</h4>
                    <button className="btn-primary" onClick={onOpenMysteryEgg} style={{ width: '100%', padding: '0.8rem' }}>
                      <Sparkles size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                      Eclosionar
                    </button>
                  </div>
                )}
                
              </div>
            )}

            <div style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.1), rgba(255,0,0,0.1))', border: '1px solid rgba(249,115,22,0.3)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
              <h3 style={{ color: '#f97316', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Info size={20} /> Guía de Incubación Mística
              </h3>
              <p style={{ color: '#fff', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
                Sacrifica los huevos de tu cesta para realizar una incubación de élite.<br/>
                ¡Podrás obtener un <strong>CLON (Media Especial)</strong> o con suerte, descubrir una <strong>LEYENDA ORIGINAL!</strong>
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', border: (userData?.eggBalance || 0) >= 1000 ? '1px solid rgba(249,115,22,0.5)' : '1px solid rgba(255,255,255,0.1)', maxWidth: '400px', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <img src="/img/mystery_egg.png" alt="Incubadora Mística" style={{ width: '120px', height: '120px', objectFit: 'contain', filter: 'drop-shadow(0 4px 15px rgba(249,115,22,0.5))' }} />
                </div>
                <h3 style={{ margin: '0 0 1rem 0', color: '#fff', fontSize: '1.5rem' }}>Incubación Élite</h3>
                
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: (userData?.eggBalance || 0) >= 1000 ? '#fcd535' : '#ff4c4c' }}>
                    {Math.floor(userData?.eggBalance || 0)}
                  </span>
                  <span style={{ color: '#888', fontSize: '1.5rem' }}>/</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>1000 Monedas</span>
                </div>

                <button 
                  className="btn-primary" 
                  style={{ 
                    width: '100%', 
                    background: (userData?.eggBalance || 0) >= 1000 ? 'linear-gradient(90deg, #f97316, #ef4444)' : 'rgba(255,255,255,0.1)', 
                    opacity: (userData?.eggBalance || 0) >= 1000 ? 1 : 0.5,
                    cursor: (userData?.eggBalance || 0) >= 1000 ? 'pointer' : 'not-allowed',
                    padding: '1rem',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    borderRadius: '12px',
                    boxShadow: (userData?.eggBalance || 0) >= 1000 ? '0 4px 15px rgba(249,115,22,0.4)' : 'none'
                  }}
                  disabled={(userData?.eggBalance || 0) < 1000}
                  onClick={handleIncubateClick}
                >
                  <Flame size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                  Incubar Ahora
                </button>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
