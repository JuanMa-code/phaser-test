import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import GameStartScreen from '../components/GameStartScreen';
import GameOverScreen from '../components/GameOverScreen';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 400;
const DINO_SIZE = 50;
const GROUND_HEIGHT = 60;
const GRAVITY = 1600;
const JUMP_VELOCITY = -700;

class DinoScene extends Phaser.Scene {
    private dino!: Phaser.GameObjects.Container;
    private dinoGraphics!: Phaser.GameObjects.Graphics;
    private ground!: Phaser.GameObjects.TileSprite;
    private obstacles!: Phaser.Physics.Arcade.Group;
    private clouds!: Phaser.GameObjects.Group;
    
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: { W: Phaser.Input.Keyboard.Key, S: Phaser.Input.Keyboard.Key };
    private spaceKey!: Phaser.Input.Keyboard.Key;

    private gameSpeed: number = 400;
    private score: number = 0;
    private isDucking: boolean = false;
    private obstacleTimer: number = 0;
    private cloudTimer: number = 0;

    private onScoreUpdate: (score: number) => void;
    private onGameOver: (score: number) => void;

    constructor(onScoreUpdate: (s: number) => void, onGameOver: (s: number) => void) {
        super('DinoScene');
        this.onScoreUpdate = onScoreUpdate;
        this.onGameOver = onGameOver;
    }

    create() {
        this.cameras.main.setBackgroundColor('#87CEEB');

        // Ground
        const groundGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        groundGraphics.fillStyle(0x8B4513);
        groundGraphics.fillRect(0, 0, GAME_WIDTH, GROUND_HEIGHT);
        groundGraphics.lineStyle(2, 0x654321);
        for (let x = 0; x < GAME_WIDTH; x += 40) {
            groundGraphics.moveTo(x, 0);
            groundGraphics.lineTo(x + 20, 10);
        }
        groundGraphics.strokePath();
        groundGraphics.generateTexture('ground', GAME_WIDTH, GROUND_HEIGHT);

        this.ground = this.add.tileSprite(GAME_WIDTH / 2, GAME_HEIGHT - GROUND_HEIGHT / 2, GAME_WIDTH, GROUND_HEIGHT, 'ground');
        this.physics.add.existing(this.ground, true); // Static body

        // Groups
        this.obstacles = this.physics.add.group();
        this.clouds = this.add.group();

        // Dino
        this.createDino();

        // Inputs
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.wasd = this.input.keyboard.addKeys('W,S') as any;
            this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        }

