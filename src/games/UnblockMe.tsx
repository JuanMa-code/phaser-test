import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import GameStartScreen from '../components/GameStartScreen';
import GameOverScreen from '../components/GameOverScreen';

const GAME_WIDTH = 480;
const GAME_HEIGHT = 480;
const GRID_SIZE = 6;
const CELL_SIZE = 80;

interface BlockData {
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    color: number;
    direction: 'horizontal' | 'vertical';
    isTarget?: boolean;
}

const LEVELS: BlockData[][] = [
    // Level 1
    [
        { id: 0, x: 1, y: 2, width: 2, height: 1, color: 0xFF3333, direction: 'horizontal', isTarget: true },
        { id: 1, x: 3, y: 1, width: 1, height: 3, color: 0x4169E1, direction: 'vertical' },
        { id: 2, x: 0, y: 0, width: 2, height: 1, color: 0x32CD32, direction: 'horizontal' },
        { id: 3, x: 4, y: 0, width: 1, height: 2, color: 0xFFD700, direction: 'vertical' },
        { id: 4, x: 0, y: 1, width: 1, height: 2, color: 0xFF69B4, direction: 'vertical' },
        { id: 5, x: 1, y: 3, width: 2, height: 1, color: 0x8A2BE2, direction: 'horizontal' },
        { id: 6, x: 4, y: 4, width: 2, height: 1, color: 0x00CED1, direction: 'horizontal' },
    ],
    // Level 2
    [
        { id: 0, x: 0, y: 2, width: 2, height: 1, color: 0xFF3333, direction: 'horizontal', isTarget: true },
        { id: 1, x: 2, y: 0, width: 1, height: 3, color: 0x4169E1, direction: 'vertical' },
        { id: 2, x: 3, y: 0, width: 2, height: 1, color: 0x32CD32, direction: 'horizontal' },
        { id: 3, x: 5, y: 0, width: 1, height: 3, color: 0xFFD700, direction: 'vertical' },
        { id: 4, x: 0, y: 0, width: 1, height: 2, color: 0xFF69B4, direction: 'vertical' },
        { id: 5, x: 1, y: 0, width: 1, height: 2, color: 0x8A2BE2, direction: 'vertical' },
        { id: 6, x: 3, y: 3, width: 1, height: 2, color: 0x00CED1, direction: 'vertical' },
        { id: 7, x: 4, y: 3, width: 1, height: 2, color: 0xFFA500, direction: 'vertical' },
        { id: 8, x: 0, y: 4, width: 3, height: 1, color: 0x9370DB, direction: 'horizontal' },
    ]
];

class Block extends Phaser.GameObjects.Container {
    public gridX: number;
    public gridY: number;
    public gridWidth: number;
    public gridHeight: number;
    public direction: 'horizontal' | 'vertical';
    public isTarget: boolean;
    public id: number;

    private bg: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene, data: BlockData) {
        super(scene, data.x * CELL_SIZE, data.y * CELL_SIZE);
        
        this.id = data.id;
        this.gridX = data.x;
        this.gridY = data.y;
        this.gridWidth = data.width;
        this.gridHeight = data.height;
        this.direction = data.direction;
        this.isTarget = !!data.isTarget;

        this.bg = scene.add.graphics();
        this.draw(data.color);
        this.add(this.bg);

        this.setSize(data.width * CELL_SIZE, data.height * CELL_SIZE);
        this.setInteractive({ draggable: true });
        
        scene.add.existing(this);
    }

    draw(color: number) {
        this.bg.clear();
        
        // Shadow
        this.bg.fillStyle(0x000000, 0.2);
        this.bg.fillRoundedRect(4, 4, this.width - 8, this.height - 8, 8);

        // Main block
        this.bg.fillStyle(color);
        this.bg.fillRoundedRect(0, 0, this.width - 8, this.height - 8, 8);

        // Highlight
        this.bg.fillStyle(0xFFFFFF, 0.3);
        this.bg.fillRoundedRect(2, 2, this.width - 12, this.height/2 - 6, 6);

        if (this.isTarget) {
            this.bg.fillStyle(0xFFFFFF);
            this.bg.fillCircle((this.width - 8)/2, (this.height - 8)/2, 8);
            this.bg.fillStyle(color);
            this.bg.fillCircle((this.width - 8)/2, (this.height - 8)/2, 5);
        }
    }
}

