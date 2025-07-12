import * as PIXI from 'pixi.js';
import React, { useEffect, useRef } from 'react';

const COLS = 20;
const ROWS = 15;
const CELL_SIZE = 32;
const SPEED = 120; // ms por movimiento

const DIRS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

const Snake: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);

  useEffect(() => {
    const app = new PIXI.Application({
      width: COLS * CELL_SIZE,
      height: ROWS * CELL_SIZE,
      backgroundColor: 0x222222,
    });
    appRef.current = app;
    if (containerRef.current && app.view instanceof Node) {
      containerRef.current.appendChild(app.view);
    }

    let snake: { x: number; y: number }[] = [];
    let dir = DIRS['ArrowRight'];
    let nextDir = dir;
    let food = { x: 0, y: 0 };
    let gameOver = false;
    let score = 0;
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
      score = 0;
      gameOver = false;
      placeFood();
      draw();
      if (moveTimer) clearInterval(moveTimer);
      moveTimer = window.setInterval(move, SPEED);
    }

    function move() {
      if (gameOver) return;
      dir = nextDir;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      // Check collision
      if (
        head.x < 0 || head.x >= COLS ||
        head.y < 0 || head.y >= ROWS ||
        snake.some(s => s.x === head.x && s.y === head.y)
      ) {
        gameOver = true;
        draw();
        return;
      }
      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        score++;
        placeFood();
      } else {
        snake.pop();
      }
      draw();
    }

    function draw() {
      app.stage.removeChildren();
      // Draw snake
      snake.forEach((s, i) => {
        const g = new PIXI.Graphics();
        g.beginFill(i === 0 ? 0x00ff00 : 0x009900);
        g.drawRect(0, 0, CELL_SIZE, CELL_SIZE);
        g.endFill();
        g.x = s.x * CELL_SIZE;
        g.y = s.y * CELL_SIZE;
        app.stage.addChild(g);
      });
      // Draw food
      const f = new PIXI.Graphics();
      f.beginFill(0xff0000);
      f.drawCircle(CELL_SIZE / 2, CELL_SIZE / 2, CELL_SIZE / 2.2);
      f.endFill();
      f.x = food.x * CELL_SIZE;
      f.y = food.y * CELL_SIZE;
      app.stage.addChild(f);
      // Score
      const scoreText = new PIXI.Text(`Score: ${score}`, { fill: '#fff', fontSize: 18 });
      scoreText.x = 8;
      scoreText.y = 8;
      app.stage.addChild(scoreText);
      // Game Over
      if (gameOver) {
        const msg = 'Game Over! Pulsa espacio para reiniciar';
        const overText = new PIXI.Text(msg, { fill: '#ff0000', fontSize: 24 });
        const textWidth = overText.width;
        const textHeight = overText.height;
        const bgPadding = 16;
        const bg = new PIXI.Graphics();
        bg.beginFill(0xffffff, 0.85);
        bg.drawRect(
          (COLS * CELL_SIZE - textWidth) / 2 - bgPadding,
          (ROWS * CELL_SIZE - textHeight) / 2 - bgPadding,
          textWidth + bgPadding * 2,
          textHeight + bgPadding * 2
        );
        bg.endFill();
        app.stage.addChild(bg);
        overText.x = (COLS * CELL_SIZE - textWidth) / 2;
        overText.y = (ROWS * CELL_SIZE - textHeight) / 2;
        app.stage.addChild(overText);
      }
    }

    function handleKey(e: KeyboardEvent) {
      if (gameOver && e.code === 'Space') {
        resetGame();
        return;
      }
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        const d = DIRS[e.key as keyof typeof DIRS];
        // Prevent reverse
        if (snake.length > 1) {
          const nextHead = { x: snake[0].x + d.x, y: snake[0].y + d.y };
          if (nextHead.x === snake[1].x && nextHead.y === snake[1].y) return;
        }
        nextDir = d;
      }
    }

    window.addEventListener('keydown', handleKey);
    resetGame();

    return () => {
      window.removeEventListener('keydown', handleKey);
      if (moveTimer) clearInterval(moveTimer);
      app.destroy(true, { children: true });
    };
  }, []);

  return <div ref={containerRef} style={{ width: COLS * CELL_SIZE, height: ROWS * CELL_SIZE + 48, margin: 'auto' }} />;
};

export default Snake;
