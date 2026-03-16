import { useState, useCallback, useRef, useEffect } from 'react';
import supabase from '@/lib/supabaseClient.js';
import { trackEvent, trackError } from '@/lib/analytics.js';

const SAVE_DEBOUNCE_MS = 1500;
const LS_BOARDS_KEY = 'flyboard-boards';
const LS_BOARD_PREFIX = 'flyboard-board-';

/**
 * Compress Excalidraw scene data before saving to reduce DB storage.
 * Strips regenerable fields (versionNonce, seed) and default values.
 * Excalidraw regenerates these on load, so they're safe to remove.
 * Saves ~20-40% per board.
 */
function compressSceneData(scene) {
  if (!scene?.elements) return scene;
  return {
    ...scene,
    elements: scene.elements.map(el => {
      const c = { ...el };
      // Regenerable fields (Excalidraw creates new ones on load)
      delete c.versionNonce;
      delete c.seed;
      delete c.version;
      // Default values (Excalidraw applies these when missing)
      if (c.opacity === 100) delete c.opacity;
      if (c.angle === 0) delete c.angle;
      if (c.roughness === 1) delete c.roughness;
      if (c.strokeStyle === 'solid') delete c.strokeStyle;
      if (c.fillStyle === 'solid') delete c.fillStyle;
      if (c.strokeLinecap === 'round') delete c.strokeLinecap;
      if (c.roundness === null) delete c.roundness;
      if (c.isDeleted === false) delete c.isDeleted;
      if (c.locked === false) delete c.locked;
      if (c.link === null) delete c.link;
      if (c.groupIds?.length === 0) delete c.groupIds;
      if (c.boundElements === null || c.boundElements?.length === 0) delete c.boundElements;
      return c;
    }),
  };
}

/**
 * Helper: read boards metadata array from localStorage.
 */
