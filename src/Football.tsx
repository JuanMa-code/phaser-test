import React, { useEffect, useRef, useState, useCallback } from 'react';

interface Player {
  id: number;
  x: number;
  y: number;
  team: 'blue' | 'red';
  position: 'GK' | 'DEF' | 'MID' | 'ATT';
  isControlledByUser: boolean;
  originalX: number;
  originalY: number;
  speed: number;
  actionZone: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface GameState {
  gameStarted: boolean;
  currentHalf: 1 | 2;
  timeLeft: number;
  blueScore: number;
  redScore: number;
  isCountdown: boolean;
  countdownValue: number;
  showGoal: boolean;
}

const FIELD_WIDTH = 1000;
const FIELD_HEIGHT = 600;
const PLAYER_SIZE = 15;
const BALL_SIZE = 6;
const GOAL_WIDTH = 80;
const HALF_TIME_DURATION = 180; // Duración de cada parte en segundos (5 minutos)

const Football: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const [showInstructions, setShowInstructions] = useState(true);
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(0);
  const [gameState, setGameState] = useState<GameState>({
    gameStarted: false,
    currentHalf: 1,
    timeLeft: HALF_TIME_DURATION, // Usar la constante
    blueScore: 0,
    redScore: 0,
    isCountdown: false,
    countdownValue: 3,
    showGoal: false,
  });

  const gameStateRef = useRef<GameState>(gameState);

  const playersRef = useRef<Player[]>([]);
  const ballRef = useRef<Ball>({
    x: FIELD_WIDTH / 2,
    y: FIELD_HEIGHT / 2,
    vx: 0,
    vy: 0
  });

  const keysRef = useRef<{ [key: string]: boolean }>({});

