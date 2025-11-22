import * as PIXI from 'pixi.js';
import React, { useEffect, useRef, useState } from 'react';
import GameStartScreen from '../components/GameStartScreen';
import GameOverScreen from '../components/GameOverScreen';

const GAME_WIDTH = 1000;
const GAME_HEIGHT = 700;
const UI_HEIGHT = 120; // Altura del header UI
const PLAYER_SPEED = 4;
const BULLET_SPEED = 8;
const BASE_ENEMY_SPEED = 0.5;
const SPAWN_RATE = 120;
const BASE_SHOOT_COOLDOWN = 60;
const ENEMY_SPEED_INCREASE = 20;
const EXP_PER_ENEMY = 15;
const BASE_ENEMY_HP = 3;

// Nuevas constantes para mejoras
const POWERUP_SPAWN_RATE = 1800; // 30 segundos
const POWERUP_DURATION = 600; // 10 segundos
const PARTICLE_COUNT = 8;

interface Player {
  x: number;
  y: number;
  radius: number;
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

interface Enemy {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  radius: number;
  alive: boolean;
  type: 'normal' | 'fast' | 'tank' | 'bomber';
  speed: number;
  damage: number;
  color: number;
  sprite?: PIXI.Graphics;
  text?: PIXI.Text;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isCrit: boolean;
  piercing: number;
  sprite?: PIXI.Graphics;
}

interface PowerUp {
  x: number;
  y: number;
  type: 'health' | 'damage' | 'speed' | 'multishot' | 'shield';
  radius: number;
  size: number;
  active: boolean;
  timer: number;
  sprite?: PIXI.Graphics;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: number;
  size: number;
  alpha: number;
  sprite?: PIXI.Graphics;
}

interface DamageText {
  x: number;
  y: number;
  text: string;
  timer: number;
  color: number;
  isCrit: boolean;
  sprite?: PIXI.Text;
}

const Brotato: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  
  const gameRef = useRef({
    player: { 
      x: GAME_WIDTH / 2, 
      y: (GAME_HEIGHT + UI_HEIGHT) / 2, // Centrar en el área de juego
      radius: 15,
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
    } as Player,
    enemies: [] as Enemy[],
    bullets: [] as Bullet[],
    powerUps: [] as PowerUp[],
    particles: [] as Particle[],
    damageTexts: [] as DamageText[],
    keys: {
      w: false,
      a: false,
      s: false,
      d: false,
    },
    mouseX: 0,
    mouseY: 0,
    spawnTimer: 0,
    powerUpTimer: 0,
    currentScore: 0,
    shootCooldown: 0,
    gameTime: 0,
    currentEnemySpeed: BASE_ENEMY_SPEED,
    currentEnemyHP: BASE_ENEMY_HP,
    wave: 1,
    enemiesKilled: 0,
    combo: 0,
    comboTimer: 0,
  });

