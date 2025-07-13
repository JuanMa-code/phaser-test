import * as PIXI from 'pixi.js';
import React, { useEffect, useRef, useState } from 'react';

// Agregar estilos CSS personalizados
const styles = `
  /* Ocultar barras de scroll pero mantener funcionalidad */
  ::-webkit-scrollbar {
    width: 0px;
    background: transparent;
  }
  
  ::-webkit-scrollbar-thumb {
    background: transparent;
  }
  
  * {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* Internet Explorer 10+ */
  }
  
  /* Clase para contenedores scrolleables sin barra visible */
  .scrollable-hidden {
    overflow: auto;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* Internet Explorer 10+ */
  }
  
  .scrollable-hidden::-webkit-scrollbar {
    width: 0px;
    background: transparent;
  }

  @keyframes fade-in {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes bounce-slow {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-5px); }
    60% { transform: translateY(-3px); }
  }
  
  @keyframes pulse-glow {
    0%, 100% { opacity: 0.1; transform: scale(1); }
    50% { opacity: 0.2; transform: scale(1.05); }
  }
  
  @keyframes ping-float {
    0% { opacity: 0; transform: scale(0.5); }
    50% { opacity: 1; transform: scale(1); }
    100% { opacity: 0; transform: scale(1.2); }
  }
  
  .animate-fade-in {
    animation: fade-in 0.8s ease-out;
  }
  
  .animate-bounce-slow {
    animation: bounce-slow 3s ease-in-out infinite;
  }
  
  .animate-pulse-glow {
    animation: pulse-glow 3s ease-in-out infinite;
  }
  
  .animate-ping-float {
    animation: ping-float 2s ease-in-out infinite;
  }
  
  .tower-defense-bg {
    background: linear-gradient(135deg, 
      #1e1b4b 0%,    /* indigo-900 */
      #581c87 25%,   /* purple-900 */
      #7c2d12 50%,   /* orange-900 */
      #be185d 75%,   /* pink-800 */
      #881337 100%   /* rose-900 */
    );
    min-height: 100vh;
    position: relative;
    overflow: hidden;
  }
  
  .glow-orb-1 {
    position: absolute;
    top: 10%;
    left: 10%;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(147, 51, 234, 0.15) 0%, transparent 70%);
    border-radius: 50%;
    filter: blur(60px);
  }
  
  .glow-orb-2 {
    position: absolute;
    bottom: 10%;
    right: 10%;
    width: 320px;
    height: 320px;
    background: radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, transparent 70%);
    border-radius: 50%;
    filter: blur(60px);
  }
  
  .glow-orb-3 {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 280px;
    height: 280px;
    background: radial-gradient(circle, rgba(79, 70, 229, 0.15) 0%, transparent 70%);
    border-radius: 50%;
    filter: blur(60px);
  }
  
  .floating-particle {
    position: absolute;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
  }
  
  .glass-panel {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }
  
  .glass-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
  }
  
  .glass-card:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: scale(1.05);
    box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.3);
  }
  
  .glow-button {
    position: relative;
    background: linear-gradient(135deg, #7c3aed, #ec4899);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
    overflow: hidden;
  }
  
  .glow-button::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #8b5cf6, #f472b6);
    border-radius: inherit;
    filter: blur(10px);
    opacity: 0.3;
    z-index: -1;
    transition: opacity 0.3s ease;
  }
  
  .glow-button:hover::before {
    opacity: 0.5;
  }
  
  .glow-button:hover {
    transform: scale(1.05);
    box-shadow: 0 0 30px rgba(147, 51, 234, 0.4);
  }
  
  .game-over-bg {
    background: linear-gradient(135deg, 
      #7f1d1d 0%,    /* red-900 */
      #ea580c 25%,   /* orange-600 */
      #d97706 50%,   /* amber-600 */
      #ca8a04 75%,   /* yellow-600 */
      #eab308 100%   /* yellow-500 */
    );
    min-height: 100vh;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }
  
  .game-bg {
    background: linear-gradient(135deg, 
      #111827 0%,    /* gray-900 */
      #1e293b 50%,   /* slate-800 */
      #1e40af 100%   /* blue-800 */
    );
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
  }
  
  .game-header {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    padding: 1rem;
  }
  
  .game-header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 96rem;
    margin: 0 auto;
  }
  
  .game-stats {
    display: flex;
    gap: 1.5rem;
    color: white;
  }
  
  .stat-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .stat-icon {
    font-size: 1.5rem;
  }
  
  .stat-value {
    font-weight: bold;
    font-size: 1.25rem;
  }
  
  .game-controls {
    display: flex;
    gap: 0.75rem;
  }
  
  .control-button {
    padding: 0.5rem 1.5rem;
    color: white;
    font-weight: bold;
    border-radius: 0.75rem;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 1rem;
  }
  
  .control-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn-wave {
    background: linear-gradient(135deg, #059669, #10b981);
  }
  
  .btn-wave:hover:not(:disabled) {
    background: linear-gradient(135deg, #047857, #059669);
  }
  
  .btn-pause {
    background: linear-gradient(135deg, #d97706, #f59e0b);
  }
  
  .btn-pause:hover {
    background: linear-gradient(135deg, #b45309, #d97706);
  }
  
  .btn-reset {
    background: linear-gradient(135deg, #dc2626, #ec4899);
  }
  
  .btn-reset:hover {
    background: linear-gradient(135deg, #b91c1c, #dc2626);
  }
  
  .tower-panel {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    padding: 1rem;
  }
  
  .tower-panel-content {
    max-width: 96rem;
    margin: 0 auto;
  }
  
  .tower-selection {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  
  .tower-label {
    color: white;
    font-weight: bold;
  }
  
  .tower-button {
    padding: 0.5rem 1rem;
    border-radius: 0.75rem;
    font-weight: bold;
    transition: all 0.2s ease;
    border: 1px solid rgba(255, 255, 255, 0.2);
    cursor: pointer;
  }
  
  .tower-button-active {
    background: white;
    color: black;
  }
  
  .tower-button-inactive {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }
  
  .tower-button-inactive:hover {
    background: rgba(255, 255, 255, 0.3);
  }
  
  .tower-description {
    margin-top: 0.5rem;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.875rem;
  }
  
  .game-area {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }
  
  .game-canvas {
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-radius: 1rem;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }
  
  .pause-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .pause-panel {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 1.5rem;
    padding: 3rem;
    text-align: center;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }
  
  .pause-title {
    font-size: 3rem;
    color: white;
    font-weight: bold;
    margin-bottom: 1rem;
  }
  
  .btn-continue {
    padding: 1rem 2rem;
    background: linear-gradient(135deg, #059669, #3b82f6);
    color: white;
    font-weight: bold;
    font-size: 1.25rem;
    border-radius: 1rem;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .btn-continue:hover {
    background: linear-gradient(135deg, #047857, #2563eb);
    transform: scale(1.05);
  }
`;

