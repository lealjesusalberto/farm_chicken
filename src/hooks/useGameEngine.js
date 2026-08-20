import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, addDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';

const EGG_TIME = 24 * 60 * 60 * 1000; // 24 horas por huevo
// Remove global CYCLE_DURATION

export const CHICKEN_TYPES = [
  { id: '1', name: 'Blanca', price: 100, incomePerEgg: 5, img: '/img/chicken_1.png', depletedImg: '/img/chicken_1_1.png', eggImg: '/img/egg_1.png', eggTime: 4 * 60 * 60 * 1000, description: 'Gallina básica.', foodType: 'common', foodBagsRequired: 1 },
  { id: '2', name: 'Turquesa', price: 300, incomePerEgg: 7, img: '/img/chicken_2.png', depletedImg: '/img/chicken_2_2.png', eggImg: '/img/egg_2.png', eggTime: 6 * 60 * 60 * 1000, description: 'Un poco mejor.', foodType: 'common', foodBagsRequired: 1 },
  { id: '3', name: 'Amarilla', price: 700, incomePerEgg: 15, img: '/img/chicken_3.png', depletedImg: '/img/chicken_3_3.png', eggImg: '/img/egg_3.png', eggTime: 8 * 60 * 60 * 1000, description: 'Buena producción.', foodType: 'common', foodBagsRequired: 2 },
  { id: '4', name: 'Lila', price: 1500, incomePerEgg: 30, img: '/img/chicken_4.png', depletedImg: '/img/chicken_4_4.png', eggImg: '/img/egg_4.png', eggTime: 12 * 60 * 60 * 1000, description: 'Excelente productora.', foodType: 'common', foodBagsRequired: 3 },
  // Especiales
  { id: 's_chef', name: 'Chef', price: 2000, incomePerEgg: 20, img: '/img/specials/pollo_chef.png', depletedImg: '/img/specials/pollo_chef.png', eggImg: '/img/egg_4.png', eggTime: EGG_TIME, isSpecial: true, description: 'Cocina rápido. x1.5 de velocidad pasiva.', auraColor: '#ffffff', foodType: 'special', foodBagsRequired: 2 },
  { id: 's_superman', name: 'Superman', price: 2000, incomePerEgg: 20, img: '/img/specials/pollo_superman.png', depletedImg: '/img/specials/pollo_superman.png', eggImg: '/img/egg_4.png', eggTime: EGG_TIME, isSpecial: true, description: 'Inmune a los retrasos por lluvia.', auraColor: '#3b82f6', foodType: 'special', foodBagsRequired: 2 },
  { id: 's_medico', name: 'Médico', price: 2000, incomePerEgg: 20, img: '/img/specials/pollo_medico.png', depletedImg: '/img/specials/pollo_medico.png', eggImg: '/img/egg_4.png', eggTime: EGG_TIME, isSpecial: true, description: 'Inmune a los retrasos por nieve.', auraColor: '#ef4444', foodType: 'special', foodBagsRequired: 2 },
  { id: 's_mago', name: 'Mago', price: 2200, incomePerEgg: 22, img: '/img/specials/pollo_mago.png', depletedImg: '/img/specials/pollo_mago.png', eggImg: '/img/egg_4.png', eggTime: EGG_TIME, isSpecial: true, description: 'La tormenta eléctrica duplica su velocidad.', auraColor: '#a855f7', foodType: 'special', foodBagsRequired: 2 },
  { id: 's_robin', name: 'Robin Hood', price: 2000, incomePerEgg: 15, img: '/img/specials/pollo_robinhoood.png', depletedImg: '/img/specials/pollo_robinhoood.png', eggImg: '/img/egg_4.png', eggTime: EGG_TIME, isSpecial: true, description: 'Velocidad x2 siempre (Maíz infinito).', auraColor: '#22c55e', foodType: 'special', foodBagsRequired: 2 },
  { id: 's_pirata', name: 'Pirata', price: 2500, incomePerEgg: 25, img: '/img/specials/pollo_pirata.png', depletedImg: '/img/specials/pollo_pirata.png', eggImg: '/img/egg_4.png', eggTime: EGG_TIME, isSpecial: true, description: 'Pone tesoros. Sus huevos valen el doble.', auraColor: '#fcd535', foodType: 'special', foodBagsRequired: 2 },
  { id: 's_explorador', name: 'Explorador', price: 2000, incomePerEgg: 15, img: '/img/specials/pollo_explorador.png', depletedImg: '/img/specials/pollo_explorador.png', eggImg: '/img/egg_4.png', eggTime: EGG_TIME, isSpecial: true, description: 'Otorga x3 de Experiencia (XP).', auraColor: '#f97316', foodType: 'special', foodBagsRequired: 2 },
  { id: 's_granjero', name: 'Granjero', price: 2500, incomePerEgg: 25, img: '/img/specials/pollo_granjero.png', depletedImg: '/img/specials/pollo_granjero.png', eggImg: '/img/egg_4.png', eggTime: EGG_TIME, isSpecial: true, description: 'El superviviente. Inmune a TODOS los climas.', auraColor: '#8b5cf6', foodType: 'special', foodBagsRequired: 2 }
];



