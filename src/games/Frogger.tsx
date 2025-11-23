import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import GameStartScreen from '../components/GameStartScreen';
import GameOverScreen from '../components/GameOverScreen';

const GAME_WIDTH = 520;
const GAME_HEIGHT = 480;
const CELL_SIZE = 40;
const COLS = 13;
const ROWS = 12;

interface LaneConfig {
    type: 'road' | 'water' | 'safe';
    speed: number;
    direction: number;
    vehicleCount: number;
    color: number;
}

class FroggerScene extends Phaser.Scene {
    private frog!: Phaser.GameObjects.Sprite;
    private vehicles!: Phaser.GameObjects.Group;
    private logs!: Phaser.GameObjects.Group;
    private turtles!: Phaser.GameObjects.Group;
    private goals!: Phaser.GameObjects.Group;
    
    private frogGridPos = { x: 6, y: 11 };
    private isMoving = false;
    private moveTimer = 0;
    
    private score = 0;
    private lives = 3;
    private level = 1;
    private goalReached = [false, false, false, false, false];
    
    private onScoreUpdate: (score: number) => void;
    private onLivesUpdate: (lives: number) => void;
    private onLevelUpdate: (level: number) => void;
    private onGameOver: (score: number) => void;

    private lanes: LaneConfig[] = [];

    constructor(
        onScoreUpdate: (score: number) => void,
        onLivesUpdate: (lives: number) => void,
        onLevelUpdate: (level: number) => void,
        onGameOver: (score: number) => void
    ) {
        super('FroggerScene');
        this.onScoreUpdate = onScoreUpdate;
        this.onLivesUpdate = onLivesUpdate;
        this.onLevelUpdate = onLevelUpdate;
        this.onGameOver = onGameOver;
    }

    init(data: { level: number, score: number, lives: number }) {
        this.level = data.level || 1;
        this.score = data.score || 0;
        this.lives = data.lives || 3;
        this.goalReached = [false, false, false, false, false];
        this.frogGridPos = { x: 6, y: 11 };
        
        this.initLanes();
    }

    initLanes() {
        const speedMult = 1 + (this.level - 1) * 0.1;
        this.lanes = [
            { type: 'safe', speed: 0, direction: 0, vehicleCount: 0, color: 0x90EE90 }, // Goal
            { type: 'water', speed: 2 * speedMult, direction: 1, vehicleCount: 3, color: 0x4169E1 },
            { type: 'water', speed: 1.5 * speedMult, direction: -1, vehicleCount: 2, color: 0x4682B4 },
            { type: 'water', speed: 3 * speedMult, direction: 1, vehicleCount: 4, color: 0x4169E1 },
            { type: 'water', speed: 2.5 * speedMult, direction: -1, vehicleCount: 3, color: 0x4682B4 },
            { type: 'safe', speed: 0, direction: 0, vehicleCount: 0, color: 0xDEB887 }, // Median
            { type: 'road', speed: 3 * speedMult, direction: -1, vehicleCount: 2, color: 0x696969 },
            { type: 'road', speed: 2 * speedMult, direction: 1, vehicleCount: 3, color: 0x708090 },
            { type: 'road', speed: 4 * speedMult, direction: -1, vehicleCount: 2, color: 0x696969 },
            { type: 'road', speed: 2.5 * speedMult, direction: 1, vehicleCount: 3, color: 0x708090 },
            { type: 'road', speed: 3.5 * speedMult, direction: -1, vehicleCount: 2, color: 0x696969 },
            { type: 'safe', speed: 0, direction: 0, vehicleCount: 0, color: 0x228B22 }, // Start
        ];
    }

    preload() {
        this.createTextures();
    }

