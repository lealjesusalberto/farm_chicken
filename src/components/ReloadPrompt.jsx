import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw } from 'lucide-react';

export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ', r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999
    }}>
      <div style={{
        background: 'rgba(30, 41, 59, 0.95)',
        border: '1px solid #fcd535',
        borderRadius: '16px',
        padding: '2rem',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 0 30px rgba(252, 213, 53, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <RefreshCw size={48} color="#fcd535" className="animate-spin" />
        </div>
        <h2 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.5rem' }}>¡Nueva Actualización!</h2>
        <p style={{ color: '#cbd5e1', marginBottom: '1.5rem', lineHeight: '1.5' }}>
          Hay una nueva versión del juego disponible con mejoras importantes. Debes actualizar para continuar jugando.
        </p>
        <button 
          onClick={() => updateServiceWorker(true)}
          style={{
            background: '#fcd535',
            color: '#000',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            cursor: 'pointer',
            width: '100%',
            boxShadow: '0 4px 15px rgba(252, 213, 53, 0.4)'
          }}
        >
          Actualizar Ahora
        </button>
      </div>
    </div>
  );
}
