import { useState, useEffect } from 'react';

export function useExchangeRate() {
  const [rate, setRate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const response = await fetch('https://ve.dolarapi.com/v1/dolares');
        const data = await response.json();
        
        // Buscar el oficial (BCV)
        const oficial = data.find(d => d.fuente === 'oficial');
        if (oficial && oficial.promedio) {
          setRate(oficial.promedio);
        } else {
          setRate(36.50); // Fallback aproximado
        }
      } catch (e) {
        console.error("Error al obtener DolarAPI", e);
        setRate(36.50); // Fallback
      }
      setLoading(false);
    };

    fetchRate();
  }, []);

  return { rate, loading };
}
