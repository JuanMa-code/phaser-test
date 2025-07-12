import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import Pong from './Pong';
const Arkanoid = lazy(() => import('./Arkanoid'));
const Tetris = lazy(() => import('./Tetris'));
const Dino = lazy(() => import('./Dino'));
const Flappy = lazy(() => import('./Flappy'));
const WhacAMole = lazy(() => import('./WhacAMole'));
const SpaceInvaders = lazy(() => import('./SpaceInvaders'));
const Asteroids = lazy(() => import('./Asteroids'));
const Minesweeper = lazy(() => import('./Minesweeper'));
const Frogger = lazy(() => import('./Frogger'));
const Snake = lazy(() => import('./Snake'));
const DoodleJump = lazy(() => import('./DoodleJump'));
const UnblockMe = lazy(() => import('./UnblockMe'));


const buttonStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  padding: '1.1rem 2rem',
  background: 'linear-gradient(90deg, #f7b42c 0%, #fc575e 100%)',
  color: '#222',
  border: '2px solid #fff',
  borderRadius: '1.2rem',
  boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
  cursor: 'pointer',
  transition: 'transform 0.15s, box-shadow 0.15s',
  fontWeight: 600,
  fontFamily: 'Segoe UI, Arial, sans-serif',
  outline: 'none',
  letterSpacing: '0.03em',
};

const buttonHoverStyle: React.CSSProperties = {
  transform: 'scale(1.06)',
  boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
  background: 'linear-gradient(90deg, #ffe082 0%, #81d4fa 100%)',
};

const Home: React.FC = () => (
  <div style={{
    textAlign: 'center',
    marginTop: '48px',
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #b0b4ba 0%, #cfd8dc 100%)', // gris oscuro elegante
    fontFamily: 'Segoe UI, Arial, sans-serif',
  }}>
    <h1 style={{ marginBottom: '32px', fontSize: '2.7rem', color: '#1976d2', fontWeight: 700, letterSpacing: '0.04em', textShadow: '0 2px 8px #b3e5fc' }}>Juegos Arcade</h1>
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1.5rem',
      maxWidth: '820px',
      margin: '0 auto',
      justifyItems: 'center',
      padding: '0 1rem',
    }}>
      {[
        { to: '/pong', label: 'Pong' },
        { to: '/arkanoid', label: 'Arkanoid' },
        { to: '/tetris', label: 'Tetris' },
        { to: '/dino', label: 'Dino' },
        { to: '/flappy', label: 'Flappy Bird' },
        { to: '/whac-a-mole', label: 'Whac-A-Mole' },
        { to: '/space-invaders', label: 'Space Invaders' },
        { to: '/asteroids', label: 'Asteroids' },
        { to: '/minesweeper', label: 'Minesweeper' },
        { to: '/snake', label: 'Snake' },
        { to: '/frogger', label: 'Frogger' },
        { to: '/doodlejump', label: 'Doodle Jump' },
        { to: '/unblockme', label: 'Unblock Me' },
      ].map(({ to, label }) => (
        <Link to={to} key={to} style={{ width: '100%' }}>
          <ButtonWithHover>{label}</ButtonWithHover>
        </Link>
      ))}
    </div>
  </div>
);

// Botón con efecto hover
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

const App: React.FC = () => (
  <BrowserRouter basename='/phaser-test'>
    <Suspense fallback={<div>Cargando...</div>}>
      <Routes>
        <Route path="/unblockme" element={<UnblockMe />} />
            <Route path="/" element={<Home />} />
            <Route path="/pong" element={<Pong />} />
            <Route path="/arkanoid" element={<Arkanoid />} />
            <Route path="/tetris" element={<Tetris />} />
            <Route path="/dino" element={<Dino />} />
            <Route path="/flappy" element={<Flappy />} />
            <Route path="/whac-a-mole" element={<WhacAMole />} />
            <Route path="/space-invaders" element={<SpaceInvaders />} />
            <Route path="/asteroids" element={<Asteroids />} />
            <Route path="/minesweeper" element={<Minesweeper />} />
            <Route path="/snake" element={<Snake />} />
            <Route path="/frogger" element={<Frogger />} />
            <Route path="/doodlejump" element={<DoodleJump />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default App;
