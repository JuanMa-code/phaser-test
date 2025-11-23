import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import GameStartScreen from '../components/GameStartScreen';
import GameOverScreen from '../components/GameOverScreen';

const GAME_WIDTH = 480;
const GAME_HEIGHT = 640;
const BIRD_SIZE = 24;
const PIPE_WIDTH = 80;
const PIPE_GAP = 140;

class FlappyScene extends Phaser.Scene {
    private bird!: Phaser.Physics.Arcade.Sprite;
    private pipes!: Phaser.Physics.Arcade.Group;
    private clouds!: Phaser.GameObjects.Group;
    private ground!: Phaser.GameObjects.TileSprite;
    private scoreText!: Phaser.GameObjects.Text;
    
    private score: number = 0;
    private isGameOver: boolean = false;
    private pipeTimer: Phaser.Time.TimerEvent | null = null;
    private onGameOver: (score: number) => void;
    private onScoreUpdate: (score: number) => void;

    constructor(onGameOver: (score: number) => void, onScoreUpdate: (score: number) => void) {
        super('FlappyScene');
        this.onGameOver = onGameOver;
        this.onScoreUpdate = onScoreUpdate;
    }

    preload() {
        this.createTextures();
    }

    createTextures() {
        // Bird texture
        const birdGraphics = this.make.graphics({ x: 0, y: 0 });
        
        // Body
        birdGraphics.fillStyle(0xFFD700);
        birdGraphics.fillEllipse(BIRD_SIZE, BIRD_SIZE, BIRD_SIZE, BIRD_SIZE * 0.8);
        
        // Wing
        birdGraphics.fillStyle(0xFFA500);
        birdGraphics.fillEllipse(BIRD_SIZE - 8, BIRD_SIZE - 5, 15, 8);
        
        // Beak
        birdGraphics.fillStyle(0xFF6347);
        birdGraphics.fillTriangle(BIRD_SIZE + 10, BIRD_SIZE - 5, BIRD_SIZE + 25, BIRD_SIZE, BIRD_SIZE + 10, BIRD_SIZE + 5);
        
        // Eye
        birdGraphics.fillStyle(0x000000);
        birdGraphics.fillCircle(BIRD_SIZE + 8, BIRD_SIZE - 5, 4);
        birdGraphics.fillStyle(0xFFFFFF);
        birdGraphics.fillCircle(BIRD_SIZE + 10, BIRD_SIZE - 6, 2);
        
        birdGraphics.generateTexture('bird', BIRD_SIZE * 2 + 10, BIRD_SIZE * 2);

        // Pipe texture
        const pipeGraphics = this.make.graphics({ x: 0, y: 0 });
        
        // Main pipe body
        pipeGraphics.fillStyle(0x4CAF50);
        pipeGraphics.fillRoundedRect(0, 0, PIPE_WIDTH, 600, 8);
        
        // Highlights
        pipeGraphics.fillStyle(0x66BB6A);
        pipeGraphics.fillRect(8, 0, 8, 600);
        pipeGraphics.fillRect(PIPE_WIDTH - 16, 0, 8, 600);
        
        // Cap
        pipeGraphics.fillStyle(0x388E3C);
        pipeGraphics.fillRoundedRect(-4, 0, PIPE_WIDTH + 8, 24, 4);
        
        pipeGraphics.generateTexture('pipe', PIPE_WIDTH + 8, 600);

        // Cloud texture
        const cloudGraphics = this.make.graphics({ x: 0, y: 0 });
        cloudGraphics.fillStyle(0xFFFFFF, 0.8);
        cloudGraphics.fillCircle(20, 20, 18);
        cloudGraphics.fillCircle(45, 20, 22);
        cloudGraphics.fillCircle(70, 20, 18);
        cloudGraphics.fillCircle(32, 10, 14);
        cloudGraphics.fillCircle(57, 10, 16);
        cloudGraphics.generateTexture('cloud', 100, 50);

        // Ground texture
        const groundGraphics = this.make.graphics({ x: 0, y: 0 });
        groundGraphics.fillStyle(0x8BC34A);
        groundGraphics.fillRect(0, 0, GAME_WIDTH, 80);
        groundGraphics.fillStyle(0x4CAF50);
        for (let x = 0; x < GAME_WIDTH; x += 20) {
            groundGraphics.fillRect(x, 0, 10, 20);
        }
        groundGraphics.generateTexture('ground', GAME_WIDTH, 80);
    }

