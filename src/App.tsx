import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import Pong from './Pong';
const Arkanoid = lazy(() => import('./Arkanoid'));

const Home: React.FC = () => (
  <div style={{ textAlign: 'center', marginTop: '100px' }}>
    <h1>Bienvenido a los juegos</h1>
    <Link to="/pong">
      <button style={{ fontSize: '2rem', padding: '1rem 2rem', marginRight: '2rem' }}>Jugar Pong</button>
    </Link>
    <Link to="/arkanoid">
      <button style={{ fontSize: '2rem', padding: '1rem 2rem' }}>Jugar Arkanoid</button>
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
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default App;
