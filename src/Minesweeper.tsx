import * as PIXI from 'pixi.js';
import React, { useEffect, useRef } from 'react';

const COLS = 10;
const ROWS = 10;
const CELL_SIZE = 40;
const MINES = 15;

const Minesweeper: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const app = new PIXI.Application({
      width: COLS * CELL_SIZE,
      height: ROWS * CELL_SIZE,
      backgroundColor: 0xeeeeee,
    });
    if (containerRef.current && app.view instanceof Node) {
      containerRef.current.appendChild(app.view);
    }

    let board: { mine: boolean; revealed: boolean; flagged: boolean; adjacent: number }[][] = [];
    let gameOver = false;
    let win = false;

    function initBoard() {
      board = Array.from({ length: ROWS }, () =>
        Array.from({ length: COLS }, () => ({ mine: false, revealed: false, flagged: false, adjacent: 0 }))
      );
      // Place mines
      let placed = 0;
      while (placed < MINES) {
        const x = Math.floor(Math.random() * COLS);
        const y = Math.floor(Math.random() * ROWS);
        if (!board[y][x].mine) {
          board[y][x].mine = true;
          placed++;
        }
      }
      // Calculate adjacent
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          let count = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = x + dx, ny = y + dy;
              if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && board[ny][nx].mine) count++;
            }
          }
          board[y][x].adjacent = count;
        }
      }
    }

    function reveal(x: number, y: number) {
      if (board[y][x].revealed || board[y][x].flagged) return;
      board[y][x].revealed = true;
      if (board[y][x].mine) {
        gameOver = true;
        drawBoard();
        return;
      }
      if (board[y][x].adjacent === 0) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
              if (!board[ny][nx].revealed) reveal(nx, ny);
            }
          }
        }
      }
    }

    function checkWin() {
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (!board[y][x].mine && !board[y][x].revealed) return false;
        }
      }
      win = true;
      return true;
    }

    function drawBoard() {
      app.stage.removeChildren();
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const cell = new PIXI.Graphics();
          cell.lineStyle(2, 0x888888);
          cell.beginFill(board[y][x].revealed ? 0xffffff : 0xcccccc);
          cell.drawRect(0, 0, CELL_SIZE, CELL_SIZE);
          cell.endFill();
          cell.x = x * CELL_SIZE;
          cell.y = y * CELL_SIZE;
          app.stage.addChild(cell);
          if (board[y][x].revealed) {
            if (board[y][x].mine) {
              const mine = new PIXI.Graphics();
              mine.beginFill(0xff0000);
              mine.drawCircle(CELL_SIZE / 2, CELL_SIZE / 2, CELL_SIZE / 4);
              mine.endFill();
              mine.x = x * CELL_SIZE;
              mine.y = y * CELL_SIZE;
              app.stage.addChild(mine);
            } else if (board[y][x].adjacent > 0) {
              const txt = new PIXI.Text(`${board[y][x].adjacent}`, { fill: 0x222222, fontSize: 24 });
              txt.x = x * CELL_SIZE + CELL_SIZE / 2 - 8;
              txt.y = y * CELL_SIZE + CELL_SIZE / 2 - 16;
              app.stage.addChild(txt);
            }
          } else if (board[y][x].flagged) {
            const flag = new PIXI.Graphics();
            flag.beginFill(0x0000ff);
            flag.drawRect(CELL_SIZE / 2 - 8, CELL_SIZE / 2 - 16, 16, 24);
            flag.endFill();
            flag.x = x * CELL_SIZE;
            flag.y = y * CELL_SIZE;
            app.stage.addChild(flag);
          }
        }
      }
      // Mensaje Game Over/win
      if (gameOver) {
        const msg = 'Game Over! Pulsa espacio para reiniciar';
        const overText = new PIXI.Text(msg, { fill: '#ff0000', fontSize: 24 });
        const textWidth = overText.width;
        const textHeight = overText.height;
        const bgPadding = 16;
        const bg = new PIXI.Graphics();
        bg.beginFill(0xffffff, 0.85);
        bg.drawRect(
          (COLS * CELL_SIZE - textWidth) / 2 - bgPadding,
          (ROWS * CELL_SIZE - textHeight) / 2 - bgPadding,
          textWidth + bgPadding * 2,
          textHeight + bgPadding * 2
        );
        bg.endFill();
        app.stage.addChild(bg);
        overText.x = (COLS * CELL_SIZE - textWidth) / 2;
        overText.y = (ROWS * CELL_SIZE - textHeight) / 2;
        app.stage.addChild(overText);
      }
      if (win) {
        const msg = '¡Has ganado! Pulsa espacio para reiniciar';
        const winText = new PIXI.Text(msg, { fill: 0x00aa00, fontSize: 24 });
        const textWidth = winText.width;
        const textHeight = winText.height;
        const bgPadding = 16;
        const bg = new PIXI.Graphics();
        bg.beginFill(0xffffff, 0.85);
        bg.drawRect(
          (COLS * CELL_SIZE - textWidth) / 2 - bgPadding,
          (ROWS * CELL_SIZE - textHeight) / 2 - bgPadding,
          textWidth + bgPadding * 2,
          textHeight + bgPadding * 2
        );
        bg.endFill();
        app.stage.addChild(bg);
        winText.x = (COLS * CELL_SIZE - textWidth) / 2;
        winText.y = (ROWS * CELL_SIZE - textHeight) / 2;
        app.stage.addChild(winText);
      }
    }

    function onClick(e: MouseEvent) {
      if (gameOver || win) return;
      if (!(app.view instanceof HTMLCanvasElement)) return;
      const rect = app.view.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const x = Math.floor(mouseX / CELL_SIZE);
      const y = Math.floor(mouseY / CELL_SIZE);
      if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
        reveal(x, y);
        checkWin();
        drawBoard();
      }
    }

    function onRightClick(e: MouseEvent) {
      e.preventDefault();
      if (gameOver || win) return;
      if (!(app.view instanceof HTMLCanvasElement)) return;
      const rect = app.view.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const x = Math.floor(mouseX / CELL_SIZE);
      const y = Math.floor(mouseY / CELL_SIZE);
      if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
        board[y][x].flagged = !board[y][x].flagged;
        drawBoard();
      }
    }

    function resetGame() {
      gameOver = false;
      win = false;
      initBoard();
      drawBoard();
    }

    if (app.view instanceof HTMLCanvasElement) {
      app.view.addEventListener('mousedown', onClick as EventListener);
      app.view.addEventListener('contextmenu', onRightClick as EventListener);
    }

    const keydown = (e: KeyboardEvent) => {
      if ((gameOver || win) && e.code === 'Space') {
        resetGame();
      }
    };
    window.addEventListener('keydown', keydown);

    resetGame();

    return () => {
      window.removeEventListener('keydown', keydown);
      if (app.view instanceof HTMLCanvasElement) {
        app.view.removeEventListener('mousedown', onClick as EventListener);
        app.view.removeEventListener('contextmenu', onRightClick as EventListener);
      }
      app.destroy(true, { children: true });
    };
  }, []);

  return <div ref={containerRef} style={{ width: COLS * CELL_SIZE, height: ROWS * CELL_SIZE + 48, margin: 'auto' }} />;
};

export default Minesweeper;
