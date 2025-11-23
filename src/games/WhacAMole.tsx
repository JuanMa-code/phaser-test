import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import GameStartScreen from '../components/GameStartScreen';
import GameOverScreen from '../components/GameOverScreen';

const GAME_WIDTH = 720;
const GAME_HEIGHT = 540;
const HOLE_SIZE = 80;
const MOLE_SIZE = 70;

interface GameSettings {
    moleShowTime: number;
    spawnRate: number;
    maxMoles: number;
}

class WhacAMoleScene extends Phaser.Scene {
    private holes: Phaser.GameObjects.Container[] = [];
    private moles: Phaser.GameObjects.Container[] = [];
    private score = 0;
    private timeLeft = 60;
    private combo = 0;
    private settings: GameSettings;
    private onScoreUpdate: (score: number) => void;
    private onTimeUpdate: (time: number) => void;
    private onComboUpdate: (combo: number) => void;
    private onGameOver: (score: number) => void;
    private gameTimer?: Phaser.Time.TimerEvent;

    constructor(
        settings: GameSettings,
        onScoreUpdate: (score: number) => void,
        onTimeUpdate: (time: number) => void,
        onComboUpdate: (combo: number) => void,
        onGameOver: (score: number) => void
    ) {
        super('WhacAMoleScene');
        this.settings = settings;
        this.onScoreUpdate = onScoreUpdate;
        this.onTimeUpdate = onTimeUpdate;
        this.onComboUpdate = onComboUpdate;
        this.onGameOver = onGameOver;
    }

    create() {
        this.createBackground();
        this.createHoles();
        
        this.gameTimer = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    }

    createBackground() {
        // Grass background
        const bg = this.add.graphics();
        bg.fillStyle(0x2E7D32);
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Random grass blades
        for (let i = 0; i < 50; i++) {
            const grass = this.add.graphics();
            grass.fillStyle(0x4CAF50, Math.random() * 0.3 + 0.7);
            grass.fillRect(0, 0, 15, 8);
            grass.x = Math.random() * GAME_WIDTH;
            grass.y = Math.random() * GAME_HEIGHT;
            grass.rotation = Math.random() * Math.PI;
        }
    }

