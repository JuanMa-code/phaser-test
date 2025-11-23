import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import GameStartScreen from '../components/GameStartScreen';
import GameOverScreen from '../components/GameOverScreen';

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const DOODLE_SIZE = 40;
const PLATFORM_WIDTH = 70;
const PLATFORM_HEIGHT = 15;

class DoodleJumpScene extends Phaser.Scene {
    private doodle!: Phaser.Physics.Arcade.Sprite;
    private platforms!: Phaser.Physics.Arcade.Group;
    private powerUps!: Phaser.Physics.Arcade.Group;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: {
        left: Phaser.Input.Keyboard.Key;
        right: Phaser.Input.Keyboard.Key;
    };
    private scoreText!: Phaser.GameObjects.Text;
    private heightText!: Phaser.GameObjects.Text;
    
    private score: number = 0;
    private maxHeight: number = 0;
    private cameraY: number = 0;
    private isGameOver: boolean = false;
    private onGameOver: (score: number) => void;

    // Power-up states
    private jetpackTime: number = 0;
    private springBoost: number = 0;
    private shieldTime: number = 0;

    constructor(onGameOver: (score: number) => void) {
        super('DoodleJumpScene');
        this.onGameOver = onGameOver;
    }

    preload() {
        // Create textures programmatically
        this.createTextures();
    }

