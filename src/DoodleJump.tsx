import * as PIXI from 'pixi.js';
import React, { useEffect, useRef } from 'react';

const WIDTH = 400;
const HEIGHT = 600;
const PLATFORM_WIDTH = 68;
const PLATFORM_HEIGHT = 16;
const PLAYER_SIZE = 32;
const GRAVITY = 0.4;
const JUMP_VELOCITY = -10;
const PLATFORM_COUNT = 8;

interface Platform {
  x: number;
  y: number;
}

const DoodleJump: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const app = new PIXI.Application({
      width: WIDTH,
      height: HEIGHT,
      backgroundColor: 0xeeeeee,
    });
    if (containerRef.current && app.view instanceof Node) {
      containerRef.current.appendChild(app.view);
    }

    let player = { x: WIDTH / 2 - PLAYER_SIZE / 2, y: HEIGHT - PLAYER_SIZE - 10, vy: 0 };
    let platforms: Platform[] = [];
    let score = 0;
    let gameOver = false;
    let win = false;

    function resetGame() {
      player = { x: WIDTH / 2 - PLAYER_SIZE / 2, y: HEIGHT - PLAYER_SIZE - 10, vy: 0 };
      platforms = [];
      score = 0;
      gameOver = false;
      win = false;
      // Plataforma fija justo debajo del jugador
      platforms.push({
        x: player.x + PLAYER_SIZE / 2 - PLATFORM_WIDTH / 2,
        y: player.y + PLAYER_SIZE + 2,
      });
      // El resto aleatorias
      for (let i = 1; i < PLATFORM_COUNT; i++) {
        platforms.push({
          x: Math.random() * (WIDTH - PLATFORM_WIDTH),
          y: HEIGHT - i * (HEIGHT / PLATFORM_COUNT) - PLATFORM_HEIGHT,
        });
      }
      draw();
    }

    function draw() {
      app.stage.removeChildren();
      // Draw platforms
      platforms.forEach(p => {
        const g = new PIXI.Graphics();
        g.beginFill(0x00bfff);
        g.drawRect(0, 0, PLATFORM_WIDTH, PLATFORM_HEIGHT);
        g.endFill();
        g.x = p.x;
        g.y = p.y;
        app.stage.addChild(g);
      });
      // Draw player
      const doodle = new PIXI.Graphics();
      doodle.beginFill(0x00ff00);
      doodle.drawEllipse(PLAYER_SIZE / 2, PLAYER_SIZE / 2, PLAYER_SIZE / 2, PLAYER_SIZE / 2);
      doodle.endFill();
      doodle.x = player.x;
      doodle.y = player.y;
      app.stage.addChild(doodle);
      // Score
      const scoreText = new PIXI.Text(`Score: ${score}`, { fill: '#222', fontSize: 18 });
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
          (WIDTH - textWidth) / 2 - bgPadding,
          (HEIGHT - textHeight) / 2 - bgPadding,
          textWidth + bgPadding * 2,
          textHeight + bgPadding * 2
        );
        bg.endFill();
        app.stage.addChild(bg);
        overText.x = (WIDTH - textWidth) / 2;
        overText.y = (HEIGHT - textHeight) / 2;
        app.stage.addChild(overText);
      }
    }

    function update() {
      if (gameOver) return;
      player.y += player.vy;
      player.vy += GRAVITY;
      // Move left/right solo si no has perdido
      if (!gameOver) {
        if (leftPressed) player.x -= 5;
        if (rightPressed) player.x += 5;
      }
      // Wrap
      if (player.x < -PLAYER_SIZE) player.x = WIDTH;
      if (player.x > WIDTH) player.x = -PLAYER_SIZE;
      // Collision with platforms
      if (player.vy > 0) {
        for (const p of platforms) {
          if (
            player.x + PLAYER_SIZE > p.x &&
            player.x < p.x + PLATFORM_WIDTH &&
            player.y + PLAYER_SIZE > p.y &&
            player.y + PLAYER_SIZE < p.y + PLATFORM_HEIGHT + 8
          ) {
            player.vy = JUMP_VELOCITY;
            score++;
          }
        }
      }
      // Scroll platforms up if player is high
      if (player.y < HEIGHT / 2) {
        const dy = HEIGHT / 2 - player.y;
        player.y = HEIGHT / 2;
        platforms.forEach(p => {
          p.y += dy;
          if (p.y > HEIGHT) {
            p.x = Math.random() * (WIDTH - PLATFORM_WIDTH);
            p.y = 0;
          }
        });
      }
      // Game over
      if (player.y > HEIGHT) {
        gameOver = true;
      }
      draw();
    }

    let leftPressed = false;
    let rightPressed = false;
    function handleKey(e: KeyboardEvent) {
      if (gameOver && e.code === 'Space') {
        resetGame();
        return;
      }
      if (gameOver) {
        leftPressed = false;
        rightPressed = false;
        return;
      }
      if (e.code === 'ArrowLeft') leftPressed = e.type === 'keydown';
      if (e.code === 'ArrowRight') rightPressed = e.type === 'keydown';
    }

    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKey);
    resetGame();

    let animId: number;
    function animate() {
      update();
      animId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKey);
      cancelAnimationFrame(animId);
      app.destroy(true, { children: true });
    };
  }, []);

  return <div ref={containerRef} style={{ width: WIDTH, height: HEIGHT + 48, margin: 'auto' }} />;
};

export default DoodleJump;
