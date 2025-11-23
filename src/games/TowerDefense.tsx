import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import GameStartScreen from '../components/GameStartScreen';
import GameOverScreen from '../components/GameOverScreen';

const GAME_WIDTH = 900;
const GAME_HEIGHT = 700;
const CELL_SIZE = 50;
const COLS = 18;
const ROWS = 14;

// Path definition
const PATH = [
    { x: 0, y: 7 }, { x: 1, y: 7 }, { x: 2, y: 7 }, { x: 3, y: 7 },
    { x: 3, y: 6 }, { x: 3, y: 5 }, { x: 3, y: 4 }, { x: 3, y: 3 },
    { x: 4, y: 3 }, { x: 5, y: 3 }, { x: 6, y: 3 }, { x: 7, y: 3 }, { x: 8, y: 3 }, { x: 9, y: 3 },
    { x: 9, y: 4 }, { x: 9, y: 5 }, { x: 9, y: 6 }, { x: 9, y: 7 }, { x: 9, y: 8 }, { x: 9, y: 9 },
    { x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }, { x: 5, y: 9 },
    { x: 5, y: 8 }, { x: 5, y: 7 }, { x: 5, y: 6 },
    { x: 6, y: 6 }, { x: 7, y: 6 }, { x: 8, y: 6 }, { x: 9, y: 6 }, { x: 10, y: 6 }, { x: 11, y: 6 },
    { x: 12, y: 6 }, { x: 13, y: 6 }, { x: 14, y: 6 },
    { x: 14, y: 5 }, { x: 14, y: 4 }, { x: 14, y: 3 }, { x: 14, y: 2 },
    { x: 15, y: 2 }, { x: 16, y: 2 }, { x: 17, y: 2 }
];

const TOWER_TYPES = {
    cannon: { cost: 20, range: 150, damage: 20, cooldown: 1000, color: 0x8B4513, name: 'Cañón' },
    laser: { cost: 35, range: 200, damage: 10, cooldown: 300, color: 0xFF0000, name: 'Láser' },
    ice: { cost: 30, range: 125, damage: 5, cooldown: 800, color: 0x00FFFF, name: 'Hielo' },
    poison: { cost: 40, range: 175, damage: 5, cooldown: 1500, color: 0x90EE90, name: 'Veneno' }
};

const ENEMY_TYPES = {
    normal: { hp: 50, speed: 100, bounty: 2, color: 0xFF4444 },
    fast: { hp: 30, speed: 150, bounty: 3, color: 0x44FF44 },
    tank: { hp: 150, speed: 60, bounty: 5, color: 0x4444FF },
    boss: { hp: 500, speed: 40, bounty: 15, color: 0xFF44FF }
};

class Enemy extends Phaser.GameObjects.Container {
    public hp: number;
    public maxHp: number;
    public speed: number;
    public bounty: number;
    public pathIndex: number = 0;
    public frozen: boolean = false;
    public poisoned: boolean = false;
    private pathTarget: { x: number, y: number };
    private hpBar: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene, type: keyof typeof ENEMY_TYPES, waveMultiplier: number) {
        super(scene, PATH[0].x * CELL_SIZE + CELL_SIZE/2, PATH[0].y * CELL_SIZE + CELL_SIZE/2);
        
        const data = ENEMY_TYPES[type];
        this.hp = data.hp * waveMultiplier;
        this.maxHp = this.hp;
        this.speed = data.speed;
        this.bounty = data.bounty;
        this.pathTarget = PATH[1];

        // Visuals
        const circle = scene.add.circle(0, 0, 15, data.color);
        this.add(circle);
        
        this.hpBar = scene.add.graphics();
        this.add(this.hpBar);
        this.updateHpBar();

        scene.add.existing(this);
        scene.physics.add.existing(this);
    }

    update(time: number, delta: number) {
        if (this.pathIndex >= PATH.length - 1) return;

        const targetX = this.pathTarget.x * CELL_SIZE + CELL_SIZE/2;
        const targetY = this.pathTarget.y * CELL_SIZE + CELL_SIZE/2;
        
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        const currentSpeed = this.frozen ? this.speed * 0.5 : this.speed;
        const moveDist = (currentSpeed * delta) / 1000;

        if (dist <= moveDist) {
            this.x = targetX;
            this.y = targetY;
            this.pathIndex++;
            if (this.pathIndex < PATH.length) {
                this.pathTarget = PATH[this.pathIndex];
            }
        } else {
            this.x += (dx / dist) * moveDist;
            this.y += (dy / dist) * moveDist;
        }

        this.updateHpBar();
    }

    takeDamage(amount: number) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.destroy();
            return true; // Died
        }
        return false;
    }

    updateHpBar() {
        this.hpBar.clear();
        this.hpBar.fillStyle(0xff0000);
        this.hpBar.fillRect(-15, -25, 30, 5);
        this.hpBar.fillStyle(0x00ff00);
        this.hpBar.fillRect(-15, -25, 30 * (this.hp / this.maxHp), 5);
    }
}

