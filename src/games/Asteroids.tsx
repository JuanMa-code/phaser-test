import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import GameStartScreen from '../components/GameStartScreen';
import GameOverScreen from '../components/GameOverScreen';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const SHIP_SIZE = 15;
const LARGE_ASTEROID = 40;
const MEDIUM_ASTEROID = 25;
const SMALL_ASTEROID = 15;
const BULLET_SPEED = 400;
const MAX_SPEED = 300;
const DRAG = 0.99;
const ROTATION_SPEED = 200;
const ACCELERATION = 200;

class AsteroidsScene extends Phaser.Scene {
    private ship!: Phaser.GameObjects.Container;
    private shipGraphics!: Phaser.GameObjects.Graphics;
    private asteroids!: Phaser.Physics.Arcade.Group;
    private bullets!: Phaser.Physics.Arcade.Group;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: { W: Phaser.Input.Keyboard.Key, A: Phaser.Input.Keyboard.Key, D: Phaser.Input.Keyboard.Key };
    private spaceKey!: Phaser.Input.Keyboard.Key;
    
    private score: number = 0;
    private lives: number = 3;
    private level: number = 1;
    private invulnerable: boolean = false;
    private invulnerableTime: number = 0;

    private onScoreUpdate: (score: number) => void;
    private onLivesUpdate: (lives: number) => void;
    private onLevelUpdate: (level: number) => void;
    private onGameOver: (score: number) => void;

    constructor(
        onScoreUpdate: (s: number) => void, 
        onLivesUpdate: (l: number) => void, 
        onLevelUpdate: (l: number) => void,
        onGameOver: (s: number) => void
    ) {
        super('AsteroidsScene');
        this.onScoreUpdate = onScoreUpdate;
        this.onLivesUpdate = onLivesUpdate;
        this.onLevelUpdate = onLevelUpdate;
        this.onGameOver = onGameOver;
    }

    create() {
        this.cameras.main.setBackgroundColor('#000011');

        // Stars
        const stars = this.add.graphics();
        stars.fillStyle(0xffffff);
        for (let i = 0; i < 150; i++) {
            stars.fillCircle(Math.random() * GAME_WIDTH, Math.random() * GAME_HEIGHT, Math.random() * 1.5);
        }

        // Groups
        this.asteroids = this.physics.add.group();
        this.bullets = this.physics.add.group();

        // Ship
        this.createShip();

        // Inputs
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.wasd = this.input.keyboard.addKeys('W,A,D') as any;
            this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        }

        this.input.keyboard?.on('keydown-SPACE', this.fireBullet, this);

        // Initial Asteroids
        this.createInitialAsteroids();

