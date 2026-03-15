import React, { createContext, useContext, useMemo, useRef, useState, useCallback } from 'react';
import { useBoard } from '@/hooks/useBoard.js';

const BoardContext = createContext();

export const useBoardContext = () => {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoardContext must be used within BoardProvider');
  }
  return context;
};

export const BoardProvider = ({ children }) => {
  const hasInitializedRef = useRef(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const board = useBoard();

  // Lazy init: only fetch boards/folders when a board route is visited.
  // Resilient to missing Supabase tables: folders are optional,
  // boards will fall back to localStorage via useBoard.
  const initBoard = useCallback(async () => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    // Folders are optional. If the table doesn't exist, just skip.
    try {
      await board.fetchFolders();
    } catch (err) {
      console.warn('Board folders unavailable, skipping:', err);
    }

    // Always attempt to fetch boards (useBoard handles fallback).
    await board.fetchBoards();
    setIsInitialized(true);
  }, [board.fetchFolders, board.fetchBoards]);

  const value = useMemo(() => ({
    ...board,
    initBoard,
    isInitialized,
  }), [board, initBoard, isInitialized]);

  return (
    <BoardContext.Provider value={value}>
      {children}
    </BoardContext.Provider>
  );
};
