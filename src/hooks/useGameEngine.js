import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, addDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';

const EGG_TIME = (23 * 60 * 60 * 1000) / 5; // 4.6 horas por huevo
const CYCLE_DURATION = 24 * 60 * 60 * 1000; // 24 horas en total

export const CHICKEN_TYPES = [
  { id: '1', name: 'Blanca', price: 3.50, incomePerEgg: 0.023, img: '/img/chicken_1.png', depletedImg: '/img/chicken_1_1.png', eggImg: '/img/egg_1.png', eggTime: EGG_TIME, description: 'Gallina básica.' },
  { id: '2', name: 'Turquesa', price: 7.00, incomePerEgg: 0.040, img: '/img/chicken_2.png', depletedImg: '/img/chicken_2_2.png', eggImg: '/img/egg_2.png', eggTime: EGG_TIME, description: 'Un poco mejor.' },
  { id: '3', name: 'Amarilla', price: 24.50, incomePerEgg: 0.120, img: '/img/chicken_3.png', depletedImg: '/img/chicken_3_3.png', eggImg: '/img/egg_3.png', eggTime: EGG_TIME, description: 'Buena producción.' },
  { id: '4', name: 'Lila', price: 56.00, incomePerEgg: 0.250, img: '/img/chicken_4.png', depletedImg: '/img/chicken_4_4.png', eggImg: '/img/egg_4.png', eggTime: EGG_TIME, description: 'Excelente productora.' },
  // Especiales
  { id: 's_chef', name: 'Chef', price: 60.00, incomePerEgg: 0.12, img: '/img/specials/pollo_chef.png', depletedImg: '/img/specials/pollo_chef.png', eggImg: '/img/egg_4.png', eggTime: EGG_TIME, isSpecial: true, description: 'Cocina rápido. x1.5 de velocidad pasiva.', auraColor: '#ffffff' },
  { id: 's_superman', name: 'Superman', price: 48.00, incomePerEgg: 0.15, img: '/img/specials/pollo_superman.png', depletedImg: '/img/specials/pollo_superman.png', eggImg: '/img/egg_4.png', eggTime: EGG_TIME, isSpecial: true, description: 'Inmune a los retrasos por lluvia.', auraColor: '#3b82f6' },
  { id: 's_medico', name: 'Médico', price: 48.00, incomePerEgg: 0.15, img: '/img/specials/pollo_medico.png', depletedImg: '/img/specials/pollo_medico.png', eggImg: '/img/egg_4.png', eggTime: EGG_TIME, isSpecial: true, description: 'Inmune a los retrasos por nieve.', auraColor: '#ef4444' },
  { id: 's_mago', name: 'Mago', price: 70.00, incomePerEgg: 0.20, img: '/img/specials/pollo_mago.png', depletedImg: '/img/specials/pollo_mago.png', eggImg: '/img/egg_4.png', eggTime: EGG_TIME, isSpecial: true, description: 'La tormenta eléctrica duplica su velocidad.', auraColor: '#a855f7' },
  { id: 's_robin', name: 'Robin Hood', price: 80.00, incomePerEgg: 0.12, img: '/img/specials/pollo_robinhoood.png', depletedImg: '/img/specials/pollo_robinhoood.png', eggImg: '/img/egg_4.png', eggTime: EGG_TIME, isSpecial: true, description: 'Velocidad x2 siempre (Maíz infinito).', auraColor: '#22c55e' },
  { id: 's_pirata', name: 'Pirata', price: 100.00, incomePerEgg: 0.30, img: '/img/specials/pollo_pirata.png', depletedImg: '/img/specials/pollo_pirata.png', eggImg: '/img/egg_4.png', eggTime: EGG_TIME, isSpecial: true, description: 'Pone tesoros. Sus huevos valen el doble.', auraColor: '#fcd535' },
  { id: 's_explorador', name: 'Explorador', price: 48.00, incomePerEgg: 0.10, img: '/img/specials/pollo_explorador.png', depletedImg: '/img/specials/pollo_explorador.png', eggImg: '/img/egg_4.png', eggTime: EGG_TIME, isSpecial: true, description: 'Otorga x3 de Experiencia (XP).', auraColor: '#f97316' },
  { id: 's_granjero', name: 'Granjero', price: 85.00, incomePerEgg: 0.25, img: '/img/specials/pollo_granjero.png', depletedImg: '/img/specials/pollo_granjero.png', eggImg: '/img/egg_4.png', eggTime: EGG_TIME, isSpecial: true, description: 'El superviviente. Inmune a TODOS los climas.', auraColor: '#8b5cf6' }
];



