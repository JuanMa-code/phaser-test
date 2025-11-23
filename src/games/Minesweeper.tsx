import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import GameStartScreen from '../components/GameStartScreen';
import GameOverScreen from '../components/GameOverScreen';

const CELL_SIZE = 35;
const DIFFICULTIES = {
    beginner: { cols: 9, rows: 9, mines: 10 },
    intermediate: { cols: 16, rows: 16, mines: 40 },
    expert: { cols: 30, rows: 16, mines: 99 }
};

interface CellData {
    x: number;
    y: number;
    mine: boolean;
    revealed: boolean;
    flagged: boolean;
    adjacent: number;
}

class MinesweeperScene extends Phaser.Scene {
    private difficulty: 'beginner' | 'intermediate' | 'expert';
    private config: { cols: number, rows: number, mines: number };
    private board: CellData[][] = [];
    private cellSprites: Phaser.GameObjects.Container[][] = [];
    private firstClick = true;
    private minesLeft: number;
    private isGameOver = false;
    
    private onMineCountUpdate: (count: number) => void;
    private onGameOver: (won: boolean) => void;

    constructor(
        difficulty: 'beginner' | 'intermediate' | 'expert',
        onMineCountUpdate: (count: number) => void,
        onGameOver: (won: boolean) => void
    ) {
        super('MinesweeperScene');
        this.difficulty = difficulty;
        this.config = DIFFICULTIES[difficulty];
        this.minesLeft = this.config.mines;
        this.onMineCountUpdate = onMineCountUpdate;
        this.onGameOver = onGameOver;
    }

    preload() {
        this.createTextures();
    }

    createTextures() {
        // Cell Background (Unrevealed)
        const cellBg = this.make.graphics({ x: 0, y: 0 });
        cellBg.fillStyle(0xbfbfbf);
        cellBg.fillRect(0, 0, CELL_SIZE, CELL_SIZE);
        
        // 3D Effect (Bevel)
        cellBg.fillStyle(0xffffff); // Top-Left Highlight
        cellBg.fillTriangle(0, 0, CELL_SIZE, 0, 0, CELL_SIZE);
        cellBg.fillStyle(0x808080); // Bottom-Right Shadow
        cellBg.fillTriangle(CELL_SIZE, CELL_SIZE, CELL_SIZE, 0, 0, CELL_SIZE);
        cellBg.fillStyle(0xbfbfbf); // Center
        cellBg.fillRect(4, 4, CELL_SIZE - 8, CELL_SIZE - 8);
        
        cellBg.generateTexture('cell-hidden', CELL_SIZE, CELL_SIZE);

        // Cell Revealed
        const cellRevealed = this.make.graphics({ x: 0, y: 0 });
        cellRevealed.fillStyle(0xc0c0c0); // Slightly darker gray
        cellRevealed.fillRect(0, 0, CELL_SIZE, CELL_SIZE);
        cellRevealed.lineStyle(1, 0x808080);
        cellRevealed.strokeRect(0, 0, CELL_SIZE, CELL_SIZE);
        cellRevealed.generateTexture('cell-revealed', CELL_SIZE, CELL_SIZE);

        // Flag
        const flag = this.make.graphics({ x: 0, y: 0 });
        flag.fillStyle(0xff0000);
        flag.fillTriangle(CELL_SIZE/2, 5, CELL_SIZE/2, 20, CELL_SIZE - 5, 12.5);
        flag.lineStyle(2, 0x000000);
        flag.moveTo(CELL_SIZE/2, 5);
        flag.lineTo(CELL_SIZE/2, 30);
        flag.strokePath();
        flag.generateTexture('flag', CELL_SIZE, CELL_SIZE);

        // Mine
        const mine = this.make.graphics({ x: 0, y: 0 });
        mine.fillStyle(0x000000);
        mine.fillCircle(CELL_SIZE/2, CELL_SIZE/2, CELL_SIZE/3);
        mine.lineStyle(2, 0x000000);
        mine.moveTo(CELL_SIZE/2, 5);
        mine.lineTo(CELL_SIZE/2, CELL_SIZE-5);
        mine.moveTo(5, CELL_SIZE/2);
        mine.lineTo(CELL_SIZE-5, CELL_SIZE/2);
        mine.moveTo(10, 10);
        mine.lineTo(CELL_SIZE-10, CELL_SIZE-10);
        mine.moveTo(CELL_SIZE-10, 10);
        mine.lineTo(10, CELL_SIZE-10);
        mine.strokePath();
        mine.generateTexture('mine', CELL_SIZE, CELL_SIZE);
    }

