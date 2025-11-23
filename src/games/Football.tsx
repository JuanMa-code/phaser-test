import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import GameStartScreen from '../components/GameStartScreen';
import GameOverScreen from '../components/GameOverScreen';

const FIELD_WIDTH = 1000;
const FIELD_HEIGHT = 600;
const PLAYER_SIZE = 15;
const BALL_SIZE = 6;
const GOAL_WIDTH = 80;
const HALF_TIME_DURATION = 180;

interface PlayerData {
    id: number;
    team: 'blue' | 'red';
    position: 'GK' | 'DEF' | 'MID' | 'ATT';
    originalX: number;
    originalY: number;
    speed: number;
    actionZone: { minX: number; maxX: number; minY: number; maxY: number };
}

class FootballScene extends Phaser.Scene {
    private players: Phaser.Physics.Arcade.Sprite[] = [];
    private ball!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: {
        up: Phaser.Input.Keyboard.Key;
        down: Phaser.Input.Keyboard.Key;
        left: Phaser.Input.Keyboard.Key;
        right: Phaser.Input.Keyboard.Key;
    };
    
    private selectedPlayerIndex: number;
    private gameState: {
        currentHalf: 1 | 2;
        timeLeft: number;
        blueScore: number;
        redScore: number;
        isCountdown: boolean;
        gameStarted: boolean;
    };
    
    private onScoreUpdate: (blue: number, red: number) => void;
    private onTimeUpdate: (time: number, half: number) => void;
    private onGameOver: (blue: number, red: number) => void;
    
    private timerEvent!: Phaser.Time.TimerEvent;
    private countdownText!: Phaser.GameObjects.Text;

    constructor(
        selectedPlayerIndex: number,
        onScoreUpdate: (blue: number, red: number) => void,
        onTimeUpdate: (time: number, half: number) => void,
        onGameOver: (blue: number, red: number) => void
    ) {
        super('FootballScene');
        this.selectedPlayerIndex = selectedPlayerIndex;
        this.onScoreUpdate = onScoreUpdate;
        this.onTimeUpdate = onTimeUpdate;
        this.onGameOver = onGameOver;
        
        this.gameState = {
            currentHalf: 1,
            timeLeft: HALF_TIME_DURATION,
            blueScore: 0,
            redScore: 0,
            isCountdown: false,
            gameStarted: false
        };
    }

    preload() {
        this.createTextures();
    }

    createTextures() {
        // Field texture
        const field = this.make.graphics({ x: 0, y: 0 });
        field.fillStyle(0x228B22);
        field.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);
        
        // Lines
        field.lineStyle(3, 0xFFFFFF);
        field.strokeRect(10, 10, FIELD_WIDTH - 20, FIELD_HEIGHT - 20);
        
        // Center line
        field.beginPath();
        field.moveTo(FIELD_WIDTH / 2, 10);
        field.lineTo(FIELD_WIDTH / 2, FIELD_HEIGHT - 10);
        field.strokePath();
        
        // Center circle
        field.strokeCircle(FIELD_WIDTH / 2, FIELD_HEIGHT / 2, 60);
        
        // Goals areas
        field.strokeRect(10, FIELD_HEIGHT / 2 - 100, 120, 200);
        field.strokeRect(10, FIELD_HEIGHT / 2 - 50, 50, 100);
        field.strokeRect(FIELD_WIDTH - 130, FIELD_HEIGHT / 2 - 100, 120, 200);
        field.strokeRect(FIELD_WIDTH - 60, FIELD_HEIGHT / 2 - 50, 50, 100);
        
        field.generateTexture('field', FIELD_WIDTH, FIELD_HEIGHT);

        // Player textures
        const createPlayerTexture = (color: number, name: string) => {
            const g = this.make.graphics({ x: 0, y: 0 });
            g.fillStyle(color);
            g.fillCircle(PLAYER_SIZE, PLAYER_SIZE, PLAYER_SIZE);
            g.lineStyle(2, 0x000000);
            g.strokeCircle(PLAYER_SIZE, PLAYER_SIZE, PLAYER_SIZE);
            g.generateTexture(name, PLAYER_SIZE * 2, PLAYER_SIZE * 2);
        };

        createPlayerTexture(0x0066FF, 'player-blue');
        createPlayerTexture(0xFF0000, 'player-red');

