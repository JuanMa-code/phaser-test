import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import GameStartScreen from '../components/GameStartScreen';
import GameOverScreen from '../components/GameOverScreen';

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const GAME_WIDTH = COLS * BLOCK_SIZE;
const GAME_HEIGHT = ROWS * BLOCK_SIZE;

const COLORS = [0x00ffff, 0x0000ff, 0xffa500, 0xffff00, 0x00ff00, 0xff0000, 0x800080];
const SHAPES = [
    // I
    [[1, 1, 1, 1]],
    // J
    [[1, 0, 0], [1, 1, 1]],
    // L
    [[0, 0, 1], [1, 1, 1]],
    // O
    [[1, 1], [1, 1]],
    // S
    [[0, 1, 1], [1, 1, 0]],
    // T
    [[0, 1, 0], [1, 1, 1]],
    // Z
    [[1, 1, 0], [0, 1, 1]],
];

interface Piece {
    shape: number[][];
    color: number;
    x: number;
    y: number;
}

class TetrisScene extends Phaser.Scene {
    private board: (number | null)[][] = [];
    private currentPiece!: Piece;
    private nextPiece!: Piece;
    private dropTimer = 0;
    private dropInterval = 1000;
    private score = 0;
    private lines = 0;
    private level = 1;
    private isGameOver = false;

    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: {
        w: Phaser.Input.Keyboard.Key;
        a: Phaser.Input.Keyboard.Key;
        s: Phaser.Input.Keyboard.Key;
        d: Phaser.Input.Keyboard.Key;
    };
    private spaceKey!: Phaser.Input.Keyboard.Key;

    private graphics!: Phaser.GameObjects.Graphics;
    private nextPieceGraphics!: Phaser.GameObjects.Graphics;

    private onScoreUpdate: (score: number, lines: number, level: number) => void;
    private onGameOver: (score: number) => void;

    constructor(
        onScoreUpdate: (score: number, lines: number, level: number) => void,
        onGameOver: (score: number) => void
    ) {
        super('TetrisScene');
        this.onScoreUpdate = onScoreUpdate;
        this.onGameOver = onGameOver;
    }

    create() {
        this.board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
        this.currentPiece = this.randomPiece();
        this.nextPiece = this.randomPiece();
        
        this.graphics = this.add.graphics();
        this.nextPieceGraphics = this.add.graphics();
        this.nextPieceGraphics.setPosition(GAME_WIDTH + 20, 100);

        // Input
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.wasd = {
            w: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            a: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            s: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            d: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };
        this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Key events for discrete movement
        this.input.keyboard!.on('keydown-LEFT', () => this.move(-1, 0));
        this.input.keyboard!.on('keydown-RIGHT', () => this.move(1, 0));
        this.input.keyboard!.on('keydown-DOWN', () => this.move(0, 1));
        this.input.keyboard!.on('keydown-UP', () => this.rotate());
        this.input.keyboard!.on('keydown-A', () => this.move(-1, 0));
        this.input.keyboard!.on('keydown-D', () => this.move(1, 0));
        this.input.keyboard!.on('keydown-S', () => this.move(0, 1));
        this.input.keyboard!.on('keydown-W', () => this.rotate());
        this.input.keyboard!.on('keydown-SPACE', () => this.rotate());

        this.draw();
    }

    randomPiece(): Piece {
        const idx = Phaser.Math.Between(0, SHAPES.length - 1);
        return {
            shape: SHAPES[idx],
            color: COLORS[idx],
            x: Math.floor(COLS / 2) - 1,
            y: 0
        };
    }

    update(time: number, delta: number) {
        if (this.isGameOver) return;

        this.dropTimer += delta;
        if (this.dropTimer > this.dropInterval) {
            this.dropTimer = 0;
            this.drop();
        }
    }

    drop() {
        if (!this.collide(0, 1)) {
            this.currentPiece.y++;
            this.draw();
        } else {
            this.merge();
            this.clearLines();
            this.currentPiece = this.nextPiece;
            this.nextPiece = this.randomPiece();
            
            if (this.collide(0, 0)) {
                this.gameOver();
            }
            this.draw();
        }
    }

    move(dx: number, dy: number) {
        if (this.isGameOver) return;
        
        if (!this.collide(dx, dy)) {
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;
            if (dy > 0) {
                this.score += 1; // Points for soft drop
                this.onScoreUpdate(this.score, this.lines, this.level);
            }
            this.draw();
        }
    }

    rotate() {
        if (this.isGameOver) return;

        const rotated = this.currentPiece.shape[0].map((_, i) => 
            this.currentPiece.shape.map(row => row[i]).reverse()
        );
        
        if (!this.collide(0, 0, rotated)) {
            this.currentPiece.shape = rotated;
            this.draw();
        }
    }

