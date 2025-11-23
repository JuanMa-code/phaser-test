import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import GameStartScreen from '../components/GameStartScreen';
import GameOverScreen from '../components/GameOverScreen';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PADDLE_RADIUS = 35;
const PUCK_RADIUS = 15;
const GOAL_WIDTH = 320;
const GOAL_HEIGHT = 20;

class AirHockeyScene extends Phaser.Scene {
    private playerPaddle!: Phaser.GameObjects.Arc;
    private botPaddle!: Phaser.GameObjects.Arc;
    private puck!: Phaser.GameObjects.Arc;
    
    private puckVx: number = 0;
    private puckVy: number = 0;
    private botTargetX: number = GAME_WIDTH / 2;
    private botTargetY: number = 80;
    
    private onScoreUpdate: (player: number, bot: number) => void;
    private onGameOver: (winner: 'player' | 'bot') => void;
    
    private playerScore: number = 0;
    private botScore: number = 0;
    private gameEnded: boolean = false;

    constructor(onScoreUpdate: (p: number, b: number) => void, onGameOver: (w: 'player' | 'bot') => void) {
        super('AirHockeyScene');
        this.onScoreUpdate = onScoreUpdate;
        this.onGameOver = onGameOver;
    }

    create() {
        this.cameras.main.setBackgroundColor('#0077be');

        // Draw Table
        const table = this.add.graphics();
        
        // Main table
        table.fillStyle(0x004d8f);
        table.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Center line
        table.lineStyle(3, 0xffffff);
        table.beginPath();
        table.moveTo(0, GAME_HEIGHT / 2);
        table.lineTo(GAME_WIDTH, GAME_HEIGHT / 2);
        table.strokePath();

        // Center circle
        table.strokeCircle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 50);

        // Goals
        table.lineStyle(5, 0xff0000);
        table.beginPath();
        table.moveTo((GAME_WIDTH - GOAL_WIDTH) / 2, 0);
        table.lineTo((GAME_WIDTH + GOAL_WIDTH) / 2, 0);
        table.strokePath();
        
        table.beginPath();
        table.moveTo((GAME_WIDTH - GOAL_WIDTH) / 2, GAME_HEIGHT);
        table.lineTo((GAME_WIDTH + GOAL_WIDTH) / 2, GAME_HEIGHT);
        table.strokePath();

        // Goal side borders
        table.lineStyle(3, 0xffffff);
        table.beginPath();
        table.moveTo((GAME_WIDTH - GOAL_WIDTH) / 2, 0);
        table.lineTo((GAME_WIDTH - GOAL_WIDTH) / 2, GOAL_HEIGHT);
        table.moveTo((GAME_WIDTH + GOAL_WIDTH) / 2, 0);
        table.lineTo((GAME_WIDTH + GOAL_WIDTH) / 2, GOAL_HEIGHT);

        table.moveTo((GAME_WIDTH - GOAL_WIDTH) / 2, GAME_HEIGHT);
        table.lineTo((GAME_WIDTH - GOAL_WIDTH) / 2, GAME_HEIGHT - GOAL_HEIGHT);
        table.moveTo((GAME_WIDTH + GOAL_WIDTH) / 2, GAME_HEIGHT);
        table.lineTo((GAME_WIDTH + GOAL_WIDTH) / 2, GAME_HEIGHT - GOAL_HEIGHT);
        table.strokePath();

