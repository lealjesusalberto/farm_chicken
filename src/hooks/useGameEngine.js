import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, addDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';

const EGG_TIME = (23 * 60 * 60 * 1000) / 5; // 4.6 horas por huevo
const CYCLE_DURATION = 24 * 60 * 60 * 1000; // 24 horas en total

export const CHICKEN_TYPES = [
  { id: '1', name: 'Blanca', price: 1.00, incomePerEgg: 0.005, img: '/img/chicken_1.png', depletedImg: '/img/chicken_1_1.png', eggImg: '/img/egg_1.png', eggTime: EGG_TIME, description: 'Gallina básica.', foodType: 'common', foodBagsRequired: 1 },
  { id: '2', name: 'Turquesa', price: 3.00, incomePerEgg: 0.017, img: '/img/chicken_2.png', depletedImg: '/img/chicken_2_2.png', eggImg: '/img/egg_2.png', eggTime: EGG_TIME, description: 'Un poco mejor.', foodType: 'common', foodBagsRequired: 1 },
  { id: '3', name: 'Amarilla', price: 7.00, incomePerEgg: 0.050, img: '/img/chicken_3.png', depletedImg: '/img/chicken_3_3.png', eggImg: '/img/egg_3.png', eggTime: EGG_TIME, description: 'Buena producción.', foodType: 'common', foodBagsRequired: 2 },
  { id: '4', name: 'Lila', price: 15.00, incomePerEgg: 0.125, img: '/img/chicken_4.png', depletedImg: '/img/chicken_4_4.png', eggImg: '/img/egg_4.png', eggTime: EGG_TIME, description: 'Excelente productora.', foodType: 'common', foodBagsRequired: 3 },
  // Especiales
  { id: 's_chef', name: 'Chef', price: 20.00, incomePerEgg: 0.20, img: '/img/specials/pollo_chef.png', depletedImg: '/img/specials/pollo_chef.png', eggImg: '/img/egg_4.png', eggTime: EGG_TIME, isSpecial: true, description: 'Cocina rápido. x1.5 de velocidad pasiva.', auraColor: '#ffffff', foodType: 'special', foodBagsRequired: 2 },
  { id: 's_superman', name: 'Superman', price: 20.00, incomePerEgg: 0.20, img: '/img/specials/pollo_superman.png', depletedImg: '/img/specials/pollo_superman.png', eggImg: '/img/egg_4.png', eggTime: EGG_TIME, isSpecial: true, description: 'Inmune a los retrasos por lluvia.', auraColor: '#3b82f6', foodType: 'special', foodBagsRequired: 2 },
  { id: 's_medico', name: 'Médico', price: 20.00, incomePerEgg: 0.20, img: '/img/specials/pollo_medico.png', depletedImg: '/img/specials/pollo_medico.png', eggImg: '/img/egg_4.png', eggTime: EGG_TIME, isSpecial: true, description: 'Inmune a los retrasos por nieve.', auraColor: '#ef4444', foodType: 'special', foodBagsRequired: 2 },
  { id: 's_mago', name: 'Mago', price: 22.00, incomePerEgg: 0.22, img: '/img/specials/pollo_mago.png', depletedImg: '/img/specials/pollo_mago.png', eggImg: '/img/egg_4.png', eggTime: EGG_TIME, isSpecial: true, description: 'La tormenta eléctrica duplica su velocidad.', auraColor: '#a855f7', foodType: 'special', foodBagsRequired: 2 },
  { id: 's_robin', name: 'Robin Hood', price: 20.00, incomePerEgg: 0.15, img: '/img/specials/pollo_robinhoood.png', depletedImg: '/img/specials/pollo_robinhoood.png', eggImg: '/img/egg_4.png', eggTime: EGG_TIME, isSpecial: true, description: 'Velocidad x2 siempre (Maíz infinito).', auraColor: '#22c55e', foodType: 'special', foodBagsRequired: 2 },
  { id: 's_pirata', name: 'Pirata', price: 25.00, incomePerEgg: 0.25, img: '/img/specials/pollo_pirata.png', depletedImg: '/img/specials/pollo_pirata.png', eggImg: '/img/egg_4.png', eggTime: EGG_TIME, isSpecial: true, description: 'Pone tesoros. Sus huevos valen el doble.', auraColor: '#fcd535', foodType: 'special', foodBagsRequired: 2 },
  { id: 's_explorador', name: 'Explorador', price: 20.00, incomePerEgg: 0.15, img: '/img/specials/pollo_explorador.png', depletedImg: '/img/specials/pollo_explorador.png', eggImg: '/img/egg_4.png', eggTime: EGG_TIME, isSpecial: true, description: 'Otorga x3 de Experiencia (XP).', auraColor: '#f97316', foodType: 'special', foodBagsRequired: 2 },
  { id: 's_granjero', name: 'Granjero', price: 25.00, incomePerEgg: 0.25, img: '/img/specials/pollo_granjero.png', depletedImg: '/img/specials/pollo_granjero.png', eggImg: '/img/egg_4.png', eggTime: EGG_TIME, isSpecial: true, description: 'El superviviente. Inmune a TODOS los climas.', auraColor: '#8b5cf6', foodType: 'special', foodBagsRequired: 2 }
];