    collide(dx: number, dy: number, shape = this.currentPiece.shape): boolean {
        for (let py = 0; py < shape.length; py++) {
            for (let px = 0; px < shape[py].length; px++) {
                if (shape[py][px]) {
                    const x = this.currentPiece.x + px + dx;
                    const y = this.currentPiece.y + py + dy;
                    
                    if (x < 0 || x >= COLS || y >= ROWS || (y >= 0 && this.board[y][x] !== null)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    merge() {
        for (let py = 0; py < this.currentPiece.shape.length; py++) {
            for (let px = 0; px < this.currentPiece.shape[py].length; px++) {
                if (this.currentPiece.shape[py][px]) {
                    const x = this.currentPiece.x + px;
                    const y = this.currentPiece.y + py;
                    if (y >= 0) {
                        this.board[y][x] = this.currentPiece.color;
                    }
                }
            }
        }
    }

    clearLines() {
        let linesCleared = 0;
        
        for (let y = ROWS - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== null)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(COLS).fill(null));
                linesCleared++;
                y++; // Check same row again
            }
        }

        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += linesCleared * 100 * this.level;
            
            if (this.lines >= this.level * 10) {
                this.level++;
                this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            }
            
            this.onScoreUpdate(this.score, this.lines, this.level);
        }
    }

    draw() {
        this.graphics.clear();
        this.nextPieceGraphics.clear();

        // Draw grid background
        this.graphics.lineStyle(1, 0x444444, 0.3);
        for (let i = 0; i <= COLS; i++) {
            this.graphics.moveTo(i * BLOCK_SIZE, 0);
            this.graphics.lineTo(i * BLOCK_SIZE, GAME_HEIGHT);
        }
        for (let i = 0; i <= ROWS; i++) {
            this.graphics.moveTo(0, i * BLOCK_SIZE);
            this.graphics.lineTo(GAME_WIDTH, i * BLOCK_SIZE);
        }
        this.graphics.strokePath();

        // Draw board
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (this.board[y][x] !== null) {
                    this.drawBlock(this.graphics, x * BLOCK_SIZE, y * BLOCK_SIZE, this.board[y][x] as number);
                }
            }
        }

        // Draw current piece
        for (let py = 0; py < this.currentPiece.shape.length; py++) {
            for (let px = 0; px < this.currentPiece.shape[py].length; px++) {
                if (this.currentPiece.shape[py][px]) {
                    this.drawBlock(
                        this.graphics, 
                        (this.currentPiece.x + px) * BLOCK_SIZE, 
                        (this.currentPiece.y + py) * BLOCK_SIZE, 
                        this.currentPiece.color
                    );
                }
            }
        }

        // Draw next piece
        for (let py = 0; py < this.nextPiece.shape.length; py++) {
            for (let px = 0; px < this.nextPiece.shape[py].length; px++) {
                if (this.nextPiece.shape[py][px]) {
                    this.drawBlock(
                        this.nextPieceGraphics,
                        px * 20,
                        py * 20,
                        this.nextPiece.color,
                        20
                    );
                }
            }
        }
    }

    drawBlock(graphics: Phaser.GameObjects.Graphics, x: number, y: number, color: number, size = BLOCK_SIZE) {
        graphics.fillStyle(color);
        graphics.fillRoundedRect(x, y, size - 2, size - 2, 3);
        graphics.lineStyle(1, 0xffffff, 0.3);
        graphics.strokeRoundedRect(x, y, size - 2, size - 2, 3);
    }

    gameOver() {
        this.isGameOver = true;
        this.onGameOver(this.score);
    }
}

const Tetris: React.FC = () => {
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
    const [stats, setStats] = useState({ score: 0, lines: 0, level: 1 });
    const gameRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        if (gameState === 'playing') {
            const config: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                width: GAME_WIDTH + 150, // Extra space for UI
                height: GAME_HEIGHT,
                parent: 'phaser-game',
                backgroundColor: '#1a1a2e',
                scene: new TetrisScene(
                    (score, lines, level) => setStats({ score, lines, level }),
                    (score) => {
                        setStats(s => ({ ...s, score }));
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
        setStats({ score: 0, lines: 0, level: 1 });
        setGameState('playing');
    };

    if (gameState === 'start') {
        return (
            <GameStartScreen
                title="🧩 TETRIS"
                description="¡El clásico juego de bloques que caen!"
                instructions={[
                    {
                        title: 'Controles',
                        items: [
                            '← → A D: Mover pieza',
                            '↓ S: Caída rápida',
                            '↑ W Espacio: Rotar'
                        ],
                        icon: '🎮'
                    },
                    {
                        title: 'Puntuación',
                        items: [
                            'Líneas completas: +100 × Nivel',
                            'Caída rápida: +1 punto',
                            'Cada 10 líneas: +1 nivel'
                        ],
                        icon: '📊'
                    }
                ]}
                onStart={startGame}
                theme={{
                    primary: '#ff6b6b',
                    secondary: '#4ecdc4',
                    accent: '#45b7d1',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
            />
        );
    }

    if (gameState === 'gameover') {
        return (
            <GameOverScreen
                score={stats.score}
                onRestart={startGame}
                onMenu={() => setGameState('start')}
                theme={{
                    primary: '#ff6b6b',
                    secondary: '#4ecdc4',
                    accent: '#45b7d1',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
                customStats={[
                    { label: 'Líneas Completadas', value: stats.lines },
                    { label: 'Nivel Alcanzado', value: stats.level }
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
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            minHeight: '100dvh',
            fontFamily: 'Arial, sans-serif',
            color: 'white'
        }}>
            <h1 style={{ margin: '0 0 20px 0', fontSize: '2.5rem' }}>🧩 TETRIS</h1>
            
            <div style={{ 
                display: 'flex', 
                gap: '2rem', 
                marginBottom: '1rem',
                fontSize: '1.2rem',
                fontWeight: 'bold'
            }}>
                <span>Score: {stats.score}</span>
                <span>Lines: {stats.lines}</span>
                <span>Level: {stats.level}</span>
            </div>

            <div style={{ position: 'relative' }}>
                <div id="phaser-game" style={{ border: '2px solid #444', borderRadius: '10px', overflow: 'hidden' }} />
                <div style={{
                    position: 'absolute',
                    top: '80px',
                    right: '30px',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: 'bold'
                }}>
                    Next:
                </div>
            </div>
            
            <div style={{ marginTop: '20px', fontSize: '1.2rem' }}>
                <p>Use ← → A D para mover, ↓ S para bajar rápido, ↑ W Espacio para rotar</p>
            </div>
        </div>
    );
};

export default Tetris;
