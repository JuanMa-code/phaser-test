import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import GameStartScreen from '../components/GameStartScreen';
import GameOverScreen from '../components/GameOverScreen';

const GAME_WIDTH = 1000;
const GAME_HEIGHT = 700;
const UI_HEIGHT = 120;
const PLAYER_SPEED = 4;
const BULLET_SPEED = 8;
const BASE_ENEMY_SPEED = 0.5;
const SPAWN_RATE = 120;
const BASE_SHOOT_COOLDOWN = 60;
const ENEMY_SPEED_INCREASE = 20;
const EXP_PER_ENEMY = 15;
const BASE_ENEMY_HP = 3;
const POWERUP_SPAWN_RATE = 1800;
const POWERUP_DURATION = 600;

interface PlayerState {
    level: number;
    exp: number;
    expToNext: number;
    damage: number;
    health: number;
    maxHealth: number;
    shield: number;
    multiShot: number;
    critChance: number;
    critDamage: number;
}

class BrotatoScene extends Phaser.Scene {
    private player!: Phaser.GameObjects.Container;
    private playerGraphics!: Phaser.GameObjects.Graphics;
    private bullets!: Phaser.GameObjects.Group;
    private enemies!: Phaser.GameObjects.Group;
    private powerUps!: Phaser.GameObjects.Group;
    private particles!: Phaser.GameObjects.Group;
    private damageTexts!: Phaser.GameObjects.Group;
    
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: {
        W: Phaser.Input.Keyboard.Key;
        A: Phaser.Input.Keyboard.Key;
        S: Phaser.Input.Keyboard.Key;
        D: Phaser.Input.Keyboard.Key;
    };

    // Game State
    private playerState: PlayerState = {
        level: 1,
        exp: 0,
        expToNext: 100,
        damage: 1,
        health: 100,
        maxHealth: 100,
        shield: 0,
        multiShot: 1,
        critChance: 0.1,
        critDamage: 2.0
    };

    private score: number = 0;
    private gameTime: number = 0;
    private spawnTimer: number = 0;
    private powerUpTimer: number = 0;
    private shootCooldown: number = 0;
    private currentEnemySpeed: number = BASE_ENEMY_SPEED;
    private currentEnemyHP: number = BASE_ENEMY_HP;
    private wave: number = 1;
    private enemiesKilled: number = 0;
    private combo: number = 0;
    private comboTimer: number = 0;

    // UI Elements
    private scoreText!: Phaser.GameObjects.Text;
    private levelText!: Phaser.GameObjects.Text;
    private waveText!: Phaser.GameObjects.Text;
    private killsText!: Phaser.GameObjects.Text;
    private healthBar!: Phaser.GameObjects.Graphics;
    private healthText!: Phaser.GameObjects.Text;
    private shieldBar!: Phaser.GameObjects.Graphics;
    private shieldText!: Phaser.GameObjects.Text;
    private expBar!: Phaser.GameObjects.Graphics;
    private expText!: Phaser.GameObjects.Text;
    private statsText!: Phaser.GameObjects.Text;
    private timeText!: Phaser.GameObjects.Text;
    private comboText!: Phaser.GameObjects.Text;

    private onGameOver: (score: number) => void;

    constructor(onGameOver: (score: number) => void) {
        super('BrotatoScene');
        this.onGameOver = onGameOver;
    }

    create() {
        this.cameras.main.setBackgroundColor('#1a1a2e');

        // Setup Inputs
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.wasd = this.input.keyboard.addKeys('W,A,S,D') as any;
        }

        // Groups
        this.bullets = this.add.group();
        this.enemies = this.add.group();
        this.powerUps = this.add.group();
        this.particles = this.add.group();
        this.damageTexts = this.add.group();

        // Create Player
        this.player = this.add.container(GAME_WIDTH / 2, (GAME_HEIGHT + UI_HEIGHT) / 2);
        this.playerGraphics = this.add.graphics();
        this.player.add(this.playerGraphics);
        
        // Initial Draw Player
        this.drawPlayer();

        // UI Layer
        this.createUI();