  useEffect(() => {
    if (gameOver || showInstructions) return;

    const app = new PIXI.Application({
      width: GAME_WIDTH,
      height: GAME_HEIGHT + UI_HEIGHT,
      backgroundColor: 0x1a1a2e,
    });

    if (containerRef.current && app.view instanceof Node) {
      containerRef.current.appendChild(app.view);
    }

    // Layers
    const gameLayer = new PIXI.Container();
    const uiLayer = new PIXI.Container();
    app.stage.addChild(gameLayer);
    app.stage.addChild(uiLayer);

    // UI Background
    const uiBackground = new PIXI.Graphics();
    uiBackground.beginFill(0x0f0f23);
    uiBackground.drawRect(0, 0, GAME_WIDTH, UI_HEIGHT);
    uiBackground.endFill();
    uiBackground.lineStyle(2, 0x4dabf7);
    uiBackground.moveTo(0, UI_HEIGHT);
    uiBackground.lineTo(GAME_WIDTH, UI_HEIGHT);
    uiLayer.addChild(uiBackground);

    // UI Elements
    const scoreText = new PIXI.Text('', { fill: 0xffffff, fontSize: 18, fontWeight: 'bold' });
    scoreText.x = 20; scoreText.y = 15;
    uiLayer.addChild(scoreText);

    const levelText = new PIXI.Text('', { fill: 0xfeca57, fontSize: 16, fontWeight: 'bold' });
    levelText.x = 20; levelText.y = 40;
    uiLayer.addChild(levelText);

    const waveText = new PIXI.Text('', { fill: 0x00ffff, fontSize: 14, fontWeight: 'bold' });
    waveText.x = 20; waveText.y = 65;
    uiLayer.addChild(waveText);

    const killsText = new PIXI.Text('', { fill: 0xffffff, fontSize: 14, fontWeight: 'bold' });
    killsText.x = 20; killsText.y = 90;
    uiLayer.addChild(killsText);

    // Health Bar
    const healthBarBg = new PIXI.Graphics();
    healthBarBg.beginFill(0x333333);
    healthBarBg.drawRect(250, 25, 200, 16);
    healthBarBg.endFill();
    uiLayer.addChild(healthBarBg);
    const healthBar = new PIXI.Graphics();
    uiLayer.addChild(healthBar);
    const healthText = new PIXI.Text('', { fill: 0xffffff, fontSize: 12, fontWeight: 'bold' });
    healthText.x = 255; healthText.y = 27;
    uiLayer.addChild(healthText);

    // Shield Bar
    const shieldBar = new PIXI.Graphics();
    uiLayer.addChild(shieldBar);
    const shieldText = new PIXI.Text('', { fill: 0x00ffff, fontSize: 10, fontWeight: 'bold' });
    shieldText.x = 255; shieldText.y = 45;
    uiLayer.addChild(shieldText);

    // Exp Bar
    const expBarBg = new PIXI.Graphics();
    expBarBg.beginFill(0x333333);
    expBarBg.drawRect(250, 70, 200, 12);
    expBarBg.endFill();
    uiLayer.addChild(expBarBg);
    const expBar = new PIXI.Graphics();
    uiLayer.addChild(expBar);
    const expText = new PIXI.Text('', { fill: 0xfeca57, fontSize: 10, fontWeight: 'bold' });
    expText.x = 255; expText.y = 85;
    uiLayer.addChild(expText);

    // Stats
    const damageText = new PIXI.Text('', { fill: 0xff6b6b, fontSize: 14, fontWeight: 'bold' });
    damageText.x = 520; damageText.y = 15;
    uiLayer.addChild(damageText);
    const multishotText = new PIXI.Text('', { fill: 0xffff00, fontSize: 14, fontWeight: 'bold' });
    multishotText.x = 520; multishotText.y = 35;
    uiLayer.addChild(multishotText);
    const critText = new PIXI.Text('', { fill: 0xffaa00, fontSize: 14, fontWeight: 'bold' });
    critText.x = 520; critText.y = 55;
    uiLayer.addChild(critText);
    const critDamageText = new PIXI.Text('', { fill: 0xffaa00, fontSize: 14, fontWeight: 'bold' });
    critDamageText.x = 520; critDamageText.y = 75;
    uiLayer.addChild(critDamageText);

    const timeText = new PIXI.Text('', { fill: 0xffffff, fontSize: 14, fontWeight: 'bold' });
    timeText.x = GAME_WIDTH - 120; timeText.y = 15;
    uiLayer.addChild(timeText);

    const comboText = new PIXI.Text('', { fill: 0xff00ff, fontSize: 16, fontWeight: 'bold' });
    comboText.x = GAME_WIDTH - 150; comboText.y = 40;
    uiLayer.addChild(comboText);

    // Player Sprite
    const playerSprite = new PIXI.Graphics();
    gameLayer.addChild(playerSprite);

    function updateUI() {
        const player = gameRef.current.player;
        scoreText.text = `Score: ${gameRef.current.currentScore}`;
        levelText.text = `Level: ${player.level}`;
        waveText.text = `Wave: ${gameRef.current.wave}`;
        killsText.text = `Kills: ${gameRef.current.enemiesKilled}`;
        
        healthBar.clear();
        healthBar.beginFill(0x00ff00);
        healthBar.drawRect(250, 25, 200 * (player.health / player.maxHealth), 16);
        healthBar.endFill();
        healthText.text = `HP: ${Math.ceil(player.health)}/${player.maxHealth}`;

        shieldBar.clear();
        if (player.shield > 0) {
            shieldBar.beginFill(0x00ffff);
            shieldBar.drawRect(250, 45, (player.shield / 100) * 200, 8);
            shieldBar.endFill();
            shieldText.text = `Shield: ${Math.ceil(player.shield)}`;
            shieldText.visible = true;
        } else {
            shieldText.visible = false;
        }

        expBar.clear();
        expBar.beginFill(0xfeca57);
        expBar.drawRect(250, 70, 200 * (player.exp / player.expToNext), 12);
        expBar.endFill();
        expText.text = `EXP: ${Math.floor(player.exp)}/${player.expToNext}`;

        damageText.text = `Damage: ${player.damage.toFixed(1)}`;
        multishotText.text = `Multishot: ${player.multiShot}`;
        critText.text = `Crit: ${(player.critChance * 100).toFixed(1)}%`;
        critDamageText.text = `Crit Dmg: ${player.critDamage.toFixed(1)}x`;
        timeText.text = `Time: ${Math.floor(gameRef.current.gameTime / 60)}s`;

        if (gameRef.current.combo > 1) {
            comboText.text = `COMBO x${gameRef.current.combo}!`;
            comboText.visible = true;
        } else {
            comboText.visible = false;
        }
    }

    function spawnEnemy() {
      const side = Math.floor(Math.random() * 4);
      let x, y;

      switch (side) {
        case 0: // top
          x = Math.random() * GAME_WIDTH;
          y = UI_HEIGHT - 20;
          break;
        case 1: // right
          x = GAME_WIDTH + 20;
          y = Math.random() * GAME_HEIGHT + UI_HEIGHT;
          break;
        case 2: // bottom
          x = Math.random() * GAME_WIDTH;
          y = GAME_HEIGHT + UI_HEIGHT + 20;
          break;
        case 3: // left
          x = -20;
          y = Math.random() * GAME_HEIGHT + UI_HEIGHT;
          break;
        default:
          x = 0;
          y = UI_HEIGHT;
      }

      let enemyType: Enemy['type'] = 'normal';
      let enemyColor = 0xff4757;
      let enemyRadius = 12;
      let enemySpeed = gameRef.current.currentEnemySpeed;
      let enemyDamage = 10;
      let enemyHP = gameRef.current.currentEnemyHP;

      const rand = Math.random();
      const timeMultiplier = Math.floor(gameRef.current.gameTime / 1800);

      if (timeMultiplier > 0 && rand < 0.15) {
        enemyType = 'fast';
        enemyColor = 0x00ff88;
        enemyRadius = 10;
        enemySpeed = gameRef.current.currentEnemySpeed * 1.8;
        enemyDamage = 8;
        enemyHP = Math.floor(gameRef.current.currentEnemyHP * 0.7);
      } else if (timeMultiplier > 1 && rand < 0.25) {
        enemyType = 'tank';
        enemyColor = 0x333333;
        enemyRadius = 18;
        enemySpeed = gameRef.current.currentEnemySpeed * 0.6;
        enemyDamage = 20;
        enemyHP = Math.floor(gameRef.current.currentEnemyHP * 2.5);
      } else if (timeMultiplier > 2 && rand < 0.3) {
        enemyType = 'bomber';
        enemyColor = 0xfeca57;
        enemyRadius = 14;
        enemySpeed = gameRef.current.currentEnemySpeed * 1.2;
        enemyDamage = 30;
        enemyHP = gameRef.current.currentEnemyHP;
      }

      const sprite = new PIXI.Graphics();
      sprite.beginFill(enemyColor);
      sprite.drawCircle(0, 0, enemyRadius);
      sprite.endFill();

      if (enemyType === 'fast') {
        sprite.lineStyle(2, 0xffff00, 0.6);
        for (let i = 0; i < 3; i++) {
            const angle = Math.random() * Math.PI * 2;
            const sx = Math.cos(angle) * (enemyRadius + 5);
            const sy = Math.sin(angle) * (enemyRadius + 5);
            const ex = sx + Math.cos(angle) * 10;
            const ey = sy + Math.sin(angle) * 10;
            sprite.moveTo(sx, sy);
            sprite.lineTo(ex, ey);
        }
      } else if (enemyType === 'tank') {
        sprite.lineStyle(3, 0x666666);
        sprite.drawCircle(0, 0, enemyRadius + 3);
      } else if (enemyType === 'bomber') {
        // Pulse effect handled in update
      }

      // HP Bar container
      const hpBar = new PIXI.Graphics();
      sprite.addChild(hpBar);

      const typeText = new PIXI.Text(enemyType.charAt(0).toUpperCase(), {
          fill: 0xffffff, fontSize: 8, fontWeight: 'bold'
      });
      typeText.anchor.set(0.5);
      typeText.y = -enemyRadius - 20;
      sprite.addChild(typeText);

      sprite.x = x;
      sprite.y = y;
      gameLayer.addChild(sprite);

      gameRef.current.enemies.push({
        x, y, hp: enemyHP, maxHp: enemyHP, radius: enemyRadius,
        alive: true, type: enemyType, speed: enemySpeed,
        damage: enemyDamage, color: enemyColor, sprite
      });
    }

    function updateGame() {
      const player = gameRef.current.player;
      const keys = gameRef.current.keys;

      gameRef.current.gameTime++;

      const speedIncreaseInterval = ENEMY_SPEED_INCREASE * 60;
      const speedIncreases = Math.floor(gameRef.current.gameTime / speedIncreaseInterval);
      gameRef.current.currentEnemySpeed = BASE_ENEMY_SPEED + (speedIncreases * 0.2);
      gameRef.current.currentEnemyHP = Math.floor(BASE_ENEMY_HP + (speedIncreases * 1.5));

      if (!gameOver) {
        if (keys.w && player.y > player.radius + UI_HEIGHT) player.y -= PLAYER_SPEED;
        if (keys.s && player.y < GAME_HEIGHT + UI_HEIGHT - player.radius) player.y += PLAYER_SPEED;
        if (keys.a && player.x > player.radius) player.x -= PLAYER_SPEED;
        if (keys.d && player.x < GAME_WIDTH - player.radius) player.x += PLAYER_SPEED;
      }

      // Update Player Sprite
      playerSprite.clear();
      if (player.shield > 0) {
        playerSprite.lineStyle(3, 0x00ffff, 0.8);
        playerSprite.drawCircle(0, 0, player.radius + 5);
      }
      playerSprite.beginFill(0x4dabf7);
      playerSprite.drawCircle(0, 0, player.radius);
      playerSprite.endFill();
      
      const dx = gameRef.current.mouseX - player.x;
      const dy = gameRef.current.mouseY - player.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length > 0) {
        const normalizedX = dx / length;
        const normalizedY = dy / length;
        playerSprite.lineStyle(3, 0xffffff);
        playerSprite.moveTo(0, 0);
        playerSprite.lineTo(normalizedX * 25, normalizedY * 25);
      }
      playerSprite.x = player.x;
      playerSprite.y = player.y;

      // Auto-shoot
      const currentShootCooldown = Math.max(10, BASE_SHOOT_COOLDOWN - (player.level - 1) * 5);
      gameRef.current.shootCooldown = Math.max(0, gameRef.current.shootCooldown - 1);
      if (gameRef.current.shootCooldown === 0) {
        if (length > 0) {
          const normalizedX = dx / length;
          const normalizedY = dy / length;
          
          for (let i = 0; i < player.multiShot; i++) {
            const angleOffset = (i - (player.multiShot - 1) / 2) * 0.2;
            const cos = Math.cos(angleOffset);
            const sin = Math.sin(angleOffset);
            const rotatedX = normalizedX * cos - normalizedY * sin;
            const rotatedY = normalizedX * sin + normalizedY * cos;
            
            const isCrit = Math.random() < player.critChance;
            
            const bulletSprite = new PIXI.Graphics();
            if (isCrit) {
                bulletSprite.lineStyle(2, 0xffff00, 0.8);
                bulletSprite.beginFill(0xffaa00);
                bulletSprite.drawCircle(0, 0, 8);
            } else {
                bulletSprite.beginFill(0xfeca57);
                bulletSprite.drawCircle(0, 0, 4);
            }
            bulletSprite.endFill();
            bulletSprite.x = player.x;
            bulletSprite.y = player.y;
            gameLayer.addChild(bulletSprite);

            gameRef.current.bullets.push({
              x: player.x,
              y: player.y,
              vx: rotatedX * BULLET_SPEED,
              vy: rotatedY * BULLET_SPEED,
              radius: isCrit ? 6 : 4,
              isCrit: isCrit,
              piercing: player.level > 5 ? 1 : 0,
              sprite: bulletSprite
            });
          }
          gameRef.current.shootCooldown = currentShootCooldown;
        }
      }

      // Move bullets
      gameRef.current.bullets = gameRef.current.bullets.filter(bullet => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        
        if (bullet.sprite) {
            bullet.sprite.x = bullet.x;
            bullet.sprite.y = bullet.y;
            
            if (bullet.piercing > 0) {
                // Simple trail effect
                if (Math.random() < 0.3) {
                    const trail = new PIXI.Graphics();
                    trail.beginFill(0x00ffff, 0.5);
                    trail.drawCircle(0, 0, 2);
                    trail.endFill();
                    trail.x = bullet.x;
                    trail.y = bullet.y;
                    gameLayer.addChild(trail);
                    // Quick fade out
                    const fade = () => {
                        trail.alpha -= 0.1;
                        if (trail.alpha <= 0) {
                            trail.destroy();
                        } else {
                            requestAnimationFrame(fade);
                        }
                    };
                    fade();
                }
            }
        }

        const inBounds = bullet.x > -10 && bullet.x < GAME_WIDTH + 10 && 
               bullet.y > UI_HEIGHT - 10 && bullet.y < GAME_HEIGHT + UI_HEIGHT + 10;
        
        if (!inBounds && bullet.sprite) {
            bullet.sprite.destroy();
            bullet.sprite = undefined;
        }
        return inBounds;
      });

      // Move enemies
      gameRef.current.enemies.forEach(enemy => {
        if (!enemy.alive) return;
        
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length > 0) {
          const normalizedX = dx / length;
          const normalizedY = dy / length;
          
          enemy.x += normalizedX * enemy.speed;
          enemy.y += normalizedY * enemy.speed;
        }

        if (enemy.sprite) {
            enemy.sprite.x = enemy.x;
            enemy.sprite.y = enemy.y;

            // Update HP Bar
            const hpBar = enemy.sprite.children[0] as PIXI.Graphics;
            if (hpBar) {
                hpBar.clear();
                hpBar.beginFill(0x333333);
                hpBar.drawRect(-15, -enemy.radius - 10, 30, 4);
                hpBar.endFill();
                hpBar.beginFill(0xff6b6b);
                hpBar.drawRect(-15, -enemy.radius - 10, 30 * (enemy.hp / enemy.maxHp), 4);
                hpBar.endFill();
            }

            if (enemy.type === 'bomber') {
                 const pulseRadius = enemy.radius + Math.sin(Date.now() / 200) * 3;
                 enemy.sprite.clear();
                 enemy.sprite.beginFill(enemy.color);
                 enemy.sprite.drawCircle(0, 0, enemy.radius);
                 enemy.sprite.endFill();
                 enemy.sprite.lineStyle(2, 0xff8800, 0.7);
                 enemy.sprite.drawCircle(0, 0, pulseRadius);
            }
        }
      });

