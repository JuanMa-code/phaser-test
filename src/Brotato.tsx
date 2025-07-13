import * as PIXI from 'pixi.js';
import React, { useEffect, useRef, useState } from 'react';

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
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isCrit: boolean;
  piercing: number;
}

interface PowerUp {
  x: number;
  y: number;
  type: 'health' | 'damage' | 'speed' | 'multishot' | 'shield';
  radius: number;
  size: number;
  active: boolean;
  timer: number;
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
}

interface DamageText {
  x: number;
  y: number;
  text: string;
  timer: number;
  color: number;
  isCrit: boolean;
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

    function drawGame() {
      // Clear stage
      app.stage.removeChildren();

      // Draw UI background header
      const uiBackground = new PIXI.Graphics();
      uiBackground.beginFill(0x0f0f23);
      uiBackground.drawRect(0, 0, GAME_WIDTH, UI_HEIGHT);
      uiBackground.endFill();
      
      // Add separator line
      uiBackground.lineStyle(2, 0x4dabf7);
      uiBackground.moveTo(0, UI_HEIGHT);
      uiBackground.lineTo(GAME_WIDTH, UI_HEIGHT);
      app.stage.addChild(uiBackground);

      // === UI ELEMENTS IN HEADER ===
      
      // Left column - Score and Level
      const scoreText = new PIXI.Text(`Score: ${gameRef.current.currentScore}`, {
        fill: 0xffffff,
        fontSize: 18,
        fontWeight: 'bold'
      });
      scoreText.x = 20;
      scoreText.y = 15;
      app.stage.addChild(scoreText);

      const levelText = new PIXI.Text(`Level: ${gameRef.current.player.level}`, {
        fill: 0xfeca57,
        fontSize: 16,
        fontWeight: 'bold'
      });
      levelText.x = 20;
      levelText.y = 40;
      app.stage.addChild(levelText);

      const waveText = new PIXI.Text(`Wave: ${gameRef.current.wave}`, {
        fill: 0x00ffff,
        fontSize: 14,
        fontWeight: 'bold'
      });
      waveText.x = 20;
      waveText.y = 65;
      app.stage.addChild(waveText);

      const killsText = new PIXI.Text(`Kills: ${gameRef.current.enemiesKilled}`, {
        fill: 0xffffff,
        fontSize: 14,
        fontWeight: 'bold'
      });
      killsText.x = 20;
      killsText.y = 90;
      app.stage.addChild(killsText);

      // Center - Health and Shield bars
      const healthBarWidth = 200;
      const healthBarHeight = 16;
      const healthPercentage = gameRef.current.player.health / gameRef.current.player.maxHealth;
      
      // Health bar background
      const healthBg = new PIXI.Graphics();
      healthBg.beginFill(0x333333);
      healthBg.drawRect(250, 25, healthBarWidth, healthBarHeight);
      healthBg.endFill();
      app.stage.addChild(healthBg);
      
      // Health bar
      const healthBar = new PIXI.Graphics();
      healthBar.beginFill(0x00ff00);
      healthBar.drawRect(250, 25, healthBarWidth * healthPercentage, healthBarHeight);
      healthBar.endFill();
      app.stage.addChild(healthBar);
      
      const healthText = new PIXI.Text(`HP: ${gameRef.current.player.health}/${gameRef.current.player.maxHealth}`, {
        fill: 0xffffff,
        fontSize: 12,
        fontWeight: 'bold'
      });
      healthText.x = 255;
      healthText.y = 27;
      app.stage.addChild(healthText);

      // Shield bar (if player has shield)
      if (gameRef.current.player.shield > 0) {
        const shieldBar = new PIXI.Graphics();
        shieldBar.beginFill(0x00ffff);
        shieldBar.drawRect(250, 45, (gameRef.current.player.shield / 100) * healthBarWidth, 8);
        shieldBar.endFill();
        app.stage.addChild(shieldBar);
        
        const shieldText = new PIXI.Text(`Shield: ${gameRef.current.player.shield}`, {
          fill: 0x00ffff,
          fontSize: 10,
          fontWeight: 'bold'
        });
        shieldText.x = 255;
        shieldText.y = 45;
        app.stage.addChild(shieldText);
      }

      // Experience bar
      const expBarWidth = 200;
      const expBarHeight = 12;
      const expPercentage = gameRef.current.player.exp / gameRef.current.player.expToNext;
      
      const expBarBg = new PIXI.Graphics();
      expBarBg.beginFill(0x333333);
      expBarBg.drawRect(250, 70, expBarWidth, expBarHeight);
      expBarBg.endFill();
      app.stage.addChild(expBarBg);
      
      const expBar = new PIXI.Graphics();
      expBar.beginFill(0xfeca57);
      expBar.drawRect(250, 70, expBarWidth * expPercentage, expBarHeight);
      expBar.endFill();
      app.stage.addChild(expBar);
      
      const expText = new PIXI.Text(`EXP: ${gameRef.current.player.exp}/${gameRef.current.player.expToNext}`, {
        fill: 0xfeca57,
        fontSize: 10,
        fontWeight: 'bold'
      });
      expText.x = 255;
      expText.y = 85;
      app.stage.addChild(expText);

      // Right column - Stats
      const damageText = new PIXI.Text(`Damage: ${gameRef.current.player.damage.toFixed(1)}`, {
        fill: 0xff6b6b,
        fontSize: 14,
        fontWeight: 'bold'
      });
      damageText.x = 520;
      damageText.y = 15;
      app.stage.addChild(damageText);

      const multishotText = new PIXI.Text(`Multishot: ${gameRef.current.player.multiShot}`, {
        fill: 0xffff00,
        fontSize: 14,
        fontWeight: 'bold'
      });
      multishotText.x = 520;
      multishotText.y = 35;
      app.stage.addChild(multishotText);

      const critText = new PIXI.Text(`Crit: ${(gameRef.current.player.critChance * 100).toFixed(1)}%`, {
        fill: 0xffaa00,
        fontSize: 14,
        fontWeight: 'bold'
      });
      critText.x = 520;
      critText.y = 55;
      app.stage.addChild(critText);

      const critDamageText = new PIXI.Text(`Crit Dmg: ${gameRef.current.player.critDamage.toFixed(1)}x`, {
        fill: 0xffaa00,
        fontSize: 14,
        fontWeight: 'bold'
      });
      critDamageText.x = 520;
      critDamageText.y = 75;
      app.stage.addChild(critDamageText);

      // Far right - Time and combo
      const timeText = new PIXI.Text(`Time: ${Math.floor(gameRef.current.gameTime / 60)}s`, {
        fill: 0xffffff,
        fontSize: 14,
        fontWeight: 'bold'
      });
      timeText.x = GAME_WIDTH - 120;
      timeText.y = 15;
      app.stage.addChild(timeText);

      // Combo counter in header
      if (gameRef.current.combo > 1) {
        const comboText = new PIXI.Text(`COMBO x${gameRef.current.combo}!`, {
          fill: 0xff00ff,
          fontSize: 16,
          fontWeight: 'bold'
        });
        comboText.x = GAME_WIDTH - 150;
        comboText.y = 40;
        app.stage.addChild(comboText);
      }

      // === GAME AREA (below UI) ===
      
      // Draw particles (behind everything)
      gameRef.current.particles.forEach(particle => {
        // Only draw if in game area
        if (particle.y > UI_HEIGHT) {
          const particleGraphic = new PIXI.Graphics();
          particleGraphic.beginFill(particle.color);
          particleGraphic.drawCircle(particle.x, particle.y, particle.size);
          particleGraphic.endFill();
          particleGraphic.alpha = particle.alpha;
          app.stage.addChild(particleGraphic);
        }
      });

      // Draw power-ups
      gameRef.current.powerUps.forEach(powerUp => {
        const powerUpGraphic = new PIXI.Graphics();
        
        // Different colors for different power-up types
        let color = 0x00ff00;
        switch (powerUp.type) {
          case 'health': color = 0x00ff00; break;
          case 'damage': color = 0xff0000; break;
          case 'speed': color = 0x0000ff; break;
          case 'multishot': color = 0xffff00; break;
          case 'shield': color = 0x00ffff; break;
        }
        
        powerUpGraphic.beginFill(color);
        powerUpGraphic.drawRect(powerUp.x - powerUp.size/2, powerUp.y - powerUp.size/2, powerUp.size, powerUp.size);
        powerUpGraphic.endFill();
        
        // Add glow effect
        powerUpGraphic.lineStyle(2, color, 0.8);
        powerUpGraphic.drawRect(powerUp.x - powerUp.size/2 - 2, powerUp.y - powerUp.size/2 - 2, powerUp.size + 4, powerUp.size + 4);
        
        // Add power-up type text
        const typeText = new PIXI.Text(powerUp.type.charAt(0).toUpperCase(), {
          fill: 0xffffff,
          fontSize: 12,
          fontWeight: 'bold'
        });
        typeText.anchor.set(0.5);
        typeText.x = powerUp.x;
        typeText.y = powerUp.y;
        powerUpGraphic.addChild(typeText);
        
        app.stage.addChild(powerUpGraphic);
      });

      // Draw player with shield effect
      const player = new PIXI.Graphics();
      
      // Draw shield if player has any
      if (gameRef.current.player.shield > 0) {
        player.lineStyle(3, 0x00ffff, 0.8);
        player.drawCircle(gameRef.current.player.x, gameRef.current.player.y, gameRef.current.player.radius + 5);
      }
      
      player.beginFill(0x4dabf7);
      player.drawCircle(gameRef.current.player.x, gameRef.current.player.y, gameRef.current.player.radius);
      player.endFill();
      
      // Player direction indicator
      const dx = gameRef.current.mouseX - gameRef.current.player.x;
      const dy = gameRef.current.mouseY - gameRef.current.player.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length > 0) {
        const normalizedX = dx / length;
        const normalizedY = dy / length;
        player.lineStyle(3, 0xffffff);
        player.moveTo(gameRef.current.player.x, gameRef.current.player.y);
        player.lineTo(
          gameRef.current.player.x + normalizedX * 25,
          gameRef.current.player.y + normalizedY * 25
        );
      }
      app.stage.addChild(player);

