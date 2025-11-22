import React from 'react';

export interface GameOverScreenProps {
  score: number;
  highScore?: number;
  onRestart: () => void;
  onMenu?: () => void;
  isNewRecord?: boolean;
  isVictory?: boolean;
  customStats?: { label: string; value: string | number }[];
  theme?: {
    background?: string;
    cardBackground?: string;
    primary?: string;
    secondary?: string;
    text?: string;
    accent?: string;
  };
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({
  score,
  highScore,
  onRestart,
  onMenu = () => window.history.back(),
  isNewRecord = false,
  isVictory = false,
  customStats = [],
  theme = {}
}) => {
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100dvh',
      background: theme.background || (isVictory 
        ? 'linear-gradient(135deg, #0a1a0a 0%, #1a3a1a 100%)'
        : 'linear-gradient(135deg, #1a0a0a 0%, #3a1a1a 100%)'),
      fontFamily: 'Arial, sans-serif',
      color: theme.text || 'white',
      padding: '2rem'
    },
    card: {
      background: theme.cardBackground || 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '20px',
      padding: '3rem',
      textAlign: 'center' as const,
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      maxWidth: '500px',
      width: '100%'
    },
    title: {
      fontSize: '3rem',
      margin: '0 0 1rem 0',
      background: theme.accent || (isVictory 
        ? 'linear-gradient(45deg, #00ff80, #ffffff)' 
        : 'linear-gradient(45deg, #ff4444, #ff8888)'),
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textShadow: '0 0 20px rgba(255, 255, 255, 0.2)'
    },
    statsContainer: {
      fontSize: '1.5rem',
      margin: '2rem 0',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '0.5rem'
    },
    buttonContainer: {
      display: 'flex',
      gap: '1rem',
      justifyContent: 'center',
      flexWrap: 'wrap' as const
    },
    primaryButton: {
      padding: '1rem 2rem',
      fontSize: '1.2rem',
      background: theme.primary || 'linear-gradient(45deg, #4dabf7, #74b9ff)',
      border: 'none',
      borderRadius: '50px',
      color: 'white',
      cursor: 'pointer',
      fontWeight: 'bold',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
      transition: 'all 0.3s ease'
    },
    secondaryButton: {
      padding: '1rem 2rem',
      fontSize: '1.2rem',
      background: theme.secondary || 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '50px',
      color: 'white',
      cursor: 'pointer',
      fontWeight: 'bold',
      transition: 'all 0.3s ease'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title as any}>
          {isVictory ? '🏆 ¡VICTORIA!' : (isNewRecord ? '🏆 ¡NUEVO RÉCORD!' : '💥 ¡GAME OVER!')}
        </h1>
        
        <div style={styles.statsContainer}>
          <p>🎯 Puntuación: <strong>{score}</strong></p>
          {highScore !== undefined && (
            <p>🏆 Récord: <strong>{highScore}</strong></p>
          )}
          {customStats.map((stat, index) => (
            <p key={index}>{stat.label}: <strong>{stat.value}</strong></p>
          ))}
          
          {isNewRecord && <p style={{ color: '#FFD700', fontSize: '1.2rem', marginTop: '1rem' }}>¡Increíble nueva marca personal!</p>}
          {isVictory && <p style={{ color: '#00ff80', fontSize: '1.2rem', marginTop: '1rem' }}>¡Misión Completada!</p>}
        </div>

        <div style={styles.buttonContainer}>
          <button
            onClick={onRestart}
            style={styles.primaryButton}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
            }}
          >
            🔄 Jugar de Nuevo
          </button>
          
          <button
            onClick={onMenu}
            style={styles.secondaryButton}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            🏠 Menú Principal
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverScreen;
