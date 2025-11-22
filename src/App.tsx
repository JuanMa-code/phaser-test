import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom';
import GameLayout from './components/GameLayout';
import Home from './pages/Home';

const Pong  = lazy(() => import( './games/Pong'));
const TowerDefense  = lazy(() => import( './games/TowerDefense'));
const Brotato  = lazy(() => import( './games/Brotato'));
const Arkanoid = lazy(() => import('./games/Arkanoid'));
const Tetris = lazy(() => import('./games/Tetris'));
const Dino = lazy(() => import('./games/Dino'));
const Flappy = lazy(() => import('./games/Flappy'));
const WhacAMole = lazy(() => import('./games/WhacAMole'));
const SpaceInvaders = lazy(() => import('./games/SpaceInvaders'));
const Asteroids = lazy(() => import('./games/Asteroids'));
const Minesweeper = lazy(() => import('./games/Minesweeper'));
const Frogger = lazy(() => import('./games/Frogger'));
const Snake = lazy(() => import('./games/Snake'));
const DoodleJump = lazy(() => import('./games/DoodleJump'));
const UnblockMe = lazy(() => import('./games/UnblockMe'));
const AirHockey = lazy(() => import('./games/AirHockey'));
const Football = lazy(() => import('./games/Football'));
const Sudoku = lazy(() => import('./games/Sudoku')); // NUEVO

const AppContent: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (redirect) {
      navigate(redirect, { replace: true });
    }
  }, [navigate]);

  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100dvh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          textAlign: 'center',
          color: 'white',
          fontSize: '1.5rem',
          fontWeight: '600'
        }}>
          🎮 Cargando juego...
        </div>
      </div>
    }>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/unblockme" element={<GameLayout title="Unblock Me"><UnblockMe /></GameLayout>} />
        <Route path="/tower-defense" element={<GameLayout title="Tower Defense"><TowerDefense /></GameLayout>} />
        <Route path="/brotato" element={<GameLayout title="Brotato"><Brotato /></GameLayout>} />
        <Route path="/pong" element={<GameLayout title="Pong"><Pong /></GameLayout>} />
        <Route path="/air-hockey" element={<GameLayout title="Air Hockey"><AirHockey /></GameLayout>} />
        <Route path="/arkanoid" element={<GameLayout title="Arkanoid"><Arkanoid /></GameLayout>} />
        <Route path="/tetris" element={<GameLayout title="Tetris"><Tetris /></GameLayout>} />
        <Route path="/dino" element={<GameLayout title="Dino Run"><Dino /></GameLayout>} />
        <Route path="/flappy" element={<GameLayout title="Flappy Bird"><Flappy /></GameLayout>} />
        <Route path="/whac-a-mole" element={<GameLayout title="Whac-A-Mole"><WhacAMole /></GameLayout>} />
        <Route path="/space-invaders" element={<GameLayout title="Space Invaders"><SpaceInvaders /></GameLayout>} />
        <Route path="/asteroids" element={<GameLayout title="Asteroids"><Asteroids /></GameLayout>} />
        <Route path="/minesweeper" element={<GameLayout title="Minesweeper"><Minesweeper /></GameLayout>} />
        <Route path="/snake" element={<GameLayout title="Snake"><Snake /></GameLayout>} />
        <Route path="/frogger" element={<GameLayout title="Frogger"><Frogger /></GameLayout>} />
        <Route path="/doodlejump" element={<GameLayout title="Doodle Jump"><DoodleJump /></GameLayout>} />
        <Route path="/football" element={<GameLayout title="Football"><Football /></GameLayout>} />
        <Route path="/sudoku" element={<GameLayout title="Sudoku"><Sudoku /></GameLayout>} />
      </Routes>
    </Suspense>
  );
};

const App: React.FC = () => (
  <BrowserRouter basename={import.meta.env.BASE_URL}>
    <AppContent />
  </BrowserRouter>
);

export default App;
