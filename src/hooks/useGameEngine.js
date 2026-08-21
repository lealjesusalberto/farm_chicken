import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, addDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';
import { useGameConfig } from '../contexts/GameConfigContext';

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
  const { chickenTypes, foxIntervalHours } = useGameConfig();
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

  const logActivity = async (action, details) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'activityLogs'), {
        userId: user.uid,
        email: user.email,
        action,
        details,
        createdAt: Date.now()
      });
    } catch (e) {
      console.error('Error logging activity:', e);
    }
  };

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
    const typeInfo = chickenTypes.find(t => t.id === chickenData.typeId);
    if (!typeInfo) return chickenData;
    
    const now = Date.now();
    let updatedData = { ...chickenData };
    
    // Inicializar lastFoxCheckTime si no existe
    if (!updatedData.lastFoxCheckTime) {
      updatedData.lastFoxCheckTime = updatedData.lastEggTime || now;
    }
    if (!updatedData.lastFoxAttackTime) {
      updatedData.lastFoxAttackTime = updatedData.lastEggTime || now;
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
          const intervalMs = (foxIntervalHours || 4) * 60 * 60 * 1000;
          
          if (now - updatedData.lastFoxAttackTime >= intervalMs) {
            // ¡EL ZORRO ATACÓ!
            updatedData.hasFox = true;
            
            // ¿Cuánto tiempo pasó desde que el zorro apareció exactamente?
            const timeAfterAttack = now - (updatedData.lastFoxAttackTime + intervalMs);
            
            // Congelamos el tiempo que pasó DESPUÉS del ataque
            updatedData.lastEggTime += timeAfterAttack;
            if (updatedData.boostStartTime) updatedData.boostStartTime += timeAfterAttack;
            if (updatedData.boostEndTime) updatedData.boostEndTime += timeAfterAttack;
            needsDbUpdate = true; // Solo guardamos en DB cuando ATACA el zorro
          } else if (timeSinceLastCheck >= 300000) {
            // Si la DB está desactualizada por más de 5 minutos, forzamos guardado.
            needsDbUpdate = true;
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
       if (!updatedData.hasFox) {
         updatedData.lastFoxCheckTime = now;
         updatedData.lastFoxAttackTime = now;
       }
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
        
        const updates = {};
        if (!data.email) updates.email = user.email;
        
        const today = new Date().toISOString().split('T')[0];
        if (data.lastEnergyReset !== today || data.arenaEnergy === undefined) {
          updates.arenaEnergy = 5;
          updates.lastEnergyReset = today;
        }
        
        if (data.arenaWave === undefined) {
          updates.arenaWave = 1;
        }
        
        if (Object.keys(updates).length > 0) {
          await updateDoc(userRef, updates);
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
    const type = chickenTypes.find(t => t.id === typeId);
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
      boostEndTime: null,
      isHalfSpecial: false
    });
    
    await logActivity('Compró Gallina', `Compró gallina ${type.name} por ${type.price} Huevos`);
  };

  const buyMysteryEgg = async () => {
    if (eggBalance < 200) return Swal.fire('Oops...', 'Monedas insuficientes para comprar el huevo misterioso (200 Huevos)', 'error');
    
    const newEggBalance = eggBalance - 200;
    const newEggsCount = (userData?.mysteryEggs || 0) + 1;
    setEggBalance(newEggBalance);
    
    // Guardar en Firestore
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { eggBalance: newEggBalance, mysteryEggs: newEggsCount });
    
    await logActivity('Compró Huevo Misterioso', `Gastó 200 Huevos en la tienda de consumibles`);
    
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
      
      await logActivity('Compró Consumible', `Compró ${name} por ${price} Huevos`);
      
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
    
    const typeInfo = chickenTypes.find(t => t.id === chicken.typeId);
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

  const openVolcanoEgg = async () => {
    if (!userData || !userData.volcanoEggs || userData.volcanoEggs <= 0) {
      Swal.fire('Sin Huevos de Volcán', 'No tienes huevos volcánicos.', 'error');
      return;
    }
    
    // Reproducir sonido si existe (opcional)
    const audio = new Audio('/img/sound/event-sound.ogg');
    audio.play().catch(e => console.log('Audio error', e));

    Swal.fire({
      title: 'Incubando Huevo Volcánico...',
      html: `
        <div style="margin: 20px 0; animation: pulse 1s infinite alternate;">
          <img src="/img/egg_white.png" style="width: 150px; height: 150px; object-fit: contain; filter: drop-shadow(0 0 20px red) drop-shadow(0 0 40px orange);" />
        </div>
        <p style="color: #f97316; font-weight: bold;">El calor es abrasador...</p>
      `,
      showConfirmButton: false,
      allowOutsideClick: false,
      background: '#1e1e1e',
      color: '#fff',
      timer: 3500,
      didOpen: () => {
        Swal.showLoading();
      }
    }).then(async () => {
      const newEggsCount = userData.volcanoEggs - 1;
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { volcanoEggs: newEggsCount });

      // Toca una gallina especial
      const specialChickens = chickenTypes.filter(t => t.isSpecial);
      const selectedType = specialChickens[Math.floor(Math.random() * specialChickens.length)];
      
      await addDoc(collection(db, 'chickens'), {
        userId: user.uid,
        typeId: selectedType.id,
        lastEggTime: Date.now(),
        hasFox: false,
        lastFoxCheckTime: Date.now(),
        lastFoxAttackTime: Date.now(),
        clonePower: 20, // Solo produce al 20%
        isVolcanic: true, // Marca de nerfeo de venta
      });
      
      await logActivity('open_volcano_egg', `Abrió un Huevo de Volcán y obtuvo un clon volcánico de ${selectedType.name}`);
      Swal.fire({
        title: '¡Gallina Volcánica!',
        text: `¡Épico! Has obtenido un clon volcánico de ${selectedType.name} (Poder al 20%).`,
        imageUrl: selectedType.img,
        imageWidth: 150,
        imageHeight: 150,
        imageAlt: 'Gallina Especial',
        confirmButtonText: '¡Asombroso!',
        confirmButtonColor: '#dc2626',
        background: '#1e1e1e',
        color: '#fff'
      });
    });
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
      const wonType = chickenTypes.find(t => t.id === wonId);

      const now = Date.now();
      const newChicken = {
        userId: user.uid,
        typeId: wonId,
        lastEggTime: now,
        lastFoxCheckTime: now,
        lastFoxAttackTime: now,
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
      lastFoxAttackTime: now,
      currentEggs: 0
    };
    
    await addDoc(collection(db, 'chickens'), newChicken);
    
    const wonType = chickenTypes.find(t => t.id === wonId);
    
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
      lastFoxAttackTime: Date.now(),
      lastEggTime: updatedChicken.lastEggTime,
      boostStartTime: updatedChicken.boostStartTime || null,
      boostEndTime: updatedChicken.boostEndTime || null
    });
    
    Swal.fire('¡Zorro Ahuyentado!', 'Has usado un Perro Espantazorros. La gallina retoma su producción donde la había dejado.', 'success');
  };

  const sellChicken = async (chickenId) => {
    const chicken = chickens.find(c => c.id === chickenId);
    if (!chicken) return;
    
    const type = chickenTypes.find(t => t.id === chicken.typeId);
    let sellPrice = type.price / 2; // Devuelve la mitad de lo que costó en Huevos
    
    // Si es gallina del volcán, se vende solo por 10%
    if (chicken.isVolcanic) {
      sellPrice = Math.floor(type.price * 0.1);
    }
    
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

    const typeInfo = chickenTypes.find(t => t.id === chicken.typeId);
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
    
    const updatePayload = { xp: newXp, eggBalance: newEggBalance, dailyIncome: newDailyIncomeObj };
    
    // Volcano Egg Logic
    const currentEventStart = weatherData?.start || (weatherData?.history && weatherData.history.length > 0 ? weatherData.history[weatherData.history.length - 1].start : null);
    
    let droppedVolcano = false;
    if (weatherData?.type === 'volcano' && currentEventStart && (chicken.typeId === '1' || chicken.typeId === 1)) {
      if (userData?.lastVolcanoEventId !== currentEventStart) {
        updatePayload.volcanoEggs = (userData?.volcanoEggs || 0) + 1;
        updatePayload.lastVolcanoEventId = currentEventStart;
        droppedVolcano = true;
      } else {
        Swal.fire({
          title: 'Ya reclamaste',
          text: 'Ya obtuviste tu único Huevo Volcánico en esta erupción. ¡Espera al próximo evento de Volcán!',
          icon: 'info',
          confirmButtonText: 'Entendido'
        });
      }
    }
    
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, updatePayload);
    
    if (droppedVolcano) {
      await logActivity('Evento Volcán', `¡Encontró 1 Huevo Volcánico al recolectar de la Gallina Blanca!`);
      Swal.fire({
        title: '¡Huevo Volcánico Encontrado!',
        text: '¡La Gallina Blanca ha puesto un misterioso huevo envuelto en llamas durante la erupción!',
        iconHtml: `<span style="font-size: 50px;">🌋</span>`,
        showCancelButton: true,
        confirmButtonText: '¡Incubar Ahora!',
        cancelButtonText: 'Guardar',
        confirmButtonColor: '#dc2626'
      }).then((result) => {
        if (result.isConfirmed) {
          // Pequeno timeout para asegurar que el estado de react se actualice con el nuevo huevo
          setTimeout(() => {
            openVolcanoEgg();
          }, 500);
        }
      });
    }
    
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
    
    await logActivity('Intercambio Oráculo', `Cambió ${usdtAmount} USDT por ${eggsToReceive} Huevos`);
    
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
    
    await logActivity('Intercambio Oráculo', `Cambió ${eggAmount} Huevos por ${usdtToReceive.toFixed(2)} USDT`);
    
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
    
    const wonType = chickenTypes.find(t => t.id === wonId);
    
    return {
      wonType,
      isHalfSpecial,
      clonePower
    };
  };

  const startArenaBattle = async () => {
    // MODO PRUEBA: No descontar energía
    // if (userData.arenaEnergy < 1) return false;
    // const newEnergy = userData.arenaEnergy - 1;
    // await updateDoc(doc(db, 'users', user.uid), { arenaEnergy: newEnergy });
    return true;
  };

  const handleArenaBattle = async (isWin) => {
    if (isWin) {
      // MODO DEMO: No se entregan recompensas
      await updateDoc(doc(db, 'users', user.uid), { 
        arenaWave: (userData.arenaWave || 1) + 1
      });
      return 0; // 0 recompensa
    }
    return 0;
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
      const type = chickenTypes.find(c => c.id === chicken.typeId);
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

  return { 
    balance, 
    eggBalance, 
    userData, 
    chickens, 
    oracleRate, 
    buyChicken, 
    buyMysteryEgg, 
    buyFood, 
    feedChicken, 
    scareFox, 
    openMysteryEgg, 
    openVolcanoEgg,
    openStarterEgg, 
    sellChicken, 
    collectEggs, 
    sellEggs, 
    incubateEggs, 
    exchangeUsdtToEggs, 
    exchangeEggsToUsdt, 
    rechargeBalance,    
    requestWithdrawal,
    startArenaBattle,
    handleArenaBattle,
    incomePerDay: calculateMaxDailyIncome(), 
    pendingRecharges 
  };
}