    createHoles() {
        const rows = 3;
        const cols = 3;
        const startX = 120;
        const startY = 100;
        const spacingX = 180;
        const spacingY = 140;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = startX + col * spacingX;
                const y = startY + row * spacingY;
                
                const holeContainer = this.add.container(x, y);
                
                const hole = this.add.graphics();
                
                // Hole rim
                hole.fillStyle(0x2E7D32);
                hole.fillEllipse(0, -5, HOLE_SIZE / 2 + 5, HOLE_SIZE / 3 + 3);
                
                // Hole interior
                hole.fillStyle(0x1B5E20);
                hole.fillEllipse(0, 0, HOLE_SIZE / 2, HOLE_SIZE / 3);
                
                holeContainer.add(hole);
                this.holes.push(holeContainer);
                
                // Initialize mole slot (null for now)
                this.moles.push(null as any);
            }
        }
    }

    update(time: number, delta: number) {
        if (this.timeLeft <= 0) return;

        const activeMoles = this.moles.filter(m => m !== null).length;

        // Try to spawn new moles
        if (activeMoles < this.settings.maxMoles && Math.random() < this.settings.spawnRate) {
            const availableIndices = this.moles
                .map((m, i) => m === null ? i : -1)
                .filter(i => i !== -1);
            
            if (availableIndices.length > 0) {
                const index = Phaser.Utils.Array.GetRandom(availableIndices);
                this.spawnMole(index);
            }
        }
    }

    spawnMole(index: number) {
        const hole = this.holes[index];
        const moleContainer = this.add.container(hole.x, hole.y);
        
        // Mole graphics
        const body = this.add.graphics();
        
        // Body
        body.fillStyle(0x8D6E63);
        body.fillEllipse(0, 0, MOLE_SIZE / 2, MOLE_SIZE / 2.5);
        
        // Snout
        body.fillStyle(0x795548);
        body.fillEllipse(0, 15, 15, 8);
        
        // Eyes
        body.fillStyle(0x000000);
        body.fillCircle(-12, -8, 4);
        body.fillCircle(12, -8, 4);
        
        // Eye shine
        body.fillStyle(0xFFFFFF);
        body.fillCircle(-10, -10, 1.5);
        body.fillCircle(14, -10, 1.5);
        
        // Nose
        body.fillStyle(0x000000);
        body.fillEllipse(0, 12, 3, 2);
        
        // Ears
        body.fillStyle(0x6D4C41);
        body.fillEllipse(-18, -20, 8, 6);
        body.fillEllipse(18, -20, 8, 6);

        // Whiskers
        body.lineStyle(2, 0x000000);
        body.beginPath();
        body.moveTo(-20, 8);
        body.lineTo(-35, 5);
        body.moveTo(-20, 15);
        body.lineTo(-35, 18);
        body.moveTo(20, 8);
        body.lineTo(35, 5);
        body.moveTo(20, 15);
        body.lineTo(35, 18);
        body.strokePath();

        moleContainer.add(body);
        
        // Interaction
        const hitArea = new Phaser.Geom.Ellipse(0, 0, MOLE_SIZE, MOLE_SIZE * 0.8);
        moleContainer.setInteractive(hitArea, Phaser.Geom.Ellipse.Contains);
        
        moleContainer.on('pointerdown', () => this.hitMole(index));

        // Animation: Pop up
        moleContainer.y += 50;
        moleContainer.alpha = 0;
        
        this.tweens.add({
            targets: moleContainer,
            y: hole.y,
            alpha: 1,
            duration: 200,
            ease: 'Back.out'
        });

        // Auto hide timer
        const hideTimer = this.time.delayedCall(this.settings.moleShowTime * 16, () => { // Convert frames to ms approx
            this.removeMole(index, false);
        });

        moleContainer.setData('hideTimer', hideTimer);
        this.moles[index] = moleContainer;
    }

    hitMole(index: number) {
        const mole = this.moles[index];
        if (!mole) return;

        // Cancel auto hide
        const hideTimer = mole.getData('hideTimer') as Phaser.Time.TimerEvent;
        if (hideTimer) hideTimer.remove();

        // Update score
        this.combo++;
        const points = this.combo > 5 ? 15 : this.combo > 3 ? 10 : 5;
        this.score += points;
        
        this.onScoreUpdate(this.score);
        this.onComboUpdate(this.combo);

        // Visual feedback
        const hitText = this.add.text(mole.x, mole.y - 50, `+${points}`, {
            fontSize: '32px',
            color: this.combo > 5 ? '#FFD700' : this.combo > 3 ? '#FF6347' : '#4CAF50',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: hitText,
            y: hitText.y - 50,
            alpha: 0,
            duration: 1000,
            onComplete: () => hitText.destroy()
        });

        // Remove mole immediately with animation
        this.tweens.add({
            targets: mole,
            scaleX: 1.2,
            scaleY: 0.8,
            duration: 50,
            yoyo: true,
            onComplete: () => {
                this.removeMole(index, true);
            }
        });
    }

    removeMole(index: number, hit: boolean) {
        const mole = this.moles[index];
        if (!mole) return;

        if (!hit) {
            this.combo = 0;
            this.onComboUpdate(0);
        }

        this.moles[index] = null as any;

        this.tweens.add({
            targets: mole,
            y: mole.y + 50,
            alpha: 0,
            duration: 200,
            ease: 'Back.in',
            onComplete: () => mole.destroy()
        });
    }

    updateTimer() {
        this.timeLeft--;
        this.onTimeUpdate(this.timeLeft);

        if (this.timeLeft <= 0) {
            if (this.gameTimer) this.gameTimer.remove();
            this.onGameOver(this.score);
            this.scene.pause();
        }
    }
}

