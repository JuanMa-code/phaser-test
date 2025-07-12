import * as PIXI from 'pixi.js';
import React, { useEffect, useRef, useState } from 'react';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_SPEED = 4;
const BULLET_SPEED = 8;
const ENEMY_SPEED = 1;
const SPAWN_RATE = 120; // frames entre spawns

interface Player {
  x: number;
  y: number;
  radius: number;
}

interface Enemy {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  radius: number;
  alive: boolean;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

const Brotato: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  
  const gameRef = useRef({
    player: { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2, radius: 15 } as Player,
    enemies: [] as Enemy[],
    bullets: [] as Bullet[],
    keys: {
      w: false,
      a: false,
      s: false,
      d: false,
    },
    mouseX: 0,
    mouseY: 0,
    spawnTimer: 0,
    currentScore: 0,
    shootCooldown: 0,
  });

  useEffect(() => {
    if (gameOver) return;

    const app = new PIXI.Application({
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: 0x1a1a2e,
    });

    if (containerRef.current && app.view instanceof Node) {
      containerRef.current.appendChild(app.view);
    }

    function drawGame() {
      // Clear stage
      app.stage.removeChildren();

      // Draw player
      const player = new PIXI.Graphics();
      player.beginFill(0x4dabf7);
      player.drawCircle(gameRef.current.player.x, gameRef.current.player.y, gameRef.current.player.radius);
      player.endFill();
      // Player direction indicator
      const dx = gameRef.current.mouseX - gameRef.current.player.x;
      const dy = gameRef.current.mouseY - gameRef.current.player.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length > 0) {
        const normalizedX = dx / length;
        const normalizedY = dy / length;
        player.lineStyle(3, 0xffffff);
        player.moveTo(gameRef.current.player.x, gameRef.current.player.y);
        player.lineTo(
          gameRef.current.player.x + normalizedX * 25,
          gameRef.current.player.y + normalizedY * 25
        );
      }
      app.stage.addChild(player);

      // Draw enemies
      gameRef.current.enemies.forEach(enemy => {
        if (!enemy.alive) return;
        
        const enemyGraphic = new PIXI.Graphics();
        enemyGraphic.beginFill(0xff4757);
        enemyGraphic.drawCircle(enemy.x, enemy.y, enemy.radius);
        enemyGraphic.endFill();
        
        // HP bar
        const hpBarWidth = 30;
        const hpBarHeight = 4;
        const hpPercentage = enemy.hp / enemy.maxHp;
        
        enemyGraphic.beginFill(0x333333);
        enemyGraphic.drawRect(enemy.x - hpBarWidth/2, enemy.y - enemy.radius - 10, hpBarWidth, hpBarHeight);
        enemyGraphic.endFill();
        
        enemyGraphic.beginFill(0xff6b6b);
        enemyGraphic.drawRect(enemy.x - hpBarWidth/2, enemy.y - enemy.radius - 10, hpBarWidth * hpPercentage, hpBarHeight);
        enemyGraphic.endFill();
        
        app.stage.addChild(enemyGraphic);
      });

      // Draw bullets
      gameRef.current.bullets.forEach(bullet => {
        const bulletGraphic = new PIXI.Graphics();
        bulletGraphic.beginFill(0xfeca57);
        bulletGraphic.drawCircle(bullet.x, bullet.y, bullet.radius);
        bulletGraphic.endFill();
        app.stage.addChild(bulletGraphic);
      });

      // Draw UI
      const scoreText = new PIXI.Text(`Score: ${gameRef.current.currentScore}`, {
        fill: 0xffffff,
        fontSize: 20,
        fontWeight: 'bold'
      });
      scoreText.x = 10;
      scoreText.y = 10;
      app.stage.addChild(scoreText);

      const enemyCount = new PIXI.Text(`Enemies: ${gameRef.current.enemies.filter(e => e.alive).length}`, {
        fill: 0xffffff,
        fontSize: 16,
      });
      enemyCount.x = 10;
      enemyCount.y = 40;
      app.stage.addChild(enemyCount);
    }

    function spawnEnemy() {
      const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
      let x, y;

      switch (side) {
        case 0: // top
          x = Math.random() * GAME_WIDTH;
          y = -20;
          break;
        case 1: // right
          x = GAME_WIDTH + 20;
          y = Math.random() * GAME_HEIGHT;
          break;
        case 2: // bottom
          x = Math.random() * GAME_WIDTH;
          y = GAME_HEIGHT + 20;
          break;
        case 3: // left
          x = -20;
          y = Math.random() * GAME_HEIGHT;
          break;
        default:
          x = 0;
          y = 0;
      }

      gameRef.current.enemies.push({
        x,
        y,
        hp: 3,
        maxHp: 3,
        radius: 12,
        alive: true,
      });
    }

    function updateGame() {
      const player = gameRef.current.player;
      const keys = gameRef.current.keys;

      // Move player
      if (keys.w && player.y > player.radius) player.y -= PLAYER_SPEED;
      if (keys.s && player.y < GAME_HEIGHT - player.radius) player.y += PLAYER_SPEED;
      if (keys.a && player.x > player.radius) player.x -= PLAYER_SPEED;
      if (keys.d && player.x < GAME_WIDTH - player.radius) player.x += PLAYER_SPEED;

      // Auto-shoot
      gameRef.current.shootCooldown = Math.max(0, gameRef.current.shootCooldown - 1);
      if (gameRef.current.shootCooldown === 0) {
        const dx = gameRef.current.mouseX - player.x;
        const dy = gameRef.current.mouseY - player.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length > 0) {
          const normalizedX = dx / length;
          const normalizedY = dy / length;
          
          gameRef.current.bullets.push({
            x: player.x,
            y: player.y,
            vx: normalizedX * BULLET_SPEED,
            vy: normalizedY * BULLET_SPEED,
            radius: 4,
          });
          
          gameRef.current.shootCooldown = 15; // shoot every 15 frames
        }
      }

      // Move bullets
      gameRef.current.bullets = gameRef.current.bullets.filter(bullet => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        
        // Remove bullets that go off-screen
        return bullet.x > -10 && bullet.x < GAME_WIDTH + 10 && 
               bullet.y > -10 && bullet.y < GAME_HEIGHT + 10;
      });