        // Timers
        this.spawnTimer = SPAWN_RATE;
        this.powerUpTimer = POWERUP_SPAWN_RATE;
    }

    update() {
        this.gameTime++;
        this.handleInput();
        this.updatePlayer();
        this.handleShooting();
        this.updateBullets();
        this.updateEnemies();
        this.checkCollisions();
        this.updateParticles();
        this.updateDamageTexts();
        this.updatePowerUps();
        this.updateUI();
        this.handleSpawning();
        this.handleDifficulty();
    }

    private createUI() {
        // UI Background
        const uiBg = this.add.graphics();
        uiBg.fillStyle(0x0f0f23);
        uiBg.fillRect(0, 0, GAME_WIDTH, UI_HEIGHT);
        uiBg.lineStyle(2, 0x4dabf7);
        uiBg.beginPath();
        uiBg.moveTo(0, UI_HEIGHT);
        uiBg.lineTo(GAME_WIDTH, UI_HEIGHT);
        uiBg.strokePath();

        const textStyle = { fontFamily: 'Arial', fontSize: '18px', color: '#ffffff', fontStyle: 'bold' };
        
        this.scoreText = this.add.text(20, 15, 'Score: 0', textStyle);
        this.levelText = this.add.text(20, 40, 'Level: 1', { ...textStyle, color: '#feca57', fontSize: '16px' });
        this.waveText = this.add.text(20, 65, 'Wave: 1', { ...textStyle, color: '#00ffff', fontSize: '14px' });
        this.killsText = this.add.text(20, 90, 'Kills: 0', { ...textStyle, fontSize: '14px' });

        // Bars
        this.healthBar = this.add.graphics();
        this.healthText = this.add.text(255, 27, '', { ...textStyle, fontSize: '12px' });
        
        this.shieldBar = this.add.graphics();
        this.shieldText = this.add.text(255, 45, '', { ...textStyle, color: '#00ffff', fontSize: '10px' });
        
        this.expBar = this.add.graphics();
        this.expText = this.add.text(255, 85, '', { ...textStyle, color: '#feca57', fontSize: '10px' });

        // Stats
        this.statsText = this.add.text(520, 15, '', { ...textStyle, fontSize: '14px' });
        this.timeText = this.add.text(GAME_WIDTH - 120, 15, '', { ...textStyle, fontSize: '14px' });
        this.comboText = this.add.text(GAME_WIDTH - 150, 40, '', { ...textStyle, color: '#ff00ff', fontSize: '16px' });
        this.comboText.setVisible(false);
    }

    private drawPlayer() {
        this.playerGraphics.clear();
        if (this.playerState.shield > 0) {
            this.playerGraphics.lineStyle(3, 0x00ffff, 0.8);
            this.playerGraphics.strokeCircle(0, 0, 20);
        }
        this.playerGraphics.fillStyle(0x4dabf7);
        this.playerGraphics.fillCircle(0, 0, 15);

        // Aim line
        const pointer = this.input.activePointer;
        const dx = pointer.x - this.player.x;
        const dy = pointer.y - this.player.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length > 0) {
            const normalizedX = dx / length;
            const normalizedY = dy / length;
            this.playerGraphics.lineStyle(3, 0xffffff);
            this.playerGraphics.beginPath();
            this.playerGraphics.moveTo(0, 0);
            this.playerGraphics.lineTo(normalizedX * 25, normalizedY * 25);
            this.playerGraphics.strokePath();
        }
    }

    private handleInput() {
        let dx = 0;
        let dy = 0;

        if (this.wasd.W.isDown || this.cursors.up.isDown) dy -= 1;
        if (this.wasd.S.isDown || this.cursors.down.isDown) dy += 1;
        if (this.wasd.A.isDown || this.cursors.left.isDown) dx -= 1;
        if (this.wasd.D.isDown || this.cursors.right.isDown) dx += 1;

        if (dx !== 0 || dy !== 0) {
            // Normalize diagonal movement
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;

            this.player.x += dx * PLAYER_SPEED;
            this.player.y += dy * PLAYER_SPEED;

            // Bounds checking
            this.player.x = Phaser.Math.Clamp(this.player.x, 15, GAME_WIDTH - 15);
            this.player.y = Phaser.Math.Clamp(this.player.y, UI_HEIGHT + 15, GAME_HEIGHT + UI_HEIGHT - 15);
        }
    }

    private updatePlayer() {
        this.drawPlayer();
    }

    private handleShooting() {
        this.shootCooldown = Math.max(0, this.shootCooldown - 1);
        
        if (this.shootCooldown === 0) {
            const pointer = this.input.activePointer;
            const dx = pointer.x - this.player.x;
            const dy = pointer.y - this.player.y;
            const length = Math.sqrt(dx * dx + dy * dy);

            if (length > 0) {
                const normalizedX = dx / length;
                const normalizedY = dy / length;
                const currentShootCooldown = Math.max(10, BASE_SHOOT_COOLDOWN - (this.playerState.level - 1) * 5);

                for (let i = 0; i < this.playerState.multiShot; i++) {
                    const angleOffset = (i - (this.playerState.multiShot - 1) / 2) * 0.2;
                    const cos = Math.cos(angleOffset);
                    const sin = Math.sin(angleOffset);
                    const rotatedX = normalizedX * cos - normalizedY * sin;
                    const rotatedY = normalizedX * sin + normalizedY * cos;

                    const isCrit = Math.random() < this.playerState.critChance;
                    
                    const bullet = this.add.graphics();
                    if (isCrit) {
                        bullet.lineStyle(2, 0xffff00, 0.8);
                        bullet.fillStyle(0xffaa00);
                        bullet.fillCircle(0, 0, 8);
                        bullet.strokeCircle(0, 0, 8);
                    } else {
                        bullet.fillStyle(0xfeca57);
                        bullet.fillCircle(0, 0, 4);
                    }
                    
                    const bulletContainer = this.add.container(this.player.x, this.player.y);
                    bulletContainer.add(bullet);
                    
                    // Store bullet data
                    bulletContainer.setData('vx', rotatedX * BULLET_SPEED);
                    bulletContainer.setData('vy', rotatedY * BULLET_SPEED);
                    bulletContainer.setData('isCrit', isCrit);
                    bulletContainer.setData('piercing', this.playerState.level > 5 ? 1 : 0);
                    bulletContainer.setData('radius', isCrit ? 6 : 4);

                    this.bullets.add(bulletContainer);
                }
                this.shootCooldown = currentShootCooldown;
            }
        }
    }

    private updateBullets() {
        this.bullets.getChildren().forEach((b: any) => {
            const bullet = b as Phaser.GameObjects.Container;
            bullet.x += bullet.getData('vx');
            bullet.y += bullet.getData('vy');

            // Trail effect
            if (bullet.getData('piercing') > 0 && Math.random() < 0.3) {
                const trail = this.add.graphics();
                trail.fillStyle(0x00ffff, 0.5);
                trail.fillCircle(bullet.x, bullet.y, 2);
                this.tweens.add({
                    targets: trail,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => trail.destroy()
                });
            }

            // Bounds check
            if (bullet.x < -10 || bullet.x > GAME_WIDTH + 10 || 
                bullet.y < UI_HEIGHT - 10 || bullet.y > GAME_HEIGHT + UI_HEIGHT + 10) {
                bullet.destroy();
            }
        });
    }

    private handleSpawning() {
        this.spawnTimer--;
        if (this.spawnTimer <= 0) {
            this.spawnEnemy();
            this.spawnTimer = SPAWN_RATE - Math.min(this.score / 10, 80);
        }
    }

    private spawnEnemy() {
        const side = Phaser.Math.Between(0, 3);
        let x = 0, y = 0;

        switch (side) {
            case 0: x = Phaser.Math.Between(0, GAME_WIDTH); y = UI_HEIGHT - 20; break;
            case 1: x = GAME_WIDTH + 20; y = Phaser.Math.Between(UI_HEIGHT, GAME_HEIGHT + UI_HEIGHT); break;
            case 2: x = Phaser.Math.Between(0, GAME_WIDTH); y = GAME_HEIGHT + UI_HEIGHT + 20; break;
            case 3: x = -20; y = Phaser.Math.Between(UI_HEIGHT, GAME_HEIGHT + UI_HEIGHT); break;
        }

        let type = 'normal';
        let color = 0xff4757;
        let radius = 12;
        let speed = this.currentEnemySpeed;
        let damage = 10;
        let hp = this.currentEnemyHP;

        const rand = Math.random();
        const timeMultiplier = Math.floor(this.gameTime / 1800);

        if (timeMultiplier > 0 && rand < 0.15) {
            type = 'fast'; color = 0x00ff88; radius = 10; speed *= 1.8; damage = 8; hp = Math.floor(hp * 0.7);
        } else if (timeMultiplier > 1 && rand < 0.25) {
            type = 'tank'; color = 0x333333; radius = 18; speed *= 0.6; damage = 20; hp = Math.floor(hp * 2.5);
        } else if (timeMultiplier > 2 && rand < 0.3) {
            type = 'bomber'; color = 0xfeca57; radius = 14; speed *= 1.2; damage = 30;
        }

        const enemyContainer = this.add.container(x, y);
        const enemyGfx = this.add.graphics();
        enemyGfx.fillStyle(color);
        enemyGfx.fillCircle(0, 0, radius);
        
        if (type === 'fast') {
            enemyGfx.lineStyle(2, 0xffff00, 0.6);
            // Simple spikes
            enemyGfx.beginPath();
            enemyGfx.moveTo(radius, 0); enemyGfx.lineTo(radius + 5, 0);
            enemyGfx.moveTo(-radius, 0); enemyGfx.lineTo(-(radius + 5), 0);
            enemyGfx.moveTo(0, radius); enemyGfx.lineTo(0, radius + 5);
            enemyGfx.moveTo(0, -radius); enemyGfx.lineTo(0, -(radius + 5));
            enemyGfx.strokePath();
        } else if (type === 'tank') {
            enemyGfx.lineStyle(3, 0x666666);
            enemyGfx.strokeCircle(0, 0, radius + 3);
        }

        const hpBar = this.add.graphics();
        const typeText = this.add.text(0, -radius - 20, type.charAt(0).toUpperCase(), {
            fontSize: '8px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        enemyContainer.add([enemyGfx, hpBar, typeText]);
        
        enemyContainer.setData('type', type);
        enemyContainer.setData('hp', hp);
        enemyContainer.setData('maxHp', hp);
        enemyContainer.setData('speed', speed);
        enemyContainer.setData('damage', damage);
        enemyContainer.setData('radius', radius);
        enemyContainer.setData('color', color);

        this.enemies.add(enemyContainer);
    }

    private updateEnemies() {
        this.enemies.getChildren().forEach((e: any) => {
            const enemy = e as Phaser.GameObjects.Container;
            const speed = enemy.getData('speed');
            
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const length = Math.sqrt(dx * dx + dy * dy);

            if (length > 0) {
                enemy.x += (dx / length) * speed;
                enemy.y += (dy / length) * speed;
            }

            // Update HP Bar
            const hpBar = enemy.list[1] as Phaser.GameObjects.Graphics;
            const hp = enemy.getData('hp');
            const maxHp = enemy.getData('maxHp');
            const radius = enemy.getData('radius');
            
            hpBar.clear();
            hpBar.fillStyle(0x333333);
            hpBar.fillRect(-15, -radius - 10, 30, 4);
            hpBar.fillStyle(0xff6b6b);
            hpBar.fillRect(-15, -radius - 10, 30 * (hp / maxHp), 4);

            // Bomber pulse
            if (enemy.getData('type') === 'bomber') {
                const gfx = enemy.list[0] as Phaser.GameObjects.Graphics;
                gfx.clear();
                gfx.fillStyle(enemy.getData('color'));
                gfx.fillCircle(0, 0, radius);
                gfx.lineStyle(2, 0xff8800, 0.7);
                gfx.strokeCircle(0, 0, radius + Math.sin(this.gameTime / 10) * 3);
            }
        });
    }

    private checkCollisions() {
        // Bullet vs Enemy
        this.bullets.getChildren().forEach((b: any) => {
            const bullet = b as Phaser.GameObjects.Container;
            let piercingLeft = bullet.getData('piercing');
            let bulletDestroyed = false;

            this.enemies.getChildren().forEach((e: any) => {
                if (bulletDestroyed) return;
                const enemy = e as Phaser.GameObjects.Container;
                
                const dx = bullet.x - enemy.x;
                const dy = bullet.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const minDist = bullet.getData('radius') + enemy.getData('radius');

                if (dist < minDist) {
                    this.damageEnemy(enemy, bullet.getData('isCrit'));
                    
                    if (piercingLeft <= 0) {
                        bullet.destroy();
                        bulletDestroyed = true;
                    } else {
                        piercingLeft--;
                    }
                }
            });
        });

        // Player vs Enemy
        this.enemies.getChildren().forEach((e: any) => {
            const enemy = e as Phaser.GameObjects.Container;
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = 15 + enemy.getData('radius'); // Player radius 15

            if (dist < minDist) {
                this.damagePlayer(enemy.getData('damage'));
                
                // Knockback
                const knockback = 5;
                enemy.x -= (dx / dist) * knockback;
                enemy.y -= (dy / dist) * knockback;
            }
        });
    }

    private damageEnemy(enemy: Phaser.GameObjects.Container, isCrit: boolean) {
        let damage = this.playerState.damage;
        if (isCrit) damage = Math.floor(damage * this.playerState.critDamage);

        let hp = enemy.getData('hp');
        hp -= damage;
        enemy.setData('hp', hp);

        // Damage Text
        const text = this.add.text(enemy.x, enemy.y - 20, damage.toString(), {
            fontSize: isCrit ? '16px' : '12px',
            color: isCrit ? '#feca57' : '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: text,
            y: text.y - 30,
            alpha: 0,
            duration: 1000,
            onComplete: () => text.destroy()
        });

        // Particles
        for (let i = 0; i < (isCrit ? 8 : 4); i++) {
            const p = this.add.circle(enemy.x, enemy.y, isCrit ? 4 : 2, isCrit ? 0xfeca57 : enemy.getData('color'));
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            this.tweens.add({
                targets: p,
                x: p.x + Math.cos(angle) * 30,
                y: p.y + Math.sin(angle) * 30,
                alpha: 0,
                duration: 500,
                onComplete: () => p.destroy()
            });
        }

        if (hp <= 0) {
            this.killEnemy(enemy);
        }
    }

    private killEnemy(enemy: Phaser.GameObjects.Container) {
        const type = enemy.getData('type');
        const scoreGain = type === 'tank' ? 25 : type === 'bomber' ? 20 : 10;
        const expGain = EXP_PER_ENEMY * (type === 'tank' ? 2 : type === 'bomber' ? 1.5 : 1);

        this.score += scoreGain;
        this.enemiesKilled++;
        this.combo++;
        this.comboTimer = 180;
        
        this.playerState.exp += expGain;
        if (this.playerState.exp >= this.playerState.expToNext) {
            this.levelUp();
        }

        enemy.destroy();
    }

    private levelUp() {
        this.playerState.level++;
        this.playerState.exp -= this.playerState.expToNext;
        this.playerState.expToNext = Math.floor(this.playerState.expToNext * 1.2);
        this.playerState.damage++;
        this.playerState.maxHealth += 10;
        this.playerState.health = this.playerState.maxHealth;

        const rand = Math.random();
        if (rand < 0.3) this.playerState.multiShot++;
        else if (rand < 0.6) this.playerState.critChance = Math.min(0.8, this.playerState.critChance + 0.05);
        else this.playerState.critDamage += 0.2;
    }

    private damagePlayer(amount: number) {
        if (this.playerState.shield > 0) {
            const absorbed = Math.min(this.playerState.shield, amount);
            this.playerState.shield -= absorbed;
            amount -= absorbed;
        }

        if (amount > 0) {
            this.playerState.health -= amount;
            
            const text = this.add.text(this.player.x, this.player.y - 20, `-${amount}`, {
                fontSize: '12px', color: '#ff4757', fontStyle: 'bold', stroke: '#000000', strokeThickness: 2
            }).setOrigin(0.5);
            
            this.tweens.add({
                targets: text,
                y: text.y - 30,
                alpha: 0,
                duration: 1000,
                onComplete: () => text.destroy()
            });

            if (this.playerState.health <= 0) {
                this.scene.pause();
                this.onGameOver(this.score);
            }
        }
    }

    private updatePowerUps() {
        this.powerUpTimer--;
        if (this.powerUpTimer <= 0) {
            const types = ['health', 'damage', 'speed', 'multishot', 'shield'];
            const type = types[Phaser.Math.Between(0, types.length - 1)];
            const x = Phaser.Math.Between(20, GAME_WIDTH - 20);
            const y = Phaser.Math.Between(UI_HEIGHT + 20, GAME_HEIGHT + UI_HEIGHT - 20);

            let color = 0x00ff00;
            if (type === 'damage') color = 0xff0000;
            else if (type === 'speed') color = 0x0000ff;
            else if (type === 'multishot') color = 0xffff00;
            else if (type === 'shield') color = 0x00ffff;

            const p = this.add.container(x, y);
            const gfx = this.add.graphics();
            gfx.fillStyle(color);
            gfx.fillRect(-10, -10, 20, 20);
            gfx.lineStyle(2, color, 0.8);
            gfx.strokeRect(-12, -12, 24, 24);
            
            const text = this.add.text(0, 0, type.charAt(0).toUpperCase(), {
                fontSize: '12px', color: '#ffffff', fontStyle: 'bold'
            }).setOrigin(0.5);

            p.add([gfx, text]);
            p.setData('type', type);
            p.setData('timer', POWERUP_DURATION);
            
            this.powerUps.add(p);
            this.powerUpTimer = POWERUP_SPAWN_RATE;
        }

        this.powerUps.getChildren().forEach((p: any) => {
            const powerUp = p as Phaser.GameObjects.Container;
            let timer = powerUp.getData('timer');
            timer--;
            powerUp.setData('timer', timer);

            if (timer <= 0) {
                powerUp.destroy();
                return;
            }

            const dx = this.player.x - powerUp.x;
            const dy = this.player.y - powerUp.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 15 + 12) { // Player radius + powerup radius
                const type = powerUp.getData('type');
                switch (type) {
                    case 'health': this.playerState.health = Math.min(this.playerState.maxHealth, this.playerState.health + 30); break;
                    case 'damage': this.playerState.damage += 2; break;
                    case 'multishot': this.playerState.multiShot++; break;
                    case 'shield': this.playerState.shield += 50; break;
                }
                powerUp.destroy();
            }
        });
    }

    private updateParticles() {
        // Handled by tweens in this version
    }

    private updateDamageTexts() {
        // Handled by tweens in this version
    }

    private updateUI() {
        this.scoreText.setText(`Score: ${this.score}`);
        this.levelText.setText(`Level: ${this.playerState.level}`);
        this.waveText.setText(`Wave: ${this.wave}`);
        this.killsText.setText(`Kills: ${this.enemiesKilled}`);

        // Health Bar
        this.healthBar.clear();
        this.healthBar.fillStyle(0x333333);
        this.healthBar.fillRect(250, 25, 200, 16);
        this.healthBar.fillStyle(0x00ff00);
        this.healthBar.fillRect(250, 25, 200 * (this.playerState.health / this.playerState.maxHealth), 16);
        this.healthText.setText(`HP: ${Math.ceil(this.playerState.health)}/${this.playerState.maxHealth}`);

        // Shield Bar
        this.shieldBar.clear();
        if (this.playerState.shield > 0) {
            this.shieldBar.fillStyle(0x00ffff);
            this.shieldBar.fillRect(250, 45, (this.playerState.shield / 100) * 200, 8);
            this.shieldText.setText(`Shield: ${Math.ceil(this.playerState.shield)}`);
            this.shieldText.setVisible(true);
        } else {
            this.shieldText.setVisible(false);
        }

        // Exp Bar
        this.expBar.clear();
        this.expBar.fillStyle(0x333333);
        this.expBar.fillRect(250, 70, 200, 12);
        this.expBar.fillStyle(0xfeca57);
        this.expBar.fillRect(250, 70, 200 * (this.playerState.exp / this.playerState.expToNext), 12);
        this.expText.setText(`EXP: ${Math.floor(this.playerState.exp)}/${this.playerState.expToNext}`);

        // Stats
        this.statsText.setText(
            `Damage: ${this.playerState.damage.toFixed(1)}\n` +
            `Multishot: ${this.playerState.multiShot}\n` +
            `Crit: ${(this.playerState.critChance * 100).toFixed(1)}%\n` +
            `Crit Dmg: ${this.playerState.critDamage.toFixed(1)}x`
        );
        this.statsText.setColor('#ff6b6b');

        this.timeText.setText(`Time: ${Math.floor(this.gameTime / 60)}s`);

        if (this.combo > 1) {
            this.comboText.setText(`COMBO x${this.combo}!`);
            this.comboText.setVisible(true);
            this.comboTimer--;
            if (this.comboTimer <= 0) this.combo = 0;
        } else {
            this.comboText.setVisible(false);
        }
    }

    private handleDifficulty() {
        const speedIncreaseInterval = ENEMY_SPEED_INCREASE * 60;
        const speedIncreases = Math.floor(this.gameTime / speedIncreaseInterval);
        this.currentEnemySpeed = BASE_ENEMY_SPEED + (speedIncreases * 0.2);
        this.currentEnemyHP = Math.floor(BASE_ENEMY_HP + (speedIncreases * 1.5));
    }
}

