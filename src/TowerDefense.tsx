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
  towerLevel: number; // nivel de la torre que dispara
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
    currentGold: 10, // Añadimos oro a la referencia
    currentWave: 1,  // Añadimos wave a la referencia
    damageTexts: [] as Array<{x: number, y: number, damage: number, timer: number}>, // Textos de daño
  });

    // Colores por nivel (hasta 10)
    const towerColors = [
      0x1976d2, // 1 azul
      0x43a047, // 2 verde
      0xfbc02d, // 3 amarillo
      0xe53935, // 4 rojo
      0x8e24aa, // 5 violeta
      0x00bcd4, // 6 cyan
      0xff9800, // 7 naranja
      0x6d4c41, // 8 marrón
      0xcddc39, // 9 lima
      0x212121  // 10 negro
    ];

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
      staticDrawn = true;
    }

    function clearDynamic() {
      // Elimina todos los elementos dinámicos (enemigos, shots, hp, ui, towers)
      for (let i = app.stage.children.length - 1; i >= 0; i--) {
        const c = app.stage.children[i];
        if (c.name !== 'static') {
          app.stage.removeChild(c);
        }
      }
    }

    function drawDynamic() {
      clearDynamic();
      // Draw towers (ahora en dinámico para que se actualicen)
      gameRef.current.towers.forEach(t => {
        const color = towerColors[Math.min(t.level - 1, towerColors.length - 1)];
        const g = new PIXI.Graphics();
        g.beginFill(color);
        g.drawCircle(CELL_SIZE / 2, CELL_SIZE / 2, CELL_SIZE / 2 - 6);
        g.endFill();
        g.lineStyle(2, 0xffffff);
        g.drawCircle(CELL_SIZE / 2, CELL_SIZE / 2, (CELL_SIZE / 2 - 6) * (1 + t.level * 0.2));
        g.x = t.x * CELL_SIZE;
        g.y = t.y * CELL_SIZE;
        g.name = 'tower';
        app.stage.addChild(g);
        
        // Número del nivel en la torre
        const levelText = new PIXI.Text(t.level.toString(), { 
          fill: 0xffffff, 
          fontSize: 14, 
          fontWeight: 'bold',
          align: 'center'
        });
        levelText.anchor.set(0.5);
        levelText.x = t.x * CELL_SIZE + CELL_SIZE / 2;
        levelText.y = t.y * CELL_SIZE + CELL_SIZE / 2;
        levelText.name = 'tower-level';
        app.stage.addChild(levelText);
      });
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
        
        // Número de vida en el enemigo
        const hpText = new PIXI.Text(Math.ceil(hpValue).toString(), { 
          fill: 0xffffff, 
          fontSize: 12, 
          fontWeight: 'bold',
          align: 'center'
        });
        hpText.anchor.set(0.5);
        hpText.x = p.x * CELL_SIZE + CELL_SIZE / 2;
        hpText.y = p.y * CELL_SIZE + CELL_SIZE / 2;
        hpText.name = 'enemy-hp';
        app.stage.addChild(hpText);
      });
      // Misil cambia color según nivel de torre
      gameRef.current.shots.forEach(s => {
        const color = towerColors[Math.min(s.towerLevel - 1, towerColors.length - 1)];
        const g = new PIXI.Graphics();
        g.beginFill(color);
        g.drawCircle(0, 0, 7);
        g.endFill();
        g.x = s.x;
        g.y = s.y;
        g.name = 'shot';
        app.stage.addChild(g);
      });
      // UI
      const style = new PIXI.TextStyle({ fill: 0xffffff, fontSize: 20, fontWeight: 'bold' });
      const goldText = new PIXI.Text(`Oro: ${gameRef.current.currentGold}`, style);
      goldText.x = 12;
      goldText.y = 8;
      goldText.name = 'ui';
      app.stage.addChild(goldText);
      const waveText = new PIXI.Text(`Oleada: ${gameRef.current.currentWave}`, style);
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
      // Textos de daño flotantes (al final para que aparezcan por encima)
      gameRef.current.damageTexts.forEach(dt => {
        const damageText = new PIXI.Text(`-${dt.damage}`, { 
          fill: 0xffff00, // Amarillo brillante
          fontSize: 14, // Más pequeño
          fontWeight: 'bold',
          align: 'center',
          stroke: 0x000000, // Borde negro
          strokeThickness: 2 // Borde más fino
        });
        damageText.anchor.set(0.5);
        damageText.x = dt.x + Math.random() * 10 - 5; // Menos aleatoriedad horizontal
        damageText.y = dt.y - (30 - dt.timer) * 1.5; // Se mueve hacia arriba desde el centro
        damageText.alpha = Math.min(1, dt.timer / 10); // Se desvanece más rápido
        damageText.name = 'damage-text';
        app.stage.addChild(damageText);
      });
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
              tx, ty, progress: 0, damage: Math.pow(2, t.level), 
              target: targetIdx,
              towerLevel: t.level // Añadimos el nivel de la torre que dispara
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
            // Obtener posición actual del enemigo
            const enemyPath = PATH[Math.floor(e.pos)];
            if (enemyPath) {
              // Añadir texto de daño flotante en la posición del enemigo
              gameRef.current.damageTexts.push({
                x: enemyPath.x * CELL_SIZE + CELL_SIZE / 2, // Centro del enemigo
                y: enemyPath.y * CELL_SIZE + CELL_SIZE / 2, // Centro del enemigo (sin offset)
                damage: s.damage,
                timer: 30 // 1 segundo a 60fps
              });
              console.log(`Daño flotante creado: ${s.damage} en posición de enemigo (${enemyPath.x * CELL_SIZE + CELL_SIZE / 2}, ${enemyPath.y * CELL_SIZE + CELL_SIZE / 2 - 20})`);
            }
          }
          return false;
        }
        return true;
      });
      // Remove dead enemies, add gold
      let goldToAdd = 0;
      gameRef.current.enemies.forEach(e => {
        if (e.hp <= 0 && e.alive) {
          goldToAdd += gameRef.current.currentWave - 1; // Usar wave de ref
          e.alive = false;
        }
      });
      if (goldToAdd > 0) {
        gameRef.current.currentGold += goldToAdd;
        setGold(gameRef.current.currentGold);
      }
      // Actualizar textos de daño
      gameRef.current.damageTexts = gameRef.current.damageTexts.filter(dt => {
        dt.timer--;
        return dt.timer > 0;
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
      if (gameRef.current.currentGold < 5) {
        setMessage('No tienes suficiente oro');
        return;
      }
      gameRef.current.towers.push({ x: gridX, y: gridY, level: 1, cooldown: 0 });
      gameRef.current.currentGold -= 5;
      setGold(gameRef.current.currentGold);
      setMessage('');
      setPlacing(false);
      drawDynamic(); // Redibujar inmediatamente
    }

    function onPointerUp(e: PointerEvent) {
      // No mejorar torre si acabamos de colocar una
      if (placing) return;
      
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
        if (gameRef.current.currentGold < cost) {
          setMessage('No tienes suficiente oro para mejorar');
          return;
        }
        gameRef.current.towers[idx].level += 1;
        gameRef.current.currentGold -= cost;
        setGold(gameRef.current.currentGold);
        setMessage('Torre mejorada');
        drawDynamic(); // Redibujar inmediatamente
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
  }, [placing, message]); // Removemos gold y wave de las dependencias

  // Iniciar oleada
  function startWave() {
    const newEnemies: Enemy[] = [];
    for (let i = 0; i < gameRef.current.currentWave * 2; i++) {
      newEnemies.push({ pos: 0, hp: gameRef.current.currentWave + 1, maxHp: gameRef.current.currentWave + 1, alive: true });
    }
    gameRef.current.pendingEnemies = newEnemies;
    gameRef.current.spawnTimer = 0;
    gameRef.current.enemies = [];
    gameRef.current.currentWave += 1;
    setWave(gameRef.current.currentWave);
    setMessage('');
  }

  // Sincronizar estado inicial
  useEffect(() => {
    setGold(gameRef.current.currentGold);
    setWave(gameRef.current.currentWave);
  }, []);
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