        // Create objects
        this.playerPaddle = this.add.circle(GAME_WIDTH / 2, GAME_HEIGHT - 80, PADDLE_RADIUS, 0x00ff00);
        this.botPaddle = this.add.circle(GAME_WIDTH / 2, 80, PADDLE_RADIUS, 0xff0000);
        this.puck = this.add.circle(GAME_WIDTH / 2, GAME_HEIGHT / 2, PUCK_RADIUS, 0x333333);
    }

    update() {
        if (this.gameEnded) return;

        const pointer = this.input.activePointer;
        
        // Update Player Paddle
        if (pointer.y > GAME_HEIGHT / 2) {
            const targetX = Phaser.Math.Clamp(pointer.x, PADDLE_RADIUS, GAME_WIDTH - PADDLE_RADIUS);
            const targetY = Phaser.Math.Clamp(pointer.y, GAME_HEIGHT / 2 + PADDLE_RADIUS, GAME_HEIGHT - PADDLE_RADIUS);
            
            this.playerPaddle.x = targetX;
            this.playerPaddle.y = targetY;
        }

        this.updateBot();

        // Update Puck Physics
        this.puck.x += this.puckVx;
        this.puck.y += this.puckVy;

        // Friction
        this.puckVx *= 0.995;
        this.puckVy *= 0.995;

        // Wall Collisions
        if (this.puck.x <= PUCK_RADIUS || this.puck.x >= GAME_WIDTH - PUCK_RADIUS) {
            this.puckVx = -this.puckVx;
            this.puck.x = Phaser.Math.Clamp(this.puck.x, PUCK_RADIUS, GAME_WIDTH - PUCK_RADIUS);
        }

        const goalLeft = (GAME_WIDTH - GOAL_WIDTH) / 2;
        const goalRight = (GAME_WIDTH + GOAL_WIDTH) / 2;

        // Top/Bottom Wall Collisions (excluding goals)
        if ((this.puck.y <= PUCK_RADIUS && (this.puck.x < goalLeft || this.puck.x > goalRight)) ||
            (this.puck.y >= GAME_HEIGHT - PUCK_RADIUS && (this.puck.x < goalLeft || this.puck.x > goalRight))) {
            this.puckVy = -this.puckVy;
            this.puck.y = Phaser.Math.Clamp(this.puck.y, PUCK_RADIUS, GAME_HEIGHT - PUCK_RADIUS);
        }

        // Paddle Collisions
        this.handlePaddleCollision(this.playerPaddle, false);
        this.handlePaddleCollision(this.botPaddle, true);

        this.checkGoal();
    }

    private updateBot() {
        const botSpeed = 6;
        const distanceToPuck = Phaser.Math.Distance.Between(this.puck.x, this.puck.y, this.botPaddle.x, this.botPaddle.y);
        const puckSpeed = Math.sqrt(this.puckVx ** 2 + this.puckVy ** 2);
        
        const puckInBotField = this.puck.y < GAME_HEIGHT / 2;
        const nearTopWall = this.puck.y < 100;
        const centerX = GAME_WIDTH / 2;

        if (puckInBotField && nearTopWall && distanceToPuck < 150) {
            const isLeftSide = this.puck.x < centerX;
            const safeZoneX = isLeftSide ? centerX + 100 : centerX - 100;
            this.botTargetX = safeZoneX;
            this.botTargetY = Math.max(80, this.puck.y + 40);
        } else if (puckInBotField && distanceToPuck < 120 && puckSpeed < 4 && !nearTopWall) {
            const goalCenterX = GAME_WIDTH / 2;
            const goalY = GAME_HEIGHT - 30;
            const angleToGoal = Math.atan2(goalY - this.puck.y, goalCenterX - this.puck.x);
            const attackDistance = PADDLE_RADIUS + PUCK_RADIUS + 15;
            const approachAngle = angleToGoal + Math.PI;
            
            this.botTargetX = this.puck.x + Math.cos(approachAngle) * attackDistance;
            this.botTargetY = this.puck.y + Math.sin(approachAngle) * attackDistance;
            this.botTargetX += Math.sin(Date.now() * 0.005) * 25;
        } else if (puckInBotField && puckSpeed > 0.8) {
            if (nearTopWall) {
                this.botTargetX = this.puck.x;
                this.botTargetY = Math.max(120, this.puck.y + 50);
            } else {
                const pursuit = 0.7;
                this.botTargetX = this.puck.x + (this.puckVx * pursuit);
                this.botTargetY = this.puck.y + (this.puckVy * pursuit);
                this.botTargetY = Math.max(60, this.botTargetY - 25);
            }
        } else if (puckInBotField && puckSpeed < 0.8) {
            if (nearTopWall) {
                this.botTargetX = this.puck.x + (Math.random() - 0.5) * 30;
                this.botTargetY = Math.max(100, this.puck.y + 40);
            } else {
                this.botTargetX = this.puck.x + (Math.random() - 0.5) * 50;
                this.botTargetY = Math.max(60, this.puck.y - 35);
            }
        } else if (this.puckVy < -2 && this.puck.y < GAME_HEIGHT / 2 + 50) {
            const timeToIntercept = (this.puck.y - 100) / Math.abs(this.puckVy);
            const interceptX = this.puck.x + (this.puckVx * timeToIntercept);
            this.botTargetX = Phaser.Math.Clamp(interceptX, PADDLE_RADIUS, GAME_WIDTH - PADDLE_RADIUS);
            this.botTargetY = 100;
        } else {
            const defensiveX = GAME_WIDTH / 2 + (this.puck.x - GAME_WIDTH / 2) * 0.4;
            this.botTargetX = defensiveX;
            this.botTargetY = 90;
        }

        this.botTargetY = Phaser.Math.Clamp(this.botTargetY, 50, GAME_HEIGHT / 2 - PADDLE_RADIUS);
        this.botTargetX = Phaser.Math.Clamp(this.botTargetX, PADDLE_RADIUS, GAME_WIDTH - PADDLE_RADIUS);

        const dx = this.botTargetX - this.botPaddle.x;
        const dy = this.botTargetY - this.botPaddle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 3) {
            const isAttacking = puckInBotField && distanceToPuck < 100 && !nearTopWall;
            const adaptiveSpeed = isAttacking ? botSpeed * 1.5 : botSpeed;
            
            this.botPaddle.x += (dx / distance) * adaptiveSpeed;
            this.botPaddle.y += (dy / distance) * adaptiveSpeed;
        }
    }

    private handlePaddleCollision(paddle: Phaser.GameObjects.Arc, isBot: boolean) {
        const dx = this.puck.x - paddle.x;
        const dy = this.puck.y - paddle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDist = PUCK_RADIUS + PADDLE_RADIUS;

        if (distance < minDist) {
            if (distance > 0) {
                const normalX = dx / distance;
                const normalY = dy / distance;
                
                const overlap = minDist - distance;
                this.puck.x += normalX * overlap;
                this.puck.y += normalY * overlap;
                
                const newSpeed = isBot ? 12 : 15;

                if (isBot && this.puck.y < GAME_HEIGHT / 2) {
                    const goalCenterX = GAME_WIDTH / 2;
                    const goalY = GAME_HEIGHT - 50;
                    const nearTopWall = this.puck.y < 100;

                    if (nearTopWall) {
                        const centerX = GAME_WIDTH / 2;
                        const shootToSide = this.puck.x < centerX ? -1 : 1;
                        this.puckVx = shootToSide * newSpeed * 0.8;
                        this.puckVy = newSpeed * 0.6;
                    } else {
                        const angleToGoal = Math.atan2(goalY - this.puck.y, goalCenterX - this.puck.x);
                        const shotVariation = (Math.random() - 0.5) * 0.6;
                        this.puckVx = Math.cos(angleToGoal + shotVariation) * newSpeed;
                        this.puckVy = Math.sin(angleToGoal + shotVariation) * newSpeed;
                    }
                } else {
                    this.puckVx = normalX * newSpeed;
                    this.puckVy = normalY * newSpeed;
                }
            }
        }
    }

    private checkGoal() {
        const goalLeft = (GAME_WIDTH - GOAL_WIDTH) / 2;
        const goalRight = (GAME_WIDTH + GOAL_WIDTH) / 2;

        if (this.puck.y <= PUCK_RADIUS && this.puck.x >= goalLeft && this.puck.x <= goalRight) {
            this.playerScore++;
            this.onScoreUpdate(this.playerScore, this.botScore);
            if (this.playerScore >= 7) {
                this.gameEnded = true;
                this.onGameOver('player');
            }
            this.resetPuck();
        } else if (this.puck.y >= GAME_HEIGHT - PUCK_RADIUS && this.puck.x >= goalLeft && this.puck.x <= goalRight) {
            this.botScore++;
            this.onScoreUpdate(this.playerScore, this.botScore);
            if (this.botScore >= 7) {
                this.gameEnded = true;
                this.onGameOver('bot');
            }
            this.resetPuck();
        }
    }

    private resetPuck() {
        this.puck.x = GAME_WIDTH / 2;
        this.puck.y = GAME_HEIGHT / 2;
        this.puckVx = 0;
        this.puckVy = 0;
    }
}

