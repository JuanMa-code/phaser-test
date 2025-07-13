import * as PIXI from 'pixi.js';
import React, { useEffect, useRef, useState } from 'react';

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const DOODLE_SIZE = 40;
const PLATFORM_WIDTH = 70;
const PLATFORM_HEIGHT = 15;

interface Platform {
  x: number;
  y: number;
  type: 'normal' | 'spring' | 'moving' | 'breakable';
  sprite: PIXI.Graphics;
  broken?: boolean;
  direction?: number; // For moving platforms
}

interface PowerUp {
  x: number;
  y: number;
  type: 'jetpack' | 'spring' | 'shield';
  sprite: PIXI.Graphics;
}

const DoodleJump: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameOver'>('start');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('doodlejump-highscore');
    return saved ? parseInt(saved) : 0;
  });

  useEffect(() => {
    if (gameState !== 'playing') return;

    const app = new PIXI.Application({
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: 0x87CEEB, // Sky blue
    });

    if (containerRef.current && app.view instanceof Node) {
      containerRef.current.appendChild(app.view);
    }

    let gameRunning = true;
    let localScore = 0;
    let doodleX = GAME_WIDTH / 2 - DOODLE_SIZE / 2;
    let doodleY = GAME_HEIGHT - 150;
    let doodleVelocityY = 0;
    let doodleVelocityX = 0;
    let cameraY = 0;
    let platforms: Platform[] = [];
    let powerUps: PowerUp[] = [];
    let isJumping = false;
    let jumpHeight = 0;
    let maxHeight = 0;
    let keys: { [key: string]: boolean } = {};
    
    // Power-up states
    let jetpackTime = 0;
    let springBoost = 0;
    let shieldTime = 0;

    // Physics constants
    const gravity = 0.4;
    const jumpStrength = -12;
    const moveSpeed = 5;
    const platformSpacing = 80;

    // Background elements
    const backgroundContainer = new PIXI.Container();
    app.stage.addChild(backgroundContainer);

    // Create moving clouds
    const clouds: PIXI.Graphics[] = [];
    for (let i = 0; i < 8; i++) {
      const cloud = new PIXI.Graphics();
      cloud.beginFill(0xFFFFFF, 0.7);
      
      // Cloud shape
      cloud.drawCircle(0, 0, 20);
      cloud.drawCircle(25, 0, 25);
      cloud.drawCircle(50, 0, 20);
      cloud.drawCircle(15, -10, 15);
      cloud.drawCircle(35, -8, 18);
      cloud.endFill();
      
      cloud.x = Math.random() * GAME_WIDTH;
      cloud.y = Math.random() * GAME_HEIGHT * 3; // Distribute in game world
      backgroundContainer.addChild(cloud);
      clouds.push(cloud);
    }

    // Doodle character
    const doodle = new PIXI.Graphics();
    
    function drawDoodle() {
      doodle.clear();
      
      // Main body
      doodle.beginFill(jetpackTime > 0 ? 0xFF6B35 : 0x90EE90); // Orange with jetpack, green otherwise
      doodle.drawEllipse(0, 0, DOODLE_SIZE * 0.6, DOODLE_SIZE * 0.8);
      doodle.endFill();
      
      // Eyes
      doodle.beginFill(0x000000);
      doodle.drawCircle(-8, -12, 3);
      doodle.drawCircle(8, -12, 3);
      doodle.endFill();
      
      // Eye shine
      doodle.beginFill(0xFFFFFF);
      doodle.drawCircle(-7, -13, 1);
      doodle.drawCircle(9, -13, 1);
      doodle.endFill();
      
      // Nose
      doodle.beginFill(0x228B22);
      doodle.drawEllipse(0, -5, 3, 2);
      doodle.endFill();
      
      // Legs
      doodle.beginFill(0x32CD32);
      doodle.drawEllipse(-12, 15, 6, 10);
      doodle.drawEllipse(12, 15, 6, 10);
      doodle.endFill();
      
      // Feet
      doodle.beginFill(0x228B22);
      doodle.drawEllipse(-15, 22, 8, 4);
      doodle.drawEllipse(15, 22, 8, 4);
      doodle.endFill();
      
      // Jetpack effect
      if (jetpackTime > 0) {
        doodle.beginFill(0xFF4500, 0.8);
        doodle.drawEllipse(-20, 10, 8, 15);
        doodle.drawEllipse(20, 10, 8, 15);
        doodle.endFill();
        
        // Flame
        doodle.beginFill(0xFFD700, 0.6);
        doodle.drawEllipse(-20, 25, 6, 12);
        doodle.drawEllipse(20, 25, 6, 12);
        doodle.endFill();
      }
      
      // Shield effect
      if (shieldTime > 0) {
        doodle.lineStyle(3, 0x00BFFF, 0.7);
        doodle.drawCircle(0, 0, DOODLE_SIZE * 0.7);
      }
    }

    function createPlatform(x: number, y: number): Platform {
      const types: Platform['type'][] = ['normal', 'spring', 'moving', 'breakable'];
      const type = y < -500 && Math.random() < 0.3 ? 
        types[Math.floor(Math.random() * types.length)] : 'normal';
      
      const sprite = new PIXI.Graphics();
      
      switch (type) {
        case 'normal':
          sprite.beginFill(0x228B22);
          sprite.drawRoundedRect(0, 0, PLATFORM_WIDTH, PLATFORM_HEIGHT, 7);
          sprite.endFill();
          
          // Grass texture
          sprite.lineStyle(2, 0x32CD32);
          for (let i = 5; i < PLATFORM_WIDTH - 5; i += 8) {
            sprite.moveTo(i, 2);
            sprite.lineTo(i + 2, -2);
            sprite.lineTo(i + 4, 2);
          }
          break;
          
        case 'spring':
          sprite.beginFill(0x228B22);
          sprite.drawRoundedRect(0, 0, PLATFORM_WIDTH, PLATFORM_HEIGHT, 7);
          sprite.endFill();
          
          // Spring in center
          sprite.beginFill(0xFF6B35);
          sprite.drawEllipse(PLATFORM_WIDTH / 2, PLATFORM_HEIGHT / 2, 12, 8);
          sprite.endFill();
          
          sprite.beginFill(0xFFD700);
          sprite.drawEllipse(PLATFORM_WIDTH / 2, PLATFORM_HEIGHT / 2, 8, 5);
          sprite.endFill();
          break;
          
        case 'moving':
          sprite.beginFill(0x4169E1);
          sprite.drawRoundedRect(0, 0, PLATFORM_WIDTH, PLATFORM_HEIGHT, 7);
          sprite.endFill();
          
          // Arrow indicators
          sprite.beginFill(0xFFFFFF);
          sprite.drawPolygon([10, 7, 15, 3, 15, 11]);
          sprite.drawPolygon([PLATFORM_WIDTH - 10, 7, PLATFORM_WIDTH - 15, 3, PLATFORM_WIDTH - 15, 11]);
          sprite.endFill();
          break;
          
        case 'breakable':
          sprite.beginFill(0x8B4513);
          sprite.drawRoundedRect(0, 0, PLATFORM_WIDTH, PLATFORM_HEIGHT, 7);
          sprite.endFill();
          
          // Crack pattern
          sprite.lineStyle(2, 0x654321);
          sprite.moveTo(20, 2);
          sprite.lineTo(30, PLATFORM_HEIGHT - 2);
          sprite.moveTo(40, 2);
          sprite.lineTo(50, PLATFORM_HEIGHT - 2);
          break;
      }
      
      sprite.x = x;
      sprite.y = y;
      app.stage.addChild(sprite);
      
      return {
        x,
        y,
        type,
        sprite,
        broken: false,
        direction: type === 'moving' ? (Math.random() > 0.5 ? 1 : -1) : 0
      };
    }

    function createPowerUp(x: number, y: number): PowerUp {
      const types: PowerUp['type'][] = ['jetpack', 'spring', 'shield'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      const sprite = new PIXI.Graphics();
      
      switch (type) {
        case 'jetpack':
          sprite.beginFill(0xFF6B35);
          sprite.drawRoundedRect(-8, -12, 16, 24, 4);
          sprite.endFill();
          
          sprite.beginFill(0xFFD700);
          sprite.drawCircle(-4, -8, 3);
          sprite.drawCircle(4, -8, 3);
          sprite.endFill();
          break;
          
        case 'spring':
          sprite.beginFill(0x32CD32);
          sprite.drawEllipse(0, 0, 15, 10);
          sprite.endFill();
          
          sprite.beginFill(0xFFD700);
          sprite.drawEllipse(0, 0, 10, 6);
          sprite.endFill();
          break;
          
        case 'shield':
          sprite.lineStyle(3, 0x00BFFF);
          sprite.beginFill(0x87CEEB, 0.5);
          sprite.drawCircle(0, 0, 12);
          sprite.endFill();
          break;
      }
      
      sprite.x = x;
      sprite.y = y;
      app.stage.addChild(sprite);
      
      return { x, y, type, sprite };
    }

    function initGame() {
      platforms = [];
      powerUps = [];
      localScore = 0;
      maxHeight = 0;
      cameraY = 0;
      
      // Starting platform
      platforms.push(createPlatform(
        GAME_WIDTH / 2 - PLATFORM_WIDTH / 2,
        GAME_HEIGHT - 50
      ));
      
      // Generate initial platforms
      for (let i = 1; i < 20; i++) {
        const x = Math.random() * (GAME_WIDTH - PLATFORM_WIDTH);
        const y = GAME_HEIGHT - 50 - (i * platformSpacing);
        platforms.push(createPlatform(x, y));
        
        // Chance for power-up
        if (i > 3 && Math.random() < 0.15) {
          powerUps.push(createPowerUp(x + PLATFORM_WIDTH / 2, y - 30));
        }
      }
    }

    function updateDoodle() {
      // Horizontal movement
      if (keys['ArrowLeft'] || keys['KeyA']) {
        doodleVelocityX = -moveSpeed;
      } else if (keys['ArrowRight'] || keys['KeyD']) {
        doodleVelocityX = moveSpeed;
      } else {
        doodleVelocityX *= 0.8; // Friction
      }
      
      doodleX += doodleVelocityX;
      
      // Wrap around screen
      if (doodleX < -DOODLE_SIZE / 2) {
        doodleX = GAME_WIDTH + DOODLE_SIZE / 2;
      } else if (doodleX > GAME_WIDTH + DOODLE_SIZE / 2) {
        doodleX = -DOODLE_SIZE / 2;
      }
      
      // Vertical movement
      if (jetpackTime > 0) {
        doodleVelocityY = -8; // Jetpack override
        jetpackTime--;
      } else {
        doodleVelocityY += gravity;
      }
      
      if (springBoost > 0) {
        doodleVelocityY = -18; // Super jump
        springBoost = 0;
      }
      
      doodleY += doodleVelocityY;
      
      // Update shield
      if (shieldTime > 0) {
        shieldTime--;
      }
      
      // Check if reached new height
      const currentHeight = Math.max(0, -doodleY + GAME_HEIGHT);
      if (currentHeight > maxHeight) {
        maxHeight = currentHeight;
        localScore = Math.floor(maxHeight / 10);
        setScore(localScore);
      }
      
      // Camera follows doodle when going up
      if (doodleY < cameraY + 200) {
        cameraY = doodleY - 200;
      }
      
      // Game over if fell too far
      if (doodleY > cameraY + GAME_HEIGHT + 100) {
        gameRunning = false;
        setGameState('gameOver');
        
        if (localScore > highScore) {
          setHighScore(localScore);
          localStorage.setItem('doodlejump-highscore', localScore.toString());
        }
      }
    }

    function updatePlatforms() {
      for (const platform of platforms) {
        // Move moving platforms
        if (platform.type === 'moving' && !platform.broken) {
          platform.x += platform.direction! * 2;
          if (platform.x <= 0 || platform.x >= GAME_WIDTH - PLATFORM_WIDTH) {
            platform.direction! *= -1;
          }
          platform.sprite.x = platform.x;
        }
        
        // Remove platforms that are too far below
        if (platform.y > cameraY + GAME_HEIGHT + 100) {
          app.stage.removeChild(platform.sprite);
          platforms.splice(platforms.indexOf(platform), 1);
        }
      }
      
      // Generate new platforms at the top
      const topPlatform = platforms.reduce((highest, p) => 
        p.y < highest.y ? p : highest, platforms[0]);
      
      if (topPlatform && topPlatform.y > cameraY - 400) {
        for (let i = 0; i < 5; i++) {
          const x = Math.random() * (GAME_WIDTH - PLATFORM_WIDTH);
          const y = topPlatform.y - platformSpacing * (i + 1);
          platforms.push(createPlatform(x, y));
          
          // Add power-ups occasionally
          if (Math.random() < 0.1) {
            powerUps.push(createPowerUp(x + PLATFORM_WIDTH / 2, y - 30));
          }
        }
      }
    }

    function checkCollisions() {
      const doodleBottom = doodleY + DOODLE_SIZE / 2;
      const doodleLeft = doodleX;
      const doodleRight = doodleX + DOODLE_SIZE;
      
      // Platform collisions (only when falling)
      if (doodleVelocityY > 0) {
        for (const platform of platforms) {
          if (platform.broken) continue;
          
          if (doodleBottom >= platform.y && 
              doodleBottom <= platform.y + PLATFORM_HEIGHT + 10 &&
              doodleRight >= platform.x && 
              doodleLeft <= platform.x + PLATFORM_WIDTH) {
            
            if (platform.type === 'breakable') {
              platform.broken = true;
              platform.sprite.alpha = 0.3;
              setTimeout(() => {
                if (app.stage.children.includes(platform.sprite)) {
                  app.stage.removeChild(platform.sprite);
                }
              }, 500);
            } else {
              if (platform.type === 'spring') {
                springBoost = 1;
              } else {
                doodleVelocityY = jumpStrength;
              }
            }
            break;
          }
        }
      }
      
      // Power-up collisions
      for (const powerUp of powerUps) {
        const distance = Math.sqrt(
          Math.pow(doodleX + DOODLE_SIZE / 2 - powerUp.x, 2) + 
          Math.pow(doodleY + DOODLE_SIZE / 2 - powerUp.y, 2)
        );
        
        if (distance < 25) {
          app.stage.removeChild(powerUp.sprite);
          powerUps.splice(powerUps.indexOf(powerUp), 1);
          
          switch (powerUp.type) {
            case 'jetpack':
              jetpackTime = 120; // 2 seconds at 60fps
              break;
            case 'spring':
              springBoost = 1;
              break;
            case 'shield':
              shieldTime = 300; // 5 seconds
              break;
          }
        }
      }
    }

    function updateCamera() {
      // Update all sprites position relative to camera
      app.stage.y = -cameraY;
      
      // Update cloud positions for parallax effect
      clouds.forEach((cloud, index) => {
        cloud.y = (index * 200) + (cameraY * 0.3);
      });
    }

    function updateDisplay() {
      drawDoodle();
      doodle.x = doodleX + DOODLE_SIZE / 2;
      doodle.y = doodleY + DOODLE_SIZE / 2;
    }

    // UI
    const scoreText = new PIXI.Text('Score: 0', {
      fontSize: 24,
      fill: 0xFFFFFF,
      fontWeight: 'bold',
      stroke: 0x000000,
      strokeThickness: 3
    });
    scoreText.x = 10;
    scoreText.y = 10;
    
    const heightText = new PIXI.Text('Height: 0m', {
      fontSize: 20,
      fill: 0xFFFFFF,
      fontWeight: 'bold',
      stroke: 0x000000,
      strokeThickness: 3
    });
    heightText.x = 10;
    heightText.y = 40;

    // UI container (doesn't move with camera)
    const uiContainer = new PIXI.Container();
    uiContainer.addChild(scoreText);
    uiContainer.addChild(heightText);
    
    function updateGame() {
      if (!gameRunning) return;
      
      updateDoodle();
      updatePlatforms();
      checkCollisions();
      updateCamera();
      updateDisplay();
      
      // Update UI
      scoreText.text = `Score: ${localScore}`;
      heightText.text = `Height: ${Math.floor(maxHeight / 10)}m`;
    }

    function handleKeyDown(event: KeyboardEvent) {
      keys[event.code] = true;
    }

    function handleKeyUp(event: KeyboardEvent) {
      keys[event.code] = false;
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    app.stage.addChild(doodle);
    app.stage.addChild(uiContainer); // Add UI on top
    
    initGame();
    app.ticker.add(updateGame);

    return () => {
      gameRunning = false;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (containerRef.current && app.view instanceof Node) {
        containerRef.current.removeChild(app.view);
      }
      app.destroy();
    };
  }, [gameState]);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
  };

  const restartGame = () => {
    setGameState('playing');
    setScore(0);
  };

  if (gameState === 'start') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #87CEEB 0%, #98FB98 100%)',
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
            background: 'linear-gradient(45deg, #32CD32, #98FB98, #87CEEB)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 30px rgba(50, 205, 50, 0.5)'
          }}>
            🦘 DOODLE JUMP
          </h1>
          
          <p style={{ 
            fontSize: '1.1rem', 
            marginBottom: '1.5rem', 
            opacity: 0.9,
            lineHeight: '1.4'
          }}>
            ¡Salta tan alto como puedas sin caer!
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
              🎮 Controles
            </h3>
            <div style={{ 
              fontSize: '0.95rem',
              textAlign: 'left',
              lineHeight: '1.4'
            }}>
              <p style={{ marginBottom: '0.5rem' }}>⬅️➡️ Flechas o A/D: Mover horizontalmente</p>
              <p style={{ marginBottom: '0.5rem' }}>🔄 Los bordes te teletransportan</p>
              <p>🏆 Récord actual: <strong>{highScore}</strong> puntos</p>
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
              🪜 Tipos de Plataformas
            </h3>
            <div style={{ 
              fontSize: '0.95rem',
              textAlign: 'left',
              lineHeight: '1.4'
            }}>
              <p style={{ marginBottom: '0.5rem' }}>🟢 Normales: Salto estándar</p>
              <p style={{ marginBottom: '0.5rem' }}>🔵 Móviles: Se mueven de lado a lado</p>
              <p style={{ marginBottom: '0.5rem' }}>🟠 Resorte: Super salto hacia arriba</p>
              <p>🟤 Frágiles: Se rompen al tocarlas</p>
            </div>
          </div>
          
          <button
            onClick={startGame}
            style={{
              fontSize: '1.2rem',
              padding: '0.8rem 2rem',
              background: 'linear-gradient(45deg, #32CD32, #98FB98)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(50, 205, 50, 0.3)',
              transition: 'all 0.3s ease',
              transform: 'translateY(0)',
              marginBottom: '1.5rem'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(50, 205, 50, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(50, 205, 50, 0.3)';
            }}
          >
            🦘 ¡Comenzar a Saltar!
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
              🎁 Power-ups Especiales
            </h3>
            <div style={{ 
              fontSize: '0.95rem',
              textAlign: 'left',
              lineHeight: '1.4'
            }}>
              <p style={{ marginBottom: '0.5rem' }}>🚀 Jetpack: Vuelo temporal automático</p>
              <p style={{ marginBottom: '0.5rem' }}>⚡ Súper Salto: Impulso extra potente</p>
              <p>🛡️ Escudo: Protección contra caídas</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'gameOver') {
    const isNewRecord = score === highScore && score > 0;
    
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '100vh',
        background: isNewRecord 
          ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
          : 'linear-gradient(135deg, #DC143C 0%, #B22222 100%)',
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
            {isNewRecord ? '🏆 ¡NUEVO RÉCORD!' : '💔 ¡CAÍDA LIBRE!'}
          </h1>
          <div style={{ fontSize: '1.5rem', margin: '2rem 0' }}>
            <p>🎯 Puntuación Final: <strong>{score}</strong></p>
            <p>📏 Altura Máxima: <strong>{Math.floor(score * 10)}m</strong></p>
            <p>🏆 Récord Personal: <strong>{highScore}</strong></p>
            {isNewRecord && <p style={{ color: '#FFD700' }}>¡Has alcanzado las nubes!</p>}
            {!isNewRecord && <p style={{ color: '#FFB6C1' }}>¡Sigue saltando hacia las estrellas!</p>}
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={restartGame}
              style={{
                padding: '1rem 2rem',
                fontSize: '1.2rem',
                background: 'linear-gradient(45deg, #32CD32, #98FB98)',
                border: 'none',
                borderRadius: '50px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🔄 Saltar de Nuevo
            </button>
            <button
              onClick={() => setGameState('start')}
              style={{
                padding: '1rem 2rem',
                fontSize: '1.2rem',
                background: 'linear-gradient(45deg, #87CEEB, #4169E1)',
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
      background: 'linear-gradient(135deg, #87CEEB 0%, #98FB98 100%)',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif',
      color: 'white'
    }}>
      <h1 style={{ margin: '0 0 20px 0', fontSize: '2.5rem' }}>🦘 DOODLE JUMP</h1>
      <div ref={containerRef} style={{ border: '3px solid #32CD32', borderRadius: '10px' }} />
      <div style={{ marginTop: '20px', fontSize: '1.2rem', textAlign: 'center' }}>
        <p>←→ o A/D para mover • ¡Atrapa los power-ups!</p>
      </div>
    </div>
  );
};

export default DoodleJump;
