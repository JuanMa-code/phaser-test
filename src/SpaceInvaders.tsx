import * as PIXI from 'pixi.js';
import React, { useEffect, useRef, useState } from 'react';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_SIZE = 40;
const INVADER_SIZE = 30;
const BULLET_SIZE = 6;
const INVADER_ROWS = 5;
const INVADER_COLS = 10;

interface GameObject {
  sprite: PIXI.Graphics;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  width: number;
  height: number;
  active: boolean;
}

const SpaceInvaders: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [victory, setVictory] = useState(false);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const app = new PIXI.Application({
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: 0x0a0a1a,
    });

    if (containerRef.current && app.view instanceof Node) {
      containerRef.current.appendChild(app.view);
    }

    let gameRunning = true;
    let localScore = 0;
    let localLives = 3;
    let localWave = 1;

    // Create stars background
    const starsContainer = new PIXI.Container();
    app.stage.addChild(starsContainer);
    
    for (let i = 0; i < 100; i++) {
      const star = new PIXI.Graphics();
      star.beginFill(0xffffff);
      star.drawCircle(0, 0, Math.random() * 2);
      star.endFill();
      star.x = Math.random() * GAME_WIDTH;
      star.y = Math.random() * GAME_HEIGHT;
      star.alpha = Math.random() * 0.8 + 0.2;
      starsContainer.addChild(star);
    }

    // Player
    const player: GameObject = {
      sprite: new PIXI.Graphics(),
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - 60,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
      active: true
    };

    player.sprite.beginFill(0x00ff88);
    player.sprite.moveTo(0, -PLAYER_SIZE/2);
    player.sprite.lineTo(-PLAYER_SIZE/2, PLAYER_SIZE/2);
    player.sprite.lineTo(PLAYER_SIZE/2, PLAYER_SIZE/2);
    player.sprite.closePath();
    player.sprite.endFill();
    player.sprite.lineStyle(2, 0x00ffaa);
    player.sprite.drawCircle(0, 0, PLAYER_SIZE/3);
    player.sprite.x = player.x;
    player.sprite.y = player.y;
    app.stage.addChild(player.sprite);

    // Game objects
    let invaders: GameObject[] = [];
    let playerBullets: GameObject[] = [];
    let invaderBullets: GameObject[] = [];
    let invaderDirection = 1;
    let invaderSpeed = 1;
    let invaderDropSpeed = 20;

    // UI
    const scoreText = new PIXI.Text('Score: 0', { fontSize: 24, fill: 0xffffff });
    const livesText = new PIXI.Text('Lives: 3', { fontSize: 24, fill: 0xff0000 });
    const waveText = new PIXI.Text('Wave: 1', { fontSize: 24, fill: 0x00ff00 });
    
    scoreText.x = 20;
    scoreText.y = 20;
    livesText.x = 200;
    livesText.y = 20;
    waveText.x = 350;
    waveText.y = 20;
    
    app.stage.addChild(scoreText);
    app.stage.addChild(livesText);
    app.stage.addChild(waveText);

    function createInvader(x: number, y: number, type: number): GameObject {
      const invader: GameObject = {
        sprite: new PIXI.Graphics(),
        x: x,
        y: y,
        width: INVADER_SIZE,
        height: INVADER_SIZE,
        active: true
      };

      const colors = [0xff4444, 0xffaa44, 0x44ff44, 0x4444ff, 0xff44ff];
      const color = colors[type % colors.length];
      
      invader.sprite.beginFill(color);
      invader.sprite.drawRoundedRect(-INVADER_SIZE/2, -INVADER_SIZE/2, INVADER_SIZE, INVADER_SIZE, 5);
      invader.sprite.endFill();
      
      // Add simple antenna/eyes
      invader.sprite.beginFill(0xffffff);
      invader.sprite.drawCircle(-8, -8, 3);
      invader.sprite.drawCircle(8, -8, 3);
      invader.sprite.endFill();
      
      invader.sprite.x = x;
      invader.sprite.y = y;
      app.stage.addChild(invader.sprite);
      
      return invader;
    }

    function createBullet(x: number, y: number, isPlayer: boolean): GameObject {
      const bullet: GameObject = {
        sprite: new PIXI.Graphics(),
        x: x,
        y: y,
        vy: isPlayer ? -8 : 4,
        width: BULLET_SIZE,
        height: BULLET_SIZE * 2,
        active: true
      };

      bullet.sprite.beginFill(isPlayer ? 0x00ffff : 0xff0000);
      if (isPlayer) {
        bullet.sprite.drawRoundedRect(-BULLET_SIZE/2, -BULLET_SIZE, BULLET_SIZE, BULLET_SIZE * 2, 2);
      } else {
        bullet.sprite.drawCircle(0, 0, BULLET_SIZE/2);
      }
      bullet.sprite.endFill();
      bullet.sprite.x = x;
      bullet.sprite.y = y;
      app.stage.addChild(bullet.sprite);
      
      return bullet;
    }

    function createInvaders() {
      invaders = [];
      for (let row = 0; row < INVADER_ROWS; row++) {
        for (let col = 0; col < INVADER_COLS; col++) {
          const x = 80 + col * 60;
          const y = 80 + row * 50;
          invaders.push(createInvader(x, y, row));
        }
      }
    }

    function updateInvaders() {
      let shouldDrop = false;
      
      // Check if any invader hits the edge
      for (let invader of invaders) {
        if (!invader.active) continue;
        if ((invader.x <= 30 && invaderDirection === -1) || 
            (invader.x >= GAME_WIDTH - 30 && invaderDirection === 1)) {
          shouldDrop = true;
          break;
        }
      }

      if (shouldDrop) {
        invaderDirection *= -1;
        for (let invader of invaders) {
          if (!invader.active) continue;
          invader.y += invaderDropSpeed;
          invader.sprite.y = invader.y;
          
          // Check if invaders reached player
          if (invader.y > GAME_HEIGHT - 100) {
            gameRunning = false;
            setGameOver(true);
            return;
          }
        }
        invaderSpeed += 0.2; // Increase speed each drop
      } else {
        for (let invader of invaders) {
          if (!invader.active) continue;
          invader.x += invaderDirection * invaderSpeed;
          invader.sprite.x = invader.x;
        }
      }

      // Random invader shooting
      if (Math.random() < 0.005) {
        const activeInvaders = invaders.filter(inv => inv.active);
        if (activeInvaders.length > 0) {
          const shooter = activeInvaders[Math.floor(Math.random() * activeInvaders.length)];
          invaderBullets.push(createBullet(shooter.x, shooter.y + 20, false));
        }
      }
    }

    function updateBullets() {
      // Update player bullets
      for (let i = playerBullets.length - 1; i >= 0; i--) {
        const bullet = playerBullets[i];
        if (!bullet.active) continue;
        
        bullet.y += bullet.vy!;
        bullet.sprite.y = bullet.y;
        
        if (bullet.y < 0) {
          bullet.active = false;
          app.stage.removeChild(bullet.sprite);
          playerBullets.splice(i, 1);
        }
      }

      // Update invader bullets
      for (let i = invaderBullets.length - 1; i >= 0; i--) {
        const bullet = invaderBullets[i];
        if (!bullet.active) continue;
        
        bullet.y += bullet.vy!;
        bullet.sprite.y = bullet.y;
        
        if (bullet.y > GAME_HEIGHT) {
          bullet.active = false;
          app.stage.removeChild(bullet.sprite);
          invaderBullets.splice(i, 1);
        }
      }
    }

    function checkCollisions() {
      // Player bullets vs invaders
      for (let i = playerBullets.length - 1; i >= 0; i--) {
        const bullet = playerBullets[i];
        if (!bullet.active) continue;
        
        for (let j = invaders.length - 1; j >= 0; j--) {
          const invader = invaders[j];
          if (!invader.active) continue;
          
          const dx = bullet.x - invader.x;
          const dy = bullet.y - invader.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 20) {
            // Hit!
            bullet.active = false;
            invader.active = false;
            app.stage.removeChild(bullet.sprite);
            app.stage.removeChild(invader.sprite);
            playerBullets.splice(i, 1);
            
            localScore += (INVADER_ROWS - Math.floor(j / INVADER_COLS)) * 10;
            setScore(localScore);
            
            // Check win condition
            if (invaders.every(inv => !inv.active)) {
              localWave++;
              setWave(localWave);
              invaderSpeed = 1 + localWave * 0.5;
              createInvaders();
              if (localWave > 10) {
                gameRunning = false;
                setVictory(true);
                return;
              }
            }
            break;
          }
        }
      }

      // Invader bullets vs player
      for (let i = invaderBullets.length - 1; i >= 0; i--) {
        const bullet = invaderBullets[i];
        if (!bullet.active) continue;
        
        const dx = bullet.x - player.x;
        const dy = bullet.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 25) {
          bullet.active = false;
          app.stage.removeChild(bullet.sprite);
          invaderBullets.splice(i, 1);
          
          localLives--;
          setLives(localLives);
          
          if (localLives <= 0) {
            gameRunning = false;
            setGameOver(true);
          }
          break;
        }
      }
    }

    function gameLoop() {
      if (!gameRunning) return;

      updateInvaders();
      updateBullets();
      checkCollisions();

      scoreText.text = `Score: ${localScore}`;
      livesText.text = `Lives: ${localLives}`;
      waveText.text = `Wave: ${localWave}`;

      requestAnimationFrame(gameLoop);
    }

    const keys: { [key: string]: boolean } = {};

    function handleKeyDown(event: KeyboardEvent) {
      keys[event.key] = true;
      
      if ((event.key === ' ' || event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') && gameRunning) {
        if (playerBullets.length < 3) { // Limit bullets
          playerBullets.push(createBullet(player.x, player.y - 20, true));
        }
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      keys[event.key] = false;
    }

    function updatePlayer() {
      if (!gameRunning) return;
      
      if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        player.x = Math.max(30, player.x - 5);
      }
      if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        player.x = Math.min(GAME_WIDTH - 30, player.x + 5);
      }
      
      player.sprite.x = player.x;
      
      requestAnimationFrame(updatePlayer);
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    createInvaders();
    gameLoop();
    updatePlayer();

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
    setVictory(false);
    setScore(0);
    setLives(3);
    setWave(1);
  };

  const restartGame = () => {
    setGameOver(false);
    setVictory(false);
    setScore(0);
    setLives(3);
    setWave(1);
  };

  if (!gameStarted) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 100%)',
        fontFamily: 'Arial, sans-serif',
        padding: '1rem',
        overflowY: 'auto'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          maxWidth: '500px',
          width: '95%',
          textAlign: 'center',
          color: 'white',
          margin: '1rem auto'
        }}>
          <h1 style={{ 
            fontSize: '3rem', 
            marginBottom: '1rem',
            background: 'linear-gradient(45deg, #ff0080, #00ff80, #0080ff)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 30px rgba(255, 0, 128, 0.5)'
          }}>
            👾 SPACE INVADERS
          </h1>
          
          <p style={{ 
            fontSize: '1.1rem', 
            marginBottom: '1.5rem', 
            opacity: 0.9,
            lineHeight: '1.4'
          }}>
            ¡Defiende la Tierra de la invasión alienígena!
          </p>

          <div style={{ 
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            padding: '1.2rem',
            marginBottom: '1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{ 
              fontSize: '1.2rem', 
              marginBottom: '1rem',
              color: '#fff'
            }}>
              🚀 Controles
            </h3>
            <div style={{ 
              fontSize: '0.95rem',
              textAlign: 'left',
              lineHeight: '1.4'
            }}>
              <p style={{ marginBottom: '0.5rem' }}>🎮 ← → A D: Mover nave espacial</p>
              <p style={{ marginBottom: '0.5rem' }}>💥 Espacio ↑ W: Disparar láser</p>
              <p>⚡ Máximo 3 balas simultáneas</p>
            </div>
          </div>

          <div style={{ 
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            padding: '1.2rem',
            marginBottom: '1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{ 
              fontSize: '1.2rem', 
              marginBottom: '1rem',
              color: '#fff'
            }}>
              🎯 Sistema de Puntuación
            </h3>
            <div style={{ 
              fontSize: '0.95rem',
              textAlign: 'left',
              lineHeight: '1.4'
            }}>
              <p style={{ marginBottom: '0.5rem' }}>👾 Alienígenas superiores: 50 puntos</p>
              <p style={{ marginBottom: '0.5rem' }}>👾 Alienígenas inferiores: 10 puntos</p>
              <p>🌊 Más oleadas = más puntos bonus</p>
            </div>
          </div>
          
          <button
            onClick={startGame}
            style={{
              fontSize: '1.2rem',
              padding: '0.8rem 2rem',
              background: 'linear-gradient(45deg, #ff0080, #00ff80)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(255, 0, 128, 0.3)',
              transition: 'all 0.3s ease',
              transform: 'translateY(0)',
              marginBottom: '1.5rem'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 0, 128, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 0, 128, 0.3)';
            }}
          >
            🛸 ¡Comenzar Batalla!
          </button>

          <div style={{ 
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            padding: '1.2rem',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{ 
              fontSize: '1.2rem', 
              marginBottom: '1rem',
              color: '#fff'
            }}>
              ⚠️ Misión de Supervivencia
            </h3>
            <div style={{ 
              fontSize: '0.95rem',
              textAlign: 'left',
              lineHeight: '1.4'
            }}>
              <p style={{ marginBottom: '0.5rem' }}>❤️ Tienes 3 vidas para empezar</p>
              <p style={{ marginBottom: '0.5rem' }}>🚫 Evita las balas enemigas</p>
              <p>🏆 ¡Sobrevive 10 oleadas para ganar!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameOver || victory) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '100vh',
        background: victory 
          ? 'linear-gradient(135deg, #0a1a0a 0%, #1a3a1a 100%)'
          : 'linear-gradient(135deg, #1a0a0a 0%, #3a1a1a 100%)',
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
          <h1 style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>
            {victory ? '🏆 ¡VICTORIA!' : '💥 ¡GAME OVER!'}
          </h1>
          <div style={{ fontSize: '1.5rem', margin: '2rem 0' }}>
            <p>🎯 Puntuación Final: <strong>{score}</strong></p>
            <p>🌊 Oleadas Completadas: <strong>{wave - 1}</strong></p>
            {victory && <p style={{ color: '#00ff80' }}>¡Has salvado la Tierra!</p>}
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={restartGame}
              style={{
                padding: '1rem 2rem',
                fontSize: '1.2rem',
                background: 'linear-gradient(45deg, #ff0080, #00ff80)',
                border: 'none',
                borderRadius: '50px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🔄 Reintentar
            </button>
            <button
              onClick={() => setGameStarted(false)}
              style={{
                padding: '1rem 2rem',
                fontSize: '1.2rem',
                background: 'linear-gradient(45deg, #0a0a1a, #1a1a3a)',
                border: 'none',
                borderRadius: '50px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🏠 Menú Principal
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
      background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 100%)',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif',
      color: 'white'
    }}>
      <h1 style={{ margin: '0 0 20px 0', fontSize: '2.5rem' }}>👾 SPACE INVADERS</h1>
      <div ref={containerRef} style={{ border: '2px solid #444', borderRadius: '10px' }} />
      <div style={{ marginTop: '20px', fontSize: '1.2rem' }}>
        <p>← → A D para mover, Espacio ↑ W para disparar</p>
      </div>
    </div>
  );
};

export default SpaceInvaders;
