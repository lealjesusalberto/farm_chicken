// src/utils/arenaEngine.js

export const ARENA_CHICKEN_STATS = {
  's_chef': { hp: 120, maxHp: 120, atk: 25, speed: 120, skills: [
    { id: 'atk_basic', name: 'Sartenazo', dmg: 25, img: '/img/skills/c_1.png' }, 
    { id: 'skill_haste', name: 'Frenesí', desc: 'Ataca dos veces', isSpecial: true, img: '/img/skills/c_2.png' },
    { id: 'skill_aoe', name: 'Sopa Picante', dmg: 20, desc: 'Daño a todos', isSpecial: true, img: '/img/skills/c_3.png', impactImg: '/img/skills/impact_chef.png' }
  ] },
  's_superman': { hp: 250, maxHp: 250, atk: 15, speed: 80, skills: [
    { id: 'atk_basic', name: 'Golpe Heroico', dmg: 15, img: '/img/skills/su_1.png' }, 
    { id: 'atk_heavy', name: 'Visión Láser', dmg: 35, desc: 'Quemadura intensa a un objetivo', isSpecial: true, img: '/img/skills/su_2.png', impactImg: '/img/skills/impact_superman.png' },
    { id: 'skill_taunt', name: 'Escudo de Acero', desc: 'Reduce daño recibido 50%', isSpecial: true, img: '/img/skills/su_3.png' }
  ] },
  's_medico': { hp: 150, maxHp: 150, atk: 10, speed: 90, skills: [
    { id: 'atk_basic', name: 'Jeringazo', dmg: 10, img: '/img/skills/me_1.png' }, 
    { id: 'skill_aoe', name: 'Gas Tóxico', dmg: 15, desc: 'Daño a todos', isSpecial: true, img: '/img/skills/me_2.png', impactImg: '/img/skills/impact_medico.png' },
    { id: 'skill_heal', name: 'Mega Botiquín', desc: 'Cura 30 HP al equipo', isSpecial: true, img: '/img/skills/me_3.png' }
  ] },
  's_mago': { hp: 100, maxHp: 100, atk: 20, speed: 100, skills: [
    { id: 'atk_basic', name: 'Rayo', dmg: 20, img: '/img/skills/m_1.png' }, 
    { id: 'skill_aoe', name: 'Meteoros', dmg: 15, desc: 'Daño a todos', isSpecial: true, img: '/img/skills/m_2.png', impactImg: '/img/skills/impact_mago.png' },
    { id: 'skill_heal_self', name: 'Curación Arcana', desc: 'Recupera 30 HP', isSpecial: true, img: '/img/skills/m_3.png' }
  ] },
  's_robin': { hp: 140, maxHp: 140, atk: 20, speed: 110, skills: [
    { id: 'atk_basic', name: 'Flecha Rápida', dmg: 20, img: '/img/skills/r_1.png' }, 
    { id: 'skill_aoe', name: 'Lluvia de Flechas', dmg: 20, desc: 'Daño a todos', isSpecial: true, img: '/img/skills/r_2.png', impactImg: '/img/skills/impact_robin.png' },
    { id: 'atk_heavy', name: 'Tiro Certero', dmg: 40, desc: 'Daño crítico a un objetivo', isSpecial: true, img: '/img/skills/r_3.png' }
  ] },
  's_pirata': { hp: 160, maxHp: 160, atk: 22, speed: 95, skills: [
    { id: 'atk_basic', name: 'Espadazo', dmg: 22, img: '/img/skills/p_1.png' }, 
    { id: 'skill_steal', name: 'Robo', dmg: 15, desc: 'Roba oro al golpear', isSpecial: true, img: '/img/skills/p_2.png' },
    { id: 'atk_heavy', name: 'Cañonazo', dmg: 45, desc: 'Gran daño a un objetivo', isSpecial: true, img: '/img/skills/p_3.png', flip: true }
  ] },
  's_explorador': { hp: 130, maxHp: 130, atk: 18, speed: 115, skills: [
    { id: 'atk_basic', name: 'Latigazo', dmg: 18, img: '/img/skills/e_1.png' }, 
    { id: 'atk_heavy', name: 'Trampa de Oso', dmg: 35, desc: 'Fuerte daño a un objetivo', isSpecial: true, img: '/img/skills/e_2.png', impactImg: '/img/skills/impact_explorador.png' },
    { id: 'skill_evade', name: 'Espejismo', desc: '100% Evasión el próximo turno', isSpecial: true, img: '/img/skills/e_3.png' }
  ] },
  's_granjero': { hp: 180, maxHp: 180, atk: 15, speed: 100, skills: [
    { id: 'atk_basic', name: 'Trinche', dmg: 15, img: '/img/skills/g_1.png' }, 
    { id: 'skill_buff', name: 'Cosecha', desc: '+10 Daño al equipo', isSpecial: true, img: '/img/skills/g_2.png' },
    { id: 'atk_heavy', name: 'Estampida', dmg: 35, desc: 'Daño masivo a un objetivo', isSpecial: true, img: '/img/skills/g_3.png', flip: true }
  ] },
};

export const ARENA_ENEMIES = {
  1: [{ id: 'e1', name: 'Zorro Desnutrido', hp: 80, maxHp: 80, atk: 10, speed: 90, img: '/img/zorro.png' }],
  2: [
    { id: 'e1', name: 'Zorro Básico', hp: 100, maxHp: 100, atk: 15, speed: 95, img: '/img/zorro.png' },
    { id: 'e2', name: 'Zorro Básico', hp: 100, maxHp: 100, atk: 15, speed: 95, img: '/img/zorro.png' }
  ],
  3: [
    { id: 'e1', name: 'Lobo Solitario', hp: 200, maxHp: 200, atk: 25, speed: 85, img: '/img/zorro.png', isBoss: true }
  ],
  4: [
    { id: 'e1', name: 'Lobo Hambriento', hp: 150, maxHp: 150, atk: 20, speed: 100, img: '/img/zorro.png' },
    { id: 'e2', name: 'Zorro Rápido', hp: 80, maxHp: 80, atk: 12, speed: 130, img: '/img/zorro.png' },
    { id: 'e3', name: 'Zorro Rápido', hp: 80, maxHp: 80, atk: 12, speed: 130, img: '/img/zorro.png' }
  ],
  5: [
    { id: 'e1', name: 'REY ZORRO', hp: 500, maxHp: 500, atk: 35, speed: 110, img: '/img/zorro.png', isBoss: true }
  ]
};

export const getEnemiesForWave = (wave) => {
  if (ARENA_ENEMIES[wave]) return JSON.parse(JSON.stringify(ARENA_ENEMIES[wave]));
  
  const baseWave = (wave % 5) === 0 ? 5 : (wave % 5);
  const scale = 1 + (Math.floor(wave / 5) * 0.5);
  
  const enemies = JSON.parse(JSON.stringify(ARENA_ENEMIES[baseWave]));
  enemies.forEach(e => {
    e.hp = Math.floor(e.hp * scale);
    e.maxHp = e.hp;
    e.atk = Math.floor(e.atk * scale);
  });
  
  return enemies;
};