      // Draw enemies with different types
      gameRef.current.enemies.forEach(enemy => {
        if (!enemy.alive) return;
        
        const enemyGraphic = new PIXI.Graphics();
        enemyGraphic.beginFill(enemy.color);
        enemyGraphic.drawCircle(enemy.x, enemy.y, enemy.radius);
        enemyGraphic.endFill();
        
        // Special effects for different enemy types
        if (enemy.type === 'fast') {
          // Speed lines for fast enemies
          enemyGraphic.lineStyle(2, 0xffff00, 0.6);
          for (let i = 0; i < 3; i++) {
            const angle = Math.random() * Math.PI * 2;
            const startX = enemy.x + Math.cos(angle) * (enemy.radius + 5);
            const startY = enemy.y + Math.sin(angle) * (enemy.radius + 5);
            const endX = startX + Math.cos(angle) * 10;
            const endY = startY + Math.sin(angle) * 10;
            enemyGraphic.moveTo(startX, startY);
            enemyGraphic.lineTo(endX, endY);
          }
        } else if (enemy.type === 'tank') {
          // Armor lines for tank enemies
          enemyGraphic.lineStyle(3, 0x666666);
          enemyGraphic.drawCircle(enemy.x, enemy.y, enemy.radius + 3);
        } else if (enemy.type === 'bomber') {
          // Pulsing effect for bomber enemies
          const pulseRadius = enemy.radius + Math.sin(Date.now() / 200) * 3;
          enemyGraphic.lineStyle(2, 0xff8800, 0.7);
          enemyGraphic.drawCircle(enemy.x, enemy.y, pulseRadius);
        }
        
        // HP bar
        const hpBarWidth = 30;
        const hpBarHeight = 4;
        const hpPercentage = enemy.hp / enemy.maxHp;
        
        enemyGraphic.beginFill(0x333333);
        enemyGraphic.drawRect(enemy.x - hpBarWidth/2, enemy.y - enemy.radius - 10, hpBarWidth, hpBarHeight);
        enemyGraphic.endFill();
        
        enemyGraphic.beginFill(0xff6b6b);
        enemyGraphic.drawRect(enemy.x - hpBarWidth/2, enemy.y - enemy.radius - 10, hpBarWidth * hpPercentage, hpBarHeight);
        enemyGraphic.endFill();
        
        // Enemy type indicator
        const typeText = new PIXI.Text(enemy.type.charAt(0).toUpperCase(), {
          fill: 0xffffff,
          fontSize: 8,
          fontWeight: 'bold'
        });
        typeText.anchor.set(0.5);
        typeText.x = enemy.x;
        typeText.y = enemy.y - enemy.radius - 20;
        enemyGraphic.addChild(typeText);
        
        app.stage.addChild(enemyGraphic);
      });