  // Sincronizar gameStateRef con gameState
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Temporizador del juego
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (gameState.gameStarted && gameState.timeLeft > 0 && !gameState.isCountdown) {
      interval = setInterval(() => {
        setGameState(prev => {
          const newTimeLeft = prev.timeLeft - 1;
          
          if (newTimeLeft <= 0) {
            if (prev.currentHalf === 1) {
              // Fin del primer tiempo - iniciar cuenta atrás para segundo tiempo
              setTimeout(() => {
                // Cambiar de campo
                swapTeamSides();
                
                // Reiniciar posiciones de jugadores
                resetPlayersToInitialPositions();
                
                // Reiniciar balón
                ballRef.current = { x: FIELD_WIDTH / 2, y: FIELD_HEIGHT / 2, vx: 0, vy: 0 };
                
                // Empezar cuenta atrás para segundo tiempo
                gameStateRef.current = {
                  ...gameStateRef.current,
                  currentHalf: 2,
                  timeLeft: HALF_TIME_DURATION,
                  isCountdown: true,
                  countdownValue: 3,
                  gameStarted: false
                };
                setGameState({ ...gameStateRef.current });
                
                startCountdown(() => {
                  setGameState(prev => ({
                    ...prev,
                    gameStarted: true
                  }));
                });
              }, 1000);
              
              return {
                ...prev,
                currentHalf: 2,
                timeLeft: HALF_TIME_DURATION,
                gameStarted: false,
                isCountdown: true,
                countdownValue: 3,
                showGoal: false
              };
            } else {
              // Fin del partido
              return {
                ...prev,
                gameStarted: false,
                timeLeft: 0
              };
            }
          }
          
          return { ...prev, timeLeft: newTimeLeft };
        });
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [gameState.gameStarted, gameState.timeLeft, gameState.isCountdown]);

  // Efecto para manejar el cambio de medio tiempo
  useEffect(() => {
    // Este efecto se ejecuta cuando cambia el tiempo pero no debe interferir con el inicio
    if (gameState.currentHalf === 2 && gameState.timeLeft === HALF_TIME_DURATION && gameState.gameStarted && !gameState.isCountdown) {
      // Solo si estamos en una situación específica de cambio de tiempo
      console.log('Handling halftime transition');
    }
  }, [gameState.currentHalf, gameState.timeLeft]);

  // Función para resetear jugadores a posiciones iniciales
  const resetPlayersToInitialPositions = () => {
    playersRef.current.forEach(player => {
      player.x = player.originalX;
      player.y = player.originalY;
    });
  };

  // Función para iniciar cuenta atrás
  const startCountdown = (callback?: () => void) => {
    console.log('Starting countdown...');
    setGameState(prev => ({
      ...prev,
      isCountdown: true,
      countdownValue: 3
    }));
    
    let count = 3;
    const countdownInterval = setInterval(() => {
      count--;
      console.log('Countdown:', count);
      setGameState(prev => ({
        ...prev,
        countdownValue: count
      }));
      
      if (count <= 0) {
        clearInterval(countdownInterval);
        setGameState(prev => ({
          ...prev,
          isCountdown: false,
          showGoal: false
        }));
        console.log('Countdown finished');
        if (callback) callback();
      }
    }, 1000);
  };

  // Función para iniciar cuenta atrás después de un gol
  const startGoalCountdown = (callback?: () => void) => {
    console.log('Starting goal countdown...');
    setGameState(prev => ({
      ...prev,
      isCountdown: true,
      countdownValue: 3,
      showGoal: true
    }));
    
    let count = 3;
    const countdownInterval = setInterval(() => {
      count--;
      console.log('Goal countdown:', count);
      setGameState(prev => ({
        ...prev,
        countdownValue: count
      }));
      
      if (count <= 0) {
        clearInterval(countdownInterval);
        setGameState(prev => ({
          ...prev,
          isCountdown: false,
          showGoal: false
        }));
        console.log('Goal countdown finished');
        if (callback) callback();
      }
    }, 1000);
  };

  // Función para formatear el tiempo
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Función para cambiar los lados de los equipos
  const swapTeamSides = () => {
    playersRef.current.forEach(player => {
      // Intercambiar posiciones horizontalmente
      player.x = FIELD_WIDTH - player.x;
      player.originalX = FIELD_WIDTH - player.originalX;
      
      // NO cambiar el equipo - los colores se mantienen igual durante todo el partido
      // Solo recalcular las zonas de acción basadas en la nueva posición
      // Para esto, temporalmente invertimos la lógica del equipo para el cálculo de zona
      const temporaryTeam = player.team === 'blue' ? 'red' : 'blue';
      player.actionZone = calculateActionZone(player.position, temporaryTeam);
    });
  };

  // Función para calcular zona de acción basada en posición y equipo
  const calculateActionZone = (position: 'GK' | 'DEF' | 'MID' | 'ATT', team: 'blue' | 'red') => {
    const isBlue = team === 'blue';
    const fieldThird = FIELD_WIDTH / 3;
    
    switch (position) {
      case 'GK':
        return isBlue 
          ? { minX: 10, maxX: fieldThird * 0.5, minY: 50, maxY: FIELD_HEIGHT - 50 }
          : { minX: fieldThird * 2.5, maxX: FIELD_WIDTH - 10, minY: 50, maxY: FIELD_HEIGHT - 50 };
      
      case 'DEF':
        return isBlue 
          ? { minX: 10, maxX: fieldThird * 1.5, minY: 20, maxY: FIELD_HEIGHT - 20 }
          : { minX: fieldThird * 1.5, maxX: FIELD_WIDTH - 10, minY: 20, maxY: FIELD_HEIGHT - 20 };
      
      case 'MID':
        return isBlue 
          ? { minX: fieldThird * 0.6, maxX: fieldThird * 2.9, minY: 20, maxY: FIELD_HEIGHT - 20 }
          : { minX: fieldThird * 0.1, maxX: fieldThird * 2.4, minY: 20, maxY: FIELD_HEIGHT - 20 };
      
      case 'ATT':
        return isBlue 
          ? { minX: fieldThird * 1.5, maxX: FIELD_WIDTH - 10, minY: 20, maxY: FIELD_HEIGHT - 20 }
          : { minX: 10, maxX: fieldThird * 1.5, minY: 20, maxY: FIELD_HEIGHT - 20 };
      
      default:
        return { minX: 20, maxX: FIELD_WIDTH - 20, minY: 20, maxY: FIELD_HEIGHT - 20 };
    }
  };

  // Posiciones iniciales de los jugadores
  const initializePlayers = useCallback(() => {
    const players: Player[] = [];
    
    // Equipo azul (izquierda)
    const bluePositions = [
      { x: 80, y: FIELD_HEIGHT / 2, pos: 'GK' as const }, // Portero
      { x: 180, y: FIELD_HEIGHT * 0.3, pos: 'DEF' as const }, // Defensa
      { x: 180, y: FIELD_HEIGHT * 0.7, pos: 'DEF' as const }, // Defensa
      { x: 280, y: FIELD_HEIGHT * 0.25, pos: 'MID' as const }, // Medio
      { x: 280, y: FIELD_HEIGHT * 0.75, pos: 'MID' as const }, // Medio
      { x: 380, y: FIELD_HEIGHT / 2, pos: 'ATT' as const }, // Delantero
    ];

    // Equipo rojo (derecha)
    const redPositions = [
      { x: FIELD_WIDTH - 80, y: FIELD_HEIGHT / 2, pos: 'GK' as const },
      { x: FIELD_WIDTH - 180, y: FIELD_HEIGHT * 0.3, pos: 'DEF' as const },
      { x: FIELD_WIDTH - 180, y: FIELD_HEIGHT * 0.7, pos: 'DEF' as const },
      { x: FIELD_WIDTH - 280, y: FIELD_HEIGHT * 0.25, pos: 'MID' as const },
      { x: FIELD_WIDTH - 280, y: FIELD_HEIGHT * 0.75, pos: 'MID' as const },
      { x: FIELD_WIDTH - 380, y: FIELD_HEIGHT / 2, pos: 'ATT' as const },
    ];

    // Crear jugadores del equipo azul
    bluePositions.forEach((pos, index) => {
      const actionZone = calculateActionZone(pos.pos, 'blue');
      players.push({
        id: index,
        x: pos.x,
        y: pos.y,
        team: 'blue',
        position: pos.pos,
        isControlledByUser: index === selectedPlayerIndex,
        originalX: pos.x,
        originalY: pos.y,
        speed: pos.pos === 'GK' ? 2.5 : pos.pos === 'DEF' ? 3 : pos.pos === 'MID' ? 3.5 : 3.2,
        actionZone
      });
    });

    // Crear jugadores del equipo rojo (IA)
    redPositions.forEach((pos, index) => {
      const actionZone = calculateActionZone(pos.pos, 'red');
      players.push({
        id: index + 6,
        x: pos.x,
        y: pos.y,
        team: 'red',
        position: pos.pos,
        isControlledByUser: false,
        originalX: pos.x,
        originalY: pos.y,
        speed: pos.pos === 'GK' ? 2.5 : pos.pos === 'DEF' ? 3 : pos.pos === 'MID' ? 3.5 : 3.2,
        actionZone
      });
    });

    playersRef.current = players;
  }, [selectedPlayerIndex]);

  // Función para dibujar el campo
  const drawField = (ctx: CanvasRenderingContext2D) => {
    // Fondo verde
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);

    // Líneas del campo
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;

    // Bordes del campo
    ctx.strokeRect(10, 10, FIELD_WIDTH - 20, FIELD_HEIGHT - 20);

    // Línea central
    ctx.beginPath();
    ctx.moveTo(FIELD_WIDTH / 2, 10);
    ctx.lineTo(FIELD_WIDTH / 2, FIELD_HEIGHT - 10);
    ctx.stroke();

    // Círculo central
    ctx.beginPath();
    ctx.arc(FIELD_WIDTH / 2, FIELD_HEIGHT / 2, 60, 0, Math.PI * 2);
    ctx.stroke();

    // Área grande izquierda
    ctx.strokeRect(10, FIELD_HEIGHT / 2 - 100, 120, 200);

    // Área pequeña izquierda
    ctx.strokeRect(10, FIELD_HEIGHT / 2 - 50, 50, 100);

    // Área grande derecha
    ctx.strokeRect(FIELD_WIDTH - 130, FIELD_HEIGHT / 2 - 100, 120, 200);

    // Área pequeña derecha
    ctx.strokeRect(FIELD_WIDTH - 60, FIELD_HEIGHT / 2 - 50, 50, 100);

    // Porterías
    ctx.lineWidth = 4;
    // Portería izquierda
    ctx.beginPath();
    ctx.moveTo(10, FIELD_HEIGHT / 2 - GOAL_WIDTH / 2);
    ctx.lineTo(-5, FIELD_HEIGHT / 2 - GOAL_WIDTH / 2);
    ctx.lineTo(-5, FIELD_HEIGHT / 2 + GOAL_WIDTH / 2);
    ctx.lineTo(10, FIELD_HEIGHT / 2 + GOAL_WIDTH / 2);
    ctx.stroke();

    // Portería derecha
    ctx.beginPath();
    ctx.moveTo(FIELD_WIDTH - 10, FIELD_HEIGHT / 2 - GOAL_WIDTH / 2);
    ctx.lineTo(FIELD_WIDTH + 5, FIELD_HEIGHT / 2 - GOAL_WIDTH / 2);
    ctx.lineTo(FIELD_WIDTH + 5, FIELD_HEIGHT / 2 + GOAL_WIDTH / 2);
    ctx.lineTo(FIELD_WIDTH - 10, FIELD_HEIGHT / 2 + GOAL_WIDTH / 2);
    ctx.stroke();
  };

  // Función para dibujar jugadores
  const drawPlayer = (ctx: CanvasRenderingContext2D, player: Player) => {
    const color = player.team === 'blue' ? '#0066FF' : '#FF0000';
    const borderColor = player.isControlledByUser ? '#FFFF00' : '#000000';
    
    // Círculo del jugador
    ctx.fillStyle = color;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = player.isControlledByUser ? 3 : 1;
    
    ctx.beginPath();
    ctx.arc(player.x, player.y, PLAYER_SIZE, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Número del jugador
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(player.id.toString(), player.x, player.y + 3);
  };

  // Función para dibujar la pelota
  const drawBall = (ctx: CanvasRenderingContext2D, ball: Ball) => {
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_SIZE, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };

  // Función de distancia
  const distance = (x1: number, y1: number, x2: number, y2: number): number => {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  };

  // Mover jugador hacia un objetivo
  const movePlayerTowards = (player: Player, targetX: number, targetY: number) => {
    const dist = distance(player.x, player.y, targetX, targetY);
    if (dist > 3) {
      // Usar la velocidad del jugador definida en su inicialización
      const speed = player.speed;
      
      const angle = Math.atan2(targetY - player.y, targetX - player.x);
      player.x += Math.cos(angle) * speed;
      player.y += Math.sin(angle) * speed;
      
      // Mantener dentro del campo
      player.x = Math.max(20, Math.min(FIELD_WIDTH - 20, player.x));
      player.y = Math.max(20, Math.min(FIELD_HEIGHT - 20, player.y));
    }
  };

  // Función para verificar si la pelota está en la zona de acción del jugador
  const isBallInActionZone = (player: Player, ball: Ball): boolean => {
    const zone = player.actionZone;
    return ball.x >= zone.minX && ball.x <= zone.maxX && 
           ball.y >= zone.minY && ball.y <= zone.maxY;
  };

  // Función para encontrar posición táctica basada en la situación del juego
  const getTacticalPosition = (player: Player, ball: Ball): { x: number, y: number } => {
    const { position, team, actionZone, originalX, originalY } = player;
    const isBlue = team === 'blue';
    const ballInOwnHalf = isBlue ? ball.x < FIELD_WIDTH / 2 : ball.x > FIELD_WIDTH / 2;
    
    switch (position) {
      case 'GK':
        // Portero se mueve horizontalmente según la pelota, pero se mantiene en su área
        const gkY = Math.max(actionZone.minY, Math.min(actionZone.maxY, ball.y));
        return { x: originalX, y: gkY };
      
      case 'DEF':
        if (ballInOwnHalf) {
          // Si la pelota está en campo propio, los defensas bajan hacia su portería
          const ownGoalX = isBlue ? 30 : FIELD_WIDTH - 30;
          const ballDistanceToGoal = Math.abs(ball.x - ownGoalX);
          
          // Mientras más cerca esté la pelota de su portería, más retroceden
          const retreatFactor = Math.max(0.3, 1 - (ballDistanceToGoal / (FIELD_WIDTH / 2)));
          const defX = isBlue 
            ? originalX - (70 * retreatFactor) // Retroceden más si la pelota está muy cerca
            : originalX + (70 * retreatFactor);
          
          const defY = originalY + (ball.y - FIELD_HEIGHT / 2) * 0.4;
          return {
            x: Math.max(actionZone.minX, Math.min(actionZone.maxX, defX)),
            y: Math.max(actionZone.minY, Math.min(actionZone.maxY, defY))
          };
        } else {
          // Si la pelota está en campo rival, avanzan moderadamente
          const defX = isBlue ? originalX + 80 : originalX - 80;
          return {
            x: Math.max(actionZone.minX, Math.min(actionZone.maxX, defX)),
            y: originalY
          };
        }
      
      case 'MID':
        // Mediocampistas se mueven más dinámicamente según la situación
        let midX: number;
        let midY: number;
        
        if (ballInOwnHalf) {
          // Pelota en campo propio - apoyar defensa
          midX = isBlue ? originalX - 60 : originalX + 60;
          midY = originalY + (ball.y - FIELD_HEIGHT / 2) * 0.4;
        } else {
          // Pelota en campo rival - subir al ataque
          const forwardSupport = isBlue ? originalX + 150 : originalX - 150;
          midX = forwardSupport;
          midY = originalY + (ball.y - FIELD_HEIGHT / 2) * 0.6;
          
          // Si hay un delantero cerca de la pelota, subir aún más para apoyo
          const nearbyForward = playersRef.current.find(p => 
            p.team === team && 
            p.position === 'ATT' && 
            distance(p.x, p.y, ball.x, ball.y) < 120
          );
          
          if (nearbyForward) {
            midX = isBlue ? Math.min(actionZone.maxX, forwardSupport + 50) : Math.max(actionZone.minX, forwardSupport - 50);
          }
        }
        
        return {
          x: Math.max(actionZone.minX, Math.min(actionZone.maxX, midX)),
          y: Math.max(actionZone.minY, Math.min(actionZone.maxY, midY))
        };
      
      case 'ATT':
        // Delanteros buscan espacios en campo rival
        if (!ballInOwnHalf) {
          // Si la pelota está en campo rival, buscan posición de ataque
          const attX = isBlue ? Math.min(actionZone.maxX, ball.x + 50) : Math.max(actionZone.minX, ball.x - 50);
          const attY = originalY + (ball.y - FIELD_HEIGHT / 2) * 0.5;
          return {
            x: Math.max(actionZone.minX, Math.min(actionZone.maxX, attX)),
            y: Math.max(actionZone.minY, Math.min(actionZone.maxY, attY))
          };
        } else {
          // Si la pelota está en campo propio, mantienen posición pero se preparan
          const attX = isBlue ? originalX + 30 : originalX - 30;
          return {
            x: Math.max(actionZone.minX, Math.min(actionZone.maxX, attX)),
            y: originalY
          };
        }
      
      default:
        return { x: originalX, y: originalY };
    }
  };

  // IA mejorada de los jugadores
  const updateAI = () => {
    const ball = ballRef.current;
    
    playersRef.current.forEach(player => {
      if (player.isControlledByUser) return;
      
      const distToBall = distance(player.x, player.y, ball.x, ball.y);
      const ballInZone = isBallInActionZone(player, ball);
      const tacticalPosition = getTacticalPosition(player, ball);
      
      // Prioridades de comportamiento:
      // 1. Si la pelota está en mi zona y cerca, ir hacia ella
      // 2. Si la pelota está en mi zona pero lejos, acercarme gradualmente
      // 3. Si la pelota no está en mi zona, ir a posición táctica
      
      let targetX = tacticalPosition.x;
      let targetY = tacticalPosition.y;
      
      if (ballInZone) {
        if (distToBall < 100) {
          // Pelota cerca en mi zona - ir directamente hacia ella
          targetX = ball.x;
          targetY = ball.y;
        } else if (distToBall < 200) {
          // Pelota en mi zona pero no muy cerca - acercarse gradualmente
          const approachFactor = 0.6;
          targetX = player.x + (ball.x - player.x) * approachFactor;
          targetY = player.y + (ball.y - player.y) * approachFactor;
          
          // Asegurar que no salgamos de nuestra zona
          targetX = Math.max(player.actionZone.minX, Math.min(player.actionZone.maxX, targetX));
          targetY = Math.max(player.actionZone.minY, Math.min(player.actionZone.maxY, targetY));
        }
      }
      
      // Si hay otros jugadores muy cerca de la pelota, no todos van hacia ella
      const nearbyTeammates = playersRef.current.filter(p => 
        !p.isControlledByUser && 
        p.team === player.team && 
        p.id !== player.id && 
        distance(p.x, p.y, ball.x, ball.y) < 80
      );
      
      if (nearbyTeammates.length >= 2 && distToBall > 60) {
        // Si ya hay 2 o más compañeros cerca de la pelota, mantener posición táctica
        targetX = tacticalPosition.x;
        targetY = tacticalPosition.y;
      }
      
      // Mover hacia el objetivo
      movePlayerTowards(player, targetX, targetY);
    });
  };

  // Actualizar la pelota
  const updateBall = () => {
    const ball = ballRef.current;
    
    // Aplicar fricción
    ball.vx *= 0.985;
    ball.vy *= 0.985;
    
    // Mover pelota
    ball.x += ball.vx;
    ball.y += ball.vy;
    
    // Rebotes en los bordes superior e inferior
    if (ball.y <= 20 || ball.y >= FIELD_HEIGHT - 20) {
      ball.vy *= -0.7;
      ball.y = Math.max(20, Math.min(FIELD_HEIGHT - 20, ball.y));
    }
    
    // Rebotes en los lados (excepto en las porterías)
    if (ball.x <= 20) {
      // Lado izquierdo
      if (ball.y < FIELD_HEIGHT / 2 - GOAL_WIDTH / 2 || ball.y > FIELD_HEIGHT / 2 + GOAL_WIDTH / 2) {
        ball.vx *= -0.7;
        ball.x = 20;
      } else {
        // Gol en portería izquierda
        if (ball.x <= 0) {
          setGameState(prev => {
            // En primera parte: portería izquierda = gol para rojo
            // En segunda parte: portería izquierda = gol para azul (porque cambiaron de campo)
            const newState = prev.currentHalf === 1 
              ? { ...prev, redScore: prev.redScore + 1 }
              : { ...prev, blueScore: prev.blueScore + 1 };
            gameStateRef.current = newState;
            return newState;
          });
          resetBall();
          resetPlayersToInitialPositions();
          startGoalCountdown(); // Usar cuenta atrás especial para goles
        }
      }
    }
    
    if (ball.x >= FIELD_WIDTH - 20) {
      // Lado derecho
      if (ball.y < FIELD_HEIGHT / 2 - GOAL_WIDTH / 2 || ball.y > FIELD_HEIGHT / 2 + GOAL_WIDTH / 2) {
        ball.vx *= -0.7;
        ball.x = FIELD_WIDTH - 20;
      } else {
        // Gol en portería derecha
        if (ball.x >= FIELD_WIDTH) {
          setGameState(prev => {
            // En primera parte: portería derecha = gol para azul
            // En segunda parte: portería derecha = gol para rojo (porque cambiaron de campo)
            const newState = prev.currentHalf === 1 
              ? { ...prev, blueScore: prev.blueScore + 1 }
              : { ...prev, redScore: prev.redScore + 1 };
            gameStateRef.current = newState;
            return newState;
          });
          resetBall();
          resetPlayersToInitialPositions();
          startGoalCountdown(); // Usar cuenta atrás especial para goles
        }
      }
    }
    
    // Parar la pelota si va muy lento
    if (Math.abs(ball.vx) < 0.2) ball.vx = 0;
    if (Math.abs(ball.vy) < 0.2) ball.vy = 0;
  };

  // Reiniciar pelota al centro
  const resetBall = () => {
    ballRef.current.x = FIELD_WIDTH / 2;
    ballRef.current.y = FIELD_HEIGHT / 2;
    ballRef.current.vx = 0;
    ballRef.current.vy = 0;
  };

  // Colisiones entre jugadores y pelota
  const checkBallPlayerCollision = () => {
    const ball = ballRef.current;
    
    playersRef.current.forEach(player => {
      const dist = distance(player.x, player.y, ball.x, ball.y);
      
      if (dist < PLAYER_SIZE + BALL_SIZE) {
        // Calcular ángulo de rebote
        const angle = Math.atan2(ball.y - player.y, ball.x - player.x);
        
        // Fuerza y dirección dependiendo del tipo de jugador y situación
        let force: number;
        let targetAngle = angle;
        
        if (player.isControlledByUser) {
          force = 8; // El jugador controlado golpea más fuerte
        } else {
          // IA: comportamiento inteligente según posición
          const isBlue = player.team === 'blue';
          const goalX = isBlue ? FIELD_WIDTH - 30 : 30; // Portería rival
          const goalY = FIELD_HEIGHT / 2;
          
          switch (player.position) {
            case 'GK':
              // Portero: despejar hacia los lados o hacia mediocampo
              const clearAngle = Math.abs(ball.y - FIELD_HEIGHT/2) > 100 ? 
                Math.atan2(FIELD_HEIGHT/2 - ball.y, isBlue ? -200 : 200) : // Hacia mediocampo
                Math.atan2(ball.y < FIELD_HEIGHT/2 ? -150 : 150, isBlue ? -100 : 100); // Hacia los lados
              targetAngle = clearAngle;
              force = 7;
              break;
              
            case 'DEF':
              // Defensa: despejar hacia adelante o hacer pase lateral
              if (Math.random() > 0.3) { // 70% despeje hacia adelante
                targetAngle = Math.atan2(0, isBlue ? 200 : -200);
              } else { // 30% pase lateral
                targetAngle = Math.atan2(Math.random() > 0.5 ? -100 : 100, isBlue ? 150 : -150);
              }
              force = 6;
              break;
              
            case 'MID':
              // Mediocampista: pase inteligente o avance
              const nearestTeammate = playersRef.current
                .filter(p => p.team === player.team && p.id !== player.id && p.position !== 'GK')
                .sort((a, b) => distance(a.x, a.y, ball.x, ball.y) - distance(b.x, b.y, ball.x, ball.y))[0];
              
              if (nearestTeammate && Math.random() > 0.4) {
                // 60% pase a compañero
                targetAngle = Math.atan2(nearestTeammate.y - ball.y, nearestTeammate.x - ball.x);
                force = 5;
              } else {
                // 40% avance hacia portería
                targetAngle = Math.atan2(goalY - ball.y, goalX - ball.x);
                force = 6;
              }
              break;
              
            case 'ATT':
              // Delantero: tirar a portería si está cerca, sino pasar o avanzar
              const distToGoal = distance(ball.x, ball.y, goalX, goalY);
              if (distToGoal < 200 && Math.random() > 0.2) {
                // 80% tiro a portería si está cerca
                const goalAngle = Math.atan2(goalY - ball.y + (Math.random() - 0.5) * 40, goalX - ball.x);
                targetAngle = goalAngle;
                force = 9; // Tiro fuerte
              } else {
                // Avance o pase
                targetAngle = Math.atan2(goalY - ball.y, goalX - ball.x);
                force = 7;
              }
              break;
              
            default:
              force = 6;
          }
        }
        
        ball.vx = Math.cos(targetAngle) * force;
        ball.vy = Math.sin(targetAngle) * force;
        
        // Separar pelota del jugador
        ball.x = player.x + Math.cos(angle) * (PLAYER_SIZE + BALL_SIZE + 2);
        ball.y = player.y + Math.sin(angle) * (PLAYER_SIZE + BALL_SIZE + 2);
      }
    });
  };

  // Actualizar jugador controlado
  const updatePlayerMovement = () => {
    const controlledPlayer = playersRef.current.find(p => p.isControlledByUser);
    if (!controlledPlayer) return;
    
    const speed = controlledPlayer.speed;
    
    if (keysRef.current['w'] || keysRef.current['arrowup']) controlledPlayer.y -= speed;
    if (keysRef.current['s'] || keysRef.current['arrowdown']) controlledPlayer.y += speed;
    if (keysRef.current['a'] || keysRef.current['arrowleft']) controlledPlayer.x -= speed;
    if (keysRef.current['d'] || keysRef.current['arrowright']) controlledPlayer.x += speed;
    
    // Mantener dentro del campo
    controlledPlayer.x = Math.max(20, Math.min(FIELD_WIDTH - 20, controlledPlayer.x));
    controlledPlayer.y = Math.max(20, Math.min(FIELD_HEIGHT - 20, controlledPlayer.y));
  };

  // Loop principal del juego
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);
    
    // Dibujar campo siempre
    drawField(ctx);
    
    // Dibujar jugadores y pelota siempre
    playersRef.current.forEach(player => {
      drawPlayer(ctx, player);
    });
    drawBall(ctx, ballRef.current);
    
    // Si el juego está activo y no hay cuenta atrás, actualizar lógica
    if (gameStateRef.current.gameStarted && gameStateRef.current.timeLeft > 0 && !gameStateRef.current.isCountdown) {
      updatePlayerMovement();
      updateAI();
      updateBall();
      checkBallPlayerCollision();
    }
    
    // Dibujar cuenta atrás si está activa
    if (gameStateRef.current.isCountdown && gameStateRef.current.countdownValue > 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);
      
      // Si es un gol, mostrar "GOL" encima del contador
      if (gameStateRef.current.showGoal) {
        ctx.fillStyle = '#FFD700'; // Dorado para "GOL"
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('¡GOL!', FIELD_WIDTH / 2, FIELD_HEIGHT / 2 - 50);
      }
      
      // Mostrar el contador
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 120px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(gameStateRef.current.countdownValue.toString(), FIELD_WIDTH / 2, FIELD_HEIGHT / 2 + 40);
    }
    
