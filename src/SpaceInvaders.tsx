import * as PIXI from 'pixi.js';
import React, { useEffect, useRef } from 'react';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 20;
const INVADER_SIZE = 32;
const BULLET_SIZE = 8;
const INVADER_ROWS = 4;
const INVADER_COLS = 10;

const SpaceInvaders: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const app = new PIXI.Application({
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: 0x000022,
    });
    if (containerRef.current && app.view instanceof Node) {
      containerRef.current.appendChild(app.view);
    }

    // Player
    const player = new PIXI.Graphics();
    player.beginFill(0x00ff00);
    player.drawRect(-PLAYER_WIDTH / 2, -PLAYER_HEIGHT / 2, PLAYER_WIDTH, PLAYER_HEIGHT);
    player.endFill();
    player.x = GAME_WIDTH / 2;
    player.y = GAME_HEIGHT - 40;
    app.stage.addChild(player);

    // Invaders
    let invaders: PIXI.Graphics[] = [];
    let invaderDir = 1;
    let invaderStep = 20;
    let invaderSpeed = 1.5;
    for (let row = 0; row < INVADER_ROWS; row++) {
      for (let col = 0; col < INVADER_COLS; col++) {
        const invader = new PIXI.Graphics();
        invader.beginFill(0xffffff);
        invader.drawRect(-INVADER_SIZE / 2, -INVADER_SIZE / 2, INVADER_SIZE, INVADER_SIZE);
        invader.endFill();
        invader.x = 80 + col * 60;
        invader.y = 60 + row * 50;
        app.stage.addChild(invader);
        invaders.push(invader);
      }
    }

    // Bullets
    let bullets: PIXI.Graphics[] = [];
    let bulletSpeed = 8;
    let canShoot = true;
    let score = 0;
    let gameOver = false;

    function shoot() {
      if (!canShoot || gameOver) return;
      const bullet = new PIXI.Graphics();
      bullet.beginFill(0xff0000);
      bullet.drawRect(-BULLET_SIZE / 2, -BULLET_SIZE / 2, BULLET_SIZE, BULLET_SIZE);
      bullet.endFill();
      bullet.x = player.x;
      bullet.y = player.y - PLAYER_HEIGHT / 2;
      app.stage.addChild(bullet);
      bullets.push(bullet);
      canShoot = false;
      setTimeout(() => { canShoot = true; }, 200);
    }

    function resetGame() {
      invaders.forEach(i => app.stage.removeChild(i));
      bullets.forEach(b => app.stage.removeChild(b));
      invaders = [];
      bullets = [];
      score = 0;
      gameOver = false;
      for (let row = 0; row < INVADER_ROWS; row++) {
        for (let col = 0; col < INVADER_COLS; col++) {
          const invader = new PIXI.Graphics();
          invader.beginFill(0xffffff);
          invader.drawRect(-INVADER_SIZE / 2, -INVADER_SIZE / 2, INVADER_SIZE, INVADER_SIZE);
          invader.endFill();
          invader.x = 80 + col * 60;
          invader.y = 60 + row * 50;
          app.stage.addChild(invader);
          invaders.push(invader);
        }
      }
      player.x = GAME_WIDTH / 2;
    }

    function update() {
      if (gameOver) return;
      // Move invaders
      let edge = false;
      for (const invader of invaders) {
        invader.x += invaderDir * invaderSpeed;
        if (invader.x < 40 || invader.x > GAME_WIDTH - 40) edge = true;
      }
      if (edge) {
        invaderDir *= -1;
        for (const invader of invaders) {
          invader.y += invaderStep;
        }
      }
      // Move bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bulletSpeed;
        if (bullets[i].y < 0) {
          app.stage.removeChild(bullets[i]);
          bullets.splice(i, 1);
        }
      }
      // Bullet collision
      for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = invaders.length - 1; j >= 0; j--) {
          const b = bullets[i], inv = invaders[j];
          if (
            Math.abs(b.x - inv.x) < INVADER_SIZE / 2 &&
            Math.abs(b.y - inv.y) < INVADER_SIZE / 2
          ) {
            app.stage.removeChild(inv);
            app.stage.removeChild(b);
            invaders.splice(j, 1);
            bullets.splice(i, 1);
            score++;
            break;
          }
        }
      }
      // Invader reach player
      for (const inv of invaders) {
        if (inv.y > GAME_HEIGHT - 80) {
          gameOver = true;
        }
      }
      // Win
      if (invaders.length === 0) {
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
        if (e.key === 'ArrowLeft') player.x -= 20;
        if (e.key === 'ArrowRight') player.x += 20;
        player.x = Math.max(PLAYER_WIDTH / 2, Math.min(GAME_WIDTH - PLAYER_WIDTH / 2, player.x));
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

export default SpaceInvaders;