export function calculateEffectiveTime(chickenTypeId, lastEggTime, now, boostStart, boostEnd, weatherHistory, chickenRef = null) {
  let totalEffectiveTime = 0;
  const boostMultiplier = 10;
  const clonePower = chickenRef?.clonePower !== undefined ? chickenRef.clonePower : 100;
  
  if (!weatherHistory || weatherHistory.length === 0) {
    weatherHistory = [{ type: 'sunny', start: 0, end: null }];
  }

  const oldestHistoryStart = weatherHistory[0].start || 0;
  if (lastEggTime < oldestHistoryStart) {
    const unaccountedDuration = oldestHistoryStart - lastEggTime;
    let boostedDuration = 0;
    let normalDuration = unaccountedDuration;
    if (boostStart && boostEnd) {
        const bStart = Math.max(lastEggTime, boostStart);
        const bEnd = Math.min(oldestHistoryStart, boostEnd);
        if (bEnd > bStart) {
            boostedDuration = bEnd - bStart;
            normalDuration = unaccountedDuration - boostedDuration;
        }
    }
    
    const powerFactor = clonePower / 100;
    let passiveMultiplier = 1;
    if (chickenTypeId === 's_chef') {
      passiveMultiplier = 1 + (0.5 * powerFactor);
    }
    
    totalEffectiveTime += (normalDuration * passiveMultiplier) + (boostedDuration * boostMultiplier * passiveMultiplier);
  }

  for (const event of weatherHistory) {
    const eventStart = Math.max(lastEggTime, event.start || 0);
    const eventEnd = Math.min(now, event.end || now);
    
    if (eventEnd > eventStart) {
      const duration = eventEnd - eventStart;
      let weatherMultiplier = 1;
      const powerFactor = clonePower / 100;
      
      if (event.type === 'rain') {
        weatherMultiplier = (chickenTypeId === 's_superman' || chickenTypeId === 's_granjero') ? (0.5 + (0.5 * powerFactor)) : 0.5;
      } else if (event.type === 'snow') {
        weatherMultiplier = (chickenTypeId === 's_medico' || chickenTypeId === 's_granjero') ? (0.5 + (0.5 * powerFactor)) : 0.5;
      } else if (event.type === 'thunder') {
        weatherMultiplier = (chickenTypeId === 's_mago') ? (0.5 + (1.5 * powerFactor)) : ((chickenTypeId === 's_granjero') ? (0.5 + (0.5 * powerFactor)) : 0.5);
      } else if (event.type === 'rainbow' || event.type === 'stars') {
        weatherMultiplier = 2; 
      } else if (event.type === 'bugs') {
        weatherMultiplier = 1.2;
      } else if (event.type === 'butterflies') {
        weatherMultiplier = 1.3;
      } else if (event.type === 'aurora') {
        weatherMultiplier = 1.9;
      }

      let boostedDuration = 0;
      let normalDuration = duration;
      
      if (boostStart && boostEnd) {
        const boostOverlapStart = Math.max(eventStart, boostStart);
        const boostOverlapEnd = Math.min(eventEnd, boostEnd);
        if (boostOverlapEnd > boostOverlapStart) {
          boostedDuration = boostOverlapEnd - boostOverlapStart;
          normalDuration = duration - boostedDuration;
        }
      }
      
      let passiveMultiplier = (chickenTypeId === 's_chef') ? (1 + (0.5 * powerFactor)) : ((chickenTypeId === 's_robin') ? (1 + (1.0 * powerFactor)) : 1);
      
      totalEffectiveTime += (normalDuration * weatherMultiplier * passiveMultiplier) + (boostedDuration * weatherMultiplier * boostMultiplier * passiveMultiplier);
    }
  }
  
  return totalEffectiveTime * (clonePower / 100);
}