    createTextures() {
        // Frog
        const frog = this.make.graphics({ x: 0, y: 0 });
        frog.fillStyle(0x32CD32);
        frog.fillEllipse(20, 20, 18, 22);
        frog.fillStyle(0x228B22);
        frog.fillCircle(12, 8, 6);
        frog.fillCircle(28, 8, 6);
        frog.generateTexture('frog', 40, 40);

        // Car
        const car = this.make.graphics({ x: 0, y: 0 });
        car.fillStyle(0xFF4444);
        car.fillRoundedRect(0, 5, 40, 30, 4);
        car.fillStyle(0x87CEEB);
        car.fillRoundedRect(5, 10, 30, 20, 2);
        car.generateTexture('car', 40, 40);

        // Truck
        const truck = this.make.graphics({ x: 0, y: 0 });
        truck.fillStyle(0x8B4513);
        truck.fillRoundedRect(0, 5, 80, 30, 4);
        truck.fillStyle(0xA0522D);
        truck.fillRoundedRect(60, 8, 15, 24, 2);
        truck.generateTexture('truck', 80, 40);

        // Log
        const log = this.make.graphics({ x: 0, y: 0 });
        log.fillStyle(0x8B4513);
        log.fillRoundedRect(0, 5, 120, 30, 10);
        log.generateTexture('log', 120, 40);

        // Turtle
        const turtle = this.make.graphics({ x: 0, y: 0 });
        turtle.fillStyle(0x228B22);
        turtle.fillEllipse(20, 20, 20, 15);
        turtle.generateTexture('turtle', 40, 40);

        // Goal
        const goal = this.make.graphics({ x: 0, y: 0 });
        goal.fillStyle(0x32CD32);
        goal.fillEllipse(20, 20, 25, 15);
        goal.generateTexture('goal-empty', 40, 40);
        
        goal.clear();
        goal.fillStyle(0xFFD700);
        goal.fillEllipse(20, 20, 25, 15);
        goal.generateTexture('goal-filled', 40, 40);
    }

    create() {
        // Draw background lanes
        this.lanes.forEach((lane, i) => {
            const bg = this.add.graphics();
            bg.fillStyle(lane.color);
            bg.fillRect(0, i * CELL_SIZE, GAME_WIDTH, CELL_SIZE);
            
            if (lane.type === 'road') {
                bg.lineStyle(2, 0xFFFFFF, 0.5);
                for (let x = 0; x < GAME_WIDTH; x += 40) {
                    bg.moveTo(x + 10, i * CELL_SIZE + CELL_SIZE/2);
                    bg.lineTo(x + 30, i * CELL_SIZE + CELL_SIZE/2);
                }
                bg.strokePath();
            }
        });

        // Groups
        this.logs = this.add.group();
        this.turtles = this.add.group();
        this.vehicles = this.add.group();
        this.goals = this.add.group();

        // Initialize objects
        this.lanes.forEach((lane, row) => {
            if (lane.vehicleCount > 0) {
                const spacing = GAME_WIDTH / lane.vehicleCount;
                for (let i = 0; i < lane.vehicleCount; i++) {
                    const x = i * spacing + Phaser.Math.Between(0, 50);
                    const y = row * CELL_SIZE + CELL_SIZE/2;
                    
                    if (lane.type === 'water') {
                        if (row % 2 === 0) { // Logs
                            const log = this.add.sprite(x, y, 'log');
                            log.setData('speed', lane.speed * lane.direction);
                            this.logs.add(log);
                        } else { // Turtles
                            const turtle = this.add.sprite(x, y, 'turtle');
                            turtle.setData('speed', lane.speed * lane.direction);
                            this.turtles.add(turtle);
                        }
                    } else if (lane.type === 'road') {
                        const type = Phaser.Math.RND.pick(['car', 'truck']);
                        const vehicle = this.add.sprite(x, y, type);
                        vehicle.setData('speed', lane.speed * lane.direction);
                        if (lane.direction === -1) vehicle.setFlipX(true);
                        this.vehicles.add(vehicle);
                    }
                }
            }
        });

        // Goals
        for (let i = 0; i < 5; i++) {
            const x = 50 + i * 80 + 30; // Adjusted spacing
            const goal = this.add.sprite(x, CELL_SIZE/2, 'goal-empty');
            this.goals.add(goal);
        }

        // Frog
        this.frog = this.add.sprite(
            this.frogGridPos.x * CELL_SIZE + CELL_SIZE/2,
            this.frogGridPos.y * CELL_SIZE + CELL_SIZE/2,
            'frog'
        );
        this.frog.setDepth(10);

        // Controls
        this.input.keyboard!.on('keydown-UP', () => this.move(0, -1));
        this.input.keyboard!.on('keydown-DOWN', () => this.move(0, 1));
        this.input.keyboard!.on('keydown-LEFT', () => this.move(-1, 0));
        this.input.keyboard!.on('keydown-RIGHT', () => this.move(1, 0));
        this.input.keyboard!.on('keydown-W', () => this.move(0, -1));
        this.input.keyboard!.on('keydown-S', () => this.move(0, 1));
        this.input.keyboard!.on('keydown-A', () => this.move(-1, 0));
        this.input.keyboard!.on('keydown-D', () => this.move(1, 0));
    }

