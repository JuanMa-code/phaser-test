import React, { useEffect, useMemo, useRef, useState } from 'react';

// Tipos y utilidades
type Cell = number; // 0 = vacío
type Board = Cell[][]; // 9x9

type Difficulty = 'Fácil' | 'Medio' | 'Difícil' | 'Experto';

const SIZE = 9;
const BOX = 3;

const DIFFICULTY_CLUES: Record<Difficulty, [number, number]> = {
  'Fácil': [40, 47],
  'Medio': [34, 38],
  'Difícil': [28, 32],
  'Experto': [22, 26],
};

function cloneBoard(b: Board): Board { return b.map(r => [...r]); }

function emptyBoard(): Board { return Array.from({ length: SIZE }, () => Array(SIZE).fill(0)); }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isValid(b: Board, r: number, c: number, val: number): boolean {
  for (let i = 0; i < SIZE; i++) {
    if (b[r][i] === val || b[i][c] === val) return false;
  }
  const br = Math.floor(r / BOX) * BOX;
  const bc = Math.floor(c / BOX) * BOX;
  for (let i = 0; i < BOX; i++) {
    for (let j = 0; j < BOX; j++) {
      if (b[br + i][bc + j] === val) return false;
    }
  }
  return true;
}

function findEmpty(b: Board): [number, number] | null {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (b[r][c] === 0) return [r, c];
    }
  }
  return null;
}

// Solver que cuenta soluciones hasta un máximo
function solveCountSolutions(board: Board, limit = 2): number {
  const b = cloneBoard(board);
  let count = 0;
  function backtrack(): boolean {
    const pos = findEmpty(b);
    if (!pos) { count++; return count >= limit; }
    const [r, c] = pos;
    for (const n of shuffle([1,2,3,4,5,6,7,8,9])) {
      if (isValid(b, r, c, n)) {
        b[r][c] = n;
        if (backtrack()) return true;
        b[r][c] = 0;
      }
    }
    return false;
  }
  backtrack();
  return count;
}

// Resuelve in-place (una solución)
function solveSingle(board: Board): boolean {
  const pos = findEmpty(board);
  if (!pos) return true;
  const [r, c] = pos;
  for (const n of shuffle([1,2,3,4,5,6,7,8,9])) {
    if (isValid(board, r, c, n)) {
      board[r][c] = n;
      if (solveSingle(board)) return true;
      board[r][c] = 0;
    }
  }
  return false;
}

function generateCompletedBoard(): Board {
  const b = emptyBoard();
  function fill(pos = 0): boolean {
    if (pos === SIZE * SIZE) return true;
    const r = Math.floor(pos / SIZE), c = pos % SIZE;
    for (const n of shuffle([1,2,3,4,5,6,7,8,9])) {
      if (isValid(b, r, c, n)) {
        b[r][c] = n;
        if (fill(pos + 1)) return true;
        b[r][c] = 0;
      }
    }
    return false;
  }
  fill();
  return b;
}

function generatePuzzle(difficulty: Difficulty): { puzzle: Board; solution: Board } {
  // 1) Generar solución completa
  const solution = generateCompletedBoard();
  const puzzle = cloneBoard(solution);

  // 2) Calcular cuántas pistas queremos (clues)
  const [minClues, maxClues] = DIFFICULTY_CLUES[difficulty];
  const cluesTarget = Math.floor(minClues + Math.random() * (maxClues - minClues + 1));
  let cellsToRemove = SIZE * SIZE - cluesTarget;

  // 3) Intentar quitar celdas manteniendo solución única
  const positions = shuffle(Array.from({ length: SIZE * SIZE }, (_, i) => i));
  for (const pos of positions) {
    if (cellsToRemove <= 0) break;
    const r = Math.floor(pos / SIZE), c = pos % SIZE;
    const backup = puzzle[r][c];
    if (backup === 0) continue;
    puzzle[r][c] = 0;

    // Chequear unicidad: máximo 1 solución
    const solutions = solveCountSolutions(puzzle, 2);
    if (solutions !== 1) {
      // revertir
      puzzle[r][c] = backup;
    } else {
      cellsToRemove--;
    }
  }

  return { puzzle, solution };
}

// Estilos reutilizables
const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  padding: '24px',
  color: '#fff',
  fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif'
};

const panelStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 16,
  padding: 16,
  backdropFilter: 'blur(8px)',
  boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(9, 48px)',
  gridTemplateRows: 'repeat(9, 48px)',
  gap: 0,
  background: '#111827',
  padding: 8,
  borderRadius: 12,
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2), 0 12px 24px rgba(0,0,0,0.35)'
};

