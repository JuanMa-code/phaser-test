import * as PIXI from 'pixi.js';
import React, { useEffect, useRef, useState } from 'react';

const COLS = 12;
const ROWS = 8;
const CELL_SIZE = 48;
const PATH = [
  { x: 0, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 },
  { x: 4, y: 3 }, { x: 5, y: 3 }, { x: 6, y: 3 }, { x: 7, y: 3 },
  { x: 8, y: 3 }, { x: 8, y: 4 }, { x: 9, y: 4 }, { x: 10, y: 4 }, { x: 11, y: 4 }
];

interface Enemy {
  pos: number; // index in PATH
  hp: number;
  maxHp: number;
  alive: boolean;
}

interface Tower {
  x: number;
  y: number;
  level: number;
  cooldown: number;
}

interface Shot {
  x: number;
  y: number;
  tx: number;
  ty: number;
  progress: number;
  damage: number;
  target: number; // enemy index
}

const ENEMY_SPEED = 0.02;
const TOWER_RANGE = 3;
const TOWER_COOLDOWN = 60;
const SHOT_SPEED = 0.06;

const TowerDefense: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gold, setGold] = useState(10);
  const [wave, setWave] = useState(1);
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState('');
  const gameRef = useRef({
    enemies: [] as Enemy[],
    towers: [] as Tower[],
    shots: [] as Shot[],
    pendingEnemies: [] as Enemy[],
    spawnTimer: 0,
  });

  useEffect(() => {
    const app = new PIXI.Application({
      width: COLS * CELL_SIZE,
      height: ROWS * CELL_SIZE,
      backgroundColor: 0x22232a,
    });
    if (containerRef.current && app.view instanceof Node) {
      containerRef.current.appendChild(app.view);
    }

    // Elementos estáticos
    let staticDrawn = false;
    function drawStatic() {
      if (staticDrawn) return;
      // Draw grid
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const g = new PIXI.Graphics();
          g.lineStyle(1, 0x444444);
          g.beginFill(0x22232a);
          g.drawRect(0, 0, CELL_SIZE, CELL_SIZE);
          g.endFill();
          g.x = x * CELL_SIZE;
          g.y = y * CELL_SIZE;
          g.name = 'static';
          app.stage.addChild(g);
        }
      }
      // Draw path
      PATH.forEach((p, i) => {
        const g = new PIXI.Graphics();
        g.beginFill(0xaaaaaa);
        g.drawRect(0, 0, CELL_SIZE, CELL_SIZE);
        g.endFill();
        g.x = p.x * CELL_SIZE;
        g.y = p.y * CELL_SIZE;
        g.name = 'static';
        app.stage.addChild(g);
      });
      // Draw towers
      gameRef.current.towers.forEach(t => {
        const g = new PIXI.Graphics();
        g.beginFill(0x1976d2);
        g.drawCircle(CELL_SIZE / 2, CELL_SIZE / 2, CELL_SIZE / 2 - 6);
        g.endFill();
        g.lineStyle(2, 0xffffff);
        g.drawCircle(CELL_SIZE / 2, CELL_SIZE / 2, (CELL_SIZE / 2 - 6) * (1 + t.level * 0.2));
        g.x = t.x * CELL_SIZE;
        g.y = t.y * CELL_SIZE;
        g.name = 'tower';
        app.stage.addChild(g);
      });
      staticDrawn = true;
    }

    function clearDynamic() {
      app.stage.children = app.stage.children.filter(c => c.name === 'static' || c.name === 'tower');
    }

    function drawDynamic() {
      clearDynamic();
      // Draw enemies
      gameRef.current.enemies.forEach((e, idx) => {
        if (!e.alive) return;
        const p = PATH[Math.floor(e.pos)];
        if (!p) return;
        const g = new PIXI.Graphics();
        g.beginFill(0xff3333);
        g.drawCircle(CELL_SIZE / 2, CELL_SIZE / 2, CELL_SIZE / 2 - 8);
        g.endFill();
        g.x = p.x * CELL_SIZE;
        g.y = p.y * CELL_SIZE;
        g.name = 'enemy';
        app.stage.addChild(g);
        // HP bar
        const hpBar = new PIXI.Graphics();
        hpBar.beginFill(0x00ff00);
        const hpValue = Math.max(0, e.hp);
        hpBar.drawRect(0, 0, (CELL_SIZE - 8) * (hpValue / e.maxHp), 6);
        hpBar.endFill();
        hpBar.x = p.x * CELL_SIZE + 4;
        hpBar.y = p.y * CELL_SIZE + CELL_SIZE - 12;
        hpBar.name = 'hp';
        app.stage.addChild(hpBar);
      });
      // Draw shots
      gameRef.current.shots.forEach(s => {
        const g = new PIXI.Graphics();
        g.beginFill(0xffff00);
        g.drawCircle(0, 0, 7);
        g.endFill();
        g.x = s.x;
        g.y = s.y;
        g.name = 'shot';
        app.stage.addChild(g);
      });
      // UI
      const style = new PIXI.TextStyle({ fill: 0xffffff, fontSize: 20, fontWeight: 'bold' });
      const goldText = new PIXI.Text(`Oro: ${gold}`, style);
      goldText.x = 12;
      goldText.y = 8;
      goldText.name = 'ui';
      app.stage.addChild(goldText);
      const waveText = new PIXI.Text(`Oleada: ${wave}`, style);
      waveText.x = 12;
      waveText.y = 32;
      waveText.name = 'ui';
      app.stage.addChild(waveText);
      if (placing) {
        const msg = new PIXI.Text('Haz clic en una celda junto al camino para poner torre (5 oro)', { fill: 0xfff176, fontSize: 16 });
        msg.x = 12;
        msg.y = 56;
        msg.name = 'ui';
        app.stage.addChild(msg);
      }
      if (message) {
        const msg = new PIXI.Text(message, { fill: 0xff3333, fontSize: 18 });
        msg.x = 12;
        msg.y = 80;
        msg.name = 'ui';
        app.stage.addChild(msg);
      }
    }

    drawStatic();
    drawDynamic();

    let animationId: number;
    function gameLoop() {
      // Spawn enemies uno a uno
      if (gameRef.current.pendingEnemies.length > 0) {
        gameRef.current.spawnTimer--;
        if (gameRef.current.spawnTimer <= 0) {
          const next = gameRef.current.pendingEnemies.shift();
          if (next) gameRef.current.enemies.push(next);
          gameRef.current.spawnTimer = 40; // frames entre cada spawn
        }
      }
      // Move enemies
      gameRef.current.enemies.forEach(e => {
        if (!e.alive) return;
        let newPos = e.pos + ENEMY_SPEED;
        if (newPos >= PATH.length) {
          e.alive = false;
          setMessage('¡Un enemigo ha llegado al final!');
          return;
        }
        e.pos = newPos;
      });
      // Towers attack
      gameRef.current.towers.forEach((t, ti) => {
        t.cooldown = Math.max(0, t.cooldown - 1);
        if (t.cooldown === 0) {
          const targetIdx = gameRef.current.enemies.findIndex(e => e.alive && distance(t.x, t.y, PATH[Math.floor(e.pos)].x, PATH[Math.floor(e.pos)].y) <= TOWER_RANGE);
          if (targetIdx !== -1) {
            const target = gameRef.current.enemies[targetIdx];
            const tx = PATH[Math.floor(target.pos)].x * CELL_SIZE + CELL_SIZE / 2;
            const ty = PATH[Math.floor(target.pos)].y * CELL_SIZE + CELL_SIZE / 2;
            gameRef.current.shots.push({
              x: t.x * CELL_SIZE + CELL_SIZE / 2,
              y: t.y * CELL_SIZE + CELL_SIZE / 2,
              tx, ty, progress: 0, damage: Math.pow(2, t.level), target: targetIdx
            });
            t.cooldown = TOWER_COOLDOWN;
          }
        }
      });
      // Move shots
      gameRef.current.shots = gameRef.current.shots.filter(s => {
        s.progress += SHOT_SPEED;
        const dx = s.tx - s.x;
        const dy = s.ty - s.y;
        s.x += dx * SHOT_SPEED;
        s.y += dy * SHOT_SPEED;
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
          // Hit enemy
          const e = gameRef.current.enemies[s.target];
          if (e && e.alive) {
            e.hp -= s.damage;
          }
          return false;
        }
        return true;
      });
      // Remove dead enemies, add gold
      gameRef.current.enemies.forEach(e => {
        if (e.hp <= 0 && e.alive) {
          setGold(g => g + wave);
          e.alive = false;
        }
      });
      drawDynamic();
      animationId = requestAnimationFrame(gameLoop);
    }
    animationId = requestAnimationFrame(gameLoop);

    function distance(x1: number, y1: number, x2: number, y2: number) {
      return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
    }

    function onPointerDown(e: PointerEvent) {
      if (!placing) return;
      if (!(app.view instanceof HTMLCanvasElement)) return;
      const rect = app.view.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const gridX = Math.floor(mouseX / CELL_SIZE);
      const gridY = Math.floor(mouseY / CELL_SIZE);
      // Only allow placing next to path
      const isNextToPath = PATH.some(p => Math.abs(p.x - gridX) + Math.abs(p.y - gridY) === 1);
      if (!isNextToPath) {
        setMessage('Solo puedes poner torres junto al camino');
        return;
      }
      if (gameRef.current.towers.some(t => t.x === gridX && t.y === gridY)) {
        setMessage('Ya hay una torre ahí');
        return;
      }
      if (gold < 5) {
        setMessage('No tienes suficiente oro');
        return;
      }
      gameRef.current.towers.push({ x: gridX, y: gridY, level: 1, cooldown: 0 });
      setGold(g => g - 5);
      setMessage('');
      setPlacing(false);
    }

    function onPointerUp(e: PointerEvent) {
      // Mejora torre si clicas sobre ella
      if (!(app.view instanceof HTMLCanvasElement)) return;
      const rect = app.view.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const gridX = Math.floor(mouseX / CELL_SIZE);
      const gridY = Math.floor(mouseY / CELL_SIZE);
      const idx = gameRef.current.towers.findIndex(t => t.x === gridX && t.y === gridY);
      if (idx !== -1) {
        const cost = Math.pow(2, gameRef.current.towers[idx].level) * 5;
        if (gold < cost) {
          setMessage('No tienes suficiente oro para mejorar');
          return;
        }
        gameRef.current.towers[idx].level += 1;
        setGold(g => g - cost);
        setMessage('Torre mejorada');
      }
    }

    if (app.view instanceof HTMLCanvasElement) {
      app.view.addEventListener('pointerdown', onPointerDown as EventListener);
      app.view.addEventListener('pointerup', onPointerUp as EventListener);
    }

    return () => {
      if (app.view instanceof HTMLCanvasElement) {
        app.view.removeEventListener('pointerdown', onPointerDown as EventListener);
        app.view.removeEventListener('pointerup', onPointerUp as EventListener);
      }
      cancelAnimationFrame(animationId);
      app.destroy(true, { children: true });
    };
  }, [placing, gold, wave, message]);

  // Iniciar oleada
  function startWave() {
    const newEnemies: Enemy[] = [];
    for (let i = 0; i < wave * 2; i++) {
      newEnemies.push({ pos: 0, hp: wave + 1, maxHp: wave + 1, alive: true });
    }
    gameRef.current.pendingEnemies = newEnemies;
    gameRef.current.spawnTimer = 0;
    gameRef.current.enemies = [];
    setWave(wave + 1);
    setMessage('');
  }

  // Verificar si quedan enemigos vivos
  useEffect(() => {
    if (gameRef.current.enemies.length > 0 && gameRef.current.enemies.every(e => !e.alive)) {
      setMessage('¡Oleada completada!');
    }
  }, [gold, wave]);

  return (
    <div>
      <div ref={containerRef} style={{ width: COLS * CELL_SIZE, height: ROWS * CELL_SIZE, margin: 'auto' }} />
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button onClick={() => setPlacing(true)} disabled={placing || gold < 5} style={{ marginRight: 8 }}>
          {placing ? 'Haz clic en el mapa...' : 'Colocar torre (5 oro)'}
        </button>
        <button onClick={startWave} disabled={gameRef.current.enemies.some((e: Enemy) => e.alive)}>
          Iniciar oleada
        </button>
      </div>
    </div>
  );
};

export default TowerDefense;