const WhacAMole: React.FC = () => {
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameOver'>('start');
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [combo, setCombo] = useState(0);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [highScore, setHighScore] = useState(() => {
        const saved = localStorage.getItem('whac-highscore');
        return saved ? parseInt(saved) : 0;
    });
    const gameRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        if (gameState === 'playing') {
            const difficultySettings = {
                easy: { moleShowTime: 120, spawnRate: 0.02, maxMoles: 2 },
                medium: { moleShowTime: 90, spawnRate: 0.03, maxMoles: 3 },
                hard: { moleShowTime: 60, spawnRate: 0.04, maxMoles: 4 }
            };

            const config: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                width: GAME_WIDTH,
                height: GAME_HEIGHT,
                parent: 'phaser-game',
                backgroundColor: '#2E7D32',
                scene: new WhacAMoleScene(
                    difficultySettings[difficulty],
                    setScore,
                    setTimeLeft,
                    setCombo,
                    (finalScore) => {
                        if (finalScore > highScore) {
                            setHighScore(finalScore);
                            localStorage.setItem('whac-highscore', finalScore.toString());
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
    }, [gameState, difficulty]);

    const startGame = () => {
        setScore(0);
        setTimeLeft(60);
        setCombo(0);
        setGameState('playing');
    };

    if (gameState === 'start') {
        return (
            <GameStartScreen
                title="🔨 WHAC-A-MOLE"
                description="¡Golpea a los topos antes de que se escondan!"
                instructions={[
                    {
                        title: "Controles y Puntuación",
                        items: [
                            "🖱️ Click en los topos para golpearlos",
                            "⚡ Sistema de combos: más hits seguidos = más puntos"
                        ],
                        icon: "🎮"
                    },
                    {
                        title: "Consejos Pro",
                        items: [
                            "• Mantén la vista en todo el campo",
                            "• Los combos dan puntos extra",
                            "• ¡Reacciona rápido pero con precisión!"
                        ],
                        icon: "💡"
                    }
                ]}
                highScore={highScore}
                onStart={startGame}
                theme={{
                    background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
                    primary: 'linear-gradient(45deg, #8D6E63, #A1887F)',
                    secondary: 'rgba(255, 255, 255, 0.2)',
                    accent: 'linear-gradient(45deg, #8D6E63, #D7CCC8)',
                    text: 'white'
                }}
            >
                <div style={{ 
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '15px',
                    padding: '1.2rem',
                    marginBottom: '1.5rem',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                    <h3 style={{ 
                        fontSize: '1.2rem', 
                        marginBottom: '1rem',
                        color: '#fff'
                    }}>
                        🎯 Selecciona Dificultad
                    </h3>
                    <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {(['easy', 'medium', 'hard'] as const).map((level) => (
                            <button
                                key={level}
                                onClick={() => setDifficulty(level)}
                                style={{
                                    padding: '0.6rem 1rem',
                                    fontSize: '0.9rem',
                                    background: difficulty === level 
                                        ? 'linear-gradient(45deg, #4CAF50, #45a049)' 
                                        : 'rgba(255, 255, 255, 0.2)',
                                    border: difficulty === level ? '2px solid #4CAF50' : '1px solid rgba(255, 255, 255, 0.3)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    transition: 'all 0.3s ease',
                                    textAlign: 'center'
                                }}
                            >
                                <div>{level.charAt(0).toUpperCase() + level.slice(1)}</div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                                    {level === 'easy' && '2 topos max'}
                                    {level === 'medium' && '3 topos max'}
                                    {level === 'hard' && '4 topos max'}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </GameStartScreen>
        );
    }

    if (gameState === 'gameOver') {
        const isNewRecord = score === highScore && score > 0;
        
        return (
            <GameOverScreen
                score={score}
                highScore={highScore}
                isNewRecord={isNewRecord}
                onRestart={startGame}
                onMenu={() => setGameState('start')}
                theme={{
                    background: isNewRecord 
                        ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
                        : 'linear-gradient(135deg, #8D6E63 0%, #5D4037 100%)',
                    primary: 'linear-gradient(45deg, #8D6E63, #A1887F)',
                    secondary: '#4CAF50',
                    accent: isNewRecord 
                        ? 'linear-gradient(45deg, #FFFFFF, #FFFF00)' 
                        : 'linear-gradient(45deg, #FFFFFF, #D7CCC8)',
                }}
                customStats={[
                    { label: 'Dificultad', value: difficulty.charAt(0).toUpperCase() + difficulty.slice(1) },
                    { label: 'Mensaje', value: isNewRecord ? '¡Increíble precisión con el martillo!' : 'Los topos fueron más rápidos...' }
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
            background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
            minHeight: '100dvh',
            fontFamily: 'Arial, sans-serif',
            color: 'white'
        }}>
            <h1 style={{ margin: '0 0 20px 0', fontSize: '2.5rem' }}>🔨 WHAC-A-MOLE</h1>
            
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                width: GAME_WIDTH,
                marginBottom: '10px',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
            }}>
                <span>Score: {score}</span>
                <span style={{ 
                    color: combo > 5 ? '#FFD700' : combo > 3 ? '#FF6347' : '#4CAF50',
                    transition: 'color 0.3s ease'
                }}>Combo: {combo}</span>
                <span>Time: {timeLeft}</span>
            </div>

            <div id="phaser-game" style={{ border: '3px solid #8D6E63', borderRadius: '10px', overflow: 'hidden' }} />
            
            <div style={{ marginTop: '20px', fontSize: '1.2rem' }}>
                <p>¡Click en los topos para golpearlos!</p>
            </div>
        </div>
    );
};

export default WhacAMole;
