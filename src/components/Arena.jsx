import React, { useState, useEffect } from 'react';
import { ARENA_CHICKEN_STATS, getEnemiesForWave } from '../utils/arenaEngine';
import { useGameConfig } from '../contexts/GameConfigContext';
import { Shield, Zap, Heart, Crosshair, Sparkles, Coins, Gift } from 'lucide-react';
import Swal from 'sweetalert2';

export function Arena({ userData, userChickens, onBattleWin, onStartBattle }) {
  const { chickenTypes } = useGameConfig();
  const [view, setView] = useState('lobby'); // 'lobby' or 'combat'
  const [selectedChickens, setSelectedChickens] = useState([]);
  
  // Combat State
  const [playerTeam, setPlayerTeam] = useState([]);
  const [enemyTeam, setEnemyTeam] = useState([]);
  const [turn, setTurn] = useState('player'); // 'player' or 'enemy'
  const [activeChickenIndex, setActiveChickenIndex] = useState(0);
  const [battleLog, setBattleLog] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [attackingChickenId, setAttackingChickenId] = useState(null);
  const [activeProjectile, setActiveProjectile] = useState(null);
  const [activeHitEffect, setActiveHitEffect] = useState(null);
  const [isCinematic, setIsCinematic] = useState(false);

  const specialChickens = userChickens.filter(c => {
    const t = chickenTypes.find(type => type.id === c.typeId);
    return t && t.isSpecial;
  });

  const handleSelectChicken = (c) => {
    if (selectedChickens.find(sc => sc.id === c.id)) {
      setSelectedChickens(selectedChickens.filter(sc => sc.id !== c.id));
    } else {
      if (selectedChickens.length < 3) {
        setSelectedChickens([...selectedChickens, c]);
      } else {
        Swal.fire('Equipo lleno', 'Solo puedes llevar 3 gallinas a la Arena.', 'warning');
      }
    }
  };

  const startBattle = async () => {
    try {
      if (selectedChickens.length === 0) return Swal.fire('Error', 'Debes seleccionar al menos una gallina.', 'error');
      
      const success = await onStartBattle();
      if (!success) return Swal.fire('Error', 'No se pudo iniciar la batalla.', 'error');
      
      // Init Player Team
      const pTeam = selectedChickens.map(c => {
        const type = chickenTypes.find(t => t.id === c.typeId);
        const stats = ARENA_CHICKEN_STATS[c.typeId];
        if (!stats) throw new Error(`Faltan stats para la gallina ${type?.name || c.typeId}`);
        return {
          ...c,
          name: type.name,
          img: type.img,
          hp: stats.hp,
          maxHp: stats.maxHp,
          atk: stats.atk,
          speed: stats.speed,
          skills: stats.skills,
          isDead: false
        };
      });

      // Init Enemy Team
      const wave = userData?.arenaWave || 1;
      const eTeam = getEnemiesForWave(wave).map(e => ({ ...e, isDead: false }));

      setPlayerTeam(pTeam);
      setEnemyTeam(eTeam);
      setBattleLog([{ msg: `¡Oleada ${wave} ha comenzado!`, type: 'info' }]);
      setTurn('player');
      setActiveChickenIndex(0);
      setView('combat');
    } catch (error) {
      console.error("Error starting battle:", error);
      Swal.fire('Error Técnico', 'Ocurrió un error al iniciar la batalla: ' + error.message, 'error');
    }
  };

  const logMessage = (msg, type = 'info') => {
    setBattleLog(prev => [...prev, { msg, type }]);
  };

  const executePlayerAction = (skill, targetIndex) => {
    if (turn !== 'player') return;
    
    const activeChicken = playerTeam[activeChickenIndex];
    if (activeChicken.isDead) {
      nextTurn();
      return;
    }

    let eTeam = [...enemyTeam];
    let pTeam = [...playerTeam];
    let actionLog = `${activeChicken.name} usó ${skill.name}.`;

    if (skill.id === 'skill_heal') {
      pTeam = pTeam.map(c => c.isDead ? c : { ...c, hp: Math.min(c.maxHp, c.hp + 30) });
      actionLog += ` Curó 30 HP al equipo.`;
    } else if (skill.id === 'skill_heal_self') {
      const pIdx = pTeam.findIndex(p => p.id === activeChicken.id);
      pTeam[pIdx].hp = Math.min(pTeam[pIdx].maxHp, pTeam[pIdx].hp + 30);
      actionLog += ` Recuperó 30 HP.`;
    } else if (skill.id === 'skill_aoe') {
      eTeam = eTeam.map(e => {
        if (e.isDead) return e;
        const newHp = Math.max(0, e.hp - skill.dmg);
        return { ...e, hp: newHp, isDead: newHp === 0 };
      });
      actionLog += ` Dañó a todos los enemigos por ${skill.dmg}.`;
    } else {
      // Basic Atk or Single Target
      if (!eTeam[targetIndex] || eTeam[targetIndex].isDead) return Swal.fire('Inválido', 'Elige un enemigo válido.', 'warning');
      const dmg = skill.dmg || activeChicken.atk;
      eTeam[targetIndex].hp = Math.max(0, eTeam[targetIndex].hp - dmg);
      if (eTeam[targetIndex].hp === 0) eTeam[targetIndex].isDead = true;
      actionLog += ` Hizo ${dmg} daño a ${eTeam[targetIndex].name}.`;
    }

    if (skill.isSpecial) setIsCinematic(true);

    if (skill.img) {
      setActiveProjectile({ 
        img: skill.img, 
        key: Date.now(), 
        targetIndex: targetIndex !== null ? targetIndex : 1,
        sourceIndex: activeChickenIndex,
        flip: skill.flip,
        isSpecial: skill.isSpecial
      });
    }

    setAttackingChickenId(activeChicken.id);
    setTimeout(() => {
      setAttackingChickenId(null);
      setActiveProjectile(null);
      setIsCinematic(false);
      
      if (skill.img && skill.id !== 'skill_heal_self') {
        const targets = skill.id === 'skill_aoe' ? eTeam.map((_, i) => i) : [targetIndex];
        setActiveHitEffect({
          img: skill.impactImg || skill.img,
          targetIndices: targets,
          isSpecial: skill.isSpecial,
          flip: skill.flip
        });
        setTimeout(() => setActiveHitEffect(null), 800);
      }

      logMessage(actionLog, 'player');
      setPlayerTeam(pTeam);
      setEnemyTeam(eTeam);

      const allEnemiesDead = eTeam.every(e => e.isDead);
      if (allEnemiesDead) {
        setTimeout(() => handleWin(), 1000);
        return;
      }

      nextTurn(pTeam, eTeam);
    }, 500);
  };

  const nextTurn = (pTeam = playerTeam, eTeam = enemyTeam) => {
    let nextIdx = activeChickenIndex + 1;
    while (nextIdx < pTeam.length && pTeam[nextIdx].isDead) {
      nextIdx++;
    }
    
    if (nextIdx < pTeam.length) {
      setActiveChickenIndex(nextIdx);
    } else {
      setTurn('enemy');
      setTimeout(() => enemyPhase(pTeam, eTeam), 1000);
    }
  };

  const enemyPhase = (pTeam, eTeam) => {
    let currentPTeam = [...pTeam];
    let turnLogs = [];

    eTeam.forEach(e => {
      if (e.isDead) return;
      const alivePlayers = currentPTeam.filter(p => !p.isDead);
      if (alivePlayers.length === 0) return;
      
      const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
      const targetIdx = currentPTeam.findIndex(p => p.id === target.id);
      
      currentPTeam[targetIdx].hp = Math.max(0, currentPTeam[targetIdx].hp - e.atk);
      if (currentPTeam[targetIdx].hp === 0) currentPTeam[targetIdx].isDead = true;
      
      turnLogs.push({ msg: `${e.name} atacó a ${target.name} por ${e.atk} de daño.`, type: 'enemy' });
    });

    setBattleLog(prev => [...prev, ...turnLogs]);
    setPlayerTeam(currentPTeam);

    const allPlayersDead = currentPTeam.every(p => p.isDead);
    if (allPlayersDead) {
      setTimeout(() => {
        Swal.fire('Derrota', 'Tu equipo fue vencido. ¡Inténtalo de nuevo mañana!', 'error');
        onBattleWin(false); // Call with false for lose
        setView('lobby');
      }, 1500);
    } else {
      setTurn('player');
      setActiveChickenIndex(0);
    }
  };

  const handleWin = async () => {
    const reward = await onBattleWin(true);
    Swal.fire('¡Victoria!', `Has superado la Oleada ${userData.arenaWave}. ¡Ganaste ${reward} Monedas Huevo!`, 'success');
    setView('lobby');
    setSelectedChickens([]);
  };

  if (view === 'combat') {
    return (
      <div className="arena-combat-container">
        <div className="arena-header glass-panel">
          <h3>⚔️ Arena de Batalla - Oleada {userData.arenaWave} ⚔️</h3>
          <p style={{ color: turn === 'player' ? '#4ade80' : '#ff4c4c', fontWeight: 'bold' }}>
            {turn === 'player' ? `Tu Turno: ${playerTeam[activeChickenIndex]?.name}` : 'Turno del Enemigo...'}
          </p>
        </div>

        <div className={`battlefield arena-bg-image ${activeHitEffect ? 'shake-animation' : ''}`}>
          {isCinematic && <div className="cinematic-overlay"></div>}
          {activeProjectile && (
            <img 
              key={activeProjectile.key} 
              src={activeProjectile.img} 
              alt="Poder" 
              className={`skill-projectile ${activeProjectile.isSpecial ? 'special-projectile' : ''}`}
              style={{
                '--target-y': activeProjectile.targetIndex === 0 ? '-100px' : activeProjectile.targetIndex === 2 ? '100px' : '0px',
                '--source-y': activeProjectile.sourceIndex === 0 ? '-100px' : activeProjectile.sourceIndex === 2 ? '100px' : '0px',
                '--flip-x': activeProjectile.flip ? -1 : 1
              }}
            />
          )}
          <div className="team player-team">
            {playerTeam.map((p, idx) => (
              <div key={p.id} className={`arena-fighter ${p.isDead ? 'dead' : ''} ${idx === activeChickenIndex && turn === 'player' ? 'active' : ''} ${attackingChickenId === p.id ? 'attack-lunge-player' : ''}`}>
                <div className="aurora-chicken-wrapper" style={{ transform: 'scale(1.5)', margin: '1rem' }}>
                  <img src={p.img} alt={p.name} className="floating-chicken" />
                </div>
                <div className="hp-bar-bg" style={{ width: '120px' }}><div className="hp-bar-fill" style={{ width: `${(p.hp / p.maxHp) * 100}%`, background: '#4ade80' }}></div></div>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', textShadow: '0 2px 4px #000' }}>{p.hp}/{p.maxHp} HP</span>
              </div>
            ))}
          </div>

          <div className="team enemy-team">
            {enemyTeam.map((e, idx) => (
              <div key={idx} className={`arena-fighter enemy ${e.isDead ? 'dead' : ''}`} onClick={() => {
                if (turn === 'player' && !e.isDead) {
                  const skillToUse = selectedSkill || playerTeam[activeChickenIndex].skills[0];
                  executePlayerAction(skillToUse, idx);
                  setSelectedSkill(null);
                }
              }}>
                <img src={e.img} alt={e.name} className="floating-enemy" style={{ filter: e.isBoss ? 'hue-rotate(90deg) scale(1.2)' : 'none', height: '100px', transform: 'scaleX(-1)' }} />
                <div className="hp-bar-bg" style={{ width: '120px' }}><div className="hp-bar-fill" style={{ width: `${(e.hp / e.maxHp) * 100}%`, background: '#ff4c4c' }}></div></div>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', textShadow: '0 2px 4px #000' }}>{e.hp}/{e.maxHp} HP</span>
                {turn === 'player' && !e.isDead && selectedSkill && <div className="target-indicator">🎯</div>}
                {activeHitEffect && activeHitEffect.targetIndices.includes(idx) && (
                  <img src={activeHitEffect.img} alt="Impacto" className={`hit-explosion ${activeHitEffect.isSpecial ? 'special-explosion' : ''}`} style={{ '--flip-x': activeHitEffect.flip ? -1 : 1 }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {turn === 'player' && !playerTeam[activeChickenIndex]?.isDead && (
          <div className="card-hand-container">
            <div className="card-hand">
              {playerTeam[activeChickenIndex].skills.map((skill, sIdx) => (
                <div key={sIdx} className={`skill-card-axie ${skill.isSpecial ? 'special-card' : 'basic-card'} ${selectedSkill?.id === skill.id ? 'active-skill-card' : ''}`} onClick={() => {
                  if (skill.id === 'skill_heal' || skill.id === 'skill_buff' || skill.id === 'skill_heal_self') {
                    executePlayerAction(skill, null);
                  } else {
                    setSelectedSkill(skill);
                    Swal.fire({
                      title: 'Selecciona Objetivo',
                      text: `Haz clic en un enemigo para usar ${skill.name}.`,
                      icon: 'info',
                      timer: 1500,
                      showConfirmButton: false,
                      position: 'top',
                      backdrop: false
                    });
                  }
                }}>
                  <div className="card-axie-img" style={{ backgroundImage: `url(${skill.img || '/img/egg_4.png'})` }}></div>
                  <div className="card-axie-info">
                    <h5>{skill.name}</h5>
                    <small>{skill.desc || `Daño: ${skill.dmg}`}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="battle-log glass-panel" style={{ zIndex: 300 }}>
          {battleLog.slice(-1).map((log, i) => (
            <p key={i} className={`log-${log.type}`}>{log.msg}</p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="arena-lobby glass-panel">
      <h2>⚔️ El Coliseo de Gallinas ⚔️</h2>
      <div className="arena-stats">
        <div className="stat-box">
          <Zap size={24} color="#fbbf24" />
          <span>Energía: ILIMITADA (Test)</span>
        </div>
        <div className="stat-box">
          <Shield size={24} color="#a855f7" />
          <span>Oleada Actual: {userData.arenaWave}</span>
        </div>
      </div>

      <div className="chicken-selection">
        <h3>Selecciona tu Equipo (Max 3)</h3>
        {specialChickens.length === 0 ? (
          <p style={{ color: '#ff4c4c' }}>No tienes gallinas especiales para pelear.</p>
        ) : (
          <div className="roster-grid">
            {specialChickens.map(c => {
              const type = chickenTypes.find(t => t.id === c.typeId);
              const isSelected = selectedChickens.find(sc => sc.id === c.id);
              const stats = ARENA_CHICKEN_STATS[c.typeId];
              return (
                <div key={c.id} className={`roster-card premium-card ${isSelected ? 'selected' : ''}`} onClick={() => handleSelectChicken(c)}>
                  <div className="aurora-chicken-wrapper card-aura" style={{ transform: 'scale(1.2)' }}>
                    <img src={type.img} alt={type.name} className="floating-chicken" />
                  </div>
                  <h4 className="premium-card-title">{type.name}</h4>
                  <div className="premium-stats">
                    <span>❤️ {stats.hp}</span>
                    <span>⚔️ {stats.atk}</span>
                    <span>⚡ {stats.speed}</span>
                  </div>
                  <div className="premium-skills-preview">
                     {stats.skills.map((s, i) => <img key={i} src={s.img || '/img/egg_4.png'} title={s.name} alt={s.name} className="skill-mini-icon" />)}
                  </div>
                  {isSelected && <div className="check-badge glow-badge">✓</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button className="btn-primary start-battle-btn" onClick={startBattle} disabled={selectedChickens.length === 0}>
        ⚔️ Entrar a la Arena (Modo Prueba - Sin Energía)
      </button>
    </div>
  );
}