    move(dx: number, dy: number) {
        if (this.isMoving) return;

        const newX = this.frogGridPos.x + dx;
        const newY = this.frogGridPos.y + dy;

        if (newX >= 0 && newX < COLS && newY >= 0 && newY < ROWS) {
            this.frogGridPos.x = newX;
            this.frogGridPos.y = newY;
            
            this.frog.x = newX * CELL_SIZE + CELL_SIZE/2;
            this.frog.y = newY * CELL_SIZE + CELL_SIZE/2;
            
            if (dy < 0) {
                this.score += 10;
                this.onScoreUpdate(this.score);
            }

            // Check goal
            if (newY === 0) {
                this.checkGoal(newX);
            }
        }
    }

    checkGoal(x: number) {
        // Map x coordinate to goal index (approximate)
        // Goals are at indices 1, 3, 5, 7, 9 in grid terms roughly
        // But we placed them visually. Let's use simple distance check to goals
        let reachedGoalIndex = -1;
        
        this.goals.children.entries.forEach((goal: any, index) => {
            if (Math.abs(goal.x - this.frog.x) < 20) {
                reachedGoalIndex = index;
            }
        });

        if (reachedGoalIndex !== -1 && !this.goalReached[reachedGoalIndex]) {
            this.goalReached[reachedGoalIndex] = true;
            (this.goals.children.entries[reachedGoalIndex] as Phaser.GameObjects.Sprite).setTexture('goal-filled');
            this.score += 100;
            this.onScoreUpdate(this.score);
            this.resetFrog();

            if (this.goalReached.every(r => r)) {
                this.levelUp();
            }
        } else {
            this.loseLife();
        }
    }

    update() {
        // Move objects
        const moveObject = (obj: any) => {
            obj.x += obj.getData('speed');
            const width = obj.width;
            if (obj.getData('speed') > 0 && obj.x > GAME_WIDTH + width/2) obj.x = -width/2;
            if (obj.getData('speed') < 0 && obj.x < -width/2) obj.x = GAME_WIDTH + width/2;
        };

        this.logs.children.entries.forEach(moveObject);
        this.turtles.children.entries.forEach(moveObject);
        this.vehicles.children.entries.forEach(moveObject);

        // Check collisions
        this.checkCollisions();
    }

    checkCollisions() {
        const frogRect = this.frog.getBounds();
        const lane = this.lanes[this.frogGridPos.y];

        if (lane.type === 'road') {
            let hit = false;
            this.vehicles.children.entries.forEach((v: any) => {
                if (Phaser.Geom.Intersects.RectangleToRectangle(frogRect, v.getBounds())) {
                    hit = true;
                }
            });
            if (hit) this.loseLife();
        } else if (lane.type === 'water') {
            let safe = false;
            let speed = 0;

            this.logs.children.entries.forEach((l: any) => {
                if (Phaser.Geom.Intersects.RectangleToRectangle(frogRect, l.getBounds())) {
                    safe = true;
                    speed = l.getData('speed');
                }
            });

            this.turtles.children.entries.forEach((t: any) => {
                if (Phaser.Geom.Intersects.RectangleToRectangle(frogRect, t.getBounds())) {
                    safe = true;
                    speed = t.getData('speed');
                }
            });

            if (safe) {
                this.frog.x += speed;
                // Update grid pos roughly to keep in sync if needed, but mainly visual here
                if (this.frog.x < 0 || this.frog.x > GAME_WIDTH) this.loseLife();
            } else {
                this.loseLife();
            }
        }
    }

    loseLife() {
        this.lives--;
        this.onLivesUpdate(this.lives);
        
        if (this.lives <= 0) {
            this.scene.pause();
            this.onGameOver(this.score);
        } else {
            this.resetFrog();
        }
    }

