import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const GameConfigContext = createContext();

export function useGameConfig() {
  return useContext(GameConfigContext);
}

const EGG_TIME = 24 * 60 * 60 * 1000;

const DEFAULT_CHICKEN_TYPES = [
  { id: '1', name: 'Blanca', price: 100, incomePerEgg: 5, img: '/img/chicken_1.png', depletedImg: '/img/chicken_1_1.png', eggImg: '/img/egg_1.png', eggTime: 4 * 60 * 60 * 1000, description: 'Gallina básica.', foodType: 'common', foodBagsRequired: 1 },
  { id: '2', name: 'Turquesa', price: 300, incomePerEgg: 7, img: '/img/chicken_2.png', depletedImg: '/img/chicken_2_2.png', eggImg: '/img/egg_2.png', eggTime: 6 * 60 * 60 * 1000, description: 'Un poco mejor.', foodType: 'common', foodBagsRequired: 1 },
  { id: '3', name: 'Amarilla', price: 700, incomePerEgg: 15, img: '/img/chicken_3.png', depletedImg: '/img/chicken_3_3.png', eggImg: '/img/egg_3.png', eggTime: 8 * 60 * 60 * 1000, description: 'Buena producción.', foodType: 'common', foodBagsRequired: 2 },
  { id: '4', name: 'Lila', price: 1500, incomePerEgg: 30, img: '/img/chicken_4.png', depletedImg: '/img/chicken_4_4.png', eggImg: '/img/egg_4.png', eggTime: 12 * 60 * 60 * 1000, description: 'Excelente productora.', foodType: 'common', foodBagsRequired: 3 },
  // Especiales
  { id: 's_chef', name: 'Chef', price: 2000, incomePerEgg: 20, img: '/img/specials/pollo_chef.png', depletedImg: '/img/specials/pollo_chef.png', eggImg: '/img/egg_4.png', eggTime: EGG_TIME / 2, isSpecial: true, description: 'Cocina rápido. x1.5 de velocidad pasiva.', auraColor: '#ffffff', foodType: 'special', foodBagsRequired: 2 },
  { id: 's_superman', name: 'Superman', price: 2000, incomePerEgg: 20, img: '/img/specials/pollo_superman.png', depletedImg: '/img/specials/pollo_superman.png', eggImg: '/img/egg_4.png', eggTime: EGG_TIME / 2, isSpecial: true, description: 'Inmune a los retrasos por lluvia.', auraColor: '#3b82f6', foodType: 'special', foodBagsRequired: 2 },
  { id: 's_medico', name: 'Médico', price: 2000, incomePerEgg: 20, img: '/img/specials/pollo_medico.png', depletedImg: '/img/specials/pollo_medico.png', eggImg: '/img/egg_4.png', eggTime: EGG_TIME / 2, isSpecial: true, description: 'Inmune a los retrasos por nieve.', auraColor: '#ef4444', foodType: 'special', foodBagsRequired: 2 },
  { id: 's_mago', name: 'Mago', price: 2200, incomePerEgg: 22, img: '/img/specials/pollo_mago.png', depletedImg: '/img/specials/pollo_mago.png', eggImg: '/img/egg_4.png', eggTime: EGG_TIME / 2, isSpecial: true, description: 'La tormenta eléctrica duplica su velocidad.', auraColor: '#a855f7', foodType: 'special', foodBagsRequired: 2 },
  { id: 's_robin', name: 'Robin Hood', price: 2000, incomePerEgg: 15, img: '/img/specials/pollo_robinhoood.png', depletedImg: '/img/specials/pollo_robinhoood.png', eggImg: '/img/egg_4.png', eggTime: EGG_TIME / 2, isSpecial: true, description: 'Velocidad x2 siempre (Maíz infinito).', auraColor: '#22c55e', foodType: 'special', foodBagsRequired: 2 },
  { id: 's_pirata', name: 'Pirata', price: 2500, incomePerEgg: 25, img: '/img/specials/pollo_pirata.png', depletedImg: '/img/specials/pollo_pirata.png', eggImg: '/img/egg_4.png', eggTime: EGG_TIME / 2, isSpecial: true, description: 'Pone tesoros. Sus huevos valen el doble.', auraColor: '#fcd535', foodType: 'special', foodBagsRequired: 2 },
  { id: 's_explorador', name: 'Explorador', price: 2000, incomePerEgg: 15, img: '/img/specials/pollo_explorador.png', depletedImg: '/img/specials/pollo_explorador.png', eggImg: '/img/egg_4.png', eggTime: EGG_TIME / 2, isSpecial: true, description: 'Otorga x3 de Experiencia (XP).', auraColor: '#f97316', foodType: 'special', foodBagsRequired: 2 },
  { id: 's_granjero', name: 'Granjero', price: 2500, incomePerEgg: 25, img: '/img/specials/pollo_granjero.png', depletedImg: '/img/specials/pollo_granjero.png', eggImg: '/img/egg_4.png', eggTime: EGG_TIME / 2, isSpecial: true, description: 'El superviviente. Inmune a TODOS los climas.', auraColor: '#8b5cf6', foodType: 'special', foodBagsRequired: 2 }
];

const DEFAULT_FOX_INTERVAL = 4; // hours

export function GameConfigProvider({ children }) {
  const [chickenTypes, setChickenTypes] = useState(DEFAULT_CHICKEN_TYPES);
  const [foxIntervalHours, setFoxIntervalHours] = useState(DEFAULT_FOX_INTERVAL);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const configRef = doc(db, 'config', 'gameSettings');
    const unsub = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.chickenTypes) {
          setChickenTypes(data.chickenTypes);
        }
        if (data.foxIntervalHours) {
          setFoxIntervalHours(data.foxIntervalHours);
        }
      } else {
        // Initialize default config in DB
        setDoc(configRef, {
          chickenTypes: DEFAULT_CHICKEN_TYPES,
          foxIntervalHours: DEFAULT_FOX_INTERVAL
        });
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <GameConfigContext.Provider value={{ chickenTypes, foxIntervalHours, loading }}>
      {children}
    </GameConfigContext.Provider>
  );
}
