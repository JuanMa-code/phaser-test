import * as PIXI from 'pixi.js';
import React, { useEffect, useRef, useState } from 'react';

const GAME_WIDTH = 480;
const GAME_HEIGHT = 480;
const GRID_SIZE = 6;
const CELL_SIZE = 80;

interface Block {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: number;
  direction: 'horizontal' | 'vertical';
  isTarget?: boolean;
}

// Niveles progresivos con complejidad real (requieren múltiples movimientos)
const LEVELS = [
  // Nivel 1 - 3-4 movimientos
  [
    { id: 0, x: 1, y: 2, width: 2, height: 1, color: 0xFF3333, direction: 'horizontal' as const, isTarget: true },
    { id: 1, x: 3, y: 1, width: 1, height: 3, color: 0x4169E1, direction: 'vertical' as const },
    { id: 2, x: 0, y: 0, width: 2, height: 1, color: 0x32CD32, direction: 'horizontal' as const },
    { id: 3, x: 4, y: 0, width: 1, height: 2, color: 0xFFD700, direction: 'vertical' as const },
    { id: 4, x: 0, y: 1, width: 1, height: 2, color: 0xFF69B4, direction: 'vertical' as const },
    { id: 5, x: 1, y: 3, width: 2, height: 1, color: 0x8A2BE2, direction: 'horizontal' as const },
    { id: 6, x: 4, y: 4, width: 2, height: 1, color: 0x00CED1, direction: 'horizontal' as const },
  ],
  // Nivel 2 - 5-6 movimientos
  [
    { id: 0, x: 0, y: 2, width: 2, height: 1, color: 0xFF3333, direction: 'horizontal' as const, isTarget: true },
    { id: 1, x: 2, y: 0, width: 1, height: 3, color: 0x4169E1, direction: 'vertical' as const },
    { id: 2, x: 3, y: 0, width: 2, height: 1, color: 0x32CD32, direction: 'horizontal' as const },
    { id: 3, x: 5, y: 0, width: 1, height: 3, color: 0xFFD700, direction: 'vertical' as const },
    { id: 4, x: 0, y: 0, width: 1, height: 2, color: 0xFF69B4, direction: 'vertical' as const },
    { id: 5, x: 1, y: 0, width: 1, height: 2, color: 0x8A2BE2, direction: 'vertical' as const },
    { id: 6, x: 3, y: 3, width: 1, height: 2, color: 0x00CED1, direction: 'vertical' as const },
    { id: 7, x: 4, y: 3, width: 1, height: 2, color: 0xFFA500, direction: 'vertical' as const },
    { id: 8, x: 0, y: 4, width: 3, height: 1, color: 0x9370DB, direction: 'horizontal' as const },
  ],
  // Nivel 3 - 7-8 movimientos
  [
    { id: 0, x: 2, y: 2, width: 2, height: 1, color: 0xFF3333, direction: 'horizontal' as const, isTarget: true },
    { id: 1, x: 0, y: 0, width: 1, height: 3, color: 0x4169E1, direction: 'vertical' as const },
    { id: 2, x: 1, y: 0, width: 2, height: 1, color: 0x32CD32, direction: 'horizontal' as const },
    { id: 3, x: 4, y: 0, width: 1, height: 2, color: 0xFFD700, direction: 'vertical' as const },
    { id: 4, x: 5, y: 0, width: 1, height: 3, color: 0xFF69B4, direction: 'vertical' as const },
    { id: 5, x: 1, y: 1, width: 1, height: 2, color: 0x8A2BE2, direction: 'vertical' as const },
    { id: 6, x: 4, y: 3, width: 2, height: 1, color: 0x00CED1, direction: 'horizontal' as const },
    { id: 7, x: 2, y: 0, width: 1, height: 2, color: 0xFFA500, direction: 'vertical' as const },
    { id: 8, x: 3, y: 1, width: 1, height: 2, color: 0x9370DB, direction: 'vertical' as const },
    { id: 9, x: 0, y: 4, width: 2, height: 1, color: 0x228B22, direction: 'horizontal' as const },
    { id: 10, x: 2, y: 4, width: 2, height: 1, color: 0xDC143C, direction: 'horizontal' as const },
  ],
  // Nivel 4 - 10-12 movimientos
  [
    { id: 0, x: 1, y: 2, width: 2, height: 1, color: 0xFF3333, direction: 'horizontal' as const, isTarget: true },
    { id: 1, x: 0, y: 0, width: 1, height: 2, color: 0x4169E1, direction: 'vertical' as const },
    { id: 2, x: 1, y: 0, width: 1, height: 2, color: 0x32CD32, direction: 'vertical' as const },
    { id: 3, x: 2, y: 0, width: 2, height: 1, color: 0xFFD700, direction: 'horizontal' as const },
    { id: 4, x: 4, y: 0, width: 1, height: 3, color: 0xFF69B4, direction: 'vertical' as const },
    { id: 5, x: 5, y: 0, width: 1, height: 2, color: 0x8A2BE2, direction: 'vertical' as const },
    { id: 6, x: 2, y: 1, width: 1, height: 2, color: 0x00CED1, direction: 'vertical' as const },
    { id: 7, x: 3, y: 1, width: 1, height: 2, color: 0xFFA500, direction: 'vertical' as const },
    { id: 8, x: 0, y: 3, width: 1, height: 2, color: 0x9370DB, direction: 'vertical' as const },
    { id: 9, x: 3, y: 3, width: 2, height: 1, color: 0x228B22, direction: 'horizontal' as const },
    { id: 10, x: 5, y: 3, width: 1, height: 2, color: 0xDC143C, direction: 'vertical' as const },
    { id: 11, x: 1, y: 4, width: 2, height: 1, color: 0x4682B4, direction: 'horizontal' as const },
    { id: 12, x: 4, y: 5, width: 2, height: 1, color: 0xB22222, direction: 'horizontal' as const },
  ],
  // Nivel 5 - 15+ movimientos (muy difícil)
  [
    { id: 0, x: 0, y: 2, width: 2, height: 1, color: 0xFF3333, direction: 'horizontal' as const, isTarget: true },
    { id: 1, x: 2, y: 0, width: 1, height: 2, color: 0x4169E1, direction: 'vertical' as const },
    { id: 2, x: 3, y: 0, width: 1, height: 3, color: 0x32CD32, direction: 'vertical' as const },
    { id: 3, x: 4, y: 0, width: 2, height: 1, color: 0xFFD700, direction: 'horizontal' as const },
    { id: 4, x: 0, y: 0, width: 2, height: 1, color: 0xFF69B4, direction: 'horizontal' as const },
    { id: 5, x: 0, y: 1, width: 1, height: 2, color: 0x8A2BE2, direction: 'vertical' as const },
    { id: 6, x: 1, y: 1, width: 1, height: 2, color: 0x00CED1, direction: 'vertical' as const },
    { id: 7, x: 4, y: 1, width: 1, height: 2, color: 0xFFA500, direction: 'vertical' as const },
    { id: 8, x: 5, y: 1, width: 1, height: 3, color: 0x9370DB, direction: 'vertical' as const },
    { id: 9, x: 2, y: 3, width: 1, height: 2, color: 0x228B22, direction: 'vertical' as const },
    { id: 10, x: 3, y: 4, width: 1, height: 2, color: 0xDC143C, direction: 'vertical' as const },
    { id: 11, x: 0, y: 4, width: 2, height: 1, color: 0x4682B4, direction: 'horizontal' as const },
    { id: 12, x: 4, y: 4, width: 1, height: 2, color: 0xB22222, direction: 'vertical' as const },
    { id: 13, x: 0, y: 5, width: 3, height: 1, color: 0x8FBC8F, direction: 'horizontal' as const },
  ],
];

