import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';

const EGG_TIME = (23 * 60 * 60 * 1000) / 5; // 4.6 horas por huevo
const CYCLE_DURATION = 24 * 60 * 60 * 1000; // 24 horas en total

export const CHICKEN_TYPES = [
  { id: '1', name: 'Blanca', price: 5, incomePerEgg: 0.02, img: '/img/chicken_1.png', depletedImg: '/img/chicken_1_1.png', eggImg: '/img/egg_1.png', eggTime: EGG_TIME },
  { id: '2', name: 'Turquesa', price: 10, incomePerEgg: 0.06, img: '/img/chicken_2.png', depletedImg: '/img/chicken_2_2.png', eggImg: '/img/egg_2.png', eggTime: EGG_TIME },
  { id: '3', name: 'Amarilla', price: 35, incomePerEgg: 0.12, img: '/img/chicken_3.png', depletedImg: '/img/chicken_3_3.png', eggImg: '/img/egg_3.png', eggTime: EGG_TIME },
  { id: '4', name: 'Lila', price: 80, incomePerEgg: 0.18, img: '/img/chicken_4.png', depletedImg: '/img/chicken_4_4.png', eggImg: '/img/egg_4.png', eggTime: EGG_TIME }
];

export function useGameEngine(user) {
  const [balance, setBalance] = useState(0);
  const [chickens, setChickens] = useState([]);
  const [pendingRecharges, setPendingRecharges] = useState([]);

  // Lógica local para predecir cuántos huevos hay basados en el tiempo
  const calculatePendingEggs = (chickenData) => {
    const typeInfo = CHICKEN_TYPES.find(t => t.id === chickenData.typeId);
    if (!typeInfo) return chickenData;
    
    const now = Date.now();
    const timePassed = now - chickenData.lastEggTime;
    
    if (timePassed >= CYCLE_DURATION) {
       const missedCycles = Math.floor(timePassed / CYCLE_DURATION);
       return {
         ...chickenData,
         currentEggs: 0,
         lastEggTime: chickenData.lastEggTime + (missedCycles * CYCLE_DURATION)
       };
    }
    
    const expectedEggs = Math.min(5, Math.floor(timePassed / typeInfo.eggTime));
    
    if (expectedEggs > chickenData.currentEggs) {
      return { ...chickenData, currentEggs: expectedEggs };
    }
    
    return chickenData;
  };

  const fetchPendingRecharges = useCallback(async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'transactions'), where('userId', '==', user.uid), where('status', '==', 'pending'));
      const snap = await getDocs(q);
      setPendingRecharges(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Error fetching pending recharges", e);
    }
  }, [user]);

  const syncFarm = useCallback(async () => {
    if (!user) return;
    
    try {
      // 1. Obtener Saldo del Usuario desde Firestore
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setBalance(data.balance || 0);
        if (!data.email) {
          await updateDoc(userRef, { email: user.email });
        }
      } else {
        await setDoc(userRef, { 
          balance: 0, 
          role: 'player', 
          email: user.email,
          name: 'Usuario Recuperado',
          phone: 'No registrado'
        });
        setBalance(0);
      }

      // 2. Obtener Gallinas del Usuario
      const q = query(collection(db, 'chickens'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const fetchedChickens = [];
      
      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        const updatedData = calculatePendingEggs(data);
        
        // Si han puesto huevos mientras estábamos desconectados, guardarlo
        if (updatedData.currentEggs !== data.currentEggs) {
          await updateDoc(docSnap.ref, {
            currentEggs: updatedData.currentEggs,
            lastEggTime: updatedData.lastEggTime
          });
        }
        
        fetchedChickens.push({ id: docSnap.id, ...updatedData });
      }
      
      setChickens(fetchedChickens);
    } catch (e) {
      console.error("Error al sincronizar con Firestore:", e);
    }
  }, [user]);

  useEffect(() => {
    syncFarm();
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
  }, [syncFarm]);

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
    setChickens(prev => [...prev, { id: docRef.id, ...newChicken }]);
  };

  const collectEggs = async (chickenId) => {
    const chicken = chickens.find(c => c.id === chickenId);
    if (!chicken || chicken.currentEggs === 0) return;
    
    const type = CHICKEN_TYPES.find(t => t.id === chicken.typeId);
    const earnings = chicken.currentEggs * type.incomePerEgg;
    const newBalance = balance + earnings;
    
    setBalance(newBalance);
    setChickens(prev => prev.map(c => c.id === chickenId ? { ...c, currentEggs: 0, lastEggTime: Date.now() } : c));
    
    // Guardar en Firestore
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { balance: newBalance });
    
    const chickenRef = doc(db, 'chickens', chickenId);
    await updateDoc(chickenRef, { currentEggs: 0, lastEggTime: Date.now() });
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
      fetchPendingRecharges();
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
      fetchPendingRecharges();
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

  return { balance, chickens, buyChicken, collectEggs, rechargeBalance, requestWithdrawal, incomePerDay: calculateMaxDailyIncome(), pendingRecharges };
}