    // Mostrar mensaje de finalización del partido
    if (gameStateRef.current.timeLeft <= 0 && gameStateRef.current.currentHalf >= 2) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);
      
      // Título "PARTIDO TERMINADO"
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 60px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('¡PARTIDO TERMINADO!', FIELD_WIDTH / 2, FIELD_HEIGHT / 2 - 120);
      
      // Mostrar resultado final
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 48px Arial';
      const winner = gameStateRef.current.blueScore > gameStateRef.current.redScore ? 
        'GANÓ EQUIPO AZUL' : 
        gameStateRef.current.redScore > gameStateRef.current.blueScore ? 
        'GANÓ EQUIPO ROJO' : 
        'EMPATE';
      ctx.fillText(winner, FIELD_WIDTH / 2, FIELD_HEIGHT / 2 - 60);
      
      // Mostrar marcador final
      ctx.font = 'bold 36px Arial';
      ctx.fillText(`Resultado Final: ${gameStateRef.current.blueScore} - ${gameStateRef.current.redScore}`, 
                   FIELD_WIDTH / 2, FIELD_HEIGHT / 2 - 10);
      
      // Botón Reiniciar
      const restartButtonX = FIELD_WIDTH / 2 - 140;
      const restartButtonY = FIELD_HEIGHT / 2 + 30;
      const buttonWidth = 140;
      const buttonHeight = 50;
      
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(restartButtonX, restartButtonY, buttonWidth, buttonHeight);
      ctx.strokeStyle = '#45A049';
      ctx.lineWidth = 3;
      ctx.strokeRect(restartButtonX, restartButtonY, buttonWidth, buttonHeight);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px Arial';
      ctx.fillText('🔄 REINICIAR', restartButtonX + buttonWidth/2, restartButtonY + buttonHeight/2 + 6);
      
      // Botón Menú
      const menuButtonX = FIELD_WIDTH / 2 + 10;
      const menuButtonY = FIELD_HEIGHT / 2 + 30;
      const menuButtonWidth = 120;
      const menuButtonHeight = 50;
      
      ctx.fillStyle = '#2196F3';
      ctx.fillRect(menuButtonX, menuButtonY, menuButtonWidth, menuButtonHeight);
      ctx.strokeStyle = '#1976D2';
      ctx.lineWidth = 3;
      ctx.strokeRect(menuButtonX, menuButtonY, menuButtonWidth, menuButtonHeight);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px Arial';
      ctx.fillText('🏠 MENÚ', menuButtonX + menuButtonWidth/2, menuButtonY + menuButtonHeight/2 + 6);
      
      // Instrucciones para el usuario
      ctx.font = 'bold 18px Arial';
      ctx.fillStyle = '#FFFF88';
      ctx.fillText('Haz clic en los botones o presiona R para Reiniciar | M para Menú', FIELD_WIDTH / 2, FIELD_HEIGHT / 2 + 120);
    }
    
    // Continuar el loop siempre para poder mostrar los mensajes
    animationRef.current = requestAnimationFrame(gameLoop);
  }, []);

  // Iniciar el juego
  const startGame = () => {
    console.log('Starting game...');
    
    // Ocultar instrucciones
    setShowInstructions(false);
    
    // Inicializar jugadores
    initializePlayers();
    console.log('Players initialized:', playersRef.current.length);
    
    // Reiniciar el balón
    resetBall();
    
    // Configurar estado inicial del juego
    const initialGameState: GameState = {
      gameStarted: true, // Empezar inmediatamente para mostrar jugadores
      currentHalf: 1,
      timeLeft: HALF_TIME_DURATION,
      blueScore: 0,
      redScore: 0,
      isCountdown: true,
      countdownValue: 3,
      showGoal: false
    };
    
    setGameState(initialGameState);
    gameStateRef.current = initialGameState;
    
    console.log('Starting initial countdown');
    
    // Empezar cuenta atrás inicial
    setTimeout(() => {
      startCountdown(() => {
        console.log('Countdown finished, game ready');
        const newState = { ...gameStateRef.current, isCountdown: false };
        setGameState(newState);
        gameStateRef.current = newState;
      });
    }, 100);
    
    // Iniciar el loop de juego inmediatamente
    setTimeout(() => {
      gameLoop();
    }, 50);
  };

  // Función para reiniciar el partido
  const restartGame = useCallback(() => {
    console.log('Restarting game...');
    
    // Detener el loop de juego si está corriendo
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
    
    // Limpiar completamente el array de jugadores
    playersRef.current = [];
    
    // Reinicializar jugadores
    initializePlayers();
    
    // Reiniciar el balón
    resetBall();
    
    // Reiniciar estado del juego
    const initialGameState: GameState = {
      gameStarted: true,
      currentHalf: 1,
      timeLeft: HALF_TIME_DURATION,
      blueScore: 0,
      redScore: 0,
      isCountdown: true,
      countdownValue: 3,
      showGoal: false
    };
    
    setGameState(initialGameState);
    gameStateRef.current = initialGameState;
    
    // Empezar cuenta atrás inicial
    setTimeout(() => {
      startCountdown(() => {
        console.log('Countdown finished, game ready');
        const newState = { ...gameStateRef.current, isCountdown: false };
        setGameState(newState);
        gameStateRef.current = newState;
      });
    }, 100);
    
    // Reiniciar el loop de juego
    setTimeout(() => {
      gameLoop();
    }, 50);
  }, [initializePlayers, gameLoop]);

  // Función para volver al menú
  const goToMenu = useCallback(() => {
    console.log('Going back to menu...');
    
    // Detener el loop de juego si está corriendo
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
    
    // Resetear al estado inicial
    setShowInstructions(true);
    
    // Limpiar estado del juego
    setGameState({
      gameStarted: false,
      currentHalf: 1,
      timeLeft: HALF_TIME_DURATION,
      blueScore: 0,
      redScore: 0,
      isCountdown: false,
      countdownValue: 3,
      showGoal: false,
    });
  }, []);

  // Event listeners para teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      
      // Controles especiales cuando el juego ha terminado
      if (gameStateRef.current.timeLeft <= 0 && gameStateRef.current.currentHalf >= 2) {
        if (e.key.toLowerCase() === 'r') {
          console.log('Restart key pressed');
          restartGame();
        } else if (e.key.toLowerCase() === 'm') {
          console.log('Menu key pressed');
          goToMenu();
        }
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    
    console.log('Setting up keyboard event listeners...');
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [restartGame, goToMenu]);

  // Event listeners para mouse - se ejecutan después de que el juego esté activo
  useEffect(() => {
    // Solo registrar mouse listeners cuando el juego NO está en el menú de instrucciones
    if (showInstructions) return;
    
    const handleMouseClick = (e: MouseEvent) => {
      console.log('=== MOUSE CLICK DETECTED ===');
      console.log('Raw click event received!');
      console.log('Event target:', e.target);
      console.log('Current target:', e.currentTarget);
      console.log('Event type:', e.type);
      console.log('Mouse coordinates:', e.clientX, e.clientY);
      console.log('Game state timeLeft:', gameStateRef.current.timeLeft);
      console.log('Game state currentHalf:', gameStateRef.current.currentHalf);
      console.log('Game ended condition:', gameStateRef.current.timeLeft <= 0 && gameStateRef.current.currentHalf >= 2);
      
      // Solo manejar clics cuando el juego ha terminado
      if (gameStateRef.current.timeLeft <= 0 && gameStateRef.current.currentHalf >= 2) {
        console.log('Game has ended, processing click...');
        
        const canvas = canvasRef.current;
        if (!canvas) {
          console.log('Canvas not found!');
          return;
        }
        
        const rect = canvas.getBoundingClientRect();
        console.log('Canvas rect:', rect);
        
        // Coordenadas del mouse relativas al canvas (sin escalado)
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        console.log('Mouse position relative to canvas:', mouseX, mouseY);
        
        // Convertir a coordenadas del canvas considerando el escalado
        const canvasMouseX = (mouseX / rect.width) * canvas.width;
        const canvasMouseY = (mouseY / rect.height) * canvas.height;
        
        console.log('Converted canvas coordinates:', canvasMouseX, canvasMouseY);
        console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
        console.log('Display dimensions:', rect.width, 'x', rect.height);
        
        // Coordenadas de los botones (en coordenadas del canvas)
        const restartButtonX = FIELD_WIDTH / 2 - 140;
        const restartButtonY = FIELD_HEIGHT / 2 + 30;
        const menuButtonX = FIELD_WIDTH / 2 + 10;
        const menuButtonY = FIELD_HEIGHT / 2 + 30;
        const restartButtonWidth = 140;
        const restartButtonHeight = 50;
        const menuButtonWidth = 120;
        const menuButtonHeight = 50;
        
        console.log('Button dimensions - Restart:', restartButtonWidth, 'x', restartButtonHeight, 'Menu:', menuButtonWidth, 'x', menuButtonHeight);
        console.log('Restart button area:', restartButtonX, restartButtonY, 'to', restartButtonX + restartButtonWidth, restartButtonY + restartButtonHeight);
        console.log('Menu button area:', menuButtonX, menuButtonY, 'to', menuButtonX + menuButtonWidth, menuButtonY + menuButtonHeight);
        
        // Verificar clic en botón Reiniciar
        const inRestartButton = canvasMouseX >= restartButtonX && canvasMouseX <= restartButtonX + restartButtonWidth &&
                               canvasMouseY >= restartButtonY && canvasMouseY <= restartButtonY + restartButtonHeight;
        
        // Verificar clic en botón Menú
        const inMenuButton = canvasMouseX >= menuButtonX && canvasMouseX <= menuButtonX + menuButtonWidth &&
                             canvasMouseY >= menuButtonY && canvasMouseY <= menuButtonY + menuButtonHeight;
        
        console.log('Click in restart button:', inRestartButton);
        console.log('Click in menu button:', inMenuButton);
        
        if (inRestartButton) {
          console.log('RESTART BUTTON CLICKED!');
          e.preventDefault();
          e.stopPropagation();
          restartGame();
          return;
        }
        
        if (inMenuButton) {
          console.log('MENU BUTTON CLICKED!');
          e.preventDefault();
          e.stopPropagation();
          goToMenu();
          return;
        }
        
        console.log('Click outside buttons');
      } else {
        console.log('Game not ended, ignoring click');
      }
      console.log('=== END MOUSE CLICK DEBUG ===');
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      // Solo cambiar cursor cuando el juego ha terminado
      if (gameStateRef.current.timeLeft <= 0 && gameStateRef.current.currentHalf >= 2) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        
        // Coordenadas del mouse relativas al canvas (sin escalado)
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Convertir a coordenadas del canvas considerando el escalado
        const canvasMouseX = (mouseX / rect.width) * canvas.width;
        const canvasMouseY = (mouseY / rect.height) * canvas.height;
        
        // Coordenadas de los botones (en coordenadas del canvas)
        const restartButtonX = FIELD_WIDTH / 2 - 140;
        const restartButtonY = FIELD_HEIGHT / 2 + 30;
        const menuButtonX = FIELD_WIDTH / 2 + 10;
        const menuButtonY = FIELD_HEIGHT / 2 + 30;
        const restartButtonWidth = 140;
        const restartButtonHeight = 50;
        const menuButtonWidth = 120;
        const menuButtonHeight = 50;
        
        // Verificar si el mouse está sobre algún botón
        const isOverRestartButton = canvasMouseX >= restartButtonX && canvasMouseX <= restartButtonX + restartButtonWidth &&
                                   canvasMouseY >= restartButtonY && canvasMouseY <= restartButtonY + restartButtonHeight;
        const isOverMenuButton = canvasMouseX >= menuButtonX && canvasMouseX <= menuButtonX + menuButtonWidth &&
                                 canvasMouseY >= menuButtonY && canvasMouseY <= menuButtonY + menuButtonHeight;
        
        // Debug: log cuando está sobre un botón
        if (isOverRestartButton || isOverMenuButton) {
          console.log('Mouse over button! Restart:', isOverRestartButton, 'Menu:', isOverMenuButton);
          console.log('Setting cursor to pointer');
        }
        
        // Cambiar cursor
        const newCursor = (isOverRestartButton || isOverMenuButton) ? 'pointer' : 'default';
        if (canvas.style.cursor !== newCursor) {
          console.log('Changing cursor from', canvas.style.cursor, 'to', newCursor);
          canvas.style.cursor = newCursor;
        }
      } else {
        // Durante el juego, cursor normal
        const canvas = canvasRef.current;
        if (canvas && canvas.style.cursor !== 'default') {
          console.log('Setting cursor to default during game');
          canvas.style.cursor = 'default';
        }
      }
    };
    
    // Esperar un poco para que el canvas esté completamente renderizado
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        console.log('=== REGISTERING MOUSE EVENT LISTENERS ===');
        console.log('Canvas element found:', canvas);
        console.log('Canvas tagName:', canvas.tagName);
        console.log('Canvas id:', canvas.id);
        console.log('Canvas className:', canvas.className);
        console.log('Canvas style.pointerEvents:', canvas.style.pointerEvents);
        
        // Registrar event listeners
        canvas.addEventListener('click', handleMouseClick, { capture: false, passive: false });
        canvas.addEventListener('mousemove', handleMouseMove, { capture: false, passive: false });
        
        console.log('Mouse event listeners registered successfully');
        
      } else {
        console.error('CRITICAL: Canvas not found when trying to register mouse events');
      }
    }, 100);
    
    return () => {
      clearTimeout(timer);
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.removeEventListener('click', handleMouseClick);
        canvas.removeEventListener('mousemove', handleMouseMove);
        console.log('Mouse event listeners removed');
      }
    };
  }, [showInstructions, restartGame, goToMenu]); // Dependencias: se re-ejecuta cuando cambia showInstructions

  if (showInstructions) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 50%, #66bb6a 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Arial, sans-serif',
        padding: '20px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '40px',
          maxWidth: '600px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            color: '#2e7d32',
            marginBottom: '30px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
          }}>
            ⚽ FÚTBOL
          </h1>
          
          <div style={{
            textAlign: 'left',
            marginBottom: '30px',
            fontSize: '1.1rem',
            lineHeight: '1.6'
          }}>
            <h3 style={{ color: '#1976d2', marginBottom: '15px' }}>🎮 CONTROLES:</h3>
            <p><strong>WASD</strong> o <strong>Flechas</strong> - Mover jugador</p>
            <p><strong>Objetivo:</strong> Controla a tu jugador y ayuda a tu equipo a marcar goles</p>
            
            <h3 style={{ color: '#1976d2', marginTop: '25px', marginBottom: '15px' }}>⚽ REGLAS:</h3>
            <p>• Acércate a la pelota para tocarla y patearla</p>
            <p>• Tu jugador tiene borde amarillo</p>
            <p>• El equipo azul ataca hacia la derecha</p>
            <p>• Los demás jugadores son controlados por IA</p>
          </div>
          
          <div style={{
            marginBottom: '30px',
            padding: '20px',
            background: '#f5f5f5',
            borderRadius: '10px'
          }}>
            <h3 style={{ color: '#1976d2', marginBottom: '15px' }}>👤 SELECCIONA TU JUGADOR:</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                Jugador del Equipo Azul:
              </label>
              <select 
                value={selectedPlayerIndex} 
                onChange={(e) => setSelectedPlayerIndex(Number(e.target.value))}
                style={{
                  padding: '8px 15px',
                  fontSize: '16px',
                  borderRadius: '5px',
                  border: '2px solid #ddd',
                  width: '100%'
                }}
              >
                <option value={0}>Portero (GK)</option>
                <option value={1}>Defensa 1 (DEF)</option>
                <option value={2}>Defensa 2 (DEF)</option>
                <option value={3}>Medio 1 (MID)</option>
                <option value={4}>Medio 2 (MID)</option>
                <option value={5}>Delantero (ATT)</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={startGame}
            style={{
              fontSize: '1.3rem',
              padding: '15px 40px',
              background: 'linear-gradient(145deg, #4caf50, #45a049)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 8px 20px rgba(76, 175, 80, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 25px rgba(76, 175, 80, 0.5)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(76, 175, 80, 0.4)';
            }}
          >
            🚀 ¡COMENZAR PARTIDO!
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
      padding: '20px'
    }}>
      {/* Marcador */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '15px 30px',
        borderRadius: '15px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '30px',
        fontSize: '1.1rem',
        fontWeight: 'bold',
        boxShadow: '0 5px 15px rgba(0,0,0,0.2)'
      }}>
        <div style={{ color: '#0066FF' }}>
          AZUL: {gameState.blueScore}
        </div>
        <div style={{ color: '#333', textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem' }}>FÚTBOL ⚽</div>
          <div style={{ fontSize: '0.9rem', marginTop: '5px' }}>
            {gameState.timeLeft > 0 ? (
              <>
                {gameState.currentHalf}° TIEMPO - {formatTime(gameState.timeLeft)}
              </>
            ) : (
              'PARTIDO TERMINADO'
            )}
          </div>
        </div>
        <div style={{ color: '#FF0000' }}>
          ROJO: {gameState.redScore}
        </div>
      </div>
      
      <canvas 
        ref={canvasRef}
        width={FIELD_WIDTH}
        height={FIELD_HEIGHT}
        style={{
          border: '4px solid #fff',
          borderRadius: '10px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          background: '#228B22',
          cursor: 'default',
          pointerEvents: 'auto',
          touchAction: 'none'
        }}
        onClick={(e) => {
          console.log('=== REACT onClick FIRED ===');
          console.log('React click event:', e);
        }}
        onMouseDown={(e) => {
          console.log('=== REACT onMouseDown FIRED ===');
          console.log('React mousedown event:', e);
        }}
      />
      
      <div style={{
        marginTop: '20px',
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '15px',
        borderRadius: '10px',
        textAlign: 'center',
        maxWidth: '600px'
      }}>
        <p style={{ margin: '5px 0', color: '#333' }}>
          <strong>Controles:</strong> WASD o Flechas para mover
        </p>
        <p style={{ margin: '5px 0', color: '#666', fontSize: '0.9rem' }}>
          Tu jugador tiene un borde amarillo. Acércate a la pelota para patearla.
        </p>
      </div>
    </div>
  );
};

export default Football;