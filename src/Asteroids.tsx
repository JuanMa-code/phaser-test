import * as PIXI from 'pixi.js';
import React, { useEffect, useRef } from 'react';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const SHIP_SIZE = 32;
const ASTEROID_SIZE = 48;
const BULLET_SIZE = 6;

function randomAsteroid() {
  const angle = Math.random() * Math.PI * 2;
  const speed = 2 + Math.random() * 2;
  return {
    x: Math.random() < 0.5 ? 0 : GAME_WIDTH,
    y: Math.random() * GAME_HEIGHT,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    angle,
  };
}

const Asteroids: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const app = new PIXI.Application({
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: 0x000000,
    });
    if (containerRef.current && app.view instanceof Node) {
      containerRef.current.appendChild(app.view);
    }

    // Ship
    const ship = new PIXI.Graphics();
    ship.beginFill(0xffffff);
    ship.moveTo(0, -SHIP_SIZE / 2);
    ship.lineTo(SHIP_SIZE / 2, SHIP_SIZE / 2);
    ship.lineTo(-SHIP_SIZE / 2, SHIP_SIZE / 2);
    ship.lineTo(0, -SHIP_SIZE / 2);
    ship.endFill();
    ship.x = GAME_WIDTH / 2;
    ship.y = GAME_HEIGHT / 2;
    app.stage.addChild(ship);

    let shipAngle = 0;
    let shipSpeed = 0;
    let bullets: { g: PIXI.Graphics; vx: number; vy: number }[] = [];
    let asteroids: { g: PIXI.Graphics; vx: number; vy: number }[] = [];
    let score = 0;
    let gameOver = false;

    for (let i = 0; i < 5; i++) {
      const a = randomAsteroid();
      const g = new PIXI.Graphics();
      g.beginFill(0x888888);
      g.drawCircle(0, 0, ASTEROID_SIZE / 2);
      g.endFill();
      g.x = a.x;
      g.y = a.y;
      app.stage.addChild(g);
      asteroids.push({ g, vx: a.vx, vy: a.vy });
    }

    function shoot() {
      if (gameOver) return;
      const angle = shipAngle - Math.PI / 2;
      const vx = Math.cos(angle) * 10;
      const vy = Math.sin(angle) * 10;
      const g = new PIXI.Graphics();
      g.beginFill(0xff0000);
      g.drawCircle(0, 0, BULLET_SIZE);
      g.endFill();
      g.x = ship.x;
      g.y = ship.y;
      app.stage.addChild(g);
      bullets.push({ g, vx, vy });
    }

    function resetGame() {
      bullets.forEach(b => app.stage.removeChild(b.g));
      asteroids.forEach(a => app.stage.removeChild(a.g));
      bullets = [];
      asteroids = [];
      score = 0;
      gameOver = false;
      ship.x = GAME_WIDTH / 2;
      ship.y = GAME_HEIGHT / 2;
      shipAngle = 0;
      shipSpeed = 0;
      for (let i = 0; i < 5; i++) {
        const a = randomAsteroid();
        const g = new PIXI.Graphics();
        g.beginFill(0x888888);
        g.drawCircle(0, 0, ASTEROID_SIZE / 2);
        g.endFill();
        g.x = a.x;
        g.y = a.y;
        app.stage.addChild(g);
        asteroids.push({ g, vx: a.vx, vy: a.vy });
      }
    }

    function update() {
      if (gameOver) return;
      // Ship movement
      ship.x += Math.cos(shipAngle - Math.PI / 2) * shipSpeed;
      ship.y += Math.sin(shipAngle - Math.PI / 2) * shipSpeed;
      ship.x = (ship.x + GAME_WIDTH) % GAME_WIDTH;
      ship.y = (ship.y + GAME_HEIGHT) % GAME_HEIGHT;
      ship.rotation = shipAngle;
      // Bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].g.x += bullets[i].vx;
        bullets[i].g.y += bullets[i].vy;
        if (
          bullets[i].g.x < 0 || bullets[i].g.x > GAME_WIDTH ||
          bullets[i].g.y < 0 || bullets[i].g.y > GAME_HEIGHT
        ) {
          app.stage.removeChild(bullets[i].g);
          bullets.splice(i, 1);
        }
      }
      // Asteroids
      for (let i = asteroids.length - 1; i >= 0; i--) {
        asteroids[i].g.x += asteroids[i].vx;
        asteroids[i].g.y += asteroids[i].vy;
        asteroids[i].g.x = (asteroids[i].g.x + GAME_WIDTH) % GAME_WIDTH;
        asteroids[i].g.y = (asteroids[i].g.y + GAME_HEIGHT) % GAME_HEIGHT;
      }
      // Bullet collision
      for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = asteroids.length - 1; j >= 0; j--) {
          const b = bullets[i], a = asteroids[j];
          if (
            Math.abs(b.g.x - a.g.x) < ASTEROID_SIZE / 2 &&
            Math.abs(b.g.y - a.g.y) < ASTEROID_SIZE / 2
          ) {
            app.stage.removeChild(a.g);
            app.stage.removeChild(b.g);
            asteroids.splice(j, 1);
            bullets.splice(i, 1);
            score++;
            break;
          }
        }
      }
      // Asteroid collision with ship
      for (const a of asteroids) {
        if (
          Math.abs(ship.x - a.g.x) < ASTEROID_SIZE / 2 &&
          Math.abs(ship.y - a.g.y) < ASTEROID_SIZE / 2
        ) {
          gameOver = true;
        }
      }
      // Win
      if (asteroids.length === 0) {
        gameOver = true;
      }
      // Draw score
      app.stage.children.filter(c => c instanceof PIXI.Text).forEach(c => app.stage.removeChild(c));
      const scoreText = new PIXI.Text(`Score: ${score}`, { fill: 0xffffff, fontSize: 32 });
      scoreText.x = 10;
      scoreText.y = 10;
      app.stage.addChild(scoreText);
      if (gameOver) {
        const overText = new PIXI.Text('Game Over! Pulsa espacio para reiniciar', { fill: 0xff0000, fontSize: 32 });
        overText.x = 200;
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
      if (!gameOver) {
        if (e.key === 'ArrowLeft') shipAngle -= 0.15;
        if (e.key === 'ArrowRight') shipAngle += 0.15;
        if (e.key === 'ArrowUp') shipSpeed = Math.min(shipSpeed + 0.5, 8);
        if (e.key === 'ArrowDown') shipSpeed = Math.max(shipSpeed - 0.5, 0);
        if (e.code === 'Space') shoot();
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

export default Asteroids;