        // Collisions
        this.physics.add.overlap(this.bullets, this.asteroids, this.bulletHitAsteroid, undefined, this);
        this.physics.add.overlap(this.ship, this.asteroids, this.shipHitAsteroid, undefined, this);
    }

    update(time: number, delta: number) {
        this.handleShipMovement(delta);
        this.physics.world.wrap(this.ship, SHIP_SIZE);
        this.physics.world.wrap(this.asteroids, LARGE_ASTEROID);
        this.physics.world.wrap(this.bullets, 0);

        // Remove bullets that have traveled too far (optional, or just wrap them? Original code removed them off screen)
        // Since we wrap bullets, we need a lifespan.
        this.bullets.getChildren().forEach((b: any) => {
            b.lifespan -= delta;
            if (b.lifespan <= 0) {
                b.destroy();
            }
        });

        if (this.invulnerable) {
            this.invulnerableTime -= delta;
            if (this.invulnerableTime <= 0) {
                this.invulnerable = false;
                this.ship.alpha = 1;
            } else {
                this.ship.alpha = 0.5 + Math.sin(time / 50) * 0.5;
            }
        }

        if (this.asteroids.countActive() === 0) {
            this.level++;
            this.onLevelUpdate(this.level);
            this.createInitialAsteroids();
        }
    }

    private createShip() {
        this.ship = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
        this.shipGraphics = this.add.graphics();
        this.drawShipGraphics(false);
        this.ship.add(this.shipGraphics);
        
        this.physics.add.existing(this.ship);
        const body = this.ship.body as Phaser.Physics.Arcade.Body;
        body.setDrag(DRAG);
        body.setMaxVelocity(MAX_SPEED);
        body.setCircle(SHIP_SIZE, -SHIP_SIZE, -SHIP_SIZE);
    }

    private drawShipGraphics(thrusting: boolean) {
        this.shipGraphics.clear();
        const color = 0x00ffff;
        this.shipGraphics.lineStyle(2, color);
        this.shipGraphics.fillStyle(color, 0.3);
        
        this.shipGraphics.beginPath();
        this.shipGraphics.moveTo(0, -SHIP_SIZE);
        this.shipGraphics.lineTo(SHIP_SIZE, SHIP_SIZE);
        this.shipGraphics.lineTo(0, SHIP_SIZE * 0.5);
        this.shipGraphics.lineTo(-SHIP_SIZE, SHIP_SIZE);
        this.shipGraphics.closePath();
        this.shipGraphics.strokePath();
        this.shipGraphics.fillPath();

        if (thrusting) {
            this.shipGraphics.lineStyle(2, 0xff4400);
            this.shipGraphics.fillStyle(0xff4400, 0.7);
            this.shipGraphics.beginPath();
            this.shipGraphics.moveTo(-SHIP_SIZE * 0.5, SHIP_SIZE);
            this.shipGraphics.lineTo(0, SHIP_SIZE * 1.8 + Math.random() * 5);
            this.shipGraphics.lineTo(SHIP_SIZE * 0.5, SHIP_SIZE);
            this.shipGraphics.closePath();
            this.shipGraphics.strokePath();
            this.shipGraphics.fillPath();
        }
    }

    private handleShipMovement(delta: number) {
        const body = this.ship.body as Phaser.Physics.Arcade.Body;
        let thrusting = false;

        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            body.setAngularVelocity(-ROTATION_SPEED);
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            body.setAngularVelocity(ROTATION_SPEED);
        } else {
            body.setAngularVelocity(0);
        }

        if (this.cursors.up.isDown || this.wasd.W.isDown) {
            this.physics.velocityFromRotation(this.ship.rotation - Math.PI / 2, ACCELERATION, body.acceleration);
            thrusting = true;
        } else {
            body.setAcceleration(0);
        }

        this.drawShipGraphics(thrusting);
    }

    private fireBullet() {
        if (!this.ship.active) return;
        if (this.bullets.countActive() >= 4) return;

        const bullet = this.add.circle(this.ship.x, this.ship.y, 2, 0xffff00);
        this.physics.add.existing(bullet);
        const body = bullet.body as Phaser.Physics.Arcade.Body;
        
        // Fire from nose of ship
        const angle = this.ship.rotation - Math.PI / 2;
        const vec = this.physics.velocityFromRotation(angle, BULLET_SPEED);
        
        bullet.setPosition(
            this.ship.x + Math.cos(angle) * SHIP_SIZE,
            this.ship.y + Math.sin(angle) * SHIP_SIZE
        );
        
        body.setVelocity(vec.x, vec.y);
        
        // Add custom property for lifespan
        (bullet as any).lifespan = 2000; // 2 seconds
        
        this.bullets.add(bullet);
    }

    private createInitialAsteroids() {
        const numAsteroids = 4 + this.level * 2;
        for (let i = 0; i < numAsteroids; i++) {
            let x, y;
            do {
                x = Math.random() * GAME_WIDTH;
                y = Math.random() * GAME_HEIGHT;
            } while (Phaser.Math.Distance.Between(x, y, this.ship.x, this.ship.y) < 150);
            
            this.createAsteroid(x, y, 'large');
        }
    }

    private createAsteroid(x: number, y: number, size: 'large' | 'medium' | 'small') {
        const radius = size === 'large' ? LARGE_ASTEROID : size === 'medium' ? MEDIUM_ASTEROID : SMALL_ASTEROID;
        const asteroid = this.add.graphics();
        
        const points = 8 + Math.floor(Math.random() * 4);
        const colors = [0xaaaaaa, 0x888888, 0x666666];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        asteroid.fillStyle(color);
        asteroid.lineStyle(1, 0xcccccc);
        
        asteroid.beginPath();
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const r = radius * (0.8 + Math.random() * 0.4);
            const px = Math.cos(angle) * r;
            const py = Math.sin(angle) * r;
            if (i === 0) asteroid.moveTo(px, py);
            else asteroid.lineTo(px, py);
        }
        asteroid.closePath();
        asteroid.fillPath();
        asteroid.strokePath();
        
        asteroid.x = x;
        asteroid.y = y;

        this.physics.add.existing(asteroid);
        const body = asteroid.body as Phaser.Physics.Arcade.Body;
        body.setCircle(radius);
        body.setVelocity(
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 100
        );
        
        asteroid.setData('size', size);
        this.asteroids.add(asteroid);
    }

    private bulletHitAsteroid(bullet: any, asteroid: any) {
        bullet.destroy();
        
        const size = asteroid.getData('size');
        const x = asteroid.x;
        const y = asteroid.y;
        
        asteroid.destroy();

        let points = 0;
        if (size === 'large') {
            points = 20;
            this.createAsteroid(x, y, 'medium');
            this.createAsteroid(x, y, 'medium');
        } else if (size === 'medium') {
            points = 50;
            this.createAsteroid(x, y, 'small');
            this.createAsteroid(x, y, 'small');
        } else {
            points = 100;
        }
        
        this.score += points;
        this.onScoreUpdate(this.score);
    }

    private shipHitAsteroid(ship: any, asteroid: any) {
        if (this.invulnerable) return;

        this.lives--;
        this.onLivesUpdate(this.lives);
        
        if (this.lives <= 0) {
            this.scene.pause();
            this.onGameOver(this.score);
        } else {
            this.respawnShip();
        }
    }

    private respawnShip() {
        this.ship.setPosition(GAME_WIDTH / 2, GAME_HEIGHT / 2);
        const body = this.ship.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);
        body.setAcceleration(0);
        body.setAngularVelocity(0);
        this.ship.rotation = 0;
        
        this.invulnerable = true;
        this.invulnerableTime = 3000; // 3 seconds
    }
}

