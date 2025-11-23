import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import GameStartScreen from '../components/GameStartScreen';
import GameOverScreen from '../components/GameOverScreen';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_SPEED = 300;
const BULLET_SPEED = 400;
const INVADER_ROWS = 5;
const INVADER_COLS = 10;

class SpaceInvadersScene extends Phaser.Scene {
    private player!: Phaser.GameObjects.Container;
    private invaders!: Phaser.Physics.Arcade.Group;
    private playerBullets!: Phaser.Physics.Arcade.Group;
    private invaderBullets!: Phaser.Physics.Arcade.Group;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: {
        left: Phaser.Input.Keyboard.Key;
        right: Phaser.Input.Keyboard.Key;
        space: Phaser.Input.Keyboard.Key;
        w: Phaser.Input.Keyboard.Key;
    };
    
    private lastFired = 0;
    private invaderDirection = 1;
    private invaderSpeed = 50;
    private invaderDropDistance = 20;
    private score = 0;
    private lives = 3;
    private wave = 1;
    private isGameOver = false;

    private onScoreUpdate: (score: number) => void;
    private onLivesUpdate: (lives: number) => void;
    private onWaveUpdate: (wave: number) => void;
    private onGameOver: (victory: boolean) => void;

    constructor(
        onScoreUpdate: (score: number) => void,
        onLivesUpdate: (lives: number) => void,
        onWaveUpdate: (wave: number) => void,
        onGameOver: (victory: boolean) => void
    ) {
        super('SpaceInvadersScene');
        this.onScoreUpdate = onScoreUpdate;
        this.onLivesUpdate = onLivesUpdate;
        this.onWaveUpdate = onWaveUpdate;
        this.onGameOver = onGameOver;
    }

    preload() {
        this.createTextures();
    }

    createTextures() {
        // Player Texture
        const playerG = this.make.graphics({ x: 0, y: 0 });
        playerG.fillStyle(0x00ff88);
        playerG.beginPath();
        playerG.moveTo(20, 0);
        playerG.lineTo(0, 40);
        playerG.lineTo(40, 40);
        playerG.closePath();
        playerG.fillPath();
        playerG.lineStyle(2, 0x00ffaa);
        playerG.strokeCircle(20, 20, 10);
        playerG.generateTexture('player', 40, 40);

        // Invader Texture
        const invaderG = this.make.graphics({ x: 0, y: 0 });
        invaderG.fillStyle(0xffffff);
        invaderG.fillRoundedRect(0, 0, 30, 30, 5);
        invaderG.fillStyle(0x000000);
        invaderG.fillCircle(8, 8, 3);
        invaderG.fillCircle(22, 8, 3);
        invaderG.generateTexture('invader', 30, 30);

        // Bullet Texture
        const bulletG = this.make.graphics({ x: 0, y: 0 });
        bulletG.fillStyle(0x00ffff);
        bulletG.fillRoundedRect(0, 0, 6, 12, 2);
        bulletG.generateTexture('bullet', 6, 12);

        // Enemy Bullet Texture
        const enemyBulletG = this.make.graphics({ x: 0, y: 0 });
        enemyBulletG.fillStyle(0xff0000);
        enemyBulletG.fillCircle(3, 3, 3);
        enemyBulletG.generateTexture('enemyBullet', 6, 6);
    }

    create() {
        // Stars background
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(0, GAME_WIDTH);
            const y = Phaser.Math.Between(0, GAME_HEIGHT);
            const alpha = Phaser.Math.FloatBetween(0.2, 1);
            this.add.circle(x, y, Phaser.Math.FloatBetween(0.5, 2), 0xffffff, alpha);
        }