class Tower extends Phaser.GameObjects.Container {
    public type: keyof typeof TOWER_TYPES;
    public level: number = 1;
    public range: number;
    public damage: number;
    public cooldown: number;
    private lastFired: number = 0;
    private rangeCircle: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene, x: number, y: number, type: keyof typeof TOWER_TYPES) {
        super(scene, x * CELL_SIZE + CELL_SIZE/2, y * CELL_SIZE + CELL_SIZE/2);
        this.type = type;
        const data = TOWER_TYPES[type];
        this.range = data.range;
        this.damage = data.damage;
        this.cooldown = data.cooldown;

        // Visuals
        const base = scene.add.circle(0, 0, 20, 0x444444);
        const turret = scene.add.circle(0, 0, 15, data.color);
        this.add([base, turret]);

        this.rangeCircle = scene.add.graphics();
        this.rangeCircle.lineStyle(2, 0xffffff, 0.3);
        this.rangeCircle.strokeCircle(0, 0, this.range);
        this.rangeCircle.setVisible(false);
        this.add(this.rangeCircle);

        this.setInteractive(new Phaser.Geom.Circle(0, 0, 20), Phaser.Geom.Circle.Contains);
        this.on('pointerdown', () => {
            this.rangeCircle.setVisible(!this.rangeCircle.visible);
        });

        scene.add.existing(this);
    }

    update(time: number, enemies: Enemy[]) {
        if (time < this.lastFired + this.cooldown) return;

        const target = this.findTarget(enemies);
        if (target) {
            this.fire(target);
            this.lastFired = time;
        }
    }

    findTarget(enemies: Enemy[]): Enemy | null {
        let bestTarget: Enemy | null = null;
        let maxDist = -1; // Target furthest along path

        for (const enemy of enemies) {
            const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
            if (dist <= this.range) {
                if (enemy.pathIndex > maxDist) {
                    maxDist = enemy.pathIndex;
                    bestTarget = enemy;
                }
            }
        }
        return bestTarget;
    }

    fire(target: Enemy) {
        const scene = this.scene as TowerDefenseScene;
        
        // Visual projectile
        const projectile = scene.add.circle(this.x, this.y, 5, TOWER_TYPES[this.type].color);
        scene.physics.add.existing(projectile);
        
        scene.tweens.add({
            targets: projectile,
            x: target.x,
            y: target.y,
            duration: 200,
            onComplete: () => {
                projectile.destroy();
                if (target.active) {
                    const died = target.takeDamage(this.damage);
                    if (died) {
                        scene.onEnemyKilled(target);
                    } else {
                        // Apply effects
                        if (this.type === 'ice') {
                            target.frozen = true;
                            scene.time.delayedCall(2000, () => { if(target.active) target.frozen = false; });
                        }
                    }
                }
            }
        });
    }
}

class TowerDefenseScene extends Phaser.Scene {
    private gold = 50;
    private lives = 20;
    private wave = 1;
    private score = 0;
    
    private enemies: Enemy[] = [];
    private towers: Tower[] = [];
    private waveInProgress = false;
    private enemiesToSpawn: (keyof typeof ENEMY_TYPES)[] = [];
    private spawnTimer: Phaser.Time.TimerEvent | null = null;

    private selectedTowerType: keyof typeof TOWER_TYPES = 'cannon';
    private isPlacing = false;
    private placementGraphics!: Phaser.GameObjects.Graphics;

    private onStatsUpdate: (gold: number, lives: number, wave: number, score: number) => void;
    private onGameOver: (score: number) => void;

    constructor(
        onStatsUpdate: (gold: number, lives: number, wave: number, score: number) => void,
        onGameOver: (score: number) => void
    ) {
        super('TowerDefenseScene');
        this.onStatsUpdate = onStatsUpdate;
        this.onGameOver = onGameOver;
    }

