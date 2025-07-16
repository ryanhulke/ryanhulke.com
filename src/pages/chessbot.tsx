import { useState, useRef, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

const ChessBotPage = () => {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState('start');
  const [status, setStatus] = useState('Your move!');
  const [waitingForAI, setWaitingForAI] = useState(false);
  const boardRef = useRef(null);

  // Apply the custom theme when component mounts
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'procyon');
  }, []);

  const url = 'http://localhost:8000';
  // Replace this with your real AI move logic
  async function getAIMove(fen: string): Promise<string | null> {
    // make a post request with fen to your AI backend, which expects a json obj: fen: string
    // and returns a json obj: { uci: string }
    try {
      const response = await fetch(`${url}/get-move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fen }),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      return data.uci || null; // Assuming the AI returns a UCI move string
    } catch (error) {
      console.error('Error fetching AI move:', error);
      return null;
    }
  }

  // Synchronous onPieceDrop for react-chessboard
  function onPieceDrop(sourceSquare: string, targetSquare: string) {
    if (waitingForAI) return false;
    const newGame = new Chess(game.fen());
    const move = newGame.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q',
    });
    if (move === null) return false;
    setGame(newGame);
    setFen(newGame.fen());
    // Check if game is over after user move
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
      setStatus('AI thinking...');
      setWaitingForAI(true);
    }
    return true;
  }

  // Function to restart the game
  function restartGame() {
    const newGame = new Chess();
    setGame(newGame);
    setFen('start');
    setStatus('Your move!');
    setWaitingForAI(false);
  }

  // Effect to trigger AI move after user move
  useEffect(() => {
    if (!waitingForAI) return;
    const doAIMove = async () => {
      const aiMove = await getAIMove(game.fen());
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
      <div className="bg-base-100 p-8 rounded-box shadow-xl">
        {/* Black player label (ChessNet) - top left */}
        <div className="mb-2 text-left">
          <span className="text-base-content text-sm font-medium">
            ChessNet (2114)
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
        <div className="mt-2 text-left">
          <span className="text-base-content text-sm font-medium">User</span>
        </div>
        <div className="mt-4 text-center text-base-content font-medium">
          {status}
        </div>
        {(status.includes('Checkmate') ||
          status.includes('Stalemate') ||
          status.includes('Draw') ||
          status === 'Game over!') && (
          <div className="mt-4 flex justify-center">
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
