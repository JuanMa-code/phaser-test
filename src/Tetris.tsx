import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
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

  useEffect(() => {
    const app = new PIXI.Application({
      width: COLS * BLOCK_SIZE,
      height: ROWS * BLOCK_SIZE,
      backgroundColor: 0x222222,
    });
    if (containerRef.current && app.view instanceof Node) {
      containerRef.current.appendChild(app.view);
    }

    let board: (number | null)[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    let piece = randomPiece();
    let gameOver = false;

    function drawBoard() {
      app.stage.removeChildren();
      // Draw board
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (board[y][x] !== null) {
            const block = new PIXI.Graphics();
            block.beginFill(board[y][x] as number);
            block.drawRect(0, 0, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
            block.endFill();
            block.x = x * BLOCK_SIZE;
            block.y = y * BLOCK_SIZE;
            app.stage.addChild(block);
          }
        }
      }
      // Draw current piece
      for (let py = 0; py < piece.shape.length; py++) {
        for (let px = 0; px < piece.shape[py].length; px++) {
          if (piece.shape[py][px]) {
            const block = new PIXI.Graphics();
            block.beginFill(piece.color);
            block.drawRect(0, 0, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
            block.endFill();
            block.x = (piece.x + px) * BLOCK_SIZE;
            block.y = (piece.y + py) * BLOCK_SIZE;
            app.stage.addChild(block);
          }
        }
      }
    }

    function collide(offsetX = 0, offsetY = 0, testShape = piece.shape) {
      for (let py = 0; py < testShape.length; py++) {
        for (let px = 0; px < testShape[py].length; px++) {
          if (testShape[py][px]) {
            const x = piece.x + px + offsetX;
            const y = piece.y + py + offsetY;
            if (x < 0 || x >= COLS || y >= ROWS || (y >= 0 && board[y][x] !== null)) {
              return true;
            }
          }
        }
      }
      return false;
    }

    function mergePiece() {
      for (let py = 0; py < piece.shape.length; py++) {
        for (let px = 0; px < piece.shape[py].length; px++) {
          if (piece.shape[py][px]) {
            const x = piece.x + px;
            const y = piece.y + py;
            if (y >= 0) board[y][x] = piece.color;
          }
        }
      }
    }

    function rotate(shape: number[][]) {
      return shape[0].map((_, i) => shape.map(row => row[i])).reverse();
    }

    function removeFullRows() {
      let lines = 0;
      for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== null)) {
          board.splice(y, 1);
          board.unshift(Array(COLS).fill(null));
          lines++;
          y++;
        }
      }
      return lines;
    }

    let dropCounter = 0;
    let dropInterval = 30;

    function update() {
      if (gameOver) return;
      dropCounter++;
      if (dropCounter > dropInterval) {
        if (!collide(0, 1)) {
          piece.y++;
        } else {
          mergePiece();
          removeFullRows();
          piece = randomPiece();
          if (collide(0, 0)) {
            gameOver = true;
          }
        }
        dropCounter = 0;
      }
      drawBoard();
    }

    app.ticker.add(update);

    const keydown = (e: KeyboardEvent) => {
      if (gameOver) return;
      if (e.key === 'ArrowLeft' && !collide(-1, 0)) piece.x--;
      if (e.key === 'ArrowRight' && !collide(1, 0)) piece.x++;
      if (e.key === 'ArrowDown' && !collide(0, 1)) piece.y++;
      if (e.key === 'ArrowUp') {
        const newShape = rotate(piece.shape);
        if (!collide(0, 0, newShape)) piece.shape = newShape;
      }
      drawBoard();
    };
    window.addEventListener('keydown', keydown);

    return () => {
      window.removeEventListener('keydown', keydown);
      app.destroy(true, { children: true });
    };
  }, []);

  return <div ref={containerRef} style={{ width: COLS * BLOCK_SIZE, height: ROWS * BLOCK_SIZE, margin: 'auto' }} />;
};

export default Tetris;
