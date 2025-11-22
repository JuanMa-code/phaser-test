import React from 'react';
import { Link } from 'react-router-dom';

const buttonStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  padding: '1.2rem 2.2rem',
  background: 'linear-gradient(145deg, #2196f3 0%, #21cbf3 100%)',
  color: '#ffffff',
  border: '2px solid rgba(255, 255, 255, 0.3)',
  borderRadius: '2rem',
  boxShadow: '0 8px 32px rgba(33, 150, 243, 0.4), 0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  fontWeight: 600,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  outline: 'none',
  letterSpacing: '0.5px',
  textTransform: 'uppercase' as const,
  position: 'relative' as const,
  overflow: 'hidden' as const,
  width: '100%',
  minHeight: '60px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(10px)',
};

const buttonHoverStyle: React.CSSProperties = {
  transform: 'translateY(-4px) scale(1.02)',
  boxShadow: '0 12px 40px rgba(33, 150, 243, 0.5), 0 8px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.3)',
  background: 'linear-gradient(145deg, #1976d2 0%, #00bcd4 100%)',
  border: '2px solid rgba(255, 255, 255, 0.5)',
};

const buttons = [
  { to: '/pong', label: '🏓 Pong' },
  { to: '/arkanoid', label: '🧱 Arkanoid' },
  { to: '/tetris', label: '🟪 Tetris' },
  { to: '/dino', label: '🦕 Dino Run' },
  { to: '/flappy', label: '🐦 Flappy Bird' },
  { to: '/whac-a-mole', label: '🔨 Whac-A-Mole' },
  { to: '/space-invaders', label: '👾 Space Invaders' },
  { to: '/asteroids', label: '🚀 Asteroids' },
  { to: '/minesweeper', label: '💣 Minesweeper' },
  { to: '/snake', label: '🐍 Snake' },
  { to: '/frogger', label: '🐸 Frogger' },
  { to: '/doodlejump', label: '🦘 Doodle Jump' },
  { to: '/unblockme', label: '🧩 Unblock Me' },
  { to: '/tower-defense', label: '🏰 Tower Defense' },
  { to: '/brotato', label: '🥔 Brotato Style' },
  { to: '/air-hockey', label: '🏒 Air Hockey' },
  { to: '/football', label: '⚽ Football' },
  { to: '/sudoku', label: '🧩 Sudoku' },
];

interface ButtonWithHoverProps {
  children: React.ReactNode;
}

const ButtonWithHover: React.FC<ButtonWithHoverProps> = ({ children }) => {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      style={hover ? { ...buttonStyle, ...buttonHoverStyle } : buttonStyle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </button>
  );
};

const Home: React.FC = () => (
  <div style={{
    textAlign: 'center',
    height: '100dvh',
    width: '100vw',
    overflowY: 'auto',
    overflowX: 'hidden',
    boxSizing: 'border-box',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '1rem',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  }}>
    {/* Elementos decorativos de fondo */}
    <div style={{
      position: 'absolute',
      top: '10%',
      left: '10%',
      width: '200px',
      height: '200px',
      background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
      borderRadius: '50%',
      animation: 'float 6s ease-in-out infinite',
    }} />
    <div style={{
      position: 'absolute',
      top: '60%',
      right: '15%',
      width: '150px',
      height: '150px',
      background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
      borderRadius: '50%',
      animation: 'float 8s ease-in-out infinite reverse',
    }} />
    
    {/* Contenido principal */}
    <div style={{ 
      position: 'relative', 
      zIndex: 1,
      width: '100%',
      maxWidth: '1200px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh'
    }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          marginBottom: '1.5rem', 
          fontSize: 'clamp(2.2rem, 4.5vw, 3.5rem)', 
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontWeight: 800, 
          letterSpacing: '2px',
          textShadow: '0 4px 20px rgba(0,0,0,0.3)',
          margin: '0',
        }}>
          🎮 ARCADE GAMES
        </h1>
        
        <p style={{
          fontSize: '1.1rem',
          color: 'rgba(255,255,255,0.9)',
          marginBottom: '0',
          fontWeight: 300,
          letterSpacing: '0.5px',
          lineHeight: '1.6',
          maxWidth: '500px',
          margin: '0 auto',
        }}>
          Colección de juegos clásicos recreados con tecnología moderna
        </p>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        width: '100%',
        maxWidth: '1000px',
        justifyItems: 'center',
        marginTop: '1.5rem',
      }}>
        {buttons.map(({ to, label }) => (
          <Link to={to} key={to} style={{ 
            textDecoration: 'none',
            width: '100%',
            maxWidth: '320px',
          }}>
            <ButtonWithHover>{label}</ButtonWithHover>
          </Link>
        ))}
      </div>
    </div>
    
    {/* CSS Animations */}
    <style>{`
      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(10deg); }
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 0.8; }
        50% { opacity: 1; }
      }
    `}</style>
  </div>
);

export default Home;
