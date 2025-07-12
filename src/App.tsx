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
const Snake = lazy(() => import('./Snake'));


const buttonStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  padding: '1.2rem 2.2rem',
  background: 'linear-gradient(90deg, #f7b42c 0%, #fc575e 100%)',
  color: '#fff',
  border: 'none',
  borderRadius: '1.5rem',
  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
  cursor: 'pointer',
  transition: 'transform 0.1s',
  fontWeight: 'bold',
  outline: 'none',
};

const Home: React.FC = () => (
  <div style={{ textAlign: 'center', marginTop: '60px' }}>
    <h1 style={{ marginBottom: '40px', fontSize: '2.5rem', color: '#222' }}>Juegos Arcade</h1>
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '2rem',
      maxWidth: '900px',
      margin: '0 auto',
      justifyItems: 'center',
    }}>
      <Link to="/pong">
        <button style={buttonStyle}>Pong</button>
      </Link>
      <Link to="/arkanoid">
        <button style={buttonStyle}>Arkanoid</button>
      </Link>
      <Link to="/tetris">
        <button style={buttonStyle}>Tetris</button>
      </Link>
      <Link to="/dino">
        <button style={buttonStyle}>Dino</button>
      </Link>
      <Link to="/flappy">
        <button style={buttonStyle}>Flappy Bird</button>
      </Link>
      <Link to="/whac-a-mole">
        <button style={buttonStyle}>Whac-A-Mole</button>
      </Link>
      <Link to="/space-invaders">
        <button style={buttonStyle}>Space Invaders</button>
      </Link>
      <Link to="/asteroids">
        <button style={buttonStyle}>Asteroids</button>
      </Link>
      <Link to="/minesweeper">
        <button style={buttonStyle}>Minesweeper</button>
      </Link>
           <Link to="/snake">
               <button style={buttonStyle}>Snake</button>
           </Link>
    </div>
  </div>
);

const App: React.FC = () => (
  <BrowserRouter basename='/phaser-test'>
    <Suspense fallback={<div>Cargando...</div>}>
      <Routes>
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
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default App;