        // Ball texture
        const ball = this.make.graphics({ x: 0, y: 0 });
        ball.fillStyle(0xFFFFFF);
        ball.fillCircle(BALL_SIZE, BALL_SIZE, BALL_SIZE);
        ball.lineStyle(1, 0x000000);
        ball.strokeCircle(BALL_SIZE, BALL_SIZE, BALL_SIZE);
        ball.generateTexture('ball', BALL_SIZE * 2, BALL_SIZE * 2);
    }

    create() {
        this.add.image(FIELD_WIDTH / 2, FIELD_HEIGHT / 2, 'field');
        
        // Physics world bounds
        this.physics.world.setBounds(0, 0, FIELD_WIDTH, FIELD_HEIGHT);

        // Ball
        this.ball = this.physics.add.sprite(FIELD_WIDTH / 2, FIELD_HEIGHT / 2, 'ball');
        this.ball.setCollideWorldBounds(true);
        this.ball.setBounce(0.7);
        this.ball.setDrag(0.98); // Friction
        this.ball.setCircle(BALL_SIZE);

        // Initialize players
        this.initializePlayers();

        // Controls
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.wasd = {
                up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
                down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
                left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
                right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
            };
        }

        // Collisions
        this.players.forEach(player => {
            this.physics.add.collider(player, this.ball, this.handlePlayerBallCollision, undefined, this);
            this.players.forEach(other => {
                if (player !== other) {
                    this.physics.add.collider(player, other);
                }
            });
        });

        // Countdown text
        this.countdownText = this.add.text(FIELD_WIDTH / 2, FIELD_HEIGHT / 2, '', {
            fontSize: '80px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(100);

        // Start game
        this.startCountdown(() => {
            this.gameState.gameStarted = true;
            this.startTimer();
        });
    }

    initializePlayers() {
        // Clear existing players
        this.players.forEach(p => p.destroy());
        this.players = [];

        const bluePositions = [
            { x: 80, y: FIELD_HEIGHT / 2, pos: 'GK' },
            { x: 180, y: FIELD_HEIGHT * 0.3, pos: 'DEF' },
            { x: 180, y: FIELD_HEIGHT * 0.7, pos: 'DEF' },
            { x: 280, y: FIELD_HEIGHT * 0.25, pos: 'MID' },
            { x: 280, y: FIELD_HEIGHT * 0.75, pos: 'MID' },
            { x: 380, y: FIELD_HEIGHT / 2, pos: 'ATT' },
        ];

        const redPositions = [
            { x: FIELD_WIDTH - 80, y: FIELD_HEIGHT / 2, pos: 'GK' },
            { x: FIELD_WIDTH - 180, y: FIELD_HEIGHT * 0.3, pos: 'DEF' },
            { x: FIELD_WIDTH - 180, y: FIELD_HEIGHT * 0.7, pos: 'DEF' },
            { x: FIELD_WIDTH - 280, y: FIELD_HEIGHT * 0.25, pos: 'MID' },
            { x: FIELD_WIDTH - 280, y: FIELD_HEIGHT * 0.75, pos: 'MID' },
            { x: FIELD_WIDTH - 380, y: FIELD_HEIGHT / 2, pos: 'ATT' },
        ];

        // Create Blue Team
        bluePositions.forEach((pos, index) => {
            this.createPlayer(index, pos.x, pos.y, 'blue', pos.pos as any);
        });

        // Create Red Team
        redPositions.forEach((pos, index) => {
            this.createPlayer(index + 6, pos.x, pos.y, 'red', pos.pos as any);
        });
    }

    createPlayer(id: number, x: number, y: number, team: 'blue' | 'red', position: 'GK' | 'DEF' | 'MID' | 'ATT') {
        const texture = team === 'blue' ? 'player-blue' : 'player-red';
        const player = this.physics.add.sprite(x, y, texture);
        
        player.setCollideWorldBounds(true);
        player.setCircle(PLAYER_SIZE);
        player.setDrag(500);
        
        // Store data
        const isControlled = team === 'blue' && id === this.selectedPlayerIndex;
        
        // Highlight controlled player
        if (isControlled) {
            const ring = this.add.graphics();
            ring.lineStyle(3, 0xFFFF00);
            ring.strokeCircle(0, 0, PLAYER_SIZE + 2);
            player.setData('ring', ring);
        }

        // Calculate action zone
        const actionZone = this.calculateActionZone(position, team);

        player.setData('playerData', {
            id,
            team,
            position,
            originalX: x,
            originalY: y,
            speed: position === 'GK' ? 150 : position === 'DEF' ? 180 : position === 'MID' ? 210 : 190,
            actionZone,
            isControlled
        });

        // Add ID text
        const text = this.add.text(0, 0, (id % 6 + 1).toString(), {
            fontSize: '12px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        player.setData('text', text);

        this.players.push(player);
    }

    calculateActionZone(position: string, team: string) {
        const isBlue = team === 'blue';
        const fieldThird = FIELD_WIDTH / 3;
        
        // Simplified zones for Phaser implementation
        switch (position) {
            case 'GK':
                return isBlue 
                    ? { minX: 10, maxX: fieldThird * 0.5, minY: 50, maxY: FIELD_HEIGHT - 50 }
                    : { minX: fieldThird * 2.5, maxX: FIELD_WIDTH - 10, minY: 50, maxY: FIELD_HEIGHT - 50 };
            case 'DEF':
                return isBlue 
                    ? { minX: 10, maxX: fieldThird * 1.5, minY: 20, maxY: FIELD_HEIGHT - 20 }
                    : { minX: fieldThird * 1.5, maxX: FIELD_WIDTH - 10, minY: 20, maxY: FIELD_HEIGHT - 20 };
            case 'MID':
                return isBlue 
                    ? { minX: fieldThird * 0.6, maxX: fieldThird * 2.9, minY: 20, maxY: FIELD_HEIGHT - 20 }
                    : { minX: fieldThird * 0.1, maxX: fieldThird * 2.4, minY: 20, maxY: FIELD_HEIGHT - 20 };
            case 'ATT':
                return isBlue 
                    ? { minX: fieldThird * 1.5, maxX: FIELD_WIDTH - 10, minY: 20, maxY: FIELD_HEIGHT - 20 }
                    : { minX: 10, maxX: fieldThird * 1.5, minY: 20, maxY: FIELD_HEIGHT - 20 };
            default:
                return { minX: 0, maxX: FIELD_WIDTH, minY: 0, maxY: FIELD_HEIGHT };
        }
    }

    handlePlayerBallCollision(obj1: Phaser.GameObjects.GameObject, obj2: Phaser.GameObjects.GameObject) {
        const player = obj1 as Phaser.Physics.Arcade.Sprite;
        const ball = obj2 as Phaser.Physics.Arcade.Sprite;
        const data = player.getData('playerData');

        // Kick force
        const force = data.isControlled ? 400 : 300;
        
        // Calculate angle
        const angle = Phaser.Math.Angle.Between(player.x, player.y, ball.x, ball.y);
        
        // Apply velocity to ball
        ball.setVelocity(
            Math.cos(angle) * force,
            Math.sin(angle) * force
        );
    }

    startCountdown(callback: () => void) {
        this.gameState.isCountdown = true;
        let count = 3;
        this.countdownText.setText(count.toString());
        this.countdownText.setVisible(true);

        const timer = this.time.addEvent({
            delay: 1000,
            repeat: 3,
            callback: () => {
                count--;
                if (count > 0) {
                    this.countdownText.setText(count.toString());
                } else if (count === 0) {
                    this.countdownText.setText('GO!');
                } else {
                    this.countdownText.setVisible(false);
                    this.gameState.isCountdown = false;
                    callback();
                }
            }
        });
    }

    startTimer() {
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                if (this.gameState.isCountdown) return;
                
                this.gameState.timeLeft--;
                this.onTimeUpdate(this.gameState.timeLeft, this.gameState.currentHalf);

                if (this.gameState.timeLeft <= 0) {
                    this.handleHalfTime();
                }
            }
        });
    }

    handleHalfTime() {
        this.timerEvent.remove();
        
        if (this.gameState.currentHalf === 1) {
            this.gameState.currentHalf = 2;
            this.gameState.timeLeft = HALF_TIME_DURATION;
            this.gameState.gameStarted = false;
            
            // Swap sides logic would go here (simplified: just reset positions)
            this.resetPositions();
            
            this.startCountdown(() => {
                this.gameState.gameStarted = true;
                this.startTimer();
            });
        } else {
            this.gameState.gameStarted = false;
            this.onGameOver(this.gameState.blueScore, this.gameState.redScore);
        }
    }

    resetPositions() {
        this.ball.setPosition(FIELD_WIDTH / 2, FIELD_HEIGHT / 2);
        this.ball.setVelocity(0, 0);
        
        this.players.forEach(player => {
            const data = player.getData('playerData');
            player.setPosition(data.originalX, data.originalY);
            player.setVelocity(0, 0);
        });
    }

    update() {
        if (!this.gameState.gameStarted || this.gameState.isCountdown) return;

        // Update player text and ring positions
        this.players.forEach(player => {
            const text = player.getData('text');
            text.setPosition(player.x, player.y);
            
            const ring = player.getData('ring');
            if (ring) ring.setPosition(player.x, player.y);
        });

        // Ball friction
        this.ball.setVelocity(this.ball.body!.velocity.x * 0.98, this.ball.body!.velocity.y * 0.98);

        // Check goals
        if (this.ball.x < 20 && this.ball.y > FIELD_HEIGHT/2 - GOAL_WIDTH/2 && this.ball.y < FIELD_HEIGHT/2 + GOAL_WIDTH/2) {
            this.handleGoal('red');
        } else if (this.ball.x > FIELD_WIDTH - 20 && this.ball.y > FIELD_HEIGHT/2 - GOAL_WIDTH/2 && this.ball.y < FIELD_HEIGHT/2 + GOAL_WIDTH/2) {
            this.handleGoal('blue');
        }

        // AI and Control
        this.players.forEach(player => {
            const data = player.getData('playerData');
            
            if (data.isControlled) {
                this.handlePlayerControl(player, data);
            } else {
                this.handleAI(player, data);
            }
        });
    }

    handlePlayerControl(player: Phaser.Physics.Arcade.Sprite, data: any) {
        const speed = data.speed;
        let vx = 0;
        let vy = 0;

        if (this.cursors.left.isDown || this.wasd.left.isDown) vx = -speed;
        else if (this.cursors.right.isDown || this.wasd.right.isDown) vx = speed;

        if (this.cursors.up.isDown || this.wasd.up.isDown) vy = -speed;
        else if (this.cursors.down.isDown || this.wasd.down.isDown) vy = speed;

        player.setVelocity(vx, vy);
    }

    handleAI(player: Phaser.Physics.Arcade.Sprite, data: any) {
        // Simplified AI
        const ball = this.ball;
        const distToBall = Phaser.Math.Distance.Between(player.x, player.y, ball.x, ball.y);
        const zone = data.actionZone;
        
        let targetX = data.originalX;
        let targetY = data.originalY;

        // If ball is in zone, go for it
        if (ball.x >= zone.minX && ball.x <= zone.maxX && ball.y >= zone.minY && ball.y <= zone.maxY) {
            targetX = ball.x;
            targetY = ball.y;
        }

        // Move towards target
        this.physics.moveTo(player, targetX, targetY, data.speed);
        
        // Stop if close to target (unless it's the ball)
        if (Phaser.Math.Distance.Between(player.x, player.y, targetX, targetY) < 5 && targetX !== ball.x) {
            player.setVelocity(0, 0);
        }
    }

    handleGoal(scoringTeam: 'blue' | 'red') {
        if (scoringTeam === 'blue') this.gameState.blueScore++;
        else this.gameState.redScore++;
        
        this.onScoreUpdate(this.gameState.blueScore, this.gameState.redScore);
        
        this.countdownText.setText('GOAL!');
        this.countdownText.setVisible(true);
        this.gameState.isCountdown = true;
        
        this.time.delayedCall(2000, () => {
            this.resetPositions();
            this.startCountdown(() => {
                this.gameState.isCountdown = false;
            });
        });
    }
}

