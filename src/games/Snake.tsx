import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import GameStartScreen from '../components/GameStartScreen';
import GameOverScreen from '../components/GameOverScreen';

const COLS = 20;
const ROWS = 15;
const CELL_SIZE = 32;
const SPEED = 150; // ms per move

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

class SnakeScene extends Phaser.Scene {
    private snake: Phaser.GameObjects.Rectangle[] = [];
    private food!: Phaser.GameObjects.Container;
    private direction: Direction = 'RIGHT';
    private nextDirection: Direction = 'RIGHT';
    private moveTimer = 0;
    private score = 0;
    private isGameOver = false;
    
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: {
        up: Phaser.Input.Keyboard.Key;
        down: Phaser.Input.Keyboard.Key;
        left: Phaser.Input.Keyboard.Key;
        right: Phaser.Input.Keyboard.Key;
    };

    private onScoreUpdate: (score: number) => void;
    private onGameOver: (score: number) => void;

    constructor(
        onScoreUpdate: (score: number) => void,
        onGameOver: (score: number) => void
    ) {
        super('SnakeScene');
        this.onScoreUpdate = onScoreUpdate;
        this.onGameOver = onGameOver;
    }

    preload() {
        // Generate textures
        const foodGraphics = this.make.graphics({ x: 0, y: 0 });
        foodGraphics.fillStyle(0xff4757);
        foodGraphics.fillCircle(CELL_SIZE / 2, CELL_SIZE / 2, CELL_SIZE / 2.5);
        foodGraphics.fillStyle(0x00ff00);
        foodGraphics.fillRect(CELL_SIZE / 2 - 2, CELL_SIZE / 4, 4, 8);
        foodGraphics.generateTexture('food', CELL_SIZE, CELL_SIZE);
    }

    create() {
        // Draw grid
        const grid = this.add.graphics();
        grid.lineStyle(1, 0x333333, 0.3);
        for (let i = 0; i <= COLS; i++) {
            grid.moveTo(i * CELL_SIZE, 0);
            grid.lineTo(i * CELL_SIZE, ROWS * CELL_SIZE);
        }
        for (let i = 0; i <= ROWS; i++) {
            grid.moveTo(0, i * CELL_SIZE);
            grid.lineTo(COLS * CELL_SIZE, i * CELL_SIZE);
        }
        grid.strokePath();

        // Initialize snake
        this.createSnake();

        // Initialize food
        this.food = this.add.container(0, 0);
        const foodSprite = this.add.sprite(CELL_SIZE/2, CELL_SIZE/2, 'food');
        this.food.add(foodSprite);
        this.placeFood();

        // Input
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.wasd = {
            up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };
    }

    createSnake() {
        // Clear existing snake
        this.snake.forEach(part => part.destroy());
        this.snake = [];

        // Create initial snake
        const startX = 5;
        const startY = 7;
        for (let i = 0; i < 3; i++) {
            this.addSnakePart(startX - i, startY);
        }
        
        this.direction = 'RIGHT';
        this.nextDirection = 'RIGHT';
    }

    addSnakePart(x: number, y: number) {
        const isHead = this.snake.length === 0;
        const color = isHead ? 0x00ff00 : 0x009900;
        
        const part = this.add.rectangle(
            x * CELL_SIZE + CELL_SIZE/2, 
            y * CELL_SIZE + CELL_SIZE/2, 
            CELL_SIZE - 4, 
            CELL_SIZE - 4, 
            color
        );
        
        // Add rounded corners visual effect
        // Note: Phaser rectangle doesn't support rounded corners directly easily without graphics
        // but for simplicity we keep it as rectangle or could use graphics
        
        this.snake.push(part);
    }

    placeFood() {
        let valid = false;
        let x = 0;
        let y = 0;

        while (!valid) {
            x = Phaser.Math.Between(0, COLS - 1);
            y = Phaser.Math.Between(0, ROWS - 1);

            valid = !this.snake.some(part => {
                const partX = Math.floor(part.x / CELL_SIZE);
                const partY = Math.floor(part.y / CELL_SIZE);
                return partX === x && partY === y;
            });
        }

        this.food.setPosition(x * CELL_SIZE, y * CELL_SIZE);
    }

    update(time: number, delta: number) {
        if (this.isGameOver) return;

        this.handleInput();

        this.moveTimer += delta;
        if (this.moveTimer > SPEED) {
            this.moveTimer = 0;
            this.moveSnake();
        }
    }

    handleInput() {
        if ((this.cursors.up.isDown || this.wasd.up.isDown) && this.direction !== 'DOWN') {
            this.nextDirection = 'UP';
        } else if ((this.cursors.down.isDown || this.wasd.down.isDown) && this.direction !== 'UP') {
            this.nextDirection = 'DOWN';
        } else if ((this.cursors.left.isDown || this.wasd.left.isDown) && this.direction !== 'RIGHT') {
            this.nextDirection = 'LEFT';
        } else if ((this.cursors.right.isDown || this.wasd.right.isDown) && this.direction !== 'LEFT') {
            this.nextDirection = 'RIGHT';
        }
    }