    create() {
        // Disable context menu
        this.input.mouse!.disableContextMenu();

        this.initBoard();
        this.createGrid();
    }

    initBoard() {
        this.board = [];
        for (let y = 0; y < this.config.rows; y++) {
            this.board[y] = [];
            for (let x = 0; x < this.config.cols; x++) {
                this.board[y][x] = {
                    x, y,
                    mine: false,
                    revealed: false,
                    flagged: false,
                    adjacent: 0
                };
            }
        }
    }

    createGrid() {
        this.cellSprites = [];
        for (let y = 0; y < this.config.rows; y++) {
            this.cellSprites[y] = [];
            for (let x = 0; x < this.config.cols; x++) {
                const container = this.add.container(x * CELL_SIZE, y * CELL_SIZE);
                
                const bg = this.add.sprite(CELL_SIZE/2, CELL_SIZE/2, 'cell-hidden');
                container.add(bg);
                
                // Interactive zone
                const zone = this.add.zone(CELL_SIZE/2, CELL_SIZE/2, CELL_SIZE, CELL_SIZE);
                zone.setInteractive();
                zone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                    this.handleInput(x, y, pointer);
                });
                container.add(zone);

                this.cellSprites[y][x] = container;
            }
        }
    }

    handleInput(x: number, y: number, pointer: Phaser.Input.Pointer) {
        if (this.isGameOver) return;

        if (pointer.rightButtonDown()) {
            this.toggleFlag(x, y);
        } else if (pointer.leftButtonDown()) {
            if (this.firstClick) {
                this.placeMines(x, y);
                this.calculateAdjacent();
                this.firstClick = false;
            }
            this.revealCell(x, y);
        }
    }

    placeMines(excludeX: number, excludeY: number) {
        let placed = 0;
        while (placed < this.config.mines) {
            const x = Phaser.Math.Between(0, this.config.cols - 1);
            const y = Phaser.Math.Between(0, this.config.rows - 1);

            if (!this.board[y][x].mine && 
                !(Math.abs(x - excludeX) <= 1 && Math.abs(y - excludeY) <= 1)) {
                this.board[y][x].mine = true;
                placed++;
            }
        }
    }

    calculateAdjacent() {
        for (let y = 0; y < this.config.rows; y++) {
            for (let x = 0; x < this.config.cols; x++) {
                if (this.board[y][x].mine) continue;

                let count = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const nx = x + dx, ny = y + dy;
                        if (nx >= 0 && nx < this.config.cols && ny >= 0 && ny < this.config.rows && 
                            this.board[ny][nx].mine) {
                            count++;
                        }
                    }
                }
                this.board[y][x].adjacent = count;
            }
        }
    }

    toggleFlag(x: number, y: number) {
        const cell = this.board[y][x];
        if (cell.revealed) return;

        cell.flagged = !cell.flagged;
        
        const container = this.cellSprites[y][x];
        if (cell.flagged) {
            const flag = this.add.sprite(CELL_SIZE/2, CELL_SIZE/2, 'flag');
            flag.setName('flag');
            container.add(flag);
            this.minesLeft--;
        } else {
            const flag = container.getByName('flag');
            if (flag) flag.destroy();
            this.minesLeft++;
        }
        
        this.onMineCountUpdate(this.minesLeft);
    }

    revealCell(x: number, y: number) {
        if (x < 0 || x >= this.config.cols || y < 0 || y >= this.config.rows) return;
        const cell = this.board[y][x];
        
        if (cell.revealed || cell.flagged) return;

        cell.revealed = true;
        this.updateCellVisuals(x, y);

        if (cell.mine) {
            this.gameOver(false);
            return;
        }

        if (cell.adjacent === 0) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    this.revealCell(x + dx, y + dy);
                }
            }
        }

        this.checkWin();
    }

    updateCellVisuals(x: number, y: number) {
        const cell = this.board[y][x];
        const container = this.cellSprites[y][x];
        
        // Remove hidden bg and flag
        container.removeAll(true); // Clear all children
        
        // Add revealed bg
        const bg = this.add.sprite(CELL_SIZE/2, CELL_SIZE/2, 'cell-revealed');
        container.add(bg);

        if (cell.mine) {
            const mine = this.add.sprite(CELL_SIZE/2, CELL_SIZE/2, 'mine');
            container.add(mine);
            // Red background for exploded mine
            bg.setTint(0xff0000);
        } else if (cell.adjacent > 0) {
            const colors = [
                '#0000ff', '#008000', '#ff0000', '#000080',
                '#800000', '#008080', '#000000', '#808080'
            ];
            const text = this.add.text(CELL_SIZE/2, CELL_SIZE/2, cell.adjacent.toString(), {
                fontSize: '20px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: colors[cell.adjacent - 1]
            }).setOrigin(0.5);
            container.add(text);
        }
    }

    gameOver(won: boolean) {
        this.isGameOver = true;
        if (!won) {
            this.revealAllMines();
        }
        this.onGameOver(won);
    }

    revealAllMines() {
        for (let y = 0; y < this.config.rows; y++) {
            for (let x = 0; x < this.config.cols; x++) {
                if (this.board[y][x].mine) {
                    this.board[y][x].revealed = true;
                    this.updateCellVisuals(x, y);
                }
            }
        }
    }

    checkWin() {
        let revealedCount = 0;
        for (let y = 0; y < this.config.rows; y++) {
            for (let x = 0; x < this.config.cols; x++) {
                if (this.board[y][x].revealed && !this.board[y][x].mine) {
                    revealedCount++;
                }
            }
        }

        if (revealedCount === this.config.cols * this.config.rows - this.config.mines) {
            this.gameOver(true);
        }
    }
}

