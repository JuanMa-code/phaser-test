import * as PIXI from 'pixi.js';
import React, { useEffect, useRef, useState } from 'react';

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
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #70C5CE 0%, #8BC34A 100%)',
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
            background: 'linear-gradient(45deg, #FFD700, #FFA500)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 30px rgba(255, 215, 0, 0.5)'
          }}>
            🐦 FLAPPY BIRD
          </h1>
          
          <p style={{ 
            fontSize: '1.1rem', 
            marginBottom: '1.5rem', 
            opacity: 0.9,
            lineHeight: '1.4'
          }}>
            ¡Ayuda al pájaro a volar entre las tuberías!
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
              <p style={{ marginBottom: '0.5rem' }}>🚀 Espacio/↑/W: Aletear hacia arriba</p>
              <p style={{ marginBottom: '0.5rem' }}>🖱️ Click: También hace aletear</p>
              <p>⚡ ¡Mantén el ritmo para no caer!</p>
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
              🎯 Objetivo del Juego
            </h3>
            <div style={{ 
              fontSize: '0.95rem',
              textAlign: 'left',
              lineHeight: '1.4'
            }}>
              <p style={{ marginBottom: '0.5rem' }}>🏆 Récord actual: <strong>{highScore}</strong></p>
              <p style={{ marginBottom: '0.5rem' }}>📊 1 punto por tubería pasada</p>
              <p>�️ La velocidad aumenta cada 5 puntos</p>
            </div>
          </div>
          
          <button
            onClick={startGame}
            style={{
              fontSize: '1.2rem',
              padding: '0.8rem 2rem',
              background: 'linear-gradient(45deg, #FFD700, #FFA500)',
              color: '#2E7D32',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)',
              transition: 'all 0.3s ease',
              transform: 'translateY(0)',
              marginBottom: '1.5rem'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.3)';
            }}
          >
            🚀 ¡Empezar a Volar!
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
              💡 Consejos Pro
            </h3>
            <div style={{ 
              fontSize: '0.95rem',
              textAlign: 'left',
              lineHeight: '1.4'
            }}>
              <p style={{ marginBottom: '0.5rem' }}>• El timing es la clave del éxito</p>
              <p style={{ marginBottom: '0.5rem' }}>• No aletees demasiado seguido</p>
              <p>• Mantén una altitud constante</p>
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
          : 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
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
            {isNewRecord && <p style={{ color: '#FFD700' }}>¡Vuelo espectacular!</p>}
            {!isNewRecord && <p style={{ color: '#FFB6C1' }}>El pájaro se estrelló...</p>}
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={restartGame}
              style={{
                padding: '1rem 2rem',
                fontSize: '1.2rem',
                background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                border: 'none',
                borderRadius: '50px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🔄 Volar de Nuevo
            </button>
            <button
              onClick={() => setGameState('start')}
              style={{
                padding: '1rem 2rem',
                fontSize: '1.2rem',
                background: 'linear-gradient(45deg, #70C5CE, #8BC34A)',
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
      background: 'linear-gradient(135deg, #70C5CE 0%, #8BC34A 100%)',
      minHeight: '100vh',
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