const Asteroids: React.FC = () => {
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<Phaser.Game | null>(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [level, setLevel] = useState(1);

    useEffect(() => {
        if (!gameStarted || gameOver) return;

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
            parent: gameContainerRef.current || undefined,
            backgroundColor: '#000011',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { x: 0, y: 0 },
                    debug: false
                }
            },
            scene: new AsteroidsScene(
                (s) => setScore(s),
                (l) => setLives(l),
                (lvl) => setLevel(lvl),
                (s) => {
                    setScore(s);
                    setGameOver(true);
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
    }, [gameStarted, gameOver]);

    const startGame = () => {
        setGameStarted(true);
        setGameOver(false);
        setScore(0);
        setLives(3);
        setLevel(1);
    };

    const restartGame = () => {
        setGameOver(false);
        setScore(0);
        setLives(3);
        setLevel(1);
    };

    if (!gameStarted) {
        return (
            <GameStartScreen
                title="🚀 ASTEROIDS"
                description="¡Navega por el espacio y destruye asteroides!"
                instructions={[
                    {
                        title: "Controles",
                        items: [
                            "← → A D: Rotar nave",
                            "↑ W: Acelerar",
                            "Espacio: Disparar"
                        ],
                        icon: "🎮"
                    },
                    {
                        title: "Características",
                        items: [
                            "Inercia y gravedad cero",
                            "Teletransporte en bordes",
                            "3 segundos invulnerable"
                        ],
                        icon: "⭐"
                    }
                ]}
                onStart={startGame}
                theme={{
                    background: 'linear-gradient(135deg, #000011 0%, #001122 100%)',
                    primary: '#00ffff',
                    secondary: '#ffff00',
                    accent: '#ff0080',
                }}
            />
        );
    }

    if (gameOver) {
        return (
            <GameOverScreen
                score={score}
                onRestart={restartGame}
                onMenu={() => setGameStarted(false)}
                theme={{
                    background: 'linear-gradient(135deg, #110000 0%, #220011 100%)',
                    primaryColor: '#00ffff',
                    secondaryColor: '#ffff00',
                    accentColor: '#ff0080',
                    titleGradient: 'linear-gradient(45deg, #ffffff, #00ffff, #ffff00, #ff0080)',
                    buttonGradient: 'linear-gradient(45deg, #00ffff, #ffff00)'
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
            background: 'linear-gradient(135deg, #000011 0%, #001122 100%)',
            minHeight: '100dvh',
            fontFamily: 'Arial, sans-serif',
            color: 'white'
        }}>
            <h1 style={{ margin: '0 0 20px 0', fontSize: '2.5rem' }}>🚀 ASTEROIDS</h1>
            
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                width: GAME_WIDTH, 
                marginBottom: '10px',
                fontSize: '24px'
            }}>
                <div>Score: {score}</div>
                <div style={{ color: '#00ff00' }}>Level: {level}</div>
                <div style={{ color: '#ff0000' }}>Lives: {lives}</div>
            </div>

            <div ref={gameContainerRef} style={{ border: '2px solid #444', borderRadius: '10px' }} />
            <div style={{ marginTop: '20px', fontSize: '1.2rem' }}>
                <p>← → A D rotar, ↑ W acelerar, Espacio disparar</p>
            </div>
        </div>
    );
};

export default Asteroids;