function lsGetBoards() {
  try {
    const raw = localStorage.getItem(LS_BOARDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Helper: write boards metadata array to localStorage.
 */
function lsSetBoards(boards) {
  try {
    localStorage.setItem(LS_BOARDS_KEY, JSON.stringify(boards));
  } catch {
    // localStorage full or unavailable
  }
}

/**
 * Helper: read a single board (with scene_data) from localStorage.
 */
function lsGetBoard(id) {
  try {
    const raw = localStorage.getItem(`${LS_BOARD_PREFIX}${id}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Helper: write a single board (with scene_data) to localStorage.
 */
function lsSetBoard(id, boardData) {
  try {
    localStorage.setItem(`${LS_BOARD_PREFIX}${id}`, JSON.stringify(boardData));
  } catch {
    // localStorage full or unavailable
  }
}

/**
 * Helper: remove a single board from localStorage.
 */
function lsRemoveBoard(id) {
  try {
    localStorage.removeItem(`${LS_BOARD_PREFIX}${id}`);
  } catch {
    // ignore
  }
}

/**
 * Core board state management hook.
 * Handles Supabase CRUD, auto-save with debounce, and localStorage backup.
 * Falls back to localStorage-only mode when the Supabase boards table doesn't exist.
 */
export function useBoard() {
  const [boards, setBoards] = useState([]);
  const [folders, setFolders] = useState([]);
  const [activeBoard, setActiveBoard] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [draftConflict, setDraftConflict] = useState(null);

  const saveTimerRef = useRef(null);
  const sceneDataRef = useRef(null);
  const hasUnsavedChangesRef = useRef(false);
  const isLocalMode = useRef(false);
  const openingBoardIdRef = useRef(null); // re-entrancy guard for openBoard

  // Fetch all boards (metadata only, no scene_data)
  const fetchBoards = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('boards')
        .select('id, title, folder_id, position, is_favorite, template_id, updated_at, created_at')
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });

      if (err) throw err;
      isLocalMode.current = false;
      setBoards(data || []);
    } catch (err) {
      console.warn('Supabase boards table unavailable, switching to localStorage mode:', err.message);
      isLocalMode.current = true;
      const localBoards = lsGetBoards();
      setBoards(localBoards);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch all folders
  const fetchFolders = useCallback(async () => {
    if (isLocalMode.current) {
      setFolders([]);
      return [];
    }

    try {
      const { data, error: err } = await supabase
        .from('board_folders')
        .select('*')
        .order('position', { ascending: true });

      if (err) throw err;
      setFolders(data || []);
      return data || [];
    } catch (err) {
      console.warn('Failed to fetch folders, returning empty:', err.message);
      setFolders([]);
      return [];
    }
  }, []);

  // Initialize default folders for new users
  const initDefaults = useCallback(async () => {
    if (isLocalMode.current) return;

    try {
      const { error: err } = await supabase.rpc('init_flyboard_defaults', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
      });
      if (err) throw err;
      await fetchFolders();
    } catch (err) {
      console.error('Failed to init defaults:', err);
    }
  }, [fetchFolders]);

  // Open a specific board (loads full scene_data)
  const openBoard = useCallback(async (boardId) => {
    // Re-entrancy guard: skip if already opening this exact board
    if (openingBoardIdRef.current === boardId) return;
    openingBoardIdRef.current = boardId;

    try {
      if (isLocalMode.current) {
        const boardData = lsGetBoard(boardId);
        const meta = lsGetBoards().find(b => b.id === boardId);
        if (!boardData && !meta) {
          setError('Board not found');
          return;
        }
        const board = {
          ...(meta || {}),
          id: boardId,
          scene_data: boardData?.scene_data || { elements: [], appState: {} },
        };
        setActiveBoard(board);
        sceneDataRef.current = board.scene_data;
        hasUnsavedChangesRef.current = false;
        setLastSavedAt(board.updated_at ? new Date(board.updated_at) : new Date());
        setError(null);

        trackEvent('flyboard_board_opened', {
          board_id: boardId,
          template_id: board.template_id || null,
        });
        return;
      }

      const { data: board, error: err } = await supabase
        .from('boards')
        .select('*')
        .eq('id', boardId)
        .single();

      if (err) throw err;

      // Check for localStorage draft conflict
      const draftKey = `flyboard-draft-${boardId}`;
      const draft = localStorage.getItem(draftKey);

      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          if (parsed.timestamp > new Date(board.updated_at).getTime()) {
            setDraftConflict({ board, draft: parsed });
            return;
          }
        } catch {
          // Invalid draft, remove it
        }
        localStorage.removeItem(draftKey);
      }

      setActiveBoard(board);
      sceneDataRef.current = board.scene_data;
      hasUnsavedChangesRef.current = false;
      setLastSavedAt(new Date(board.updated_at));
      setError(null);

      trackEvent('flyboard_board_opened', {
        board_id: boardId,
        template_id: board.template_id || null,
      });
    } catch (err) {
      console.error('Failed to open board:', err);
      setError('Failed to open board');
    } finally {
      openingBoardIdRef.current = null;
    }
  }, []);

  // Resolve draft conflict
  const resolveDraftConflict = useCallback((useLocal) => {
    if (!draftConflict) return;

    const { board, draft } = draftConflict;

    if (useLocal) {
      const restoredBoard = { ...board, scene_data: draft.sceneData };
      setActiveBoard(restoredBoard);
      sceneDataRef.current = draft.sceneData;
      hasUnsavedChangesRef.current = true;
    } else {
      setActiveBoard(board);
      sceneDataRef.current = board.scene_data;
      hasUnsavedChangesRef.current = false;
      localStorage.removeItem(`flyboard-draft-${board.id}`);
    }

    setDraftConflict(null);
    setError(null);
  }, [draftConflict]);

  // Save board to Supabase (called by debounce timer)
  const saveToSupabase = useCallback(async (boardId) => {
    if (!sceneDataRef.current) return;
    if (isLocalMode.current) return;

    setIsSaving(true);
    const startTime = Date.now();

    try {
      const { error: err } = await supabase
        .from('boards')
        .update({ scene_data: compressSceneData(sceneDataRef.current) })
        .eq('id', boardId);

      if (err) throw err;

      const now = new Date();
      setLastSavedAt(now);
      hasUnsavedChangesRef.current = false;
      localStorage.removeItem(`flyboard-draft-${boardId}`);

      // Update board in list
      setBoards(prev => prev.map(b =>
        b.id === boardId ? { ...b, updated_at: now.toISOString() } : b
      ));

      trackEvent('flyboard_board_saved', {
        board_id: boardId,
        element_count: sceneDataRef.current.elements?.length || 0,
        save_duration_ms: Date.now() - startTime,
      });
    } catch (err) {
      console.error('Failed to save board:', err);
      setError('Failed to save. Your work is backed up locally.');
      trackError('flyboard_save_failed');
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Handle scene changes (debounced save)
  const handleSceneChange = useCallback((sceneData, boardId) => {
    if (!boardId) return;

    sceneDataRef.current = sceneData;
    hasUnsavedChangesRef.current = true;

    if (isLocalMode.current) {
      // In local mode, save scene_data directly to localStorage
      const boardData = lsGetBoard(boardId) || {};
      lsSetBoard(boardId, { ...boardData, scene_data: sceneData });

      const now = new Date();
      setLastSavedAt(now);
      hasUnsavedChangesRef.current = false;

      // Update updated_at in boards list
      const allBoards = lsGetBoards();
      const updated = allBoards.map(b =>
        b.id === boardId ? { ...b, updated_at: now.toISOString() } : b
      );
      lsSetBoards(updated);
      setBoards(updated);
      return;
    }

    // Immediate localStorage backup (Supabase mode)
    try {
      localStorage.setItem(`flyboard-draft-${boardId}`, JSON.stringify({
        sceneData,
        timestamp: Date.now(),
      }));
    } catch {
      // localStorage full or unavailable
    }

    // Debounced Supabase save
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      saveToSupabase(boardId);
    }, SAVE_DEBOUNCE_MS);
  }, [saveToSupabase]);

  // Create a new board
  const createBoard = useCallback(async ({ title = 'Untitled Board', folderId = null, templateId = null, sceneData = null } = {}) => {
    const defaultScene = sceneData || { elements: [], appState: {} };

    if (isLocalMode.current) {
      const now = new Date().toISOString();
      const newBoard = {
        id: crypto.randomUUID(),
        title,
        folder_id: folderId,
        position: 0,
        is_favorite: false,
        template_id: templateId,
        updated_at: now,
        created_at: now,
      };

      // Save metadata to boards list
      const allBoards = lsGetBoards();
      lsSetBoards([newBoard, ...allBoards]);

      // Save full board data
      lsSetBoard(newBoard.id, { ...newBoard, scene_data: defaultScene });

      setBoards(prev => [newBoard, ...prev]);

      trackEvent('flyboard_board_created', {
        board_id: newBoard.id,
        template_id: templateId,
      });

      return newBoard;
    }

    try {
      const { data, error: err } = await supabase
        .from('boards')
        .insert({
          title,
          folder_id: folderId,
          template_id: templateId,
          scene_data: compressSceneData(defaultScene),
          position: 0,
        })
        .select('id, title, folder_id, position, is_favorite, template_id, updated_at, created_at')
        .single();

      if (err) throw err;

      setBoards(prev => [data, ...prev]);

      trackEvent('flyboard_board_created', {
        board_id: data.id,
        template_id: templateId,
      });

      return data;
    } catch (err) {
      console.error('Failed to create board:', err);
      setError('Failed to create board');
      return null;
    }
  }, []);

  // Update board title
  const updateBoardTitle = useCallback(async (boardId, title) => {
    const trimmed = title.trim() || 'Untitled Board';

    if (isLocalMode.current) {
      const allBoards = lsGetBoards();
      const updated = allBoards.map(b => b.id === boardId ? { ...b, title: trimmed } : b);
      lsSetBoards(updated);
      setBoards(prev => prev.map(b => b.id === boardId ? { ...b, title: trimmed } : b));
      if (activeBoard?.id === boardId) {
        setActiveBoard(prev => prev ? { ...prev, title: trimmed } : prev);
      }

      // Also update full board data if it exists
      const boardData = lsGetBoard(boardId);
      if (boardData) {
        lsSetBoard(boardId, { ...boardData, title: trimmed });
      }
      return;
    }

    try {
      const { error: err } = await supabase
        .from('boards')
        .update({ title: trimmed })
        .eq('id', boardId);

      if (err) throw err;

      setBoards(prev => prev.map(b => b.id === boardId ? { ...b, title: trimmed } : b));
      if (activeBoard?.id === boardId) {
        setActiveBoard(prev => prev ? { ...prev, title: trimmed } : prev);
      }
    } catch (err) {
      console.error('Failed to update title:', err);
    }
  }, [activeBoard]);

  // Soft delete a board
  const deleteBoard = useCallback(async (boardId) => {
    if (isLocalMode.current) {
      const allBoards = lsGetBoards();
      lsSetBoards(allBoards.filter(b => b.id !== boardId));
      lsRemoveBoard(boardId);

      setBoards(prev => prev.filter(b => b.id !== boardId));
      if (activeBoard?.id === boardId) {
        setActiveBoard(null);
        sceneDataRef.current = null;
      }

      trackEvent('flyboard_board_deleted', { board_id: boardId });
      return;
    }

    try {
      const { error: err } = await supabase
        .from('boards')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', boardId);

      if (err) throw err;

      setBoards(prev => prev.filter(b => b.id !== boardId));
      if (activeBoard?.id === boardId) {
        setActiveBoard(null);
        sceneDataRef.current = null;
      }
      localStorage.removeItem(`flyboard-draft-${boardId}`);

      trackEvent('flyboard_board_deleted', { board_id: boardId });
    } catch (err) {
      console.error('Failed to delete board:', err);
      setError('Failed to delete board');
    }
  }, [activeBoard]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (boardId) => {
    const board = boards.find(b => b.id === boardId);
    if (!board) return;

    const newValue = !board.is_favorite;

    if (isLocalMode.current) {
      const allBoards = lsGetBoards();
      lsSetBoards(allBoards.map(b => b.id === boardId ? { ...b, is_favorite: newValue } : b));
      setBoards(prev => prev.map(b => b.id === boardId ? { ...b, is_favorite: newValue } : b));

      trackEvent('flyboard_favorite_toggled', { board_id: boardId, is_favorite: newValue });
      return;
    }

    try {
      const { error: err } = await supabase
        .from('boards')
        .update({ is_favorite: newValue })
        .eq('id', boardId);

      if (err) throw err;

      setBoards(prev => prev.map(b => b.id === boardId ? { ...b, is_favorite: newValue } : b));

      trackEvent('flyboard_favorite_toggled', { board_id: boardId, is_favorite: newValue });
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  }, [boards]);

  // Folder CRUD
  const createFolder = useCallback(async (name, parentId = null) => {
    if (isLocalMode.current) return null;

    try {
      const maxPosition = folders.length;
      const { data, error: err } = await supabase
        .from('board_folders')
        .insert({ name, parent_id: parentId, position: maxPosition })
        .select()
        .single();

      if (err) throw err;
      setFolders(prev => [...prev, data]);

      trackEvent('flyboard_folder_created', { folder_id: data.id, folder_name: name });
      return data;
    } catch (err) {
      console.error('Failed to create folder:', err);
      return null;
    }
  }, [folders]);

  const renameFolder = useCallback(async (folderId, name) => {
    if (isLocalMode.current) return;

    try {
      const { error: err } = await supabase
        .from('board_folders')
        .update({ name })
        .eq('id', folderId);

      if (err) throw err;
      setFolders(prev => prev.map(f => f.id === folderId ? { ...f, name } : f));
    } catch (err) {
      console.error('Failed to rename folder:', err);
    }
  }, []);

  const deleteFolder = useCallback(async (folderId) => {
    if (isLocalMode.current) return;

    try {
      const { error: err } = await supabase
        .from('board_folders')
        .delete()
        .eq('id', folderId);

      if (err) throw err;
      setFolders(prev => prev.filter(f => f.id !== folderId));
      // Boards in this folder become unfiled (ON DELETE SET NULL in DB)
      setBoards(prev => prev.map(b => b.folder_id === folderId ? { ...b, folder_id: null } : b));

      trackEvent('flyboard_folder_deleted', { folder_id: folderId });
    } catch (err) {
      console.error('Failed to delete folder:', err);
    }
  }, []);

  // Move board to folder
  const moveBoard = useCallback(async (boardId, folderId) => {
    if (isLocalMode.current) {
      const allBoards = lsGetBoards();
      lsSetBoards(allBoards.map(b => b.id === boardId ? { ...b, folder_id: folderId } : b));
      setBoards(prev => prev.map(b => b.id === boardId ? { ...b, folder_id: folderId } : b));
      return;
    }

    const oldFolderId = boards.find(b => b.id === boardId)?.folder_id;
    try {
      const { error: err } = await supabase.rpc('move_board', {
        p_board_id: boardId,
        p_folder_id: folderId,
      });

      if (err) throw err;
      setBoards(prev => prev.map(b => b.id === boardId ? { ...b, folder_id: folderId } : b));

      trackEvent('flyboard_board_moved', {
        board_id: boardId,
        from_folder_id: oldFolderId,
        to_folder_id: folderId,
      });
    } catch (err) {
      console.error('Failed to move board:', err);
    }
  }, [boards]);

  // Page unload protection
  useEffect(() => {
    const handler = (e) => {
      if (hasUnsavedChangesRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // Interval autosave: flush unsaved changes every 5 seconds
  const activeBoardIdRef = useRef(null);
  useEffect(() => {
    activeBoardIdRef.current = activeBoard?.id || null;
  }, [activeBoard?.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      const boardId = activeBoardIdRef.current;
      if (boardId && hasUnsavedChangesRef.current && sceneDataRef.current) {
        saveToSupabase(boardId);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [saveToSupabase]);

  // Cleanup save timer on unmount + flush final save
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      // Flush unsaved changes on unmount
      const boardId = activeBoardIdRef.current;
      if (boardId && hasUnsavedChangesRef.current && sceneDataRef.current) {
        saveToSupabase(boardId);
      }
    };
  }, [saveToSupabase]);

  return {
    boards,
    folders,
    activeBoard,
    isSaving,
    lastSavedAt,
    isLoading,
    error,
    draftConflict,
    fetchBoards,
    fetchFolders,
    initDefaults,
    openBoard,
    resolveDraftConflict,
    handleSceneChange,
    createBoard,
    updateBoardTitle,
    deleteBoard,
    toggleFavorite,
    createFolder,
    renameFolder,
    deleteFolder,
    moveBoard,
    setActiveBoard,
    setError,
  };
}