      // Draw bullets with critical hit effects
      gameRef.current.bullets.forEach(bullet => {
        const bulletGraphic = new PIXI.Graphics();
        
        if (bullet.isCrit) {
          // Critical bullets are larger and have a glow
          bulletGraphic.lineStyle(2, 0xffff00, 0.8);
          bulletGraphic.drawCircle(bullet.x, bullet.y, bullet.radius + 2);
          bulletGraphic.beginFill(0xffaa00);
        } else {
          bulletGraphic.beginFill(0xfeca57);
        }
        
        bulletGraphic.drawCircle(bullet.x, bullet.y, bullet.radius);
        bulletGraphic.endFill();
        
        // Piercing bullets have a trail effect
        if (bullet.piercing > 0) {
          bulletGraphic.lineStyle(1, 0x00ffff, 0.6);
          const trailLength = 15;
          const angle = Math.atan2(bullet.vy, bullet.vx);
          const startX = bullet.x - Math.cos(angle) * trailLength;
          const startY = bullet.y - Math.sin(angle) * trailLength;
          bulletGraphic.moveTo(startX, startY);
          bulletGraphic.lineTo(bullet.x, bullet.y);
        }
        
        app.stage.addChild(bulletGraphic);
      });

      // Draw damage texts
      gameRef.current.damageTexts.forEach(damageText => {
        const text = new PIXI.Text(damageText.text, {
          fill: damageText.color,
          fontSize: damageText.isCrit ? 16 : 12,
          fontWeight: 'bold',
          stroke: 0x000000,
          strokeThickness: 2
        });
        text.anchor.set(0.5);
        text.x = damageText.x;
        text.y = damageText.y;
        text.alpha = Math.max(0, damageText.timer / 60);
        app.stage.addChild(text);
      });
    }

    function spawnEnemy() {
      const side = Math.floor(Math.random() * 4);
      let x, y;

      switch (side) {
        case 0: // top
          x = Math.random() * GAME_WIDTH;
          y = UI_HEIGHT - 20; // Aparecer justo encima del área de juego
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

      // Determinar tipo de enemigo basado en el tiempo
      let enemyType: Enemy['type'] = 'normal';
      let enemyColor = 0xff4757;
      let enemyRadius = 12;
      let enemySpeed = gameRef.current.currentEnemySpeed;
      let enemyDamage = 10;
      let enemyHP = gameRef.current.currentEnemyHP;

      const rand = Math.random();
      const timeMultiplier = Math.floor(gameRef.current.gameTime / 1800); // Cada 30 segundos

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

      gameRef.current.enemies.push({
        x,
        y,
        hp: enemyHP,
        maxHp: enemyHP,
        radius: enemyRadius,
        alive: true,
        type: enemyType,
        speed: enemySpeed,
        damage: enemyDamage,
        color: enemyColor,
      });
    }

    function updateGame() {
      const player = gameRef.current.player;
      const keys = gameRef.current.keys;

      // Incrementar tiempo de juego
      gameRef.current.gameTime++;

      // Aumentar velocidad de enemigos cada 20 segundos
      const speedIncreaseInterval = ENEMY_SPEED_INCREASE * 60; // 20 segundos * 60 fps
      const speedIncreases = Math.floor(gameRef.current.gameTime / speedIncreaseInterval);
      gameRef.current.currentEnemySpeed = BASE_ENEMY_SPEED + (speedIncreases * 0.2);
      gameRef.current.currentEnemyHP = Math.floor(BASE_ENEMY_HP + (speedIncreases * 1.5)); // +1.5 HP cada 20 segundos

      // Move player (only if game is not over)
      if (!gameOver) {
        if (keys.w && player.y > player.radius + UI_HEIGHT) player.y -= PLAYER_SPEED;
        if (keys.s && player.y < GAME_HEIGHT + UI_HEIGHT - player.radius) player.y += PLAYER_SPEED;
        if (keys.a && player.x > player.radius) player.x -= PLAYER_SPEED;
        if (keys.d && player.x < GAME_WIDTH - player.radius) player.x += PLAYER_SPEED;
      }

      // Auto-shoot con velocidad basada en nivel
      const currentShootCooldown = Math.max(10, BASE_SHOOT_COOLDOWN - (player.level - 1) * 5);
      gameRef.current.shootCooldown = Math.max(0, gameRef.current.shootCooldown - 1);
      if (gameRef.current.shootCooldown === 0) {
        const dx = gameRef.current.mouseX - player.x;
        const dy = gameRef.current.mouseY - player.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length > 0) {
          const normalizedX = dx / length;
          const normalizedY = dy / length;
          
          // Disparar múltiples balas si tiene multishot
          for (let i = 0; i < player.multiShot; i++) {
            const angleOffset = (i - (player.multiShot - 1) / 2) * 0.2; // Spread entre balas
            const cos = Math.cos(angleOffset);
            const sin = Math.sin(angleOffset);
            const rotatedX = normalizedX * cos - normalizedY * sin;
            const rotatedY = normalizedX * sin + normalizedY * cos;
            
            // Calcular crítico
            const isCrit = Math.random() < player.critChance;
            
            gameRef.current.bullets.push({
              x: player.x,
              y: player.y,
              vx: rotatedX * BULLET_SPEED,
              vy: rotatedY * BULLET_SPEED,
              radius: isCrit ? 6 : 4,
              isCrit: isCrit,
              piercing: player.level > 5 ? 1 : 0,
            });
          }
          
          gameRef.current.shootCooldown = currentShootCooldown;
        }
      }

      // Move bullets
      gameRef.current.bullets = gameRef.current.bullets.filter(bullet => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        
        // Remove bullets that go off-screen
        return bullet.x > -10 && bullet.x < GAME_WIDTH + 10 && 
               bullet.y > UI_HEIGHT - 10 && bullet.y < GAME_HEIGHT + UI_HEIGHT + 10;
      });

      // Move enemies towards player
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
      });

      // Check bullet-enemy collisions
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
            
            // Crear texto de daño
            gameRef.current.damageTexts.push({
              x: enemy.x,
              y: enemy.y - 20,
              text: finalDamage.toString(),
              timer: 60,
              color: bullet.isCrit ? 0xfeca57 : 0xffffff,
              isCrit: bullet.isCrit
            });
            
            // Crear partículas
            for (let i = 0; i < (bullet.isCrit ? 8 : 4); i++) {
              const angle = (i / (bullet.isCrit ? 8 : 4)) * Math.PI * 2;
              gameRef.current.particles.push({
                x: enemy.x,
                y: enemy.y,
                vx: Math.cos(angle) * (2 + Math.random() * 3),
                vy: Math.sin(angle) * (2 + Math.random() * 3),
                life: 30,
                maxLife: 30,
                color: bullet.isCrit ? 0xfeca57 : enemy.color,
                size: bullet.isCrit ? 4 : 2,
                alpha: 1.0
              });
            }
            
            if (piercingLeft <= 0) {
              bulletShouldRemove = true;
            } else {
              piercingLeft--;
            }
            
            if (enemy.hp <= 0) {
              enemy.alive = false;
              gameRef.current.currentScore += enemy.type === 'tank' ? 25 : enemy.type === 'bomber' ? 20 : 10;
              gameRef.current.enemiesKilled++;
              gameRef.current.combo++;
              gameRef.current.comboTimer = 180; // 3 segundos
              setScore(gameRef.current.currentScore);
              
              // Añadir experiencia
              const expGain = EXP_PER_ENEMY * (enemy.type === 'tank' ? 2 : enemy.type === 'bomber' ? 1.5 : 1);
              player.exp += expGain;
              
              // Verificar si sube de nivel
              if (player.exp >= player.expToNext) {
                player.level++;
                player.exp -= player.expToNext;
                player.expToNext = Math.floor(player.expToNext * 1.2);
                player.damage++;
                player.maxHealth += 10;
                player.health = player.maxHealth; // Curar al subir de nivel
                
                // Bonificaciones aleatorias al subir de nivel
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
        
        return !bulletShouldRemove;
      });

      // Check player-enemy collisions
      gameRef.current.enemies.forEach(enemy => {
        if (!enemy.alive) return;
        
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < player.radius + enemy.radius) {
          let damage = enemy.damage;
          
          // Aplicar escudo si existe
          if (player.shield > 0) {
            const shieldAbsorbed = Math.min(player.shield, damage);
            player.shield -= shieldAbsorbed;
            damage -= shieldAbsorbed;
          }
          
          // Aplicar daño a la salud
          if (damage > 0) {
            player.health -= damage;
            
            // Crear texto de daño al jugador
            gameRef.current.damageTexts.push({
              x: player.x,
              y: player.y - 20,
              text: `-${damage}`,
              timer: 60,
              color: 0xff4757,
              isCrit: false
            });
          }
          
          // Knockback del enemigo
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

      // Remove dead enemies
      gameRef.current.enemies = gameRef.current.enemies.filter(enemy => enemy.alive);

      // Update particles
      gameRef.current.particles = gameRef.current.particles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        particle.vx *= 0.98;
        particle.vy *= 0.98;
        particle.alpha = particle.life / particle.maxLife;
        return particle.life > 0;
      });

      // Update damage texts
      gameRef.current.damageTexts = gameRef.current.damageTexts.filter(text => {
        text.timer--;
        text.y -= 1;
        return text.timer > 0;
      });

      // Update combo timer
      if (gameRef.current.comboTimer > 0) {
        gameRef.current.comboTimer--;
      } else {
        gameRef.current.combo = 0;
      }

      // Spawn power-ups
      gameRef.current.powerUpTimer--;
      if (gameRef.current.powerUpTimer <= 0) {
        const powerUpTypes: PowerUp['type'][] = ['health', 'damage', 'speed', 'multishot', 'shield'];
        const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        
        gameRef.current.powerUps.push({
          x: Math.random() * (GAME_WIDTH - 40) + 20,
          y: Math.random() * (GAME_HEIGHT - 40) + 20 + UI_HEIGHT, // Spawn en área de juego
          type: randomType,
          radius: 12,
          size: 20,
          active: true,
          timer: POWERUP_DURATION
        });
        
        gameRef.current.powerUpTimer = POWERUP_SPAWN_RATE;
      }

      // Update power-ups
      gameRef.current.powerUps = gameRef.current.powerUps.filter(powerUp => {
        if (!powerUp.active) return false;
        
        powerUp.timer--;
        if (powerUp.timer <= 0) return false;
        
        // Check collision with player
        const dx = player.x - powerUp.x;
        const dy = player.y - powerUp.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < player.radius + powerUp.radius) {
          // Apply power-up effect
          switch (powerUp.type) {
            case 'health':
              player.health = Math.min(player.maxHealth, player.health + 30);
              break;
            case 'damage':
              player.damage += 2;
              break;
            case 'speed':
              // Speed boost would be implemented in movement
              break;
            case 'multishot':
              player.multiShot++;
              break;
            case 'shield':
              player.shield += 50;
              break;
          }
          return false; // Remove power-up
        }
        
        return true;
      });

      // Spawn enemies
      gameRef.current.spawnTimer--;
      if (gameRef.current.spawnTimer <= 0) {
        spawnEnemy();
        gameRef.current.spawnTimer = SPAWN_RATE - Math.min(gameRef.current.currentScore / 10, 80);
      }

      drawGame();
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
    setShowInstructions(true);
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
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '20px',
          padding: '2rem 3rem 3rem 3rem',
          maxWidth: '600px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}>
          <h1 style={{ 
            color: '#4dabf7', 
            fontSize: '2.5rem', 
            marginBottom: '1.5rem',
            marginTop: '1rem',
            textShadow: '0 0 20px rgba(77, 171, 247, 0.5)'
          }}>
            🥔 Brotato Style
          </h1>
          
          <div style={{ 
            color: '#ffffff', 
            fontSize: '1rem', 
            lineHeight: '1.5',
            marginBottom: '2rem',
            textAlign: 'left'
          }}>
            <h3 style={{ color: '#feca57', marginBottom: '0.8rem', fontSize: '1.1rem' }}>🎯 Objetivo:</h3>
            <p style={{ marginBottom: '1.2rem' }}>Sobrevive el mayor tiempo posible eliminando oleadas de enemigos y mejorando tus habilidades.</p>
            
            <h3 style={{ color: '#feca57', marginBottom: '0.8rem', fontSize: '1.1rem' }}>🎮 Controles:</h3>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.2rem' }}>
              <li style={{ marginBottom: '0.4rem' }}>🔹 <strong>WASD</strong> - Mover jugador</li>
              <li style={{ marginBottom: '0.4rem' }}>🔹 <strong>Mouse</strong> - Apuntar (disparo automático)</li>
            </ul>

            <h3 style={{ color: '#feca57', marginBottom: '0.8rem', fontSize: '1.1rem' }}>🏆 Mecánicas:</h3>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.2rem' }}>
              <li style={{ marginBottom: '0.4rem' }}>⚡ <strong>Niveles</strong> - Gana EXP eliminando enemigos</li>
              <li style={{ marginBottom: '0.4rem' }}>💎 <strong>Power-ups</strong> - Recoge mejoras (salud, daño, escudo, multidisparo)</li>
              <li style={{ marginBottom: '0.4rem' }}>🎯 <strong>Críticos</strong> - Disparos que hacen más daño</li>
              <li style={{ marginBottom: '0.4rem' }}>🔥 <strong>Combos</strong> - Elimina enemigos consecutivamente</li>
              <li style={{ marginBottom: '0.4rem' }}>🛡️ <strong>Escudo</strong> - Protección temporal contra daño</li>
            </ul>

            <h3 style={{ color: '#feca57', marginBottom: '0.8rem', fontSize: '1.1rem' }}>👹 Tipos de Enemigos:</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '0.4rem' }}>🔴 <strong>Normal</strong> - Enemigo básico</li>
              <li style={{ marginBottom: '0.4rem' }}>💨 <strong>Rápido</strong> - Se mueve muy rápido pero tiene menos vida</li>
              <li style={{ marginBottom: '0.4rem' }}>🛡️ <strong>Tanque</strong> - Lento pero con mucha vida y daño</li>
              <li style={{ marginBottom: '0.4rem' }}>💥 <strong>Bomber</strong> - Hace mucho daño al contacto</li>
            </ul>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            justifyContent: 'center', 
            flexWrap: 'wrap',
            marginTop: '1.5rem',
            paddingTop: '1rem'
          }}>
            <button 
              onClick={() => setShowInstructions(false)}
              style={{
                fontSize: '1.2rem',
                padding: '1rem 2rem',
                background: 'linear-gradient(45deg, #4dabf7, #74b9ff)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 4px 15px rgba(77, 171, 247, 0.4)',
                transition: 'all 0.3s ease',
                minWidth: '150px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(77, 171, 247, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(77, 171, 247, 0.4)';
              }}
            >
              🎮 Jugar
            </button>
            <button 
              onClick={() => window.history.back()}
              style={{
                fontSize: '1.2rem',
                padding: '1rem 2rem',
                background: 'linear-gradient(45deg, #747d8c, #57606f)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 4px 15px rgba(116, 125, 140, 0.4)',
                transition: 'all 0.3s ease',
                minWidth: '150px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(116, 125, 140, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(116, 125, 140, 0.4)';
              }}
            >
              🏠 Menú Principal
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h1 style={{ color: '#ff4757', fontSize: '3rem', marginBottom: '1rem' }}>GAME OVER</h1>
        <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Final Score: {score}</p>
        <button 
          onClick={restartGame}
          style={{
            fontSize: '1.2rem',
            padding: '1rem 2rem',
            backgroundColor: '#4dabf7',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginRight: '1rem'
          }}
        >
          Play Again
        </button>
        <button 
          onClick={() => window.history.back()}
          style={{
            fontSize: '1.2rem',
            padding: '1rem 2rem',
            backgroundColor: '#747d8c',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Back to Menu
        </button>
      </div>
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
