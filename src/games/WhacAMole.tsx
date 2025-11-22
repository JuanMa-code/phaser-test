import * as PIXI from 'pixi.js';
import React, { useEffect, useRef, useState } from 'react';
import GameStartScreen from '../components/GameStartScreen';
import GameOverScreen from '../components/GameOverScreen';

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
      <GameStartScreen
        title="🔨 WHAC-A-MOLE"
        description="¡Golpea a los topos antes de que se escondan!"
        instructions={[
          {
            title: "Controles y Puntuación",
            items: [
              "🖱️ Click en los topos para golpearlos",
              "⚡ Sistema de combos: más hits seguidos = más puntos"
            ],
            icon: "🎮"
          },
          {
            title: "Consejos Pro",
            items: [
              "• Mantén la vista en todo el campo",
              "• Los combos dan puntos extra",
              "• ¡Reacciona rápido pero con precisión!"
            ],
            icon: "💡"
          }
        ]}
        highScore={highScore}
        onStart={startGame}
        theme={{
          background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
          primary: 'linear-gradient(45deg, #8D6E63, #A1887F)',
          secondary: 'rgba(255, 255, 255, 0.2)',
          accent: 'linear-gradient(45deg, #8D6E63, #D7CCC8)',
          text: 'white'
        }}
      >
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
      </GameStartScreen>
    );
  }

  if (gameState === 'gameOver') {
    const isNewRecord = score === highScore && score > 0;
    
    return (
      <GameOverScreen
        score={score}
        highScore={highScore}
        isNewRecord={isNewRecord}
        onRestart={restartGame}
        onMenu={() => setGameState('start')}
        theme={{
          background: isNewRecord 
            ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
            : 'linear-gradient(135deg, #8D6E63 0%, #5D4037 100%)',
          primary: 'linear-gradient(45deg, #8D6E63, #A1887F)',
          secondary: '#4CAF50',
          accent: isNewRecord 
            ? 'linear-gradient(45deg, #FFFFFF, #FFFF00)' 
            : 'linear-gradient(45deg, #FFFFFF, #D7CCC8)',
        }}
        customStats={[
          { label: 'Dificultad', value: difficulty.charAt(0).toUpperCase() + difficulty.slice(1) },
          { label: 'Mensaje', value: isNewRecord ? '¡Increíble precisión con el martillo!' : 'Los topos fueron más rápidos...' }
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
      background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
      minHeight: '100dvh',
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
