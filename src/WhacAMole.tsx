import * as PIXI from 'pixi.js';
import React, { useEffect, useRef, useState } from 'react';

const GAME_WIDTH = 720;
const GAME_HEIGHT = 540;
const HOLE_SIZE = 80;
const MOLE_SIZE = 70;

interface Hole {
  x: number;
  y: number;
  hasMole: boolean;
  moleSprite?: PIXI.Container;
  holeSprite: PIXI.Graphics;
  timer: number;
  showTime: number;
}

const WhacAMole: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameOver'>('start');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('whac-highscore');
    return saved ? parseInt(saved) : 0;
  });

  useEffect(() => {
    if (gameState !== 'playing') return;

    const app = new PIXI.Application({
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: 0x2E7D32, // Dark green grass
    });

    if (containerRef.current && app.view instanceof Node) {
      containerRef.current.appendChild(app.view);
    }

    let gameRunning = true;
    let localScore = 0;
    let localTimeLeft = 60;
    let combo = 0;
    let maxCombo = 0;

    // Difficulty settings
    const difficultySettings = {
      easy: { moleShowTime: 120, spawnRate: 0.02, maxMoles: 2 },
      medium: { moleShowTime: 90, spawnRate: 0.03, maxMoles: 3 },
      hard: { moleShowTime: 60, spawnRate: 0.04, maxMoles: 4 }
    };
    const settings = difficultySettings[difficulty];

    // Background grass texture
    const grassContainer = new PIXI.Container();
    app.stage.addChild(grassContainer);
    
    for (let i = 0; i < 50; i++) {
      const grass = new PIXI.Graphics();
      grass.beginFill(0x4CAF50, Math.random() * 0.3 + 0.7);
      grass.drawRect(0, 0, 15, 8);
      grass.endFill();
      grass.x = Math.random() * GAME_WIDTH;
      grass.y = Math.random() * GAME_HEIGHT;
      grass.rotation = Math.random() * Math.PI;
      grassContainer.addChild(grass);
    }

    // Create holes in a 3x3 grid
    const holes: Hole[] = [];
    const rows = 3;
    const cols = 3;
    const startX = 120;
    const startY = 100;
    const spacingX = 180;
    const spacingY = 140;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * spacingX;
        const y = startY + row * spacingY;
        
        // Create hole
        const holeSprite = new PIXI.Graphics();
        holeSprite.beginFill(0x1B5E20); // Very dark green
        holeSprite.drawEllipse(0, 0, HOLE_SIZE / 2, HOLE_SIZE / 3);
        holeSprite.endFill();
        
        // Hole rim
        holeSprite.beginFill(0x2E7D32);
        holeSprite.drawEllipse(0, -5, HOLE_SIZE / 2 + 5, HOLE_SIZE / 3 + 3);
        holeSprite.endFill();
        
        // Inner shadow
        holeSprite.beginFill(0x1B5E20);
        holeSprite.drawEllipse(0, 0, HOLE_SIZE / 2, HOLE_SIZE / 3);
        holeSprite.endFill();
        
        holeSprite.x = x;
        holeSprite.y = y;
        app.stage.addChild(holeSprite);
        
        holes.push({
          x,
          y,
          hasMole: false,
          holeSprite,
          timer: 0,
          showTime: 0
        });
      }
    }

    function createMole(hole: Hole) {
      const moleContainer = new PIXI.Container();
      
      // Mole body
      const body = new PIXI.Graphics();
      body.beginFill(0x8D6E63); // Brown
      body.drawEllipse(0, 0, MOLE_SIZE / 2, MOLE_SIZE / 2.5);
      body.endFill();
      
      // Mole snout
      body.beginFill(0x795548);
      body.drawEllipse(0, 15, 15, 8);
      body.endFill();
      
      // Eyes
      body.beginFill(0x000000);
      body.drawCircle(-12, -8, 4);
      body.drawCircle(12, -8, 4);
      body.endFill();
      
      // Eye shine
      body.beginFill(0xffffff);
      body.drawCircle(-10, -10, 1.5);
      body.drawCircle(14, -10, 1.5);
      body.endFill();
      
      // Nose
      body.beginFill(0x000000);
      body.drawEllipse(0, 12, 3, 2);
      body.endFill();
      
      // Whiskers
      body.lineStyle(2, 0x000000);
      body.moveTo(-20, 8);
      body.lineTo(-35, 5);
      body.moveTo(-20, 15);
      body.lineTo(-35, 18);
      body.moveTo(20, 8);
      body.lineTo(35, 5);
      body.moveTo(20, 15);
      body.lineTo(35, 18);
      
      // Ears
      body.beginFill(0x6D4C41);
      body.drawEllipse(-18, -20, 8, 6);
      body.drawEllipse(18, -20, 8, 6);
      body.endFill();
      
      moleContainer.addChild(body);
      moleContainer.x = hole.x;
      moleContainer.y = hole.y;
      moleContainer.interactive = true;
      moleContainer.cursor = 'pointer';
      
      // Click handler
      moleContainer.on('pointerdown', () => {
        if (!gameRunning || !hole.hasMole) return;
        
        hitMole(hole);
      });
      
      app.stage.addChild(moleContainer);
      hole.moleSprite = moleContainer;
      hole.hasMole = true;
      hole.showTime = settings.moleShowTime;
    }

    function hitMole(hole: Hole) {
      if (!hole.hasMole || !hole.moleSprite) return;
      
      // Remove mole
      app.stage.removeChild(hole.moleSprite);
      hole.moleSprite = undefined;
      hole.hasMole = false;
      hole.timer = Math.random() * 180 + 60; // Random delay
      
      // Update score
      combo++;
      const points = combo > 5 ? 15 : combo > 3 ? 10 : 5;
      localScore += points;
      setScore(localScore);
      maxCombo = Math.max(maxCombo, combo);
      
      // Visual feedback
      const hitText = new PIXI.Text(`+${points}`, {
        fontSize: 32,
        fill: combo > 5 ? 0xFFD700 : combo > 3 ? 0xFF6347 : 0x4CAF50,
        fontWeight: 'bold'
      });
      hitText.anchor.set(0.5);
      hitText.x = hole.x;
      hitText.y = hole.y - 50;
      app.stage.addChild(hitText);
      
      // Animate hit text
      let textTimer = 60;
      const animateHitText = () => {
        if (textTimer > 0) {
          hitText.y -= 2;
          hitText.alpha = textTimer / 60;
          textTimer--;
          setTimeout(animateHitText, 16);
        } else {
          app.stage.removeChild(hitText);
        }
      };
      animateHitText();
    }

    function removeMole(hole: Hole) {
      if (hole.moleSprite) {
        app.stage.removeChild(hole.moleSprite);
        hole.moleSprite = undefined;
      }
      hole.hasMole = false;
      hole.timer = Math.random() * 120 + 30; // Random delay
      
      // Break combo if mole escapes
      combo = 0;
    }

    // UI Elements
    const scoreText = new PIXI.Text('Score: 0', {
      fontSize: 32,
      fill: 0xffffff,
      fontWeight: 'bold',
      stroke: 0x000000,
      strokeThickness: 3
    });
    scoreText.x = 20;
    scoreText.y = 20;
    app.stage.addChild(scoreText);

    const timeText = new PIXI.Text('Time: 60', {
      fontSize: 32,
      fill: 0xffffff,
      fontWeight: 'bold',
      stroke: 0x000000,
      strokeThickness: 3
    });
    timeText.x = GAME_WIDTH - 180;
    timeText.y = 20;
    app.stage.addChild(timeText);

    const comboText = new PIXI.Text('Combo: 0', {
      fontSize: 24,
      fill: 0xFFD700,
      fontWeight: 'bold',
      stroke: 0x000000,
      strokeThickness: 2
    });
    comboText.x = 20;
    comboText.y = 70;
    app.stage.addChild(comboText);

    // Game timer
    const gameTimer = setInterval(() => {
      if (gameRunning && localTimeLeft > 0) {
        localTimeLeft--;
        setTimeLeft(localTimeLeft);
        
        if (localTimeLeft <= 0) {
          gameRunning = false;
          setGameState('gameOver');
          
          // Update high score
          if (localScore > highScore) {
            setHighScore(localScore);
            localStorage.setItem('whac-highscore', localScore.toString());
          }
        }
      }
    }, 1000);

    function updateGame() {
      if (!gameRunning) return;

      // Update holes and moles
      const activeMoles = holes.filter(h => h.hasMole).length;
      
      for (const hole of holes) {
        if (hole.hasMole && hole.moleSprite) {
          // Mole is showing, countdown to hide
          hole.showTime--;
          if (hole.showTime <= 0) {
            removeMole(hole);
          }
        } else if (!hole.hasMole) {
          // Hole is empty, countdown to show mole
          hole.timer--;
          if (hole.timer <= 0 && activeMoles < settings.maxMoles && Math.random() < settings.spawnRate) {
            createMole(hole);
          }
        }
      }

      // Update UI
      scoreText.text = `Score: ${localScore}`;
      timeText.text = `Time: ${localTimeLeft}`;
      comboText.text = `Combo: ${combo}`;
      comboText.style.fill = combo > 5 ? 0xFFD700 : combo > 3 ? 0xFF6347 : combo > 0 ? 0x4CAF50 : 0xffffff;
    }

    // Game loop
    app.ticker.add(updateGame);

    return () => {
      gameRunning = false;
      clearInterval(gameTimer);
      if (containerRef.current && app.view instanceof Node) {
        containerRef.current.removeChild(app.view);
      }
      app.destroy();
    };
  }, [gameState, difficulty]);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(60);
  };

  const restartGame = () => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(60);
  };

  if (gameState === 'start') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
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
            background: 'linear-gradient(45deg, #8D6E63, #D7CCC8)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 30px rgba(141, 110, 99, 0.5)'
          }}>
            🔨 WHAC-A-MOLE
          </h1>
          
          <p style={{ 
            fontSize: '1.1rem', 
            marginBottom: '1.5rem', 
            opacity: 0.9,
            lineHeight: '1.4'
          }}>
            ¡Golpea a los topos antes de que se escondan!
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
              🎯 Selecciona Dificultad
            </h3>
            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {(['easy', 'medium', 'hard'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  style={{
                    padding: '0.6rem 1rem',
                    fontSize: '0.9rem',
                    background: difficulty === level 
                      ? 'linear-gradient(45deg, #4CAF50, #45a049)' 
                      : 'rgba(255, 255, 255, 0.2)',
                    border: difficulty === level ? '2px solid #4CAF50' : '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease',
                    textAlign: 'center'
                  }}
                >
                  <div>{level.charAt(0).toUpperCase() + level.slice(1)}</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                    {level === 'easy' && '2 topos max'}
                    {level === 'medium' && '3 topos max'}
                    {level === 'hard' && '4 topos max'}
                  </div>
                </button>
              ))}
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
              🎮 Controles y Puntuación
            </h3>
            <div style={{ 
              fontSize: '0.95rem',
              textAlign: 'left',
              lineHeight: '1.4'
            }}>
              <p style={{ marginBottom: '0.5rem' }}>🖱️ Click en los topos para golpearlos</p>
              <p style={{ marginBottom: '0.5rem' }}>🏆 Récord actual: <strong>{highScore}</strong></p>
              <p>⚡ Sistema de combos: más hits seguidos = más puntos</p>
            </div>
          </div>
          
          <button
            onClick={startGame}
            style={{
              fontSize: '1.2rem',
              padding: '0.8rem 2rem',
              background: 'linear-gradient(45deg, #8D6E63, #A1887F)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(141, 110, 99, 0.3)',
              transition: 'all 0.3s ease',
              transform: 'translateY(0)',
              marginBottom: '1.5rem'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(141, 110, 99, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(141, 110, 99, 0.3)';
            }}
          >
            🔨 ¡Comenzar a Golpear!
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
              <p style={{ marginBottom: '0.5rem' }}>• Mantén la vista en todo el campo</p>
              <p style={{ marginBottom: '0.5rem' }}>• Los combos dan puntos extra</p>
              <p>• ¡Reacciona rápido pero con precisión!</p>
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
          : 'linear-gradient(135deg, #8D6E63 0%, #5D4037 100%)',
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
            {isNewRecord ? '🏆 ¡NUEVO RÉCORD!' : '⏰ ¡TIEMPO AGOTADO!'}
          </h1>
          <div style={{ fontSize: '1.5rem', margin: '2rem 0' }}>
            <p>🎯 Puntuación Final: <strong>{score}</strong></p>
            <p>🏆 Récord: <strong>{highScore}</strong></p>
            <p>🎮 Dificultad: <strong>{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</strong></p>
            {isNewRecord && <p style={{ color: '#FFD700' }}>¡Increíble precisión con el martillo!</p>}
            {!isNewRecord && <p style={{ color: '#D7CCC8' }}>Los topos fueron más rápidos...</p>}
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={restartGame}
              style={{
                padding: '1rem 2rem',
                fontSize: '1.2rem',
                background: 'linear-gradient(45deg, #8D6E63, #A1887F)',
                border: 'none',
                borderRadius: '50px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🔄 Intentar de Nuevo
            </button>
            <button
              onClick={() => setGameState('start')}
              style={{
                padding: '1rem 2rem',
                fontSize: '1.2rem',
                background: 'linear-gradient(45deg, #4CAF50, #2E7D32)',
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
      background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif',
      color: 'white'
    }}>
      <h1 style={{ margin: '0 0 20px 0', fontSize: '2.5rem' }}>🔨 WHAC-A-MOLE</h1>
      <div ref={containerRef} style={{ border: '3px solid #8D6E63', borderRadius: '10px' }} />
      <div style={{ marginTop: '20px', fontSize: '1.2rem' }}>
        <p>¡Click en los topos para golpearlos!</p>
      </div>
    </div>
  );
};

export default WhacAMole;
