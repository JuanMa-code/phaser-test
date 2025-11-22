import * as PIXI from 'pixi.js';
import React, { useEffect, useRef, useState } from 'react';
import GameStartScreen from '../components/GameStartScreen';
import GameOverScreen from '../components/GameOverScreen';

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
      <GameStartScreen
        title="🐍 SNAKE"
        description="¡Come manzanas y haz crecer tu serpiente sin chocarte!"
        instructions={[
          {
            title: 'Controles',
            items: [
              'WASD: Mover en todas direcciones',
              '↑↓←→: También puedes usar las flechas'
            ],
            icon: '🎮'
          },
          {
            title: 'Objetivo',
            items: [
              '🍎 Come las manzanas rojas para crecer',
              '⚠️ No choques contra las paredes o tu cola'
            ],
            icon: '🎯'
          },
          {
            title: 'Consejos',
            items: [
              'Planifica tus movimientos',
              'Mantén espacio libre',
              '¡La serpiente no puede ir hacia atrás!'
            ],
            icon: '💡'
          }
        ]}
        onStart={startGame}
        theme={{
          primary: '#00ff00',
          secondary: '#32ff7e',
          accent: '#32ff7e',
          background: 'linear-gradient(135deg, #2d5016 0%, #0f3460 50%, #16213e 100%)'
        }}
      />
    );
  }

  if (gameOver) {
    return (
      <GameOverScreen
        score={score}
        onRestart={restartGame}
        onMenu={() => window.history.back()}
        theme={{
          primary: '#00ff00',
          secondary: '#32ff7e',
          accent: '#32ff7e',
          background: 'linear-gradient(135deg, #2d5016 0%, #0f3460 50%, #16213e 100%)'
        }}
      />
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
