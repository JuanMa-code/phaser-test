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

const Home: React.FC = () => (
  <div style={{ textAlign: 'center', marginTop: '100px' }}>
    <h1>Bienvenido a los juegos</h1>
    <Link to="/pong">
      <button style={{ fontSize: '2rem', padding: '1rem 2rem', marginRight: '2rem' }}>Jugar Pong</button>
    </Link>
    <Link to="/arkanoid">
      <button style={{ fontSize: '2rem', padding: '1rem 2rem', marginRight: '2rem' }}>Jugar Arkanoid</button>
    </Link>
    <Link to="/tetris">
      <button style={{ fontSize: '2rem', padding: '1rem 2rem', marginRight: '2rem' }}>Jugar Tetris</button>
    </Link>
    <Link to="/dino">
      <button style={{ fontSize: '2rem', padding: '1rem 2rem', marginRight: '2rem' }}>Jugar Dino</button>
    </Link>
    <Link to="/flappy">
      <button style={{ fontSize: '2rem', padding: '1rem 2rem', marginRight: '2rem' }}>Jugar Flappy Bird</button>
    </Link>
    <Link to="/whac-a-mole">
      <button style={{ fontSize: '2rem', padding: '1rem 2rem', marginRight: '2rem' }}>Jugar Whac-A-Mole</button>
    </Link>
    <Link to="/space-invaders">
      <button style={{ fontSize: '2rem', padding: '1rem 2rem', marginRight: '2rem' }}>Jugar Space Invaders</button>
    </Link>
    <Link to="/asteroids">
      <button style={{ fontSize: '2rem', padding: '1rem 2rem' }}>Jugar Asteroids</button>
    </Link>
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
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default App;
