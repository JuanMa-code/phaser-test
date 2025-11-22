import * as PIXI from 'pixi.js';
import React, { useEffect, useRef, useState } from 'react';
import GameStartScreen from '../components/GameStartScreen';
import GameOverScreen from '../components/GameOverScreen';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 20;
const BALL_RADIUS = 10;
const PADDLE_SPEED = 8;
const BALL_SPEED = 5;

const Arkanoid: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [victory, setVictory] = useState(false);

  useEffect(() => {
    if (!gameStarted || gameOver || victory) return;

    const app = new PIXI.Application({
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: 0x0f0f23,
    });
    
    if (containerRef.current && app.view instanceof Node) {
      containerRef.current.appendChild(app.view);
    }

    // Create gradient background
    const bg = new PIXI.Graphics();
    bg.beginFill(0x1a1a2e);
    bg.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.endFill();
    app.stage.addChild(bg);

    // Paddle with better graphics
    const paddle = new PIXI.Graphics();
    paddle.beginFill(0x4dabf7);
    paddle.drawRoundedRect(-PADDLE_WIDTH/2, -PADDLE_HEIGHT/2, PADDLE_WIDTH, PADDLE_HEIGHT, 8);
    paddle.endFill();
    // Add glow effect
    paddle.lineStyle(2, 0x74c0fc, 0.8);
    paddle.drawRoundedRect(-PADDLE_WIDTH/2, -PADDLE_HEIGHT/2, PADDLE_WIDTH, PADDLE_HEIGHT, 8);
    paddle.x = GAME_WIDTH / 2;
    paddle.y = GAME_HEIGHT - 50;
    app.stage.addChild(paddle);

    // Ball with trail effect
    const ball = new PIXI.Graphics();
    ball.beginFill(0xfeca57);
    ball.drawCircle(0, 0, BALL_RADIUS);
    ball.endFill();
    ball.lineStyle(2, 0xffd43b);
    ball.drawCircle(0, 0, BALL_RADIUS);
    ball.x = GAME_WIDTH / 2;
    ball.y = GAME_HEIGHT - 150;
    app.stage.addChild(ball);

    // Create colorful bricks
    const bricks: PIXI.Graphics[] = [];
    const brickColors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xffeaa7, 0xdda0dd, 0x98d8c8];
    
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 10; col++) {
        const brick = new PIXI.Graphics();
        const color = brickColors[row % brickColors.length];
        
        brick.beginFill(color);
        brick.drawRoundedRect(0, 0, 70, 25, 5);
        brick.endFill();
        
        // Add border
        brick.lineStyle(2, 0xffffff, 0.3);
        brick.drawRoundedRect(0, 0, 70, 25, 5);
        
        brick.x = 25 + col * 75;
        brick.y = 60 + row * 30;
        app.stage.addChild(brick);
        bricks.push(brick);
      }
    }

    let ballVelocity = { x: BALL_SPEED, y: -BALL_SPEED };
    let currentScore = 0;
    let currentLives = 3;
    
    // Controls - changed to A and D
    let leftPressed = false, rightPressed = false;
    
    const keydown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'a') leftPressed = true;
      if (key === 'd') rightPressed = true;
    };
    
    const keyup = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'a') leftPressed = false;
      if (key === 'd') rightPressed = false;
    };
    
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);

    // Game UI
    function updateUI() {
      // Remove existing UI
      app.stage.children.forEach(child => {
        if (child instanceof PIXI.Text) {
          app.stage.removeChild(child);
        }
      });

      // Score
      const scoreText = new PIXI.Text(`Score: ${currentScore}`, {
        fill: 0xffffff,
        fontSize: 20,
        fontWeight: 'bold'
      });
      scoreText.x = 20;
      scoreText.y = 20;
      app.stage.addChild(scoreText);

      // Lives
      const livesText = new PIXI.Text(`Lives: ${currentLives}`, {
        fill: 0xff6b6b,
        fontSize: 20,
        fontWeight: 'bold'
      });
      livesText.x = GAME_WIDTH - 120;
      livesText.y = 20;
      app.stage.addChild(livesText);

      // Level
      const levelText = new PIXI.Text(`Level: ${level}`, {
        fill: 0x4ecdc4,
        fontSize: 20,
        fontWeight: 'bold'
      });
      levelText.x = GAME_WIDTH / 2 - 40;
      levelText.y = 20;
      app.stage.addChild(levelText);
    }

    // Game loop
    app.ticker.add(() => {
      // Paddle movement
      if (leftPressed && paddle.x > PADDLE_WIDTH/2) {
        paddle.x -= PADDLE_SPEED;
      }
      if (rightPressed && paddle.x < GAME_WIDTH - PADDLE_WIDTH/2) {
        paddle.x += PADDLE_SPEED;
      }

      // Ball movement
      ball.x += ballVelocity.x;
      ball.y += ballVelocity.y;

      // Wall collisions
      if (ball.x <= BALL_RADIUS || ball.x >= GAME_WIDTH - BALL_RADIUS) {
        ballVelocity.x *= -1;
        ball.x = Math.max(BALL_RADIUS, Math.min(GAME_WIDTH - BALL_RADIUS, ball.x));
      }
      if (ball.y <= BALL_RADIUS) {
        ballVelocity.y *= -1;
        ball.y = BALL_RADIUS;
      }

      // Paddle collision
      if (ball.y + BALL_RADIUS >= paddle.y - PADDLE_HEIGHT/2 &&
          ball.y <= paddle.y + PADDLE_HEIGHT/2 &&
          ball.x >= paddle.x - PADDLE_WIDTH/2 &&
          ball.x <= paddle.x + PADDLE_WIDTH/2 &&
          ballVelocity.y > 0) {
        
        ballVelocity.y = -Math.abs(ballVelocity.y);
        ball.y = paddle.y - PADDLE_HEIGHT/2 - BALL_RADIUS;
        
        // Add spin based on where ball hits paddle
        const hitPosition = (ball.x - paddle.x) / (PADDLE_WIDTH/2);
        ballVelocity.x = hitPosition * BALL_SPEED;
      }

      // Brick collisions
      for (let i = bricks.length - 1; i >= 0; i--) {
        const brick = bricks[i];
        if (ball.x + BALL_RADIUS > brick.x &&
            ball.x - BALL_RADIUS < brick.x + 70 &&
            ball.y + BALL_RADIUS > brick.y &&
            ball.y - BALL_RADIUS < brick.y + 25) {
          
          app.stage.removeChild(brick);
          bricks.splice(i, 1);
          ballVelocity.y *= -1;
          
          currentScore += 10;
          setScore(currentScore);
          
          // Check victory after removing brick
          if (bricks.length === 0) {
            setVictory(true);
            return; // Exit game loop
          }
          break;
        }
      }

      // Ball falls below paddle
      if (ball.y > GAME_HEIGHT) {
        currentLives--;
        setLives(currentLives);
        
        if (currentLives <= 0) {
          setGameOver(true);
          return; // Exit game loop
        } else {
          // Reset ball position
          ball.x = GAME_WIDTH / 2;
          ball.y = GAME_HEIGHT - 150;
          ballVelocity = { x: BALL_SPEED, y: -BALL_SPEED };
        }
      }

      updateUI();
    });

    updateUI();

    return () => {
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      app.destroy(true, { children: true });
    };
  }, [gameStarted, gameOver, victory]);

  const startGame = () => {
    setGameStarted(true);
    setScore(0);
    setLives(3);
    setGameOver(false);
    setVictory(false);
  };

  const restartGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setVictory(false);
    // Small delay to ensure cleanup, then restart
    setTimeout(() => {
      setScore(0);
      setLives(3);
      setGameStarted(true);
    }, 100);
  };

  if (!gameStarted) {
    return (
      <GameStartScreen
        title="🧱 ARKANOID"
        description="¡Destruye todos los bloques!"
        instructions={[
          {
            title: 'Controles',
            items: [
              'A: Mover izquierda',
              'D: Mover derecha',
              'Evita que la pelota caiga'
            ],
            icon: '🎮'
          },
          {
            title: 'Reglas',
            items: [
              '3 Vidas',
              '10 pts/bloque',
              'Física realista'
            ],
            icon: '📋'
          }
        ]}
        onStart={startGame}
        theme={{
          primary: '#feca57',
          secondary: '#ff6b6b',
          accent: '#ff9ff3',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
        }}
      />
    );
  }

  if (gameOver || victory) {
    return (
      <GameOverScreen
        score={score}
        isVictory={victory}
        onRestart={restartGame}
        onMenu={() => window.history.back()}
        theme={{
          primary: '#feca57',
          secondary: '#ff6b6b',
          accent: '#ff9ff3',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
        }}
      />
    );
  }

  return (
    <div style={{ textAlign: 'center', padding: '1rem' }}>
      <h1 style={{ marginBottom: '1rem', color: '#4dabf7' }}>🧱 Arkanoid</h1>
      <div style={{ marginBottom: '1rem', color: '#666' }}>
        Usa A y D para mover la paleta • ¡Destruye todos los bloques!
      </div>
      <div ref={containerRef} style={{ 
        display: 'inline-block',
        border: '3px solid #4dabf7',
        borderRadius: '8px',
        overflow: 'hidden'
      }} />
    </div>
  );
};

export default Arkanoid;
