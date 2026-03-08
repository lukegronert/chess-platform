'use client';

import type { GameMove } from '@chess/shared';
import { cn } from '@/lib/utils';

interface MoveHistoryProps {
  moves: GameMove[];
  selectedMoveIndex?: number;
  onSelectMove?: (index: number) => void;
}

export function MoveHistory({ moves, selectedMoveIndex, onSelectMove }: MoveHistoryProps) {
  // Group moves into pairs (white, black)
  const movePairs: Array<{ white: GameMove; black?: GameMove }> = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({ white: moves[i], black: moves[i + 1] });
  }

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-sm font-semibold text-gray-600 mb-2 px-2">Moves</h3>
      <div className="flex-1 overflow-y-auto">
        {movePairs.map((pair, idx) => (
          <div key={idx} className="flex items-center px-2 py-0.5 hover:bg-gray-50">
            <span className="text-gray-400 text-sm w-6 shrink-0">{idx + 1}.</span>
            <button
              onClick={() => onSelectMove?.(idx * 2)}
              className={cn(
                'px-2 py-0.5 rounded text-sm font-mono transition-colors',
                selectedMoveIndex === idx * 2
                  ? 'bg-blue-100 text-blue-800'
                  : 'hover:bg-gray-100',
              )}
            >
              {pair.white.san}
            </button>
            {pair.black && (
              <button
                onClick={() => onSelectMove?.(idx * 2 + 1)}
                className={cn(
                  'px-2 py-0.5 rounded text-sm font-mono transition-colors ml-1',
                  selectedMoveIndex === idx * 2 + 1
                    ? 'bg-blue-100 text-blue-800'
                    : 'hover:bg-gray-100',
                )}
              >
                {pair.black.san}
              </button>
            )}
          </div>
        ))}
        {moves.length === 0 && (
          <p className="text-gray-400 text-sm px-2">No moves yet</p>
        )}
      </div>
    </div>
  );
}
