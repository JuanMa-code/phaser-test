import * as PIXI from 'pixi.js';
import React, { useEffect, useRef, useState } from 'react';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const SHIP_SIZE = 15;
const LARGE_ASTEROID = 40;
const MEDIUM_ASTEROID = 25;
const SMALL_ASTEROID = 15;
const BULLET_SIZE = 4;
const MAX_SPEED = 8;

interface GameObject {
  sprite: PIXI.Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  size: number;
  active: boolean;
  type?: 'large' | 'medium' | 'small';
}

const Asteroids: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const app = new PIXI.Application({
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: 0x000011,
    });

    if (containerRef.current && app.view instanceof Node) {
      containerRef.current.appendChild(app.view);
    }

    let gameRunning = true;
    let localScore = 0;
    let localLives = 3;
    let localLevel = 1;
    let invulnerable = false;
    let invulnerableTime = 0;

    // Create stars background
    const starsContainer = new PIXI.Container();
    app.stage.addChild(starsContainer);
    
    for (let i = 0; i < 150; i++) {
      const star = new PIXI.Graphics();
      star.beginFill(0xffffff);
      star.drawCircle(0, 0, Math.random() * 1.5);
      star.endFill();
      star.x = Math.random() * GAME_WIDTH;
      star.y = Math.random() * GAME_HEIGHT;
      star.alpha = Math.random() * 0.8 + 0.2;
      starsContainer.addChild(star);
    }

    // Ship
    const ship: GameObject = {
      sprite: new PIXI.Graphics(),
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2,
      vx: 0,
      vy: 0,
      angle: 0,
      size: SHIP_SIZE,
      active: true
    };

    // Game objects
    let asteroids: GameObject[] = [];
    let bullets: GameObject[] = [];
    const keys: { [key: string]: boolean } = {};

    function drawShip() {
      ship.sprite.clear();
      
      // Draw ship body with fill and outline
      const shipColor = invulnerable && Math.floor(Date.now() / 100) % 2 ? 0x444444 : 0x00ffff;
      ship.sprite.beginFill(shipColor, 0.3);
      ship.sprite.lineStyle(2, shipColor);
      ship.sprite.moveTo(0, -SHIP_SIZE);
      ship.sprite.lineTo(-SHIP_SIZE * 0.8, SHIP_SIZE * 0.8);
      ship.sprite.lineTo(0, SHIP_SIZE * 0.4);
      ship.sprite.lineTo(SHIP_SIZE * 0.8, SHIP_SIZE * 0.8);
      ship.sprite.closePath();
      ship.sprite.endFill();
      
      // Thrust flame
      if (keys['ArrowUp'] || keys['w'] || keys['W']) {
        ship.sprite.beginFill(0xff4400, 0.7);
        ship.sprite.lineStyle(2, 0xff4400);
        ship.sprite.moveTo(-SHIP_SIZE * 0.3, SHIP_SIZE * 0.8);
        ship.sprite.lineTo(0, SHIP_SIZE * 1.5 + Math.random() * 5);
        ship.sprite.lineTo(SHIP_SIZE * 0.3, SHIP_SIZE * 0.8);
        ship.sprite.closePath();
        ship.sprite.endFill();
      }
    }

    // UI
    const scoreText = new PIXI.Text('Score: 0', { fontSize: 24, fill: 0xffffff });
    const livesText = new PIXI.Text('Lives: 3', { fontSize: 24, fill: 0xff0000 });
    const levelText = new PIXI.Text('Level: 1', { fontSize: 24, fill: 0x00ff00 });
    
    scoreText.x = 20;
    scoreText.y = 20;
    livesText.x = 200;
    livesText.y = 20;
    levelText.x = 350;
    levelText.y = 20;
    
    app.stage.addChild(scoreText);
    app.stage.addChild(livesText);
    app.stage.addChild(levelText);
    
    // Add ship to stage
    ship.sprite.x = ship.x;
    ship.sprite.y = ship.y;
    app.stage.addChild(ship.sprite);
    drawShip();

    function createAsteroid(x: number, y: number, size: 'large' | 'medium' | 'small'): GameObject {
      const asteroid: GameObject = {
        sprite: new PIXI.Graphics(),
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        angle: Math.random() * Math.PI * 2,
        size: size === 'large' ? LARGE_ASTEROID : size === 'medium' ? MEDIUM_ASTEROID : SMALL_ASTEROID,
        active: true,
        type: size
      };

      const asteroidSize = asteroid.size;
      const points = 8 + Math.floor(Math.random() * 4);
      const colors = [0xaaaaaa, 0x888888, 0x666666];
      
      asteroid.sprite.beginFill(colors[Math.floor(Math.random() * colors.length)]);
      asteroid.sprite.lineStyle(1, 0xcccccc);
      
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const radius = asteroidSize * (0.8 + Math.random() * 0.4);
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        if (i === 0) {
          asteroid.sprite.moveTo(x, y);
        } else {
          asteroid.sprite.lineTo(x, y);
        }
      }
      asteroid.sprite.closePath();
      asteroid.sprite.endFill();
      
      asteroid.sprite.x = x;
      asteroid.sprite.y = y;
      app.stage.addChild(asteroid.sprite);
      
      return asteroid;
    }

    function createBullet(x: number, y: number, angle: number): GameObject {
      const bullet: GameObject = {
        sprite: new PIXI.Graphics(),
        x: x,
        y: y,
        vx: Math.cos(angle) * 12,
        vy: Math.sin(angle) * 12,
        angle: angle,
        size: BULLET_SIZE,
        active: true
      };

      bullet.sprite.beginFill(0xffff00);
      bullet.sprite.drawCircle(0, 0, BULLET_SIZE);
      bullet.sprite.endFill();
      bullet.sprite.x = x;
      bullet.sprite.y = y;
      app.stage.addChild(bullet.sprite);
      
      return bullet;
    }

    function createInitialAsteroids() {
      asteroids = [];
      const numAsteroids = 4 + localLevel * 2;
      
      for (let i = 0; i < numAsteroids; i++) {
        let x, y;
        do {
          x = Math.random() * GAME_WIDTH;
          y = Math.random() * GAME_HEIGHT;
        } while (Math.hypot(x - ship.x, y - ship.y) < 100); // Keep away from ship
        
        asteroids.push(createAsteroid(x, y, 'large'));
      }
    }

    function wrapPosition(obj: GameObject) {
      if (obj.x < -obj.size) obj.x = GAME_WIDTH + obj.size;
      if (obj.x > GAME_WIDTH + obj.size) obj.x = -obj.size;
      if (obj.y < -obj.size) obj.y = GAME_HEIGHT + obj.size;
      if (obj.y > GAME_HEIGHT + obj.size) obj.y = -obj.size;
      
      obj.sprite.x = obj.x;
      obj.sprite.y = obj.y;
    }

    function updateShip() {
      if (!gameRunning) return;

      // Rotation
      if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        ship.angle -= 0.2;
      }
      if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        ship.angle += 0.2;
      }

      // Thrust
      if (keys['ArrowUp'] || keys['w'] || keys['W']) {
        ship.vx += Math.cos(ship.angle) * 0.3;
        ship.vy += Math.sin(ship.angle) * 0.3;
      }

      // Apply friction
      ship.vx *= 0.99;
      ship.vy *= 0.99;

      // Limit speed
      const speed = Math.hypot(ship.vx, ship.vy);
      if (speed > MAX_SPEED) {
        ship.vx = (ship.vx / speed) * MAX_SPEED;
        ship.vy = (ship.vy / speed) * MAX_SPEED;
      }

      // Update position
      ship.x += ship.vx;
      ship.y += ship.vy;
      
      wrapPosition(ship);
      ship.sprite.rotation = ship.angle + Math.PI / 2;
      drawShip();

      // Handle invulnerability
      if (invulnerable) {
        invulnerableTime--;
        if (invulnerableTime <= 0) {
          invulnerable = false;
        }
      }
    }

    function updateAsteroids() {
      for (let asteroid of asteroids) {
        if (!asteroid.active) continue;
        
        asteroid.x += asteroid.vx;
        asteroid.y += asteroid.vy;
        asteroid.angle += 0.02;
        asteroid.sprite.rotation = asteroid.angle;
        
        wrapPosition(asteroid);
      }
    }

    function updateBullets() {
      for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        if (!bullet.active) continue;
        
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        
        // Remove bullets that go off screen
        if (bullet.x < 0 || bullet.x > GAME_WIDTH || bullet.y < 0 || bullet.y > GAME_HEIGHT) {
          bullet.active = false;
          app.stage.removeChild(bullet.sprite);
          bullets.splice(i, 1);
          continue;
        }
        
        bullet.sprite.x = bullet.x;
        bullet.sprite.y = bullet.y;
      }
    }

    function checkCollisions() {
      // Bullets vs asteroids
      for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        if (!bullet.active) continue;
        
        for (let j = asteroids.length - 1; j >= 0; j--) {
          const asteroid = asteroids[j];
          if (!asteroid.active) continue;
          
          const dx = bullet.x - asteroid.x;
          const dy = bullet.y - asteroid.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < asteroid.size) {
            // Hit!
            bullet.active = false;
            asteroid.active = false;
            app.stage.removeChild(bullet.sprite);
            app.stage.removeChild(asteroid.sprite);
            bullets.splice(i, 1);
            
            // Score based on asteroid size
            const points = asteroid.type === 'large' ? 20 : asteroid.type === 'medium' ? 50 : 100;
            localScore += points;
            setScore(localScore);
            
            // Break asteroid into smaller pieces
            if (asteroid.type === 'large') {
              for (let k = 0; k < 2; k++) {
                asteroids.push(createAsteroid(asteroid.x, asteroid.y, 'medium'));
              }
            } else if (asteroid.type === 'medium') {
              for (let k = 0; k < 2; k++) {
                asteroids.push(createAsteroid(asteroid.x, asteroid.y, 'small'));
              }
            }
            
            asteroids.splice(j, 1);
            break;
          }
        }
      }

      // Ship vs asteroids
      if (!invulnerable) {
        for (let asteroid of asteroids) {
          if (!asteroid.active) continue;
          
          const dx = ship.x - asteroid.x;
          const dy = ship.y - asteroid.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < asteroid.size + ship.size) {
            // Ship hit!
            localLives--;
            setLives(localLives);
            invulnerable = true;
            invulnerableTime = 180; // 3 seconds at 60fps
            
            // Reset ship position and velocity
            ship.x = GAME_WIDTH / 2;
            ship.y = GAME_HEIGHT / 2;
            ship.vx = 0;
            ship.vy = 0;
            ship.angle = 0;
            
            if (localLives <= 0) {
              gameRunning = false;
              setGameOver(true);
            }
            break;
          }
        }
      }

      // Check if all asteroids destroyed
      if (asteroids.every(a => !a.active)) {
        localLevel++;
        setLevel(localLevel);
        createInitialAsteroids();
      }
    }

    function gameLoop() {
      if (!gameRunning) return;

      updateShip();
      updateAsteroids();
      updateBullets();
      checkCollisions();

      scoreText.text = `Score: ${localScore}`;
      livesText.text = `Lives: ${localLives}`;
      levelText.text = `Level: ${localLevel}`;

      requestAnimationFrame(gameLoop);
    }

    function handleKeyDown(event: KeyboardEvent) {
      keys[event.key] = true;
      
      if (event.key === ' ' && gameRunning) {
        if (bullets.length < 4) { // Limit bullets
          const bulletX = ship.x + Math.cos(ship.angle) * ship.size;
          const bulletY = ship.y + Math.sin(ship.angle) * ship.size;
          bullets.push(createBullet(bulletX, bulletY, ship.angle));
        }
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      keys[event.key] = false;
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    createInitialAsteroids();
    gameLoop();

    return () => {
      gameRunning = false;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (containerRef.current && app.view instanceof Node) {
        containerRef.current.removeChild(app.view);
      }
      app.destroy();
    };
  }, [gameStarted, gameOver]);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setLives(3);
    setLevel(1);
  };

  const restartGame = () => {
    setGameOver(false);
    setScore(0);
    setLives(3);
    setLevel(1);
  };

  if (!gameStarted) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #000011 0%, #001122 100%)',
        fontFamily: 'Arial, sans-serif',
        color: 'white',
        padding: '2rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '3rem',
          maxWidth: '600px',
          textAlign: 'center',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <h1 style={{ 
            fontSize: '4rem', 
            margin: '0 0 1rem 0',
            background: 'linear-gradient(45deg, #ffffff, #00ffff, #ffff00, #ff0080)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            🚀 ASTEROIDS
          </h1>
          
          <p style={{ fontSize: '1.2rem', margin: '1rem 0', opacity: 0.9 }}>
            ¡Navega por el espacio y destruye asteroides!
          </p>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1rem', 
            margin: '2rem 0' 
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '15px',
              padding: '1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#00ffff' }}>🎮 Controles</h3>
              <p>← → A D: Rotar nave</p>
              <p>↑ W: Acelerar</p>
              <p>Espacio: Disparar</p>
            </div>
            
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '15px',
              padding: '1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#ffff00' }}>💎 Puntuación</h3>
              <p>Asteroide grande: 20 pts</p>
              <p>Asteroide mediano: 50 pts</p>
              <p>Asteroide pequeño: 100 pts</p>
            </div>
            
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '15px',
              padding: '1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#ff0080' }}>⚡ Física Espacial</h3>
              <p>Inercia y gravedad cero</p>
              <p>Teletransporte en bordes</p>
              <p>3 segundos invulnerable</p>
            </div>
          </div>
          
          <button
            onClick={startGame}
            style={{
              padding: '1rem 3rem',
              fontSize: '1.5rem',
              background: 'linear-gradient(45deg, #00ffff, #ffff00)',
              border: 'none',
              borderRadius: '50px',
              color: 'black',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
              fontWeight: 'bold'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
            }}
          >
            🌌 ¡INICIAR MISIÓN!
          </button>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #110000 0%, #220011 100%)',
        fontFamily: 'Arial, sans-serif',
        color: 'white',
        padding: '2rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '3rem',
          textAlign: 'center',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <h1 style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>💥 ¡MISIÓN FALLIDA!</h1>
          <div style={{ fontSize: '1.5rem', margin: '2rem 0' }}>
            <p>🎯 Puntuación Final: <strong>{score}</strong></p>
            <p>🌟 Nivel Alcanzado: <strong>{level}</strong></p>
            <p style={{ color: '#ff0080' }}>Tu nave fue destruida en el espacio...</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={restartGame}
              style={{
                padding: '1rem 2rem',
                fontSize: '1.2rem',
                background: 'linear-gradient(45deg, #00ffff, #ffff00)',
                border: 'none',
                borderRadius: '50px',
                color: 'black',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🔄 Nueva Misión
            </button>
            <button
              onClick={() => setGameStarted(false)}
              style={{
                padding: '1rem 2rem',
                fontSize: '1.2rem',
                background: 'linear-gradient(45deg, #000011, #001122)',
                border: 'none',
                borderRadius: '50px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🏠 Base Espacial
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      padding: '20px',
      background: 'linear-gradient(135deg, #000011 0%, #001122 100%)',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif',
      color: 'white'
    }}>
      <h1 style={{ margin: '0 0 20px 0', fontSize: '2.5rem' }}>🚀 ASTEROIDS</h1>
      <div ref={containerRef} style={{ border: '2px solid #444', borderRadius: '10px' }} />
      <div style={{ marginTop: '20px', fontSize: '1.2rem' }}>
        <p>← → A D rotar, ↑ W acelerar, Espacio disparar</p>
      </div>
    </div>
  );
};

export default Asteroids;