const UnblockMe: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'levelComplete' | 'gameComplete'>('start');
  const [currentLevel, setCurrentLevel] = useState(0);
  const [moves, setMoves] = useState(0);
  const [bestMoves, setBestMoves] = useState(() => {
    const saved = localStorage.getItem('unblockme-best-moves');
    return saved ? JSON.parse(saved) : Array(LEVELS.length).fill(Infinity);
  });

  useEffect(() => {
    if (gameState !== 'playing') return;

    const app = new PIXI.Application({
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: 0x2C1810, // Dark wood background
    });

    if (containerRef.current && app.view instanceof Node) {
      containerRef.current.appendChild(app.view);
    }

    let gameRunning = true;
    let blocks: Block[] = LEVELS[currentLevel].map(b => ({ ...b }));
    let selectedBlock: number | null = null;
    let dragOffset = { x: 0, y: 0 };
    let localMoves = 0;
    let isDragging = false;
    let lastValidPosition = { x: 0, y: 0 };

    // Background
    const background = new PIXI.Graphics();
    background.beginFill(0x8B4513); // Saddle brown
    background.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    background.endFill();
    
    // Wood grain texture
    for (let i = 0; i < 20; i++) {
      background.lineStyle(2, 0x654321, 0.3);
      background.moveTo(Math.random() * GAME_WIDTH, 0);
      background.lineTo(Math.random() * GAME_WIDTH, GAME_HEIGHT);
    }
    
    app.stage.addChild(background);

    // Game board
    const board = new PIXI.Graphics();
    board.beginFill(0xF5DEB3); // Wheat color for board
    board.lineStyle(4, 0x8B4513);
    board.drawRoundedRect(0, 0, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE, 10);
    board.endFill();
    
    // Grid lines
    for (let i = 0; i <= GRID_SIZE; i++) {
      board.lineStyle(1, 0xD2B48C, 0.5);
      board.moveTo(i * CELL_SIZE, 0);
      board.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
      board.moveTo(0, i * CELL_SIZE);
      board.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
    }
    
    // Exit marker
    board.lineStyle(4, 0xFF3333);
    board.beginFill(0xFF3333, 0.3);
    board.drawRect(GRID_SIZE * CELL_SIZE - 20, 2 * CELL_SIZE + 10, 20, CELL_SIZE - 20);
    board.endFill();
    
    // Arrow indicating exit
    board.beginFill(0xFF3333);
    board.drawPolygon([
      GRID_SIZE * CELL_SIZE - 15, 2 * CELL_SIZE + 20,
      GRID_SIZE * CELL_SIZE - 5, 2 * CELL_SIZE + 30,
      GRID_SIZE * CELL_SIZE - 15, 2 * CELL_SIZE + 40
    ]);
    board.endFill();
    
    app.stage.addChild(board);

    // Block sprites
    const blockSprites: PIXI.Graphics[] = [];

    function createBlockSprite(block: Block, index: number): PIXI.Graphics {
      const sprite = new PIXI.Graphics();
      
      // Block shadow
      sprite.beginFill(0x000000, 0.2);
      sprite.drawRoundedRect(4, 4, block.width * CELL_SIZE - 8, block.height * CELL_SIZE - 8, 8);
      sprite.endFill();
      
      // Main block
      if (block.isTarget) {
        // Target block with gradient effect
        sprite.beginFill(0xFF3333);
        sprite.drawRoundedRect(0, 0, block.width * CELL_SIZE - 8, block.height * CELL_SIZE - 8, 8);
        sprite.endFill();
        
        // Highlight effect
        sprite.beginFill(0xFF6666, 0.5);
        sprite.drawRoundedRect(2, 2, block.width * CELL_SIZE - 12, block.height * CELL_SIZE / 2 - 6, 6);
        sprite.endFill();
        
        // Target symbol
        sprite.beginFill(0xFFFFFF);
        const centerX = (block.width * CELL_SIZE - 8) / 2;
        const centerY = (block.height * CELL_SIZE - 8) / 2;
        sprite.drawCircle(centerX, centerY, 8);
        sprite.endFill();
        
        sprite.beginFill(0xFF3333);
        sprite.drawCircle(centerX, centerY, 5);
        sprite.endFill();
      } else {
        // Regular block
        sprite.beginFill(block.color);
        sprite.drawRoundedRect(0, 0, block.width * CELL_SIZE - 8, block.height * CELL_SIZE - 8, 8);
        sprite.endFill();
        
        // Highlight effect with safe color calculation
        const r = Math.min(255, ((block.color >> 16) & 0xFF) + 0x33);
        const g = Math.min(255, ((block.color >> 8) & 0xFF) + 0x33);
        const b = Math.min(255, (block.color & 0xFF) + 0x33);
        const highlightColor = (r << 16) | (g << 8) | b;
        sprite.beginFill(highlightColor, 0.5);
        sprite.drawRoundedRect(2, 2, block.width * CELL_SIZE - 12, block.height * CELL_SIZE / 2 - 6, 6);
        sprite.endFill();
      }
      
      // Selection indicator
      if (selectedBlock === index) {
        sprite.lineStyle(4, 0xFFD700);
        sprite.drawRoundedRect(-2, -2, block.width * CELL_SIZE - 4, block.height * CELL_SIZE - 4, 10);
      }
      
      // Direction indicator
      sprite.beginFill(0xFFFFFF, 0.8);
      if (block.direction === 'horizontal') {
        // Horizontal arrows
        const y = (block.height * CELL_SIZE - 8) / 2;
        sprite.drawPolygon([5, y - 3, 10, y, 5, y + 3]);
        sprite.drawPolygon([block.width * CELL_SIZE - 13, y - 3, block.width * CELL_SIZE - 8, y, block.width * CELL_SIZE - 13, y + 3]);
      } else {
        // Vertical arrows
        const x = (block.width * CELL_SIZE - 8) / 2;
        sprite.drawPolygon([x - 3, 5, x, 10, x + 3, 5]);
        sprite.drawPolygon([x - 3, block.height * CELL_SIZE - 13, x, block.height * CELL_SIZE - 8, x + 3, block.height * CELL_SIZE - 13]);
      }
      sprite.endFill();
      
      sprite.x = block.x * CELL_SIZE + 4;
      sprite.y = block.y * CELL_SIZE + 4;
      sprite.interactive = true;
      sprite.cursor = 'pointer';
      
      return sprite;
    }

    function updateDisplay() {
      // Remove old block sprites
      blockSprites.forEach(sprite => app.stage.removeChild(sprite));
      blockSprites.length = 0;
      
      // Create new block sprites
      blocks.forEach((block, index) => {
        const sprite = createBlockSprite(block, index);
        blockSprites.push(sprite);
        app.stage.addChild(sprite);
      });
    }

    function isValidPosition(block: Block, newX: number, newY: number, excludeIndex: number): boolean {
      // Check bounds
      if (newX < 0 || newY < 0 || newX + block.width > GRID_SIZE || newY + block.height > GRID_SIZE) {
        return false;
      }
      
      // Check collision with other blocks
      for (let i = 0; i < blocks.length; i++) {
        if (i === excludeIndex) continue;
        const other = blocks[i];
        
        if (newX < other.x + other.width &&
            newX + block.width > other.x &&
            newY < other.y + other.height &&
            newY + block.height > other.y) {
          return false;
        }
      }
      
      return true;
    }

    function checkWin(): boolean {
      const targetBlock = blocks.find(b => b.isTarget);
      return targetBlock ? targetBlock.x + targetBlock.width === GRID_SIZE : false;
    }

    function handlePointerDown(event: PIXI.FederatedPointerEvent) {
      if (!gameRunning) return;
      
      const { x, y } = event.global;
      const localX = x - 4;
      const localY = y - 4;
      
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const blockLeft = block.x * CELL_SIZE;
        const blockTop = block.y * CELL_SIZE;
        const blockRight = blockLeft + block.width * CELL_SIZE;
        const blockBottom = blockTop + block.height * CELL_SIZE;
        
        if (localX >= blockLeft && localX <= blockRight && 
            localY >= blockTop && localY <= blockBottom) {
          selectedBlock = i;
          isDragging = true;
          lastValidPosition = { x: block.x, y: block.y };
          dragOffset.x = localX - blockLeft;
          dragOffset.y = localY - blockTop;
          updateDisplay();
          break;
        }
      }
    }

    function handlePointerMove(event: PIXI.FederatedPointerEvent) {
      if (!gameRunning || selectedBlock === null || !isDragging) return;
      
      const block = blocks[selectedBlock];
      const { x, y } = event.global;
      
      let newX = block.x;
      let newY = block.y;
      
      if (block.direction === 'horizontal') {
        newX = Math.round((x - 4 - dragOffset.x) / CELL_SIZE);
      } else {
        newY = Math.round((y - 4 - dragOffset.y) / CELL_SIZE);
      }
      
      if (isValidPosition(block, newX, newY, selectedBlock)) {
        block.x = newX;
        block.y = newY;
        updateDisplay();
      }
    }

    function handlePointerUp() {
      if (!gameRunning || selectedBlock === null) return;
      
      const block = blocks[selectedBlock];
      
      // Check if block actually moved
      if (block.x !== lastValidPosition.x || block.y !== lastValidPosition.y) {
        localMoves++;
        setMoves(localMoves);
        
        // Check for win
        if (checkWin()) {
          gameRunning = false;
          
          // Update best moves
          if (localMoves < bestMoves[currentLevel]) {
            const newBestMoves = [...bestMoves];
            newBestMoves[currentLevel] = localMoves;
            setBestMoves(newBestMoves);
            localStorage.setItem('unblockme-best-moves', JSON.stringify(newBestMoves));
          }
          
          if (currentLevel === LEVELS.length - 1) {
            setGameState('gameComplete');
          } else {
            setGameState('levelComplete');
          }
        }
      }
      
      selectedBlock = null;
      isDragging = false;
      updateDisplay();
    }

    // UI Elements
    const uiContainer = new PIXI.Container();
    
    const levelText = new PIXI.Text(`Nivel ${currentLevel + 1}/${LEVELS.length}`, {
      fontSize: 24,
      fill: 0xFFFFFF,
      fontWeight: 'bold',
      stroke: 0x000000,
      strokeThickness: 2
    });
    levelText.x = 10;
    levelText.y = 10;
    uiContainer.addChild(levelText);
    
    const movesText = new PIXI.Text(`Movimientos: ${localMoves}`, {
      fontSize: 20,
      fill: 0xFFFFFF,
      fontWeight: 'bold',
      stroke: 0x000000,
      strokeThickness: 2
    });
    movesText.x = 10;
    movesText.y = 40;
    uiContainer.addChild(movesText);
    
    const bestText = new PIXI.Text(`Mejor: ${bestMoves[currentLevel] === Infinity ? '-' : bestMoves[currentLevel]}`, {
      fontSize: 18,
      fill: 0xFFD700,
      fontWeight: 'bold',
      stroke: 0x000000,
      strokeThickness: 2
    });
    bestText.x = 10;
    bestText.y = 65;
    uiContainer.addChild(bestText);
    
    const instructionText = new PIXI.Text('Mueve el bloque rojo a la salida →', {
      fontSize: 16,
      fill: 0xFFFFFF,
      stroke: 0x000000,
      strokeThickness: 1
    });
    instructionText.x = 10;
    instructionText.y = GAME_HEIGHT - 30;
    uiContainer.addChild(instructionText);
    
    app.stage.addChild(uiContainer);
    
    // Event listeners
    app.stage.interactive = true;
    app.stage.on('pointerdown', handlePointerDown);
    app.stage.on('pointermove', handlePointerMove);
    app.stage.on('pointerup', handlePointerUp);
    app.stage.on('pointerupoutside', handlePointerUp);

    function updateGame() {
      if (!gameRunning) return;
      
      movesText.text = `Movimientos: ${localMoves}`;
    }

    app.ticker.add(updateGame);
    updateDisplay();

    return () => {
      gameRunning = false;
      if (containerRef.current && app.view instanceof Node) {
        containerRef.current.removeChild(app.view);
      }
      app.destroy();
    };
  }, [gameState, currentLevel]);

  const startGame = () => {
    setGameState('playing');
    setCurrentLevel(0);
    setMoves(0);
  };

  const nextLevel = () => {
    setCurrentLevel(prev => prev + 1);
    setMoves(0);
    setGameState('playing');
  };

  const restartLevel = () => {
    setMoves(0);
    setGameState('playing');
  };

  const resetProgress = () => {
    setCurrentLevel(0);
    setMoves(0);
    setBestMoves(Array(LEVELS.length).fill(Infinity));
    localStorage.removeItem('unblockme-best-moves');
    setGameState('playing');
  };

  if (gameState === 'start') {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(45deg, #8B4513 0%, #CD853F 50%, #DEB887 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Arial, sans-serif',
        color: 'white',
        overflowY: 'auto'
      }}>
        <div style={{
          maxWidth: '600px',
          width: '90%',
          padding: '2rem',
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '20px',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          margin: '2rem auto'
        }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            marginBottom: '1.5rem',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
            color: '#FFD700'
          }}>
            🧩 UNBLOCK ME
          </h1>
          
          <div style={{
            background: 'rgba(139, 69, 19, 0.2)',
            borderRadius: '15px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            border: '1px solid rgba(139, 69, 19, 0.4)'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#FFD700', fontSize: '1.3rem' }}>🎯 Objetivo</h3>
            <p style={{ margin: '0.5rem 0', fontSize: '1rem' }}>Mueve el bloque rojo 🟥 hasta la salida usando el menor número de movimientos</p>
          </div>

          <div style={{
            background: 'rgba(139, 69, 19, 0.2)',
            borderRadius: '15px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            border: '1px solid rgba(139, 69, 19, 0.4)'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#FFD700', fontSize: '1.3rem' }}>🕹️ Controles</h3>
            <p style={{ margin: '0.5rem 0', fontSize: '1rem' }}>• 🖱️ Click y arrastra los bloques</p>
            <p style={{ margin: '0.5rem 0', fontSize: '1rem' }}>• ↔️ Bloques horizontales: izq/der</p>
            <p style={{ margin: '0.5rem 0', fontSize: '1rem' }}>• ↕️ Bloques verticales: arriba/abajo</p>
          </div>

          <div style={{
            background: 'rgba(139, 69, 19, 0.2)',
            borderRadius: '15px',
            padding: '1.5rem',
            marginBottom: '2rem',
            border: '1px solid rgba(139, 69, 19, 0.4)'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#FFD700', fontSize: '1.3rem' }}>💡 Estrategia</h3>
            <p style={{ margin: '0.5rem 0', fontSize: '1rem' }}>• Planifica antes de mover • Libera espacio primero • Piensa varios pasos adelante</p>
            <p style={{ margin: '0.5rem 0', fontSize: '1rem', color: '#DEB887' }}>{LEVELS.length} niveles de dificultad creciente</p>
          </div>
          
          <button
            onClick={startGame}
            style={{
              padding: '1rem 3rem',
              fontSize: '1.5rem',
              background: 'linear-gradient(45deg, #8B4513, #CD853F)',
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
            🧩 ¡COMENZAR PUZZLE!
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'levelComplete') {
    const isNewRecord = moves < bestMoves[currentLevel];
    
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #32CD32 0%, #98FB98 100%)',
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
            {isNewRecord ? '🏆 ¡NUEVO RÉCORD!' : '🎉 ¡NIVEL COMPLETADO!'}
          </h1>
          <div style={{ fontSize: '1.5rem', margin: '2rem 0' }}>
            <p>📊 Nivel {currentLevel + 1} completado</p>
            <p>🎯 Movimientos usados: <strong>{moves}</strong></p>
            <p>🏆 Tu mejor récord: <strong>{Math.min(moves, bestMoves[currentLevel])}</strong></p>
            {isNewRecord && <p style={{ color: '#FFD700' }}>¡Has superado tu récord anterior!</p>}
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={nextLevel}
              style={{
                padding: '1rem 2rem',
                fontSize: '1.2rem',
                background: 'linear-gradient(45deg, #32CD32, #98FB98)',
                border: 'none',
                borderRadius: '50px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ➡️ Siguiente Nivel
            </button>
            <button
              onClick={restartLevel}
              style={{
                padding: '1rem 2rem',
                fontSize: '1.2rem',
                background: 'linear-gradient(45deg, #8B4513, #CD853F)',
                border: 'none',
                borderRadius: '50px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🔄 Repetir Nivel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'gameComplete') {
    const totalMoves = bestMoves.reduce((sum: number, moves: number) => sum + (moves === Infinity ? 0 : moves), 0);
    
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
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
            🏆 ¡JUEGO COMPLETADO!
          </h1>
          <div style={{ fontSize: '1.5rem', margin: '2rem 0' }}>
            <p>🎯 Has completado todos los {LEVELS.length} niveles</p>
            <p>🏆 Total de movimientos óptimos: <strong>{totalMoves}</strong></p>
            <p>🧠 ¡Eres un maestro del puzzle!</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={resetProgress}
              style={{
                padding: '1rem 2rem',
                fontSize: '1.2rem',
                background: 'linear-gradient(45deg, #8B4513, #CD853F)',
                border: 'none',
                borderRadius: '50px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🔄 Jugar de Nuevo
            </button>
            <button
              onClick={() => setGameState('start')}
              style={{
                padding: '1rem 2rem',
                fontSize: '1.2rem',
                background: 'linear-gradient(45deg, #4169E1, #87CEEB)',
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
      background: 'linear-gradient(135deg, #8B4513 0%, #CD853F 100%)',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif',
      color: 'white'
    }}>
      <h1 style={{ margin: '0 0 20px 0', fontSize: '2.5rem' }}>🧩 UNBLOCK ME</h1>
      <div ref={containerRef} style={{ border: '3px solid #8B4513', borderRadius: '10px' }} />
      <div style={{ marginTop: '20px', fontSize: '1.2rem', textAlign: 'center' }}>
        <p>🖱️ Arrastra los bloques • 🎯 Libera el bloque rojo</p>
      </div>
    </div>
  );
};

export default UnblockMe;