// Inyectar estilos
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

const GAME_WIDTH = 900;
const GAME_HEIGHT = 700;
const COLS = 18;
const ROWS = 14;
const CELL_SIZE = 50;

// Camino más complejo y largo
const PATH = [
  // Entrada desde la izquierda
  { x: 0, y: 7 }, { x: 1, y: 7 }, { x: 2, y: 7 }, { x: 3, y: 7 },
  // Primera curva hacia arriba
  { x: 3, y: 6 }, { x: 3, y: 5 }, { x: 3, y: 4 }, { x: 3, y: 3 },
  // Hacia la derecha por arriba
  { x: 4, y: 3 }, { x: 5, y: 3 }, { x: 6, y: 3 }, { x: 7, y: 3 }, { x: 8, y: 3 }, { x: 9, y: 3 },
  // Segunda curva hacia abajo
  { x: 9, y: 4 }, { x: 9, y: 5 }, { x: 9, y: 6 }, { x: 9, y: 7 }, { x: 9, y: 8 }, { x: 9, y: 9 },
  // Hacia la izquierda
  { x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }, { x: 5, y: 9 },
  // Tercera curva hacia arriba
  { x: 5, y: 8 }, { x: 5, y: 7 }, { x: 5, y: 6 },
  // Hacia la derecha otra vez
  { x: 6, y: 6 }, { x: 7, y: 6 }, { x: 8, y: 6 }, { x: 9, y: 6 }, { x: 10, y: 6 }, { x: 11, y: 6 },
  { x: 12, y: 6 }, { x: 13, y: 6 }, { x: 14, y: 6 },
  // Curva final hacia arriba
  { x: 14, y: 5 }, { x: 14, y: 4 }, { x: 14, y: 3 }, { x: 14, y: 2 },
  // Salida hacia la derecha
  { x: 15, y: 2 }, { x: 16, y: 2 }, { x: 17, y: 2 }
];

interface Enemy {
  id: number;
  pos: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  type: 'normal' | 'fast' | 'tank' | 'boss';
  speed: number;
  bounty: number;
  armor: number;
}

interface Tower {
  x: number;
  y: number;
  level: number;
  cooldown: number;
  type: 'cannon' | 'laser' | 'ice' | 'poison';
  range: number;
  damage: number;
  special: any;
}

interface Shot {
  x: number;
  y: number;
  tx: number;
  ty: number;
  damage: number;
  target: number;
  type: 'cannon' | 'laser' | 'ice' | 'poison';
  effects: any;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: number;
  size: number;
}

const ENEMY_TYPES = {
  normal: { hp: 1, speed: 0.02, bounty: 2, armor: 0, color: 0xFF4444 },
  fast: { hp: 1, speed: 0.04, bounty: 3, armor: 0, color: 0x44FF44 },
  tank: { hp: 3, speed: 0.015, bounty: 5, armor: 1, color: 0x4444FF },
  boss: { hp: 10, speed: 0.01, bounty: 15, armor: 2, color: 0xFF44FF }
};

const TOWER_TYPES = {
  cannon: { 
    cost: 20, 
    range: 3, 
    damage: 2, 
    cooldown: 60, 
    color: 0x8B4513,
    description: 'Torre básica con buen daño'
  },
  laser: { 
    cost: 35, 
    range: 4, 
    damage: 1, 
    cooldown: 20, 
    color: 0xFF0000,
    description: 'Disparo rápido, penetra armadura'
  },
  ice: { 
    cost: 30, 
    range: 2.5, 
    damage: 1, 
    cooldown: 40, 
    color: 0x00FFFF,
    description: 'Ralentiza enemigos'
  },
  poison: { 
    cost: 40, 
    range: 3.5, 
    damage: 1, 
    cooldown: 80, 
    color: 0x90EE90,
    description: 'Daño continuo en área'
  }
};

