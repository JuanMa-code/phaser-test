import React from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import Pong from './Pong';

const Home: React.FC = () => (
  <div style={{ textAlign: 'center', marginTop: '100px' }}>
    <h1>Bienvenido a Pong</h1>
    <Link to="/pong">
      <button style={{ fontSize: '2rem', padding: '1rem 2rem' }}>Jugar Pong</button>
    </Link>
  </div>
);

const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/pong" element={<Pong />} />
    </Routes>
  </BrowserRouter>
);

export default App;