export function useGameEngine(user, weatherData = { type: 'sunny', history: [] }) {
  const [balance, setBalance] = useState(0);
  const [eggBalance, setEggBalance] = useState(0);
  const [userData, setUserData] = useState(null);
  
  // Ref para evitar stale closures en el game loop
  const weatherRef = useRef(weatherData);
  useEffect(() => {
    weatherRef.current = weatherData;
  }, [weatherData]);

  const [chickens, setChickens] = useState([]);
  const [pendingRecharges, setPendingRecharges] = useState([]);
  const [oracleRate, setOracleRate] = useState(100);

  useEffect(() => {
    if (!user) return;
    
    // Escuchar el Oráculo
    const oracleRef = doc(db, 'config', 'oracle');
    const unsubOracle = onSnapshot(oracleRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().rate) {
        setOracleRate(docSnap.data().rate);
      } else {
        // Inicializar Oráculo si no existe
        setDoc(oracleRef, { rate: 100 }, { merge: true });
        setOracleRate(100);
      }
    });

    const userRef = doc(db, 'users', user.uid);
    const unsubUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        setBalance(data.balance || 0);
        setEggBalance(data.eggBalance || 0);
      }
    });

    const chickensRef = collection(db, 'chickens');
    const q = query(chickensRef, where('userId', '==', user.uid));
    const unsubChickens = onSnapshot(q, (querySnapshot) => {
      const c = [];
      querySnapshot.forEach(doc => {
        c.push({ id: doc.id, ...doc.data() });
      });
      setChickens(c);
    });
    
    const rechargesRef = collection(db, 'recharges');
    const qr = query(rechargesRef, where('userId', '==', user.uid), where('status', '==', 'pending'));
    const unsubRecharges = onSnapshot(qr, (querySnapshot) => {
      const r = [];
      querySnapshot.forEach(doc => {
        r.push({ id: doc.id, ...doc.data() });
      });
      setPendingRecharges(r);
    });

    return () => {
      unsubOracle();
      unsubUser();
      unsubChickens();
      unsubRecharges();
    };
  }, [user]);

  const calculatePendingEggs = (chickenData, chickenObj = null) => {
    const typeInfo = CHICKEN_TYPES.find(t => t.id === chickenData.typeId);
    if (!typeInfo) return chickenData;
    
    const now = Date.now();
    let updatedData = { ...chickenData };
    
    // Inicializar lastFoxCheckTime si no existe
    if (!updatedData.lastFoxCheckTime) {
      updatedData.lastFoxCheckTime = updatedData.lastEggTime || now;
    }
    
    const timeSinceLastCheck = now - updatedData.lastFoxCheckTime;
    let needsDbUpdate = false;

    if (timeSinceLastCheck > 0) {
      if (updatedData.hasFox) {
        // La gallina tiene zorro. El tiempo se CONGELA localmente sin spam a la base de datos.
        updatedData.lastEggTime += timeSinceLastCheck;
        if (updatedData.boostStartTime) updatedData.boostStartTime += timeSinceLastCheck;
        if (updatedData.boostEndTime) updatedData.boostEndTime += timeSinceLastCheck;
        updatedData.lastFoxCheckTime = now;
        // NO HACEMOS needsDbUpdate = true aquí para evitar race conditions con el botón de espantar.
      } else {
        // No tiene zorro. Verificamos si fue atacada offline o en tiempo real.
        // Hacemos el check solo si han pasado al menos 2.5s
        if (timeSinceLastCheck >= 2500) {
          const intervals = Math.floor(timeSinceLastCheck / 2500);
          const probability = 1 - Math.pow(1 - 0.0001736, intervals); // Probabilidad promedio de 1 zorro cada 4 horas
          
          if (Math.random() < probability) {
            // ¡EL ZORRO ATACÓ!
            updatedData.hasFox = true;
            
            // ¿En qué punto de la desconexión atacó?
            const attackInterval = Math.floor(Math.random() * intervals);
            const timeBeforeAttack = attackInterval * 2500;
            const timeAfterAttack = timeSinceLastCheck - timeBeforeAttack;
            
            // Congelamos el tiempo que pasó DESPUÉS del ataque
            updatedData.lastEggTime += timeAfterAttack;
            if (updatedData.boostStartTime) updatedData.boostStartTime += timeAfterAttack;
            if (updatedData.boostEndTime) updatedData.boostEndTime += timeAfterAttack;
            needsDbUpdate = true; // Solo guardamos en DB cuando ATACA el zorro
          }
          updatedData.lastFoxCheckTime = now;
        }
      }
    }
    
    // Si el clima aún no carga, no podemos procesar el tiempo offline correctamente
    if (!weatherRef.current._loaded) {
      return { ...chickenData, _needsDbUpdate: false };
    }
    
    let effectiveTimePassed = calculateEffectiveTime(updatedData.typeId, updatedData.lastEggTime, now, updatedData.boostStartTime, updatedData.boostEndTime, weatherRef.current.history, chickenObj || updatedData);
    
    const EGG_TIME_5 = typeInfo.eggTime * 5;
    const GRACE_PERIOD = 120 * 60 * 1000;
    const CYCLE_DURATION = EGG_TIME_5 + GRACE_PERIOD;

    if (effectiveTimePassed >= CYCLE_DURATION) {
       updatedData.currentEggs = 0;
       updatedData.lastEggTime = now;
       if (!updatedData.hasFox) updatedData.lastFoxCheckTime = now;
       needsDbUpdate = true;
       effectiveTimePassed = 0;
    }
    
    const expectedEggs = Math.min(5, Math.floor(effectiveTimePassed / typeInfo.eggTime));
    
    if (expectedEggs > updatedData.currentEggs) {
      updatedData.currentEggs = expectedEggs;
      needsDbUpdate = true;
    }
    
    // Solo devolvemos needsDbUpdate si realmente hubo cambios importantes que guardar
    return { ...updatedData, _needsDbUpdate: needsDbUpdate };
  };

  useEffect(() => {
    if (!user) return;

    // 1. Escuchar saldo y datos del usuario en TIEMPO REAL
    const userRef = doc(db, 'users', user.uid);
    const unsubUser = onSnapshot(userRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        const parsedBalance = parseFloat(data.balance);
        setBalance(!isNaN(parsedBalance) ? parsedBalance : 0);
        const parsedEggBalance = parseFloat(data.eggBalance);
        setEggBalance(!isNaN(parsedEggBalance) ? parsedEggBalance : 0);
        if (!data.email) {
          await updateDoc(userRef, { email: user.email });
        }
      } else {
        // Doc doesn't exist (possibly offline cache miss). 
        // Do NOT overwrite it to avoid wiping user data.
        setBalance(0);
        setEggBalance(0);
      }
    });

    // 2. Escuchar gallinas
    const qChickens = query(collection(db, 'chickens'), where('userId', '==', user.uid));
    const unsubChickens = onSnapshot(qChickens, async (snap) => {
      const fetchedChickens = [];
      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        const updatedData = calculatePendingEggs(data, { ...data, boostType: data.boostType || 'common' });
        
        if (updatedData._needsDbUpdate) {
          const { _needsDbUpdate, id, ...cleanData } = updatedData;
          await updateDoc(docSnap.ref, cleanData);
        }
        
        const { _needsDbUpdate, ...finalData } = updatedData;
        fetchedChickens.push({ id: docSnap.id, ...finalData });
      }
      setChickens(fetchedChickens);
    });

    // 3. Escuchar recargas/retiros pendientes en TIEMPO REAL
    const qTx = query(collection(db, 'transactions'), where('userId', '==', user.uid), where('status', '==', 'pending'));
    const unsubTx = onSnapshot(qTx, (snap) => {
      setPendingRecharges(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubUser();
      unsubChickens();
      unsubTx();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    // Ciclo principal de juego: Actualiza la UI y verifica zorros constantemente
    const interval = setInterval(() => {
      setChickens(prev => {
        let changed = false;
        const newC = prev.map(c => {
          const updated = calculatePendingEggs(c, { ...c, boostType: c.boostType || 'common' });
          if (updated._needsDbUpdate) {
            changed = true;
            const { _needsDbUpdate, id, ...cleanData } = updated;
            updateDoc(doc(db, 'chickens', c.id), cleanData);
          }
          const { _needsDbUpdate, ...finalData } = updated;
          return finalData;
        });
        return changed ? newC : [...newC];
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [user, weatherData]);

  const buyChicken = async (typeId) => {
    const type = CHICKEN_TYPES.find(t => t.id === typeId);
    if (!type || eggBalance < type.price) return Swal.fire('Oops...', 'Monedas insuficientes para comprar esta gallina', 'error');
    
    const newEggBalance = eggBalance - type.price;
    setEggBalance(newEggBalance);
    
    // Guardar en Firestore
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { eggBalance: newEggBalance });
    
    const chickenRef = collection(db, 'chickens');
    const now = Date.now();
    await addDoc(chickenRef, {
      userId: user.uid,
      typeId: type.id,
      purchaseTime: now,
      lastEggTime: now,
      lastFoxCheckTime: now,
      currentEggs: 0,
      boostStartTime: null,
      boostEndTime: null,
      isHalfSpecial: false
    });
  };

  const buyMysteryEgg = async () => {
    if (eggBalance < 200) return Swal.fire('Oops...', 'Monedas insuficientes para comprar el huevo misterioso (200 Huevos)', 'error');
    
    const newEggBalance = eggBalance - 200;
    const newEggsCount = (userData?.mysteryEggs || 0) + 1;
    setEggBalance(newEggBalance);
    
    // Guardar en Firestore
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { eggBalance: newEggBalance, mysteryEggs: newEggsCount });
    
    Swal.fire('¡Comprado!', 'El huevo se guardó en tu granja (Cestita). Ve allá para abrirlo.', 'success');
  };

  const buyFood = async (foodType) => {
    if (!userData) return;
    
    const price = foodType === 'special' ? 25 : 5;
    const name = foodType === 'special' ? 'Saco Especial' : 'Saco de Maíz';
    const field = foodType === 'special' ? 'specialCornCount' : 'cornCount';
    
    if (eggBalance < price) return Swal.fire('Oops...', `Monedas insuficientes para comprar ${name} (${price} Huevos)`, 'error');
    
    const newEggBalance = eggBalance - price;
    const newCount = (userData[field] || 0) + 1;
    
    setEggBalance(newEggBalance);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { eggBalance: newEggBalance, [field]: newCount });
      Swal.fire({
        icon: 'success',
        title: `¡${name} Comprado!`,
        text: 'Úsalo para acelerar la producción.',
        timer: 1500,
        showConfirmButton: false,
        background: '#1e293b',
        color: '#fff'
      });
    } catch (error) {
      console.error("Error buying food:", error);
    }
  };

  const feedChicken = async (chickenId) => {
    const chicken = chickens.find(c => c.id === chickenId);
    if (!chicken) return;
    
    const typeInfo = CHICKEN_TYPES.find(t => t.id === chicken.typeId);
    const requiredBags = typeInfo?.foodBagsRequired || 1;
    const foodType = typeInfo?.foodType || 'common';
    const field = foodType === 'special' ? 'specialCornCount' : 'cornCount';
    
    const currentCorn = userData?.[field] || 0;

    if (currentCorn < requiredBags) {
        return Swal.fire('Error', `Necesitas ${requiredBags} Saco(s) ${foodType === 'special' ? 'Especiales' : 'Comunes'} para alimentar a esta gallina.`, 'error');
    }
    
    const newCornCount = currentCorn - requiredBags;
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { [field]: newCornCount });

    // Configurar boost (ambos duran 24h y multiplican la velocidad x10 en calculateEffectiveTime)
    const boostDurationHours = 24;
    const boostMultiplier = 10;
    
    const boostStartTime = Date.now();
    const boostEndTime = boostStartTime + (boostDurationHours * 60 * 60 * 1000);
    const chickenRef = doc(db, 'chickens', chickenId);
    await updateDoc(chickenRef, { boostStartTime, boostEndTime, boostType: foodType });
    
    const actionText = `¡Su producción ha sido multiplicada x10 por ${boostDurationHours} horas!`;
    Swal.fire('¡Gallina Alimentada!', `Has gastado ${requiredBags} Saco(s). ${actionText}`, 'success');
  };

  const openStarterEgg = async () => {
    const currentStarterEggs = userData?.freeStarterEgg || 0;
    if (currentStarterEggs <= 0) return { success: false, error: 'No tienes huevos de bienvenida.' };

    try {
      const newEggsCount = currentStarterEggs - 1;
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { freeStarterEgg: newEggsCount });

      const starterIds = ['1', '2', '3', '4'];
      const wonId = starterIds[Math.floor(Math.random() * starterIds.length)];
      const wonType = CHICKEN_TYPES.find(t => t.id === wonId);

      const now = Date.now();
      const newChicken = {
        userId: user.uid,
        typeId: wonId,
        lastEggTime: now,
        lastFoxCheckTime: now,
        currentEggs: 0,
        isStarter: true,
        clonePower: 60
      };
      await addDoc(collection(db, 'chickens'), newChicken);
      
      return { success: true, wonType, clonePower: 60 };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const openMysteryEgg = async () => {
    const currentEggs = userData?.mysteryEggs || 0;
    if (currentEggs <= 0) return;

    // 1. Restar el huevo del inventario
    const newEggsCount = currentEggs - 1;
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { mysteryEggs: newEggsCount });

    // 2. RNG: 94% chance for ID 1, 5% for ID 2, 3, or 4. And 1% for a Special Chicken!
    const rand = Math.random();
    let wonId = '1';
    
    if (rand > 0.99) {
      // 1% chance for a Special Chicken!
      const specialIds = ['s_chef', 's_superman', 's_medico', 's_mago', 's_robin', 's_pirata', 's_explorador', 's_granjero'];
      wonId = specialIds[Math.floor(Math.random() * specialIds.length)];
    } else if (rand > 0.94) {
      // 5% chance for a rare normal chicken
      const rareIds = ['2', '3', '4'];
      wonId = rareIds[Math.floor(Math.random() * rareIds.length)];
    }
    
    const now = Date.now();
    const newChicken = {
      userId: user.uid,
      typeId: wonId,
      lastEggTime: now,
      lastFoxCheckTime: now,
      currentEggs: 0
    };
    
    await addDoc(collection(db, 'chickens'), newChicken);
    
    const wonType = CHICKEN_TYPES.find(t => t.id === wonId);
    
    // Mostrar animación al usuario de lo que ganó
    Swal.fire({
      title: '¡Huevo Abierto!',
      text: `¡Felicidades! Has obtenido una Gallina ${wonType.name}`,
      imageUrl: wonType.img,
      imageWidth: 150,
      imageHeight: 150,
      imageAlt: 'Gallina ganada',
      confirmButtonText: '¡Genial!'
    });
  };

  const scareFox = async (chickenId) => {
    const chicken = chickens.find(c => c.id === chickenId);
    if (!chicken) return;

    const cost = 10;
    if (eggBalance < cost) return Swal.fire('Oops...', `Necesitas ${cost} Monedas Huevo para comprar un Perro Espantazorros.`, 'error');
    const newEggBalance = eggBalance - cost;
    setEggBalance(newEggBalance);
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { eggBalance: newEggBalance });
    
    // Calcular el estado más actualizado localmente antes de guardar para evitar perder el congelamiento
    const updatedChicken = calculatePendingEggs(chicken, { ...chicken, boostType: chicken.boostType || 'common' });
    
    // Al espantar, enviamos a la DB el lastEggTime LOCAL que fue empujado hacia adelante durante la congelación
    const chickenRef = doc(db, 'chickens', chickenId);
    await updateDoc(chickenRef, { 
      hasFox: false, 
      lastFoxCheckTime: Date.now(),
      lastEggTime: updatedChicken.lastEggTime,
      boostStartTime: updatedChicken.boostStartTime || null,
      boostEndTime: updatedChicken.boostEndTime || null
    });
    
    Swal.fire('¡Zorro Ahuyentado!', 'Has usado un Perro Espantazorros. La gallina retoma su producción donde la había dejado.', 'success');
  };

  const sellChicken = async (chickenId) => {
    const chicken = chickens.find(c => c.id === chickenId);
    if (!chicken) return;
    
    const type = CHICKEN_TYPES.find(t => t.id === chicken.typeId);
    const sellPrice = type.price / 2; // Devuelve la mitad de lo que costó en Huevos
    
    const result = await Swal.fire({
      title: '¿Vender gallina?',
      text: `Obtendrás ${sellPrice} Huevos por vender esta gallina ${type.name}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, vender',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ff4c4c'
    });

    if (result.isConfirmed) {
      const newEggBalance = eggBalance + sellPrice;
      setEggBalance(newEggBalance);
      
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { eggBalance: newEggBalance });
      
      const chickenRef = doc(db, 'chickens', chickenId);
      await deleteDoc(chickenRef);
      
      Swal.fire('¡Vendida!', `Has vendido tu gallina y recibido ${sellPrice} Huevos.`, 'success');
    }
  };

  const collectEggs = async (chickenId) => {
    const chicken = chickens.find(c => c.id === chickenId);
    if (!chicken || chicken.currentEggs === 0) return;

    const typeInfo = CHICKEN_TYPES.find(t => t.id === chicken.typeId);
    if (!typeInfo) return;
    
    // Sonido de recolección
    const audio = new Audio('/img/sound/collect-egg.mp3');
    audio.play().catch(e => console.log('Audio error', e));

    const earnedEggsCount = chicken.currentEggs;
    const earnedEggCoins = earnedEggsCount * typeInfo.incomePerEgg;
    
    let xpMultiplier = 1;
    if (chicken.typeId === 's_explorador') {
      const powerFactor = chicken.clonePower !== undefined ? chicken.clonePower / 100 : 1;
      xpMultiplier = 1 + (2 * powerFactor);
    }
    const xpEarned = earnedEggsCount * 10 * xpMultiplier;
    
    const newXp = (userData?.xp || 0) + xpEarned;
    const newEggBalance = eggBalance + earnedEggCoins;
    
    // Track daily income (now in EggCoins!)
    const today = new Date().toISOString().split('T')[0];
    const newDailyIncomeObj = { ...(userData?.dailyIncome || {}) };
    newDailyIncomeObj[today] = (newDailyIncomeObj[today] || 0) + earnedEggCoins;
    
    setEggBalance(newEggBalance);
    
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { xp: newXp, eggBalance: newEggBalance, dailyIncome: newDailyIncomeObj });
    
    const chickenRef = doc(db, 'chickens', chickenId);
    const now = Date.now();
    await updateDoc(chickenRef, { currentEggs: 0, lastEggTime: now, lastFoxCheckTime: now });
  };

  const exchangeUsdtToEggs = async (usdtAmount) => {
    if (balance < usdtAmount) return Swal.fire('Oops...', 'Saldo USDT insuficiente para este intercambio.', 'error');
    
    const eggsToReceive = usdtAmount * oracleRate;
    
    const newBalance = balance - usdtAmount;
    const newEggBalance = eggBalance + eggsToReceive;
    
    setBalance(newBalance);
    setEggBalance(newEggBalance);
    
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { balance: newBalance, eggBalance: newEggBalance });
    
    Swal.fire('¡Intercambio Exitoso!', `Has comprado ${eggsToReceive} Huevos por ${usdtAmount} CKF.`, 'success');
  };

  const exchangeEggsToUsdt = async (eggAmount) => {
    if (eggBalance < eggAmount) return Swal.fire('Oops...', 'No tienes suficientes Huevos para este intercambio.', 'error');
    
    const usdtToReceive = eggAmount / oracleRate;
    
    const newEggBalance = eggBalance - eggAmount;
    const newBalance = balance + usdtToReceive;
    
    setEggBalance(newEggBalance);
    setBalance(newBalance);
    
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { balance: newBalance, eggBalance: newEggBalance });
    
    Swal.fire('¡Intercambio Exitoso!', `Has vendido ${eggAmount} Huevos y recibido ${usdtToReceive.toFixed(2)} CKF.`, 'success');
  };

  const sellEggs = async () => {}; // Obsoleto

  const incubateEggs = async () => {
    const cost = 1000;
    
    if (eggBalance < cost) {
      throw new Error(`Necesitas ${cost} Monedas Huevo para usar la incubadora.`);
    }
    
    // Descontar huevos
    const newEggBalance = eggBalance - cost;
    setEggBalance(newEggBalance);
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { eggBalance: newEggBalance });
    
    // 2% Especial Original, 98% Especial Clon
    const isHalfSpecial = Math.random() > 0.02;
    
    // Si es clon, asignar un poder aleatorio: 20%, 30%, 40% o 50%
    const powers = [20, 30, 40, 50];
    const clonePower = isHalfSpecial ? powers[Math.floor(Math.random() * powers.length)] : 100;
    
    const specialIds = ['s_chef', 's_superman', 's_medico', 's_mago', 's_robin', 's_pirata', 's_explorador', 's_granjero'];
    const wonId = specialIds[Math.floor(Math.random() * specialIds.length)];
    const now = Date.now();
    
    const newChicken = {
      userId: user.uid,
      typeId: wonId,
      lastEggTime: now,
      lastFoxCheckTime: now,
      currentEggs: 0,
      isHalfSpecial: isHalfSpecial,
      clonePower: clonePower
    };
    
    await addDoc(collection(db, 'chickens'), newChicken);
    
    const wonType = CHICKEN_TYPES.find(t => t.id === wonId);
    
    return {
      wonType,
      isHalfSpecial,
      clonePower
    };
  };



  const rechargeBalance = async (amountUsd, reference, amountBs) => {
    try {
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        email: user.email,
        type: 'deposit',
        amount: amountUsd,
        amountBs: amountBs,
        reference: reference,
        status: 'pending',
        createdAt: Date.now()
      });
      Swal.fire('Solicitud Enviada', `Se ha enviado una solicitud de recarga por ${amountBs} Bs (~$${amountUsd.toFixed(2)}). Espera la aprobación del administrador.`, 'success');
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'Error al enviar la solicitud', 'error');
    }
  };

  const requestWithdrawal = async (amountUsd, binanceId) => {
    if (amountUsd < 20) {
      return Swal.fire('Error', 'El monto mínimo de retiro es de 20 CKF', 'error');
    }
    if (amountUsd > balance) {
      return Swal.fire('Error', 'No tienes saldo suficiente para este retiro', 'error');
    }
    
    try {
      // 1. Descontar el saldo inmediatamente
      const newBalance = balance - amountUsd;
      setBalance(newBalance);
      
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { balance: newBalance });
      
      // 2. Registrar la solicitud
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        email: user.email,
        type: 'withdrawal',
        amount: amountUsd,
        receiveAmount: amountUsd * 0.9,
        fee: amountUsd * 0.1,
        binanceId: binanceId,
        status: 'pending',
        createdAt: Date.now()
      });
      
      Swal.fire('Retiro Solicitado', `Has solicitado un retiro de ${amountUsd.toFixed(2)} CKF hacia la cuenta ${binanceId}.\nRecibirás ${(amountUsd * 0.9).toFixed(2)} USDT en Binance luego de la comisión del 10%.`, 'success');
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'Hubo un problema procesando el retiro', 'error');
    }
  };

  const calculateMaxDailyIncome = () => {
    return chickens.reduce((acc, chicken) => {
      const type = CHICKEN_TYPES.find(c => c.id === chicken.typeId);
      if (!type) return acc;
      
      let passiveMultiplier = 1;
      const powerFactor = chicken.clonePower !== undefined ? chicken.clonePower / 100 : (chicken.isHalfSpecial ? 0.5 : 1);
      
      if (chicken.typeId === 's_chef') {
        passiveMultiplier = 1 + (0.5 * powerFactor);
      } else if (chicken.typeId === 's_robin') {
        passiveMultiplier = 1 + (1.0 * powerFactor);
      }

      const eggTimeHours = type.eggTime / (1000 * 60 * 60);
      const cyclesPerDay = (24 / eggTimeHours) * passiveMultiplier;
      
      const clonePower = chicken.clonePower !== undefined ? chicken.clonePower : 100;
      return acc + (cyclesPerDay * type.incomePerEgg * (clonePower / 100));
    }, 0);
  };

  return { balance, eggBalance, userData, chickens, oracleRate, buyChicken, buyMysteryEgg, buyFood, feedChicken, scareFox, openMysteryEgg, openStarterEgg, sellChicken, collectEggs, sellEggs, incubateEggs, exchangeUsdtToEggs, exchangeEggsToUsdt, rechargeBalance, requestWithdrawal, incomePerDay: calculateMaxDailyIncome(), pendingRecharges };
}