const cellBase: React.CSSProperties = {
  width: 48,
  height: 48,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 20,
  fontWeight: 700,
  cursor: 'pointer',
  userSelect: 'none',
  position: 'relative',
  background: '#1f2937',
  color: '#e5e7eb',
};

function thickBorderStyle(r: number, c: number): React.CSSProperties {
  return {
    borderTop: r % 3 === 0 ? '2px solid #94a3b8' : '1px solid #374151',
    borderLeft: c % 3 === 0 ? '2px solid #94a3b8' : '1px solid #374151',
    borderRight: (c + 1) % 3 === 0 ? '2px solid #94a3b8' : '1px solid #374151',
    borderBottom: (r + 1) % 3 === 0 ? '2px solid #94a3b8' : '1px solid #374151',
  };
}

const keypadStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 48px)',
  gridTemplateRows: 'repeat(2, 48px)',
  gap: 8,
};

const buttonStyle: React.CSSProperties = {
  ...panelStyle,
  padding: '10px 14px',
  borderRadius: 10,
  background: 'rgba(255,255,255,0.15)',
  cursor: 'pointer',
  color: '#fff',
  fontWeight: 700,
  textAlign: 'center'
};

const selectStyle: React.CSSProperties = {
  ...panelStyle,
  padding: '8px 12px',
  borderRadius: 10,
  background: 'rgba(255,255,255,0.15)',
  color: '#fff',
  border: 'none'
};

const infoPill: React.CSSProperties = {
  ...panelStyle,
  padding: '8px 12px',
  borderRadius: 999,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8
};

