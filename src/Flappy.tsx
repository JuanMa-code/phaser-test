import * as PIXI from 'pixi.js';
import React, { useEffect, useRef } from 'react';

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;

const Flappy: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const app = new PIXI.Application({
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: 0x87ceeb,
    });
    if (containerRef.current && app.view instanceof Node) {
      containerRef.current.appendChild(app.view);
    }

    // Bird
    const bird = new PIXI.Graphics();
    bird.beginFill(0xffff00);
    bird.drawCircle(0, 0, 20);
    bird.endFill();
    bird.x = 100;
    bird.y = GAME_HEIGHT / 2;
    app.stage.addChild(bird);

    let velocityY = 0;
    let gravity = 1.2;
    let pipes: { top: PIXI.Graphics; bottom: PIXI.Graphics; x: number }[] = [];
    let pipeTimer = 0;
    let score = 0;
    let gameOver = false;

    function spawnPipe() {
      const gap = 120;
      const topHeight = Math.floor(Math.random() * (GAME_HEIGHT - gap - 100)) + 50;
      const bottomY = topHeight + gap;
      const bottomHeight = GAME_HEIGHT - bottomY;
      const topPipe = new PIXI.Graphics();
      topPipe.beginFill(0x228b22);
      topPipe.drawRect(0, 0, 60, topHeight);
      topPipe.endFill();
      topPipe.x = GAME_WIDTH;
      topPipe.y = 0;
      app.stage.addChild(topPipe);
      const bottomPipe = new PIXI.Graphics();
      bottomPipe.beginFill(0x228b22);
      bottomPipe.drawRect(0, 0, 60, bottomHeight);
      bottomPipe.endFill();
      bottomPipe.x = GAME_WIDTH;
      bottomPipe.y = bottomY;
      app.stage.addChild(bottomPipe);
      pipes.push({ top: topPipe, bottom: bottomPipe, x: GAME_WIDTH });
    }

    function resetGame() {
      pipes.forEach(p => {
        app.stage.removeChild(p.top);
        app.stage.removeChild(p.bottom);
      });
      pipes = [];
      bird.x = 100;
      bird.y = GAME_HEIGHT / 2;
      velocityY = 0;
      score = 0;
      gameOver = false;
    }

    function update() {
      if (gameOver) return;
      pipeTimer++;
      if (pipeTimer > 90) {
        spawnPipe();
        pipeTimer = 0;
      }
      // Move pipes
      for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= 4;
        pipes[i].top.x = pipes[i].x;
        pipes[i].bottom.x = pipes[i].x;
        if (pipes[i].x < -60) {
          app.stage.removeChild(pipes[i].top);
          app.stage.removeChild(pipes[i].bottom);
          pipes.splice(i, 1);
          score++;
        }
      }
      // Bird physics
      bird.y += velocityY;
      velocityY += gravity;
      // Collision
      if (bird.y < 0 || bird.y > GAME_HEIGHT) gameOver = true;
      for (const p of pipes) {
        if (
          bird.x + 20 > p.x && bird.x - 20 < p.x + 60 &&
          (bird.y - 20 < p.top.height || bird.y + 20 > p.bottom.y)
        ) {
          gameOver = true;
        }
      }
      // Draw score
      app.stage.children.filter(c => c instanceof PIXI.Text).forEach(c => app.stage.removeChild(c));
      const scoreText = new PIXI.Text(`Score: ${score}`, { fill: 0x222222, fontSize: 32 });
      scoreText.x = 10;
      scoreText.y = 10;
      app.stage.addChild(scoreText);
      if (gameOver) {
        const overText = new PIXI.Text('Game Over! Pulsa espacio para reiniciar', { fill: 0xff0000, fontSize: 28 });
        overText.x = 40;
        overText.y = GAME_HEIGHT / 2 - 30;
        app.stage.addChild(overText);
      }
    }

    app.ticker.add(update);

    const keydown = (e: KeyboardEvent) => {
      if (gameOver && e.code === 'Space') {
        resetGame();
        return;
      }
      if (!gameOver && (e.code === 'Space' || e.key === 'ArrowUp')) {
        velocityY = -13;
      }
    };
    window.addEventListener('keydown', keydown);

    return () => {
      window.removeEventListener('keydown', keydown);
      app.destroy(true, { children: true });
    };
  }, []);

  return <div ref={containerRef} style={{ width: GAME_WIDTH, height: GAME_HEIGHT, margin: 'auto' }} />;
};

export default Flappy;