      // Move enemies towards player
      gameRef.current.enemies.forEach(enemy => {
        if (!enemy.alive) return;
        
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length > 0) {
          const normalizedX = dx / length;
          const normalizedY = dy / length;
          
          enemy.x += normalizedX * ENEMY_SPEED;
          enemy.y += normalizedY * ENEMY_SPEED;
        }
      });

      // Check bullet-enemy collisions
      gameRef.current.bullets = gameRef.current.bullets.filter(bullet => {
        let bulletHit = false;
        
        gameRef.current.enemies.forEach(enemy => {
          if (!enemy.alive) return;
          
          const dx = bullet.x - enemy.x;
          const dy = bullet.y - enemy.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < bullet.radius + enemy.radius) {
            enemy.hp--;
            bulletHit = true;
            
            if (enemy.hp <= 0) {
              enemy.alive = false;
              gameRef.current.currentScore += 10;
              setScore(gameRef.current.currentScore);
            }
          }
        });
        
        return !bulletHit;
      });

      // Check player-enemy collisions
      gameRef.current.enemies.forEach(enemy => {
        if (!enemy.alive) return;
        
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < player.radius + enemy.radius) {
          setGameOver(true);
        }
      });

      // Remove dead enemies
      gameRef.current.enemies = gameRef.current.enemies.filter(enemy => enemy.alive);

      // Spawn enemies
      gameRef.current.spawnTimer--;
      if (gameRef.current.spawnTimer <= 0) {
        spawnEnemy();
        gameRef.current.spawnTimer = SPAWN_RATE - Math.min(gameRef.current.currentScore / 10, 80); // Faster spawning as score increases
      }

      drawGame();
    }

    // Event listeners
    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key.toLowerCase()) {
        case 'w': gameRef.current.keys.w = true; break;
        case 'a': gameRef.current.keys.a = true; break;
        case 's': gameRef.current.keys.s = true; break;
        case 'd': gameRef.current.keys.d = true; break;
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      switch (e.key.toLowerCase()) {
        case 'w': gameRef.current.keys.w = false; break;
        case 'a': gameRef.current.keys.a = false; break;
        case 's': gameRef.current.keys.s = false; break;
        case 'd': gameRef.current.keys.d = false; break;
      }
    }

    function handleMouseMove(e: MouseEvent) {
      if (!(app.view instanceof HTMLCanvasElement)) return;
      const rect = app.view.getBoundingClientRect();
      gameRef.current.mouseX = e.clientX - rect.left;
      gameRef.current.mouseY = e.clientY - rect.top;
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    if (app.view instanceof HTMLCanvasElement) {
      app.view.addEventListener('mousemove', handleMouseMove);
    }

    // Game loop
    gameRef.current.spawnTimer = SPAWN_RATE;
    const gameLoop = () => {
      if (!gameOver) {
        updateGame();
        requestAnimationFrame(gameLoop);
      }
    };
    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (app.view instanceof HTMLCanvasElement) {
        app.view.removeEventListener('mousemove', handleMouseMove);
      }
      app.destroy(true, { children: true });
    };
  }, [gameOver]);

  const restartGame = () => {
    setGameOver(false);
    setScore(0);
    gameRef.current.currentScore = 0;
    gameRef.current.enemies = [];
    gameRef.current.bullets = [];
    gameRef.current.player = { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2, radius: 15 };
  };

  if (gameOver) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h1 style={{ color: '#ff4757', fontSize: '3rem', marginBottom: '1rem' }}>GAME OVER</h1>
        <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Final Score: {score}</p>
        <button 
          onClick={restartGame}
          style={{
            fontSize: '1.2rem',
            padding: '1rem 2rem',
            backgroundColor: '#4dabf7',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginRight: '1rem'
          }}
        >
          Play Again
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
          Back to Menu
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', padding: '1rem' }}>
      <h1 style={{ marginBottom: '1rem', color: '#4dabf7' }}>🥔 Brotato Style</h1>
      <div style={{ marginBottom: '1rem', color: '#747d8c' }}>
        Use WASD to move • Aim with mouse • Survive as long as you can!
      </div>
      <div ref={containerRef} style={{ 
        display: 'inline-block',
        border: '2px solid #4dabf7',
        borderRadius: '8px',
        overflow: 'hidden'
      }} />
    </div>
  );
};

export default Brotato;