        // Collisions
        this.physics.add.collider(this.dino, this.ground);
        this.physics.add.overlap(this.dino, this.obstacles, this.hitObstacle, undefined, this);
    }

    update(time: number, delta: number) {
        if (!this.dino.active) return;

        // Move ground
        this.ground.tilePositionX += (this.gameSpeed * delta) / 1000;

        // Handle Input
        this.handleInput();

        // Spawn Obstacles
        this.obstacleTimer += delta;
        const spawnRate = Math.max(1000, 2000 - Math.floor(this.score / 10) * 50);
        if (this.obstacleTimer > spawnRate) {
            this.spawnObstacle();
            this.obstacleTimer = 0;
        }

        // Spawn Clouds
        this.cloudTimer += delta;
        if (this.cloudTimer > 2000 + Math.random() * 3000) {
            this.spawnCloud();
            this.cloudTimer = 0;
        }

        // Update Obstacles
        this.obstacles.getChildren().forEach((obs: any) => {
            obs.x -= (this.gameSpeed * delta) / 1000;
            if (obs.x < -100) {
                obs.destroy();
                this.score++;
                this.onScoreUpdate(this.score);
                if (this.score % 10 === 0) {
                    this.gameSpeed += 20;
                }
            }
        });

        // Update Clouds
        this.clouds.getChildren().forEach((cloud: any) => {
            cloud.x -= (this.gameSpeed * 0.5 * delta) / 1000;
            if (cloud.x < -100) {
                cloud.destroy();
            }
        });

        this.drawDino();
    }

    private createDino() {
        this.dino = this.add.container(80, GAME_HEIGHT - GROUND_HEIGHT - DINO_SIZE / 2);
        this.dinoGraphics = this.add.graphics();
        this.dino.add(this.dinoGraphics);
        
        this.physics.add.existing(this.dino);
        const body = this.dino.body as Phaser.Physics.Arcade.Body;
        body.setGravityY(GRAVITY);
        body.setCollideWorldBounds(true);
        body.setSize(DINO_SIZE, DINO_SIZE);
        body.setOffset(-DINO_SIZE/2, -DINO_SIZE/2); // Center body on container
    }

    private drawDino() {
        this.dinoGraphics.clear();
        
        if (this.isDucking) {
            // Ducking dino
            this.dinoGraphics.fillStyle(0x228B22);
            this.dinoGraphics.fillRoundedRect(-DINO_SIZE/2, 0, DINO_SIZE + 10, DINO_SIZE - 20, 5);
            
            // Eye
            this.dinoGraphics.fillStyle(0x000000);
            this.dinoGraphics.fillCircle(DINO_SIZE/2 - 5, 5, 3);
            
            // Tail
            this.dinoGraphics.fillStyle(0x32CD32);
            this.dinoGraphics.fillRoundedRect(-DINO_SIZE/2 - 10, 5, 15, 15, 3);
        } else {
            // Standing dino
            this.dinoGraphics.fillStyle(0x228B22);
            this.dinoGraphics.fillRoundedRect(-DINO_SIZE/2, -DINO_SIZE/2, DINO_SIZE, DINO_SIZE, 8);
            
            // Eye
            this.dinoGraphics.fillStyle(0x000000);
            this.dinoGraphics.fillCircle(DINO_SIZE/2 - 15, -DINO_SIZE/2 + 15, 4);
            
            // Legs (visual only)
            const body = this.dino.body as Phaser.Physics.Arcade.Body;
            if (body.touching.down) {
                this.dinoGraphics.fillStyle(0x32CD32);
                this.dinoGraphics.fillRect(-DINO_SIZE/2 + 10, DINO_SIZE/2, 8, 10);
                this.dinoGraphics.fillRect(DINO_SIZE/2 - 18, DINO_SIZE/2, 8, 10);
            }
            
            // Tail
            this.dinoGraphics.fillStyle(0x32CD32);
            this.dinoGraphics.fillRoundedRect(-DINO_SIZE/2 - 8, -DINO_SIZE/2 + 15, 12, 20, 3);
        }
    }

    private handleInput() {
        const body = this.dino.body as Phaser.Physics.Arcade.Body;
        const onFloor = body.touching.down || body.blocked.down; // Check blocked too for world bounds

        // Jump
        if ((this.cursors.up.isDown || this.wasd.W.isDown || this.spaceKey.isDown) && onFloor) {
            body.setVelocityY(JUMP_VELOCITY);
            this.isDucking = false;
        }

        // Duck
        if ((this.cursors.down.isDown || this.wasd.S.isDown) && onFloor) {
            if (!this.isDucking) {
                this.isDucking = true;
                body.setSize(DINO_SIZE + 10, DINO_SIZE - 20);
                body.setOffset(-DINO_SIZE/2, 0);
            }
        } else if (this.isDucking && !this.cursors.down.isDown && !this.wasd.S.isDown) {
            this.isDucking = false;
            body.setSize(DINO_SIZE, DINO_SIZE);
            body.setOffset(-DINO_SIZE/2, -DINO_SIZE/2);
        }
    }

    private spawnObstacle() {
        const types = ['cactus', 'rock', 'bird'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        let width = 30;
        let height = 50;
        let y = GAME_HEIGHT - GROUND_HEIGHT - height / 2; // Center y for Arcade body

        const obstacle = this.add.graphics();
        
        if (type === 'cactus') {
            obstacle.fillStyle(0x228B22);
            obstacle.fillRect(-12.5, -30, 25, 60);
            obstacle.fillRect(-22.5, -10, 15, 4);
            obstacle.fillRect(12.5, 0, 15, 4);
            
            // Spikes
            obstacle.fillStyle(0x32CD32);
            for (let i = 0; i < 6; i++) {
                obstacle.fillRect(-7.5 + i * 3, -30 + i * 10, 2, 8);
            }
            width = 25;
            height = 60;
            y = GAME_HEIGHT - GROUND_HEIGHT - 30;
        } else if (type === 'rock') {
            obstacle.fillStyle(0x696969);
            obstacle.fillCircle(0, 0, 20);
            obstacle.fillCircle(-15, 5, 12);
            obstacle.fillCircle(15, 5, 15);
            
            obstacle.fillStyle(0x808080);
            obstacle.fillCircle(-5, -5, 5);
            obstacle.fillCircle(10, 0, 3);
            
            width = 40;
            height = 40;
            y = GAME_HEIGHT - GROUND_HEIGHT - 20;
        } else { // bird
            obstacle.fillStyle(0x8B4513);
            obstacle.fillEllipse(0, 0, 25, 15);
            
            obstacle.fillStyle(0xA0522D);
            obstacle.fillEllipse(-15, -5, 20, 8);
            obstacle.fillEllipse(15, -5, 20, 8);
            
            obstacle.fillStyle(0xFFD700);
            // Beak polygon manually
            obstacle.beginPath();
            obstacle.moveTo(25, 0);
            obstacle.lineTo(35, -3);
            obstacle.lineTo(35, 3);
            obstacle.closePath();
            obstacle.fillPath();

            width = 50;
            height = 30;
            y = GAME_HEIGHT - GROUND_HEIGHT - 60 - Math.random() * 60;
        }

        obstacle.x = GAME_WIDTH + 50;
        obstacle.y = y;

        this.physics.add.existing(obstacle);
        const body = obstacle.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.setImmovable(true);
        body.setSize(width, height);
        // Graphics are drawn centered, so offset needs to be adjusted if not using container
        // But here I drew relative to 0,0.
        // For cactus: rect is -12.5 to 12.5 (width 25), -30 to 30 (height 60).
        // Body defaults to top-left of game object position? No, body is relative to game object.
        // If I draw centered, I should center the body.
        if (type === 'cactus') body.setOffset(-width/2, -height/2);
        else if (type === 'rock') body.setOffset(-20, -20); // approx
        else body.setOffset(-25, -15);

        this.obstacles.add(obstacle);
    }

    private spawnCloud() {
        const cloud = this.add.graphics();
        cloud.fillStyle(0xffffff, 0.8);
        cloud.fillCircle(0, 0, 15);
        cloud.fillCircle(20, 0, 18);
        cloud.fillCircle(40, 0, 15);
        cloud.fillCircle(10, -8, 12);
        cloud.fillCircle(30, -8, 12);
        
        cloud.x = GAME_WIDTH + 50;
        cloud.y = 50 + Math.random() * 100;
        cloud.alpha = 0.7;
        
        this.clouds.add(cloud);
    }

    private hitObstacle() {
        this.physics.pause();
        this.dino.active = false; // Stop update loop logic
        this.onGameOver(this.score);
    }
}