const TowerDefense: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'paused' | 'gameOver' | 'victory'>('start');
  const [gold, setGold] = useState(50);
  const [lives, setLives] = useState(20);
  const [wave, setWave] = useState(1);
  const [score, setScore] = useState(0);
  const [selectedTowerType, setSelectedTowerType] = useState<keyof typeof TOWER_TYPES>('cannon');
  const [placing, setPlacing] = useState(false);
  const [selectedTower, setSelectedTower] = useState<Tower | null>(null);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('towerdefense-highscore');
    return saved ? parseInt(saved) : 0;
  });

  const gameRef = useRef({
    enemies: [] as Enemy[],
    towers: [] as Tower[],
    shots: [] as Shot[],
    particles: [] as Particle[],
    pendingEnemies: [] as Enemy[],
    spawnTimer: 0,
    waveInProgress: false,
    enemyIdCounter: 0,
    currentGold: 50,
    currentLives: 20,
    currentWave: 1,
    currentScore: 0,
    damageTexts: [] as Array<{x: number, y: number, text: string, timer: number, color: number}>,
    effects: [] as Array<{x: number, y: number, type: string, timer: number, data: any}>,
    // Variables de UI
    placing: false,
    selectedTowerType: 'cannon' as keyof typeof TOWER_TYPES,
    selectedTower: null as Tower | null,
    // Variable para controlar pausa sin recrear PIXI
    isPaused: false,
  });

  // Ref para mantener la referencia a la app PIXI
  const pixiAppRef = useRef<PIXI.Application | null>(null);
  // Ref para mantener el ID de la animación
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Solo crear PIXI cuando se inicia el juego y no existe una instancia
    if (gameState === 'playing' && !pixiAppRef.current) {
      const app = new PIXI.Application({
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        backgroundColor: 0x1a1a2e,
      });

      if (containerRef.current && app.view instanceof Node) {
        containerRef.current.appendChild(app.view);
      }      // Guardar referencia a la app PIXI
      pixiAppRef.current = app;

      let staticDrawn = false;

    function drawStatic() {
      if (staticDrawn) return;
      
      // Fondo con gradiente
      const background = new PIXI.Graphics();
      background.beginFill(0x16213e);
      background.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      background.endFill();
      background.name = 'static';
      app.stage.addChild(background);

      // Grid sutil
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const g = new PIXI.Graphics();
          g.lineStyle(0.5, 0x333666, 0.3);
          g.beginFill(0x1a1a2e, 0.1);
          g.drawRect(0, 0, CELL_SIZE, CELL_SIZE);
          g.endFill();
          g.x = x * CELL_SIZE;
          g.y = y * CELL_SIZE;
          g.name = 'static';
          app.stage.addChild(g);
        }
      }

      // Camino con mejor diseño
      PATH.forEach((p, i) => {
        const g = new PIXI.Graphics();
        g.beginFill(0x8B7355);
        g.drawRoundedRect(2, 2, CELL_SIZE - 4, CELL_SIZE - 4, 8);
        g.endFill();
        
        // Líneas del camino
        g.beginFill(0xDEB887);
        g.drawRoundedRect(6, 20, CELL_SIZE - 12, 4, 2);
        g.drawRoundedRect(6, 26, CELL_SIZE - 12, 4, 2);
        g.endFill();
        
        g.x = p.x * CELL_SIZE;
        g.y = p.y * CELL_SIZE;
        g.name = 'static';
        app.stage.addChild(g);
      });

      // Marcadores de entrada y salida
      const start = PATH[0];
      const startMarker = new PIXI.Graphics();
      startMarker.beginFill(0x00FF00);
      startMarker.drawPolygon([
        start.x * CELL_SIZE + 5, start.y * CELL_SIZE + CELL_SIZE/2,
        start.x * CELL_SIZE + 15, start.y * CELL_SIZE + 10,
        start.x * CELL_SIZE + 15, start.y * CELL_SIZE + CELL_SIZE - 10
      ]);
      startMarker.endFill();
      startMarker.name = 'static';
      app.stage.addChild(startMarker);

      const end = PATH[PATH.length - 1];
      const endMarker = new PIXI.Graphics();
      endMarker.beginFill(0xFF0000);
      endMarker.drawPolygon([
        end.x * CELL_SIZE + CELL_SIZE - 5, end.y * CELL_SIZE + CELL_SIZE/2,
        end.x * CELL_SIZE + CELL_SIZE - 15, end.y * CELL_SIZE + 10,
        end.x * CELL_SIZE + CELL_SIZE - 15, end.y * CELL_SIZE + CELL_SIZE - 10
      ]);
      endMarker.endFill();
      endMarker.name = 'static';
      app.stage.addChild(endMarker);

      staticDrawn = true;
    }

    function clearDynamic() {
      for (let i = app.stage.children.length - 1; i >= 0; i--) {
        const c = app.stage.children[i];
        if (c.name !== 'static') {
          app.stage.removeChild(c);
        }
      }
    }

    function createExplosion(x: number, y: number, color: number = 0xFFAA00) {
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        gameRef.current.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * (2 + Math.random() * 3),
          vy: Math.sin(angle) * (2 + Math.random() * 3),
          life: 30,
          maxLife: 30,
          color: color,
          size: 3 + Math.random() * 2
        });
      }
    }

    function drawDynamic() {
      clearDynamic();

      // Partículas
      gameRef.current.particles.forEach(p => {
        const g = new PIXI.Graphics();
        const alpha = p.life / p.maxLife;
        g.beginFill(p.color, alpha);
        g.drawCircle(0, 0, p.size * alpha);
        g.endFill();
        g.x = p.x;
        g.y = p.y;
        g.name = 'particle';
        app.stage.addChild(g);
      });

      // Torres
      gameRef.current.towers.forEach(t => {
        const towerData = TOWER_TYPES[t.type];
        const g = new PIXI.Graphics();
        
        // Rango de torre (si está seleccionada)
        if (gameRef.current.selectedTower === t) {
          g.lineStyle(2, 0xFFFFFF, 0.3);
          g.beginFill(0xFFFFFF, 0.1);
          g.drawCircle(CELL_SIZE / 2, CELL_SIZE / 2, t.range * CELL_SIZE);
          g.endFill();
        }

        // Base de la torre
        g.beginFill(0x444444);
        g.drawCircle(CELL_SIZE / 2, CELL_SIZE / 2, CELL_SIZE / 2 - 2);
        g.endFill();

        // Torre principal
        const size = (CELL_SIZE / 2 - 6) * (1 + t.level * 0.1);
        g.beginFill(towerData.color);
        
        if (t.type === 'cannon') {
          g.drawCircle(CELL_SIZE / 2, CELL_SIZE / 2, size);
        } else if (t.type === 'laser') {
          g.drawPolygon([
            CELL_SIZE/2, CELL_SIZE/2 - size,
            CELL_SIZE/2 + size, CELL_SIZE/2 + size,
            CELL_SIZE/2, CELL_SIZE/2 + size/2,
            CELL_SIZE/2 - size, CELL_SIZE/2 + size
          ]);
        } else if (t.type === 'ice') {
          for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const px = CELL_SIZE/2 + Math.cos(angle) * size * 0.8;
            const py = CELL_SIZE/2 + Math.sin(angle) * size * 0.8;
            g.drawPolygon([
              px, py,
              px + Math.cos(angle + 0.5) * size * 0.3,
              py + Math.sin(angle + 0.5) * size * 0.3,
              px + Math.cos(angle - 0.5) * size * 0.3,
              py + Math.sin(angle - 0.5) * size * 0.3
            ]);
          }
        } else if (t.type === 'poison') {
          g.drawRoundedRect(CELL_SIZE/2 - size, CELL_SIZE/2 - size, size * 2, size * 2, size * 0.3);
        }
        
        g.endFill();

        // Efectos especiales
        if (t.cooldown > 0) {
          g.lineStyle(3, 0xFFFF00, 0.8);
          g.drawCircle(CELL_SIZE / 2, CELL_SIZE / 2, size + 3);
        }

        g.x = t.x * CELL_SIZE;
        g.y = t.y * CELL_SIZE;
        g.name = 'tower';
        app.stage.addChild(g);

        // Nivel de la torre
        const levelText = new PIXI.Text(t.level.toString(), {
          fontSize: 12,
          fill: 0xFFFFFF,
          fontWeight: 'bold',
          stroke: 0x000000,
          strokeThickness: 2
        });
        levelText.anchor.set(0.5);
        levelText.x = t.x * CELL_SIZE + CELL_SIZE / 2;
        levelText.y = t.y * CELL_SIZE + CELL_SIZE / 2;
        levelText.name = 'tower-level';
        app.stage.addChild(levelText);
      });

      // Enemigos
      gameRef.current.enemies.forEach(e => {
        if (!e.alive) return;
        const p = PATH[Math.floor(e.pos)];
        if (!p) return;

        const enemyData = ENEMY_TYPES[e.type];
        const g = new PIXI.Graphics();

        // Sombra
        g.beginFill(0x000000, 0.3);
        g.drawCircle(CELL_SIZE / 2 + 2, CELL_SIZE / 2 + 2, CELL_SIZE / 2 - 8);
        g.endFill();

        // Cuerpo del enemigo
        g.beginFill(enemyData.color);
        if (e.type === 'normal') {
          g.drawCircle(CELL_SIZE / 2, CELL_SIZE / 2, CELL_SIZE / 2 - 8);
        } else if (e.type === 'fast') {
          g.drawPolygon([
            CELL_SIZE/2, CELL_SIZE/2 - 15,
            CELL_SIZE/2 + 10, CELL_SIZE/2 + 10,
            CELL_SIZE/2 - 10, CELL_SIZE/2 + 10
          ]);
        } else if (e.type === 'tank') {
          g.drawRoundedRect(CELL_SIZE/2 - 12, CELL_SIZE/2 - 12, 24, 24, 4);
        } else if (e.type === 'boss') {
          g.drawPolygon([
            CELL_SIZE/2, CELL_SIZE/2 - 18,
            CELL_SIZE/2 + 15, CELL_SIZE/2 - 5,
            CELL_SIZE/2 + 10, CELL_SIZE/2 + 15,
            CELL_SIZE/2 - 10, CELL_SIZE/2 + 15,
            CELL_SIZE/2 - 15, CELL_SIZE/2 - 5
          ]);
        }
        g.endFill();

        // Armadura
        if (e.armor > 0) {
          g.lineStyle(2, 0xC0C0C0);
          g.drawCircle(CELL_SIZE / 2, CELL_SIZE / 2, CELL_SIZE / 2 - 6);
        }

        g.x = p.x * CELL_SIZE;
        g.y = p.y * CELL_SIZE;
        g.name = 'enemy';
        app.stage.addChild(g);

        // Barra de vida
        const hpBar = new PIXI.Graphics();
        hpBar.beginFill(0xFF0000);
        hpBar.drawRect(0, 0, CELL_SIZE - 8, 6);
        hpBar.endFill();
        hpBar.beginFill(0x00FF00);
        const hpWidth = Math.max(0, (CELL_SIZE - 8) * (e.hp / e.maxHp));
        hpBar.drawRect(0, 0, hpWidth, 6);
        hpBar.endFill();
        hpBar.x = p.x * CELL_SIZE + 4;
        hpBar.y = p.y * CELL_SIZE - 8;
        hpBar.name = 'hp';
        app.stage.addChild(hpBar);
      });

      // Disparos
      gameRef.current.shots.forEach(s => {
        const g = new PIXI.Graphics();
        
        if (s.type === 'cannon') {
          g.beginFill(0xFFAA00);
          g.drawCircle(0, 0, 4);
        } else if (s.type === 'laser') {
          g.lineStyle(3, 0xFF0000, 0.8);
          g.moveTo(-5, 0);
          g.lineTo(5, 0);
        } else if (s.type === 'ice') {
          g.beginFill(0x00FFFF);
          g.drawPolygon([-3, -3, 3, -3, 0, 3]);
        } else if (s.type === 'poison') {
          g.beginFill(0x90EE90);
          g.drawCircle(0, 0, 3);
        }
        
        g.endFill();
        g.x = s.x;
        g.y = s.y;
        g.name = 'shot';
        app.stage.addChild(g);
      });

      // Textos de daño flotantes
      gameRef.current.damageTexts.forEach(dt => {
        const text = new PIXI.Text(dt.text, {
          fontSize: 14,
          fill: dt.color,
          fontWeight: 'bold',
          stroke: 0x000000,
          strokeThickness: 2
        });
        text.anchor.set(0.5);
        text.x = dt.x;
        text.y = dt.y - (30 - dt.timer) * 1.5;
        text.alpha = Math.min(1, dt.timer / 10);
        text.name = 'damage-text';
        app.stage.addChild(text);
      });

      // UI del juego
      const uiContainer = new PIXI.Container();
      
      // Panel de información
      const uiPanel = new PIXI.Graphics();
      uiPanel.beginFill(0x000000, 0.7);
      uiPanel.drawRoundedRect(10, 10, 300, 120, 10);
      uiPanel.endFill();
      uiContainer.addChild(uiPanel);

      const goldText = new PIXI.Text(`💰 Oro: ${gameRef.current.currentGold}`, {
        fontSize: 18,
        fill: 0xFFD700,
        fontWeight: 'bold'
      });
      goldText.x = 20;
      goldText.y = 20;
      uiContainer.addChild(goldText);

      const livesText = new PIXI.Text(`❤️ Vidas: ${gameRef.current.currentLives}`, {
        fontSize: 18,
        fill: 0xFF4444,
        fontWeight: 'bold'
      });
      livesText.x = 160;
      livesText.y = 20;
      uiContainer.addChild(livesText);

      const waveText = new PIXI.Text(`🌊 Oleada: ${gameRef.current.currentWave}`, {
        fontSize: 18,
        fill: 0x44AAFF,
        fontWeight: 'bold'
      });
      waveText.x = 20;
      waveText.y = 45;
      uiContainer.addChild(waveText);

      const scoreText = new PIXI.Text(`⭐ Puntos: ${gameRef.current.currentScore}`, {
        fontSize: 18,
        fill: 0xFFFFFF,
        fontWeight: 'bold'
      });
      scoreText.x = 160;
      scoreText.y = 45;
      uiContainer.addChild(scoreText);

      const enemiesLeft = gameRef.current.enemies.filter(e => e.alive).length + gameRef.current.pendingEnemies.length;
      const enemiesText = new PIXI.Text(`👾 Enemigos: ${enemiesLeft}`, {
        fontSize: 16,
        fill: 0xFFAAAA,
        fontWeight: 'bold'
      });
      enemiesText.x = 20;
      enemiesText.y = 70;
      uiContainer.addChild(enemiesText);

      // Información de torre seleccionada
      if (gameRef.current.selectedTower) {
        const towerInfo = new PIXI.Text(
          `Torre ${gameRef.current.selectedTower.type.toUpperCase()} Nv.${gameRef.current.selectedTower.level}\nDaño: ${gameRef.current.selectedTower.damage} | Rango: ${gameRef.current.selectedTower.range.toFixed(1)}\nClick para mejorar: ${Math.pow(2, gameRef.current.selectedTower.level) * TOWER_TYPES[gameRef.current.selectedTower.type].cost}💰`,
          {
            fontSize: 14,
            fill: 0xFFFFFF,
            fontWeight: 'bold'
          }
        );
        towerInfo.x = 20;
        towerInfo.y = 95;
        uiContainer.addChild(towerInfo);
      }

      uiContainer.name = 'ui';
      app.stage.addChild(uiContainer);
    }

    drawStatic();
    drawDynamic();
    
    function gameLoop() {
      // Solo ejecutar lógica del juego si no está pausado
      if (!gameRef.current.isPaused) {
        // Spawn enemigos
        if (gameRef.current.pendingEnemies.length > 0) {
          gameRef.current.spawnTimer--;
          if (gameRef.current.spawnTimer <= 0) {
            const next = gameRef.current.pendingEnemies.shift();
            if (next) gameRef.current.enemies.push(next);
            gameRef.current.spawnTimer = 30;
          }
        }

      // Mover enemigos
      gameRef.current.enemies.forEach(e => {
        if (!e.alive) return;
        
        let newPos = e.pos + e.speed;
        if (newPos >= PATH.length) {
          e.alive = false;
          gameRef.current.currentLives--;
          setLives(gameRef.current.currentLives);
          
          gameRef.current.damageTexts.push({
            x: GAME_WIDTH / 2,
            y: 200,
            text: `-1 ❤️`,
            timer: 60,
            color: 0xFF0000
          });
          
          if (gameRef.current.currentLives <= 0) {
            setGameState('gameOver');
          }
          return;
        }
        e.pos = newPos;
      });

      // Torres atacan
      gameRef.current.towers.forEach(t => {
        t.cooldown = Math.max(0, t.cooldown - 1);
        if (t.cooldown === 0) {
          const target = gameRef.current.enemies.find(e => {
            if (!e.alive) return false;
            const p = PATH[Math.floor(e.pos)];
            const dx = t.x - p.x;
            const dy = t.y - p.y;
            return Math.sqrt(dx * dx + dy * dy) <= t.range;
          });

          if (target) {
            const p = PATH[Math.floor(target.pos)];
            const tx = p.x * CELL_SIZE + CELL_SIZE / 2;
            const ty = p.y * CELL_SIZE + CELL_SIZE / 2;
            
            gameRef.current.shots.push({
              x: t.x * CELL_SIZE + CELL_SIZE / 2,
              y: t.y * CELL_SIZE + CELL_SIZE / 2,
              tx, ty,
              damage: t.damage,
              target: target.id,
              type: t.type,
              effects: {}
            });

            const towerData = TOWER_TYPES[t.type];
            t.cooldown = towerData.cooldown / (1 + t.level * 0.2);
          }
        }
      });

      // Mover disparos
      gameRef.current.shots = gameRef.current.shots.filter(s => {
        const dx = s.tx - s.x;
        const dy = s.ty - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 8) {
          // Impacto
          const target = gameRef.current.enemies.find(e => e.id === s.target && e.alive);
          if (target) {
            let finalDamage = Math.max(1, s.damage - target.armor);
            target.hp -= finalDamage;
            
            // Efectos especiales
            if (s.type === 'ice') {
              target.speed *= 0.5;
              setTimeout(() => { if (target.alive) target.speed = ENEMY_TYPES[target.type].speed; }, 2000);
            } else if (s.type === 'poison') {
              // Daño continuo
              let poisonTicks = 5;
              const poisonInterval = setInterval(() => {
                if (target.alive && poisonTicks > 0) {
                  target.hp -= 1;
                  poisonTicks--;
                } else {
                  clearInterval(poisonInterval);
                }
              }, 500);
            }

            createExplosion(s.tx, s.ty, TOWER_TYPES[s.type].color);
            
            gameRef.current.damageTexts.push({
              x: s.tx,
              y: s.ty,
              text: `-${finalDamage}`,
              timer: 30,
              color: 0xFFFF00
            });

            if (target.hp <= 0) {
              target.alive = false;
              gameRef.current.currentGold += target.bounty;
              gameRef.current.currentScore += target.bounty * 10;
              setGold(gameRef.current.currentGold);
              setScore(gameRef.current.currentScore);
              
              createExplosion(s.tx, s.ty, 0xFF0000);
              
              gameRef.current.damageTexts.push({
                x: s.tx,
                y: s.ty - 20,
                text: `+${target.bounty}💰`,
                timer: 40,
                color: 0x00FF00
              });
            }
          }
          return false;
        }

        const speed = 8;
        s.x += (dx / dist) * speed;
        s.y += (dy / dist) * speed;
        return true;
      });

      // Actualizar partículas
      gameRef.current.particles = gameRef.current.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.vx *= 0.98;
        p.vy *= 0.98;
        return p.life > 0;
      });

      // Actualizar textos de daño
      gameRef.current.damageTexts = gameRef.current.damageTexts.filter(dt => {
        dt.timer--;
        return dt.timer > 0;
      });

      // Verificar final de oleada
      if (gameRef.current.waveInProgress && 
          gameRef.current.pendingEnemies.length === 0 && 
          gameRef.current.enemies.every(e => !e.alive)) {
        gameRef.current.waveInProgress = false;
        
        // Bonus por completar oleada
        const bonus = gameRef.current.currentWave * 10;
        gameRef.current.currentGold += bonus;
        gameRef.current.currentScore += bonus * 5;
        setGold(gameRef.current.currentGold);
        setScore(gameRef.current.currentScore);
        
        gameRef.current.damageTexts.push({
          x: GAME_WIDTH / 2,
          y: 150,
          text: `¡Oleada ${gameRef.current.currentWave} completada! +${bonus}💰`,
          timer: 120,
          color: 0x00FF00
        });
      }

      } // Fin del bloque de lógica pausada

      drawDynamic();
      animationIdRef.current = requestAnimationFrame(gameLoop);
    }

    animationIdRef.current = requestAnimationFrame(gameLoop);

    function handleClick(e: PointerEvent) {
      if (!(app.view instanceof HTMLCanvasElement)) return;
      const rect = app.view.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const gridX = Math.floor(mouseX / CELL_SIZE);
      const gridY = Math.floor(mouseY / CELL_SIZE);

      if (gameRef.current.placing) {
        // Colocar torre
        const isPath = PATH.some(p => p.x === gridX && p.y === gridY);
        const hasTower = gameRef.current.towers.some(t => t.x === gridX && t.y === gridY);
        const cost = TOWER_TYPES[gameRef.current.selectedTowerType].cost;
        
        if (isPath) {
          gameRef.current.damageTexts.push({
            x: mouseX, y: mouseY,
            text: '¡No se puede construir en el camino!',
            timer: 60, color: 0xFF0000
          });
          return;
        }
        
        if (hasTower) {
          gameRef.current.damageTexts.push({
            x: mouseX, y: mouseY,
            text: '¡Ya hay una torre aquí!',
            timer: 60, color: 0xFF0000
          });
          return;
        }
        
        if (gameRef.current.currentGold < cost) {
          gameRef.current.damageTexts.push({
            x: mouseX, y: mouseY,
            text: '¡No tienes suficiente oro!',
            timer: 60, color: 0xFF0000
          });
          return;
        }

        const towerData = TOWER_TYPES[gameRef.current.selectedTowerType];
        gameRef.current.towers.push({
          x: gridX,
          y: gridY,
          level: 1,
          cooldown: 0,
          type: gameRef.current.selectedTowerType,
          range: towerData.range,
          damage: towerData.damage,
          special: {}
        });
        
        gameRef.current.currentGold -= cost;
        setGold(gameRef.current.currentGold);
        setPlacing(false);
        
      } else {
        // Seleccionar/mejorar torre
        const tower = gameRef.current.towers.find(t => t.x === gridX && t.y === gridY);
        if (tower) {
          if (gameRef.current.selectedTower === tower) {
            // Mejorar torre
            const upgradeCost = Math.pow(2, tower.level) * TOWER_TYPES[tower.type].cost;
            if (gameRef.current.currentGold >= upgradeCost) {
              tower.level++;
              tower.damage = Math.floor(tower.damage * 1.5);
              tower.range += 0.2;
              gameRef.current.currentGold -= upgradeCost;
              setGold(gameRef.current.currentGold);
              
              gameRef.current.damageTexts.push({
                x: tower.x * CELL_SIZE + CELL_SIZE/2,
                y: tower.y * CELL_SIZE,
                text: `¡Mejorada! Nv.${tower.level}`,
                timer: 60,
                color: 0x00FF00
              });
            } else {
              gameRef.current.damageTexts.push({
                x: mouseX, y: mouseY,
                text: `Necesitas ${upgradeCost}💰`,
                timer: 60, color: 0xFF0000
              });
            }
          } else {
            setSelectedTower(tower);
          }
        } else {
          setSelectedTower(null);
        }
      }
    }

    if (app.view instanceof HTMLCanvasElement) {
      app.view.addEventListener('click', handleClick as EventListener);
    }

    return () => {
      // Solo limpiar si estamos saliendo del juego realmente, no en pausa/reanudación
      if (gameState !== 'playing' && gameState !== 'paused') {
        if (app && app.view instanceof HTMLCanvasElement) {
          app.view.removeEventListener('click', handleClick as EventListener);
        }
        if (animationIdRef.current) {
          cancelAnimationFrame(animationIdRef.current);
          animationIdRef.current = null;
        }
      }
    };
    }
  }, [gameState]); // Dependencia de gameState pero con protección contra recreación

  // useEffect separado para manejar el cursor sin reiniciar PIXI
  useEffect(() => {
    if (containerRef.current) {
      const canvas = containerRef.current.querySelector('canvas');
      if (canvas) {
        canvas.style.cursor = placing ? 'crosshair' : 'default';
      }
    }
  }, [placing]);

  // Sincronizar variables de UI con gameRef
  useEffect(() => {
    gameRef.current.placing = placing;
    gameRef.current.selectedTowerType = selectedTowerType;
    gameRef.current.selectedTower = selectedTower;
  }, [placing, selectedTowerType, selectedTower]);

  // Manejar pausa sin recrear PIXI
  useEffect(() => {
    const wasPlaying = !gameRef.current.isPaused;
    gameRef.current.isPaused = gameState === 'paused';
    
    // Si se reanuda el juego (era pausado y ahora es playing) y no hay gameLoop activo
    if (gameState === 'playing' && pixiAppRef.current && !animationIdRef.current) {
      console.log('Reiniciando gameLoop después de pausa');
      const app = pixiAppRef.current;
      
      function gameLoop() {
        // Solo ejecutar lógica del juego si no está pausado
        if (!gameRef.current.isPaused) {
          // Lógica del juego...
          // Por ahora solo un placeholder, la lógica completa está en el useEffect principal
        }
        
        // Siempre continuar el loop
        animationIdRef.current = requestAnimationFrame(gameLoop);
      }
      
      animationIdRef.current = requestAnimationFrame(gameLoop);
    }
    
    // Limpiar PIXI cuando salimos del juego
    if (gameState !== 'playing' && gameState !== 'paused' && pixiAppRef.current) {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      pixiAppRef.current.destroy();
      pixiAppRef.current = null;
      
      // Limpiar cualquier canvas restante del contenedor
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    }
  }, [gameState]);

  // Limpiar PIXI cuando el juego termina realmente
  useEffect(() => {
    return () => {
      if (pixiAppRef.current) {
        pixiAppRef.current.destroy();
        pixiAppRef.current = null;
      }
      
      // Limpiar cualquier canvas restante del contenedor
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  const startWave = () => {
    const waveSize = Math.floor(gameRef.current.currentWave * 1.5) + 3;
    const newEnemies: Enemy[] = [];
    
    for (let i = 0; i < waveSize; i++) {
      let type: keyof typeof ENEMY_TYPES = 'normal';
      
      if (gameRef.current.currentWave >= 3 && Math.random() < 0.3) type = 'fast';
      if (gameRef.current.currentWave >= 5 && Math.random() < 0.2) type = 'tank';
      if (gameRef.current.currentWave >= 7 && Math.random() < 0.1) type = 'boss';
      
      const enemyData = ENEMY_TYPES[type];
      const hp = enemyData.hp + Math.floor(gameRef.current.currentWave / 2);
      
      newEnemies.push({
        id: gameRef.current.enemyIdCounter++,
        pos: 0,
        hp: hp,
        maxHp: hp,
        alive: true,
        type: type,
        speed: enemyData.speed,
        bounty: enemyData.bounty + Math.floor(gameRef.current.currentWave / 3),
        armor: enemyData.armor
      });
    }
    
    gameRef.current.pendingEnemies = newEnemies;
    gameRef.current.spawnTimer = 0;
    gameRef.current.waveInProgress = true;
    gameRef.current.currentWave++;
    setWave(gameRef.current.currentWave);
  };

  const startGame = () => {
    gameRef.current.currentGold = 50;
    gameRef.current.currentLives = 20;
    gameRef.current.currentWave = 1;
    gameRef.current.currentScore = 0;
    gameRef.current.enemies = [];
    gameRef.current.towers = [];
    gameRef.current.shots = [];
    gameRef.current.particles = [];
    gameRef.current.pendingEnemies = [];
    gameRef.current.waveInProgress = false;
    
    setGold(50);
    setLives(20);
    setWave(1);
    setScore(0);
    setSelectedTower(null);
    setPlacing(false);
    setGameState('playing');
  };

  const pauseGame = () => {
    setGameState(gameState === 'paused' ? 'playing' : 'paused');
  };

  const resetGame = () => {
    if (gameRef.current.currentScore > highScore) {
      setHighScore(gameRef.current.currentScore);
      localStorage.setItem('towerdefense-highscore', gameRef.current.currentScore.toString());
    }
    setGameState('start');
  };

  if (gameState === 'start') {
    return (
      <div className="tower-defense-bg scrollable-hidden" style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        justifyContent: 'center', 
        padding: '2rem',
        minHeight: '100vh',
        overflow: 'auto'
      }}>
        {/* Efectos de fondo con CSS personalizado */}
        <div className="glow-orb-1 animate-pulse-glow"></div>
        <div className="glow-orb-2 animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
        <div className="glow-orb-3 animate-pulse-glow" style={{ animationDelay: '2s' }}></div>
        
        {/* Partículas flotantes */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <div className="floating-particle animate-ping-float" style={{ 
            top: '25%', left: '25%', width: '8px', height: '8px', animationDelay: '0s' 
          }}></div>
          <div className="floating-particle animate-ping-float" style={{ 
            top: '75%', left: '33%', width: '4px', height: '4px', animationDelay: '1s' 
          }}></div>
          <div className="floating-particle animate-ping-float" style={{ 
            top: '50%', right: '25%', width: '12px', height: '12px', animationDelay: '2s' 
          }}></div>
          <div className="floating-particle animate-ping-float" style={{ 
            top: '33%', right: '33%', width: '4px', height: '4px', animationDelay: '3s' 
          }}></div>
          <div className="floating-particle animate-ping-float" style={{ 
            bottom: '25%', left: '50%', width: '8px', height: '8px', animationDelay: '4s' 
          }}></div>
        </div>
        
        <div className="glass-panel animate-fade-in scrollable-hidden" style={{ 
          borderRadius: '1.5rem', 
          padding: '2rem', 
          maxWidth: '32rem', 
          width: '100%',
          position: 'relative',
          zIndex: 10,
          margin: '2rem 0',
          maxHeight: 'calc(100vh - 4rem)',
          overflow: 'auto'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h1 className="animate-bounce-slow" style={{ 
              fontSize: '3rem', 
              fontWeight: 'bold', 
              color: 'white', 
              marginBottom: '0.75rem',
              textShadow: '0 10px 20px rgba(0,0,0,0.5)'
            }}>
              🏰 Tower Defense
            </h1>
            <p style={{ 
              fontSize: '1.125rem', 
              color: 'rgba(255, 255, 255, 0.8)', 
              fontWeight: '500' 
            }}>
              Defiende tu reino con torres estratégicas
            </p>
            <div style={{ 
              marginTop: '1rem', 
              display: 'flex', 
              justifyContent: 'center' 
            }}>
              <div style={{ 
                width: '6rem', 
                height: '4px', 
                background: 'linear-gradient(to right, #a855f7, #ec4899)', 
                borderRadius: '9999px' 
              }}></div>
            </div>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
            gap: '1rem', 
            marginBottom: '1.5rem' 
          }}>
            <div className="glass-card" style={{ borderRadius: '1rem', padding: '1.25rem' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>🎯</div>
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: 'bold', 
                color: 'white', 
                marginBottom: '0.5rem' 
              }}>
                Torres Especiales
              </h3>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.7)', 
                fontSize: '0.875rem' 
              }}>
                4 tipos únicos: Cañón, Láser, Hielo y Veneno con habilidades especiales
              </p>
            </div>

            <div className="glass-card" style={{ borderRadius: '1rem', padding: '1.25rem' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>👾</div>
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: 'bold', 
                color: 'white', 
                marginBottom: '0.5rem' 
              }}>
                Enemigos Variados
              </h3>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.7)', 
                fontSize: '0.875rem' 
              }}>
                Normales, rápidos, tanques y jefes con diferentes características
              </p>
            </div>

            <div className="glass-card" style={{ borderRadius: '1rem', padding: '1.25rem' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>⚡</div>
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: 'bold', 
                color: 'white', 
                marginBottom: '0.5rem' 
              }}>
                Efectos Visuales
              </h3>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.7)', 
                fontSize: '0.875rem' 
              }}>
                Explosiones, partículas y efectos especiales espectaculares
              </p>
            </div>

            <div className="glass-card" style={{ borderRadius: '1rem', padding: '1.25rem' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>🏆</div>
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: 'bold', 
                color: 'white', 
                marginBottom: '0.5rem' 
              }}>
                Estrategia Profunda
              </h3>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.7)', 
                fontSize: '0.875rem' 
              }}>
                Mejora torres, gestiona recursos y planifica tu defensa
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '1rem' }}>
              <button
                onClick={startGame}
                className="glow-button"
                style={{ 
                  padding: '1rem 2rem', 
                  color: 'white', 
                  fontWeight: 'bold', 
                  fontSize: '1.25rem', 
                  borderRadius: '1rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  margin: '0 auto'
                }}
              >
                <span>🚀</span>
                <span>Comenzar Defensa</span>
              </button>
            </div>
            
            <div style={{ 
              color: 'rgba(255, 255, 255, 0.6)', 
              fontSize: '1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              borderRadius: '0.75rem',
              padding: '0.75rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              marginBottom: '1rem'
            }}>
              Record: <span style={{ 
                color: '#fbbf24', 
                fontWeight: 'bold', 
                fontSize: '1.25rem' 
              }}>
                {highScore.toLocaleString()}
              </span> puntos
              {highScore > 0 && <span style={{ marginLeft: '0.5rem' }}>🏆</span>}
            </div>

            <div className="glass-panel" style={{ 
              borderRadius: '0.75rem', 
              padding: '1.25rem'
            }}>
              <h4 style={{ 
                color: 'white', 
                fontWeight: 'bold', 
                marginBottom: '0.75rem', 
                fontSize: '1.125rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                <span>🎮</span>
                <span>Controles</span>
              </h4>
              <div style={{ 
                color: 'rgba(255, 255, 255, 0.7)', 
                fontSize: '0.875rem'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  padding: '0.5rem', 
                  borderRadius: '0.5rem', 
                  background: 'rgba(255, 255, 255, 0.05)',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{ fontSize: '1.125rem' }}>🖱️</span>
                  <span>Click en espacios vacíos para construir torres</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  padding: '0.5rem', 
                  borderRadius: '0.5rem', 
                  background: 'rgba(255, 255, 255, 0.05)',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{ fontSize: '1.125rem' }}>🎯</span>
                  <span>Click en torres para seleccionar y mejorar</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  padding: '0.5rem', 
                  borderRadius: '0.5rem', 
                  background: 'rgba(255, 255, 255, 0.05)'
                }}>
                  <span style={{ fontSize: '1.125rem' }}>💰</span>
                  <span>Gestiona oro y vidas estratégicamente</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'gameOver') {
    return (
      <div className="game-over-bg">
        <div className="glass-panel" style={{ 
          borderRadius: '1.5rem', 
          padding: '3rem', 
          maxWidth: '28rem', 
          width: '100%',
          textAlign: 'center' 
        }}>
          <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>💥</div>
          <h2 style={{ 
            fontSize: '3rem', 
            fontWeight: 'bold', 
            color: 'white', 
            marginBottom: '1rem' 
          }}>
            ¡Derrota!
          </h2>
          <p style={{ 
            fontSize: '1.5rem', 
            color: 'rgba(255, 255, 255, 0.8)', 
            marginBottom: '0.5rem' 
          }}>
            Tu reino ha caído
          </p>
          <p style={{ 
            fontSize: '2.5rem', 
            fontWeight: 'bold', 
            color: '#fbbf24', 
            marginBottom: '1.5rem' 
          }}>
            {score.toLocaleString()} puntos
          </p>
          
          {score > highScore && (
            <div style={{ 
              color: '#4ade80', 
              fontSize: '1.25rem', 
              marginBottom: '1rem', 
              fontWeight: 'bold' 
            }}>
              🎉 ¡Nuevo Record!
            </div>
          )}
          
          <button
            onClick={resetGame}
            className="glow-button"
            style={{ 
              padding: '1rem 2rem', 
              color: 'white', 
              fontWeight: 'bold', 
              fontSize: '1.25rem', 
              borderRadius: '1rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              margin: '0 auto'
            }}
          >
            <span>🔄</span>
            <span>Intentar de Nuevo</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-bg">
      {/* Header mejorado */}
      <div className="game-header">
        <div className="game-header-content">
          <div className="game-stats">
            <div className="stat-item">
              <span className="stat-icon">💰</span>
              <span className="stat-value">{gold}</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">❤️</span>
              <span className="stat-value">{lives}</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🌊</span>
              <span className="stat-value">{wave}</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">⭐</span>
              <span className="stat-value">{score.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="game-controls">
            <button
              onClick={startWave}
              disabled={gameRef.current.waveInProgress}
              className="control-button btn-wave"
            >
              🌊 Siguiente Oleada
            </button>
            
            <button
              onClick={pauseGame}
              className="control-button btn-pause"
            >
              {gameState === 'paused' ? '▶️ Continuar' : '⏸️ Pausar'}
            </button>
            
            <button
              onClick={resetGame}
              className="control-button btn-reset"
            >
              🔄 Reiniciar
            </button>
          </div>
        </div>
      </div>

      {/* Panel de selección de torres */}
      <div className="tower-panel">
        <div className="tower-panel-content">
          <div className="tower-selection">
            <span className="tower-label">Seleccionar Torre:</span>
            {Object.entries(TOWER_TYPES).map(([type, data]) => (
              <button
                key={type}
                onClick={() => {
                  setSelectedTowerType(type as keyof typeof TOWER_TYPES);
                  setPlacing(true);
                }}
                className={`tower-button ${
                  selectedTowerType === type && placing
                    ? 'tower-button-active'
                    : 'tower-button-inactive'
                }`}
                style={{ borderColor: `#${data.color.toString(16).padStart(6, '0')}` }}
              >
                {type.toUpperCase()} ({data.cost}💰)
              </button>
            ))}
            {placing && (
              <button
                onClick={() => setPlacing(false)}
                className="control-button btn-reset"
              >
                ❌ Cancelar
              </button>
            )}
          </div>
          
          {selectedTowerType && (
            <div className="tower-description">
              {TOWER_TYPES[selectedTowerType].description}
            </div>
          )}
        </div>
      </div>

      {/* Área del juego */}
      <div className="game-area" style={{ position: 'relative' }}>
        <div 
          ref={containerRef} 
          className="game-canvas"
        />
        
        {/* Pausa overlay - dentro del área del juego */}
        {gameState === 'paused' && (
          <div className="pause-overlay">
            <div className="pause-panel">
              <h2 className="pause-title">⏸️ Pausado</h2>
              <button
                onClick={pauseGame}
                className="btn-continue"
              >
                ▶️ Continuar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TowerDefense;