    createTextures() {
        // Doodle texture
        const doodleGraphics = this.make.graphics({ x: 0, y: 0 });
        
        // Body
        doodleGraphics.fillStyle(0x90EE90);
        doodleGraphics.fillEllipse(DOODLE_SIZE/2, DOODLE_SIZE/2, DOODLE_SIZE * 0.6, DOODLE_SIZE * 0.8);
        
        // Eyes
        doodleGraphics.fillStyle(0x000000);
        doodleGraphics.fillCircle(DOODLE_SIZE/2 - 8, DOODLE_SIZE/2 - 12, 3);
        doodleGraphics.fillCircle(DOODLE_SIZE/2 + 8, DOODLE_SIZE/2 - 12, 3);
        
        // Eye shine
        doodleGraphics.fillStyle(0xFFFFFF);
        doodleGraphics.fillCircle(DOODLE_SIZE/2 - 7, DOODLE_SIZE/2 - 13, 1);
        doodleGraphics.fillCircle(DOODLE_SIZE/2 + 9, DOODLE_SIZE/2 - 13, 1);
        
        // Nose
        doodleGraphics.fillStyle(0x228B22);
        doodleGraphics.fillEllipse(DOODLE_SIZE/2, DOODLE_SIZE/2 - 5, 3, 2);
        
        // Legs
        doodleGraphics.fillStyle(0x32CD32);
        doodleGraphics.fillEllipse(DOODLE_SIZE/2 - 12, DOODLE_SIZE/2 + 15, 6, 10);
        doodleGraphics.fillEllipse(DOODLE_SIZE/2 + 12, DOODLE_SIZE/2 + 15, 6, 10);
        
        // Feet
        doodleGraphics.fillStyle(0x228B22);
        doodleGraphics.fillEllipse(DOODLE_SIZE/2 - 15, DOODLE_SIZE/2 + 22, 8, 4);
        doodleGraphics.fillEllipse(DOODLE_SIZE/2 + 15, DOODLE_SIZE/2 + 22, 8, 4);
        
        doodleGraphics.generateTexture('doodle', DOODLE_SIZE, DOODLE_SIZE);

        // Jetpack Doodle texture
        doodleGraphics.clear();
        doodleGraphics.fillStyle(0xFF6B35); // Orange body
        doodleGraphics.fillEllipse(DOODLE_SIZE/2, DOODLE_SIZE/2, DOODLE_SIZE * 0.6, DOODLE_SIZE * 0.8);
        // ... (rest of doodle features)
        doodleGraphics.fillStyle(0x000000);
        doodleGraphics.fillCircle(DOODLE_SIZE/2 - 8, DOODLE_SIZE/2 - 12, 3);
        doodleGraphics.fillCircle(DOODLE_SIZE/2 + 8, DOODLE_SIZE/2 - 12, 3);
        doodleGraphics.fillStyle(0xFFFFFF);
        doodleGraphics.fillCircle(DOODLE_SIZE/2 - 7, DOODLE_SIZE/2 - 13, 1);
        doodleGraphics.fillCircle(DOODLE_SIZE/2 + 9, DOODLE_SIZE/2 - 13, 1);
        doodleGraphics.fillStyle(0x228B22);
        doodleGraphics.fillEllipse(DOODLE_SIZE/2, DOODLE_SIZE/2 - 5, 3, 2);
        
        // Jetpack
        doodleGraphics.fillStyle(0xFF4500, 0.8);
        doodleGraphics.fillEllipse(DOODLE_SIZE/2 - 20, DOODLE_SIZE/2 + 10, 8, 15);
        doodleGraphics.fillEllipse(DOODLE_SIZE/2 + 20, DOODLE_SIZE/2 + 10, 8, 15);
        doodleGraphics.fillStyle(0xFFD700, 0.6);
        doodleGraphics.fillEllipse(DOODLE_SIZE/2 - 20, DOODLE_SIZE/2 + 25, 6, 12);
        doodleGraphics.fillEllipse(DOODLE_SIZE/2 + 20, DOODLE_SIZE/2 + 25, 6, 12);
        
        doodleGraphics.generateTexture('doodle-jetpack', DOODLE_SIZE, DOODLE_SIZE);

        // Platform textures
        const platformGraphics = this.make.graphics({ x: 0, y: 0 });
        
        // Normal
        platformGraphics.fillStyle(0x228B22);
        platformGraphics.fillRoundedRect(0, 0, PLATFORM_WIDTH, PLATFORM_HEIGHT, 7);
        platformGraphics.lineStyle(2, 0x32CD32);
        for (let i = 5; i < PLATFORM_WIDTH - 5; i += 8) {
            platformGraphics.moveTo(i, 2);
            platformGraphics.lineTo(i + 2, -2);
            platformGraphics.lineTo(i + 4, 2);
        }
        platformGraphics.strokePath();
        platformGraphics.generateTexture('platform-normal', PLATFORM_WIDTH, PLATFORM_HEIGHT);
        
        // Spring Platform
        platformGraphics.clear();
        platformGraphics.fillStyle(0x228B22);
        platformGraphics.fillRoundedRect(0, 0, PLATFORM_WIDTH, PLATFORM_HEIGHT, 7);
        platformGraphics.fillStyle(0xFF6B35);
        platformGraphics.fillEllipse(PLATFORM_WIDTH / 2, PLATFORM_HEIGHT / 2, 12, 8);
        platformGraphics.fillStyle(0xFFD700);
        platformGraphics.fillEllipse(PLATFORM_WIDTH / 2, PLATFORM_HEIGHT / 2, 8, 5);
        platformGraphics.generateTexture('platform-spring', PLATFORM_WIDTH, PLATFORM_HEIGHT);

        // Moving Platform
        platformGraphics.clear();
        platformGraphics.fillStyle(0x4169E1);
        platformGraphics.fillRoundedRect(0, 0, PLATFORM_WIDTH, PLATFORM_HEIGHT, 7);
        platformGraphics.fillStyle(0xFFFFFF);
        platformGraphics.fillTriangle(10, 7, 15, 3, 15, 11);
        platformGraphics.fillTriangle(PLATFORM_WIDTH - 10, 7, PLATFORM_WIDTH - 15, 3, PLATFORM_WIDTH - 15, 11);
        platformGraphics.generateTexture('platform-moving', PLATFORM_WIDTH, PLATFORM_HEIGHT);

        // Breakable Platform
        platformGraphics.clear();
        platformGraphics.fillStyle(0x8B4513);
        platformGraphics.fillRoundedRect(0, 0, PLATFORM_WIDTH, PLATFORM_HEIGHT, 7);
        platformGraphics.lineStyle(2, 0x654321);
        platformGraphics.moveTo(20, 2);
        platformGraphics.lineTo(30, PLATFORM_HEIGHT - 2);
        platformGraphics.moveTo(40, 2);
        platformGraphics.lineTo(50, PLATFORM_HEIGHT - 2);
        platformGraphics.strokePath();
        platformGraphics.generateTexture('platform-breakable', PLATFORM_WIDTH, PLATFORM_HEIGHT);

        // PowerUps
        const powerUpGraphics = this.make.graphics({ x: 0, y: 0 });
        
        // Jetpack
        powerUpGraphics.fillStyle(0xFF6B35);
        powerUpGraphics.fillRoundedRect(0, 0, 16, 24, 4);
        powerUpGraphics.fillStyle(0xFFD700);
        powerUpGraphics.fillCircle(4, 4, 3);
        powerUpGraphics.fillCircle(12, 4, 3);
        powerUpGraphics.generateTexture('powerup-jetpack', 16, 24);

        // Spring
        powerUpGraphics.clear();
        powerUpGraphics.fillStyle(0x32CD32);
        powerUpGraphics.fillEllipse(8, 5, 15, 10);
        powerUpGraphics.fillStyle(0xFFD700);
        powerUpGraphics.fillEllipse(8, 5, 10, 6);
        powerUpGraphics.generateTexture('powerup-spring', 16, 10);

        // Shield
        powerUpGraphics.clear();
        powerUpGraphics.lineStyle(3, 0x00BFFF);
        powerUpGraphics.fillStyle(0x87CEEB, 0.5);
        powerUpGraphics.fillCircle(12, 12, 12);
        powerUpGraphics.strokeCircle(12, 12, 12);
        powerUpGraphics.generateTexture('powerup-shield', 24, 24);

        // Cloud
        const cloudGraphics = this.make.graphics({ x: 0, y: 0 });
        cloudGraphics.fillStyle(0xFFFFFF, 0.7);
        cloudGraphics.fillCircle(20, 20, 20);
        cloudGraphics.fillCircle(45, 20, 25);
        cloudGraphics.fillCircle(70, 20, 20);
        cloudGraphics.fillCircle(35, 10, 15);
        cloudGraphics.fillCircle(55, 12, 18);
        cloudGraphics.generateTexture('cloud', 100, 50);
    }