        // Player
        this.player = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 60);
        const playerSprite = this.add.sprite(0, 0, 'player');
        this.player.add(playerSprite);
        this.physics.add.existing(this.player);
        const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
        playerBody.setCollideWorldBounds(true);
        playerBody.setSize(40, 40);
        playerBody.setOffset(-20, -20); // Center body

        // Groups
        this.invaders = this.physics.add.group();
        this.playerBullets = this.physics.add.group();
        this.invaderBullets = this.physics.add.group();

        // Input
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.wasd = {
            left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            space: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
            w: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W)
        };

        this.startWave();
    }

    startWave() {
        this.invaders.clear(true, true);
        this.invaderBullets.clear(true, true);
        this.playerBullets.clear(true, true);
        
        this.invaderSpeed = 50 + (this.wave - 1) * 20;
        this.invaderDirection = 1;

        const colors = [0xff4444, 0xffaa44, 0x44ff44, 0x4444ff, 0xff44ff];

        for (let row = 0; row < INVADER_ROWS; row++) {
            for (let col = 0; col < INVADER_COLS; col++) {
                const x = 80 + col * 60;
                const y = 80 + row * 50;
                const invader = this.invaders.create(x, y, 'invader');
                invader.setTint(colors[row % colors.length]);
            }
        }
    }

    update(time: number, delta: number) {
        if (this.isGameOver) return;

        this.handlePlayerInput(time);
        this.updateInvaders();
        this.checkCollisions();
        this.cleanupBullets();
    }

    handlePlayerInput(time: number) {
        const body = this.player.body as Phaser.Physics.Arcade.Body;

        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            body.setVelocityX(-PLAYER_SPEED);
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            body.setVelocityX(PLAYER_SPEED);
        } else {
            body.setVelocityX(0);
        }

        if ((this.cursors.up.isDown || this.wasd.space.isDown || this.wasd.w.isDown) && time > this.lastFired) {
            this.fireBullet();
            this.lastFired = time + 400; // Fire rate limit
        }
    }

    fireBullet() {
        if (this.playerBullets.countActive() >= 3) return;

        const bullet = this.playerBullets.create(this.player.x, this.player.y - 30, 'bullet');
        bullet.setVelocityY(-BULLET_SPEED);
    }

    updateInvaders() {
        const invaders = this.invaders.getChildren() as Phaser.Physics.Arcade.Sprite[];
        
        if (invaders.length === 0) {
            this.wave++;
            this.onWaveUpdate(this.wave);
            if (this.wave > 10) {
                this.gameOver(true);
            } else {
                this.startWave();
            }
            return;
        }

        // Move invaders
        let shouldDrop = false;
        invaders.forEach(invader => {
            invader.body.velocity.x = this.invaderSpeed * this.invaderDirection;
            
            if ((this.invaderDirection === 1 && invader.x >= GAME_WIDTH - 30) ||
                (this.invaderDirection === -1 && invader.x <= 30)) {
                shouldDrop = true;
            }

            // Random shooting
            if (Phaser.Math.Between(0, 2000) < 5 + this.wave) {
                const bullet = this.invaderBullets.create(invader.x, invader.y + 20, 'enemyBullet');
                bullet.setVelocityY(200 + this.wave * 20);
            }

            // Check if reached bottom
            if (invader.y > GAME_HEIGHT - 100) {
                this.gameOver(false);
            }
        });

        if (shouldDrop) {
            this.invaderDirection *= -1;
            invaders.forEach(invader => {
                invader.y += this.invaderDropDistance;
                invader.x += this.invaderDirection * 10; // Push away from wall slightly
            });
            this.invaderSpeed += 5;
        }
    }

    checkCollisions() {
        // Player bullets vs Invaders
        this.physics.overlap(this.playerBullets, this.invaders, (bullet, invader) => {
            bullet.destroy();
            invader.destroy();
            this.score += 10;
            this.onScoreUpdate(this.score);
        });

        // Invader bullets vs Player
        this.physics.overlap(this.invaderBullets, this.player, (player, bullet) => {
            bullet.destroy();
            this.lives--;
            this.onLivesUpdate(this.lives);
            
            // Flash player
            this.tweens.add({
                targets: this.player,
                alpha: 0,
                duration: 100,
                yoyo: true,
                repeat: 3
            });

            if (this.lives <= 0) {
                this.gameOver(false);
            }
        });
    }

    cleanupBullets() {
        this.playerBullets.children.each((b) => {
            const bullet = b as Phaser.Physics.Arcade.Sprite;
            if (bullet.y < -50) bullet.destroy();
            return true;
        });

        this.invaderBullets.children.each((b) => {
            const bullet = b as Phaser.Physics.Arcade.Sprite;
            if (bullet.y > GAME_HEIGHT + 50) bullet.destroy();
            return true;
        });
    }

    gameOver(victory: boolean) {
        this.isGameOver = true;
        this.physics.pause();
        this.onGameOver(victory);
    }
}