    create() {
        this.drawMap();
        
        this.placementGraphics = this.add.graphics();
        
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.isPlacing) {
                const x = Math.floor(pointer.x / CELL_SIZE) * CELL_SIZE;
                const y = Math.floor(pointer.y / CELL_SIZE) * CELL_SIZE;
                
                this.placementGraphics.clear();
                this.placementGraphics.lineStyle(2, 0xffffff);
                this.placementGraphics.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
                
                const range = TOWER_TYPES[this.selectedTowerType].range;
                this.placementGraphics.lineStyle(1, 0xffffff, 0.5);
                this.placementGraphics.strokeCircle(x + CELL_SIZE/2, y + CELL_SIZE/2, range);
            }
        });

        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (this.isPlacing) {
                const gridX = Math.floor(pointer.x / CELL_SIZE);
                const gridY = Math.floor(pointer.y / CELL_SIZE);
                this.tryPlaceTower(gridX, gridY);
            }
        });
    }

    drawMap() {
        const graphics = this.add.graphics();
        
        // Background
        graphics.fillStyle(0x16213e);
        graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Grid
        graphics.lineStyle(1, 0x333666, 0.3);
        for (let x = 0; x <= COLS; x++) {
            graphics.moveTo(x * CELL_SIZE, 0);
            graphics.lineTo(x * CELL_SIZE, GAME_HEIGHT);
        }
        for (let y = 0; y <= ROWS; y++) {
            graphics.moveTo(0, y * CELL_SIZE);
            graphics.lineTo(GAME_WIDTH, y * CELL_SIZE);
        }
        graphics.strokePath();

        // Path
        graphics.fillStyle(0x8B7355);
        PATH.forEach(p => {
            graphics.fillRect(p.x * CELL_SIZE, p.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        });
    }

    update(time: number, delta: number) {
        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(time, delta);
            
            if (enemy.pathIndex >= PATH.length - 1) {
                this.lives--;
                this.onStatsUpdate(this.gold, this.lives, this.wave, this.score);
                enemy.destroy();
                this.enemies.splice(i, 1);
                
                if (this.lives <= 0) {
                    this.onGameOver(this.score);
                    this.scene.pause();
                }
            }
        }

        // Update towers
        this.towers.forEach(tower => tower.update(time, this.enemies));

        // Check wave end
        if (this.waveInProgress && this.enemies.length === 0 && this.enemiesToSpawn.length === 0) {
            this.waveInProgress = false;
            this.gold += this.wave * 10; // Wave clear bonus
            this.onStatsUpdate(this.gold, this.lives, this.wave, this.score);
        }
    }

    startWave() {
        if (this.waveInProgress) return;
        
        this.waveInProgress = true;
        const count = 5 + Math.floor(this.wave * 1.5);
        
        for (let i = 0; i < count; i++) {
            let type: keyof typeof ENEMY_TYPES = 'normal';
            if (this.wave > 2 && Math.random() < 0.3) type = 'fast';
            if (this.wave > 4 && Math.random() < 0.2) type = 'tank';
            if (this.wave > 6 && Math.random() < 0.1) type = 'boss';
            this.enemiesToSpawn.push(type);
        }

        this.spawnTimer = this.time.addEvent({
            delay: 1000,
            callback: this.spawnEnemy,
            callbackScope: this,
            repeat: count - 1
        });
    }

    spawnEnemy() {
        const type = this.enemiesToSpawn.shift();
        if (type) {
            const enemy = new Enemy(this, type, 1 + (this.wave * 0.2));
            this.enemies.push(enemy);
        }
    }

    onEnemyKilled(enemy: Enemy) {
        this.gold += enemy.bounty;
        this.score += enemy.bounty * 10;
        this.onStatsUpdate(this.gold, this.lives, this.wave, this.score);
        
        const index = this.enemies.indexOf(enemy);
        if (index > -1) this.enemies.splice(index, 1);
    }

    setPlacementMode(type: keyof typeof TOWER_TYPES) {
        this.selectedTowerType = type;
        this.isPlacing = true;
    }

    tryPlaceTower(gridX: number, gridY: number) {
        // Check bounds
        if (gridX < 0 || gridX >= COLS || gridY < 0 || gridY >= ROWS) return;

        // Check path collision
        if (PATH.some(p => p.x === gridX && p.y === gridY)) return;

        // Check existing tower
        if (this.towers.some(t => Math.floor(t.x / CELL_SIZE) === gridX && Math.floor(t.y / CELL_SIZE) === gridY)) return;

        // Check cost
        const cost = TOWER_TYPES[this.selectedTowerType].cost;
        if (this.gold < cost) return;

        // Place tower
        this.gold -= cost;
        const tower = new Tower(this, gridX, gridY, this.selectedTowerType);
        this.towers.push(tower);
        
        this.onStatsUpdate(this.gold, this.lives, this.wave, this.score);
        this.isPlacing = false;
        this.placementGraphics.clear();
    }
}