    moveSnake() {
        this.direction = this.nextDirection;

        // Get head position
        const head = this.snake[0];
        let headX = Math.floor(head.x / CELL_SIZE);
        let headY = Math.floor(head.y / CELL_SIZE);

        // Calculate new head position
        switch (this.direction) {
            case 'UP': headY--; break;
            case 'DOWN': headY++; break;
            case 'LEFT': headX--; break;
            case 'RIGHT': headX++; break;
        }

        // Check collisions
        if (this.checkCollision(headX, headY)) {
            this.gameOver();
            return;
        }

        // Check food
        const foodX = Math.floor(this.food.x / CELL_SIZE);
        const foodY = Math.floor(this.food.y / CELL_SIZE);
        
        if (headX === foodX && headY === foodY) {
            this.growSnake(headX, headY);
            this.placeFood();
            this.score++;
            this.onScoreUpdate(this.score);
        } else {
            this.moveBody(headX, headY);
        }
    }

    checkCollision(x: number, y: number): boolean {
        // Wall collision
        if (x < 0 || x >= COLS || y < 0 || y >= ROWS) {
            return true;
        }

        // Self collision
        // We skip the last part because it will move away unless we just ate
        for (let i = 0; i < this.snake.length - 1; i++) {
            const part = this.snake[i];
            const partX = Math.floor(part.x / CELL_SIZE);
            const partY = Math.floor(part.y / CELL_SIZE);
            if (partX === x && partY === y) {
                return true;
            }
        }

        return false;
    }

    growSnake(x: number, y: number) {
        // Create new head
        const newHead = this.add.rectangle(
            x * CELL_SIZE + CELL_SIZE/2, 
            y * CELL_SIZE + CELL_SIZE/2, 
            CELL_SIZE - 4, 
            CELL_SIZE - 4, 
            0x00ff00
        );
        
        // Change old head color
        this.snake[0].setFillStyle(0x009900);
        
        this.snake.unshift(newHead);
    }

    moveBody(x: number, y: number) {
        // Move tail to head position
        const tail = this.snake.pop();
        if (tail) {
            tail.setPosition(x * CELL_SIZE + CELL_SIZE/2, y * CELL_SIZE + CELL_SIZE/2);
            tail.setFillStyle(0x00ff00); // New head color
            
            // Old head becomes body color
            this.snake[0].setFillStyle(0x009900);
            
            this.snake.unshift(tail);
        }
    }

    gameOver() {
        this.isGameOver = true;
        this.onGameOver(this.score);
    }
}

const Snake: React.FC = () => {
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
    const [score, setScore] = useState(0);
    const gameRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        if (gameState === 'playing') {
            const config: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                width: COLS * CELL_SIZE,
                height: ROWS * CELL_SIZE,
                parent: 'phaser-game',
                backgroundColor: '#1a1a2e',
                scene: new SnakeScene(
                    (s) => setScore(s),
                    (s) => {
                        setScore(s);
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
        setGameState('playing');
    };

    if (gameState === 'start') {
        return (
            <GameStartScreen
                title="🐍 SNAKE"
                description="¡Come manzanas y haz crecer tu serpiente sin chocarte!"
                instructions={[
                    {
                        title: 'Controles',
                        items: [
                            'WASD: Mover en todas direcciones',
                            '↑↓←→: También puedes usar las flechas'
                        ],
                        icon: '🎮'
                    },
                    {
                        title: 'Objetivo',
                        items: [
                            '🍎 Come las manzanas rojas para crecer',
                            '⚠️ No choques contra las paredes o tu cola'
                        ],
                        icon: '🎯'
                    },
                    {
                        title: 'Consejos',
                        items: [
                            'Planifica tus movimientos',
                            'Mantén espacio libre',
                            '¡La serpiente no puede ir hacia atrás!'
                        ],
                        icon: '💡'
                    }
                ]}
                onStart={startGame}
                theme={{
                    primary: '#00ff00',
                    secondary: '#32ff7e',
                    accent: '#32ff7e',
                    background: 'linear-gradient(135deg, #2d5016 0%, #0f3460 50%, #16213e 100%)'
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
                theme={{
                    primary: '#00ff00',
                    secondary: '#32ff7e',
                    accent: '#32ff7e',
                    background: 'linear-gradient(135deg, #2d5016 0%, #0f3460 50%, #16213e 100%)'
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
            background: '#1a1a2e',
            minHeight: '100dvh',
            color: 'white'
        }}>
            <h1 style={{ margin: '0 0 20px 0', color: '#00ff00' }}>🐍 Snake</h1>
            
            <div style={{ 
                marginBottom: '1rem', 
                fontSize: '1.5rem', 
                fontWeight: 'bold' 
            }}>
                Puntuación: {score}
            </div>

            <div id="phaser-game" style={{ 
                border: '3px solid #00ff00', 
                borderRadius: '8px',
                overflow: 'hidden'
            }} />
            
            <div style={{ marginTop: '20px', color: '#666' }}>
                Usa las flechas o WASD para moverte
            </div>
        </div>
    );
};

export default Snake;