      // Collisions
      gameRef.current.bullets = gameRef.current.bullets.filter(bullet => {
        let bulletShouldRemove = false;
        let piercingLeft = bullet.piercing;
        
        gameRef.current.enemies.forEach(enemy => {
          if (!enemy.alive) return;
          
          const dx = bullet.x - enemy.x;
          const dy = bullet.y - enemy.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < bullet.radius + enemy.radius) {
            const finalDamage = bullet.isCrit ? 
              Math.floor(player.damage * player.critDamage) : 
              player.damage;
            
            enemy.hp -= finalDamage;
            
            const textSprite = new PIXI.Text(finalDamage.toString(), {
                fill: bullet.isCrit ? 0xfeca57 : 0xffffff,
                fontSize: bullet.isCrit ? 16 : 12,
                fontWeight: 'bold',
                stroke: 0x000000,
                strokeThickness: 2
            });
            textSprite.anchor.set(0.5);
            textSprite.x = enemy.x;
            textSprite.y = enemy.y - 20;
            gameLayer.addChild(textSprite);

            gameRef.current.damageTexts.push({
              x: enemy.x,
              y: enemy.y - 20,
              text: finalDamage.toString(),
              timer: 60,
              color: bullet.isCrit ? 0xfeca57 : 0xffffff,
              isCrit: bullet.isCrit,
              sprite: textSprite
            });
            
            // Particles
            for (let i = 0; i < (bullet.isCrit ? 8 : 4); i++) {
              const angle = (i / (bullet.isCrit ? 8 : 4)) * Math.PI * 2;
              const pSprite = new PIXI.Graphics();
              pSprite.beginFill(bullet.isCrit ? 0xfeca57 : enemy.color);
              pSprite.drawCircle(0, 0, bullet.isCrit ? 4 : 2);
              pSprite.endFill();
              pSprite.x = enemy.x;
              pSprite.y = enemy.y;
              gameLayer.addChild(pSprite);

              gameRef.current.particles.push({
                x: enemy.x,
                y: enemy.y,
                vx: Math.cos(angle) * (2 + Math.random() * 3),
                vy: Math.sin(angle) * (2 + Math.random() * 3),
                life: 30,
                maxLife: 30,
                color: bullet.isCrit ? 0xfeca57 : enemy.color,
                size: bullet.isCrit ? 4 : 2,
                alpha: 1.0,
                sprite: pSprite
              });
            }
            
            if (piercingLeft <= 0) {
              bulletShouldRemove = true;
            } else {
              piercingLeft--;
            }
            
            if (enemy.hp <= 0) {
              enemy.alive = false;
              // Don't destroy sprite here, let the cleanup loop handle it
              // if (enemy.sprite) enemy.sprite.destroy();

              gameRef.current.currentScore += enemy.type === 'tank' ? 25 : enemy.type === 'bomber' ? 20 : 10;
              gameRef.current.enemiesKilled++;
              gameRef.current.combo++;
              gameRef.current.comboTimer = 180;
              setScore(gameRef.current.currentScore);
              
              const expGain = EXP_PER_ENEMY * (enemy.type === 'tank' ? 2 : enemy.type === 'bomber' ? 1.5 : 1);
              player.exp += expGain;
              
              if (player.exp >= player.expToNext) {
                player.level++;
                player.exp -= player.expToNext;
                player.expToNext = Math.floor(player.expToNext * 1.2);
                player.damage++;
                player.maxHealth += 10;
                player.health = player.maxHealth;
                
                const bonusRand = Math.random();
                if (bonusRand < 0.3) {
                  player.multiShot++;
                } else if (bonusRand < 0.6) {
                  player.critChance = Math.min(0.8, player.critChance + 0.05);
                } else {
                  player.critDamage += 0.2;
                }
              }
            }
          }
        });
        
        if (bulletShouldRemove && bullet.sprite) {
            bullet.sprite.destroy();
            bullet.sprite = undefined;
        }
        return !bulletShouldRemove;
      });

      // Player collisions
      gameRef.current.enemies.forEach(enemy => {
        if (!enemy.alive) return;
        
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < player.radius + enemy.radius) {
          let damage = enemy.damage;
          
          if (player.shield > 0) {
            const shieldAbsorbed = Math.min(player.shield, damage);
            player.shield -= shieldAbsorbed;
            damage -= shieldAbsorbed;
          }
          
          if (damage > 0) {
            player.health -= damage;
            
            const textSprite = new PIXI.Text(`-${damage}`, {
                fill: 0xff4757, fontSize: 12, fontWeight: 'bold', stroke: 0x000000, strokeThickness: 2
            });
            textSprite.anchor.set(0.5);
            textSprite.x = player.x;
            textSprite.y = player.y - 20;
            gameLayer.addChild(textSprite);

            gameRef.current.damageTexts.push({
              x: player.x, y: player.y - 20, text: `-${damage}`,
              timer: 60, color: 0xff4757, isCrit: false, sprite: textSprite
            });
          }
          
          const knockbackForce = 5;
          const normalizedX = dx / distance;
          const normalizedY = dy / distance;
          enemy.x -= normalizedX * knockbackForce;
          enemy.y -= normalizedY * knockbackForce;
          
          if (player.health <= 0) {
            gameRef.current.keys.w = false;
            gameRef.current.keys.a = false;
            gameRef.current.keys.s = false;
            gameRef.current.keys.d = false;
            setGameOver(true);
          }
        }
      });

      gameRef.current.enemies = gameRef.current.enemies.filter(enemy => {
          if (!enemy.alive && enemy.sprite) {
              enemy.sprite.destroy({ children: true });
              enemy.sprite = undefined;
          }
          return enemy.alive;
      });

      // Particles
      gameRef.current.particles = gameRef.current.particles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        particle.vx *= 0.98;
        particle.vy *= 0.98;
        particle.alpha = particle.life / particle.maxLife;
        
        if (particle.sprite) {
            particle.sprite.x = particle.x;
            particle.sprite.y = particle.y;
            particle.sprite.alpha = particle.alpha;
        }

        if (particle.life <= 0 && particle.sprite) {
            particle.sprite.destroy();
            particle.sprite = undefined;
        }
        return particle.life > 0;
      });

      // Damage Texts
      gameRef.current.damageTexts = gameRef.current.damageTexts.filter(text => {
        text.timer--;
        text.y -= 1;
        if (text.sprite) {
            text.sprite.y = text.y;
            text.sprite.alpha = Math.max(0, text.timer / 60);
        }
        if (text.timer <= 0 && text.sprite) {
            text.sprite.destroy();
            text.sprite = undefined;
        }
        return text.timer > 0;
      });

      if (gameRef.current.comboTimer > 0) {
        gameRef.current.comboTimer--;
      } else {
        gameRef.current.combo = 0;
      }

      // Powerups
      gameRef.current.powerUpTimer--;
      if (gameRef.current.powerUpTimer <= 0) {
        const powerUpTypes: PowerUp['type'][] = ['health', 'damage', 'speed', 'multishot', 'shield'];
        const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        
        const x = Math.random() * (GAME_WIDTH - 40) + 20;
        const y = Math.random() * (GAME_HEIGHT - 40) + 20 + UI_HEIGHT;
        
        const pSprite = new PIXI.Graphics();
        let color = 0x00ff00;
        switch (randomType) {
          case 'health': color = 0x00ff00; break;
          case 'damage': color = 0xff0000; break;
          case 'speed': color = 0x0000ff; break;
          case 'multishot': color = 0xffff00; break;
          case 'shield': color = 0x00ffff; break;
        }
        pSprite.beginFill(color);
        pSprite.drawRect(-10, -10, 20, 20);
        pSprite.endFill();
        pSprite.lineStyle(2, color, 0.8);
        pSprite.drawRect(-12, -12, 24, 24);
        
        const typeText = new PIXI.Text(randomType.charAt(0).toUpperCase(), {
          fill: 0xffffff, fontSize: 12, fontWeight: 'bold'
        });
        typeText.anchor.set(0.5);
        pSprite.addChild(typeText);
        pSprite.x = x;
        pSprite.y = y;
        gameLayer.addChild(pSprite);

        gameRef.current.powerUps.push({
          x, y, type: randomType, radius: 12, size: 20,
          active: true, timer: POWERUP_DURATION, sprite: pSprite
        });
        
        gameRef.current.powerUpTimer = POWERUP_SPAWN_RATE;
      }

      gameRef.current.powerUps = gameRef.current.powerUps.filter(powerUp => {
        if (!powerUp.active) {
            if (powerUp.sprite) {
                powerUp.sprite.destroy();
                powerUp.sprite = undefined;
            }
            return false;
        }
        
        powerUp.timer--;
        if (powerUp.timer <= 0) {
            if (powerUp.sprite) {
                powerUp.sprite.destroy();
                powerUp.sprite = undefined;
            }
            return false;
        }
        
        const dx = player.x - powerUp.x;
        const dy = player.y - powerUp.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < player.radius + powerUp.radius) {
          switch (powerUp.type) {
            case 'health': player.health = Math.min(player.maxHealth, player.health + 30); break;
            case 'damage': player.damage += 2; break;
            case 'speed': break;
            case 'multishot': player.multiShot++; break;
            case 'shield': player.shield += 50; break;
          }
          if (powerUp.sprite) {
              powerUp.sprite.destroy();
              powerUp.sprite = undefined;
          }
          return false;
        }
        return true;
      });

      gameRef.current.spawnTimer--;
      if (gameRef.current.spawnTimer <= 0) {
        spawnEnemy();
        gameRef.current.spawnTimer = SPAWN_RATE - Math.min(gameRef.current.currentScore / 10, 80);
      }

      updateUI();
    }

    // Event listeners
    function handleKeyDown(e: KeyboardEvent) {
      if (gameOver) return; // Don't process keys when game is over
      switch (e.key.toLowerCase()) {
        case 'w': gameRef.current.keys.w = true; break;
        case 'a': gameRef.current.keys.a = true; break;
        case 's': gameRef.current.keys.s = true; break;
        case 'd': gameRef.current.keys.d = true; break;
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (gameOver) return; // Don't process keys when game is over
      switch (e.key.toLowerCase()) {
        case 'w': gameRef.current.keys.w = false; break;
        case 'a': gameRef.current.keys.a = false; break;
        case 's': gameRef.current.keys.s = false; break;
        case 'd': gameRef.current.keys.d = false; break;
      }
    }

    function handleMouseMove(e: MouseEvent) {
      if (!(app.view instanceof HTMLCanvasElement)) return;
      const rect = app.view.getBoundingClientRect();
      gameRef.current.mouseX = e.clientX - rect.left;
      gameRef.current.mouseY = Math.max(e.clientY - rect.top, UI_HEIGHT + 10); // Limitar mouse al área de juego
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    if (app.view instanceof HTMLCanvasElement) {
      app.view.addEventListener('mousemove', handleMouseMove);
    }

    // Game loop
    gameRef.current.spawnTimer = SPAWN_RATE;
    const gameLoop = () => {
      if (!gameOver) {
        updateGame();
        requestAnimationFrame(gameLoop);
      }
    };
    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (app.view instanceof HTMLCanvasElement) {
        app.view.removeEventListener('mousemove', handleMouseMove);
      }
      app.destroy(true, { children: true });
    };
  }, [gameOver, showInstructions]);

  const restartGame = () => {
    setGameOver(false);
    setShowInstructions(false);
    setScore(0);
    gameRef.current.currentScore = 0;
    gameRef.current.enemies = [];
    gameRef.current.bullets = [];
    gameRef.current.powerUps = [];
    gameRef.current.particles = [];
    gameRef.current.damageTexts = [];
    gameRef.current.gameTime = 0;
    gameRef.current.currentEnemySpeed = BASE_ENEMY_SPEED;
    gameRef.current.currentEnemyHP = BASE_ENEMY_HP;
    gameRef.current.wave = 1;
    gameRef.current.enemiesKilled = 0;
    gameRef.current.combo = 0;
    gameRef.current.comboTimer = 0;
    gameRef.current.player = { 
      x: GAME_WIDTH / 2, 
      y: (GAME_HEIGHT + UI_HEIGHT) / 2, // Centrar en área de juego
      radius: 15,
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
      <div ref={containerRef} style={{ 
        display: 'inline-block',
        border: '2px solid #4dabf7',
        borderRadius: '8px',
        overflow: 'hidden'
      }} />
    </div>
  );
};

export default Brotato;
