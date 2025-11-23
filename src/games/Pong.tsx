import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import GameStartScreen from '../components/GameStartScreen';
import GameOverScreen from '../components/GameOverScreen';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PADDLE_WIDTH = 20;
const PADDLE_HEIGHT = 100;
const BALL_RADIUS = 12;
const PADDLE_SPEED = 400;
const INITIAL_BALL_SPEED = 300;
const MAX_BALL_SPEED = 800;

class PongScene extends Phaser.Scene {
    private playerPaddle!: Phaser.GameObjects.Rectangle;
    private aiPaddle!: Phaser.GameObjects.Rectangle;
    private ball!: Phaser.GameObjects.Arc;
    private centerLine!: Phaser.GameObjects.Graphics;
    
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wKey!: Phaser.Input.Keyboard.Key;
    private sKey!: Phaser.Input.Keyboard.Key;

    private ballVelocity!: Phaser.Math.Vector2;
    private playerScore = 0;
    private aiScore = 0;
    private isGameOver = false;

    private onScoreUpdate: (player: number, ai: number) => void;
    private onGameOver: (winner: string) => void;

    constructor(
        onScoreUpdate: (player: number, ai: number) => void,
        onGameOver: (winner: string) => void
    ) {
        super('PongScene');
        this.onScoreUpdate = onScoreUpdate;
        this.onGameOver = onGameOver;
    }

    create() {
        // Draw center line
        this.centerLine = this.add.graphics();
        this.centerLine.lineStyle(3, 0x444444, 0.8);
        for (let i = 0; i < GAME_HEIGHT; i += 20) {
            this.centerLine.moveTo(GAME_WIDTH / 2, i);
            this.centerLine.lineTo(GAME_WIDTH / 2, i + 10);
        }
        this.centerLine.strokePath();

        // Create paddles
        this.playerPaddle = this.add.rectangle(40, GAME_HEIGHT / 2, PADDLE_WIDTH, PADDLE_HEIGHT, 0x4dabf7);
        this.physics.add.existing(this.playerPaddle);
        (this.playerPaddle.body as Phaser.Physics.Arcade.Body).setImmovable(true);
        (this.playerPaddle.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);

        this.aiPaddle = this.add.rectangle(GAME_WIDTH - 40, GAME_HEIGHT / 2, PADDLE_WIDTH, PADDLE_HEIGHT, 0xff4757);
        this.physics.add.existing(this.aiPaddle);
        (this.aiPaddle.body as Phaser.Physics.Arcade.Body).setImmovable(true);
        (this.aiPaddle.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);

        // Create ball
        this.ball = this.add.circle(GAME_WIDTH / 2, GAME_HEIGHT / 2, BALL_RADIUS, 0xfeca57);
        this.physics.add.existing(this.ball);
        const ballBody = this.ball.body as Phaser.Physics.Arcade.Body;
        ballBody.setCollideWorldBounds(true);
        ballBody.setBounce(1, 1);
        ballBody.setCircle(BALL_RADIUS);

        // Input
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.wKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.sKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S);

        this.resetBall();
    }

    update() {
        if (this.isGameOver) return;

        this.handlePlayerInput();
        this.handleAI();
        this.checkCollisions();
        this.checkScore();
    }

    handlePlayerInput() {
        const body = this.playerPaddle.body as Phaser.Physics.Arcade.Body;
        
        if (this.cursors.up.isDown || this.wKey.isDown) {
            body.setVelocityY(-PADDLE_SPEED);
        } else if (this.cursors.down.isDown || this.sKey.isDown) {
            body.setVelocityY(PADDLE_SPEED);
        } else {
            body.setVelocityY(0);
        }
    }

    handleAI() {
        const body = this.aiPaddle.body as Phaser.Physics.Arcade.Body;
        const ballBody = this.ball.body as Phaser.Physics.Arcade.Body;

        // Simple AI: follow ball Y
        const diff = this.ball.y - this.aiPaddle.y;
        const speed = 250; // AI speed slightly slower than player

        if (Math.abs(diff) > 10) {
            if (diff > 0) {
                body.setVelocityY(speed);
            } else {
                body.setVelocityY(-speed);
            }
        } else {
            body.setVelocityY(0);
        }
    }

    checkCollisions() {
        const ballBody = this.ball.body as Phaser.Physics.Arcade.Body;

        this.physics.collide(this.ball, this.playerPaddle, () => {
            this.hitPaddle(this.playerPaddle);
        });

        this.physics.collide(this.ball, this.aiPaddle, () => {
            this.hitPaddle(this.aiPaddle);
        });
    }

    hitPaddle(paddle: Phaser.GameObjects.Rectangle) {
        const ballBody = this.ball.body as Phaser.Physics.Arcade.Body;
        
        // Increase speed slightly
        const currentSpeed = ballBody.velocity.length();
        const newSpeed = Math.min(currentSpeed * 1.05, MAX_BALL_SPEED);
        
        // Calculate angle based on hit position
        const diff = this.ball.y - paddle.y;
        const normalizedDiff = diff / (PADDLE_HEIGHT / 2);
        const angle = normalizedDiff * 45; // Max 45 degrees

        // Set new velocity
        const direction = paddle === this.playerPaddle ? 1 : -1;
        const vec = new Phaser.Math.Vector2();
        vec.setToPolar(Phaser.Math.DegToRad(angle), newSpeed);
        
        // Adjust x direction based on paddle side
        if (direction === 1) {
            ballBody.setVelocity(Math.abs(vec.x), vec.y);
        } else {
            ballBody.setVelocity(-Math.abs(vec.x), vec.y);
        }
    }

    checkScore() {
        const ballBody = this.ball.body as Phaser.Physics.Arcade.Body;

        if (this.ball.x < 0) {
            this.aiScore++;
            this.onScoreUpdate(this.playerScore, this.aiScore);
            if (this.aiScore >= 5) {
                this.gameOver('AI');
            } else {
                this.resetBall();
            }
        } else if (this.ball.x > GAME_WIDTH) {
            this.playerScore++;
            this.onScoreUpdate(this.playerScore, this.aiScore);
            if (this.playerScore >= 5) {
                this.gameOver('Jugador');
            } else {
                this.resetBall();
            }
        }
    }

    resetBall() {
        this.ball.setPosition(GAME_WIDTH / 2, GAME_HEIGHT / 2);
        const ballBody = this.ball.body as Phaser.Physics.Arcade.Body;
        
        const angle = Phaser.Math.Between(-45, 45);
        const direction = Math.random() > 0.5 ? 1 : -1;
        
        const vec = new Phaser.Math.Vector2();
        vec.setToPolar(Phaser.Math.DegToRad(angle), INITIAL_BALL_SPEED);
        
        if (direction === 1) {
            ballBody.setVelocity(Math.abs(vec.x), vec.y);
        } else {
            ballBody.setVelocity(-Math.abs(vec.x), vec.y);
        }
    }

    gameOver(winner: string) {
        this.isGameOver = true;
        (this.ball.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
        this.onGameOver(winner);
    }
}