const Minesweeper: React.FC = () => {
    const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'expert'>('beginner');
    const [gameState, setGameState] = useState<'start' | 'playing' | 'won' | 'lost'>('start');
    const [minesLeft, setMinesLeft] = useState(DIFFICULTIES.beginner.mines);
    const [time, setTime] = useState(0);
    const gameRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (gameState === 'playing') {
            interval = setInterval(() => {
                setTime(t => t + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [gameState]);

    useEffect(() => {
        if (gameState === 'playing') {
            const config = DIFFICULTIES[difficulty];
            const gameConfig: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                width: config.cols * CELL_SIZE,
                height: config.rows * CELL_SIZE,
                parent: 'phaser-game',
                backgroundColor: '#c0c0c0',
                scene: new MinesweeperScene(
                    difficulty,
                    (count) => setMinesLeft(count),
                    (won) => setGameState(won ? 'won' : 'lost')
                )
            };

            gameRef.current = new Phaser.Game(gameConfig);

            return () => {
                if (gameRef.current) {
                    gameRef.current.destroy(true);
                    gameRef.current = null;
                }
            };
        }
    }, [gameState, difficulty]);

    const startGame = () => {
        setGameState('playing');
        setMinesLeft(DIFFICULTIES[difficulty].mines);
        setTime(0);
    };

    const restartGame = () => {
        setGameState('playing');
        setMinesLeft(DIFFICULTIES[difficulty].mines);
        setTime(0);
    };

    if (gameState === 'start') {
        return (
            <GameStartScreen
                title="💣 Minesweeper"
                description="¡Encuentra todas las minas sin explotar ninguna!"
                instructions={[
                    {
                        title: "Controles",
                        items: [
                            "🖱️ Click izquierdo: Revelar casilla",
                            "🚩 Click derecho: Marcar con bandera",
                            "💡 Los números indican minas adyacentes",
                            "🎯 Encuentra todas las minas sin explotar ninguna"
                        ],
                        icon: "🎮"
                    },
                    {
                        title: "Características",
                        items: [
                            "3 niveles de dificultad: Principiante, Intermedio, Experto",
                            "Temporizador integrado",
                            "Contador de minas",
                            "Efectos visuales clásicos"
                        ],
                        icon: "⭐"
                    }
                ]}
                onStart={startGame}
                theme={{
                    background: 'linear-gradient(135deg, #c0c0c0 0%, #808080 100%)',
                    primary: 'linear-gradient(45deg, #ff0000, #ff6600)',
                    secondary: 'rgba(255, 255, 255, 0.2)',
                    accent: 'linear-gradient(45deg, #ff0000, #0000ff, #008000)',
                }}
            >
                <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Dificultad:</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {Object.entries(DIFFICULTIES).map(([key, config]) => (
                            <button
                                key={key}
                                onClick={() => setDifficulty(key as any)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.9rem',
                                    background: difficulty === key 
                                        ? 'linear-gradient(45deg, #4CAF50, #45a049)' 
                                        : 'rgba(255, 255, 255, 0.2)',
                                    border: difficulty === key ? '2px solid #4CAF50' : '1px solid rgba(255, 255, 255, 0.3)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {key.charAt(0).toUpperCase() + key.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </GameStartScreen>
        );
    }

    if (gameState === 'won' || gameState === 'lost') {
        return (
            <GameOverScreen
                score={time} // Using time as score
                isVictory={gameState === 'won'}
                onRestart={restartGame}
                onMenu={() => setGameState('start')}
                theme={{
                    background: gameState === 'won' 
                        ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
                        : 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                    primary: gameState === 'won'
                        ? 'linear-gradient(45deg, #4CAF50, #45a049)'
                        : 'linear-gradient(45deg, #f44336, #d32f2f)',
                    secondary: 'rgba(255, 255, 255, 0.2)',
                    accent: 'linear-gradient(45deg, #ffffff, #e0e0e0)',
                }}
                customStats={[
                    { label: 'Tiempo', value: `${time} segundos` },
                    { label: 'Dificultad', value: difficulty.charAt(0).toUpperCase() + difficulty.slice(1) },
                    { label: 'Minas', value: DIFFICULTIES[difficulty].mines }
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
            background: 'linear-gradient(135deg, #c0c0c0 0%, #808080 100%)',
            minHeight: '100dvh',
            fontFamily: 'Arial, sans-serif',
            color: 'black'
        }}>
            <h1 style={{ margin: '0 0 20px 0', fontSize: '2.5rem' }}>💣 MINESWEEPER</h1>
            
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                width: DIFFICULTIES[difficulty].cols * CELL_SIZE,
                background: '#bfbfbf',
                padding: '10px',
                border: '3px solid #808080',
                borderBottom: 'none',
                fontWeight: 'bold',
                fontSize: '1.2rem'
            }}>
                <span style={{ color: 'red' }}>💣 {minesLeft}</span>
                <span style={{ color: 'blue' }}>⏱️ {time}</span>
            </div>

            <div id="phaser-game" style={{ border: '3px solid #808080', borderRadius: '0 0 5px 5px' }} />
            
            <div style={{ marginTop: '20px', fontSize: '1rem' }}>
                <p>Click izquierdo: revelar | Click derecho: bandera</p>
            </div>
        </div>
    );
};

export default Minesweeper;
