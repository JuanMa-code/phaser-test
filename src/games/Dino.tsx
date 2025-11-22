import * as PIXI from 'pixi.js';
import React, { useEffect, useRef, useState } from 'react';
import GameStartScreen from '../components/GameStartScreen';
import GameOverScreen from '../components/GameOverScreen';

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
      <GameStartScreen
        title="🦕 DINO RUN"
        description="¡Ayuda al dinosaurio a sobrevivir esquivando obstáculos!"
        instructions={[
          {
            title: "Controles",
            items: [
              "Espacio/↑/W: Saltar",
              "↓/S: Agacharse",
              "(Mantener presionado para agacharse)"
            ],
            icon: '🎮'
          },
          {
            title: "Puntuación",
            items: [
              "1 punto por obstáculo evitado",
              "La velocidad aumenta cada 10 puntos"
            ],
            icon: '🏆'
          },
          {
            title: "Obstáculos",
            items: [
              "🌵 Cactus: Salta por encima",
              "🪨 Rocas: Salta por encima",
              "🦅 Pájaros: Agáchate o salta"
            ],
            icon: '⚠️'
          }
        ]}
        onStart={startGame}
        highScore={highScore}
        theme={{
          background: 'linear-gradient(135deg, #87CEEB 0%, #98FB98 100%)',
          accent: 'linear-gradient(45deg, #228B22, #32CD32, #98FB98, #00FF00)',
          primary: 'linear-gradient(45deg, #228B22, #32CD32)',
          text: '#2F4F4F'
        }}
      />
    );
  }

  if (gameState === 'gameOver') {
    const isNewRecord = score === highScore && score > 0;
    return (
      <GameOverScreen
        score={score}
        highScore={highScore}
        onRestart={restartGame}
        onMenu={() => setGameState('start')}
        isNewRecord={isNewRecord}
        theme={{
          background: isNewRecord 
            ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
            : 'linear-gradient(135deg, #CD853F 0%, #8B4513 100%)',
          primary: 'linear-gradient(45deg, #228B22, #32CD32)',
          secondary: 'linear-gradient(45deg, #8B4513, #CD853F)'
        }}
      />
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      padding: '20px',
      background: 'linear-gradient(135deg, #87CEEB 0%, #98FB98 100%)',
      minHeight: '100dvh',
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
