import * as PIXI from 'pixi.js';
import React, { useEffect, useRef, useState } from 'react';
import GameStartScreen from '../components/GameStartScreen';
import GameOverScreen from '../components/GameOverScreen';

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const GAME_WIDTH = COLS * BLOCK_SIZE;
const GAME_HEIGHT = ROWS * BLOCK_SIZE;

const COLORS = [0x00ffff, 0x0000ff, 0xffa500, 0xffff00, 0x00ff00, 0xff0000, 0x800080];
const SHAPES = [
  // I
  [[1, 1, 1, 1]],
  // J
  [[1, 0, 0], [1, 1, 1]],
  // L
  [[0, 0, 1], [1, 1, 1]],
  // O
  [[1, 1], [1, 1]],
  // S
  [[0, 1, 1], [1, 1, 0]],
  // T
  [[0, 1, 0], [1, 1, 1]],
  // Z
  [[1, 1, 0], [0, 1, 1]],
];

function randomPiece() {
  const idx = Math.floor(Math.random() * SHAPES.length);
  return {
    shape: SHAPES[idx],
    color: COLORS[idx],
    x: Math.floor(COLS / 2) - 1,
    y: 0,
  };
}

const Tetris: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const app = new PIXI.Application({
      width: GAME_WIDTH + 200, // Extra space for UI
      height: GAME_HEIGHT,
      backgroundColor: 0x1a1a2e,
    });

    if (containerRef.current && app.view instanceof Node) {
      containerRef.current.appendChild(app.view);
    }

    let board: (number | null)[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    let currentPiece = randomPiece();
    let nextPiece = randomPiece();
    let gameRunning = true;
    let dropCounter = 0;
    let dropInterval = Math.max(5, 30 - level * 2);
    let localScore = 0;
    let localLines = 0;
    let localLevel = 1;

    // Game board container
    const gameContainer = new PIXI.Container();
    const uiContainer = new PIXI.Container();
    uiContainer.x = GAME_WIDTH + 20;
    app.stage.addChild(gameContainer);
    app.stage.addChild(uiContainer);

    // Grid background
    const gridBg = new PIXI.Graphics();
    gridBg.lineStyle(1, 0x444444, 0.3);
    for (let i = 0; i <= COLS; i++) {
      gridBg.moveTo(i * BLOCK_SIZE, 0);
      gridBg.lineTo(i * BLOCK_SIZE, GAME_HEIGHT);
    }
    for (let i = 0; i <= ROWS; i++) {
      gridBg.moveTo(0, i * BLOCK_SIZE);
      gridBg.lineTo(GAME_WIDTH, i * BLOCK_SIZE);
    }
    gameContainer.addChild(gridBg);

    // UI Text
    const scoreText = new PIXI.Text('Score: 0', { fontSize: 20, fill: 0xffffff });
    const linesText = new PIXI.Text('Lines: 0', { fontSize: 20, fill: 0xffffff });
    const levelText = new PIXI.Text('Level: 1', { fontSize: 20, fill: 0xffffff });
    const nextText = new PIXI.Text('Next:', { fontSize: 16, fill: 0xffffff });
    
    scoreText.y = 20;
    linesText.y = 50;
    levelText.y = 80;
    nextText.y = 120;
    
    uiContainer.addChild(scoreText);
    uiContainer.addChild(linesText);
    uiContainer.addChild(levelText);
    uiContainer.addChild(nextText);

    function createBlock(color: number, x: number, y: number) {
      const block = new PIXI.Graphics();
      block.beginFill(color);
      block.drawRoundedRect(0, 0, BLOCK_SIZE - 2, BLOCK_SIZE - 2, 3);
      block.endFill();
      block.lineStyle(1, 0xffffff, 0.3);
      block.drawRoundedRect(0, 0, BLOCK_SIZE - 2, BLOCK_SIZE - 2, 3);
      block.x = x * BLOCK_SIZE;
      block.y = y * BLOCK_SIZE;
      return block;
    }

    function drawBoard() {
      gameContainer.removeChildren();
      gameContainer.addChild(gridBg);

      // Draw placed pieces
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (board[y][x] !== null) {
            gameContainer.addChild(createBlock(board[y][x] as number, x, y));
          }
        }
      }

      // Draw current piece
      for (let py = 0; py < currentPiece.shape.length; py++) {
        for (let px = 0; px < currentPiece.shape[py].length; px++) {
          if (currentPiece.shape[py][px]) {
            gameContainer.addChild(createBlock(currentPiece.color, currentPiece.x + px, currentPiece.y + py));
          }
        }
      }

      // Draw next piece preview
      uiContainer.removeChildren();
      uiContainer.addChild(scoreText);
      uiContainer.addChild(linesText);
      uiContainer.addChild(levelText);
      uiContainer.addChild(nextText);
      
      for (let py = 0; py < nextPiece.shape.length; py++) {
        for (let px = 0; px < nextPiece.shape[py].length; px++) {
          if (nextPiece.shape[py][px]) {
            const block = new PIXI.Graphics();
            block.beginFill(nextPiece.color);
            block.drawRoundedRect(0, 0, 20, 20, 2);
            block.endFill();
            block.x = px * 22;
            block.y = 150 + py * 22;
            uiContainer.addChild(block);
          }
        }
      }
    }

    function collide(offsetX = 0, offsetY = 0, testShape = currentPiece.shape) {
      for (let py = 0; py < testShape.length; py++) {
        for (let px = 0; px < testShape[py].length; px++) {
          if (testShape[py][px]) {
            const x = currentPiece.x + px + offsetX;
            const y = currentPiece.y + py + offsetY;
            if (x < 0 || x >= COLS || y >= ROWS || (y >= 0 && board[y][x] !== null)) {
              return true;
            }
          }
        }
      }
      return false;
    }

    function mergePiece() {
      for (let py = 0; py < currentPiece.shape.length; py++) {
        for (let px = 0; px < currentPiece.shape[py].length; px++) {
          if (currentPiece.shape[py][px]) {
            const x = currentPiece.x + px;
            const y = currentPiece.y + py;
            if (y >= 0) board[y][x] = currentPiece.color;
          }
        }
      }
    }

    function rotate(shape: number[][]) {
      return shape[0].map((_, i) => shape.map(row => row[i])).reverse();
    }

    function removeFullRows() {
      let clearedLines = 0;
      for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== null)) {
          board.splice(y, 1);
          board.unshift(Array(COLS).fill(null));
          clearedLines++;
          y++;
        }
      }
      if (clearedLines > 0) {
        localLines += clearedLines;
        localScore += clearedLines * 100 * localLevel;
        if (localLines >= localLevel * 10) {
          localLevel++;
          dropInterval = Math.max(5, 30 - localLevel * 2);
        }
        setLines(localLines);
        setScore(localScore);
        setLevel(localLevel);
      }
      return clearedLines;
    }

    function gameLoop() {
      if (!gameRunning) return;

      dropCounter++;
      if (dropCounter > dropInterval) {
        dropCounter = 0;
        if (!collide(0, 1)) {
          currentPiece.y++;
        } else {
          mergePiece();
          removeFullRows();
          currentPiece = nextPiece;
          nextPiece = randomPiece();
          if (collide(0, 0)) {
            gameRunning = false;
            setGameOver(true);
            return;
          }
        }
      }

      scoreText.text = `Score: ${localScore}`;
      linesText.text = `Lines: ${localLines}`;
      levelText.text = `Level: ${localLevel}`;
      
      drawBoard();
      requestAnimationFrame(gameLoop);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (!gameRunning) return;

      switch (event.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (!collide(-1, 0)) currentPiece.x--;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (!collide(1, 0)) currentPiece.x++;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (!collide(0, 1)) {
            currentPiece.y++;
            localScore += 1;
            setScore(localScore);
          }
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
        case ' ':
          const rotated = rotate(currentPiece.shape);
          if (!collide(0, 0, rotated)) {
            currentPiece.shape = rotated;
          }
          break;
      }
      drawBoard();
    }

    window.addEventListener('keydown', handleKeyDown);
    drawBoard();
    gameLoop();

    return () => {
      gameRunning = false;
      window.removeEventListener('keydown', handleKeyDown);
      if (containerRef.current && app.view instanceof Node) {
        containerRef.current.removeChild(app.view);
      }
      app.destroy();
    };
  }, [gameStarted, gameOver, level]);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setLines(0);
    setLevel(1);
  };

  const restartGame = () => {
    setGameOver(false);
    setScore(0);
    setLines(0);
    setLevel(1);
  };

  if (!gameStarted) {
    return (
      <GameStartScreen
        title="🧩 TETRIS"
        description="¡El clásico juego de bloques que caen!"
        instructions={[
          {
            title: 'Controles',
            items: [
              '← → A D: Mover pieza',
              '↓ S: Caída rápida',
              '↑ W Espacio: Rotar'
            ],
            icon: '🎮'
          },
          {
            title: 'Puntuación',
            items: [
              'Líneas completas: +100 × Nivel',
              'Caída rápida: +1 punto',
              'Cada 10 líneas: +1 nivel'
            ],
            icon: '📊'
          },
          {
            title: 'Objetivo',
            items: [
              'Completa líneas horizontales',
              'Evita que lleguen arriba',
              '¡Alcanza el nivel más alto!'
            ],
            icon: '🎯'
          }
        ]}
        onStart={startGame}
        theme={{
          primary: '#ff6b6b',
          secondary: '#4ecdc4',
          accent: '#45b7d1',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      />
    );
  }

  if (gameOver) {
    return (
      <GameOverScreen
        score={score}
        onRestart={restartGame}
        onMenu={() => window.history.back()}
        theme={{
          primary: '#ff6b6b',
          secondary: '#4ecdc4',
          accent: '#45b7d1',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
        customStats={[
          { label: 'Líneas Completadas', value: lines },
          { label: 'Nivel Alcanzado', value: level }
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
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      minHeight: '100dvh',
      fontFamily: 'Arial, sans-serif',
      color: 'white'
    }}>
      <h1 style={{ margin: '0 0 20px 0', fontSize: '2.5rem' }}>🧩 TETRIS</h1>
      <div ref={containerRef} style={{ border: '2px solid #444', borderRadius: '10px' }} />
      <div style={{ marginTop: '20px', fontSize: '1.2rem' }}>
        <p>Use ← → A D para mover, ↓ S para bajar rápido, ↑ W Espacio para rotar</p>
      </div>
    </div>
  );
};

export default Tetris;
