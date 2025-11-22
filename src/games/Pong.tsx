import * as PIXI from 'pixi.js';
import React, { useEffect, useRef, useState } from 'react';
import GameStartScreen from '../components/GameStartScreen';
import GameOverScreen from '../components/GameOverScreen';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PADDLE_WIDTH = 20;
const PADDLE_HEIGHT = 100;
const BALL_RADIUS = 12;
const PADDLE_SPEED = 6;

const Pong: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string>('');

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const app = new PIXI.Application({
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: 0x0f0f23,
    });
    
    if (containerRef.current && app.view instanceof Node) {
      containerRef.current.appendChild(app.view);
    }

    // Draw center line
    const centerLine = new PIXI.Graphics();
    centerLine.lineStyle(3, 0x444444, 0.8);
    for (let i = 0; i < GAME_HEIGHT; i += 20) {
      centerLine.moveTo(GAME_WIDTH / 2, i);
      centerLine.lineTo(GAME_WIDTH / 2, i + 10);
    }
    app.stage.addChild(centerLine);

    // Create paddles with better graphics
    const paddleLeft = new PIXI.Graphics();
    paddleLeft.beginFill(0x4dabf7);
    paddleLeft.drawRoundedRect(-PADDLE_WIDTH/2, -PADDLE_HEIGHT/2, PADDLE_WIDTH, PADDLE_HEIGHT, 5);
    paddleLeft.endFill();
    paddleLeft.x = 40;
    paddleLeft.y = GAME_HEIGHT / 2;
    app.stage.addChild(paddleLeft);

    const paddleRight = new PIXI.Graphics();
    paddleRight.beginFill(0xff4757);
    paddleRight.drawRoundedRect(-PADDLE_WIDTH/2, -PADDLE_HEIGHT/2, PADDLE_WIDTH, PADDLE_HEIGHT, 5);
    paddleRight.endFill();
    paddleRight.x = GAME_WIDTH - 40;
    paddleRight.y = GAME_HEIGHT / 2;
    app.stage.addChild(paddleRight);

    // Create ball
    const ball = new PIXI.Graphics();
    ball.beginFill(0xfeca57);
    ball.drawCircle(0, 0, BALL_RADIUS);
    ball.endFill();
    ball.x = GAME_WIDTH / 2;
    ball.y = GAME_HEIGHT / 2;
    app.stage.addChild(ball);

    // Ball velocity
    let ballVelocity = { 
      x: Math.random() > 0.5 ? 5 : -5, 
      y: (Math.random() - 0.5) * 6 
    };

    // AI difficulty
    const aiSpeed = 4.5;

    // Controls
    let leftUp = false, leftDown = false;
    
    const keydown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'w' || e.key === 'ArrowUp') leftUp = true;
      if (e.key.toLowerCase() === 's' || e.key === 'ArrowDown') leftDown = true;
    };
    
    const keyup = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'w' || e.key === 'ArrowUp') leftUp = false;
      if (e.key.toLowerCase() === 's' || e.key === 'ArrowDown') leftDown = false;
    };
    
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);

    // Game loop
    const gameLoop = () => {
      // Player paddle movement
      if (leftUp && paddleLeft.y > PADDLE_HEIGHT/2) {
        paddleLeft.y -= PADDLE_SPEED;
      }
      if (leftDown && paddleLeft.y < GAME_HEIGHT - PADDLE_HEIGHT/2) {
        paddleLeft.y += PADDLE_SPEED;
      }

      // AI paddle movement
      const aiCenter = paddleRight.y;
      const ballCenter = ball.y;
      if (ballCenter < aiCenter - 10) {
        paddleRight.y = Math.max(PADDLE_HEIGHT/2, paddleRight.y - aiSpeed);
      } else if (ballCenter > aiCenter + 10) {
        paddleRight.y = Math.min(GAME_HEIGHT - PADDLE_HEIGHT/2, paddleRight.y + aiSpeed);
      }

      // Ball movement
      ball.x += ballVelocity.x;
      ball.y += ballVelocity.y;

      // Ball collision with top/bottom walls
      if (ball.y <= BALL_RADIUS || ball.y >= GAME_HEIGHT - BALL_RADIUS) {
        ballVelocity.y *= -1;
        ball.y = Math.max(BALL_RADIUS, Math.min(GAME_HEIGHT - BALL_RADIUS, ball.y));
      }

      // Ball collision with left paddle
      if (ball.x - BALL_RADIUS <= paddleLeft.x + PADDLE_WIDTH/2 &&
          ball.y >= paddleLeft.y - PADDLE_HEIGHT/2 &&
          ball.y <= paddleLeft.y + PADDLE_HEIGHT/2 &&
          ballVelocity.x < 0) {
        ballVelocity.x = Math.abs(ballVelocity.x) * 1.05;
        ballVelocity.y += (ball.y - paddleLeft.y) * 0.1;
        ball.x = paddleLeft.x + PADDLE_WIDTH/2 + BALL_RADIUS;
      }

      // Ball collision with right paddle
      if (ball.x + BALL_RADIUS >= paddleRight.x - PADDLE_WIDTH/2 &&
          ball.y >= paddleRight.y - PADDLE_HEIGHT/2 &&
          ball.y <= paddleRight.y + PADDLE_HEIGHT/2 &&
          ballVelocity.x > 0) {
        ballVelocity.x = -Math.abs(ballVelocity.x) * 1.05;
        ballVelocity.y += (ball.y - paddleRight.y) * 0.1;
        ball.x = paddleRight.x - PADDLE_WIDTH/2 - BALL_RADIUS;
      }

      // Scoring
      if (ball.x < 0) {
        setAiScore(prev => {
          const newScore = prev + 1;
          if (newScore >= 5) {
            setWinner('AI');
            setGameOver(true);
          }
          return newScore;
        });
        resetBall();
      } else if (ball.x > GAME_WIDTH) {
        setPlayerScore(prev => {
          const newScore = prev + 1;
          if (newScore >= 5) {
            setWinner('Jugador');
            setGameOver(true);
          }
          return newScore;
        });
        resetBall();
      }

      // Speed limit
      const maxSpeed = 12;
      if (Math.abs(ballVelocity.x) > maxSpeed) {
        ballVelocity.x = ballVelocity.x > 0 ? maxSpeed : -maxSpeed;
      }
      if (Math.abs(ballVelocity.y) > maxSpeed) {
        ballVelocity.y = ballVelocity.y > 0 ? maxSpeed : -maxSpeed;
      }
    };

    function resetBall() {
      ball.x = GAME_WIDTH / 2;
      ball.y = GAME_HEIGHT / 2;
      ballVelocity = { 
        x: Math.random() > 0.5 ? 5 : -5, 
        y: (Math.random() - 0.5) * 6 
      };
    }

    app.ticker.add(gameLoop);

    return () => {
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      app.destroy(true, { children: true });
    };
  }, [gameStarted, gameOver]);

  const startGame = () => {
    setGameStarted(true);
    setPlayerScore(0);
    setAiScore(0);
    setGameOver(false);
    setWinner('');
  };

  const restartGame = () => {
    setGameStarted(false);
    setPlayerScore(0);
    setAiScore(0);
    setGameOver(false);
    setWinner('');
  };

  if (!gameStarted) {
    return (
      <GameStartScreen
        title="🏓 PONG"
        description="El primer jugador en llegar a 5 puntos gana la partida"
        instructions={[
          {
            title: 'Controles',
            items: [
              'W: Mover paleta hacia arriba',
              'S: Mover paleta hacia abajo',
              '↑↓: También puedes usar las flechas'
            ],
            icon: '🎮'
          },
          {
            title: 'Mecánicas',
            items: [
              'La pelota acelera con cada rebote',
              'El ángulo depende de dónde golpee',
              'La IA se vuelve más agresiva'
            ],
            icon: '⚡'
          }
        ]}
        onStart={startGame}
        theme={{
          primary: '#4facfe',
          secondary: '#00f2fe',
          accent: '#a8edea',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      />
    );
  }

  if (gameOver) {
    return (
      <GameOverScreen
        score={playerScore}
        isVictory={winner === 'Jugador'}
        onRestart={restartGame}
        onMenu={() => window.history.back()}
        theme={{
          primary: '#4facfe',
          secondary: '#00f2fe',
          accent: '#a8edea',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
        customStats={[
          { label: 'Jugador', value: playerScore },
          { label: 'IA', value: aiScore },
          { label: 'Resultado', value: winner === 'Jugador' ? '¡VICTORIA!' : 'DERROTA' }
        ]}
      />
    );
  }

  return (
    <div style={{ textAlign: 'center', padding: '1rem' }}>
      <h1 style={{ marginBottom: '1rem', color: '#4dabf7' }}>🏓 Pong</h1>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '2rem', 
        marginBottom: '1rem',
        fontSize: '2rem',
        fontWeight: 'bold'
      }}>
        <span style={{ color: '#4dabf7' }}>Jugador: {playerScore}</span>
        <span style={{ color: '#ff4757' }}>AI: {aiScore}</span>
      </div>
      <div style={{ marginBottom: '1rem', color: '#666' }}>
        Usa W/S o las flechas para moverte
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

export default Pong;
