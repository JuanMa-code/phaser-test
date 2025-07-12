import * as PIXI from 'pixi.js';
import React, { useEffect, useRef } from 'react';

const COLS = 6;
const ROWS = 6;
const CELL_SIZE = 64;

// Simple level: red block must reach right edge
const LEVEL = [
  { x: 0, y: 2, w: 2, h: 1, color: 0xff3333, movable: 'h' as const, main: true }, // red block
  { x: 0, y: 0, w: 3, h: 1, color: 0x999999, movable: 'h' as const },
  { x: 3, y: 0, w: 1, h: 3, color: 0x999999, movable: 'v' as const },
  { x: 4, y: 0, w: 2, h: 1, color: 0x999999, movable: 'h' as const },
  { x: 2, y: 1, w: 1, h: 2, color: 0x999999, movable: 'v' as const },
  { x: 2, y: 3, w: 2, h: 1, color: 0x999999, movable: 'h' as const },
  { x: 0, y: 4, w: 1, h: 2, color: 0x999999, movable: 'v' as const },
  { x: 1, y: 4, w: 2, h: 1, color: 0x999999, movable: 'h' as const },
  { x: 3, y: 4, w: 1, h: 2, color: 0x999999, movable: 'v' as const },
  { x: 4, y: 4, w: 2, h: 1, color: 0x999999, movable: 'h' as const },
  { x: 1, y: 5, w: 2, h: 1, color: 0x999999, movable: 'h' as const },
];

interface Block {
  x: number;
  y: number;
  w: number;
  h: number;
  color: number;
  movable: 'h' | 'v';
  main?: boolean;
}

const UnblockMe: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const app = new PIXI.Application({
      width: COLS * CELL_SIZE,
      height: ROWS * CELL_SIZE,
      backgroundColor: 0xf5f5dc,
    });
    if (containerRef.current && app.view instanceof Node) {
      containerRef.current.appendChild(app.view);
    }

    let blocks: Block[] = LEVEL.map(b => ({ ...b }));
    let selected: number | null = null;
    let offset = { x: 0, y: 0 };
    let win = false;

    function draw() {
      app.stage.removeChildren();
      // Draw grid
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const g = new PIXI.Graphics();
          g.lineStyle(1, 0xcccccc);
          g.beginFill(0xf5f5dc);
          g.drawRect(0, 0, CELL_SIZE, CELL_SIZE);
          g.endFill();
          g.x = x * CELL_SIZE;
          g.y = y * CELL_SIZE;
          app.stage.addChild(g);
        }
      }
      // Draw blocks
      blocks.forEach((b, i) => {
        const g = new PIXI.Graphics();
        g.beginFill(b.color);
        g.drawRoundedRect(0, 0, b.w * CELL_SIZE - 8, b.h * CELL_SIZE - 8, 16);
        g.endFill();
        g.x = b.x * CELL_SIZE + 4;
        g.y = b.y * CELL_SIZE + 4;
        app.stage.addChild(g);
        if (i === selected) {
          g.lineStyle(4, 0x00bfff);
          g.drawRoundedRect(0, 0, b.w * CELL_SIZE - 8, b.h * CELL_SIZE - 8, 16);
        }
      });
      // Win message
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

    function isFree(x: number, y: number, w: number, h: number, ignoreIdx: number) {
      for (let i = 0; i < blocks.length; i++) {
        if (i === ignoreIdx) continue;
        const b = blocks[i];
        if (
          x < b.x + b.w &&
          x + w > b.x &&
          y < b.y + b.h &&
          y + h > b.y
        ) return false;
      }
      return x >= 0 && y >= 0 && x + w <= COLS && y + h <= ROWS;
    }

    function onPointerDown(e: PointerEvent) {
      if (win) return;
      if (!(app.view instanceof HTMLCanvasElement)) return;
      const rect = app.view.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        if (
          mouseX >= b.x * CELL_SIZE && mouseX <= (b.x + b.w) * CELL_SIZE &&
          mouseY >= b.y * CELL_SIZE && mouseY <= (b.y + b.h) * CELL_SIZE
        ) {
          selected = i;
          offset.x = mouseX - b.x * CELL_SIZE;
          offset.y = mouseY - b.y * CELL_SIZE;
          break;
        }
      }
    }

    function onPointerMove(e: PointerEvent) {
      if (selected === null || win) return;
      const b = blocks[selected];
      if (!(app.view instanceof HTMLCanvasElement)) return;
      const rect = app.view.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      let nx = b.x, ny = b.y;
      if (b.movable === 'h') {
        nx = Math.round((mouseX - offset.x) / CELL_SIZE);
      } else {
        ny = Math.round((mouseY - offset.y) / CELL_SIZE);
      }
      if (isFree(nx, ny, b.w, b.h, selected)) {
        b.x = nx;
        b.y = ny;
        draw();
      }
    }

    function onPointerUp() {
      selected = null;
      // Check win
      const red = blocks.find(b => b.main);
      if (red && red.x + red.w === COLS) {
        win = true;
        draw();
      }
    }

    function handleKey(e: KeyboardEvent) {
      if (win && e.code === 'Space') {
        blocks = LEVEL.map(b => ({ ...b }));
        win = false;
        draw();
      }
    }

    if (app.view instanceof HTMLCanvasElement) {
      app.view.addEventListener('pointerdown', onPointerDown as EventListener);
      app.view.addEventListener('pointermove', onPointerMove as EventListener);
      app.view.addEventListener('pointerup', onPointerUp as EventListener);
    }
    window.addEventListener('keydown', handleKey);
    draw();

    return () => {
      if (app.view instanceof HTMLCanvasElement) {
        app.view.removeEventListener('pointerdown', onPointerDown as EventListener);
        app.view.removeEventListener('pointermove', onPointerMove as EventListener);
        app.view.removeEventListener('pointerup', onPointerUp as EventListener);
      }
      window.removeEventListener('keydown', handleKey);
      app.destroy(true, { children: true });
    };
  }, []);

  return <div ref={containerRef} style={{ width: COLS * CELL_SIZE, height: ROWS * CELL_SIZE + 48, margin: 'auto' }} />;
};

export default UnblockMe;