    create() {
        this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        // Background
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x70C5CE).setOrigin(0);

        // Clouds
        this.clouds = this.add.group();
        this.time.addEvent({
            delay: 2000,
            callback: this.spawnCloud,
            callbackScope: this,
            loop: true
        });
        // Initial clouds
        for(let i=0; i<3; i++) this.spawnCloud(true);

        // Pipes Group
        this.pipes = this.physics.add.group();

        // Ground
        this.ground = this.add.tileSprite(GAME_WIDTH/2, GAME_HEIGHT - 40, GAME_WIDTH, 80, 'ground');
        this.physics.add.existing(this.ground, true);
        (this.ground.body as Phaser.Physics.Arcade.Body).setImmovable(true);
        this.ground.setDepth(10);

        // Bird
        this.bird = this.physics.add.sprite(120, GAME_HEIGHT / 2, 'bird');
        this.bird.setCollideWorldBounds(true);
        this.bird.setGravityY(1000);
        this.bird.setDepth(5);
        // Adjust collision box
        this.bird.body!.setSize(BIRD_SIZE * 1.5, BIRD_SIZE * 1.5);

        // Controls
        this.input.on('pointerdown', this.flap, this);
        this.input.keyboard!.on('keydown-SPACE', this.flap, this);
        this.input.keyboard!.on('keydown-UP', this.flap, this);
        this.input.keyboard!.on('keydown-W', this.flap, this);

