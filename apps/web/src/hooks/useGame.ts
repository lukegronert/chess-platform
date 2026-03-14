'use client';

import { useEffect, useCallback, useState } from 'react';
import { Chess } from 'chess.js';
import { connectSocket } from '@/lib/socket';
import { useGameStore } from '@/stores/gameStore';
import { useAuthStore } from '@/stores/authStore';
import { SOCKET_EVENTS } from '@chess/shared';
import type { GameMoveServerPayload, GameEndedPayload, GameDrawOfferPayload, GamePresencePayload } from '@chess/shared';

export function useGame(gameId: string) {
  const { user } = useAuthStore();
  const { activeGame, moves, currentFen, result, drawOfferedByOpponent, addMove, setEnded, setDrawOffer } =
    useGameStore();
  const [opponentInRoom, setOpponentInRoom] = useState(false);

  useEffect(() => {
    const socket = connectSocket();

    socket.emit(SOCKET_EVENTS.GAME_JOIN, { gameId });

    socket.on(SOCKET_EVENTS.GAME_MOVE, (payload: GameMoveServerPayload) => {
      if (payload.gameId === gameId) {
        addMove(payload.move, payload.fen);
      }
    });

    socket.on(SOCKET_EVENTS.GAME_ENDED, (payload: GameEndedPayload) => {
      if (payload.gameId === gameId) {
        setEnded(payload.result, payload.pgn);
      }
    });

    socket.on(SOCKET_EVENTS.GAME_DRAW_OFFER, (payload: GameDrawOfferPayload) => {
      if (payload.gameId === gameId) {
        setDrawOffer(true);
      }
    });

    socket.on(SOCKET_EVENTS.GAME_PRESENCE, (payload: GamePresencePayload) => {
      if (payload.gameId === gameId && payload.userId !== user?.id) {
        setOpponentInRoom(payload.online);
      }
    });

    return () => {
      socket.emit(SOCKET_EVENTS.GAME_LEAVE, { gameId });
      socket.off(SOCKET_EVENTS.GAME_MOVE);
      socket.off(SOCKET_EVENTS.GAME_ENDED);
      socket.off(SOCKET_EVENTS.GAME_DRAW_OFFER);
      socket.off(SOCKET_EVENTS.GAME_PRESENCE);
    };
  }, [gameId, addMove, setEnded, setDrawOffer, user?.id]);

  const sendMove = useCallback(
    (uci: string) => {
      const socket = connectSocket();
      socket.emit(SOCKET_EVENTS.GAME_MOVE, { gameId, uci });
    },
    [gameId],
  );

  const resign = useCallback(() => {
    const socket = connectSocket();
    socket.emit(SOCKET_EVENTS.GAME_RESIGN, { gameId });
  }, [gameId]);

  const offerDraw = useCallback(() => {
    const socket = connectSocket();
    socket.emit(SOCKET_EVENTS.GAME_DRAW_OFFER, { gameId });
  }, [gameId]);

  const respondDraw = useCallback(
    (accepted: boolean) => {
      const socket = connectSocket();
      socket.emit(SOCKET_EVENTS.GAME_DRAW_RESPOND, { gameId, accepted });
      setDrawOffer(false);
    },
    [gameId, setDrawOffer],
  );

  const sendChat = useCallback(
    (content: string) => {
      const socket = connectSocket();
      socket.emit(SOCKET_EVENTS.GAME_CHAT, { gameId, content });
    },
    [gameId],
  );

  // Determine if it's the current user's turn
  const chess = new Chess(currentFen);
  const isMyTurn =
    activeGame &&
    user &&
    ((chess.turn() === 'w' && activeGame.whitePlayerId === user.id) ||
      (chess.turn() === 'b' && activeGame.blackPlayerId === user.id));

  const playingAs =
    activeGame && user
      ? activeGame.whitePlayerId === user.id
        ? 'w'
        : 'b'
      : null;

  return {
    activeGame,
    moves,
    currentFen,
    result,
    drawOfferedByOpponent,
    isMyTurn,
    playingAs,
    opponentInRoom,
    sendMove,
    resign,
    offerDraw,
    respondDraw,
    sendChat,
  };
}
