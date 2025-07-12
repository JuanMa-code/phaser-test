import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 200;

const Dino: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const app = new PIXI.Application({
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: 0xffffff,
    });
    if (containerRef.current && app.view instanceof Node) {
      containerRef.current.appendChild(app.view);
    }

    // Ground
    const ground = new PIXI.Graphics();
    ground.beginFill(0x888888);
    ground.drawRect(0, GAME_HEIGHT - 40, GAME_WIDTH, 4);
    ground.endFill();
    app.stage.addChild(ground);

    // Dino
    const dino = new PIXI.Graphics();
    dino.beginFill(0x222222);
    dino.drawRect(0, 0, 40, 40);
    dino.endFill();
    dino.x = 50;
    dino.y = GAME_HEIGHT - 80;
    app.stage.addChild(dino);

    // Obstacles
    let obstacles: PIXI.Graphics[] = [];
    let obstacleTimer = 0;
    let speed = 7;
    let isJumping = false;
    let velocityY = 0;
    let score = 0;
    let gameOver = false;

    function spawnObstacle() {
      const obs = new PIXI.Graphics();
      obs.beginFill(0x008800);
      obs.drawRect(0, 0, 20, 40);
      obs.endFill();
      obs.x = GAME_WIDTH;
      obs.y = GAME_HEIGHT - 80;
      app.stage.addChild(obs);
      obstacles.push(obs);
    }

    function resetGame() {
      obstacles.forEach(o => app.stage.removeChild(o));
      obstacles = [];
      dino.x = 50;
      dino.y = GAME_HEIGHT - 80;
      isJumping = false;
      velocityY = 0;
      score = 0;
      gameOver = false;
    }

    function update() {
      if (gameOver) return;
      obstacleTimer++;
      if (obstacleTimer > 60 + Math.random() * 60) {
        spawnObstacle();
        obstacleTimer = 0;
      }
      // Move obstacles
      for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= speed;
        if (obstacles[i].x < -20) {
          app.stage.removeChild(obstacles[i]);
          obstacles.splice(i, 1);
          score++;
        }
      }
      // Dino jump
      if (isJumping) {
        dino.y += velocityY;
        velocityY += 1.5;
        if (dino.y >= GAME_HEIGHT - 80) {
          dino.y = GAME_HEIGHT - 80;
          isJumping = false;
          velocityY = 0;
        }
      }
      // Collision
      for (const obs of obstacles) {
        if (
          dino.x + 40 > obs.x &&
          dino.x < obs.x + 20 &&
          dino.y + 40 > obs.y &&
          dino.y < obs.y + 40
        ) {
          gameOver = true;
        }
      }
      // Draw score
      app.stage.children.filter(c => c instanceof PIXI.Text).forEach(c => app.stage.removeChild(c));
      const scoreText = new PIXI.Text(`Score: ${score}`, { fill: 0x222222, fontSize: 24 });
      scoreText.x = 10;
      scoreText.y = 10;
      app.stage.addChild(scoreText);
      if (gameOver) {
        const overText = new PIXI.Text('Game Over! Pulsa espacio para reiniciar', { fill: 0xff0000, fontSize: 24 });
        overText.x = 200;
        overText.y = 80;
        app.stage.addChild(overText);
      }
    }

    app.ticker.add(update);

    const keydown = (e: KeyboardEvent) => {
      if (gameOver && e.code === 'Space') {
        resetGame();
        return;
      }
      if (!isJumping && !gameOver && (e.code === 'Space' || e.key === 'ArrowUp')) {
        isJumping = true;
        velocityY = -18;
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

export default Dino;