    create() {
        this.physics.world.setBounds(0, -100000, GAME_WIDTH, 100000 + GAME_HEIGHT);
        
        // Background
        this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x87CEEB).setOrigin(0).setScrollFactor(0);
        
        // Clouds
        for (let i = 0; i < 8; i++) {
            const x = Phaser.Math.Between(0, GAME_WIDTH);
            const y = Phaser.Math.Between(0, GAME_HEIGHT);
            this.add.image(x, y, 'cloud').setScrollFactor(0.3);
        }

        // Groups
        this.platforms = this.physics.add.group({
            immovable: true,
            allowGravity: false
        });

        this.powerUps = this.physics.add.group({
            immovable: true,
            allowGravity: false
        });

        // Initial platforms
        this.createPlatform(GAME_WIDTH / 2, GAME_HEIGHT - 50, 'normal');
        for (let i = 1; i < 20; i++) {
            const x = Phaser.Math.Between(PLATFORM_WIDTH/2, GAME_WIDTH - PLATFORM_WIDTH/2);
            const y = GAME_HEIGHT - 50 - (i * 80);
            this.createPlatform(x, y);
            
            if (i > 3 && Math.random() < 0.15) {
                this.createPowerUp(x, y - 30);
            }
        }

        // Doodle
        this.doodle = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT - 150, 'doodle');
        this.doodle.setCollideWorldBounds(false);
        this.doodle.setGravityY(800);
        this.doodle.setDepth(10);

        // Controls
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.wasd = {
                left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
                right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
            };
        }

        // UI
        this.scoreText = this.add.text(10, 10, 'Score: 0', {
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setScrollFactor(0).setDepth(100);

        this.heightText = this.add.text(10, 40, 'Height: 0m', {
            fontSize: '20px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setScrollFactor(0).setDepth(100);

        // Collisions
        this.physics.add.overlap(this.doodle, this.platforms, this.handlePlatformCollision, undefined, this);
        this.physics.add.overlap(this.doodle, this.powerUps, this.handlePowerUpCollision, undefined, this);

        // Camera
        this.cameras.main.startFollow(this.doodle, true, 0, 1);
        this.cameras.main.setDeadzone(0, 200);
        this.cameras.main.setBounds(0, -100000, GAME_WIDTH, 100000 + GAME_HEIGHT);
    }

    createPlatform(x: number, y: number, type?: string) {
        if (!type) {
            const types = ['normal', 'spring', 'moving', 'breakable'];
            type = y < -500 && Math.random() < 0.3 ? 
                types[Math.floor(Math.random() * types.length)] : 'normal';
        }

        const texture = `platform-${type}`;
        const platform = this.platforms.create(x, y, texture);
        platform.setData('type', type);
        
        if (type === 'moving') {
            platform.setVelocityX(100);
            platform.setBounce(1);
            platform.setCollideWorldBounds(true);
        }
    }

    createPowerUp(x: number, y: number) {
        const types = ['jetpack', 'spring', 'shield'];
        const type = types[Math.floor(Math.random() * types.length)];
        const texture = `powerup-${type}`;
        
        const powerUp = this.powerUps.create(x, y, texture);
        powerUp.setData('type', type);
    }

    handlePlatformCollision(obj1: Phaser.GameObjects.GameObject, obj2: Phaser.GameObjects.GameObject) {
        const doodle = obj1 as Phaser.Physics.Arcade.Sprite;
        const platform = obj2 as Phaser.Physics.Arcade.Sprite;
        
        if (doodle.body!.velocity.y > 0 && doodle.y < platform.y) {
            const type = platform.getData('type');
            
            if (type === 'breakable') {
                platform.setAlpha(0.5);
                this.tweens.add({
                    targets: platform,
                    alpha: 0,
                    y: platform.y + 20,
                    duration: 200,
                    onComplete: () => platform.destroy()
                });
            } else {
                if (type === 'spring') {
                    this.springBoost = 1;
                    doodle.setVelocityY(-1000);
                } else {
                    doodle.setVelocityY(-600);
                }
            }
        }
    }

    handlePowerUpCollision(obj1: Phaser.GameObjects.GameObject, obj2: Phaser.GameObjects.GameObject) {
        const powerUp = obj2 as Phaser.Physics.Arcade.Sprite;
        const type = powerUp.getData('type');
        
        powerUp.destroy();
        
        switch (type) {
            case 'jetpack':
                this.jetpackTime = 120;
                this.doodle.setTexture('doodle-jetpack');
                break;
            case 'spring':
                this.springBoost = 1;
                this.doodle.setVelocityY(-1200);
                break;
            case 'shield':
                this.shieldTime = 300;
                break;
        }
    }

    update() {
        if (this.isGameOver) return;

        // Movement
        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            this.doodle.setVelocityX(-300);
            this.doodle.setFlipX(true);
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            this.doodle.setVelocityX(300);
            this.doodle.setFlipX(false);
        } else {
            this.doodle.setVelocityX(this.doodle.body!.velocity.x * 0.9);
        }

        // Screen wrapping
        if (this.doodle.x < -20) this.doodle.x = GAME_WIDTH + 20;
        if (this.doodle.x > GAME_WIDTH + 20) this.doodle.x = -20;

        // Jetpack logic
        if (this.jetpackTime > 0) {
            this.doodle.setVelocityY(-500);
            this.jetpackTime--;
            if (this.jetpackTime === 0) {
                this.doodle.setTexture('doodle');
            }
        }

        // Score update
        const currentHeight = Math.max(0, Math.floor((-this.doodle.y + GAME_HEIGHT - 150) / 10));
        if (currentHeight > this.maxHeight) {
            this.maxHeight = currentHeight;
            this.score = this.maxHeight;
            this.scoreText.setText(`Score: ${this.score}`);
            this.heightText.setText(`Height: ${this.maxHeight}m`);
        }

        // Platform generation and cleanup
        const cameraBottom = this.cameras.main.scrollY + GAME_HEIGHT;
        const cameraTop = this.cameras.main.scrollY;

        // Generate new platforms
        let highestPlatformY = 100000;
        this.platforms.children.entries.forEach((p: any) => {
            if (p.y < highestPlatformY) highestPlatformY = p.y;
        });

        if (highestPlatformY > cameraTop - 100) {
            const x = Phaser.Math.Between(PLATFORM_WIDTH/2, GAME_WIDTH - PLATFORM_WIDTH/2);
            const y = highestPlatformY - Phaser.Math.Between(60, 100);
            this.createPlatform(x, y);
            
            if (Math.random() < 0.1) {
                this.createPowerUp(x, y - 30);
            }
        }

        // Cleanup old platforms
        this.platforms.children.entries.forEach((p: any) => {
            if (p.y > cameraBottom + 100) p.destroy();
        });

        // Game Over
        if (this.doodle.y > cameraBottom + 100) {
            this.isGameOver = true;
            this.onGameOver(this.score);
        }
    }
}

const DoodleJump: React.FC = () => {
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameOver'>('start');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(() => {
        const saved = localStorage.getItem('doodlejump-highscore');
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
                backgroundColor: '#87CEEB',
                physics: {
                    default: 'arcade',
                    arcade: {
                        gravity: { x: 0, y: 0 },
                        debug: false
                    }
                },
                scene: new DoodleJumpScene((finalScore) => {
                    setScore(finalScore);
                    if (finalScore > highScore) {
                        setHighScore(finalScore);
                        localStorage.setItem('doodlejump-highscore', finalScore.toString());
                    }
                    setGameState('gameOver');
                })
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
                title="🦘 DOODLE JUMP"
                description="¡Salta tan alto como puedas sin caer!"
                instructions={[
                    {
                        title: "Controles",
                        items: [
                            "⬅️➡️ Flechas o A/D: Mover horizontalmente",
                            "🔄 Los bordes te teletransportan"
                        ],
                        icon: '🎮'
                    },
                    {
                        title: "Tipos de Plataformas",
                        items: [
                            "🟢 Normales: Salto estándar",
                            "🔵 Móviles: Se mueven de lado a lado",
                            "🟠 Resorte: Super salto hacia arriba",
                            "🟤 Frágiles: Se rompen al tocarlas"
                        ],
                        icon: '🧱'
                    },
                    {
                        title: "Power-ups Especiales",
                        items: [
                            "🚀 Jetpack: Vuelo temporal automático",
                            "⚡ Súper Salto: Impulso extra potente",
                            "🛡️ Escudo: Protección contra caídas"
                        ],
                        icon: '⚡'
                    }
                ]}
                onStart={startGame}
                highScore={highScore}
                theme={{
                    background: 'linear-gradient(135deg, #87CEEB 0%, #98FB98 100%)',
                    accent: 'linear-gradient(45deg, #32CD32, #98FB98, #87CEEB)',
                    primary: 'linear-gradient(45deg, #32CD32, #98FB98)'
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
                customStats={[
                    { label: 'Altura Máxima', value: `${Math.floor(score * 10)}m` }
                ]}
                theme={{
                    background: isNewRecord 
                        ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
                        : 'linear-gradient(135deg, #DC143C 0%, #B22222 100%)',
                    primary: 'linear-gradient(45deg, #32CD32, #98FB98)',
                    secondary: 'linear-gradient(45deg, #87CEEB, #4169E1)'
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
            color: 'white'
        }}>
            <h1 style={{ margin: '0 0 20px 0', fontSize: '2.5rem' }}>🦘 DOODLE JUMP</h1>
            <div id="phaser-game" style={{ border: '3px solid #32CD32', borderRadius: '10px', overflow: 'hidden' }} />
            <div style={{ marginTop: '20px', fontSize: '1.2rem', textAlign: 'center' }}>
                <p>←→ o A/D para mover • ¡Atrapa los power-ups!</p>
            </div>
        </div>
    );
};

export default DoodleJump;
