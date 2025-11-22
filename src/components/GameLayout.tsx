import React from 'react';
import { useNavigate } from 'react-router-dom';

interface GameLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const GameLayout: React.FC<GameLayoutProps> = ({ children, title }) => {
  const navigate = useNavigate();

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflowY: 'auto', overflowX: 'hidden', boxSizing: 'border-box' }}>
      <button
        onClick={() => navigate('/')}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 1000,
          padding: '10px 20px',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(5px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '8px',
          color: 'white',
          cursor: 'pointer',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <span>🏠</span> Volver al Menú
      </button>
      {title && (
        <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 1000,
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.2rem',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
        }}>
            {title}
        </div>
      )}
      {children}
    </div>
  );
};

export default GameLayout;
