import React, { useState } from 'react';
import { CHICKEN_TYPES } from '../hooks/useGameEngine';
import { ShoppingBag, Flame, Info, Sparkles } from 'lucide-react';
import Swal from 'sweetalert2';

export function Basket({ userData, onSellEggs, onIncubateEggs, onAddTestEggs }) {
  const [activeTab, setActiveTab] = useState('cesta');
  const [isIncubating, setIsIncubating] = useState(false);
  const [incubatingType, setIncubatingType] = useState(null);
  
  const eggInventory = userData?.eggInventory || {};
  
  // Costos de incubación (Opción B: Difícil/Realista)
  const costMap = {
    '1': 1000,
    '2': 600,
    '3': 200,
    '4': 100
  };

  const handleIncubateClick = async (typeId) => {
    try {
      const type = CHICKEN_TYPES.find(t => t.id === typeId);
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

      <div style={{ display: 'flex', gap: '1rem', padding: '1.5rem 1.5rem 0', borderBottom: '1px solid var(--glass-border)', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setActiveTab('cesta')}
          style={{ 
            background: 'none', border: 'none', padding: '1rem', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold',
            color: activeTab === 'cesta' ? 'var(--primary-color)' : '#fff',
            borderBottom: activeTab === 'cesta' ? '3px solid var(--primary-color)' : '3px solid transparent'
          }}
        >
          <ShoppingBag size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
          Mi Cesta
        </button>
        <button 
          onClick={() => setActiveTab('incubadora')}
          style={{ 
            background: 'none', border: 'none', padding: '1rem', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold',
            color: activeTab === 'incubadora' ? '#f97316' : '#fff',
            borderBottom: activeTab === 'incubadora' ? '3px solid #f97316' : '3px solid transparent'
          }}
        >
          <Flame size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
          Incubadora
        </button>
        </div>
        <button 
          onClick={onAddTestEggs}
          style={{ background: 'rgba(74, 222, 128, 0.2)', color: '#4ade80', border: '1px solid #4ade80', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', width: 'fit-content' }}
        >
          <Sparkles size={16} /> 1000 Huevos de Prueba
        </button>
      </div>

      <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
        {activeTab === 'cesta' ? (
          <div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Aquí están todos los huevos que has recolectado de tu granja. Véndelos para obtener USDT y comprar mejores gallinas.
            </p>
            
            {Object.keys(eggInventory).filter(k => eggInventory[k] > 0).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                <ShoppingBag size={48} color="#666" style={{ marginBottom: '1rem' }} />
                <h3>Tu cesta está vacía</h3>
                <p style={{ color: 'var(--text-muted)' }}>Ve a la granja y recolecta huevos para verlos aquí.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                {Object.entries(eggInventory).map(([typeId, count]) => {
                  if (count <= 0) return null;
                  const type = CHICKEN_TYPES.find(t => t.id === typeId);
                  if (!type) return null;
                  
                  return (
                    <div key={typeId} className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ position: 'relative' }}>
                        <img src={type.eggImg || '/img/egg_1.png'} alt="Huevo" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
                        <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', background: 'var(--primary-color)', color: '#000', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px', fontSize: '0.8rem' }}>
                          x{count}
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0 }}>Huevo de {type.name}</h4>
                        <div style={{ color: '#4ade80', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                          Valor unitario: ${type.incomePerEgg.toFixed(3)}
                        </div>
                        <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                          Total: ${(count * type.incomePerEgg).toFixed(2)} USDT
                        </div>
                      </div>
                      <button 
                        className="btn-primary" 
                        style={{ padding: '0.5rem 1rem', background: '#3b82f6', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
                        onClick={() => onSellEggs(typeId, count)}
                      >
                        Vender
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.1), rgba(255,0,0,0.1))', border: '1px solid rgba(249,115,22,0.3)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
              <h3 style={{ color: '#f97316', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Info size={20} /> Guía de Incubación Mística
              </h3>
              <p style={{ color: '#fff', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
                Sacrifica los huevos de tu cesta para realizar una incubación de élite.<br/>
                ¡Podrás obtener un <strong>CLON (Media Especial)</strong> o con suerte, descubrir una <strong>LEYENDA ORIGINAL!</strong>
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
              {CHICKEN_TYPES.filter(c => !c.isSpecial).map(type => {
                const cost = costMap[type.id] || 20;
                const haveCount = eggInventory[type.id] || 0;
                const canAfford = haveCount >= cost;
                
                return (
                  <div key={type.id} className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', border: canAfford ? '1px solid rgba(249,115,22,0.5)' : '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                      <img src={type.eggImg || '/img/egg_1.png'} alt="Huevo" style={{ width: '80px', height: '80px', objectFit: 'contain', filter: 'drop-shadow(0 4px 10px rgba(249,115,22,0.3))' }} />
                    </div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#fff' }}>Huevos de {type.name}</h4>
                    
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: canAfford ? '#4ade80' : '#ff4c4c' }}>{haveCount}</span>
                      <span style={{ color: '#888' }}>/</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>{cost} req.</span>
                    </div>

                    <button 
                      className="btn-primary" 
                      style={{ 
                        width: '100%', 
                        background: canAfford ? 'linear-gradient(90deg, #f97316, #ef4444)' : 'rgba(255,255,255,0.1)', 
                        opacity: canAfford ? 1 : 0.5,
                        cursor: canAfford ? 'pointer' : 'not-allowed',
                        padding: '0.8rem',
                        fontSize: '1rem'
                      }}
                      disabled={!canAfford}
                      onClick={() => handleIncubateClick(type.id)}
                    >
                      <Flame size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                      Incubar
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