    resetFrog() {
        this.frogGridPos = { x: 6, y: 11 };
        this.frog.x = this.frogGridPos.x * CELL_SIZE + CELL_SIZE/2;
        this.frog.y = this.frogGridPos.y * CELL_SIZE + CELL_SIZE/2;
    }

    levelUp() {
        this.level++;
        this.score += 200;
        this.onLevelUpdate(this.level);
        this.onScoreUpdate(this.score);
        this.scene.restart({ level: this.level, score: this.score, lives: this.lives });
    }
}

const Frogger: React.FC = () => {
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameOver'>('start');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [level, setLevel] = useState(1);
    const [highScore, setHighScore] = useState(() => {
        const saved = localStorage.getItem('frogger-highscore');
        return saved ? parseInt(saved) : 0;
    });
    const gameRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        if (gameState === 'playing') {
            const config: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                width: GAME_WIDTH,
                height: GAME_HEIGHT,
                parent: 'phaser-game',
                backgroundColor: '#228B22',
                scene: new FroggerScene(
                    (s) => setScore(s),
                    (l) => setLives(l),
                    (lvl) => setLevel(lvl),
                    (finalScore) => {
                        setScore(finalScore);
                        if (finalScore > highScore) {
                            setHighScore(finalScore);
                            localStorage.setItem('frogger-highscore', finalScore.toString());
                        }
                        setGameState('gameOver');
                    }
                )
            };

            gameRef.current = new Phaser.Game(config);

            return () => {
                if (gameRef.current) {
                    gameRef.current.destroy(true);
                    gameRef.current = null;
                }
            };
        }
    }, [gameState, highScore]);

    const startGame = () => {
        setGameState('playing');
        setScore(0);
        setLives(3);
        setLevel(1);
    };

    const restartGame = () => {
        setGameState('playing');
        setScore(0);
        setLives(3);
        setLevel(1);
    };

    if (gameState === 'start') {
        return (
            <GameStartScreen
                title="🐸 FROGGER"
                description="¡Ayuda a la rana a cruzar el tráfico y el río!"
                highScore={highScore}
                instructions={[
                    {
                        title: 'Controles',
                        items: [
                            "↑/W: Arriba",
                            "↓/S: Abajo",
                            "←/A: Izquierda",
                            "→/D: Derecha"
                        ],
                        icon: '🎮'
                    },
                    {
                        title: 'Objetivo',
                        items: [
                            "🚗 Evita los coches",
                            "🌊 Usa troncos y tortugas",
                            "🎯 Llega a las 5 metas"
                        ],
                        icon: '⚠️'
                    }
                ]}
                onStart={startGame}
                theme={{
                    primary: '#32CD32',
                    secondary: '#228B22',
                    accent: '#90EE90',
                    background: 'linear-gradient(135deg, #228B22 0%, #32CD32 100%)'
                }}
            />
        );
    }

    if (gameState === 'gameOver') {
        return (
            <GameOverScreen
                score={score}
                highScore={highScore}
                onRestart={restartGame}
                onMenu={() => setGameState('start')}
                theme={{
                    primary: '#32CD32',
                    secondary: '#228B22',
                    accent: '#90EE90',
                    background: 'linear-gradient(135deg, #228B22 0%, #32CD32 100%)'
                }}
                customStats={[
                    { label: 'Nivel Alcanzado', value: level },
                    { label: 'Vidas Restantes', value: lives }
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
            background: 'linear-gradient(135deg, #228B22 0%, #32CD32 100%)',
            minHeight: '100dvh',
            fontFamily: 'Arial, sans-serif',
            color: 'white'
        }}>
            <h1 style={{ margin: '0 0 20px 0', fontSize: '2.5rem' }}>🐸 FROGGER</h1>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                width: GAME_WIDTH, 
                marginBottom: '10px',
                fontWeight: 'bold',
                fontSize: '1.2rem'
            }}>
                <span>Score: {score}</span>
                <span>Level: {level}</span>
                <span>Lives: {lives}</span>
            </div>
            <div id="phaser-game" style={{ border: '3px solid #32CD32', borderRadius: '10px', overflow: 'hidden' }} />
            <div style={{ marginTop: '20px', fontSize: '1.2rem' }}>
                <p>↑↓←→ o WASD para mover la rana</p>
            </div>
        </div>
    );
};

export default Frogger;