const TowerDefense: React.FC = () => {
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
    const [stats, setStats] = useState({ gold: 50, lives: 20, wave: 1, score: 0 });
    const gameRef = useRef<Phaser.Game | null>(null);
    const sceneRef = useRef<TowerDefenseScene | null>(null);

    useEffect(() => {
        if (gameState === 'playing') {
            const scene = new TowerDefenseScene(
                (gold, lives, wave, score) => setStats({ gold, lives, wave, score }),
                (score) => {
                    setStats(s => ({ ...s, score }));
                    setGameState('gameover');
                }
            );
            sceneRef.current = scene;

            const config: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                width: GAME_WIDTH,
                height: GAME_HEIGHT,
                parent: 'phaser-game',
                backgroundColor: '#16213e',
                physics: {
                    default: 'arcade',
                    arcade: { debug: false }
                },
                scene: scene
            };

            gameRef.current = new Phaser.Game(config);

            return () => {
                if (gameRef.current) {
                    gameRef.current.destroy(true);
                    gameRef.current = null;
                }
            };
        }
    }, [gameState]);

    const startGame = () => {
        setStats({ gold: 50, lives: 20, wave: 1, score: 0 });
        setGameState('playing');
    };

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            padding: '20px',
            background: '#0f172a',
            minHeight: '100dvh',
            color: 'white'
        }}>
            {gameState === 'start' && (
                <GameStartScreen
                    title="🏰 Tower Defense"
                    description="Defiende el camino de las hordas enemigas"
                    instructions={[
                        { title: 'Construir', items: ['Selecciona una torre y haz click en el mapa'], icon: '🏗️' },
                        { title: 'Sobrevivir', items: ['Evita que los enemigos lleguen al final'], icon: '🛡️' }
                    ]}
                    onStart={startGame}
                />
            )}

            {gameState === 'gameover' && (
                <GameOverScreen
                    score={stats.score}
                    onRestart={startGame}
                    onMenu={() => setGameState('start')}
                />
            )}

            {gameState === 'playing' && (
                <>
                    <div style={{ 
                        display: 'flex', 
                        gap: '20px', 
                        marginBottom: '10px',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        background: 'rgba(255,255,255,0.1)',
                        padding: '10px',
                        borderRadius: '8px'
                    }}>
                        <span>💰 {stats.gold}</span>
                        <span>❤️ {stats.lives}</span>
                        <span>🌊 {stats.wave}</span>
                        <span>⭐ {stats.score}</span>
                        <button 
                            onClick={() => sceneRef.current?.startWave()}
                            style={{
                                background: '#4CAF50',
                                border: 'none',
                                color: 'white',
                                padding: '5px 15px',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Siguiente Oleada
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '20px' }}>
                        <div id="phaser-game" style={{ border: '2px solid #444', borderRadius: '8px', overflow: 'hidden' }} />
                        
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            padding: '20px',
                            borderRadius: '8px'
                        }}>
                            <h3>Torres</h3>
                            {Object.entries(TOWER_TYPES).map(([key, data]) => (
                                <button
                                    key={key}
                                    onClick={() => sceneRef.current?.setPlacementMode(key as any)}
                                    style={{
                                        padding: '10px',
                                        background: `rgba(${data.color >> 16}, ${(data.color >> 8) & 0xFF}, ${data.color & 0xFF}, 0.5)`,
                                        border: '1px solid white',
                                        color: 'white',
                                        cursor: 'pointer',
                                        textAlign: 'left'
                                    }}
                                >
                                    <div>{data.name}</div>
                                    <div style={{ fontSize: '0.8em' }}>Coste: {data.cost}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default TowerDefense;