const Football: React.FC = () => {
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameOver'>('start');
    const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(0);
    const [scores, setScores] = useState({ blue: 0, red: 0 });
    const [timeInfo, setTimeInfo] = useState({ time: HALF_TIME_DURATION, half: 1 });
    const gameRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        if (gameState === 'playing') {
            const config: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                width: FIELD_WIDTH,
                height: FIELD_HEIGHT,
                parent: 'phaser-game',
                backgroundColor: '#228B22',
                physics: {
                    default: 'arcade',
                    arcade: {
                        gravity: { x: 0, y: 0 },
                        debug: false
                    }
                },
                scene: new FootballScene(
                    selectedPlayerIndex,
                    (blue, red) => setScores({ blue, red }),
                    (time, half) => setTimeInfo({ time, half }),
                    (blue, red) => {
                        setScores({ blue, red });
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
    }, [gameState, selectedPlayerIndex]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (gameState === 'start') {
        return (
            <GameStartScreen
                title="⚽ FÚTBOL"
                description="¡Controla a tu jugador y ayuda a tu equipo a marcar goles!"
                instructions={[
                    {
                        title: 'Controles',
                        items: ['WASD / Flechas: Mover jugador'],
                        icon: '🎮'
                    },
                    {
                        title: 'Reglas',
                        items: [
                            'Acércate a la pelota para patearla',
                            'Tu jugador tiene borde amarillo',
                            'El equipo azul ataca hacia la derecha'
                        ],
                        icon: '📋'
                    }
                ]}
                onStart={() => setGameState('playing')}
                theme={{
                    primary: '#4caf50',
                    secondary: '#2e7d32',
                    accent: '#66bb6a',
                    background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 50%, #66bb6a 100%)'
                }}
            >
                <div style={{
                    marginBottom: '30px',
                    padding: '20px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                    <h3 style={{ color: 'white', marginBottom: '15px' }}>👤 SELECCIONA TU JUGADOR:</h3>
                    <select 
                        value={selectedPlayerIndex} 
                        onChange={(e) => setSelectedPlayerIndex(Number(e.target.value))}
                        style={{
                            padding: '8px 15px',
                            fontSize: '16px',
                            borderRadius: '5px',
                            border: '2px solid #ddd',
                            width: '100%',
                            background: 'rgba(255, 255, 255, 0.9)'
                        }}
                    >
                        <option value={0}>Portero (GK)</option>
                        <option value={1}>Defensa 1 (DEF)</option>
                        <option value={2}>Defensa 2 (DEF)</option>
                        <option value={3}>Medio 1 (MID)</option>
                        <option value={4}>Medio 2 (MID)</option>
                        <option value={5}>Delantero (ATT)</option>
                    </select>
                </div>
            </GameStartScreen>
        );
    }

    if (gameState === 'gameOver') {
        const winner = scores.blue > scores.red ? 'GANÓ EQUIPO AZUL' : 
                      scores.red > scores.blue ? 'GANÓ EQUIPO ROJO' : 'EMPATE';
        return (
            <GameOverScreen
                score={scores.blue}
                onRestart={() => {
                    setScores({ blue: 0, red: 0 });
                    setTimeInfo({ time: HALF_TIME_DURATION, half: 1 });
                    setGameState('playing');
                }}
                onMenu={() => setGameState('start')}
                theme={{
                    primary: '#4caf50',
                    secondary: '#2e7d32',
                    accent: '#66bb6a',
                    background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)'
                }}
                customStats={[
                    { label: 'Equipo Azul', value: scores.blue },
                    { label: 'Equipo Rojo', value: scores.red },
                    { label: 'Resultado', value: winner }
                ]}
            />
        );
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: '100dvh',
            background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
            padding: '20px'
        }}>
            <div style={{
                background: 'rgba(255, 255, 255, 0.9)',
                padding: '15px 30px',
                borderRadius: '15px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '30px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                boxShadow: '0 5px 15px rgba(0,0,0,0.2)'
            }}>
                <div style={{ color: '#0066FF' }}>AZUL: {scores.blue}</div>
                <div style={{ color: '#333', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem' }}>FÚTBOL ⚽</div>
                    <div style={{ fontSize: '0.9rem', marginTop: '5px' }}>
                        {timeInfo.half}° TIEMPO - {formatTime(timeInfo.time)}
                    </div>
                </div>
                <div style={{ color: '#FF0000' }}>ROJO: {scores.red}</div>
            </div>
            
            <div id="phaser-game" style={{ 
                border: '4px solid #fff', 
                borderRadius: '10px', 
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                overflow: 'hidden'
            }} />
            
            <div style={{
                marginTop: '20px',
                background: 'rgba(255, 255, 255, 0.9)',
                padding: '15px',
                borderRadius: '10px',
                textAlign: 'center',
                maxWidth: '600px'
            }}>
                <p style={{ margin: '5px 0', color: '#333' }}>
                    <strong>Controles:</strong> WASD o Flechas para mover
                </p>
                <p style={{ margin: '5px 0', color: '#666', fontSize: '0.9rem' }}>
                    Tu jugador tiene un borde amarillo. Acércate a la pelota para patearla.
                </p>
            </div>
        </div>
    );
};

export default Football;
