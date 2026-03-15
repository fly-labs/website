import React, { createContext, useContext, useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { useBoard } from '@/hooks/useBoard.js';
import { buildExcalidrawElements } from '@/lib/boardBridge.js';

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

  // Canvas ref for FlyBot integration
  const canvasRef = useRef(null);
  const [lastBoardAction, setLastBoardAction] = useState(null);

  const registerCanvas = useCallback((ref) => {
    canvasRef.current = ref;
  }, []);

  const getCanvasRef = useCallback(() => canvasRef.current, []);

  // Listen for FlyBot board actions via CustomEvent bridge
  useEffect(() => {
    const handleBoardAction = (e) => {
      const action = e.detail;
      if (!action?.action) return;

      const canvas = canvasRef.current;

      if (action.action === 'add_elements' && action.elements) {
        if (!canvas) return;
        const newElements = buildExcalidrawElements(action.elements);
        if (newElements.length === 0) return;
        const existing = canvas.getSceneElements?.() || [];
        canvas.updateScene?.({ elements: [...existing, ...newElements] });
        setLastBoardAction({ type: 'add_elements', count: newElements.length });
      } else if (action.action === 'clear') {
        if (!canvas) return;
        canvas.updateScene?.({ elements: [] });
        setLastBoardAction({ type: 'clear' });
      } else if (action.action === 'load_template') {
        // Template loading is handled by FlyBoardPage (needs access to template data + board creation)
        setLastBoardAction({ type: 'load_template', template: action.template });
      }
    };

    window.addEventListener('flybot-board-action', handleBoardAction);
    return () => window.removeEventListener('flybot-board-action', handleBoardAction);
  }, []);

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
    registerCanvas,
    getCanvasRef,
    lastBoardAction,
  }), [board, initBoard, isInitialized, registerCanvas, getCanvasRef, lastBoardAction]);

  return (
    <BoardContext.Provider value={value}>
      {children}
    </BoardContext.Provider>
  );
};
