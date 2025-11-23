import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import GameStartScreen from '../components/GameStartScreen';
import GameOverScreen from '../components/GameOverScreen';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 20;
const BALL_RADIUS = 10;
const PADDLE_SPEED = 8;
const BALL_SPEED = 300; // Adjusted for Arcade Physics (pixels per second)

class ArkanoidScene extends Phaser.Scene {
    private paddle!: Phaser.GameObjects.Rectangle;
    private ball!: Phaser.GameObjects.Arc;
    private bricks!: Phaser.Physics.Arcade.StaticGroup;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: { A: Phaser.Input.Keyboard.Key, D: Phaser.Input.Keyboard.Key };
    
    private score: number = 0;
    private lives: number = 3;
    private level: number = 1;
    private gameStarted: boolean = false;

    private onScoreUpdate: (score: number) => void;
    private onLivesUpdate: (lives: number) => void;
    private onGameOver: (victory: boolean) => void;

    constructor(onScoreUpdate: (s: number) => void, onLivesUpdate: (l: number) => void, onGameOver: (v: boolean) => void) {
        super('ArkanoidScene');
        this.onScoreUpdate = onScoreUpdate;
        this.onLivesUpdate = onLivesUpdate;
        this.onGameOver = onGameOver;
    }

    create() {
        this.cameras.main.setBackgroundColor('#1a1a2e');

        // Paddle
        this.paddle = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 50, PADDLE_WIDTH, PADDLE_HEIGHT, 0x4dabf7);
        this.physics.add.existing(this.paddle, true); // Static body

        // Ball
        this.ball = this.add.circle(GAME_WIDTH / 2, GAME_HEIGHT - 150, BALL_RADIUS, 0xfeca57);
        this.physics.add.existing(this.ball);
        const ballBody = this.ball.body as Phaser.Physics.Arcade.Body;
        ballBody.setCollideWorldBounds(true);
        ballBody.setBounce(1, 1);
        ballBody.setCircle(BALL_RADIUS);
        
        // Bricks
        this.bricks = this.physics.add.staticGroup();
        const brickColors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xffeaa7, 0xdda0dd, 0x98d8c8];

        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 10; col++) {
                const color = brickColors[row % brickColors.length];
                const x = 25 + col * 75 + 35; // +35 for center origin (70/2)
                const y = 60 + row * 30 + 12.5; // +12.5 for center origin (25/2)
                
                const brick = this.add.rectangle(x, y, 70, 25, color);
                this.bricks.add(brick);
            }
        }

        // Colliders
        this.physics.add.collider(this.ball, this.paddle, this.hitPaddle, undefined, this);
        this.physics.add.collider(this.ball, this.bricks, this.hitBrick, undefined, this);

        // Inputs
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.wasd = this.input.keyboard.addKeys('A,D') as any;
        }

        // Initial State
        this.resetBall();
        
        // World bounds event for bottom collision
        this.physics.world.on('worldbounds', (body: Phaser.Physics.Arcade.Body, up: boolean, down: boolean, left: boolean, right: boolean) => {
            if (down && body.gameObject === this.ball) {
                this.hitBottom();
            }
        });
        ballBody.onWorldBounds = true;
    }

    update() {
        // Paddle Movement
        if (this.wasd.A.isDown || this.cursors.left.isDown) {
            this.paddle.x -= PADDLE_SPEED;
        } else if (this.wasd.D.isDown || this.cursors.right.isDown) {
            this.paddle.x += PADDLE_SPEED;
        }
        
        this.paddle.x = Phaser.Math.Clamp(this.paddle.x, PADDLE_WIDTH / 2, GAME_WIDTH - PADDLE_WIDTH / 2);
        
        // Update physics body position manually since it's static but we're moving it
        const paddleBody = this.paddle.body as Phaser.Physics.Arcade.StaticBody;
        paddleBody.updateFromGameObject();

        // Check if ball falls below paddle (backup check if worldbounds fails or is set too low)
        if (this.ball.y > GAME_HEIGHT) {
            this.hitBottom();
        }
    }

    private hitPaddle(ball: any, paddle: any) {
        const ballBody = ball.body as Phaser.Physics.Arcade.Body;
        const diff = ball.x - paddle.x;
        
        // Add spin/angle based on hit position
        // Normalize diff (-50 to 50) to (-1 to 1)
        const normalizedHit = diff / (PADDLE_WIDTH / 2);
        
        ballBody.setVelocityX(normalizedHit * BALL_SPEED);
        
        // Ensure minimum vertical velocity so it doesn't get stuck moving horizontally
        if (Math.abs(ballBody.velocity.y) < 50) {
             ballBody.setVelocityY(-BALL_SPEED);
        }
    }

    private hitBrick(ball: any, brick: any) {
        brick.destroy();
        this.score += 10;
        this.onScoreUpdate(this.score);

        if (this.bricks.countActive() === 0) {
            this.scene.pause();
            this.onGameOver(true);
        }
    }

    private hitBottom() {
        this.lives--;
        this.onLivesUpdate(this.lives);
        
        if (this.lives <= 0) {
            this.scene.pause();
            this.onGameOver(false);
        } else {
            this.resetBall();
        }
    }

    private resetBall() {
        this.ball.setPosition(GAME_WIDTH / 2, GAME_HEIGHT - 150);
        const ballBody = this.ball.body as Phaser.Physics.Arcade.Body;
        ballBody.setVelocity(BALL_SPEED, -BALL_SPEED);
    }
}