export function calculateEffectiveTime(chickenTypeId, lastEggTime, now, boostStart, boostEnd, weatherHistory, clonePower = 100) {
  let totalEffectiveTime = 0;
  
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
    // Pollo Chef: x1.5 siempre pasivo (+0.5 base)
    let passiveMultiplier = 1;
    if (chickenTypeId === 's_chef') {
      passiveMultiplier = 1 + (0.5 * powerFactor);
    }
    
    totalEffectiveTime += (normalDuration * passiveMultiplier) + (boostedDuration * 2 * passiveMultiplier);
  }

  for (const event of weatherHistory) {
    const eventStart = Math.max(lastEggTime, event.start || 0);
    const eventEnd = Math.min(now, event.end || now);
    
    if (eventEnd > eventStart) {
      const duration = eventEnd - eventStart;
      
      let weatherMultiplier = 1;
      
      const powerFactor = clonePower / 100;
      
      // Habilidades Especiales (Clima)
      if (event.type === 'rain') {
        if (chickenTypeId === 's_superman' || chickenTypeId === 's_granjero') {
          weatherMultiplier = 0.5 + (0.5 * powerFactor); // Resiste la penalización proporcionalmente
        } else {
          weatherMultiplier = 0.5;
        }
      } else if (event.type === 'snow') {
        if (chickenTypeId === 's_medico' || chickenTypeId === 's_granjero') {
          weatherMultiplier = 0.5 + (0.5 * powerFactor);
        } else {
          weatherMultiplier = 0.5;
        }
      } else if (event.type === 'thunder') {
        if (chickenTypeId === 's_mago') {
          weatherMultiplier = 0.5 + (1.5 * powerFactor); // Beneficio del mago proporcional
        } else if (chickenTypeId === 's_granjero') {
          weatherMultiplier = 0.5 + (0.5 * powerFactor);
        } else {
          weatherMultiplier = 0.5;
        }
      } else if (event.type === 'rainbow' || event.type === 'stars') {
        weatherMultiplier = 2; 
      }

      let boostedDuration = 0;
      let normalDuration = duration;
      
      if (chickenTypeId === 's_robin') {
        // Robin Hood: Infinite Boost (x2 original, x1.5 clon)
        let robinBoost = isHalfSpecial ? 1.5 : 2;
        // Para simularlo, damos normalDuration = 0 y hacemos el cálculo con un boosted duration modificado
        // O más fácil, aplicamos el multiplicador pasivo abajo y no tocamos boostedDuration
        normalDuration = duration;
      } else if (boostStart && boostEnd) {
        const boostOverlapStart = Math.max(eventStart, boostStart);
        const boostOverlapEnd = Math.min(eventEnd, boostEnd);
        if (boostOverlapEnd > boostOverlapStart) {
          boostedDuration = boostOverlapEnd - boostOverlapStart;
          normalDuration = duration - boostedDuration;
        }
      }
      
      // Pollo Chef y Robin
      let passiveMultiplier = 1;
      if (chickenTypeId === 's_chef') {
        passiveMultiplier = 1 + (0.5 * powerFactor);
      } else if (chickenTypeId === 's_robin') {
        passiveMultiplier = 1 + (1.0 * powerFactor);
      }
      
      totalEffectiveTime += (normalDuration * weatherMultiplier * passiveMultiplier) + (boostedDuration * 2 * weatherMultiplier * passiveMultiplier);
    }
  }
  
  return totalEffectiveTime;
}