const SpaceInvaders: React.FC = () => {
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [wave, setWave] = useState(1);
    const [victory, setVictory] = useState(false);
    const gameRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        if (gameState === 'playing') {
            const config: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                width: GAME_WIDTH,
                height: GAME_HEIGHT,
                parent: 'phaser-game',
                backgroundColor: '#0a0a1a',
                physics: {
                    default: 'arcade',
                    arcade: {
                        gravity: { x: 0, y: 0 },
                        debug: false
                    }
                },
                scene: new SpaceInvadersScene(
                    setScore,
                    setLives,
                    setWave,
                    (v) => {
                        setVictory(v);
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
        setScore(0);
        setLives(3);
        setWave(1);
        setVictory(false);
        setGameState('playing');
    };

    if (gameState === 'start') {
        return (
            <GameStartScreen
                title="👾 SPACE INVADERS"
                description="¡Defiende la Tierra de la invasión alienígena!"
                instructions={[
                    {
                        title: "Controles",
                        items: [
                            "🎮 ← → A D: Mover nave espacial",
                            "💥 Espacio ↑ W: Disparar láser",
                            "⚡ Máximo 3 balas simultáneas"
                        ],
                        icon: '🎮'
                    },
                    {
                        title: "Sistema de Puntuación",
                        items: [
                            "👾 Destruye alienígenas para ganar puntos",
                            "🌊 Más oleadas = más velocidad",
                            "🏆 ¡Sobrevive 10 oleadas para ganar!"
                        ],
                        icon: '📊'
                    }
                ]}
                onStart={startGame}
                theme={{
                    background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 100%)',
                    accent: 'linear-gradient(45deg, #ff0080, #00ff80, #0080ff)',
                    primary: 'linear-gradient(45deg, #ff0080, #00ff80)'
                }}
            />
        );
    }

    if (gameState === 'gameover') {
        return (
            <GameOverScreen
                score={score}
                onRestart={startGame}
                onMenu={() => setGameState('start')}
                isVictory={victory}
                customStats={[
                    { label: 'Oleadas Completadas', value: wave - 1 },
                    { label: 'Vidas Restantes', value: lives }
                ]}
                theme={{
                    background: victory 
                        ? 'linear-gradient(135deg, #0a1a0a 0%, #1a3a1a 100%)'
                        : 'linear-gradient(135deg, #1a0a0a 0%, #3a1a1a 100%)',
                    primary: 'linear-gradient(45deg, #ff0080, #00ff80)',
                    secondary: 'linear-gradient(45deg, #0a0a1a, #1a1a3a)'
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
            background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 100%)',
            minHeight: '100dvh',
            fontFamily: 'Arial, sans-serif',
            color: 'white'
        }}>
            <h1 style={{ margin: '0 0 20px 0', fontSize: '2.5rem' }}>👾 SPACE INVADERS</h1>
            
            <div style={{ 
                display: 'flex', 
                gap: '2rem', 
                marginBottom: '1rem',
                fontSize: '1.2rem',
                fontWeight: 'bold'
            }}>
                <span>Score: {score}</span>
                <span style={{ color: '#ff0000' }}>Lives: {lives}</span>
                <span style={{ color: '#00ff00' }}>Wave: {wave}</span>
            </div>

            <div id="phaser-game" style={{ border: '2px solid #444', borderRadius: '10px', overflow: 'hidden' }} />
            
            <div style={{ marginTop: '20px', fontSize: '1.2rem' }}>
                <p>← → A D para mover, Espacio ↑ W para disparar</p>
            </div>
        </div>
    );
};

export default SpaceInvaders;