const AirHockey: React.FC = () => {
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<Phaser.Game | null>(null);
    const [gameState, setGameState] = useState<'instructions' | 'playing' | 'gameOver'>('instructions');
    const [playerScore, setPlayerScore] = useState(0);
    const [botScore, setBotScore] = useState(0);
    const [winner, setWinner] = useState<'player' | 'bot' | null>(null);

    useEffect(() => {
        if (gameState !== 'playing') return;

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
            parent: gameContainerRef.current || undefined,
            backgroundColor: '#0077be',
            scene: new AirHockeyScene(
                (p, b) => {
                    setPlayerScore(p);
                    setBotScore(b);
                },
                (w) => {
                    setWinner(w);
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
        setPlayerScore(0);
        setBotScore(0);
        setWinner(null);
    };

    const resetGame = () => {
        setGameState('instructions');
        setPlayerScore(0);
        setBotScore(0);
        setWinner(null);
    };

    if (gameState === 'instructions') {
        return (
            <GameStartScreen
                title="🏒 AIR HOCKEY"
                description="¡Golpea el disco hacia la portería del oponente!"
                instructions={[
                    {
                        title: 'Objetivo',
                        items: [
                            'Golpea el disco negro hacia la portería del oponente',
                            '¡Primer jugador en anotar 7 goles gana!'
                        ],
                        icon: '🎯'
                    },
                    {
                        title: 'Controles',
                        items: [
                            'Mueve el mouse para controlar tu paddle verde',
                            'Solo puedes moverte en tu mitad de la mesa'
                        ],
                        icon: '🕹️'
                    },
                    {
                        title: 'Estrategia',
                        items: [
                            'Defiende tu portería',
                            'Aprovecha los rebotes',
                            'El bot rojo es tu oponente'
                        ],
                        icon: '💡'
                    }
                ]}
                onStart={startGame}
                theme={{
                    primary: '#0077be',
                    secondary: '#00a0d6',
                    accent: '#4fc3f7',
                    background: 'linear-gradient(45deg, #0077be 0%, #00a0d6 50%, #4fc3f7 100%)'
                }}
            />
        );
    }

    if (gameState === 'gameOver') {
        return (
            <GameOverScreen
                score={playerScore}
                onRestart={startGame}
                onMenu={resetGame}
                theme={{
                    primary: '#0077be',
                    secondary: '#00a0d6',
                    accent: '#4fc3f7',
                    background: 'linear-gradient(45deg, #0077be 0%, #00a0d6 50%, #4fc3f7 100%)'
                }}
                customStats={[
                    { label: 'Jugador', value: playerScore },
                    { label: 'Bot', value: botScore },
                    { label: 'Resultado', value: winner === 'player' ? '¡VICTORIA!' : 'DERROTA' }
                ]}
            />
        );
    }

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            background: 'linear-gradient(45deg, #0077be 0%, #00a0d6 50%, #4fc3f7 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Arial, sans-serif',
            gap: '1rem'
        }}>
            {/* Marcador */}
            <div style={{
                display: 'flex',
                gap: '3rem',
                fontSize: '2rem',
                fontWeight: 'bold',
                color: 'white',
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '1rem 2rem',
                borderRadius: '20px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
                <div style={{ color: '#4caf50' }}>Jugador: {playerScore}</div>
                <div style={{ color: '#f44336' }}>Bot: {botScore}</div>
            </div>

            {/* Canvas del juego */}
            <div 
                ref={gameContainerRef}
                style={{
                    border: '4px solid white',
                    borderRadius: '10px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    width: GAME_WIDTH,
                    height: GAME_HEIGHT
                }}
            />

            {/* Botón de salir */}
            <button
                onClick={resetGame}
                style={{
                    padding: '0.8rem 1.5rem',
                    fontSize: '1rem',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '25px',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(10px)'
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
            >
                ← Volver al Menú
            </button>
        </div>
    );
};

export default AirHockey;
