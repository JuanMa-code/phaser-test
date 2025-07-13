import * as PIXI from 'pixi.js';
import React, { useEffect, useRef, useState } from 'react';

const COLS = 20;
const ROWS = 15;
const CELL_SIZE = 32;
const SPEED = 150; // ms por movimiento

const DIRS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
};

const Snake: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    if (gameOver || !gameStarted) return;
    
    const app = new PIXI.Application({
      width: COLS * CELL_SIZE,
      height: ROWS * CELL_SIZE,
      backgroundColor: 0x1a1a2e,
    });
    appRef.current = app;
    if (containerRef.current && app.view instanceof Node) {
      containerRef.current.appendChild(app.view);
    }

    let snake: { x: number; y: number }[] = [];
    let dir = DIRS['ArrowRight'];
    let nextDir = dir;
    let food = { x: 0, y: 0 };
    let isGameOver = false;
    let currentScore = 0;
    let moveTimer: number | undefined;

    function placeFood() {
      let valid = false;
      while (!valid) {
        food.x = Math.floor(Math.random() * COLS);
        food.y = Math.floor(Math.random() * ROWS);
        valid = !snake.some(s => s.x === food.x && s.y === food.y);
      }
    }

    function resetGame() {
      snake = [ { x: 5, y: 7 }, { x: 4, y: 7 }, { x: 3, y: 7 } ];
      dir = DIRS['ArrowRight'];
      nextDir = dir;
      currentScore = 0;
      isGameOver = false;
      setScore(0);
      setGameOver(false);
      placeFood();
      draw();
      if (moveTimer) clearInterval(moveTimer);
      moveTimer = window.setInterval(move, SPEED);
    }

    function move() {
      if (isGameOver) return;
      dir = nextDir;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      // Check collision
      if (
        head.x < 0 || head.x >= COLS ||
        head.y < 0 || head.y >= ROWS ||
        snake.some(s => s.x === head.x && s.y === head.y)
      ) {
        isGameOver = true;
        setGameOver(true);
        draw();
        return;
      }
      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        currentScore++;
        setScore(currentScore);
        placeFood();
      } else {
        snake.pop();
      }
      draw();
    }

    function draw() {
      app.stage.removeChildren();
      
      // Draw grid
      const grid = new PIXI.Graphics();
      grid.lineStyle(1, 0x333333, 0.3);
      for (let i = 0; i <= COLS; i++) {
        grid.moveTo(i * CELL_SIZE, 0);
        grid.lineTo(i * CELL_SIZE, ROWS * CELL_SIZE);
      }
      for (let i = 0; i <= ROWS; i++) {
        grid.moveTo(0, i * CELL_SIZE);
        grid.lineTo(COLS * CELL_SIZE, i * CELL_SIZE);
      }
      app.stage.addChild(grid);
      
      // Draw snake
      snake.forEach((s, i) => {
        const g = new PIXI.Graphics();
        if (i === 0) {
          // Head
          g.beginFill(0x00ff00);
          g.drawRoundedRect(2, 2, CELL_SIZE - 4, CELL_SIZE - 4, 6);
          g.endFill();
          // Eyes
          g.beginFill(0x000000);
          g.drawCircle(CELL_SIZE * 0.3, CELL_SIZE * 0.3, 3);
          g.drawCircle(CELL_SIZE * 0.7, CELL_SIZE * 0.3, 3);
          g.endFill();
        } else {
          // Body
          g.beginFill(0x009900);
          g.drawRoundedRect(3, 3, CELL_SIZE - 6, CELL_SIZE - 6, 4);
          g.endFill();
        }
        g.x = s.x * CELL_SIZE;
        g.y = s.y * CELL_SIZE;
        app.stage.addChild(g);
      });
      
      // Draw food
      const f = new PIXI.Graphics();
      f.beginFill(0xff4757);
      f.drawCircle(CELL_SIZE / 2, CELL_SIZE / 2, CELL_SIZE / 2.5);
      f.endFill();
      f.beginFill(0x00ff00);
      f.drawRect(CELL_SIZE / 2 - 2, CELL_SIZE / 4, 4, 8);
      f.endFill();
      f.x = food.x * CELL_SIZE;
      f.y = food.y * CELL_SIZE;
      app.stage.addChild(f);
    }

    function handleKey(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      if (key in DIRS) {
        const d = DIRS[key as keyof typeof DIRS];
        // Prevent reverse
        if (snake.length > 1) {
          const nextHead = { x: snake[0].x + d.x, y: snake[0].y + d.y };
          if (nextHead.x === snake[1].x && nextHead.y === snake[1].y) return;
        }
        nextDir = d;
        e.preventDefault();
      }
    }

    window.addEventListener('keydown', handleKey);
    resetGame();

    return () => {
      window.removeEventListener('keydown', handleKey);
      if (moveTimer) clearInterval(moveTimer);
      app.destroy(true, { children: true });
    };
  }, [gameOver, gameStarted]);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
  };

  const restartGame = () => {
    setGameOver(false);
    setScore(0);
  };

  if (!gameStarted) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #2d5016 0%, #0f3460 50%, #16213e 100%)',
        fontFamily: 'Arial, sans-serif',
        padding: '1rem',
        overflowY: 'auto'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          maxWidth: '500px',
          width: '95%',
          textAlign: 'center',
          color: 'white',
          margin: '1rem auto'
        }}>
          <h1 style={{ 
            fontSize: '3rem', 
            marginBottom: '1rem',
            background: 'linear-gradient(45deg, #00ff00, #32ff7e)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 30px rgba(0, 255, 0, 0.5)'
          }}>
            🐍 SNAKE
          </h1>
          
          <p style={{ 
            fontSize: '1.1rem', 
            marginBottom: '1.5rem', 
            opacity: 0.9,
            lineHeight: '1.4'
          }}>
            ¡Come manzanas y haz crecer tu serpiente sin chocarte!
          </p>

          <div style={{ 
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            padding: '1.2rem',
            marginBottom: '1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{ 
              fontSize: '1.2rem', 
              marginBottom: '1rem',
              color: '#fff'
            }}>
              🎮 Controles
            </h3>
            <div style={{ 
              display: 'grid', 
              gap: '0.8rem',
              fontSize: '1rem',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ 
                  background: 'rgba(0, 255, 0, 0.2)',
                  padding: '0.3rem 0.8rem',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  minWidth: '60px',
                  textAlign: 'center',
                  border: '1px solid rgba(0, 255, 0, 0.4)',
                  fontSize: '0.9rem'
                }}>WASD</span>
                <span>Mover la serpiente en todas direcciones</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ 
                  background: 'rgba(0, 255, 0, 0.2)',
                  padding: '0.3rem 0.8rem',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  minWidth: '60px',
                  textAlign: 'center',
                  border: '1px solid rgba(0, 255, 0, 0.4)',
                  fontSize: '0.9rem'
                }}>↑↓←→</span>
                <span>También puedes usar las flechas</span>
              </div>
            </div>
          </div>

          <div style={{ 
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            padding: '1.2rem',
            marginBottom: '1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{ 
              fontSize: '1.2rem', 
              marginBottom: '1rem',
              color: '#fff'
            }}>
              🎯 Objetivo del Juego
            </h3>
            <div style={{ 
              fontSize: '0.95rem',
              textAlign: 'left',
              lineHeight: '1.4'
            }}>
              <p style={{ marginBottom: '0.5rem' }}>🍎 Come las manzanas rojas para crecer</p>
              <p style={{ marginBottom: '0.5rem' }}>🐍 Cada manzana aumenta tu puntuación</p>
              <p style={{ marginBottom: '0.5rem' }}>⚠️ No choques contra las paredes o tu cola</p>
              <p>🏆 ¡Consigue la puntuación más alta posible!</p>
            </div>
          </div>
          
          <button 
            onClick={startGame}
            style={{
              fontSize: '1.2rem',
              padding: '0.8rem 2rem',
              background: 'linear-gradient(45deg, #00ff00, #32ff7e)',
              color: '#1a1a2e',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(0, 255, 0, 0.3)',
              transition: 'all 0.3s ease',
              transform: 'translateY(0)',
              marginBottom: '1.5rem'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 255, 0, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 255, 0, 0.3)';
            }}
          >
            ▶️ Comenzar Aventura
          </button>

          <div style={{ 
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            padding: '1.2rem',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{ 
              fontSize: '1.2rem', 
              marginBottom: '1rem',
              color: '#fff'
            }}>
              💡 Consejos Pro
            </h3>
            <div style={{ 
              fontSize: '0.95rem',
              textAlign: 'left',
              lineHeight: '1.4'
            }}>
              <p style={{ marginBottom: '0.5rem' }}>• Planifica tus movimientos con anticipación</p>
              <p style={{ marginBottom: '0.5rem' }}>• Mantén espacio libre para maniobrar</p>
              <p>• ¡La serpiente no puede ir hacia atrás!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h1 style={{ color: '#ff4757', fontSize: '3rem', marginBottom: '1rem' }}>GAME OVER</h1>
        <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Puntuación Final: {score}</p>
        <button 
          onClick={restartGame}
          style={{
            fontSize: '1.2rem',
            padding: '1rem 2rem',
            backgroundColor: '#00ff00',
            color: 'black',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginRight: '1rem',
            fontWeight: 'bold'
          }}
        >
          🔄 Jugar de Nuevo
        </button>
        <button 
          onClick={() => window.history.back()}
          style={{
            fontSize: '1.2rem',
            padding: '1rem 2rem',
            backgroundColor: '#747d8c',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          🏠 Volver al Menú
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', padding: '1rem' }}>
      <h1 style={{ marginBottom: '1rem', color: '#00ff00' }}>🐍 Snake</h1>
      <div style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
        Puntuación: {score}
      </div>
      <div style={{ marginBottom: '1rem', color: '#666' }}>
        Usa las flechas o WASD para moverte
      </div>
      <div ref={containerRef} style={{ 
        display: 'inline-block',
        border: '3px solid #00ff00',
        borderRadius: '8px',
        overflow: 'hidden'
      }} />
    </div>
  );
};

export default Snake;
