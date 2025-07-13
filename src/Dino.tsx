import * as PIXI from 'pixi.js';
import React, { useEffect, useRef, useState } from 'react';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 400;
const DINO_SIZE = 50;
const GROUND_HEIGHT = 60;

interface Obstacle {
  sprite: PIXI.Graphics;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'cactus' | 'rock' | 'bird';
}

const Dino: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameOver'>('start');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('dino-highscore');
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
    let gameSpeed = 8;
    let obstacleTimer = 0;
    let cloudTimer = 0;

    // Clouds background
    const cloudsContainer = new PIXI.Container();
    app.stage.addChild(cloudsContainer);
    
    function createCloud() {
      const cloud = new PIXI.Graphics();
      cloud.beginFill(0xffffff, 0.8);
      
      // Main cloud body
      cloud.drawCircle(0, 0, 15);
      cloud.drawCircle(20, 0, 18);
      cloud.drawCircle(40, 0, 15);
      cloud.drawCircle(10, -8, 12);
      cloud.drawCircle(30, -8, 12);
      
      cloud.endFill();
      cloud.x = GAME_WIDTH + Math.random() * 200;
      cloud.y = 50 + Math.random() * 100;
      cloud.alpha = 0.7;
      cloudsContainer.addChild(cloud);
      
      return cloud;
    }

    // Ground with pattern
    const ground = new PIXI.Graphics();
    ground.beginFill(0x8B4513); // Brown
    ground.drawRect(0, GAME_HEIGHT - GROUND_HEIGHT, GAME_WIDTH, GROUND_HEIGHT);
    ground.endFill();
    
    // Ground pattern
    ground.lineStyle(2, 0x654321);
    for (let x = 0; x < GAME_WIDTH; x += 40) {
      ground.moveTo(x, GAME_HEIGHT - GROUND_HEIGHT);
      ground.lineTo(x + 20, GAME_HEIGHT - GROUND_HEIGHT + 10);
    }
    
    app.stage.addChild(ground);

    // Dino
    let dinoY = GAME_HEIGHT - GROUND_HEIGHT - DINO_SIZE;
    let dinoVelocityY = 0;
    let isJumping = false;
    let isDucking = false;
    
    const dino = new PIXI.Graphics();
    
    function drawDino() {
      dino.clear();
      
      if (isDucking) {
        // Ducking dino (smaller, wider)
        dino.beginFill(0x228B22);
        dino.drawRoundedRect(0, 20, DINO_SIZE + 10, DINO_SIZE - 20, 5);
        dino.endFill();
        
        // Eye
        dino.beginFill(0x000000);
        dino.drawCircle(DINO_SIZE - 15, 25, 3);
        dino.endFill();
        
        // Tail
        dino.beginFill(0x32CD32);
        dino.drawRoundedRect(-10, 25, 15, 15, 3);
        dino.endFill();
      } else {
        // Standing/jumping dino
        dino.beginFill(0x228B22);
        dino.drawRoundedRect(0, 0, DINO_SIZE, DINO_SIZE, 8);
        dino.endFill();
        
        // Eye
        dino.beginFill(0x000000);
        dino.drawCircle(DINO_SIZE - 15, 15, 4);
        dino.endFill();
        
        // Legs (only when on ground)
        if (!isJumping) {
          dino.beginFill(0x32CD32);
          dino.drawRect(10, DINO_SIZE, 8, 10);
          dino.drawRect(DINO_SIZE - 18, DINO_SIZE, 8, 10);
          dino.endFill();
        }
        
        // Tail
        dino.beginFill(0x32CD32);
        dino.drawRoundedRect(-8, 15, 12, 20, 3);
        dino.endFill();
      }
    }
    
    dino.x = 80;
    dino.y = dinoY;
    app.stage.addChild(dino);
    drawDino();

    // Obstacles
    let obstacles: Obstacle[] = [];
    let clouds: PIXI.Graphics[] = [];

    function createObstacle(): Obstacle {
      const types: ('cactus' | 'rock' | 'bird')[] = ['cactus', 'rock', 'bird'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      const sprite = new PIXI.Graphics();
      let width = 30;
      let height = 50;
      let y = GAME_HEIGHT - GROUND_HEIGHT - height;
      
      if (type === 'cactus') {
        sprite.beginFill(0x228B22);
        sprite.drawRect(0, 0, 25, 60);
        sprite.drawRect(-10, 20, 15, 4);
        sprite.drawRect(25, 30, 15, 4);
        sprite.endFill();
        
        // Cactus spikes
        sprite.beginFill(0x32CD32);
        for (let i = 0; i < 6; i++) {
          sprite.drawRect(5 + i * 3, i * 10, 2, 8);
        }
        sprite.endFill();
        
        width = 25;
        height = 60;
      } else if (type === 'rock') {
        sprite.beginFill(0x696969);
        sprite.drawCircle(20, 20, 20);
        sprite.drawCircle(5, 25, 12);
        sprite.drawCircle(35, 25, 15);
        sprite.endFill();
        
        // Rock highlights
        sprite.beginFill(0x808080);
        sprite.drawCircle(15, 15, 5);
        sprite.drawCircle(30, 20, 3);
        sprite.endFill();
        
        width = 40;
        height = 40;
        y = GAME_HEIGHT - GROUND_HEIGHT - height;
      } else { // bird
        sprite.beginFill(0x8B4513);
        sprite.drawEllipse(0, 0, 25, 15);
        sprite.endFill();
        
        // Wings
        sprite.beginFill(0xA0522D);
        sprite.drawEllipse(-15, -5, 20, 8);
        sprite.drawEllipse(15, -5, 20, 8);
        sprite.endFill();
        
        // Beak
        sprite.beginFill(0xFFD700);
        sprite.drawPolygon([25, 0, 35, -3, 35, 3]);
        sprite.endFill();
        
        width = 50;
        height = 30;
        y = GAME_HEIGHT - GROUND_HEIGHT - 120 - Math.random() * 60; // Flying height
      }
      
      sprite.x = GAME_WIDTH;
      sprite.y = y;
      app.stage.addChild(sprite);
      
      return { sprite, x: GAME_WIDTH, y, width, height, type };
    }

    // UI
    const scoreText = new PIXI.Text('Score: 0', { 
      fontSize: 24, 
      fill: 0x000000, 
      fontWeight: 'bold',
      stroke: 0xffffff,
      strokeThickness: 2
    });
    scoreText.x = 20;
    scoreText.y = 20;
    app.stage.addChild(scoreText);

    const speedText = new PIXI.Text('Speed: 1x', { 
      fontSize: 18, 
      fill: 0x000000, 
      fontWeight: 'bold',
      stroke: 0xffffff,
      strokeThickness: 2
    });
    speedText.x = GAME_WIDTH - 120;
    speedText.y = 20;
    app.stage.addChild(speedText);

    function jump() {
      if (!isJumping && !isDucking && gameRunning) {
        isJumping = true;
        dinoVelocityY = -16;
      }
    }

    function duck(down: boolean) {
      if (!isJumping && gameRunning) {
        isDucking = down;
        drawDino();
      }
    }

    function updateGame() {
      if (!gameRunning) return;

      // Update clouds
      cloudTimer++;
      if (cloudTimer > 120 + Math.random() * 180) {
        clouds.push(createCloud());
        cloudTimer = 0;
      }
      
      // Move clouds
      for (let i = clouds.length - 1; i >= 0; i--) {
        clouds[i].x -= 2;
        if (clouds[i].x < -100) {
          cloudsContainer.removeChild(clouds[i]);
          clouds.splice(i, 1);
        }
      }

      // Spawn obstacles
      obstacleTimer++;
      const spawnRate = Math.max(60, 120 - Math.floor(localScore / 10) * 5);
      if (obstacleTimer > spawnRate) {
        obstacles.push(createObstacle());
        obstacleTimer = 0;
      }

      // Update obstacles
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= gameSpeed;
        obs.sprite.x = obs.x;
        
        // Remove off-screen obstacles
        if (obs.x < -obs.width) {
          app.stage.removeChild(obs.sprite);
          obstacles.splice(i, 1);
          localScore++;
          setScore(localScore);
          
          // Increase speed every 10 points
          if (localScore % 10 === 0) {
            gameSpeed += 0.5;
          }
        }
      }

      // Update dino physics
      if (isJumping) {
        dinoY += dinoVelocityY;
        dinoVelocityY += 0.8; // gravity
        
        if (dinoY >= GAME_HEIGHT - GROUND_HEIGHT - DINO_SIZE) {
          dinoY = GAME_HEIGHT - GROUND_HEIGHT - DINO_SIZE;
          isJumping = false;
          dinoVelocityY = 0;
          drawDino();
        }
        dino.y = dinoY;
      }

      // Collision detection
      for (const obs of obstacles) {
        const dinoLeft = dino.x + 5;
        const dinoRight = dino.x + (isDucking ? DINO_SIZE + 5 : DINO_SIZE - 5);
        const dinoTop = dino.y + (isDucking ? 20 : 5);
        const dinoBottom = dino.y + (isDucking ? DINO_SIZE - 5 : DINO_SIZE - 5);
        
        const obsLeft = obs.x + 5;
        const obsRight = obs.x + obs.width - 5;
        const obsTop = obs.y + 5;
        const obsBottom = obs.y + obs.height - 5;
        
        if (dinoRight > obsLeft && dinoLeft < obsRight && 
            dinoBottom > obsTop && dinoTop < obsBottom) {
          gameRunning = false;
          setGameState('gameOver');
          
          // Update high score
          if (localScore > highScore) {
            setHighScore(localScore);
            localStorage.setItem('dino-highscore', localScore.toString());
          }
          break;
        }
      }

      // Update UI
      scoreText.text = `Score: ${localScore}`;
      speedText.text = `Speed: ${(gameSpeed / 8).toFixed(1)}x`;
    }

    function handleKeyDown(event: KeyboardEvent) {
      switch(event.code) {
        case 'Space':
        case 'ArrowUp':
        case 'KeyW':
          event.preventDefault();
          jump();
          break;
        case 'ArrowDown':
        case 'KeyS':
          event.preventDefault();
          duck(true);
          break;
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      switch(event.code) {
        case 'ArrowDown':
        case 'KeyS':
          event.preventDefault();
          duck(false);
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Game loop
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
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #87CEEB 0%, #98FB98 100%)',
        fontFamily: 'Arial, sans-serif',
        color: '#2F4F4F',
        padding: '2rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '3rem',
          maxWidth: '600px',
          textAlign: 'center',
          border: '3px solid #228B22',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <h1 style={{ 
            fontSize: '4rem', 
            margin: '0 0 1rem 0',
            background: 'linear-gradient(45deg, #228B22, #32CD32, #98FB98, #00FF00)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            🦕 DINO RUN
          </h1>
          
          <p style={{ fontSize: '1.2rem', margin: '1rem 0', opacity: 0.8 }}>
            ¡Ayuda al dinosaurio a sobrevivir esquivando obstáculos!
          </p>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1rem', 
            margin: '2rem 0' 
          }}>
            <div style={{
              background: 'rgba(34, 139, 34, 0.1)',
              borderRadius: '15px',
              padding: '1.5rem',
              border: '1px solid rgba(34, 139, 34, 0.3)'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#228B22' }}>🎮 Controles</h3>
              <p>Espacio/↑/W: Saltar</p>
              <p>↓/S: Agacharse</p>
              <p>(Mantener presionado para agacharse)</p>
            </div>
            
            <div style={{
              background: 'rgba(34, 139, 34, 0.1)',
              borderRadius: '15px',
              padding: '1.5rem',
              border: '1px solid rgba(34, 139, 34, 0.3)'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#8B4513' }}>🏆 Puntuación</h3>
              <p>Récord actual: <strong>{highScore}</strong></p>
              <p>1 punto por obstáculo evitado</p>
              <p>La velocidad aumenta cada 10 puntos</p>
            </div>
            
            <div style={{
              background: 'rgba(34, 139, 34, 0.1)',
              borderRadius: '15px',
              padding: '1.5rem',
              border: '1px solid rgba(34, 139, 34, 0.3)'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#8B4513' }}>🌵 Obstáculos</h3>
              <p>🌵 Cactus: Salta por encima</p>
              <p>🪨 Rocas: Salta por encima</p>
              <p>🦅 Pájaros: Agáchate o salta</p>
            </div>
          </div>
          
          <button
            onClick={startGame}
            style={{
              padding: '1rem 3rem',
              fontSize: '1.5rem',
              background: 'linear-gradient(45deg, #228B22, #32CD32)',
              border: 'none',
              borderRadius: '50px',
              color: 'white',
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
            🏃‍♂️ ¡EMPEZAR A CORRER!
          </button>
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
          : 'linear-gradient(135deg, #CD853F 0%, #8B4513 100%)',
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
            {isNewRecord ? '🏆 ¡NUEVO RÉCORD!' : '💥 ¡GAME OVER!'}
          </h1>
          <div style={{ fontSize: '1.5rem', margin: '2rem 0' }}>
            <p>🎯 Puntuación: <strong>{score}</strong></p>
            <p>🏆 Récord: <strong>{highScore}</strong></p>
            {isNewRecord && <p style={{ color: '#FFD700' }}>¡Increíble nueva marca personal!</p>}
            {!isNewRecord && <p style={{ color: '#DEB887' }}>El dinosaurio ha sido capturado...</p>}
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={restartGame}
              style={{
                padding: '1rem 2rem',
                fontSize: '1.2rem',
                background: 'linear-gradient(45deg, #228B22, #32CD32)',
                border: 'none',
                borderRadius: '50px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🔄 Correr de Nuevo
            </button>
            <button
              onClick={() => setGameState('start')}
              style={{
                padding: '1rem 2rem',
                fontSize: '1.2rem',
                background: 'linear-gradient(45deg, #8B4513, #CD853F)',
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
      color: '#2F4F4F'
    }}>
      <h1 style={{ margin: '0 0 20px 0', fontSize: '2.5rem' }}>🦕 DINO RUN</h1>
      <div ref={containerRef} style={{ border: '3px solid #228B22', borderRadius: '10px' }} />
      <div style={{ marginTop: '20px', fontSize: '1.2rem' }}>
        <p>Espacio/↑/W saltar, ↓/S agacharse</p>
      </div>
    </div>
  );
};

export default Dino;
