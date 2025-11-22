import React from 'react';

export interface InstructionSection {
  title: string;
  items: string[];
  icon?: string;
}

export interface GameStartScreenProps {
  title: React.ReactNode;
  description: string;
  instructions: InstructionSection[];
  onStart: () => void;
  onBack?: () => void;
  highScore?: number;
  children?: React.ReactNode;
  theme?: {
    background?: string;
    cardBackground?: string;
    primary?: string;
    secondary?: string;
    text?: string;
    accent?: string;
  };
}

const GameStartScreen: React.FC<GameStartScreenProps> = ({
  title,
  description,
  instructions,
  onStart,
  onBack = () => window.history.back(),
  highScore,
  children,
  theme = {}
}) => {
  const styles = {
    container: {
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: theme.background || 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      fontFamily: 'Arial, sans-serif',
      padding: '1rem',
      overflowY: 'auto' as const
    },
    card: {
      background: theme.cardBackground || 'rgba(255, 255, 255, 0.15)',
      backdropFilter: 'blur(10px)',
      borderRadius: '20px',
      padding: '2rem',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      maxWidth: '500px',
      width: '95%',
      textAlign: 'center' as const,
      color: theme.text || 'white',
      margin: '1rem auto'
    },
    title: {
      fontSize: '3rem',
      marginBottom: '1rem',
      background: theme.accent || 'linear-gradient(45deg, #ff0080, #00ff80, #0080ff)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: typeof title === 'string' ? 'transparent' : undefined,
      textShadow: typeof title === 'string' ? '0 0 30px rgba(255, 255, 255, 0.3)' : undefined
    },
    description: {
      fontSize: '1.1rem',
      marginBottom: '1.5rem',
      opacity: 0.9,
      lineHeight: '1.4'
    },
    section: {
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '15px',
      padding: '1.2rem',
      marginBottom: '1.5rem',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    },
    sectionTitle: {
      fontSize: '1.2rem',
      marginBottom: '1rem',
      color: theme.text || '#fff'
    },
    sectionContent: {
      fontSize: '0.95rem',
      textAlign: 'left' as const,
      lineHeight: '1.4'
    },
    primaryButton: {
      fontSize: '1.2rem',
      padding: '0.8rem 2rem',
      background: theme.primary || 'linear-gradient(45deg, #4dabf7, #74b9ff)',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: 'bold',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
      transition: 'all 0.3s ease',
      marginBottom: '1rem',
      width: '100%'
    },
    secondaryButton: {
      fontSize: '1rem',
      padding: '0.8rem 2rem',
      background: theme.secondary || 'rgba(255, 255, 255, 0.1)',
      color: 'white',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: 'bold',
      transition: 'all 0.3s ease',
      width: '100%'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title as any}>
          {title}
        </h1>
        
        <p style={styles.description}>
          {description}
        </p>

        {highScore !== undefined && (
           <div style={{...styles.section, textAlign: 'center'}}>
             <h3 style={styles.sectionTitle}>🏆 Récord Actual</h3>
             <p style={{fontSize: '1.5rem', fontWeight: 'bold'}}>{highScore}</p>
           </div>
        )}

        {instructions.map((section, index) => (
          <div key={index} style={styles.section}>
            <h3 style={styles.sectionTitle}>
              {section.icon} {section.title}
            </h3>
            <div style={styles.sectionContent}>
              {section.items.map((item, i) => (
                <p key={i} style={{ marginBottom: '0.5rem' }}>{item}</p>
              ))}
            </div>
          </div>
        ))}

        {children}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            onClick={onStart}
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
            🎮 ¡Jugar Ahora!
          </button>

          <button
            onClick={onBack}
            style={styles.secondaryButton}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            🏠 Volver al Menú
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameStartScreen;