const Sudoku: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>('Medio');
  const [puzzle, setPuzzle] = useState<Board>(() => emptyBoard());
  const [solution, setSolution] = useState<Board>(() => emptyBoard());
  const [userBoard, setUserBoard] = useState<Board>(() => emptyBoard());
  const [givenMask, setGivenMask] = useState<boolean[][]>(() => Array.from({length: SIZE},()=>Array(SIZE).fill(false)));
  const [selected, setSelected] = useState<{r:number;c:number}|null>(null);
  const [showConflicts, setShowConflicts] = useState(true);
  const [startTs, setStartTs] = useState<number | null>(null);
  const [nowTs, setNowTs] = useState<number>(Date.now());
  const [won, setWon] = useState(false);

  // Generar al montar
  useEffect(() => {
    newGame('Medio');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer simple
  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const elapsed = useMemo(() => {
    if (!startTs) return '00:00';
    const s = Math.floor((nowTs - startTs) / 1000);
    const mm = String(Math.floor(s/60)).padStart(2,'0');
    const ss = String(s%60).padStart(2,'0');
    return `${mm}:${ss}`;
  }, [nowTs, startTs]);

  function newGame(d: Difficulty) {
    const { puzzle, solution } = generatePuzzle(d);
    const mask = puzzle.map(row => row.map(v => v !== 0));
    setPuzzle(puzzle);
    setSolution(solution);
    setUserBoard(cloneBoard(puzzle));
    setGivenMask(mask);
    setSelected(null);
    setWon(false);
    setDifficulty(d);
    setStartTs(Date.now());
  }

  function placeNumber(n: number) {
    if (!selected) return;
    const { r, c } = selected;
    if (givenMask[r][c]) return; // no permitir editar pistas
    const next = cloneBoard(userBoard);
    next[r][c] = n;
    setUserBoard(next);
  }

  function clearCell() {
    if (!selected) return;
    const { r, c } = selected;
    if (givenMask[r][c]) return;
    const next = cloneBoard(userBoard);
    next[r][c] = 0;
    setUserBoard(next);
  }

  function isConflict(r: number, c: number, val: number): boolean {
    if (val === 0) return false;
    // mismo valor en fila/col/box (excepto sí mismo)
    for (let i = 0; i < SIZE; i++) {
      if (i !== c && userBoard[r][i] === val) return true;
      if (i !== r && userBoard[i][c] === val) return true;
    }
    const br = Math.floor(r/BOX)*BOX, bc = Math.floor(c/BOX)*BOX;
    for (let i = 0; i < BOX; i++) {
      for (let j = 0; j < BOX; j++) {
        const rr = br + i, cc = bc + j;
        if ((rr !== r || cc !== c) && userBoard[rr][cc] === val) return true;
      }
    }
    return false;
  }

  // Detección de victoria
  useEffect(() => {
    if (won) return;
    // todas llenas y sin conflictos y coincide con solución
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const v = userBoard[r][c];
        if (v === 0) return;
        if (v !== solution[r][c]) return;
      }
    }
    // si llegó aquí, ganó
    setWon(true);
  }, [userBoard, solution, won]);

  // Teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selected) return;
      const k = e.key;
      if (/^[1-9]$/.test(k)) {
        placeNumber(parseInt(k, 10));
      } else if (k === 'Backspace' || k === 'Delete' || k === '0') {
        clearCell();
      } else if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(k)) {
        e.preventDefault();
        const { r, c } = selected;
        if (k === 'ArrowUp') setSelected({ r: Math.max(0, r - 1), c });
        if (k === 'ArrowDown') setSelected({ r: Math.min(8, r + 1), c });
        if (k === 'ArrowLeft') setSelected({ r, c: Math.max(0, c - 1) });
        if (k === 'ArrowRight') setSelected({ r, c: Math.min(8, c + 1) });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, userBoard]);

  const sameNumber = useMemo(() => {
    if (!selected) return new Set<number>();
    const v = userBoard[selected.r][selected.c];
    return new Set([v]);
  }, [selected, userBoard]);

  return (
    <div style={containerStyle}>
      <h1 style={{ margin: 0, marginBottom: 12, fontWeight: 800, letterSpacing: 1 }}>🧩 Sudoku</h1>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <div style={infoPill}>⏱️ Tiempo: <strong>{elapsed}</strong></div>
        <div style={infoPill}>Dificultad:&nbsp;
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            style={{ ...selectStyle, padding: '6px 10px' }}
          >
            <option value="Fácil">Fácil</option>
            <option value="Medio">Medio</option>
            <option value="Difícil">Difícil</option>
            <option value="Experto">Experto</option>
          </select>
        </div>
        <button style={buttonStyle} onClick={() => newGame(difficulty)}>🔄 Nueva partida</button>
        <button style={buttonStyle} onClick={() => setShowConflicts(v => !v)}>
          {showConflicts ? '🙈 Ocultar' : '🔎 Mostrar'} conflictos
        </button>
        <button style={buttonStyle} onClick={() => setUserBoard(cloneBoard(solution))}>💡 Resolver</button>
        <button style={buttonStyle} onClick={() => setUserBoard(cloneBoard(puzzle))}>↩️ Reiniciar</button>
      </div>

      <div style={{ ...panelStyle, padding: 16 }}>
        <div style={gridStyle}>
          {userBoard.map((row, r) => row.map((val, c) => {
            const isGiven = givenMask[r][c];
            const selectedCell = selected && selected.r === r && selected.c === c;
            const sameVal = selected && val !== 0 && sameNumber.has(val);
            const conflict = showConflicts && isConflict(r, c, val);
            return (
              <div
                key={`${r}-${c}`}
                onClick={() => setSelected({ r, c })}
                style={{
                  ...cellBase,
                  ...thickBorderStyle(r, c),
                  background: selectedCell ? '#374151' : sameVal ? '#273449' : '#1f2937',
                  color: isGiven ? '#a5b4fc' : conflict ? '#fca5a5' : '#e5e7eb',
                  boxShadow: selectedCell ? 'inset 0 0 0 2px #60a5fa' : 'none',
                  fontWeight: isGiven ? 800 : 700,
                }}
              >
                {val !== 0 ? val : ''}
              </div>
            );
          }))}
        </div>
      </div>

      {/* Keypad */}
      <div style={{ marginTop: 16, ...panelStyle }}>
        <div style={{ padding: 12 }}>
          <div style={keypadStyle}>
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <button key={n} style={buttonStyle} onClick={() => placeNumber(n)}>{n}</button>
            ))}
            <button style={{ ...buttonStyle, gridColumn: 'span 2' }} onClick={clearCell}>🧽 Borrar</button>
          </div>
        </div>
      </div>

      {won && (
        <div style={{
          position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)'
        }}>
          <div style={{ ...panelStyle, padding: 24, textAlign: 'center' }}>
            <h2 style={{ marginTop: 0 }}>🎉 ¡Sudoku completado!</h2>
            <p>Tiempo: <strong>{elapsed}</strong></p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button style={buttonStyle} onClick={() => newGame(difficulty)}>▶️ Jugar de nuevo</button>
              <button style={buttonStyle} onClick={() => window.history.back()}>🏠 Menú</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 16, opacity: 0.8 }}>Consejos: Usa el teclado (1-9, ←→↑↓, Supr) o el keypad. Evita conflictos para avanzar más rápido.</div>
    </div>
  );
};

export default Sudoku;
