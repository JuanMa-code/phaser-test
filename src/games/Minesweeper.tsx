import * as PIXI from 'pixi.js';
import React, { useEffect, useRef, useState } from 'react';
import GameStartScreen from '../components/GameStartScreen';
import GameOverScreen from '../components/GameOverScreen';

const CELL_SIZE = 35;
const DIFFICULTIES = {
  beginner: { cols: 9, rows: 9, mines: 10 },
  intermediate: { cols: 16, rows: 16, mines: 40 },
  expert: { cols: 30, rows: 16, mines: 99 }
};

interface Cell {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
  sprite: PIXI.Container;
}

const Minesweeper: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'expert'>('beginner');
  const [gameState, setGameState] = useState<'start' | 'playing' | 'won' | 'lost'>('start');
  const [minesLeft, setMinesLeft] = useState(DIFFICULTIES.beginner.mines);
  const [time, setTime] = useState(0);
  const [firstClick, setFirstClick] = useState(true);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const config = DIFFICULTIES[difficulty];
    const app = new PIXI.Application({
      width: config.cols * CELL_SIZE,
      height: config.rows * CELL_SIZE + 60, // Extra space for UI
      backgroundColor: 0xc0c0c0,
    });

    if (containerRef.current && app.view instanceof Node) {
      containerRef.current.appendChild(app.view);
    }

    let board: Cell[][] = [];
    let gameRunning = true;
    let localMinesLeft = config.mines;
    let isFirstClick = true;
    let localTime = 0;

    // UI Container
    const uiContainer = new PIXI.Container();
    uiContainer.y = 0;
    app.stage.addChild(uiContainer);

    // UI Background
    const uiBg = new PIXI.Graphics();
    uiBg.beginFill(0xbfbfbf);
    uiBg.drawRect(0, 0, config.cols * CELL_SIZE, 50);
    uiBg.endFill();
    uiContainer.addChild(uiBg);

    // Mine counter
    const mineCounter = new PIXI.Text(`💣 ${localMinesLeft}`, { 
      fontSize: 20, 
      fill: 0xff0000, 
      fontWeight: 'bold' 
    });
    mineCounter.x = 10;
    mineCounter.y = 15;
    uiContainer.addChild(mineCounter);

    // Timer
    const timer = new PIXI.Text(`⏱️ ${localTime}`, { 
      fontSize: 20, 
      fill: 0x0000ff, 
      fontWeight: 'bold' 
    });
    timer.x = config.cols * CELL_SIZE - 100;
    timer.y = 15;
    uiContainer.addChild(timer);

    // Timer interval
    const timerInterval = setInterval(() => {
      if (gameRunning) {
        localTime++;
        setTime(localTime);
        timer.text = `⏱️ ${localTime}`;
      }
    }, 1000);

    // Game board container
    const gameContainer = new PIXI.Container();
    gameContainer.y = 60;
    app.stage.addChild(gameContainer);

    function initBoard() {
      board = [];
      for (let y = 0; y < config.rows; y++) {
        board[y] = [];
        for (let x = 0; x < config.cols; x++) {
          const cell: Cell = {
            mine: false,
            revealed: false,
            flagged: false,
            adjacent: 0,
            sprite: new PIXI.Container()
          };

          const cellBg = new PIXI.Graphics();
          cellBg.beginFill(0xbfbfbf);
          cellBg.lineStyle(2, 0x808080);
          cellBg.drawRect(0, 0, CELL_SIZE, CELL_SIZE);
          cellBg.endFill();
          
          // Add 3D effect
          const highlight = new PIXI.Graphics();
          highlight.lineStyle(2, 0xffffff);
          highlight.moveTo(0, CELL_SIZE);
          highlight.lineTo(0, 0);
          highlight.lineTo(CELL_SIZE, 0);
          
          const shadow = new PIXI.Graphics();
          shadow.lineStyle(2, 0x808080);
          shadow.moveTo(CELL_SIZE, 0);
          shadow.lineTo(CELL_SIZE, CELL_SIZE);
          shadow.lineTo(0, CELL_SIZE);

          cell.sprite.addChild(cellBg);
          cell.sprite.addChild(highlight);
          cell.sprite.addChild(shadow);
          cell.sprite.x = x * CELL_SIZE;
          cell.sprite.y = y * CELL_SIZE;
          cell.sprite.interactive = true;
          cell.sprite.cursor = 'pointer';

          // Click handlers
          cell.sprite.on('pointerdown', (event) => {
            if (!gameRunning) return;
            
            if (event.data.button === 0) { // Left click
              if (isFirstClick) {
                placeMines(x, y);
                calculateAdjacent();
                isFirstClick = false;
              }
              revealCell(x, y);
            } else if (event.data.button === 2) { // Right click
              toggleFlag(x, y);
            }
          });

          // Right click context menu prevention
          cell.sprite.on('rightdown', (event) => {
            event.stopPropagation();
            if (!gameRunning) return;
            toggleFlag(x, y);
          });

          gameContainer.addChild(cell.sprite);
          board[y][x] = cell;
        }
      }
    }

    function placeMines(excludeX: number, excludeY: number) {
      let placed = 0;
      while (placed < config.mines) {
        const x = Math.floor(Math.random() * config.cols);
        const y = Math.floor(Math.random() * config.rows);
        
        // Don't place mine on first click or adjacent to it
        if (!board[y][x].mine && 
            !(Math.abs(x - excludeX) <= 1 && Math.abs(y - excludeY) <= 1)) {
          board[y][x].mine = true;
          placed++;
        }
      }
    }

    function calculateAdjacent() {
      for (let y = 0; y < config.rows; y++) {
        for (let x = 0; x < config.cols; x++) {
          if (board[y][x].mine) continue;
          
          let count = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = x + dx, ny = y + dy;
              if (nx >= 0 && nx < config.cols && ny >= 0 && ny < config.rows && 
                  board[ny][nx].mine) {
                count++;
              }
            }
          }
          board[y][x].adjacent = count;
        }
      }
    }

    function revealCell(x: number, y: number) {
      if (x < 0 || x >= config.cols || y < 0 || y >= config.rows) return;
      if (board[y][x].revealed || board[y][x].flagged) return;

      board[y][x].revealed = true;
      updateCellDisplay(x, y);

      if (board[y][x].mine) {
        // Game over
        gameRunning = false;
        setGameState('lost');
        revealAllMines();
        return;
      }

      if (board[y][x].adjacent === 0) {
        // Reveal adjacent cells
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            revealCell(x + dx, y + dy);
          }
        }
      }

      checkWin();
    }

    function toggleFlag(x: number, y: number) {
      if (board[y][x].revealed) return;
      
      board[y][x].flagged = !board[y][x].flagged;
      if (board[y][x].flagged) {
        localMinesLeft--;
      } else {
        localMinesLeft++;
      }
      
      setMinesLeft(localMinesLeft);
      mineCounter.text = `💣 ${localMinesLeft}`;
      updateCellDisplay(x, y);
    }

    function updateCellDisplay(x: number, y: number) {
      const cell = board[y][x];
      const container = cell.sprite;
      
      // Clear previous content except background
      while (container.children.length > 3) {
        container.removeChildAt(3);
      }

      if (cell.flagged && !cell.revealed) {
        const flag = new PIXI.Text('🚩', { 
          fontSize: 22,
          fontFamily: 'Arial'
        });
        flag.anchor.set(0.5);
        flag.x = CELL_SIZE / 2;
        flag.y = CELL_SIZE / 2;
        container.addChild(flag);
        return;
      }

      if (!cell.revealed) return;

      // Clear the cell (remove 3D effect)
      container.removeChildren();
      const cellBg = new PIXI.Graphics();
      cellBg.beginFill(cell.mine ? 0xff0000 : 0xe0e0e0);
      cellBg.lineStyle(1, 0x808080);
      cellBg.drawRect(0, 0, CELL_SIZE, CELL_SIZE);
      cellBg.endFill();
      container.addChild(cellBg);

      if (cell.mine) {
        const mine = new PIXI.Text('💥', { 
          fontSize: 22,
          fontFamily: 'Arial'
        });
        mine.anchor.set(0.5);
        mine.x = CELL_SIZE / 2;
        mine.y = CELL_SIZE / 2;
        container.addChild(mine);
      } else if (cell.adjacent > 0) {
        const colors = [
          0x0000ff, 0x008000, 0xff0000, 0x800080,
          0x800000, 0x008080, 0x000000, 0x808080
        ];
        const number = new PIXI.Text(cell.adjacent.toString(), {
          fontSize: 18,
          fill: colors[cell.adjacent - 1] || 0x000000,
          fontWeight: 'bold',
          fontFamily: 'Arial'
        });
        number.anchor.set(0.5);
        number.x = CELL_SIZE / 2;
        number.y = CELL_SIZE / 2;
        container.addChild(number);
      }
    }

    function revealAllMines() {
      for (let y = 0; y < config.rows; y++) {
        for (let x = 0; x < config.cols; x++) {
          if (board[y][x].mine) {
            board[y][x].revealed = true;
            updateCellDisplay(x, y);
          }
        }
      }
    }

    function checkWin() {
      let revealedCount = 0;
      for (let y = 0; y < config.rows; y++) {
        for (let x = 0; x < config.cols; x++) {
          if (board[y][x].revealed && !board[y][x].mine) {
            revealedCount++;
          }
        }
      }

      if (revealedCount === config.cols * config.rows - config.mines) {
        gameRunning = false;
        setGameState('won');
      }
    }

    // Disable right-click context menu
    if (app.view && 'addEventListener' in app.view) {
      (app.view as any).addEventListener('contextmenu', (e: Event) => e.preventDefault());
    }

    initBoard();

    return () => {
      gameRunning = false;
      clearInterval(timerInterval);
      if (containerRef.current && app.view instanceof Node) {
        containerRef.current.removeChild(app.view);
      }
      app.destroy();
    };
  }, [gameState, difficulty]);

  const startGame = () => {
    setGameState('playing');
    setMinesLeft(DIFFICULTIES[difficulty].mines);
    setTime(0);
    setFirstClick(true);
  };

  const restartGame = () => {
    setGameState('playing');
    setMinesLeft(DIFFICULTIES[difficulty].mines);
    setTime(0);
    setFirstClick(true);
  };

  if (gameState === 'start') {
    return (
      <GameStartScreen
        title="💣 Minesweeper"
        description="¡Encuentra todas las minas sin explotar ninguna!"
        instructions={[
          {
            title: "Controles",
            items: [
              "🖱️ Click izquierdo: Revelar casilla",
              "🚩 Click derecho: Marcar con bandera",
              "💡 Los números indican minas adyacentes",
              "🎯 Encuentra todas las minas sin explotar ninguna"
            ],
            icon: "🎮"
          },
          {
            title: "Características",
            items: [
              "3 niveles de dificultad: Principiante, Intermedio, Experto",
              "Temporizador integrado",
              "Contador de minas",
              "Efectos visuales clásicos"
            ],
            icon: "⭐"
          }
        ]}
        onStart={startGame}
        theme={{
          background: 'linear-gradient(135deg, #c0c0c0 0%, #808080 100%)',
          primary: 'linear-gradient(45deg, #ff0000, #ff6600)',
          secondary: 'rgba(255, 255, 255, 0.2)',
          accent: 'linear-gradient(45deg, #ff0000, #0000ff, #008000)',
        }}
      >
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Dificultad:</h3>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {Object.entries(DIFFICULTIES).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setDifficulty(key as any)}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.9rem',
                  background: difficulty === key 
                    ? 'linear-gradient(45deg, #4CAF50, #45a049)' 
                    : 'rgba(255, 255, 255, 0.2)',
                  border: difficulty === key ? '2px solid #4CAF50' : '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease'
                }}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </GameStartScreen>
    );
  }

  if (gameState === 'won' || gameState === 'lost') {
    return (
      <GameOverScreen
        score={time} // Using time as score
        isVictory={gameState === 'won'}
        onRestart={restartGame}
        onMenu={() => setGameState('start')}
        theme={{
          background: gameState === 'won' 
            ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
            : 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
          primary: gameState === 'won'
            ? 'linear-gradient(45deg, #4CAF50, #45a049)'
            : 'linear-gradient(45deg, #f44336, #d32f2f)',
          secondary: 'rgba(255, 255, 255, 0.2)',
          accent: 'linear-gradient(45deg, #ffffff, #e0e0e0)',
        }}
        customStats={[
          { label: 'Tiempo', value: `${time} segundos` },
          { label: 'Dificultad', value: difficulty.charAt(0).toUpperCase() + difficulty.slice(1) },
          { label: 'Minas', value: DIFFICULTIES[difficulty].mines }
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
      background: 'linear-gradient(135deg, #c0c0c0 0%, #808080 100%)',
      minHeight: '100dvh',
      fontFamily: 'Arial, sans-serif',
      color: 'black'
    }}>
      <h1 style={{ margin: '0 0 20px 0', fontSize: '2.5rem' }}>💣 MINESWEEPER</h1>
      <div ref={containerRef} style={{ border: '3px solid #808080', borderRadius: '5px' }} />
      <div style={{ marginTop: '20px', fontSize: '1rem' }}>
        <p>Click izquierdo: revelar | Click derecho: bandera</p>
      </div>
    </div>
  );
};

export default Minesweeper;