const Arkanoid: React.FC = () => {
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<Phaser.Game | null>(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [victory, setVictory] = useState(false);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);

    useEffect(() => {
        if (!gameStarted || gameOver || victory) return;

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
            parent: gameContainerRef.current || undefined,
            backgroundColor: '#1a1a2e',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { x: 0, y: 0 },
                    debug: false
                }
            },
            scene: new ArkanoidScene(
                (s) => setScore(s),
                (l) => setLives(l),
                (v) => {
                    if (v) setVictory(true);
                    else setGameOver(true);
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
    }, [gameStarted, gameOver, victory]);

    const startGame = () => {
        setGameStarted(true);
        setScore(0);
        setLives(3);
        setGameOver(false);
        setVictory(false);
    };

    const restartGame = () => {
        setGameStarted(false);
        setGameOver(false);
        setVictory(false);
        setTimeout(() => {
            setScore(0);
            setLives(3);
            setGameStarted(true);
        }, 100);
    };

    if (!gameStarted) {
        return (
            <GameStartScreen
                title="🧱 ARKANOID"
                description="¡Destruye todos los bloques!"
                instructions={[
                    {
                        title: 'Controles',
                        items: [
                            'A / Flecha Izq: Mover izquierda',
                            'D / Flecha Der: Mover derecha',
                            'Evita que la pelota caiga'
                        ],
                        icon: '🎮'
                    },
                    {
                        title: 'Reglas',
                        items: [
                            '3 Vidas',
                            '10 pts/bloque',
                            'Física realista'
                        ],
                        icon: '📋'
                    }
                ]}
                onStart={startGame}
                theme={{
                    primary: '#feca57',
                    secondary: '#ff6b6b',
                    accent: '#ff9ff3',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
                }}
            />
        );
    }

    if (gameOver || victory) {
        return (
            <GameOverScreen
                score={score}
                isVictory={victory}
                onRestart={restartGame}
                onMenu={() => window.history.back()}
                theme={{
                    primary: '#feca57',
                    secondary: '#ff6b6b',
                    accent: '#ff9ff3',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
                }}
            />
        );
    }

    return (
        <div style={{ textAlign: 'center', padding: '1rem' }}>
            <h1 style={{ marginBottom: '1rem', color: '#4dabf7' }}>🧱 Arkanoid</h1>
            <div style={{ marginBottom: '1rem', color: '#666' }}>
                Usa A y D para mover la paleta • ¡Destruye todos los bloques!
            </div>
            
            {/* UI Overlay */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                width: GAME_WIDTH, 
                margin: '0 auto',
                marginBottom: '10px',
                fontWeight: 'bold',
                fontSize: '20px'
            }}>
                <div style={{ color: '#ffffff' }}>Score: {score}</div>
                <div style={{ color: '#4ecdc4' }}>Level: 1</div>
                <div style={{ color: '#ff6b6b' }}>Lives: {lives}</div>
            </div>

            <div ref={gameContainerRef} style={{ 
                display: 'inline-block',
                border: '3px solid #4dabf7',
                borderRadius: '8px',
                overflow: 'hidden'
            }} />
        </div>
    );
};

export default Arkanoid;