export function calculateEffectiveTime(chickenTypeId, lastEggTime, now, boostStart, boostEnd, weatherHistory) {
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
    
    // Pollo Chef: x1.5 siempre pasivo
    let passiveMultiplier = 1;
    if (chickenTypeId === 's_chef') passiveMultiplier = 1.5;
    
    totalEffectiveTime += (normalDuration * passiveMultiplier) + (boostedDuration * 2 * passiveMultiplier);
  }

  for (const event of weatherHistory) {
    const eventStart = Math.max(lastEggTime, event.start || 0);
    const eventEnd = Math.min(now, event.end || now);
    
    if (eventEnd > eventStart) {
      const duration = eventEnd - eventStart;
      
      let weatherMultiplier = 1;
      
      // Habilidades Especiales (Clima)
      if (event.type === 'rain') {
        if (chickenTypeId === 's_superman' || chickenTypeId === 's_granjero') weatherMultiplier = 1;
        else weatherMultiplier = 0.5;
      } else if (event.type === 'snow') {
        if (chickenTypeId === 's_medico' || chickenTypeId === 's_granjero') weatherMultiplier = 1;
        else weatherMultiplier = 0.5;
      } else if (event.type === 'thunder') {
        if (chickenTypeId === 's_mago') weatherMultiplier = 2;
        else if (chickenTypeId === 's_granjero') weatherMultiplier = 1;
        else weatherMultiplier = 0.5;
      } else if (event.type === 'rainbow' || event.type === 'stars') {
        weatherMultiplier = 2; 
      }

      let boostedDuration = 0;
      let normalDuration = duration;
      
      if (chickenTypeId === 's_robin') {
        // Robin Hood: Infinite Boost!
        boostedDuration = duration;
        normalDuration = 0;
      } else if (boostStart && boostEnd) {
        const boostOverlapStart = Math.max(eventStart, boostStart);
        const boostOverlapEnd = Math.min(eventEnd, boostEnd);
        if (boostOverlapEnd > boostOverlapStart) {
          boostedDuration = boostOverlapEnd - boostOverlapStart;
          normalDuration = duration - boostedDuration;
        }
      }
      
      // Pollo Chef
      let passiveMultiplier = 1;
      if (chickenTypeId === 's_chef') passiveMultiplier = 1.5;
      
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
    let effectiveTimePassed = calculateEffectiveTime(chickenData.typeId, chickenData.lastEggTime, now, chickenData.boostStartTime, chickenData.boostEndTime, weatherData.history);
    
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
        setBalance(typeof data.balance === 'number' && !isNaN(data.balance) ? data.balance : 0);
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

  const buyCorn = async () => {
    if (balance < 2.5) return Swal.fire('Oops...', 'Saldo insuficiente para comprar Súper Maíz ($2.50 USDT)', 'error');
    
    const newBalance = balance - 2.5;
    const newCornCount = (userData?.cornCount || 0) + 1;
    setBalance(newBalance);
    
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { balance: newBalance, cornCount: newCornCount });
    
    Swal.fire('¡Comprado!', 'Súper Maíz añadido a tu inventario en la Granja.', 'success');
  };

  const feedChicken = async (chickenId) => {
    const currentCorn = userData?.cornCount || 0;
    if (currentCorn <= 0) return;

    const chicken = chickens.find(c => c.id === chickenId);
    if (!chicken) return;
    
    const newCornCount = currentCorn - 1;
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { cornCount: newCornCount });

    // Boost dura 24 horas
    const boostStartTime = Date.now();
    const boostEndTime = boostStartTime + (24 * 60 * 60 * 1000);
    const chickenRef = doc(db, 'chickens', chickenId);
    await updateDoc(chickenRef, { boostStartTime, boostEndTime });
    
    Swal.fire('¡Gallina Alimentada!', 'Esta gallina producirá huevos al doble de velocidad por 24 horas.', 'success');
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
    const typeInfo = CHICKEN_TYPES.find(t => t.id === chicken.typeId);
    const moneyEarned = earnedEggs * typeInfo.incomePerEgg;
    
    // Explorador da x3 XP
    let xpMultiplier = 1;
    if (chicken.typeId === 's_explorador') xpMultiplier = 3;
    const xpEarned = earnedEggs * 10 * xpMultiplier;
    
    const newBalance = balance + moneyEarned;
    const newXp = (userData?.xp || 0) + xpEarned;
    
    // Track daily income
    const today = new Date().toISOString().split('T')[0];
    const newDailyIncomeObj = { ...(userData?.dailyIncome || {}) };
    newDailyIncomeObj[today] = (newDailyIncomeObj[today] || 0) + moneyEarned;
    
    setBalance(newBalance);
    
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { balance: newBalance, xp: newXp, dailyIncome: newDailyIncomeObj });
    
    const chickenRef = doc(db, 'chickens', chickenId);
    await updateDoc(chickenRef, { currentEggs: 0, lastEggTime: Date.now() });
    // setChickens(prev => ...) ya no es necesario aquí gracias a onSnapshot
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
        binanceId: binanceId,
        status: 'pending',
        createdAt: Date.now()
      });
      
      Swal.fire('Retiro Solicitado', `Has solicitado un retiro de $${amountUsd.toFixed(2)} USDT hacia la cuenta ${binanceId}.`, 'success');
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

  return { balance, userData, chickens, buyChicken, buyMysteryEgg, buyCorn, feedChicken, openMysteryEgg, sellChicken, collectEggs, rechargeBalance, requestWithdrawal, incomePerDay: calculateMaxDailyIncome(), pendingRecharges };
}
