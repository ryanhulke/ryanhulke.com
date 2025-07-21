import { useState, useRef, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { getMoveActionValue } from '../utils/chess-ai';
import { getOrCreateSession } from '../utils/onnx-session';

const GAME_MODES = {
  bullet: { label: 'Bullet (1 min)', ms: 60_000 },
  blitz: { label: 'Blitz (5 min)', ms: 300_000 },
  rapid: { label: 'Rapid (10 min)', ms: 600_000 },
};

const ChessBotPage = () => {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState('start');
  const [status, setStatus] = useState('Your move!');
  const [waitingForAI, setWaitingForAI] = useState(false);
  const [gameMode, setGameMode] = useState<'bullet' | 'blitz' | 'rapid'>(
    'bullet',
  );
  const [userTime, setUserTime] = useState(GAME_MODES['bullet'].ms); // ms
  const [aiTime, setAiTime] = useState(GAME_MODES['bullet'].ms); // ms
  const [gameStarted, setGameStarted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const aiTurnStartRef = useRef<number | null>(null);
  const boardRef = useRef(null);

  // Apply the custom theme when component mounts
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'procyon');
  }, []);

  // ONNX model path (relative to public or src/model)
  const modelPath = '/model/final_model.onnx';

  // Timer effects: user and AI (track in ms, update every 100ms)
  useEffect(() => {
    const isUserTurn =
      gameStarted &&
      !waitingForAI &&
      !game.isGameOver() &&
      !(
        status.includes('Checkmate') ||
        status.includes('Stalemate') ||
        status.includes('Draw') ||
        status === 'Game over!' ||
        status === 'Time out - You lose' ||
        status === 'Time out - AI loses'
      );
    const isAITurn =
      gameStarted &&
      waitingForAI &&
      !game.isGameOver() &&
      !(
        status.includes('Checkmate') ||
        status.includes('Stalemate') ||
        status.includes('Draw') ||
        status === 'Game over!' ||
        status === 'Time out - You lose' ||
        status === 'Time out - AI loses'
      );

    const intervalMs = 100;
    if (isUserTurn) {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setUserTime((prev) => (prev > 0 ? prev - intervalMs : 0));
        }, intervalMs);
      }
    } else if (isAITurn) {
      // Start of AI turn: record timestamp
      if (!timerRef.current) {
        aiTurnStartRef.current = Date.now();
        timerRef.current = setInterval(() => {
          setAiTime((prev) => (prev > 0 ? prev - intervalMs : 0));
        }, intervalMs);
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      aiTurnStartRef.current = null;
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      aiTurnStartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waitingForAI, status, game, gameStarted]);

  // If timer hits 0, user loses
  useEffect(() => {
    if (
      userTime <= 0 &&
      !game.isGameOver() &&
      status !== 'Time out - You lose'
    ) {
      setStatus('Time out - You lose');
      setWaitingForAI(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userTime]);

  // If AI timer hits 0, AI loses
  useEffect(() => {
    if (aiTime <= 0 && !game.isGameOver() && status !== 'Time out - AI loses') {
      setStatus('Time out - AI loses');
      setWaitingForAI(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiTime]);
  // Get legal moves from chess.js instance
  async function getAIMove(
    fen: string,
    gameInstance: Chess,
  ): Promise<string | null> {
    try {
      // Test if the model file is accessible
      console.log('[AI] Testing model path:', modelPath);
      const testResponse = await fetch(modelPath);
      console.log(
        '[AI] Model fetch response:',
        testResponse.status,
        testResponse.headers.get('content-type'),
      );
      if (!testResponse.ok) {
        throw new Error(`Model file not found: ${testResponse.status}`);
      } else {
        console.log('[AI] Model file is accessible.');
      }
      const legalMoves = gameInstance.moves({ verbose: true });
      console.log('[AI] FEN:', fen);
      console.log('[AI] Legal moves:', legalMoves);
      if (!legalMoves.length) {
        console.warn('[AI] No legal moves available.');
        return null;
      }
      const session = await getOrCreateSession(modelPath);
      const moveStrings = legalMoves.map(
        (move) => move.from + move.to + (move.promotion ? move.promotion : ''),
      );
      console.log('[AI] Move strings for model:', moveStrings);
      const result = await getMoveActionValue(fen, moveStrings, session);
      console.log('[AI] Model result:', result);
      const { bestMove } = result;
      return bestMove;
    } catch (error) {
      console.error('Error running ONNX model:', error);
      return null;
    }
  }

  // Synchronous onPieceDrop for react-chessboard
  function onPieceDrop(sourceSquare: string, targetSquare: string) {
    if (
      !gameStarted ||
      waitingForAI ||
      userTime === 0 ||
      status === 'Time out - You lose'
    ) {
      return false;
    }
    const newGame = new Chess(game.fen());
    const moves = newGame.moves({ verbose: true });
    const isPromotion = moves.some(
      (m) => m.from === sourceSquare && m.to === targetSquare && m.promotion,
    );
    const move = newGame.move({
      from: sourceSquare,
      to: targetSquare,
      ...(isPromotion ? { promotion: 'q' } : {}),
    });
    if (move === null) return false;
    setGame(newGame);
    setFen(newGame.fen());
    // Defer AI turn state update to next tick so board updates first
    if (newGame.isGameOver()) {
      if (newGame.isCheckmate()) {
        setStatus('Checkmate - You win');
      } else if (newGame.isStalemate()) {
        setStatus('Stalemate - Draw');
      } else if (newGame.isDraw()) {
        setStatus('Draw!');
      } else {
        setStatus('Game over!');
      }
      setWaitingForAI(false);
    } else {
      // Use setTimeout to allow board to update before AI starts
      setTimeout(() => {
        setStatus('AI thinking...');
        setWaitingForAI(true);
      }, 0);
    }
    return true;
  }

  // Function to restart the game
  function restartGame() {
    const newGame = new Chess();
    setGame(newGame);
    setFen('start');
    setStatus('');
    setWaitingForAI(false);
    setUserTime(GAME_MODES[gameMode].ms);
    setAiTime(GAME_MODES[gameMode].ms);
    setGameStarted(false);
  }

  // Handle game mode change (only allowed before game starts or after game ends)
  function handleGameModeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const mode = e.target.value as 'bullet' | 'blitz' | 'rapid';
    setGameMode(mode);
    setUserTime(GAME_MODES[mode].ms);
    setAiTime(GAME_MODES[mode].ms);
  }

  // Start game handler
  function handleStartGame() {
    setGameStarted(true);
    setStatus('Your move!');
  }

  // Effect to trigger AI move after user move
  useEffect(() => {
    if (!waitingForAI) return;
    const doAIMove = async () => {
      const aiTurnStart = aiTurnStartRef.current || Date.now();
      const aiMove = await getAIMove(game.fen(), game);
      const aiTurnEnd = Date.now();
      const elapsed = aiTurnEnd - aiTurnStart;
      setAiTime((prev) => (prev > 0 ? Math.max(0, prev - elapsed) : 0));
      if (aiMove) {
        const newGame = new Chess(game.fen());
        newGame.move(aiMove);
        setGame(newGame);
        setFen(newGame.fen());
        // Check if game is over after AI move
        if (newGame.isGameOver()) {
          if (newGame.isCheckmate()) {
            setStatus('Checkmate - ChessNet wins');
          } else if (newGame.isStalemate()) {
            setStatus('Stalemate - Draw');
          } else if (newGame.isDraw()) {
            setStatus('Draw!');
          } else {
            setStatus('Game over!');
          }
        } else {
          setStatus('Your move!');
        }
      } else {
        setStatus('Game over!');
      }
      setWaitingForAI(false);
    };
    doAIMove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waitingForAI]);

  return (
    <div className="min-h-screen bg-base-300 text-base-content flex flex-col items-center">
      <h1 className="text-4xl font-bold my-8 text-base-content">
        Play Against ChessNet
      </h1>
      {/* Chessboard and controls */}
      <div className="bg-base-100 p-8 rounded-box shadow-xl">
        {/* Black player label (ChessNet) - top left */}
        <div className="mb-2 text-left flex items-center gap-2">
          <span className="text-base-content text-sm font-medium">
            ChessNet (2114)
          </span>
          <span className="text-base-content text-xs font-mono bg-base-200 px-2 py-1 rounded">
            {Math.floor(aiTime / 1000 / 60)}:
            {(Math.floor(aiTime / 1000) % 60).toString().padStart(2, '0')}
          </span>
        </div>
        <Chessboard
          id="ChessBotBoard"
          position={fen}
          onPieceDrop={onPieceDrop}
          boardWidth={400}
          boardOrientation="white"
          customBoardStyle={{
            borderRadius: '1rem',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.4)',
          }}
          ref={boardRef}
        />
        {/* White player label (User) - bottom left */}
        <div className="mt-2 text-left flex items-center gap-2">
          <span className="text-base-content text-sm font-medium">User</span>
          <span className="text-base-content text-xs font-mono bg-base-200 px-2 py-1 rounded">
            {Math.floor(userTime / 1000 / 60)}:
            {(Math.floor(userTime / 1000) % 60).toString().padStart(2, '0')}
          </span>
        </div>
        {/* Game mode selector and start button: only show if game has not started, now below user label/timer */}
        {!gameStarted && (
          <div className="mt-4 flex items-center gap-2 justify-center">
            <label
              htmlFor="game-mode"
              className="text-base-content text-sm font-medium"
            >
              Game Mode:
            </label>
            <select
              id="game-mode"
              className="select select-sm select-bordered"
              value={gameMode}
              onChange={handleGameModeChange}
              disabled={gameStarted}
            >
              {Object.entries(GAME_MODES).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
            <button
              className="btn btn-primary btn-sm ml-4"
              onClick={handleStartGame}
            >
              Start Game
            </button>
          </div>
        )}

        {/* Status message display for game over, draw, or timeout */}
        {(status.includes('Checkmate') ||
          status.includes('Stalemate') ||
          status.includes('Draw') ||
          status === 'Game over!' ||
          status === 'Time out - You lose' ||
          status === 'Time out - AI loses') && (
          <div className="mt-4 flex flex-col items-center">
            <div className="mb-2 text-lg font-semibold text-base-content">
              {status}
            </div>
            <button onClick={restartGame} className="btn btn-primary btn-sm">
              New Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChessBotPage;