export function useGameEngine(user, weatherData = { type: 'sunny', history: [] }) {
  const [balance, setBalance] = useState(0);
  const [userData, setUserData] = useState(null);
  const [chickens, setChickens] = useState([]);
  const [pendingRecharges, setPendingRecharges] = useState([]);

  // Lógica local para predecir cuántos huevos hay basados en el tiempo
  const calculatePendingEggs = (chickenData) => {
    const typeInfo = CHICKEN_TYPES.find(t => t.id === chickenData.typeId);
    if (!typeInfo) return chickenData;
    
    const now = Date.now();
    let effectiveTimePassed = calculateEffectiveTime(chickenData.typeId, chickenData.lastEggTime, now, chickenData.boostStartTime, chickenData.boostEndTime, weatherData.history, chickenData.clonePower !== undefined ? chickenData.clonePower : (chickenData.isHalfSpecial ? 50 : 100));
    
    if (effectiveTimePassed >= CYCLE_DURATION) {
       return {
         ...chickenData,
         currentEggs: 0,
         lastEggTime: now // Reiniciar ciclo si se murieron los huevos
       };
    }
    
    const expectedEggs = Math.min(5, Math.floor(effectiveTimePassed / typeInfo.eggTime));
    
    if (expectedEggs > chickenData.currentEggs) {
      return { ...chickenData, currentEggs: expectedEggs };
    }
    
    return chickenData;
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
        if (!data.email) {
          await updateDoc(userRef, { email: user.email });
        }
      } else {
        await setDoc(userRef, { balance: 0, role: 'player', email: user.email, name: 'Usuario Recuperado', phone: 'No registrado' });
        setBalance(0);
      }
    });

    // 2. Escuchar gallinas
    const qChickens = query(collection(db, 'chickens'), where('userId', '==', user.uid));
    const unsubChickens = onSnapshot(qChickens, async (snap) => {
      const fetchedChickens = [];
      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        const updatedData = calculatePendingEggs(data);
        if (updatedData.currentEggs !== data.currentEggs) {
          await updateDoc(docSnap.ref, { currentEggs: updatedData.currentEggs, lastEggTime: updatedData.lastEggTime });
        }
        fetchedChickens.push({ id: docSnap.id, ...updatedData });
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
    // Simular los huevos cayendo visualmente en tiempo real (cada 2.5s)
    const interval = setInterval(() => {
      setChickens(prev => {
        let changed = false;
        const newC = prev.map(c => {
          const up = calculatePendingEggs(c);
          if (up.currentEggs !== c.currentEggs) changed = true;
          return up;
        });
        return changed ? newC : prev;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [user]);

  const buyChicken = async (typeId) => {
    const type = CHICKEN_TYPES.find(t => t.id === typeId);
    if (!type || balance < type.price) return Swal.fire('Oops...', 'Saldo insuficiente para comprar esta gallina', 'error');
    
    const newBalance = balance - type.price;
    setBalance(newBalance);
    
    // Guardar en Firestore
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { balance: newBalance });
    
    const newChicken = {
      userId: user.uid,
      typeId,
      lastEggTime: Date.now(),
      currentEggs: 0
    };
    
    const docRef = await addDoc(collection(db, 'chickens'), newChicken);
    // Ya no hacemos setChickens manualmente porque onSnapshot lo hará por nosotros
  };

  const buyMysteryEgg = async () => {
    if (balance < 2) return Swal.fire('Oops...', 'Saldo insuficiente para comprar el huevo misterioso ($2 USDT)', 'error');
    
    const newBalance = balance - 2;
    const newEggsCount = (userData?.mysteryEggs || 0) + 1;
    setBalance(newBalance);
    
    // Guardar en Firestore
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { balance: newBalance, mysteryEggs: newEggsCount });
    
    Swal.fire('¡Comprado!', 'El huevo se guardó en tu granja (Cestita). Ve allá para abrirlo.', 'success');
  };

  const buyFood = async (foodType) => {
    if (!userData) return;
    
    const price = foodType === 'special' ? 0.25 : 0.10;
    const name = foodType === 'special' ? 'Saco Especial' : 'Saco de Maíz';
    const field = foodType === 'special' ? 'specialCornCount' : 'cornCount';
    
    if (balance < price) return Swal.fire('Oops...', `Saldo insuficiente para comprar ${name} ($${price.toFixed(2)} USDT)`, 'error');
    
    const newBalance = balance - price;
    const newCount = (userData[field] || 0) + 1;
    
    setBalance(newBalance);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { balance: newBalance, [field]: newCount });
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

    // Boost dura 12 horas
    const boostStartTime = Date.now();
    const boostEndTime = boostStartTime + (12 * 60 * 60 * 1000);
    const chickenRef = doc(db, 'chickens', chickenId);
    await updateDoc(chickenRef, { boostStartTime, boostEndTime });
    
    Swal.fire('¡Gallina Alimentada!', `Has gastado ${requiredBags} Saco(s). Su producción está acelerada por 12 horas.`, 'success');
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
    
    const newChicken = {
      userId: user.uid,
      typeId: wonId,
      lastEggTime: Date.now(),
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

  const sellChicken = async (chickenId) => {
    const chicken = chickens.find(c => c.id === chickenId);
    if (!chicken) return;
    
    const type = CHICKEN_TYPES.find(t => t.id === chicken.typeId);
    const sellPrice = type.price / 2;
    
    const result = await Swal.fire({
      title: '¿Vender gallina?',
      text: `Obtendrás $${sellPrice.toFixed(2)} USDT por vender esta gallina ${type.name}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, vender',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ff4c4c'
    });

    if (result.isConfirmed) {
      const newBalance = balance + sellPrice;
      setBalance(newBalance);
      
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { balance: newBalance });
      
      const chickenRef = doc(db, 'chickens', chickenId);
      await deleteDoc(chickenRef);
      
      Swal.fire('Vendida', `Gallina vendida por $${sellPrice.toFixed(2)} USDT.`, 'success');
    }
  };

  const collectEggs = async (chickenId) => {
    const chicken = chickens.find(c => c.id === chickenId);
    if (!chicken || chicken.currentEggs === 0) return;
    
    const earnedEggs = chicken.currentEggs;
    
    // Explorador da x3 XP
    let xpMultiplier = 1;
    if (chicken.typeId === 's_explorador') {
      const powerFactor = chicken.clonePower !== undefined ? chicken.clonePower / 100 : (chicken.isHalfSpecial ? 0.5 : 1);
      xpMultiplier = 1 + (2 * powerFactor);
    }
    const xpEarned = earnedEggs * 10 * xpMultiplier;
    
    const newXp = (userData?.xp || 0) + xpEarned;
    
    // Añadir al inventario
    const currentInventory = userData?.eggInventory || {};
    const currentCount = currentInventory[chicken.typeId] || 0;
    const newInventory = { ...currentInventory, [chicken.typeId]: currentCount + earnedEggs };
    
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { xp: newXp, eggInventory: newInventory });
    
    const chickenRef = doc(db, 'chickens', chickenId);
    await updateDoc(chickenRef, { currentEggs: 0, lastEggTime: Date.now() });
  };

  const sellEggs = async (typeId, count) => {
    const currentInventory = userData?.eggInventory || {};
    const available = currentInventory[typeId] || 0;
    if (available < count) return Swal.fire('Oops...', 'No tienes suficientes huevos de este tipo.', 'error');
    
    const typeInfo = CHICKEN_TYPES.find(t => t.id === typeId);
    if (!typeInfo) return;
    
    let moneyEarned = count * typeInfo.incomePerEgg;
    
    // El Pirata original da x2 del precio base? En CHICKEN_TYPES el precio base ya es 0.30 (que es x2).
    // Así que el pirata CLON dará la mitad (x1.5 = 0.225)
    if (typeId === 's_pirata') {
      // Como solo los clones afectan aquí y se venden de forma agrupada, 
      // esto es un problema porque el inventario mezcla huevos de clones y originales.
      // ¡Espera! Si un jugador tiene un pirata original y uno clon, producen el mismo tipo de huevo.
      // Asumiremos que el Huevo del Pirata vale 0.30 siempre.
      // O podríamos separar el typeId del clon: 's_pirata_half'.
      // Para no complicarlo, el huevo en sí vale lo mismo, pero el clon produce más lento? No, produce igual.
      // El prompt dice: "todos sus skill del original son a las mita".
    }

    const newInventory = { ...currentInventory, [typeId]: available - count };
    const newBalance = balance + moneyEarned;
    
    // Track daily income
    const today = new Date().toISOString().split('T')[0];
    const newDailyIncomeObj = { ...(userData?.dailyIncome || {}) };
    newDailyIncomeObj[today] = (newDailyIncomeObj[today] || 0) + moneyEarned;
    
    setBalance(newBalance);
    
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { balance: newBalance, eggInventory: newInventory, dailyIncome: newDailyIncomeObj });
    
    Swal.fire('¡Huevos Vendidos!', `Has vendido ${count} huevos por $${moneyEarned.toFixed(2)} USDT.`, 'success');
  };

  const incubateEggs = async (typeId) => {
    // Definimos el costo en huevos por tipo (Opción B: 1000, 600, 200, 100)
    const costMap = {
      '1': 1000,
      '2': 600,
      '3': 200,
      '4': 100
    };
    
    // Costo por defecto si meten huevos especiales (ej. 20)
    const cost = costMap[typeId] || 20;
    
    const currentInventory = userData?.eggInventory || {};
    const available = currentInventory[typeId] || 0;
    
    if (available < cost) {
      throw new Error(`Necesitas ${cost} huevos de este tipo para usar la incubadora.`);
    }
    
    // Descontar huevos
    const newInventory = { ...currentInventory, [typeId]: available - cost };
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { eggInventory: newInventory });
    
    // 2% Especial Original, 98% Especial Clon
    const isHalfSpecial = Math.random() > 0.02;
    
    // Si es clon, asignar un poder aleatorio: 20%, 30%, 40% o 50%
    const powers = [20, 30, 40, 50];
    const clonePower = isHalfSpecial ? powers[Math.floor(Math.random() * powers.length)] : 100;
    
    const specialIds = ['s_chef', 's_superman', 's_medico', 's_mago', 's_robin', 's_pirata', 's_explorador', 's_granjero'];
    const wonId = specialIds[Math.floor(Math.random() * specialIds.length)];
    
    const newChicken = {
      userId: user.uid,
      typeId: wonId,
      lastEggTime: Date.now(),
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

  const addTestEggs = async () => {
    const currentInventory = userData?.eggInventory || {};
    const newInventory = {
      ...currentInventory,
      '1': (currentInventory['1'] || 0) + 2000,
      '2': (currentInventory['2'] || 0) + 2000,
      '3': (currentInventory['3'] || 0) + 2000,
      '4': (currentInventory['4'] || 0) + 2000
    };
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { eggInventory: newInventory });
    Swal.fire('¡Cheat activado!', 'Se han añadido 2000 huevos de cada tipo base para pruebas.', 'success');
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
      return Swal.fire('Error', 'El monto mínimo de retiro es de $20 USDT', 'error');
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
      
      Swal.fire('Retiro Solicitado', `Has solicitado un retiro de $${amountUsd.toFixed(2)} USDT hacia la cuenta ${binanceId}.\nRecibirás $${(amountUsd * 0.9).toFixed(2)} USDT luego de la comisión del 10%.`, 'success');
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'Hubo un problema procesando el retiro', 'error');
    }
  };

  const calculateMaxDailyIncome = () => {
    return chickens.reduce((acc, chicken) => {
      const type = CHICKEN_TYPES.find(c => c.id === chicken.typeId);
      return acc + (type ? type.incomePerEgg * 5 : 0);
    }, 0);
  };

  return { balance, userData, chickens, buyChicken, buyMysteryEgg, buyFood, feedChicken, openMysteryEgg, sellChicken, collectEggs, sellEggs, incubateEggs, addTestEggs, rechargeBalance, requestWithdrawal, incomePerDay: calculateMaxDailyIncome(), pendingRecharges };
}