const Brotato: React.FC = () => {
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<Phaser.Game | null>(null);
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [showInstructions, setShowInstructions] = useState(true);

    useEffect(() => {
        if (showInstructions || gameOver) return;

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            width: GAME_WIDTH,
            height: GAME_HEIGHT + UI_HEIGHT,
            parent: gameContainerRef.current || undefined,
            backgroundColor: '#1a1a2e',
            scene: new BrotatoScene((finalScore) => {
                setScore(finalScore);
                setGameOver(true);
            })
        };

        gameRef.current = new Phaser.Game(config);

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, [showInstructions, gameOver]);

    const restartGame = () => {
        setGameOver(false);
        setShowInstructions(false);
        setScore(0);
    };

    if (showInstructions) {
        return (
            <GameStartScreen
                title="🥔 Brotato Style"
                description="Sobrevive el mayor tiempo posible eliminando oleadas de enemigos y mejorando tus habilidades."
                instructions={[
                    {
                        title: "Controles",
                        items: [
                            "WASD: Mover jugador",
                            "Mouse: Apuntar (disparo automático)"
                        ],
                        icon: "🎮"
                    },
                    {
                        title: "Características",
                        items: [
                            "Niveles: Gana EXP eliminando enemigos",
                            "Power-ups: Recoge mejoras (salud, daño, escudo, multidisparo)",
                            "Críticos: Disparos que hacen más daño",
                            "Combos: Elimina enemigos consecutivamente",
                            "Escudo: Protección temporal contra daño"
                        ],
                        icon: "⭐"
                    }
                ]}
                theme={{
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                    primary: '#4dabf7',
                    secondary: '#feca57',
                    accent: '#ff4757',
                }}
                onStart={() => setShowInstructions(false)}
            />
        );
    }

    if (gameOver) {
        return (
            <GameOverScreen
                score={score}
                onRestart={restartGame}
                onMenu={() => window.history.back()}
                theme={{
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                    primaryColor: '#4dabf7',
                    secondaryColor: '#feca57',
                    accentColor: '#ff4757',
                    titleGradient: 'linear-gradient(45deg, #4dabf7, #74b9ff)',
                    buttonGradient: 'linear-gradient(45deg, #4dabf7, #74b9ff)'
                }}
            />
        );
    }

    return (
        <div style={{ textAlign: 'center', padding: '1rem' }}>
            <h1 style={{ marginBottom: '1rem', color: '#4dabf7' }}>🥔 Brotato Style</h1>
            <div style={{ marginBottom: '1rem', color: '#747d8c' }}>
                Use WASD to move • Aim with mouse • Survive as long as you can!
            </div>
            <div ref={gameContainerRef} style={{ 
                display: 'inline-block',
                border: '2px solid #4dabf7',
                borderRadius: '8px',
                overflow: 'hidden'
            }} />
        </div>
    );
};

export default Brotato;
