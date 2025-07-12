import * as PIXI from 'pixi.js';
import React, { useEffect, useRef } from 'react';

const GAME_WIDTH = 600;
const GAME_HEIGHT = 400;
const MOLE_SIZE = 60;
const MOLE_POSITIONS = [
  { x: 100, y: 100 },
  { x: 300, y: 100 },
  { x: 500, y: 100 },
  { x: 200, y: 300 },
  { x: 400, y: 300 },
];

const WhacAMole: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const app = new PIXI.Application({
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: 0x228b22,
    });
    if (containerRef.current && app.view instanceof Node) {
      containerRef.current.appendChild(app.view);
    }

    let score = 0;
    let moleIndex = -1;
    let mole: PIXI.Graphics | null = null;
    let gameOver = false;
    let timeLeft = 30 * 60; // 30 segundos (60 ticks por segundo)

    function showMole() {
      if (mole) app.stage.removeChild(mole);
      moleIndex = Math.floor(Math.random() * MOLE_POSITIONS.length);
      const pos = MOLE_POSITIONS[moleIndex];
      mole = new PIXI.Graphics();
      mole.beginFill(0x8b4513);
      mole.drawCircle(0, 0, MOLE_SIZE / 2);
      mole.endFill();
      mole.x = pos.x;
      mole.y = pos.y;
      app.stage.addChild(mole);
    }

    function hideMole() {
      if (mole) {
        app.stage.removeChild(mole);
        mole = null;
        moleIndex = -1;
      }
    }

    function drawUI() {
      app.stage.children.filter(c => c instanceof PIXI.Text).forEach(c => app.stage.removeChild(c));
      const scoreText = new PIXI.Text(`Score: ${score}`, { fill: 0xffffff, fontSize: 32 });
      scoreText.x = 10;
      scoreText.y = 10;
      app.stage.addChild(scoreText);
      const timeText = new PIXI.Text(`Tiempo: ${Math.ceil(timeLeft / 60)}`, { fill: 0xffffff, fontSize: 28 });
      timeText.x = 400;
      timeText.y = 10;
      app.stage.addChild(timeText);
      if (gameOver) {
        const overText = new PIXI.Text('¡Fin del juego! Pulsa espacio para reiniciar', { fill: 0xff0000, fontSize: 28 });
        overText.x = 60;
        overText.y = GAME_HEIGHT / 2 - 30;
        app.stage.addChild(overText);
      }
    }

    function update() {
      if (gameOver) return;
      timeLeft--;
      if (timeLeft % 60 === 0) showMole();
      if (timeLeft <= 0) {
        gameOver = true;
        hideMole();
      }
      drawUI();
    }

    app.ticker.add(update);

    function onClick(e: MouseEvent) {
      if (gameOver) return;
      if (!mole) return;
      if (!(app.view instanceof HTMLCanvasElement)) return;
      const rect = app.view.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const pos = MOLE_POSITIONS[moleIndex];
      const dx = mouseX - pos.x;
      const dy = mouseY - pos.y;
      if (dx * dx + dy * dy < (MOLE_SIZE / 2) * (MOLE_SIZE / 2)) {
        score++;
        hideMole();
        showMole();
      }
    }
    if (app.view instanceof HTMLCanvasElement) {
      app.view.addEventListener('mousedown', onClick as EventListener);
    }

    const keydown = (e: KeyboardEvent) => {
      if (gameOver && e.code === 'Space') {
        score = 0;
        timeLeft = 30 * 60;
        gameOver = false;
        showMole();
      }
    };
    window.addEventListener('keydown', keydown);

    showMole();
    drawUI();

    return () => {
      window.removeEventListener('keydown', keydown);
      if (app.view instanceof HTMLCanvasElement) {
        app.view.removeEventListener('mousedown', onClick as EventListener);
      }
      app.destroy(true, { children: true });
    };
  }, []);

  return <div ref={containerRef} style={{ width: GAME_WIDTH, height: GAME_HEIGHT, margin: 'auto' }} />;
};

export default WhacAMole;
