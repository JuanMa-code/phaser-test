import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';

const AirHockey: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<'instructions' | 'playing' | 'gameOver'>('instructions');
  const [playerScore, setPlayerScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [winner, setWinner] = useState<'player' | 'bot' | null>(null);

  useEffect(() => {
    if (gameState !== 'playing' || !canvasRef.current) return;

    // Configuración del juego
    const GAME_WIDTH = 800;
    const GAME_HEIGHT = 600;
    const PADDLE_RADIUS = 35; // Aumentado de 25 a 35
    const PUCK_RADIUS = 15;
    const GOAL_WIDTH = 320; // Reducido de 400 a 320 (40% del ancho)
    const GOAL_HEIGHT = 20;

    // Crear aplicación PIXI
    const app = new PIXI.Application({
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: 0x0077be,
      antialias: true
    });

    canvasRef.current.appendChild(app.view as HTMLCanvasElement);

    // Variables del juego
    let mouseX = GAME_WIDTH / 2;
    let mouseY = GAME_HEIGHT - 100;
    let isMouseDown = false;
    let gameEnded = false;

    // Crear gráficos de la mesa
    const table = new PIXI.Graphics();
    
    // Mesa principal
    table.beginFill(0x004d8f);
    table.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    table.endFill();

    // Línea central
    table.lineStyle(3, 0xffffff);
    table.moveTo(0, GAME_HEIGHT / 2);
    table.lineTo(GAME_WIDTH, GAME_HEIGHT / 2);

    // Círculo central
    table.lineStyle(3, 0xffffff);
    table.drawCircle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 50);

    // Porterías
    table.lineStyle(5, 0xff0000);
    table.moveTo((GAME_WIDTH - GOAL_WIDTH) / 2, 0);
    table.lineTo((GAME_WIDTH + GOAL_WIDTH) / 2, 0);
    
    table.lineStyle(5, 0xff0000);
    table.moveTo((GAME_WIDTH - GOAL_WIDTH) / 2, GAME_HEIGHT);
    table.lineTo((GAME_WIDTH + GOAL_WIDTH) / 2, GAME_HEIGHT);

    // Bordes laterales de las porterías
    table.lineStyle(3, 0xffffff);
    table.moveTo((GAME_WIDTH - GOAL_WIDTH) / 2, 0);
    table.lineTo((GAME_WIDTH - GOAL_WIDTH) / 2, GOAL_HEIGHT);
    table.moveTo((GAME_WIDTH + GOAL_WIDTH) / 2, 0);
    table.lineTo((GAME_WIDTH + GOAL_WIDTH) / 2, GOAL_HEIGHT);

    table.moveTo((GAME_WIDTH - GOAL_WIDTH) / 2, GAME_HEIGHT);
    table.lineTo((GAME_WIDTH - GOAL_WIDTH) / 2, GAME_HEIGHT - GOAL_HEIGHT);
    table.moveTo((GAME_WIDTH + GOAL_WIDTH) / 2, GAME_HEIGHT);
    table.lineTo((GAME_WIDTH + GOAL_WIDTH) / 2, GAME_HEIGHT - GOAL_HEIGHT);

    app.stage.addChild(table);

    // Crear paddle del jugador
    const playerPaddle = new PIXI.Graphics();
    playerPaddle.beginFill(0x00ff00);
    playerPaddle.drawCircle(0, 0, PADDLE_RADIUS);
    playerPaddle.endFill();
    playerPaddle.x = GAME_WIDTH / 2;
    playerPaddle.y = GAME_HEIGHT - 80;
    app.stage.addChild(playerPaddle);

    // Crear paddle del bot
    const botPaddle = new PIXI.Graphics();
    botPaddle.beginFill(0xff0000);
    botPaddle.drawCircle(0, 0, PADDLE_RADIUS);
    botPaddle.endFill();
    botPaddle.x = GAME_WIDTH / 2;
    botPaddle.y = 80;
    app.stage.addChild(botPaddle);

    // Crear disco
    const puck = new PIXI.Graphics();
    puck.beginFill(0x333333);
    puck.drawCircle(0, 0, PUCK_RADIUS);
    puck.endFill();
    puck.x = GAME_WIDTH / 2;
    puck.y = GAME_HEIGHT / 2;
    app.stage.addChild(puck);

    // Variables de física
    let puckVx = 0;
    let puckVy = 0;
    let botTargetX = GAME_WIDTH / 2;
    let botTargetY = 80;

    // Función para detectar colisión entre círculos
    const circleCollision = (x1: number, y1: number, r1: number, x2: number, y2: number, r2: number) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < (r1 + r2);
    };

    // Función para manejar colisión entre disco y paddle
    const handlePaddleCollision = (paddleX: number, paddleY: number, isBot: boolean = false) => {
      if (circleCollision(puck.x, puck.y, PUCK_RADIUS, paddleX, paddleY, PADDLE_RADIUS)) {
        const dx = puck.x - paddleX;
        const dy = puck.y - paddleY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          const normalX = dx / distance;
          const normalY = dy / distance;
          
          // Separar disco del paddle
          const overlap = (PUCK_RADIUS + PADDLE_RADIUS) - distance;
          puck.x += normalX * overlap;
          puck.y += normalY * overlap;
          
          // Velocidad fija para evitar acumulación infinita
          const newSpeed = isBot ? 12 : 15; // Velocidad fija, no multiplicativa
          
          // Si es el bot y está en modo ofensivo, apuntar hacia la portería
          if (isBot && puck.y < GAME_HEIGHT / 2) {
            const goalCenterX = GAME_WIDTH / 2;
            const goalY = GAME_HEIGHT - 50;
            
            // Detectar si está cerca de la pared superior (zona peligrosa)
            const nearTopWall = puck.y < 100;
            
            if (nearTopWall) {
              // Si está cerca de la pared superior, disparar hacia los lados para evitar autogol
              const centerX = GAME_WIDTH / 2;
              const shootToSide = puck.x < centerX ? -1 : 1; // Disparar hacia el lado opuesto al centro
              
              puckVx = shootToSide * newSpeed * 0.8; // Disparo lateral
              puckVy = newSpeed * 0.6; // Hacia abajo pero no tanto
            } else {
              // Disparo normal hacia la portería
              const angleToGoal = Math.atan2(goalY - puck.y, goalCenterX - puck.x);
              const shotVariation = (Math.random() - 0.5) * 0.6; // Menos variación
              
              puckVx = Math.cos(angleToGoal + shotVariation) * newSpeed;
              puckVy = Math.sin(angleToGoal + shotVariation) * newSpeed;
            }
          } else {
            // Rebote normal con velocidad fija
            puckVx = normalX * newSpeed;
            puckVy = normalY * newSpeed;
          }
        }
      }
    };

    // Función para verificar gol
    const checkGoal = () => {
      const goalLeft = (GAME_WIDTH - GOAL_WIDTH) / 2;
      const goalRight = (GAME_WIDTH + GOAL_WIDTH) / 2;
      
      // Gol del jugador (arriba)
      if (puck.y <= PUCK_RADIUS && puck.x >= goalLeft && puck.x <= goalRight) {
        setPlayerScore(prev => {
          const newScore = prev + 1;
          if (newScore >= 7) {
            setWinner('player');
            setGameState('gameOver');
            gameEnded = true;
          }
          return newScore;
        });
        resetPuck();
        return true;
      }
      
      // Gol del bot (abajo)
      if (puck.y >= GAME_HEIGHT - PUCK_RADIUS && puck.x >= goalLeft && puck.x <= goalRight) {
        setBotScore(prev => {
          const newScore = prev + 1;
          if (newScore >= 7) {
            setWinner('bot');
            setGameState('gameOver');
            gameEnded = true;
          }
          return newScore;
        });
        resetPuck();
        return true;
      }
      
      return false;
    };

    // Función para reiniciar el disco
    const resetPuck = () => {
      puck.x = GAME_WIDTH / 2;
      puck.y = GAME_HEIGHT / 2;
      puckVx = 0;
      puckVy = 0;
    };

    // IA del bot mejorada
    const updateBot = () => {
      const botSpeed = 6;
      const distanceToPuck = Math.sqrt((puck.x - botPaddle.x) ** 2 + (puck.y - botPaddle.y) ** 2);
      const puckSpeed = Math.sqrt(puckVx ** 2 + puckVy ** 2);
      
      // Determinar si el disco está en el campo del bot
      const puckInBotField = puck.y < GAME_HEIGHT / 2;
      
      // Detectar si el disco está peligrosamente cerca de la pared superior (zona de riesgo)
      const nearTopWall = puck.y < 100;
      const centerX = GAME_WIDTH / 2;
      
      // 1. MODO ANTI-AUTOGOL: Cuando el disco está cerca de la pared superior
      if (puckInBotField && nearTopWall && distanceToPuck < 150) {
        // Posicionarse hacia el lado más alejado del centro para sacar hacia fuera
        const isLeftSide = puck.x < centerX;
        const safeZoneX = isLeftSide ? centerX + 100 : centerX - 100;
        
        // Moverse hacia la zona segura para poder golpear hacia fuera
        botTargetX = safeZoneX;
        botTargetY = Math.max(80, puck.y + 40); // Posicionarse más abajo del disco
      }
      // 2. MODO ATAQUE LATERAL: Cuando puede atacar desde los lados
      else if (puckInBotField && distanceToPuck < 120 && puckSpeed < 4 && !nearTopWall) {
        // Calcular el mejor ángulo hacia la portería
        const goalCenterX = GAME_WIDTH / 2;
        const goalY = GAME_HEIGHT - 30;
        
        // Ángulo directo hacia la portería desde el disco
        const angleToGoal = Math.atan2(goalY - puck.y, goalCenterX - puck.x);
        
        // Posicionarse detrás del disco para el disparo
        const attackDistance = PADDLE_RADIUS + PUCK_RADIUS + 15;
        const approachAngle = angleToGoal + Math.PI; // Ángulo opuesto
        
        botTargetX = puck.x + Math.cos(approachAngle) * attackDistance;
        botTargetY = puck.y + Math.sin(approachAngle) * attackDistance;
        
        // Agregar pequeña variación para evitar ser predecible
        const variation = Math.sin(Date.now() * 0.005) * 25;
        botTargetX += variation;
      }
      // 3. MODO PERSECUCIÓN INTELIGENTE: Cuando el disco está en movimiento
      else if (puckInBotField && puckSpeed > 0.8) {
        // Si está cerca de la pared superior, perseguir desde abajo
        if (nearTopWall) {
          botTargetX = puck.x;
          botTargetY = Math.max(120, puck.y + 50); // Mantenerse alejado de la pared
        } else {
          // Perseguir normalmente
          const pursuit = 0.7;
          botTargetX = puck.x + (puckVx * pursuit);
          botTargetY = puck.y + (puckVy * pursuit);
          botTargetY = Math.max(60, botTargetY - 25);
        }
      }
      // 4. MODO CONTROL SEGURO: Cuando el disco está parado
      else if (puckInBotField && puckSpeed < 0.8) {
        if (nearTopWall) {
          // Acercarse desde abajo para evitar autogoles
          botTargetX = puck.x + (Math.random() - 0.5) * 30;
          botTargetY = Math.max(100, puck.y + 40);
        } else {
          // Acercarse normalmente
          botTargetX = puck.x + (Math.random() - 0.5) * 50;
          botTargetY = Math.max(60, puck.y - 35);
        }
      }
      // 5. MODO INTERCEPTAR: Cuando el disco viene hacia él
      else if (puckVy < -2 && puck.y < GAME_HEIGHT / 2 + 50) {
        // Predecir posición futura del disco
        const timeToIntercept = (puck.y - 100) / Math.abs(puckVy);
        const interceptX = puck.x + (puckVx * timeToIntercept);
        
        botTargetX = Math.max(PADDLE_RADIUS, Math.min(GAME_WIDTH - PADDLE_RADIUS, interceptX));
        botTargetY = 100;
      }
      // 6. MODO DEFENSIVO: Proteger la portería
      else {
        // Posición defensiva más agresiva
        const defensiveX = GAME_WIDTH / 2 + (puck.x - GAME_WIDTH / 2) * 0.4;
        botTargetX = defensiveX;
        botTargetY = 90;
      }
      
      // Limitar movimiento del bot a su mitad
      botTargetY = Math.max(50, Math.min(GAME_HEIGHT / 2 - PADDLE_RADIUS, botTargetY));
      botTargetX = Math.max(PADDLE_RADIUS, Math.min(GAME_WIDTH - PADDLE_RADIUS, botTargetX));
      
      // Mover bot hacia el objetivo con velocidad adaptativa
      const dx = botTargetX - botPaddle.x;
      const dy = botTargetY - botPaddle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 3) {
        // Velocidad adaptativa: más rápido cuando ataca, más cauteloso cerca de la pared
        const isAttacking = puckInBotField && distanceToPuck < 100 && !nearTopWall;
        const adaptiveSpeed = isAttacking ? botSpeed * 1.5 : botSpeed;
        
        const moveX = (dx / distance) * adaptiveSpeed;
        const moveY = (dy / distance) * adaptiveSpeed;
        
        botPaddle.x += moveX;
        botPaddle.y += moveY;
      }
    };

    // Event listeners del mouse
    const handleMouseMove = (event: MouseEvent) => {
      const rect = (app.view as HTMLCanvasElement).getBoundingClientRect();
      mouseX = event.clientX - rect.left;
      mouseY = event.clientY - rect.top;
    };

    const handleMouseDown = () => {
      isMouseDown = true;
    };

    const handleMouseUp = () => {
      isMouseDown = false;
    };

    (app.view as HTMLCanvasElement).addEventListener('mousemove', handleMouseMove);
    (app.view as HTMLCanvasElement).addEventListener('mousedown', handleMouseDown);
    (app.view as HTMLCanvasElement).addEventListener('mouseup', handleMouseUp);

    // Loop principal del juego
    app.ticker.add(() => {
      if (gameEnded) return;
      
      // Actualizar paddle del jugador (solo en su mitad)
      if (mouseY > GAME_HEIGHT / 2) {
        const targetX = Math.max(PADDLE_RADIUS, Math.min(GAME_WIDTH - PADDLE_RADIUS, mouseX));
        const targetY = Math.max(GAME_HEIGHT / 2 + PADDLE_RADIUS, Math.min(GAME_HEIGHT - PADDLE_RADIUS, mouseY));
        
        playerPaddle.x = targetX;
        playerPaddle.y = targetY;
      }

      // Actualizar bot
      updateBot();

      // Actualizar física del disco
      puck.x += puckVx;
      puck.y += puckVy;

      // Aplicar fricción (reducida para mantener más velocidad)
      puckVx *= 0.995;
      puckVy *= 0.995;

      // Colisiones con bordes
      if (puck.x <= PUCK_RADIUS || puck.x >= GAME_WIDTH - PUCK_RADIUS) {
        puckVx = -puckVx;
        puck.x = Math.max(PUCK_RADIUS, Math.min(GAME_WIDTH - PUCK_RADIUS, puck.x));
      }

      // Colisiones con bordes superior e inferior (fuera de las porterías)
      const goalLeft = (GAME_WIDTH - GOAL_WIDTH) / 2;
      const goalRight = (GAME_WIDTH + GOAL_WIDTH) / 2;
      
      if ((puck.y <= PUCK_RADIUS && (puck.x < goalLeft || puck.x > goalRight)) ||
          (puck.y >= GAME_HEIGHT - PUCK_RADIUS && (puck.x < goalLeft || puck.x > goalRight))) {
        puckVy = -puckVy;
        puck.y = Math.max(PUCK_RADIUS, Math.min(GAME_HEIGHT - PUCK_RADIUS, puck.y));
      }

      // Colisiones con paddles
      handlePaddleCollision(playerPaddle.x, playerPaddle.y, false); // Jugador
      handlePaddleCollision(botPaddle.x, botPaddle.y, true); // Bot

      // Verificar goles
      checkGoal();
    });

    return () => {
      (app.view as HTMLCanvasElement).removeEventListener('mousemove', handleMouseMove);
      (app.view as HTMLCanvasElement).removeEventListener('mousedown', handleMouseDown);
      (app.view as HTMLCanvasElement).removeEventListener('mouseup', handleMouseUp);
      app.destroy(true);
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
      <div style={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(45deg, #0077be 0%, #00a0d6 50%, #4fc3f7 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Arial, sans-serif',
        color: 'white',
        overflowY: 'auto'
      }}>
        <div style={{
          maxWidth: '600px',
          width: '90%',
          padding: '2rem',
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '20px',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          margin: '2rem auto'
        }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            marginBottom: '1.5rem',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
            color: '#e3f2fd'
          }}>
            🏒 AIR HOCKEY
          </h1>
          
          <div style={{
            background: 'rgba(0, 119, 190, 0.2)',
            borderRadius: '15px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            border: '1px solid rgba(0, 119, 190, 0.4)'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#e3f2fd', fontSize: '1.3rem' }}>🎯 Objetivo</h3>
            <p style={{ margin: '0.5rem 0', fontSize: '1rem' }}>Golpea el disco negro hacia la portería del oponente para anotar goles</p>
            <p style={{ margin: '0.5rem 0', fontSize: '1rem' }}>¡Primer jugador en anotar 7 goles gana!</p>
          </div>

          <div style={{
            background: 'rgba(0, 119, 190, 0.2)',
            borderRadius: '15px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            border: '1px solid rgba(0, 119, 190, 0.4)'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#e3f2fd', fontSize: '1.3rem' }}>🕹️ Controles</h3>
            <p style={{ margin: '0.5rem 0', fontSize: '1rem' }}>• Mueve el mouse para controlar tu paddle verde</p>
            <p style={{ margin: '0.5rem 0', fontSize: '1rem' }}>• Solo puedes moverte en tu mitad de la mesa</p>
            <p style={{ margin: '0.5rem 0', fontSize: '1rem' }}>• Golpea el disco para cambiar su dirección</p>
          </div>

          <div style={{
            background: 'rgba(0, 119, 190, 0.2)',
            borderRadius: '15px',
            padding: '1.5rem',
            marginBottom: '2rem',
            border: '1px solid rgba(0, 119, 190, 0.4)'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#e3f2fd', fontSize: '1.3rem' }}>💡 Estrategia</h3>
            <p style={{ margin: '0.5rem 0', fontSize: '1rem' }}>• Defiende tu portería cuando el disco se acerque</p>
            <p style={{ margin: '0.5rem 0', fontSize: '1rem' }}>• Aprovecha los rebotes de las paredes</p>
            <p style={{ margin: '0.5rem 0', fontSize: '1rem' }}>• El bot rojo es tu oponente - ¡será difícil vencerlo!</p>
          </div>
          
          <button
            onClick={startGame}
            style={{
              padding: '1rem 2.5rem',
              fontSize: '1.3rem',
              background: 'linear-gradient(45deg, #0077be, #00a0d6)',
              border: 'none',
              borderRadius: '50px',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
              fontWeight: 'bold'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
            }}
          >
            🏒 ¡JUGAR AIR HOCKEY!
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'gameOver') {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(45deg, #0077be 0%, #00a0d6 50%, #4fc3f7 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Arial, sans-serif',
        color: 'white'
      }}>
        <div style={{
          maxWidth: '500px',
          width: '90%',
          padding: '3rem',
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '20px',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <h1 style={{ 
            fontSize: '3rem', 
            marginBottom: '2rem',
            color: winner === 'player' ? '#4caf50' : '#f44336'
          }}>
            {winner === 'player' ? '🏆 ¡VICTORIA!' : '😢 DERROTA'}
          </h1>
          
          <div style={{
            fontSize: '2rem',
            marginBottom: '2rem',
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px'
          }}>
            <p>Jugador: {playerScore}</p>
            <p>Bot: {botScore}</p>
          </div>
          
          <button
            onClick={resetGame}
            style={{
              padding: '1rem 2rem',
              fontSize: '1.2rem',
              background: 'linear-gradient(45deg, #0077be, #00a0d6)',
              border: 'none',
              borderRadius: '50px',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
              fontWeight: 'bold'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
            }}
          >
            🔄 Jugar de Nuevo
          </button>
        </div>
      </div>
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
        ref={canvasRef}
        style={{
          border: '4px solid white',
          borderRadius: '10px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
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
