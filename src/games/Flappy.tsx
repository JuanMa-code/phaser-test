import * as PIXI from 'pixi.js';
import React, { useEffect, useRef, useState } from 'react';
import GameStartScreen from '../components/GameStartScreen';
import GameOverScreen from '../components/GameOverScreen';

const GAME_WIDTH = 480;
const GAME_HEIGHT = 640;
const BIRD_SIZE = 24;
const PIPE_WIDTH = 80;
const PIPE_GAP = 140;

interface Pipe {
  topSprite: PIXI.Graphics;
  bottomSprite: PIXI.Graphics;
  x: number;
  gapY: number;
  passed: boolean;
}

const Flappy: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameOver'>('start');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('flappy-highscore');
    return saved ? parseInt(saved) : 0;
  });

  useEffect(() => {
    if (gameState !== 'playing') return;

    const app = new PIXI.Application({
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: 0x70C5CE, // Sky blue
    });

    if (containerRef.current && app.view instanceof Node) {
      containerRef.current.appendChild(app.view);
    }

    let gameRunning = true;
    let localScore = 0;
    let pipeSpeed = 3;
    let pipeTimer = 0;
    let cloudTimer = 0;

    // Background layers
    const backgroundContainer = new PIXI.Container();
    app.stage.addChild(backgroundContainer);

    // Clouds
    const cloudsContainer = new PIXI.Container();
    backgroundContainer.addChild(cloudsContainer);

    function createCloud() {
      const cloud = new PIXI.Graphics();
      cloud.beginFill(0xffffff, 0.8);
      
      // Cloud shape
      cloud.drawCircle(0, 0, 18);
      cloud.drawCircle(25, 0, 22);
      cloud.drawCircle(50, 0, 18);
      cloud.drawCircle(12, -10, 14);
      cloud.drawCircle(37, -10, 16);
      
      cloud.endFill();
      cloud.x = GAME_WIDTH + Math.random() * 100;
      cloud.y = 80 + Math.random() * 150;
      cloud.alpha = 0.6;
      cloudsContainer.addChild(cloud);
      
      return cloud;
    }

    // Ground
    const ground = new PIXI.Graphics();
    ground.beginFill(0x8BC34A); // Green ground
    ground.drawRect(0, GAME_HEIGHT - 80, GAME_WIDTH, 80);
    ground.endFill();
    
    // Ground pattern
    ground.beginFill(0x4CAF50);
    for (let x = 0; x < GAME_WIDTH; x += 20) {
      ground.drawRect(x, GAME_HEIGHT - 20, 10, 20);
    }
    ground.endFill();
    
    backgroundContainer.addChild(ground);

    // Bird
    let birdY = GAME_HEIGHT / 2;
    let birdVelocityY = 0;
    let birdRotation = 0;
    let wingFlap = 0;
    
    const bird = new PIXI.Graphics();
    
    function drawBird() {
      bird.clear();
      
      // Bird body
      bird.beginFill(0xFFD700); // Golden yellow
      bird.drawEllipse(0, 0, BIRD_SIZE, BIRD_SIZE * 0.8);
      bird.endFill();
      
      // Wing
      const wingOffset = Math.sin(wingFlap) * 3;
      bird.beginFill(0xFFA500); // Orange wing
      bird.drawEllipse(-8, wingOffset - 5, 15, 8);
      bird.endFill();
      
      // Beak
      bird.beginFill(0xFF6347); // Red-orange beak
      bird.drawPolygon([BIRD_SIZE - 5, -3, BIRD_SIZE + 8, 0, BIRD_SIZE - 5, 3]);
      bird.endFill();
      
      // Eye
      bird.beginFill(0x000000);
      bird.drawCircle(8, -5, 4);
      bird.endFill();
      
      bird.beginFill(0xffffff);
      bird.drawCircle(10, -6, 2);
      bird.endFill();
      
      // Tail feathers
      bird.beginFill(0xFF8C00);
      bird.drawPolygon([-BIRD_SIZE + 2, -8, -BIRD_SIZE - 8, -4, -BIRD_SIZE - 8, 4, -BIRD_SIZE + 2, 8]);
      bird.endFill();
    }
    
    bird.x = 120;
    bird.y = birdY;
    app.stage.addChild(bird);
    drawBird();

    // Pipes
    let pipes: Pipe[] = [];
    let clouds: PIXI.Graphics[] = [];

    function createPipe(): Pipe {
      const gapY = 120 + Math.random() * (GAME_HEIGHT - 280);
      
      // Top pipe
      const topSprite = new PIXI.Graphics();
      topSprite.beginFill(0x4CAF50); // Green pipe
      topSprite.drawRoundedRect(0, 0, PIPE_WIDTH, gapY - PIPE_GAP/2, 8);
      topSprite.endFill();
      
      // Pipe cap (top)
      topSprite.beginFill(0x388E3C);
      topSprite.drawRoundedRect(-8, gapY - PIPE_GAP/2 - 20, PIPE_WIDTH + 16, 20, 4);
      topSprite.endFill();
      
      // Pipe highlights
      topSprite.beginFill(0x66BB6A);
      topSprite.drawRect(8, 0, 8, gapY - PIPE_GAP/2);
      topSprite.drawRect(PIPE_WIDTH - 16, 0, 8, gapY - PIPE_GAP/2);
      topSprite.endFill();
      
      // Bottom pipe
      const bottomSprite = new PIXI.Graphics();
      bottomSprite.beginFill(0x4CAF50);
      bottomSprite.drawRoundedRect(0, gapY + PIPE_GAP/2, PIPE_WIDTH, GAME_HEIGHT - (gapY + PIPE_GAP/2) - 80, 8);
      bottomSprite.endFill();
      
      // Pipe cap (bottom)
      bottomSprite.beginFill(0x388E3C);
      bottomSprite.drawRoundedRect(-8, gapY + PIPE_GAP/2, PIPE_WIDTH + 16, 20, 4);
      bottomSprite.endFill();
      
      // Pipe highlights
      bottomSprite.beginFill(0x66BB6A);
      bottomSprite.drawRect(8, gapY + PIPE_GAP/2, 8, GAME_HEIGHT - (gapY + PIPE_GAP/2) - 80);
      bottomSprite.drawRect(PIPE_WIDTH - 16, gapY + PIPE_GAP/2, 8, GAME_HEIGHT - (gapY + PIPE_GAP/2) - 80);
      bottomSprite.endFill();
      
      const x = GAME_WIDTH;
      topSprite.x = x;
      bottomSprite.x = x;
      
      app.stage.addChild(topSprite);
      app.stage.addChild(bottomSprite);
      
      return {
        topSprite,
        bottomSprite,
        x,
        gapY,
        passed: false
      };
    }

    // UI
    const scoreText = new PIXI.Text('0', { 
      fontSize: 48, 
      fill: 0xffffff, 
      fontWeight: 'bold',
      stroke: 0x000000,
      strokeThickness: 4
    });
    scoreText.anchor.set(0.5);
    scoreText.x = GAME_WIDTH / 2;
    scoreText.y = 80;
    app.stage.addChild(scoreText);

    function flap() {
      if (gameRunning) {
        birdVelocityY = -8;
        birdRotation = -0.3;
      }
    }

    function updateGame() {
      if (!gameRunning) return;

      // Update clouds
      cloudTimer++;
      if (cloudTimer > 180 + Math.random() * 120) {
        clouds.push(createCloud());
        cloudTimer = 0;
      }
      
      // Move clouds
      for (let i = clouds.length - 1; i >= 0; i--) {
        clouds[i].x -= 1;
        if (clouds[i].x < -100) {
          cloudsContainer.removeChild(clouds[i]);
          clouds.splice(i, 1);
        }
      }

      // Spawn pipes
      pipeTimer++;
      if (pipeTimer > 120) { // Every 2 seconds at 60fps
        pipes.push(createPipe());
        pipeTimer = 0;
      }

      // Update pipes
      for (let i = pipes.length - 1; i >= 0; i--) {
        const pipe = pipes[i];
        pipe.x -= pipeSpeed;
        pipe.topSprite.x = pipe.x;
        pipe.bottomSprite.x = pipe.x;
        
        // Score when bird passes pipe
        if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
          pipe.passed = true;
          localScore++;
          setScore(localScore);
          
          // Increase speed slightly every 5 points
          if (localScore % 5 === 0) {
            pipeSpeed += 0.2;
          }
        }
        
        // Remove off-screen pipes
        if (pipe.x < -PIPE_WIDTH) {
          app.stage.removeChild(pipe.topSprite);
          app.stage.removeChild(pipe.bottomSprite);
          pipes.splice(i, 1);
        }
      }

      // Update bird physics
      birdVelocityY += 0.5; // gravity
      birdY += birdVelocityY;
      
      // Bird rotation based on velocity
      birdRotation = Math.max(-0.5, Math.min(1.2, birdVelocityY * 0.1));
      
      // Wing flap animation
      wingFlap += 0.3;
      
      bird.y = birdY;
      bird.rotation = birdRotation;
      drawBird();

      // Collision detection
      // Ground and ceiling
      if (birdY - BIRD_SIZE < 0 || birdY + BIRD_SIZE > GAME_HEIGHT - 80) {
        gameRunning = false;
        setGameState('gameOver');
        
        // Update high score
        if (localScore > highScore) {
          setHighScore(localScore);
          localStorage.setItem('flappy-highscore', localScore.toString());
        }
        return;
      }

      // Pipe collision
      for (const pipe of pipes) {
        if (bird.x + BIRD_SIZE > pipe.x && bird.x - BIRD_SIZE < pipe.x + PIPE_WIDTH) {
          if (birdY - BIRD_SIZE < pipe.gapY - PIPE_GAP/2 || birdY + BIRD_SIZE > pipe.gapY + PIPE_GAP/2) {
            gameRunning = false;
            setGameState('gameOver');
            
            // Update high score
            if (localScore > highScore) {
              setHighScore(localScore);
              localStorage.setItem('flappy-highscore', localScore.toString());
            }
            return;
          }
        }
      }

      // Update UI
      scoreText.text = localScore.toString();
    }

    function handleKeyDown(event: KeyboardEvent) {
      switch(event.code) {
        case 'Space':
        case 'ArrowUp':
        case 'KeyW':
          event.preventDefault();
          flap();
          break;
      }
    }

    function handleClick() {
      flap();
    }

    window.addEventListener('keydown', handleKeyDown);
    if (app.view && 'addEventListener' in app.view) {
      (app.view as any).addEventListener('click', handleClick);
    }
    
    // Game loop
    app.ticker.add(updateGame);

    return () => {
      gameRunning = false;
      window.removeEventListener('keydown', handleKeyDown);
      if (app.view && 'removeEventListener' in app.view) {
        (app.view as any).removeEventListener('click', handleClick);
      }
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
        title="🐦 FLAPPY BIRD"
        description="¡Ayuda al pájaro a volar entre las tuberías!"
        highScore={highScore}
        instructions={[
          {
            title: 'Controles',
            items: [
              '🚀 Espacio/↑/W: Aletear hacia arriba',
              '🖱️ Click: También hace aletear'
            ],
            icon: '🎮'
          },
          {
            title: 'Objetivo',
            items: [
              '📊 1 punto por tubería pasada',
              '⚡ La velocidad aumenta cada 5 puntos'
            ],
            icon: '🎯'
          },
          {
            title: 'Consejos',
            items: [
              'El timing es la clave del éxito',
              'No aletees demasiado seguido',
              'Mantén una altitud constante'
            ],
            icon: '💡'
          }
        ]}
        onStart={startGame}
        theme={{
          primary: '#FFD700',
          secondary: '#FFA500',
          accent: '#70C5CE',
          background: 'linear-gradient(135deg, #70C5CE 0%, #8BC34A 100%)'
        }}
      />
    );
  }

  if (gameState === 'gameOver') {
    return (
      <GameOverScreen
        score={score}
        highScore={highScore}
        onRestart={restartGame}
        onMenu={() => setGameState('start')}
        theme={{
          primary: '#FFD700',
          secondary: '#FFA500',
          accent: '#70C5CE',
          background: 'linear-gradient(135deg, #70C5CE 0%, #8BC34A 100%)'
        }}
        customStats={[
          { label: 'Puntuación', value: score },
          { label: 'Récord', value: highScore }
        ]}
      />
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      padding: '20px',
      background: 'linear-gradient(135deg, #70C5CE 0%, #8BC34A 100%)',
      minHeight: '100dvh',
      fontFamily: 'Arial, sans-serif',
      color: '#2E7D32'
    }}>
      <h1 style={{ margin: '0 0 20px 0', fontSize: '2.5rem' }}>🐦 FLAPPY BIRD</h1>
      <div ref={containerRef} style={{ border: '3px solid #FFD700', borderRadius: '10px' }} />
      <div style={{ marginTop: '20px', fontSize: '1.2rem' }}>
        <p>Espacio/↑/W/Click para aletear</p>
      </div>
    </div>
  );
};

export default Flappy;
