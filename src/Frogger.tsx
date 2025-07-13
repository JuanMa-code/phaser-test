import * as PIXI from 'pixi.js';
import React, { useEffect, useRef, useState } from 'react';

const GAME_WIDTH = 520;
const GAME_HEIGHT = 480;
const CELL_SIZE = 40;
const COLS = 13;
const ROWS = 12;

interface Lane {
  type: 'road' | 'water' | 'safe';
  speed: number;
  direction: number;
  vehicleCount: number;
  color: number;
}

interface Vehicle {
  x: number;
  y: number;
  lane: number;
  sprite: PIXI.Graphics;
  type: 'car' | 'truck' | 'log' | 'turtle';
  width: number;
}

const Frogger: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameOver' | 'win'>('start');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('frogger-highscore');
    return saved ? parseInt(saved) : 0;
  });

  useEffect(() => {
    if (gameState !== 'playing') return;

    const app = new PIXI.Application({
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: 0x228B22, // Forest green
    });

    if (containerRef.current && app.view instanceof Node) {
      containerRef.current.appendChild(app.view);
    }

    let gameRunning = true;
    let localScore = 0;
    let localLives = 3;
    let localLevel = 1;
    let frogX = Math.floor(COLS / 2);
    let frogY = ROWS - 1;
    let vehicles: Vehicle[] = [];
    let goalReached = [false, false, false, false, false]; // 5 goal slots
    let moveTimer = 0;

    // Lane configuration
    const lanes: Lane[] = [
      { type: 'safe', speed: 0, direction: 0, vehicleCount: 0, color: 0x90EE90 }, // Goal area
      { type: 'water', speed: 2 + localLevel * 0.5, direction: 1, vehicleCount: 3, color: 0x4169E1 },
      { type: 'water', speed: 1.5 + localLevel * 0.3, direction: -1, vehicleCount: 2, color: 0x4682B4 },
      { type: 'water', speed: 3 + localLevel * 0.7, direction: 1, vehicleCount: 4, color: 0x4169E1 },
      { type: 'water', speed: 2.5 + localLevel * 0.5, direction: -1, vehicleCount: 3, color: 0x4682B4 },
      { type: 'safe', speed: 0, direction: 0, vehicleCount: 0, color: 0xDEB887 }, // Median
      { type: 'road', speed: 3 + localLevel * 0.5, direction: -1, vehicleCount: 2, color: 0x696969 },
      { type: 'road', speed: 2 + localLevel * 0.3, direction: 1, vehicleCount: 3, color: 0x708090 },
      { type: 'road', speed: 4 + localLevel * 0.7, direction: -1, vehicleCount: 2, color: 0x696969 },
      { type: 'road', speed: 2.5 + localLevel * 0.4, direction: 1, vehicleCount: 3, color: 0x708090 },
      { type: 'road', speed: 3.5 + localLevel * 0.6, direction: -1, vehicleCount: 2, color: 0x696969 },
      { type: 'safe', speed: 0, direction: 0, vehicleCount: 0, color: 0x228B22 }, // Starting area
    ];

    // Background
    const backgroundContainer = new PIXI.Container();
    app.stage.addChild(backgroundContainer);

    // Draw lanes
    for (let y = 0; y < ROWS; y++) {
      const lane = lanes[y];
      const laneGraphics = new PIXI.Graphics();
      
      if (lane.type === 'road') {
        // Road with lane markings
        laneGraphics.beginFill(lane.color);
        laneGraphics.drawRect(0, 0, GAME_WIDTH, CELL_SIZE);
        laneGraphics.endFill();
        
        // Lane dividers
        laneGraphics.lineStyle(2, 0xFFFFFF, 0.8);
        for (let x = 0; x < GAME_WIDTH; x += 40) {
          laneGraphics.moveTo(x + 10, CELL_SIZE / 2);
          laneGraphics.lineTo(x + 30, CELL_SIZE / 2);
        }
      } else if (lane.type === 'water') {
        // Water with wave effect
        laneGraphics.beginFill(lane.color);
        laneGraphics.drawRect(0, 0, GAME_WIDTH, CELL_SIZE);
        laneGraphics.endFill();
        
        // Wave pattern
        laneGraphics.beginFill(0xE0F6FF, 0.3);
        for (let x = 0; x < GAME_WIDTH; x += 60) {
          laneGraphics.drawEllipse(x + 15, CELL_SIZE / 2, 20, 8);
        }
        laneGraphics.endFill();
      } else {
        // Safe areas
        laneGraphics.beginFill(lane.color);
        laneGraphics.drawRect(0, 0, GAME_WIDTH, CELL_SIZE);
        laneGraphics.endFill();
        
        if (y === 0) {
          // Goal area with lily pads
          for (let i = 0; i < 5; i++) {
            const padX = 50 + i * 80;
            laneGraphics.beginFill(goalReached[i] ? 0xFFD700 : 0x32CD32);
            laneGraphics.drawEllipse(padX, CELL_SIZE / 2, 25, 15);
            laneGraphics.endFill();
          }
        }
      }
      
      laneGraphics.y = y * CELL_SIZE;
      backgroundContainer.addChild(laneGraphics);
    }

    // Frog
    const frog = new PIXI.Graphics();
    
    function drawFrog() {
      frog.clear();
      
      // Frog body
      frog.beginFill(0x32CD32); // Lime green
      frog.drawEllipse(0, 0, 18, 22);
      frog.endFill();
      
      // Eyes
      frog.beginFill(0x228B22);
      frog.drawCircle(-8, -12, 6);
      frog.drawCircle(8, -12, 6);
      frog.endFill();
      
      frog.beginFill(0x000000);
      frog.drawCircle(-8, -12, 3);
      frog.drawCircle(8, -12, 3);
      frog.endFill();
      
      // Eye shine
      frog.beginFill(0xFFFFFF);
      frog.drawCircle(-7, -13, 1);
      frog.drawCircle(9, -13, 1);
      frog.endFill();
      
      // Legs
      frog.beginFill(0x228B22);
      frog.drawEllipse(-15, 5, 8, 12);
      frog.drawEllipse(15, 5, 8, 12);
      frog.drawEllipse(-12, 18, 6, 8);
      frog.drawEllipse(12, 18, 6, 8);
      frog.endFill();
    }
    
    function updateFrogPosition() {
      frog.x = frogX * CELL_SIZE + CELL_SIZE / 2;
      frog.y = frogY * CELL_SIZE + CELL_SIZE / 2;
    }
    
    drawFrog();
    updateFrogPosition();
    app.stage.addChild(frog);

    function createVehicle(laneIndex: number): Vehicle {
      const lane = lanes[laneIndex];
      const types = lane.type === 'water' ? ['log', 'turtle'] : ['car', 'truck'];
      const type = types[Math.floor(Math.random() * types.length)] as 'car' | 'truck' | 'log' | 'turtle';
      
      const sprite = new PIXI.Graphics();
      let width = 1;
      
      if (type === 'car') {
        sprite.beginFill(Math.random() > 0.5 ? 0xFF4444 : 0x4444FF);
        sprite.drawRoundedRect(-15, -8, 30, 16, 4);
        sprite.endFill();
        
        // Windows
        sprite.beginFill(0x87CEEB);
        sprite.drawRoundedRect(-12, -5, 24, 10, 2);
        sprite.endFill();
        
        // Headlights
        sprite.beginFill(0xFFFFFF);
        sprite.drawCircle(lane.direction > 0 ? 15 : -15, -6, 2);
        sprite.drawCircle(lane.direction > 0 ? 15 : -15, 6, 2);
        sprite.endFill();
        
        width = 1;
      } else if (type === 'truck') {
        sprite.beginFill(0x8B4513);
        sprite.drawRoundedRect(-25, -10, 50, 20, 4);
        sprite.endFill();
        
        // Cab
        sprite.beginFill(0xA0522D);
        sprite.drawRoundedRect(lane.direction > 0 ? 10 : -30, -8, 20, 16, 3);
        sprite.endFill();
        
        width = 2;
      } else if (type === 'log') {
        sprite.beginFill(0x8B4513);
        sprite.drawRoundedRect(-30, -6, 60, 12, 6);
        sprite.endFill();
        
        // Wood rings
        sprite.lineStyle(2, 0x654321);
        for (let i = -20; i <= 20; i += 15) {
          sprite.drawCircle(i, 0, 8);
        }
        
        width = 2;
      } else { // turtle
        sprite.beginFill(0x228B22);
        sprite.drawEllipse(0, 0, 20, 15);
        sprite.endFill();
        
        // Shell pattern
        sprite.lineStyle(2, 0x006400);
        sprite.drawEllipse(0, 0, 15, 10);
        sprite.moveTo(-8, -3);
        sprite.lineTo(8, 3);
        sprite.moveTo(-8, 3);
        sprite.lineTo(8, -3);
        
        width = 1;
      }
      
      const startX = lane.direction > 0 ? -width : COLS + width;
      sprite.x = startX * CELL_SIZE + CELL_SIZE / 2;
      sprite.y = laneIndex * CELL_SIZE + CELL_SIZE / 2;
      
      app.stage.addChild(sprite);
      
      return {
        x: startX,
        y: laneIndex,
        lane: laneIndex,
        sprite,
        type,
        width
      };
    }

    function initVehicles() {
      vehicles = [];
      for (let i = 0; i < ROWS; i++) {
        const lane = lanes[i];
        if (lane.vehicleCount > 0) {
          for (let j = 0; j < lane.vehicleCount; j++) {
            const vehicle = createVehicle(i);
            vehicle.x = (j * (COLS / lane.vehicleCount)) + Math.random() * 3;
            vehicle.sprite.x = vehicle.x * CELL_SIZE + CELL_SIZE / 2;
            vehicles.push(vehicle);
          }
        }
      }
    }

    function updateVehicles() {
      for (const vehicle of vehicles) {
        const lane = lanes[vehicle.lane];
        vehicle.x += lane.speed * lane.direction * 0.02;
        
        // Wrap around
        if (lane.direction > 0 && vehicle.x > COLS + vehicle.width) {
          vehicle.x = -vehicle.width;
        } else if (lane.direction < 0 && vehicle.x < -vehicle.width) {
          vehicle.x = COLS + vehicle.width;
        }
        
        vehicle.sprite.x = vehicle.x * CELL_SIZE + CELL_SIZE / 2;
      }
    }

    function checkCollisions() {
      const currentLane = lanes[frogY];
      
      if (currentLane.type === 'road') {
        // Check car collision
        for (const vehicle of vehicles) {
          if (vehicle.y === frogY) {
            const distance = Math.abs(vehicle.x - frogX);
            if (distance < 0.8) {
              loseLife();
              return;
            }
          }
        }
      } else if (currentLane.type === 'water') {
        // Check if on log/turtle
        let onVehicle = false;
        for (const vehicle of vehicles) {
          if (vehicle.y === frogY) {
            const distance = Math.abs(vehicle.x - frogX);
            if (distance < vehicle.width * 0.8) {
              onVehicle = true;
              // Move frog with the log/turtle
              if (currentLane.direction > 0) {
                frogX += currentLane.speed * 0.02;
              } else {
                frogX -= currentLane.speed * 0.02;
              }
              break;
            }
          }
        }
        
        if (!onVehicle) {
          loseLife();
          return;
        }
      }
      
      // Check boundaries
      if (frogX < 0 || frogX >= COLS) {
        loseLife();
        return;
      }
      
      // Check goal
      if (frogY === 0) {
        const goalSlot = Math.floor((frogX - 1.5) / 2);
        if (goalSlot >= 0 && goalSlot < 5 && !goalReached[goalSlot]) {
          goalReached[goalSlot] = true;
          localScore += 100;
          setScore(localScore);
          
          // Reset frog position
          frogX = Math.floor(COLS / 2);
          frogY = ROWS - 1;
          
          // Check if all goals reached
          if (goalReached.every(g => g)) {
            nextLevel();
          }
        } else {
          loseLife();
        }
      }
    }

    function loseLife() {
      localLives--;
      setLives(localLives);
      
      if (localLives <= 0) {
        gameRunning = false;
        setGameState('gameOver');
        
        // Update high score
        if (localScore > highScore) {
          setHighScore(localScore);
          localStorage.setItem('frogger-highscore', localScore.toString());
        }
      } else {
        // Reset frog position
        frogX = Math.floor(COLS / 2);
        frogY = ROWS - 1;
      }
    }

    function nextLevel() {
      localLevel++;
      setLevel(localLevel);
      localScore += 200; // Level bonus
      setScore(localScore);
      goalReached = [false, false, false, false, false];
      
      // Reset frog
      frogX = Math.floor(COLS / 2);
      frogY = ROWS - 1;
      
      // Recreate faster vehicles
      vehicles.forEach(v => app.stage.removeChild(v.sprite));
      initVehicles();
    }

    // UI
    const scoreText = new PIXI.Text('Score: 0', {
      fontSize: 20,
      fill: 0xFFFFFF,
      fontWeight: 'bold',
      stroke: 0x000000,
      strokeThickness: 2
    });
    scoreText.x = 10;
    scoreText.y = 10;
    app.stage.addChild(scoreText);

    const livesText = new PIXI.Text('Lives: 3', {
      fontSize: 20,
      fill: 0xFF4444,
      fontWeight: 'bold',
      stroke: 0x000000,
      strokeThickness: 2
    });
    livesText.x = 150;
    livesText.y = 10;
    app.stage.addChild(livesText);

    const levelText = new PIXI.Text('Level: 1', {
      fontSize: 20,
      fill: 0x44FF44,
      fontWeight: 'bold',
      stroke: 0x000000,
      strokeThickness: 2
    });
    levelText.x = 280;
    levelText.y = 10;
    app.stage.addChild(levelText);

    function updateGame() {
      if (!gameRunning) return;
      
      // Decrease move timer
      if (moveTimer > 0) {
        moveTimer--;
      }
      
      updateVehicles();
      checkCollisions();
      updateFrogPosition();
      
      // Update UI
      scoreText.text = `Score: ${localScore}`;
      livesText.text = `Lives: ${localLives}`;
      levelText.text = `Level: ${localLevel}`;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (!gameRunning) return;
      
      if (moveTimer > 0) return; // Prevent too fast movement
      
      let moved = false;
      
      switch(event.code) {
        case 'ArrowUp':
        case 'KeyW':
          if (frogY > 0) {
            frogY--;
            localScore += 10; // Points for moving forward
            setScore(localScore);
            moved = true;
          }
          break;
        case 'ArrowDown':
        case 'KeyS':
          if (frogY < ROWS - 1) {
            frogY++;
            moved = true;
          }
          break;
        case 'ArrowLeft':
        case 'KeyA':
          if (frogX > 0) {
            frogX--;
            moved = true;
          }
          break;
        case 'ArrowRight':
        case 'KeyD':
          if (frogX < COLS - 1) {
            frogX++;
            moved = true;
          }
          break;
      }
      
      if (moved) {
        moveTimer = 5; // Set timer after movement
        updateFrogPosition();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    
    initVehicles();
    app.ticker.add(updateGame);

    return () => {
      gameRunning = false;
      window.removeEventListener('keydown', handleKeyDown);
      if (containerRef.current && app.view instanceof Node) {
        containerRef.current.removeChild(app.view);
      }
      app.destroy();
    };
  }, [gameState]);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setLives(3);
    setLevel(1);
  };

  const restartGame = () => {
    setGameState('playing');
    setScore(0);
    setLives(3);
    setLevel(1);
  };

  if (gameState === 'start') {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #228B22 0%, #32CD32 100%)',
        fontFamily: 'Arial, sans-serif',
        color: 'white',
        padding: '2rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '3rem',
          maxWidth: '600px',
          textAlign: 'center',
          border: '3px solid #32CD32',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          color: '#228B22'
        }}>
          <h1 style={{ 
            fontSize: '4rem', 
            margin: '0 0 1rem 0',
            background: 'linear-gradient(45deg, #32CD32, #228B22, #90EE90, #00FF00)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            🐸 FROGGER
          </h1>
          
          <p style={{ fontSize: '1.2rem', margin: '1rem 0', opacity: 0.8 }}>
            ¡Ayuda a la rana a cruzar el tráfico y el río!
          </p>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1rem', 
            margin: '2rem 0' 
          }}>
            <div style={{
              background: 'rgba(50, 205, 50, 0.1)',
              borderRadius: '15px',
              padding: '1.5rem',
              border: '1px solid rgba(50, 205, 50, 0.3)'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#32CD32' }}>🎮 Controles</h3>
              <p>↑/W: Arriba</p>
              <p>↓/S: Abajo</p>
              <p>←/A: Izquierda</p>
              <p>→/D: Derecha</p>
            </div>
            
            <div style={{
              background: 'rgba(50, 205, 50, 0.1)',
              borderRadius: '15px',
              padding: '1.5rem',
              border: '1px solid rgba(50, 205, 50, 0.3)'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#4169E1' }}>🏆 Puntuación</h3>
              <p>Récord actual: <strong>{highScore}</strong></p>
              <p>Avanzar: 10 puntos</p>
              <p>Llegar a meta: 100 puntos</p>
              <p>Completar nivel: 200 puntos</p>
            </div>
            
            <div style={{
              background: 'rgba(50, 205, 50, 0.1)',
              borderRadius: '15px',
              padding: '1.5rem',
              border: '1px solid rgba(50, 205, 50, 0.3)'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#FF4444' }}>⚠️ Peligros</h3>
              <p>🚗 Evita los coches</p>
              <p>🌊 Usa troncos y tortugas</p>
              <p>🎯 Llega a las 5 metas</p>
            </div>
          </div>
          
          <button
            onClick={startGame}
            style={{
              padding: '1rem 3rem',
              fontSize: '1.5rem',
              background: 'linear-gradient(45deg, #32CD32, #228B22)',
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
            🐸 ¡COMENZAR A SALTAR!
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
            {isNewRecord ? '🏆 ¡NUEVO RÉCORD!' : '💀 ¡GAME OVER!'}
          </h1>
          <div style={{ fontSize: '1.5rem', margin: '2rem 0' }}>
            <p>🎯 Puntuación Final: <strong>{score}</strong></p>
            <p>🏆 Récord: <strong>{highScore}</strong></p>
            <p>🎮 Nivel Alcanzado: <strong>{level}</strong></p>
            <p>💚 Vidas Restantes: <strong>{lives}</strong></p>
            {isNewRecord && <p style={{ color: '#FFD700' }}>¡Increíble hazaña de la rana!</p>}
            {!isNewRecord && <p style={{ color: '#FFB6C1' }}>La rana no logró cruzar...</p>}
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={restartGame}
              style={{
                padding: '1rem 2rem',
                fontSize: '1.2rem',
                background: 'linear-gradient(45deg, #32CD32, #228B22)',
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
                background: 'linear-gradient(45deg, #228B22, #006400)',
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
      background: 'linear-gradient(135deg, #228B22 0%, #32CD32 100%)',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif',
      color: 'white'
    }}>
      <h1 style={{ margin: '0 0 20px 0', fontSize: '2.5rem' }}>🐸 FROGGER</h1>
      <div ref={containerRef} style={{ border: '3px solid #32CD32', borderRadius: '10px' }} />
      <div style={{ marginTop: '20px', fontSize: '1.2rem' }}>
        <p>↑↓←→ o WASD para mover la rana</p>
      </div>
    </div>
  );
};

export default Frogger;