const Pong: React.FC = () => {
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
    const [scores, setScores] = useState({ player: 0, ai: 0 });
    const [winner, setWinner] = useState('');
    const gameRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        if (gameState === 'playing') {
            const config: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                width: GAME_WIDTH,
                height: GAME_HEIGHT,
                parent: 'phaser-game',
                backgroundColor: '#0f0f23',
                physics: {
                    default: 'arcade',
                    arcade: {
                        gravity: { x: 0, y: 0 },
                        debug: false
                    }
                },
                scene: new PongScene(
                    (player, ai) => setScores({ player, ai }),
                    (w) => {
                        setWinner(w);
                        setGameState('gameover');
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
    }, [gameState]);

    const startGame = () => {
        setScores({ player: 0, ai: 0 });
        setGameState('playing');
    };

    if (gameState === 'start') {
        return (
            <GameStartScreen
                title="🏓 PONG"
                description="El clásico juego de tenis de mesa arcade"
                instructions={[
                    {
                        title: 'Controles',
                        items: [
                            'W / Flecha Arriba: Mover arriba',
                            'S / Flecha Abajo: Mover abajo',
                            'El primero en llegar a 5 puntos gana'
                        ],
                        icon: '🎮'
                    },
                    {
                        title: 'Mecánicas',
                        items: [
                            'La pelota acelera con cada golpe',
                            'Golpea con los bordes para cambiar el ángulo',
                            '¡Vence a la IA!'
                        ],
                        icon: '⚡'
                    }
                ]}
                onStart={startGame}
                theme={{
                    primary: '#4facfe',
                    secondary: '#00f2fe',
                    accent: '#a8edea',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
            />
        );
    }

    if (gameState === 'gameover') {
        return (
            <GameOverScreen
                score={scores.player}
                isVictory={winner === 'Jugador'}
                onRestart={startGame}
                onMenu={() => setGameState('start')}
                theme={{
                    primary: '#4facfe',
                    secondary: '#00f2fe',
                    accent: '#a8edea',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
                customStats={[
                    { label: 'Jugador', value: scores.player },
                    { label: 'IA', value: scores.ai },
                    { label: 'Resultado', value: winner === 'Jugador' ? '¡VICTORIA!' : 'DERROTA' }
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
            background: '#0f0f23',
            minHeight: '100dvh',
            color: 'white'
        }}>
            <h1 style={{ margin: '0 0 20px 0', color: '#4dabf7' }}>🏓 PONG</h1>
            
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '2rem', 
                marginBottom: '1rem',
                fontSize: '2rem',
                fontWeight: 'bold'
            }}>
                <span style={{ color: '#4dabf7' }}>Jugador: {scores.player}</span>
                <span style={{ color: '#ff4757' }}>AI: {scores.ai}</span>
            </div>

            <div id="phaser-game" style={{ 
                border: '3px solid #4dabf7', 
                borderRadius: '8px',
                overflow: 'hidden'
            }} />
            
            <div style={{ marginTop: '20px', color: '#666' }}>
                Usa W/S o las flechas para moverte
            </div>
        </div>
    );
};

export default Pong;
