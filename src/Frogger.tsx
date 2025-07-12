import * as PIXI from 'pixi.js';
import React, { useEffect, useRef } from 'react';

const COLS = 13;
const ROWS = 12;
const CELL_SIZE = 40;
const LANES = [
  { type: 'road', speed: 2, dir: 1, count: 3 },
  { type: 'road', speed: 3, dir: -1, count: 2 },
  { type: 'road', speed: 2, dir: 1, count: 2 },
  { type: 'water', speed: 2, dir: -1, count: 2 },
  { type: 'water', speed: 3, dir: 1, count: 3 },
  { type: 'water', speed: 2, dir: -1, count: 2 },
];

const Frogger: React.FC = () => {
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

    let frog = { x: Math.floor(COLS / 2), y: ROWS - 1 };
    let logs: { x: number; y: number; lane: number; }[] = [];
    let cars: { x: number; y: number; lane: number; }[] = [];
    let gameOver = false;
    let win = false;

    function resetGame() {
      frog = { x: Math.floor(COLS / 2), y: ROWS - 1 };
      logs = [];
      cars = [];
      gameOver = false;
      win = false;
      // Generate obstacles
      for (let l = 0; l < LANES.length; l++) {
        const lane = LANES[l];
        for (let i = 0; i < lane.count; i++) {
          const x = Math.floor(Math.random() * COLS);
          if (lane.type === 'road') {
            cars.push({ x, y: l + 2, lane: l });
          } else {
            logs.push({ x, y: l + 2, lane: l });
          }
        }
      }
      draw();
    }

    function draw() {
      app.stage.removeChildren();
      // Draw lanes
      for (let y = 0; y < ROWS; y++) {
        const g = new PIXI.Graphics();
        if (y === 0) {
          g.beginFill(0x00aa00); // Goal
        } else if (y === ROWS - 1) {
          g.beginFill(0x006600); // Start
        } else if (y >= 2 && y < 2 + LANES.length) {
          const lane = LANES[y - 2];
          g.beginFill(lane.type === 'road' ? 0x444444 : 0x3399ff);
        } else {
          g.beginFill(0x222222);
        }
        g.drawRect(0, 0, COLS * CELL_SIZE, CELL_SIZE);
        g.endFill();
        g.y = y * CELL_SIZE;
        app.stage.addChild(g);
      }
      // Draw logs
      logs.forEach(log => {
        const g = new PIXI.Graphics();
        g.beginFill(0x996633);
        g.drawRect(0, 0, CELL_SIZE * 2, CELL_SIZE - 8);
        g.endFill();
        g.x = log.x * CELL_SIZE;
        g.y = log.y * CELL_SIZE + 4;
        app.stage.addChild(g);
      });
      // Draw cars
      cars.forEach(car => {
        const g = new PIXI.Graphics();
        g.beginFill(0xff3333);
        g.drawRect(0, 0, CELL_SIZE - 4, CELL_SIZE - 8);
        g.endFill();
        g.x = car.x * CELL_SIZE + 2;
        g.y = car.y * CELL_SIZE + 4;
        app.stage.addChild(g);
      });
      // Draw frog
      const frogG = new PIXI.Graphics();
      frogG.beginFill(0x00ff00);
      frogG.drawCircle(CELL_SIZE / 2, CELL_SIZE / 2, CELL_SIZE / 2.2);
      frogG.endFill();
      frogG.x = frog.x * CELL_SIZE;
      frogG.y = frog.y * CELL_SIZE;
      app.stage.addChild(frogG);
      // Game Over / Win
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
      if (win) {
        const msg = '¡Has ganado! Pulsa espacio para reiniciar';
        const winText = new PIXI.Text(msg, { fill: 0x00aa00, fontSize: 24 });
        const textWidth = winText.width;
        const textHeight = winText.height;
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
        winText.x = (COLS * CELL_SIZE - textWidth) / 2;
        winText.y = (ROWS * CELL_SIZE - textHeight) / 2;
        app.stage.addChild(winText);
      }
    }

    function moveObstacles() {
      // Move logs
      logs.forEach(log => {
        const lane = LANES[log.lane];
        log.x += lane.speed * lane.dir * 0.04;
        if (log.x < -2) log.x = COLS;
        if (log.x > COLS) log.x = -2;
      });
      // Move cars
      cars.forEach(car => {
        const lane = LANES[car.lane];
        car.x += lane.speed * lane.dir * 0.04;
        if (car.x < -1) car.x = COLS;
        if (car.x > COLS) car.x = -1;
      });
    }

    function checkCollisions() {
      // Car collision
      if (cars.some(car => Math.round(car.x) === frog.x && car.y === frog.y)) {
        gameOver = true;
        draw();
        return;
      }
      // Water collision (solo pierde si no está sobre un tronco)
      const laneIdx = frog.y - 2;
      if (laneIdx >= 0 && laneIdx < LANES.length && LANES[laneIdx].type === 'water') {
        // La rana solo pierde si no está sobre ningún tronco en esa celda
        let onLog = false;
        for (const log of logs) {
          const logStart = Math.floor(log.x);
          const logEnd = logStart + 1; // tronco ocupa 2 celdas
          if (log.y === frog.y && frog.x >= logStart && frog.x <= logEnd) {
            onLog = true;
            break;
          }
        }
        if (!onLog) {
          gameOver = true;
          draw();
          return;
        }
      }
      // Win
      if (frog.y === 0) {
        win = true;
        draw();
        return;
      }
    }

    function handleKey(e: KeyboardEvent) {
      if ((gameOver || win) && e.code === 'Space') {
        resetGame();
        return;
      }
      if (gameOver || win) return;
      if (e.key === 'ArrowUp' && frog.y > 0) frog.y--;
      if (e.key === 'ArrowDown' && frog.y < ROWS - 1) frog.y++;
      if (e.key === 'ArrowLeft' && frog.x > 0) frog.x--;
      if (e.key === 'ArrowRight' && frog.x < COLS - 1) frog.x++;
      checkCollisions();
      draw();
    }

    let animId: number;
    function animate() {
      if (!gameOver && !win) {
        moveObstacles();
        checkCollisions();
        draw();
      }
      animId = requestAnimationFrame(animate);
    }

    window.addEventListener('keydown', handleKey);
    resetGame();
    animate();

    return () => {
      window.removeEventListener('keydown', handleKey);
      cancelAnimationFrame(animId);
      app.destroy(true, { children: true });
    };
  }, []);

  return <div ref={containerRef} style={{ width: COLS * CELL_SIZE, height: ROWS * CELL_SIZE + 48, margin: 'auto' }} />;
};

export default Frogger;