        // Score
        this.scoreText = this.add.text(GAME_WIDTH / 2, 80, '0', {
            fontSize: '48px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(20);

        // Collisions
        this.physics.add.collider(this.bird, this.ground, this.gameOver, undefined, this);
        this.physics.add.overlap(this.bird, this.pipes, this.gameOver, undefined, this);

        // Pipe Spawning
        this.pipeTimer = this.time.addEvent({
            delay: 1500,
            callback: this.spawnPipe,
            callbackScope: this,
            loop: true
        });
    }

    spawnCloud(initial: boolean = false) {
        const x = initial ? Phaser.Math.Between(0, GAME_WIDTH) : GAME_WIDTH + 50;
        const y = Phaser.Math.Between(50, 300);
        const cloud = this.add.image(x, y, 'cloud');
        this.clouds.add(cloud);
        
        this.tweens.add({
            targets: cloud,
            x: -100,
            duration: Phaser.Math.Between(10000, 15000),
            onComplete: () => cloud.destroy()
        });
    }

    spawnPipe() {
        if (this.isGameOver) return;

        const gapY = Phaser.Math.Between(150, GAME_HEIGHT - 250);
        
        // Top Pipe
        const topPipe = this.pipes.create(GAME_WIDTH + 50, gapY - PIPE_GAP/2, 'pipe');
        topPipe.setOrigin(0.5, 1); // Anchor bottom center
        topPipe.setFlipY(true);
        topPipe.body.allowGravity = false;
        topPipe.setVelocityX(-200);
        topPipe.setImmovable(true);

        // Bottom Pipe
        const bottomPipe = this.pipes.create(GAME_WIDTH + 50, gapY + PIPE_GAP/2, 'pipe');
        bottomPipe.setOrigin(0.5, 0); // Anchor top center
        bottomPipe.body.allowGravity = false;
        bottomPipe.setVelocityX(-200);
        bottomPipe.setImmovable(true);

        // Score trigger (invisible zone between pipes)
        const scoreZone = this.add.zone(GAME_WIDTH + 50, gapY, 1, PIPE_GAP);
        this.physics.add.existing(scoreZone);
        (scoreZone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        (scoreZone.body as Phaser.Physics.Arcade.Body).setVelocityX(-200);
        
        this.physics.add.overlap(this.bird, scoreZone, (bird, zone) => {
            (zone as Phaser.GameObjects.Zone).destroy();
            this.incrementScore();
        }, undefined, this);
    }

    flap() {
        if (this.isGameOver) return;
        this.bird.setVelocityY(-350);
        
        this.tweens.add({
            targets: this.bird,
            angle: -25,
            duration: 100,
            ease: 'Power1'
        });
    }

    incrementScore() {
        this.score++;
        this.scoreText.setText(this.score.toString());
        this.onScoreUpdate(this.score);
        
        // Increase difficulty slightly
        if (this.score % 5 === 0) {
            this.pipes.getChildren().forEach((pipe: any) => {
                if (pipe.body) pipe.body.velocity.x -= 20;
            });
        }
    }

    gameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        
        this.physics.pause();
        this.bird.setTint(0xff0000);
        
        if (this.pipeTimer) this.pipeTimer.remove();
        
        this.onGameOver(this.score);
    }

    update() {
        if (this.isGameOver) return;

        // Rotate bird based on velocity
        if (this.bird.body!.velocity.y > 0) {
            if (this.bird.angle < 90) this.bird.angle += 2.5;
        }

        // Move ground
        this.ground.tilePositionX += 2;

        // Cleanup pipes
        this.pipes.children.entries.forEach((pipe: any) => {
            if (pipe.x < -50) pipe.destroy();
        });
    }
}

const Flappy: React.FC = () => {
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameOver'>('start');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(() => {
        const saved = localStorage.getItem('flappy-highscore');
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
                backgroundColor: '#70C5CE',
                physics: {
                    default: 'arcade',
                    arcade: {
                        gravity: { x: 0, y: 0 },
                        debug: false
                    }
                },
                scene: new FlappyScene(
                    (finalScore) => {
                        setScore(finalScore);
                        if (finalScore > highScore) {
                            setHighScore(finalScore);
                            localStorage.setItem('flappy-highscore', finalScore.toString());
                        }
                        setGameState('gameOver');
                    },
                    (currentScore) => {
                        setScore(currentScore);
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
    };

    const restartGame = () => {
        setGameState('playing');
        setScore(0);
    };

    if (gameState === 'start') {
        return (
            <GameStartScreen
                title="🐦 FLAPPY BIRD"
                description="¡Ayuda al pájaro a volar entre las tuberías!"
                highScore={highScore}
                instructions={[
                    {
                        title: 'Controles',
                        items: [
                            '🚀 Espacio/↑/W: Aletear hacia arriba',
                            '🖱️ Click: También hace aletear'
                        ],
                        icon: '🎮'
                    },
                    {
                        title: 'Objetivo',
                        items: [
                            '📊 1 punto por tubería pasada',
                            '⚡ La velocidad aumenta cada 5 puntos'
                        ],
                        icon: '🎯'
                    },
                    {
                        title: 'Consejos',
                        items: [
                            'El timing es la clave del éxito',
                            'No aletees demasiado seguido',
                            'Mantén una altitud constante'
                        ],
                        icon: '💡'
                    }
                ]}
                onStart={startGame}
                theme={{
                    primary: '#FFD700',
                    secondary: '#FFA500',
                    accent: '#70C5CE',
                    background: 'linear-gradient(135deg, #70C5CE 0%, #8BC34A 100%)'
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
                    primary: '#FFD700',
                    secondary: '#FFA500',
                    accent: '#70C5CE',
                    background: 'linear-gradient(135deg, #70C5CE 0%, #8BC34A 100%)'
                }}
                customStats={[
                    { label: 'Puntuación', value: score },
                    { label: 'Récord', value: highScore }
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
            background: 'linear-gradient(135deg, #70C5CE 0%, #8BC34A 100%)',
            minHeight: '100dvh',
            fontFamily: 'Arial, sans-serif',
            color: '#2E7D32'
        }}>
            <h1 style={{ margin: '0 0 20px 0', fontSize: '2.5rem' }}>🐦 FLAPPY BIRD</h1>
            <div id="phaser-game" style={{ border: '3px solid #FFD700', borderRadius: '10px', overflow: 'hidden' }} />
            <div style={{ marginTop: '20px', fontSize: '1.2rem' }}>
                <p>Espacio/↑/W/Click para aletear</p>
            </div>
        </div>
    );
};

export default Flappy;