class UnblockMeScene extends Phaser.Scene {
    private blocks: Block[] = [];
    private currentLevelIndex = 0;
    private moves = 0;
    private isLevelComplete = false;

    private onMovesUpdate: (moves: number) => void;
    private onLevelComplete: (moves: number) => void;

    constructor(
        onMovesUpdate: (moves: number) => void,
        onLevelComplete: (moves: number) => void
    ) {
        super('UnblockMeScene');
        this.onMovesUpdate = onMovesUpdate;
        this.onLevelComplete = onLevelComplete;
    }

    init(data: { level: number }) {
        this.currentLevelIndex = data.level;
        this.moves = 0;
        this.isLevelComplete = false;
    }

    create() {
        this.createBoard();
        this.loadLevel(this.currentLevelIndex);
    }

    createBoard() {
        const bg = this.add.graphics();
        
        // Wood background
        bg.fillStyle(0x8B4513);
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Board area
        bg.fillStyle(0xF5DEB3);
        bg.fillRoundedRect(0, 0, GAME_WIDTH, GAME_HEIGHT, 0);

        // Grid lines
        bg.lineStyle(1, 0xD2B48C, 0.5);
        for (let i = 0; i <= GRID_SIZE; i++) {
            bg.moveTo(i * CELL_SIZE, 0);
            bg.lineTo(i * CELL_SIZE, GAME_HEIGHT);
            bg.moveTo(0, i * CELL_SIZE);
            bg.lineTo(GAME_WIDTH, i * CELL_SIZE);
        }
        bg.strokePath();

        // Exit marker
        bg.lineStyle(4, 0xFF3333);
        bg.fillStyle(0xFF3333, 0.3);
        bg.fillRect(GAME_WIDTH - 10, 2 * CELL_SIZE + 10, 10, CELL_SIZE - 20);
        bg.strokeRect(GAME_WIDTH - 10, 2 * CELL_SIZE + 10, 10, CELL_SIZE - 20);
    }

    loadLevel(index: number) {
        // Clear existing blocks
        this.blocks.forEach(b => b.destroy());
        this.blocks = [];

        const levelData = LEVELS[index];
        levelData.forEach(data => {
            const block = new Block(this, data);
            
            block.on('dragstart', () => {
                this.children.bringToTop(block);
                (block as any).startX = block.x;
                (block as any).startY = block.y;
                (block as any).startGridX = block.gridX;
                (block as any).startGridY = block.gridY;
            });

            block.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
                if (this.isLevelComplete) return;

                if (block.direction === 'horizontal') {
                    // Constrain Y
                    block.y = block.gridY * CELL_SIZE;
                    
                    // Calculate grid bounds
                    const newGridX = Math.round(dragX / CELL_SIZE);
                    
                    if (this.isValidMove(block, newGridX, block.gridY)) {
                        block.x = Math.max(0, Math.min((GRID_SIZE - block.gridWidth) * CELL_SIZE, dragX));
                    }
                } else {
                    // Constrain X
                    block.x = block.gridX * CELL_SIZE;
                    
                    const newGridY = Math.round(dragY / CELL_SIZE);
                    
                    if (this.isValidMove(block, block.gridX, newGridY)) {
                        block.y = Math.max(0, Math.min((GRID_SIZE - block.gridHeight) * CELL_SIZE, dragY));
                    }
                }
            });

            block.on('dragend', () => {
                if (this.isLevelComplete) return;

                const newGridX = Math.round(block.x / CELL_SIZE);
                const newGridY = Math.round(block.y / CELL_SIZE);

                // Snap to grid
                block.x = newGridX * CELL_SIZE;
                block.y = newGridY * CELL_SIZE;

                if (newGridX !== (block as any).startGridX || newGridY !== (block as any).startGridY) {
                    block.gridX = newGridX;
                    block.gridY = newGridY;
                    this.moves++;
                    this.onMovesUpdate(this.moves);
                    this.checkWin();
                }
            });

            this.blocks.push(block);
        });
    }

    isValidMove(block: Block, targetGridX: number, targetGridY: number): boolean {
        // Check bounds
        if (targetGridX < 0 || targetGridY < 0 || 
            targetGridX + block.gridWidth > GRID_SIZE || 
            targetGridY + block.gridHeight > GRID_SIZE) {
            return false;
        }

        // Check collision with other blocks
        // We need to check the path from current position to target position
        // But for simple drag, we just check if the target position overlaps with any other block
        // This is a simplification, a robust implementation would check the swept path
        
        // Let's check if the target rect overlaps any other block
        for (const other of this.blocks) {
            if (other === block) continue;

            if (targetGridX < other.gridX + other.gridWidth &&
                targetGridX + block.gridWidth > other.gridX &&
                targetGridY < other.gridY + other.gridHeight &&
                targetGridY + block.gridHeight > other.gridY) {
                return false;
            }
        }

        return true;
    }

    checkWin() {
        const target = this.blocks.find(b => b.isTarget);
        if (target && target.gridX + target.gridWidth === GRID_SIZE) {
            this.isLevelComplete = true;
            this.onLevelComplete(this.moves);
        }
    }
}

