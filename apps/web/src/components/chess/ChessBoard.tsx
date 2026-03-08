'use client';

import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useMemo } from 'react';

interface ChessBoardProps {
  fen: string;
  orientation?: 'white' | 'black';
  onMove?: (uci: string) => void;
  isMyTurn?: boolean;
  disabled?: boolean;
}

export function ChessBoard({ fen, orientation = 'white', onMove, isMyTurn = false, disabled = false }: ChessBoardProps) {
  const chess = useMemo(() => {
    try {
      return new Chess(fen);
    } catch {
      return new Chess();
    }
  }, [fen]);

  function onPieceDrop(sourceSquare: string, targetSquare: string, piece: string): boolean {
    if (!isMyTurn || disabled || !onMove) return false;

    // Detect pawn promotion
    const isPromotion =
      piece[1] === 'P' &&
      ((piece[0] === 'w' && targetSquare[1] === '8') ||
        (piece[0] === 'b' && targetSquare[1] === '1'));

    const uci = `${sourceSquare}${targetSquare}${isPromotion ? 'q' : ''}`;

    // Client-side validation for immediate feedback
    const move = chess.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: isPromotion ? 'q' : undefined,
    });

    if (!move) return false;

    onMove(uci);
    return true;
  }

  return (
    <Chessboard
      position={fen}
      boardOrientation={orientation}
      onPieceDrop={onPieceDrop}
      arePiecesDraggable={isMyTurn && !disabled}
      customBoardStyle={{
        borderRadius: '4px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
      }}
      customDarkSquareStyle={{ backgroundColor: '#b58863' }}
      customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
    />
  );
}