const Dino: React.FC = () => {
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<Phaser.Game | null>(null);
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameOver'>('start');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(() => {
        const saved = localStorage.getItem('dino-highscore');
        return saved ? parseInt(saved) : 0;
    });

    useEffect(() => {
        if (gameState !== 'playing') return;

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
            parent: gameContainerRef.current || undefined,
            backgroundColor: '#87CEEB',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { x: 0, y: 0 }, // We apply gravity manually to dino or use body.gravity
                    debug: false
                }
            },
            scene: new DinoScene(
                (s) => setScore(s),
                (s) => {
                    setScore(s);
                    if (s > highScore) {
                        setHighScore(s);
                        localStorage.setItem('dino-highscore', s.toString());
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
    }, [gameState]);

    const startGame = () => {
        setGameState('playing');
        setScore(0);
    };

    const restartGame = () => {
        setGameState('playing');
        setScore(0);
    };

    if (gameState === 'start') {
        return (
            <GameStartScreen
                title="🦕 DINO RUN"
                description="¡Ayuda al dinosaurio a sobrevivir esquivando obstáculos!"
                instructions={[
                    {
                        title: "Controles",
                        items: [
                            "Espacio/↑/W: Saltar",
                            "↓/S: Agacharse",
                            "(Mantener presionado para agacharse)"
                        ],
                        icon: '🎮'
                    },
                    {
                        title: "Puntuación",
                        items: [
                            "1 punto por obstáculo evitado",
                            "La velocidad aumenta cada 10 puntos"
                        ],
                        icon: '🏆'
                    },
                    {
                        title: "Obstáculos",
                        items: [
                            "🌵 Cactus: Salta por encima",
                            "🪨 Rocas: Salta por encima",
                            "🦅 Pájaros: Agáchate o salta"
                        ],
                        icon: '⚠️'
                    }
                ]}
                onStart={startGame}
                highScore={highScore}
                theme={{
                    background: 'linear-gradient(135deg, #87CEEB 0%, #98FB98 100%)',
                    accent: 'linear-gradient(45deg, #228B22, #32CD32, #98FB98, #00FF00)',
                    primary: 'linear-gradient(45deg, #228B22, #32CD32)',
                    text: '#2F4F4F'
                }}
            />
        );
    }

    if (gameState === 'gameOver') {
        const isNewRecord = score === highScore && score > 0;
        return (
            <GameOverScreen
                score={score}
                highScore={highScore}
                onRestart={restartGame}
                onMenu={() => setGameState('start')}
                isNewRecord={isNewRecord}
                theme={{
                    background: isNewRecord 
                        ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
                        : 'linear-gradient(135deg, #CD853F 0%, #8B4513 100%)',
                    primary: 'linear-gradient(45deg, #228B22, #32CD32)',
                    secondary: 'linear-gradient(45deg, #8B4513, #CD853F)'
                }}
            />
        );
    }

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            padding: '20px',
            background: 'linear-gradient(135deg, #87CEEB 0%, #98FB98 100%)',
            minHeight: '100dvh',
            fontFamily: 'Arial, sans-serif',
            color: '#2F4F4F'
        }}>
            <h1 style={{ margin: '0 0 20px 0', fontSize: '2.5rem' }}>🦕 DINO RUN</h1>
            <div ref={gameContainerRef} style={{ border: '3px solid #228B22', borderRadius: '10px' }} />
            <div style={{ marginTop: '20px', fontSize: '1.2rem' }}>
                <p>Espacio/↑/W saltar, ↓/S agacharse</p>
            </div>
        </div>
    );
};

export default Dino;