const UnblockMe: React.FC = () => {
    const [gameState, setGameState] = useState<'start' | 'playing' | 'levelComplete'>('start');
    const [level, setLevel] = useState(0);
    const [moves, setMoves] = useState(0);
    const gameRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        if (gameState === 'playing') {
            const config: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                width: GAME_WIDTH,
                height: GAME_HEIGHT,
                parent: 'phaser-game',
                backgroundColor: '#2C1810',
                scene: new UnblockMeScene(
                    (m) => setMoves(m),
                    (m) => {
                        setMoves(m);
                        setGameState('levelComplete');
                    }
                )
            };

            gameRef.current = new Phaser.Game(config);
            
            // Pass level data to scene
            gameRef.current.events.on('ready', () => {
                if (gameRef.current) {
                    const scene = gameRef.current.scene.getScene('UnblockMeScene') as UnblockMeScene;
                    scene.scene.restart({ level });
                }
            });

            return () => {
                if (gameRef.current) {
                    gameRef.current.destroy(true);
                    gameRef.current = null;
                }
            };
        }
    }, [gameState, level]);

    const startGame = () => {
        setLevel(0);
        setMoves(0);
        setGameState('playing');
    };

    const nextLevel = () => {
        if (level < LEVELS.length - 1) {
            setLevel(l => l + 1);
            setMoves(0);
            setGameState('playing');
        } else {
            // Game Complete
            setGameState('start'); // Or a specific game complete screen
        }
    };

    if (gameState === 'start') {
        return (
            <GameStartScreen
                title="🧩 UNBLOCK ME"
                description="Libera el bloque rojo moviendo los demás"
                instructions={[
                    { title: 'Mover', items: ['Arrastra los bloques para moverlos'], icon: '🖱️' },
                    { title: 'Objetivo', items: ['Lleva el bloque rojo a la salida derecha'], icon: '🎯' }
                ]}
                onStart={startGame}
            />
        );
    }

    if (gameState === 'levelComplete') {
        return (
            <GameOverScreen
                score={moves}
                isVictory={true}
                onRestart={() => {
                    setMoves(0);
                    setGameState('playing');
                }}
                onMenu={() => setGameState('start')}
                customStats={[
                    { label: 'Nivel', value: level + 1 },
                    { label: 'Movimientos', value: moves }
                ]}
                customButtons={
                    level < LEVELS.length - 1 ? (
                        <button 
                            onClick={nextLevel}
                            style={{
                                padding: '10px 20px',
                                fontSize: '1.2rem',
                                background: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                marginTop: '10px'
                            }}
                        >
                            Siguiente Nivel ➡️
                        </button>
                    ) : undefined
                }
            />
        );
    }

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            padding: '20px',
            background: '#8B4513',
            minHeight: '100dvh',
            color: 'white'
        }}>
            <h1 style={{ margin: '0 0 20px 0' }}>🧩 UNBLOCK ME</h1>
            
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                width: GAME_WIDTH,
                marginBottom: '10px',
                fontSize: '1.2rem',
                fontWeight: 'bold'
            }}>
                <span>Nivel: {level + 1}</span>
                <span>Movimientos: {moves}</span>
            </div>

            <div id="phaser-game" style={{ border: '4px solid #5D4037', borderRadius: '10px', overflow: 'hidden' }} />
            
            <div style={{ marginTop: '20px' }}>
                Arrastra los bloques para liberar el camino
            </div>
        </div>
    );
};

export default UnblockMe;
