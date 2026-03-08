'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useGameStore } from '@/stores/gameStore';
import { useGame } from '@/hooks/useGame';
import { ChessBoard } from '@/components/chess/ChessBoard';
import { MoveHistory } from '@/components/chess/MoveHistory';
import { GameChat } from '@/components/chess/GameChat';
import { useEffect } from 'react';
import { GameStatus, GameResult } from '@chess/shared';
import type { GameSession } from '@chess/shared';

interface PageProps {
  params: { gameId: string };
}

export default function LiveGamePage({ params }: PageProps) {
  const { gameId } = params;
  const { setGame } = useGameStore();

  const { data: gameData } = useQuery<GameSession>({
    queryKey: ['game', gameId],
    queryFn: () => api.get(`/games/${gameId}`),
  });

  useEffect(() => {
    if (gameData) setGame(gameData);
  }, [gameData, setGame]);

  const { activeGame, moves, currentFen, result, isMyTurn, playingAs, drawOfferedByOpponent, sendMove, resign, offerDraw, respondDraw, sendChat } =
    useGame(gameId);

  if (!activeGame) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">Loading game...</div>
    );
  }

  const isActive = activeGame.status === GameStatus.ACTIVE;
  const isOver = result !== null || activeGame.status === GameStatus.COMPLETED;

  const resultLabel: Record<GameResult, string> = {
    [GameResult.WHITE_WINS]: 'White wins',
    [GameResult.BLACK_WINS]: 'Black wins',
    [GameResult.DRAW]: 'Draw',
    [GameResult.ABANDONED]: 'Game abandoned',
  };

  return (
    <div className="flex h-full gap-0">
      {/* Board area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-900">
        {/* Opponent info */}
        <div className="mb-3 text-white text-sm">
          {playingAs === 'w'
            ? activeGame.blackPlayer.displayName
            : activeGame.whitePlayer.displayName}
          {!isMyTurn && isActive && <span className="ml-2 text-yellow-400 animate-pulse">thinking...</span>}
        </div>

        <div className="w-full max-w-lg">
          <ChessBoard
            fen={currentFen}
            orientation={playingAs === 'b' ? 'black' : 'white'}
            onMove={sendMove}
            isMyTurn={!!isMyTurn && isActive}
            disabled={isOver}
          />
        </div>

        {/* Player info */}
        <div className="mt-3 text-white text-sm">
          {playingAs === 'w'
            ? activeGame.whitePlayer.displayName
            : activeGame.blackPlayer.displayName}
          {isMyTurn && isActive && <span className="ml-2 text-green-400">your turn</span>}
        </div>

        {/* Game over banner */}
        {isOver && result && (
          <div className="mt-4 bg-white text-gray-900 px-6 py-3 rounded-xl text-center shadow-lg">
            <p className="font-bold text-lg">{resultLabel[result]}</p>
          </div>
        )}

        {/* Draw offer */}
        {drawOfferedByOpponent && isActive && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 px-4 py-3 rounded-xl text-center">
            <p className="text-sm mb-2">Opponent offered a draw</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => respondDraw(true)} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Accept</button>
              <button onClick={() => respondDraw(false)} className="bg-red-500 text-white px-3 py-1 rounded text-sm">Decline</button>
            </div>
          </div>
        )}

        {/* Controls */}
        {isActive && (
          <div className="mt-4 flex gap-2">
            <button onClick={offerDraw} className="text-sm border border-white/30 text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
              Offer Draw
            </button>
            <button onClick={resign} className="text-sm bg-red-600/80 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors">
              Resign
            </button>
          </div>
        )}
      </div>

      {/* Right panel: move history + chat */}
      <div className="w-72 bg-white border-l flex flex-col">
        <div className="flex-1 overflow-hidden">
          <div className="h-1/2 overflow-hidden border-b p-2">
            <MoveHistory moves={moves} />
          </div>
          <div className="h-1/2 overflow-hidden p-2">
            <GameChat gameId={gameId} onSend={sendChat} />
          </div>
        </div>
      </div>
    </div>
  );
}
