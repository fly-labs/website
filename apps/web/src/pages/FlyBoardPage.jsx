import React, { useEffect, useState, useCallback, useRef, useMemo, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Menu, Plus, Loader2, Grid3x3, ChevronDown,
  Sun, Moon, Palette, Download, LayoutTemplate, Eye, EyeOff,
  Maximize2, Minimize2, PanelLeftClose, PanelLeft,
  Undo2, Redo2, ZoomIn, ZoomOut, PenTool, MousePointer2,
  Square, Circle, ArrowRight, Minus, TypeIcon, Eraser, Hand,
  SlidersHorizontal, Star, Search, MoreHorizontal, Copy, Trash2,
  FolderPlus, Folder, FolderOpen, ChevronRight,
} from 'lucide-react';
import { SEO } from '@/components/SEO.jsx';
import Header from '@/components/Header.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useTheme } from '@/contexts/ThemeContext.jsx';
import { useBoardContext } from '@/contexts/BoardContext.jsx';
import { trackEvent } from '@/lib/analytics.js';

const ExcalidrawCanvas = lazy(() => import('@/components/board/ExcalidrawCanvas.jsx'));
const ExportMenu = lazy(() => import('@/components/board/ExportMenu.jsx'));
const TemplatePicker = lazy(() => import('@/components/board/TemplatePicker.jsx'));

// Grid style options (visibility controlled by Eye button, not a "blank" option)
const GRID_OPTIONS = [
  { id: 'dot', label: 'Dot Grid', icon: '⠿' },
  { id: 'ruled', label: 'Ruled', icon: '☰' },
  { id: 'square', label: 'Square', icon: '▦' },
  { id: 'iso', label: 'Isometric', icon: '◇' },
];

// Background color presets (default follows site theme: dark = near-black, light = white)
const BG_PRESETS = [
  { id: 'default', label: 'Default', dark: '#141414', light: '#ffffff', swatch: { dark: '#141414', light: '#ffffff' } },
  { id: 'chalkboard', label: 'Chalkboard', dark: '#1a3a2a', light: '#faf8f5', swatch: { dark: '#1a3a2a', light: '#faf8f5' } },
  { id: 'blackboard', label: 'Blackboard', dark: '#1a1a2e', light: '#f5f5fa', swatch: { dark: '#1a1a2e', light: '#f5f5fa' } },
  { id: 'slate', label: 'Slate', dark: '#1e293b', light: '#f1f5f9', swatch: { dark: '#1e293b', light: '#f1f5f9' } },
  { id: 'warm', label: 'Warm Paper', dark: '#2a2218', light: '#faf8f5', swatch: { dark: '#2a2218', light: '#faf8f5' } },
];

// Font options grouped by use case (Excalidraw built-in font IDs)
const FONT_OPTIONS = [
  // Handwritten
  { id: 1, label: 'Virgil', desc: 'Notes & sketches', category: 'Handwritten' },
  { id: 7, label: 'Comic Shanns', desc: 'Fun & playful', category: 'Handwritten' },
  { id: 4, label: 'Excalifont', desc: 'Loose doodles', category: 'Handwritten' },
  // Clean
  { id: 5, label: 'Nunito', desc: 'Thumbnails & slides', category: 'Clean' },
  { id: 6, label: 'Lilita One', desc: 'Bold titles & X posts', category: 'Clean' },
  { id: 2, label: 'Helvetica', desc: 'Professional exports', category: 'Clean' },
  // Code
  { id: 3, label: 'Cascadia', desc: 'Code & tech', category: 'Code' },
];

// Stroke/text color presets
const STROKE_COLORS = [
  { id: 'auto', label: 'Auto', hex: null },
  { id: 'white', label: 'White', hex: '#e8e4df' },
  { id: 'black', label: 'Black', hex: '#1e1e1e' },
  { id: 'red', label: 'Red', hex: '#e03131' },
  { id: 'orange', label: 'Orange', hex: '#e8590c' },
  { id: 'yellow', label: 'Yellow', hex: '#ffd43b' },
  { id: 'green', label: 'Green', hex: '#2f9e44' },
  { id: 'blue', label: 'Blue', hex: '#1971c2' },
  { id: 'purple', label: 'Purple', hex: '#7048e8' },
  { id: 'pink', label: 'Pink', hex: '#e64980' },
];

// Font size steps for text elements
const FONT_SIZES = [12, 16, 20, 24, 28, 36, 48, 64, 80];

// Quick-access symbols organized by category
const SYMBOL_GROUPS = [
  { label: 'Math', symbols: ['=', '+', '-', '\u00D7', '\u00F7', '\u00B1', '\u2260', '\u2248', '\u2264', '\u2265', '\u221E', '\u221A', '\u03C0', '\u2211', '\u222B', '\u2202', '\u0394', '\u03B1', '\u03B2', '\u03B8', '\u03BB', '\u03BC', '\u03C3', '\u2200', '\u2203'] },
  { label: 'Arrows', symbols: ['\u2190', '\u2192', '\u2191', '\u2193', '\u2194', '\u2195', '\u21D2', '\u21D0', '\u21D4', '\u2197', '\u2198', '\u21BA'] },
  { label: 'Code', symbols: ['{', '}', '[', ']', '<', '>', '/', '\\', '|', '&', '#', '@', '$', '%', '^', '~', '`', '_'] },
  { label: 'Logic', symbols: ['\u2227', '\u2228', '\u00AC', '\u2295', '\u2297', '\u2282', '\u2283', '\u2208', '\u2209', '\u2205', '\u222A', '\u2229'] },
  { label: 'Misc', symbols: ['\u2022', '\u2713', '\u2717', '\u2605', '\u2606', '\u2764', '\u266A', '\u00A9', '\u00AE', '\u2122', '\u00B0', '\u20AC', '\u00A3', '\u00A5'] },
];

// Popular emojis for quick access
const EMOJI_GROUPS = [
  { label: 'Faces', emojis: ['\uD83D\uDE00', '\uD83D\uDE02', '\uD83D\uDE0D', '\uD83E\uDD14', '\uD83D\uDE31', '\uD83D\uDE0E', '\uD83E\uDD29', '\uD83E\uDD2F', '\uD83D\uDE4C', '\uD83D\uDC4D', '\uD83D\uDC4E', '\uD83D\uDC4F'] },
  { label: 'Objects', emojis: ['\uD83D\uDCA1', '\uD83D\uDD25', '\uD83D\uDE80', '\u2705', '\u274C', '\u26A0\uFE0F', '\uD83D\uDCCC', '\uD83C\uDFAF', '\uD83D\uDCCA', '\uD83D\uDCDD', '\uD83D\uDCBB', '\uD83D\uDD11'] },
  { label: 'Nature', emojis: ['\u2B50', '\u2764\uFE0F', '\uD83C\uDF1F', '\u26A1', '\uD83C\uDF08', '\uD83C\uDF89', '\uD83C\uDF31', '\uD83C\uDF0D', '\u2600\uFE0F', '\u2601\uFE0F', '\uD83C\uDF19', '\uD83D\uDD2E'] },
];

// Auto-contrast helper (same logic as ExcalidrawCanvas)
function getContrastStroke(bgHex) {
  if (!bgHex || bgHex === 'transparent') return '#e8e4df';
  try {
    const r = parseInt(bgHex.slice(1, 3), 16);
    const g = parseInt(bgHex.slice(3, 5), 16);
    const b = parseInt(bgHex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#1e1e1e' : '#e8e4df';
  } catch {
    return '#e8e4df';
  }
}

// Guest board limit (module-level constant)
const GUEST_BOARD_LIMIT = 1;

// Drawing tools mapped to Excalidraw's setActiveTool types
const DRAW_TOOLS = [
  { id: 'selection', label: 'Select (V)', icon: MousePointer2, shortcut: 'V' },
  { id: 'rectangle', label: 'Rectangle (R)', icon: Square, shortcut: 'R' },
  { id: 'ellipse', label: 'Ellipse (O)', icon: Circle, shortcut: 'O' },
  { id: 'arrow', label: 'Arrow (A)', icon: ArrowRight, shortcut: 'A' },
  { id: 'line', label: 'Line (L)', icon: Minus, shortcut: 'L' },
  { id: 'freedraw', label: 'Pencil (P)', icon: PenTool, shortcut: 'P' },
  { id: 'text', label: 'Text (T)', icon: TypeIcon, shortcut: 'T' },
  { id: 'eraser', label: 'Eraser (E)', icon: Eraser, shortcut: 'E' },
  { id: 'hand', label: 'Pan (H)', icon: Hand, shortcut: 'H' },
];

/**
 * FlyBoardPage: full-screen whiteboard with toolbar, sidebar, templates, and exports.
 * Dark mode = Bart Simpson chalkboard
 * Light mode = Moleskine/Leuchtturm1917 notebook
 */
export default function FlyBoardPage() {
  const { currentUser, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const {
    boards, folders, activeBoard, isSaving, lastSavedAt,
    isLoading, error, initBoard, isInitialized, openBoard, createBoard,
    deleteBoard, updateBoardTitle, handleSceneChange, setError,
    toggleFavorite, createFolder, renameFolder, deleteFolder, moveBoard,
  } = useBoardContext();

  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const stored = localStorage.getItem('flyboard-sidebar');
    if (stored !== null) return stored === 'true';
    // Default: open on desktop (900px+), closed on mobile/tablet
    return window.innerWidth >= 900;
  });
  const excalidrawRef = useRef(null);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Toast notification state (replaces ugly red error banner)
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  // Toolbar state (all persisted to localStorage)
  const [gridStyle, setGridStyle] = useState(() => {
    const stored = localStorage.getItem('flyboard-grid-style');
    // 'blank' was removed; visibility is controlled by the Eye toggle
    if (!stored || stored === 'blank') return 'dot';
    return stored;
  });
  const [gridVisible, setGridVisible] = useState(() => localStorage.getItem('flyboard-grid-visible') !== 'false');
  const [bgPreset, setBgPreset] = useState(() => localStorage.getItem('flyboard-bg-preset') || 'default');
  const [fontFamily, setFontFamily] = useState(() => parseInt(localStorage.getItem('flyboard-font') || '1', 10));

  // Stroke/text color state ('auto' = auto-contrast, or a hex color)
  const [strokeColorMode, setStrokeColorMode] = useState(() => localStorage.getItem('flyboard-stroke-color') || 'auto');

  // Dropdown states
  const [gridMenuOpen, setGridMenuOpen] = useState(false);
  const [bgMenuOpen, setBgMenuOpen] = useState(false);
  const [fontMenuOpen, setFontMenuOpen] = useState(false);
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [symbolMenuOpen, setSymbolMenuOpen] = useState(false);
  const [emojiMenuOpen, setEmojiMenuOpen] = useState(false);

  // Excalidraw native UI visibility (hidden by default for clean look)
  const [showExcalidrawUI, setShowExcalidrawUI] = useState(() => localStorage.getItem('flyboard-excalidraw-ui') === 'true');
  // Active drawing tool
  const [activeTool, setActiveTool] = useState('selection');

  // Modal states
  const [exportOpen, setExportOpen] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);

  // Save status fade
  const [showSaved, setShowSaved] = useState(false);
  const savedTimerRef = useRef(null);

  // Sidebar enhanced state
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [boardContextMenu, setBoardContextMenu] = useState(null); // { boardId, x, y }
  const [renamingBoardId, setRenamingBoardId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState(() => {
    try { return JSON.parse(localStorage.getItem('flyboard-expanded-folders') || '{}'); } catch { return {}; }
  });
  const [renamingFolderId, setRenamingFolderId] = useState(null);
  const [renameFolderValue, setRenameFolderValue] = useState('');
  const [folderContextMenu, setFolderContextMenu] = useState(null); // { folderId, x, y }
  const [movingBoardId, setMovingBoardId] = useState(null); // board being moved to a folder
  const contextMenuRef = useRef(null);
  const folderContextMenuRef = useRef(null);

  // Persist expanded folders
  useEffect(() => {
    localStorage.setItem('flyboard-expanded-folders', JSON.stringify(expandedFolders));
  }, [expandedFolders]);

  // Computed: filtered and grouped boards
  const filteredBoards = useMemo(() => {
    const search = sidebarSearch.toLowerCase().trim();
    const all = search ? boards.filter(b => b.title.toLowerCase().includes(search)) : boards;
    const favorites = all.filter(b => b.is_favorite).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    const regular = all.filter(b => !b.is_favorite).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    return { favorites, regular, total: all.length };
  }, [boards, sidebarSearch]);

  // Group regular boards by folder
  const boardsByFolder = useMemo(() => {
    const grouped = { unfiled: [] };
    folders.forEach(f => { grouped[f.id] = []; });
    filteredBoards.regular.forEach(b => {
      if (b.folder_id && grouped[b.folder_id]) {
        grouped[b.folder_id].push(b);
      } else {
        grouped.unfiled.push(b);
      }
    });
    return grouped;
  }, [filteredBoards.regular, folders]);

  // Refs for outside-click
  const gridMenuRef = useRef(null);
  const bgMenuRef = useRef(null);
  const fontMenuRef = useRef(null);
  const colorMenuRef = useRef(null);
  const symbolMenuRef = useRef(null);
  const emojiMenuRef = useRef(null);

  // Compute resolved background color from preset
  const resolvedBgColor = (() => {
    const preset = BG_PRESETS.find(p => p.id === bgPreset) || BG_PRESETS[0];
    return isDark ? preset.dark : preset.light;
  })();

  // Compute resolved stroke color (auto-contrast or manual override)
  const resolvedStrokeColor = strokeColorMode === 'auto'
    ? getContrastStroke(resolvedBgColor)
    : (STROKE_COLORS.find(c => c.id === strokeColorMode)?.hex || getContrastStroke(resolvedBgColor));

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem('flyboard-sidebar', String(sidebarOpen));
  }, [sidebarOpen]);

  // Auto-collapse sidebar on medium widths to prevent toolbar overflow
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 900 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  // Close dropdowns and context menus on outside click
  useEffect(() => {
    if (!gridMenuOpen && !bgMenuOpen && !fontMenuOpen && !colorMenuOpen && !symbolMenuOpen && !emojiMenuOpen && !boardContextMenu && !folderContextMenu) return;
    const handler = (e) => {
      if (gridMenuOpen && gridMenuRef.current && !gridMenuRef.current.contains(e.target)) setGridMenuOpen(false);
      if (bgMenuOpen && bgMenuRef.current && !bgMenuRef.current.contains(e.target)) setBgMenuOpen(false);
      if (colorMenuOpen && colorMenuRef.current && !colorMenuRef.current.contains(e.target)) setColorMenuOpen(false);
      if (fontMenuOpen && fontMenuRef.current && !fontMenuRef.current.contains(e.target)) setFontMenuOpen(false);
      if (symbolMenuOpen && symbolMenuRef.current && !symbolMenuRef.current.contains(e.target)) setSymbolMenuOpen(false);
      if (emojiMenuOpen && emojiMenuRef.current && !emojiMenuRef.current.contains(e.target)) setEmojiMenuOpen(false);
      if (boardContextMenu && contextMenuRef.current && !contextMenuRef.current.contains(e.target)) setBoardContextMenu(null);
      if (folderContextMenu && folderContextMenuRef.current && !folderContextMenuRef.current.contains(e.target)) setFolderContextMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [gridMenuOpen, bgMenuOpen, fontMenuOpen, colorMenuOpen, symbolMenuOpen, emojiMenuOpen, boardContextMenu, folderContextMenu]);

  // Init board context on mount (guests get localStorage mode automatically)
  useEffect(() => {
    initBoard();
  }, [initBoard]);

  // Track programmatic URL updates to avoid re-triggering openBoard
  const programmaticUrlRef = useRef(false);

  // Sync URL param with active board (wait for initialization to complete to avoid race condition)
  useEffect(() => {
    if (!isInitialized) return;
    // Skip if we just programmatically set the URL
    if (programmaticUrlRef.current) {
      programmaticUrlRef.current = false;
      return;
    }
    const boardId = searchParams.get('b');
    if (boardId && boardId !== activeBoard?.id) openBoard(boardId);
  }, [searchParams, activeBoard?.id, openBoard, isInitialized]);

  useEffect(() => {
    if (activeBoard?.id) {
      programmaticUrlRef.current = true;
      setSearchParams({ b: activeBoard.id }, { replace: true });
    }
  }, [activeBoard?.id, setSearchParams]);

  // Fullscreen API integration
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // F11 keyboard shortcut for fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Show toast for errors (auto-dismiss in 3s)
  useEffect(() => {
    if (error) {
      setToast(error);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        setToast(null);
        setError(null);
      }, 3000);
    }
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [error, setError]);

  // Track save status transitions for "Saved" fade
  const prevIsSavingRef = useRef(isSaving);
  useEffect(() => {
    if (prevIsSavingRef.current && !isSaving && lastSavedAt) {
      setShowSaved(true);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setShowSaved(false), 2000);
    }
    prevIsSavingRef.current = isSaving;
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, [isSaving, lastSavedAt]);

  // Smart auto-contrast: when theme changes and we're in auto mode, recolor existing elements
  const prevStrokeRef = useRef(resolvedStrokeColor);
  useEffect(() => {
    const prev = prevStrokeRef.current;
    prevStrokeRef.current = resolvedStrokeColor;
    if (strokeColorMode !== 'auto' || prev === resolvedStrokeColor) return;

    const api = excalidrawRef.current?.getAPI?.() || excalidrawRef.current;
    if (!api?.getSceneElements) return;

    const elements = api.getSceneElements();
    const updated = elements.map(el => {
      // Recolor elements that were using the old auto-contrast color
      if (el.strokeColor === prev || el.strokeColor === '#e8e4df' || el.strokeColor === '#1e1e1e') {
        return { ...el, strokeColor: resolvedStrokeColor };
      }
      return el;
    });
    api.updateScene({ elements: updated });
  }, [resolvedStrokeColor, strokeColorMode]);

  // Scene change handler (works for both authenticated and guest/localStorage mode)
  const onSceneChange = useCallback((sceneData) => {
    if (activeBoard?.id) handleSceneChange(sceneData, activeBoard.id);
  }, [activeBoard?.id, handleSceneChange]);

  // Board creation (respects guest limit)
  const handleNewBoard = useCallback(async () => {
    if (!isAuthenticated && boards.length >= GUEST_BOARD_LIMIT) {
      setToast('Sign in to create more boards');
      return;
    }
    const board = await createBoard({ title: 'Untitled Board' });
    if (board) await openBoard(board.id);
  }, [isAuthenticated, boards.length, createBoard, openBoard]);

  // Template selection (guests can't use templates)
  const handleTemplateSelect = useCallback(async (template) => {
    if (!isAuthenticated) {
      setToast('Sign in to use templates');
      return;
    }
    const board = await createBoard({
      title: template.title,
      templateId: template.id,
      sceneData: template.sceneData,
    });
    if (board) {
      setTemplatePickerOpen(false);
      await openBoard(board.id);
    }
    trackEvent('flyboard_template_used', { template_id: template.id, template_title: template.title });
  }, [isAuthenticated, createBoard, openBoard]);

  // Toolbar handlers
  const handleGridStyleChange = useCallback((style) => {
    setGridStyle(style);
    localStorage.setItem('flyboard-grid-style', style);
    setGridMenuOpen(false);
    trackEvent('flyboard_grid_changed', { grid_style: style });
  }, []);

  const handleGridToggle = useCallback(() => {
    setGridVisible(prev => {
      const next = !prev;
      localStorage.setItem('flyboard-grid-visible', String(next));
      return next;
    });
  }, []);

  const handleBgChange = useCallback((presetId) => {
    setBgPreset(presetId);
    localStorage.setItem('flyboard-bg-preset', presetId);
    setBgMenuOpen(false);

    // Smart auto-contrast: when in auto mode, update ALL existing elements to match new background
    if (strokeColorMode === 'auto') {
      const preset = BG_PRESETS.find(p => p.id === presetId) || BG_PRESETS[0];
      const newBg = isDark ? preset.dark : preset.light;
      const newStroke = getContrastStroke(newBg);
      const api = excalidrawRef.current?.getAPI?.() || excalidrawRef.current;
      if (api?.getSceneElements) {
        const elements = api.getSceneElements();
        const oldStroke = getContrastStroke(resolvedBgColor);
        // Only recolor elements that used the previous auto-contrast color
        const updated = elements.map(el => {
          if (el.strokeColor === oldStroke || el.strokeColor === '#e8e4df' || el.strokeColor === '#1e1e1e') {
            return { ...el, strokeColor: newStroke };
          }
          return el;
        });
        api.updateScene({
          elements: updated,
          appState: { currentItemStrokeColor: newStroke },
        });
      }
    }

    trackEvent('flyboard_bg_changed', { bg_preset: presetId });
  }, [strokeColorMode, isDark, resolvedBgColor]);

  const handleFontChange = useCallback((fontId) => {
    setFontFamily(fontId);
    localStorage.setItem('flyboard-font', String(fontId));
    setFontMenuOpen(false);
    trackEvent('flyboard_font_changed', { font_id: fontId });
  }, []);

  const handleStrokeColorChange = useCallback((colorId) => {
    setStrokeColorMode(colorId);
    localStorage.setItem('flyboard-stroke-color', colorId);
    setColorMenuOpen(false);
    // Update Excalidraw state for ALL modes (auto and manual)
    const hex = colorId === 'auto'
      ? getContrastStroke(resolvedBgColor)
      : (STROKE_COLORS.find(c => c.id === colorId)?.hex);
    if (hex) {
      excalidrawRef.current?.updateScene({ appState: { currentItemStrokeColor: hex } });
    }
    trackEvent('flyboard_stroke_color_changed', { color: colorId });
  }, [resolvedBgColor]);

  // Insert a symbol/emoji: copies to clipboard and shows toast
  const handleInsertSymbol = useCallback((char) => {
    navigator.clipboard.writeText(char).then(() => {
      setToast(`"${char}" copied. Paste it into any text element.`);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => { setToast(null); }, 2000);
    }).catch(() => {});
  }, []);

  const handleToolSelect = useCallback((toolId) => {
    setActiveTool(toolId);
    excalidrawRef.current?.setTool(toolId);
  }, []);

  const handleToggleExcalidrawUI = useCallback(() => {
    setShowExcalidrawUI(prev => {
      const next = !prev;
      localStorage.setItem('flyboard-excalidraw-ui', String(next));
      return next;
    });
  }, []);

  const handleUndo = useCallback(() => excalidrawRef.current?.undo(), []);
  const handleRedo = useCallback(() => excalidrawRef.current?.redo(), []);
  const handleZoomIn = useCallback(() => excalidrawRef.current?.zoomIn(), []);
  const handleZoomOut = useCallback(() => excalidrawRef.current?.zoomOut(), []);

  // Sidebar handlers
  const handleStartRename = useCallback((boardId, currentTitle) => {
    setRenamingBoardId(boardId);
    setRenameValue(currentTitle);
    setBoardContextMenu(null);
  }, []);

  const handleFinishRename = useCallback(() => {
    if (renamingBoardId && renameValue.trim()) {
      updateBoardTitle(renamingBoardId, renameValue.trim());
    }
    setRenamingBoardId(null);
    setRenameValue('');
  }, [renamingBoardId, renameValue, updateBoardTitle]);

  const handleDuplicateBoard = useCallback(async (boardId) => {
    const board = boards.find(b => b.id === boardId);
    if (!board) return;
    setBoardContextMenu(null);
    // Copy scene data from the source board so the duplicate includes all drawings
    const sceneData = board.scene_data || { elements: [], appState: {} };
    const newBoard = await createBoard({ title: `${board.title} (copy)`, folderId: board.folder_id, sceneData });
    if (newBoard) openBoard(newBoard.id);
    trackEvent('flyboard_board_duplicated', { board_id: boardId });
  }, [boards, createBoard, openBoard]);

  const handleDeleteBoard = useCallback(async (boardId) => {
    setBoardContextMenu(null);
    setDeleteConfirmId(null);
    await deleteBoard(boardId);
  }, [deleteBoard]);

  const handleToggleFavorite = useCallback((boardId) => {
    setBoardContextMenu(null);
    toggleFavorite(boardId);
  }, [toggleFavorite]);

  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return;
    await createFolder(newFolderName.trim());
    setNewFolderName('');
    setShowNewFolder(false);
  }, [newFolderName, createFolder]);

  const handleToggleFolder = useCallback((folderId) => {
    setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  }, []);

  const handleStartFolderRename = useCallback((folderId, currentName) => {
    setRenamingFolderId(folderId);
    setRenameFolderValue(currentName);
    setFolderContextMenu(null);
  }, []);

  const handleFinishFolderRename = useCallback(() => {
    if (renamingFolderId && renameFolderValue.trim()) {
      renameFolder(renamingFolderId, renameFolderValue.trim());
    }
    setRenamingFolderId(null);
    setRenameFolderValue('');
  }, [renamingFolderId, renameFolderValue, renameFolder]);

  const handleMoveBoard = useCallback((boardId, folderId) => {
    moveBoard(boardId, folderId);
    setMovingBoardId(null);
    setBoardContextMenu(null);
  }, [moveBoard]);

  // Guest limits
  const guestLimitReached = !isAuthenticated && boards.length >= GUEST_BOARD_LIMIT;

  const boardTitle = activeBoard?.title || 'FlyBoard';

  // Render a single board item (shared between desktop and mobile sidebar)
  const renderBoardItem = (board, isMobile) => {
    const isActive = activeBoard?.id === board.id;
    const isRenaming = renamingBoardId === board.id;

    const handleBoardClick = (e) => {
      e.preventDefault();
      openBoard(board.id);
      if (isMobile) setSidebarOpen(false);
    };

    const handleContextMenuClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setBoardContextMenu({ boardId: board.id, x: e.currentTarget.getBoundingClientRect().right, y: e.currentTarget.getBoundingClientRect().top });
    };

    return (
      <button
        key={board.id}
        type="button"
        className={`group w-full flex items-center gap-1 px-2 py-2.5 sm:py-1.5 rounded-lg text-sm transition-colors text-left ${
          isActive
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
        onClick={handleBoardClick}
        onContextMenu={(e) => { e.preventDefault(); setBoardContextMenu({ boardId: board.id, x: e.clientX, y: e.clientY }); }}
      >
        {board.is_favorite && (
          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 shrink-0" />
        )}
        {isRenaming ? (
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleFinishRename}
            onKeyDown={(e) => { if (e.key === 'Enter') handleFinishRename(); if (e.key === 'Escape') { setRenamingBoardId(null); setRenameValue(''); } }}
            className="flex-1 bg-transparent border-none outline-none text-sm min-w-0"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 truncate min-w-0">{board.title}</span>
        )}
        <span
          role="button"
          tabIndex={-1}
          onClick={handleContextMenuClick}
          onKeyDown={() => {}}
          className="opacity-60 sm:opacity-0 sm:group-hover:opacity-60 hover:!opacity-100 p-1 sm:p-0.5 rounded transition-opacity shrink-0"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </span>
      </button>
    );
  };

  // Render sidebar content (shared between desktop and mobile)
  const renderSidebarContent = (isMobile) => {
    const minW = isMobile ? 'min-w-[300px]' : 'min-w-[260px]';

    return (
      <>
        {/* Search + Actions */}
        <div className={`p-3 border-b space-y-2 ${minW}`}>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search boards..."
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-muted/50 border border-border text-sm placeholder:text-muted-foreground/60 outline-none focus:border-primary/40 transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { handleNewBoard(); if (isMobile) setSidebarOpen(false); }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-muted/50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Board
            </button>
            <button
              onClick={() => { setTemplatePickerOpen(true); if (isMobile) setSidebarOpen(false); }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
              Templates
            </button>
          </div>
          {isAuthenticated && (
            <div className="flex gap-2">
              {showNewFolder ? (
                <div className="flex gap-1 w-full">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') setShowNewFolder(false); }}
                    placeholder="Folder name..."
                    className="flex-1 px-2 py-1.5 rounded-lg bg-muted/50 border border-border text-xs outline-none focus:border-primary/40"
                    autoFocus
                  />
                  <button onClick={handleCreateFolder} className="px-2 py-1.5 rounded-lg bg-primary/10 text-primary text-xs hover:bg-primary/20 transition-colors">Add</button>
                  <button onClick={() => setShowNewFolder(false)} className="px-2 py-1.5 rounded-lg text-muted-foreground text-xs hover:bg-muted transition-colors">Cancel</button>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewFolder(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  New Folder
                </button>
              )}
            </div>
          )}
        </div>

        {/* Board list */}
        <div className={`flex-1 overflow-y-auto p-2 space-y-1 scrollbar-none ${minW}`}>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : boards.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8 px-4">
              No boards yet. Create your first one.
            </p>
          ) : (
            <>
              {/* Favorites section */}
              {filteredBoards.favorites.length > 0 && (
                <div className="mb-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    <Star className="w-3 h-3" />
                    Favorites
                  </div>
                  {filteredBoards.favorites.map(b => renderBoardItem(b, isMobile))}
                </div>
              )}

              {/* Folders */}
              {folders.length > 0 && folders.map(folder => {
                const folderBoards = boardsByFolder[folder.id] || [];
                const isExpanded = expandedFolders[folder.id];

                return (
                  <div key={folder.id} className="mb-1">
                    <div
                      className="group flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                      onClick={() => handleToggleFolder(folder.id)}
                      onContextMenu={(e) => { e.preventDefault(); setFolderContextMenu({ folderId: folder.id, x: e.clientX, y: e.clientY }); }}
                    >
                      <ChevronRight className={`w-3 h-3 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      {isExpanded ? <FolderOpen className="w-3.5 h-3.5 shrink-0" /> : <Folder className="w-3.5 h-3.5 shrink-0" />}
                      {renamingFolderId === folder.id ? (
                        <input
                          type="text"
                          value={renameFolderValue}
                          onChange={(e) => setRenameFolderValue(e.target.value)}
                          onBlur={handleFinishFolderRename}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleFinishFolderRename(); if (e.key === 'Escape') { setRenamingFolderId(null); } }}
                          className="flex-1 bg-transparent border-none outline-none text-sm min-w-0"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="flex-1 truncate min-w-0 font-medium text-xs">{folder.name}</span>
                      )}
                      <span className="text-[10px] text-muted-foreground/50">{folderBoards.length}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setFolderContextMenu({ folderId: folder.id, x: e.currentTarget.getBoundingClientRect().right, y: e.currentTarget.getBoundingClientRect().top }); }}
                        className="opacity-60 sm:opacity-0 sm:group-hover:opacity-60 hover:!opacity-100 p-1 sm:p-0.5 rounded transition-opacity shrink-0"
                      >
                        <MoreHorizontal className="w-3 h-3" />
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="pl-4 space-y-0.5 mt-0.5">
                        {folderBoards.length === 0 ? (
                          <p className="text-[11px] text-muted-foreground/40 px-2 py-1">Empty folder</p>
                        ) : (
                          folderBoards.map(b => renderBoardItem(b, isMobile))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Unfiled boards */}
              {boardsByFolder.unfiled?.length > 0 && (
                <div className={folders.length > 0 ? 'mt-2' : ''}>
                  {folders.length > 0 && (
                    <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                      All Boards
                    </div>
                  )}
                  {boardsByFolder.unfiled.map(b => renderBoardItem(b, isMobile))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className={`px-3 py-2 border-t ${minW}`}>
          {!isAuthenticated ? (
            <div className="text-center space-y-1.5">
              <p className="text-[11px] text-muted-foreground/60">Guest mode: {GUEST_BOARD_LIMIT} board limit</p>
              <a
                href="/login"
                className="inline-block text-[11px] text-primary font-medium hover:underline"
              >
                Sign in for unlimited boards, folders, and templates
              </a>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground/50">
              {filteredBoards.total} board{filteredBoards.total !== 1 ? 's' : ''}
              {folders.length > 0 && ` · ${folders.length} folder${folders.length !== 1 ? 's' : ''}`}
            </p>
          )}
        </div>
      </>
    );
  };

  return (
    <>
      <SEO
        title="FlyBoard - Free Online Whiteboard | Fly Labs"
        description="A free infinite canvas whiteboard for sketching ideas, brainstorming, and visual thinking. Templates for mind maps, business canvases, and frameworks. Dark mode, multiple grid styles, export to PNG."
        keywords="free whiteboard, online whiteboard, infinite canvas, brainstorming tool, mind map, business canvas, Excalidraw, sketching, visual thinking, open source whiteboard"
        url="https://flylabs.fun/flyboard"
        schema={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "FlyBoard",
          "description": "A free infinite canvas whiteboard for sketching ideas, brainstorming, and visual thinking.",
          "url": "https://flylabs.fun/flyboard",
          "applicationCategory": "DesignApplication",
          "operatingSystem": "Web",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
          "author": { "@type": "Person", "name": "Luiz Alves" }
        }}
      />

      <div className="h-dvh flex flex-col bg-background">
        {!isFullscreen && <Header />}

        <div className={`flex-1 flex overflow-hidden relative ${!isFullscreen ? 'pt-[60px]' : ''}`}>
          {/* ---- Collapsible Desktop Sidebar ---- */}
          <div
            className={`hidden md:flex flex-col border-r bg-card/50 backdrop-blur-sm transition-[width,border] duration-200 overflow-hidden ${
              sidebarOpen ? 'w-[260px]' : 'w-0 border-r-0'
            }`}
          >
            {renderSidebarContent(false)}
          </div>

          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)}>
              <div
                className="absolute left-0 bottom-0 w-[300px] bg-card border-r flex flex-col"
                style={{ top: isFullscreen ? 0 : '60px' }}
                onClick={e => e.stopPropagation()}
              >
                {renderSidebarContent(true)}
              </div>
            </div>
          )}

          {/* ---- Main canvas area ---- */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Toolbar: wraps to 2 rows at narrow widths, single row when wide */}
            <div className="flyboard-toolbar flex flex-wrap items-center px-2 sm:px-3 min-h-[44px] border-b shrink-0 gap-y-0.5 py-0.5">
              {/* Left: sidebar toggle + title */}
              <div className="flex items-center gap-1 min-w-0 shrink-0">
                <button
                  onClick={() => setSidebarOpen(prev => !prev)}
                  className="!hidden md:!inline-flex flyboard-tb-btn"
                  title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                  {sidebarOpen ? <PanelLeftClose className="w-[18px] h-[18px]" /> : <PanelLeft className="w-[18px] h-[18px]" />}
                </button>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="md:!hidden flyboard-tb-btn"
                  aria-label="Open sidebar"
                >
                  <Menu className="w-[18px] h-[18px]" />
                </button>

                {activeBoard && isAuthenticated ? (
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isSaving && (
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                      </span>
                    )}
                    <input
                      type="text"
                      value={activeBoard.title}
                      onChange={(e) => updateBoardTitle(activeBoard.id, e.target.value)}
                      className="bg-transparent font-semibold text-[13px] border-none outline-none focus:ring-0 w-[70px] sm:w-[120px] truncate leading-none"
                      onBlur={(e) => {
                        if (!e.target.value.trim()) updateBoardTitle(activeBoard.id, 'Untitled Board');
                      }}
                    />
                    {showSaved && !isSaving && (
                      <span className="text-[10px] text-green-500/80 whitespace-nowrap animate-fade-out">Saved</span>
                    )}
                  </div>
                ) : (
                  <span className="font-semibold text-[13px] px-1 leading-none">
                    <span className="hidden sm:inline">FlyBoard</span>
                    <span className="sm:hidden">FB</span>
                    {!isAuthenticated && <span className="text-[10px] text-muted-foreground ml-1">(Guest)</span>}
                  </span>
                )}
              </div>

              {/* Tools: wraps to second row at narrow widths */}
              <div className="flex items-center gap-1 sm:gap-1.5 flex-1 min-w-0 ml-2 sm:ml-3 mr-1 flex-wrap">

                {/* Drawing tools pill - core 5 on mobile, +3 on tablet, all on desktop */}
                <div className="flyboard-tool-pill">
                  {DRAW_TOOLS.map(tool => {
                    const Icon = tool.icon;
                    // Mobile (below sm): selection, rectangle, freedraw, text, eraser
                    const isMobileCore = ['selection', 'rectangle', 'freedraw', 'text', 'eraser'].includes(tool.id);
                    // Tablet (sm to lg): hide hand and line (available in overflow)
                    const isDesktopOnly = ['hand', 'line'].includes(tool.id);
                    const visibilityClass = isMobileCore
                      ? ''
                      : isDesktopOnly
                        ? '!hidden lg:!inline-flex'
                        : '!hidden sm:!inline-flex';
                    return (
                      <button
                        key={tool.id}
                        onClick={() => handleToolSelect(tool.id)}
                        className={`flyboard-tb-btn ${activeTool === tool.id ? 'active' : ''} ${visibilityClass}`}
                        title={tool.label}
                      >
                        <Icon className="w-[18px] h-[18px]" />
                      </button>
                    );
                  })}
                </div>

                {/* History pill: Undo / Redo */}
                <div className="flyboard-tool-pill">
                  <button onClick={handleUndo} className="flyboard-tb-btn" title="Undo (Ctrl+Z)">
                    <Undo2 className="w-[18px] h-[18px]" />
                  </button>
                  <button onClick={handleRedo} className="flyboard-tb-btn" title="Redo (Ctrl+Shift+Z)">
                    <Redo2 className="w-[18px] h-[18px]" />
                  </button>
                </div>

                {/* Zoom pill - hidden on mobile */}
                <div className="flyboard-tool-pill !hidden sm:!flex">
                  <button onClick={handleZoomOut} className="flyboard-tb-btn" title="Zoom out">
                    <ZoomOut className="w-[18px] h-[18px]" />
                  </button>
                  <button onClick={handleZoomIn} className="flyboard-tb-btn" title="Zoom in">
                    <ZoomIn className="w-[18px] h-[18px]" />
                  </button>
                </div>

                {/* Canvas controls pill - hidden below md (accessible via overflow) */}
                <div className="flyboard-tool-pill !hidden md:!flex">
                  <button
                    onClick={handleGridToggle}
                    className={`flyboard-tb-btn ${gridVisible ? 'active' : ''}`}
                    title={gridVisible ? 'Hide grid' : 'Show grid'}
                  >
                    {gridVisible ? <Eye className="w-[18px] h-[18px]" /> : <EyeOff className="w-[18px] h-[18px]" />}
                  </button>

                  <div className="relative" ref={gridMenuRef}>
                    <button
                      onClick={() => { setGridMenuOpen(!gridMenuOpen); setBgMenuOpen(false); setFontMenuOpen(false); }}
                      className="flyboard-tb-btn flyboard-tb-dropdown"
                      title="Grid style"
                    >
                      <Grid3x3 className="w-[18px] h-[18px]" />
                      <ChevronDown className="w-3 h-3 opacity-50" />
                    </button>
                    {gridMenuOpen && (
                      <div className="flyboard-grid-menu">
                        {GRID_OPTIONS.map(opt => (
                          <button key={opt.id} onClick={() => handleGridStyleChange(opt.id)} className={gridStyle === opt.id ? 'active' : ''}>
                            <span className="inline-block w-5 text-center mr-1.5">{opt.icon}</span>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative !hidden lg:!block" ref={bgMenuRef}>
                    <button
                      onClick={() => { setBgMenuOpen(!bgMenuOpen); setGridMenuOpen(false); setFontMenuOpen(false); }}
                      className="flyboard-tb-btn flyboard-tb-dropdown"
                      title="Background"
                    >
                      <Palette className="w-[18px] h-[18px]" />
                      <ChevronDown className="w-3 h-3 opacity-50" />
                    </button>
                    {bgMenuOpen && (
                      <div className="flyboard-grid-menu">
                        {BG_PRESETS.map(preset => (
                          <button key={preset.id} onClick={() => handleBgChange(preset.id)} className={bgPreset === preset.id ? 'active' : ''}>
                            <span
                              className="inline-block w-4 h-4 rounded-full border border-border mr-2 shrink-0"
                              style={{ backgroundColor: isDark ? preset.swatch.dark : preset.swatch.light }}
                            />
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative !hidden lg:!block" ref={fontMenuRef}>
                    <button
                      onClick={() => { setFontMenuOpen(!fontMenuOpen); setGridMenuOpen(false); setBgMenuOpen(false); }}
                      className="flyboard-tb-btn flyboard-tb-dropdown"
                      title="Font family"
                    >
                      <span className="text-[13px] font-semibold leading-none tracking-tight">Aa</span>
                      <ChevronDown className="w-3 h-3 opacity-50" />
                    </button>
                    {fontMenuOpen && (
                      <div className="flyboard-grid-menu" style={{ minWidth: '200px' }}>
                        {FONT_OPTIONS.map((opt, i) => {
                          const prev = i > 0 ? FONT_OPTIONS[i - 1] : null;
                          const isNewCategory = !prev || prev.category !== opt.category;
                          return (
                            <React.Fragment key={opt.id}>
                              {isNewCategory && (
                                <>
                                  {i > 0 && <div className="h-px bg-border my-1" />}
                                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                                    {opt.category}
                                  </div>
                                </>
                              )}
                              <button onClick={() => handleFontChange(opt.id)} className={fontFamily === opt.id ? 'active' : ''}>
                                <span className="font-medium">{opt.label}</span>
                                <span className="text-muted-foreground ml-auto text-[11px] pl-2">{opt.desc}</span>
                              </button>
                            </React.Fragment>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Stroke color picker - always visible in canvas controls pill */}
                  <div className="relative" ref={colorMenuRef}>
                    <button
                      onClick={() => { setColorMenuOpen(!colorMenuOpen); setGridMenuOpen(false); setBgMenuOpen(false); setFontMenuOpen(false); }}
                      className="flyboard-tb-btn flyboard-tb-dropdown"
                      title="Text & stroke color"
                    >
                      <span className="flex flex-col items-center leading-none gap-0">
                        <span className="text-[13px] font-bold" style={{ color: resolvedStrokeColor }}>A</span>
                        <span
                          className="w-4 h-[3px] rounded-full -mt-0.5"
                          style={{ backgroundColor: resolvedStrokeColor }}
                        />
                      </span>
                      <ChevronDown className="w-3 h-3 opacity-50" />
                    </button>
                    {colorMenuOpen && (
                      <div className="flyboard-grid-menu" style={{ minWidth: '200px', padding: '8px' }}>
                        <div className="px-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                          Color
                        </div>
                        <div className="grid grid-cols-5 gap-1.5 mb-2">
                          {STROKE_COLORS.map(color => (
                            <button
                              key={color.id}
                              onClick={() => handleStrokeColorChange(color.id)}
                              className="!w-8 !h-8 !p-0 flex items-center justify-center rounded-lg"
                              title={color.label}
                              style={{ background: 'transparent' }}
                            >
                              <span
                                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                                  strokeColorMode === color.id ? 'scale-110 border-primary ring-2 ring-primary/30' : 'border-border/60 hover:scale-105'
                                }`}
                                style={{
                                  backgroundColor: color.hex || 'transparent',
                                  ...(color.id === 'auto' ? { background: `conic-gradient(#e8e4df 0deg, #e8e4df 180deg, #1e1e1e 180deg, #1e1e1e 360deg)` } : {}),
                                }}
                              />
                            </button>
                          ))}
                        </div>
                        <div className="text-[10px] text-muted-foreground/40 px-1">
                          {strokeColorMode === 'auto' ? 'Auto: white on dark, black on light' : STROKE_COLORS.find(c => c.id === strokeColorMode)?.label}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Theme toggle pill - hidden below lg */}
                <div className="flyboard-tool-pill !hidden lg:!flex">
                  <button
                    onClick={toggleTheme}
                    className="flyboard-tb-btn"
                    title={isDark ? 'Light mode' : 'Dark mode'}
                  >
                    {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
                  </button>
                </div>

                {/* Text size + symbols + emoji - hidden below lg */}
                <div className="flyboard-tool-pill !hidden lg:!flex">
                  <button
                    onClick={() => {
                      const api = excalidrawRef.current?.getAPI();
                      if (!api) return;
                      const selected = api.getSceneElements().filter(el => api.getAppState().selectedElementIds?.[el.id] && el.type === 'text');
                      if (selected.length) {
                        const updated = selected.map(el => {
                          const currentIdx = FONT_SIZES.findIndex(s => s >= el.fontSize);
                          const nextIdx = Math.min((currentIdx >= 0 ? currentIdx : 3) + 1, FONT_SIZES.length - 1);
                          return { ...el, fontSize: FONT_SIZES[nextIdx] };
                        });
                        api.updateScene({ elements: api.getSceneElements().map(el => updated.find(u => u.id === el.id) || el) });
                      } else {
                        // No selection: bump default font size for new text
                        const appState = api.getAppState();
                        const current = appState.currentItemFontSize || 20;
                        const currentIdx = FONT_SIZES.findIndex(s => s >= current);
                        const nextIdx = Math.min((currentIdx >= 0 ? currentIdx : 3) + 1, FONT_SIZES.length - 1);
                        api.updateScene({ appState: { currentItemFontSize: FONT_SIZES[nextIdx] } });
                      }
                    }}
                    className="flyboard-tb-btn"
                    title="Increase text size (A+)"
                  >
                    <span className="text-[14px] font-bold leading-none">A+</span>
                  </button>
                  <button
                    onClick={() => {
                      const api = excalidrawRef.current?.getAPI();
                      if (!api) return;
                      const selected = api.getSceneElements().filter(el => api.getAppState().selectedElementIds?.[el.id] && el.type === 'text');
                      if (selected.length) {
                        const updated = selected.map(el => {
                          const currentIdx = FONT_SIZES.findIndex(s => s >= el.fontSize);
                          const prevIdx = Math.max((currentIdx >= 0 ? currentIdx : 3) - 1, 0);
                          return { ...el, fontSize: FONT_SIZES[prevIdx] };
                        });
                        api.updateScene({ elements: api.getSceneElements().map(el => updated.find(u => u.id === el.id) || el) });
                      } else {
                        const appState = api.getAppState();
                        const current = appState.currentItemFontSize || 20;
                        const currentIdx = FONT_SIZES.findIndex(s => s >= current);
                        const prevIdx = Math.max((currentIdx >= 0 ? currentIdx : 3) - 1, 0);
                        api.updateScene({ appState: { currentItemFontSize: FONT_SIZES[prevIdx] } });
                      }
                    }}
                    className="flyboard-tb-btn"
                    title="Decrease text size (A-)"
                  >
                    <span className="text-[11px] font-bold leading-none">A-</span>
                  </button>

                  {/* Symbols picker */}
                  <div className="relative" ref={symbolMenuRef}>
                    <button
                      onClick={() => { setSymbolMenuOpen(!symbolMenuOpen); setEmojiMenuOpen(false); setColorMenuOpen(false); setGridMenuOpen(false); setBgMenuOpen(false); setFontMenuOpen(false); }}
                      className="flyboard-tb-btn"
                      title="Math & code symbols"
                    >
                      <span className="text-[15px] leading-none">{'\u03C0'}</span>
                    </button>
                    {symbolMenuOpen && (
                      <div className="flyboard-grid-menu" style={{ minWidth: '240px', padding: '8px', maxHeight: '320px', overflowY: 'auto' }}>
                        {SYMBOL_GROUPS.map(group => (
                          <div key={group.label} className="mb-2 last:mb-0">
                            <div className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                              {group.label}
                            </div>
                            <div className="grid grid-cols-8 gap-0.5">
                              {group.symbols.map(sym => (
                                <button
                                  key={sym}
                                  onClick={() => handleInsertSymbol(sym)}
                                  className="!w-7 !h-7 !p-0 flex items-center justify-center rounded-md text-[15px] hover:!bg-primary/10"
                                  title={`Copy "${sym}"`}
                                >
                                  {sym}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Emoji picker */}
                  <div className="relative" ref={emojiMenuRef}>
                    <button
                      onClick={() => { setEmojiMenuOpen(!emojiMenuOpen); setSymbolMenuOpen(false); setColorMenuOpen(false); setGridMenuOpen(false); setBgMenuOpen(false); setFontMenuOpen(false); }}
                      className="flyboard-tb-btn"
                      title="Emojis"
                    >
                      <span className="text-[15px] leading-none">{'\uD83D\uDE00'}</span>
                    </button>
                    {emojiMenuOpen && (
                      <div className="flyboard-grid-menu" style={{ minWidth: '220px', padding: '8px' }}>
                        {EMOJI_GROUPS.map(group => (
                          <div key={group.label} className="mb-2 last:mb-0">
                            <div className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                              {group.label}
                            </div>
                            <div className="grid grid-cols-6 gap-0.5">
                              {group.emojis.map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => handleInsertSymbol(emoji)}
                                  className="!w-8 !h-8 !p-0 flex items-center justify-center rounded-md text-[18px] hover:!bg-primary/10 hover:scale-110 transition-transform"
                                  title={`Copy ${emoji}`}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Overflow menu: shows all hidden tools (visible below sm on mobile, also below lg for symbols/emoji) */}
                <button
                  onClick={() => setMobileToolsOpen(true)}
                  className="flyboard-tb-btn lg:!hidden"
                  title="More tools"
                >
                  <MoreHorizontal className="w-[18px] h-[18px]" />
                </button>

                {/* Spacer pushes actions to the right */}
                <div className="flex-1 min-w-2" />

                {/* Actions pill (inside the scroll strip) */}
                <div className="flyboard-tool-pill shrink-0">
                  <button
                    onClick={() => setExportOpen(true)}
                    className="flyboard-tb-btn"
                    title="Export board"
                  >
                    <Download className="w-[18px] h-[18px]" />
                  </button>

                  <button
                    onClick={handleToggleExcalidrawUI}
                    className={`flyboard-tb-btn flyboard-native-toggle ${showExcalidrawUI ? 'active' : ''}`}
                    title={showExcalidrawUI ? 'Hide native toolbar' : 'Show native Excalidraw toolbar (colors, links, images, LaTeX math)'}
                  >
                    <SlidersHorizontal className="w-[18px] h-[18px]" />
                  </button>

                  <button
                    onClick={toggleFullscreen}
                    className="flyboard-tb-btn"
                    title={isFullscreen ? 'Exit fullscreen (F11)' : 'Fullscreen (F11)'}
                  >
                    {isFullscreen ? <Minimize2 className="w-[18px] h-[18px]" /> : <Maximize2 className="w-[18px] h-[18px]" />}
                  </button>

                  {!isAuthenticated && (
                    <a href="/login" className="text-[11px] text-primary hover:underline ml-1 whitespace-nowrap font-medium">
                      Sign in
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 relative">
              {/* Toast notification (replaces red error banner) */}
              {toast && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-foreground/10 backdrop-blur-md border border-border text-sm text-foreground/80 shadow-lg animate-fade-in">
                  {toast}
                </div>
              )}

              <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              }>
                <ExcalidrawCanvas
                  ref={excalidrawRef}
                  board={activeBoard}
                  onSceneChange={onSceneChange}
                  isDark={isDark}
                  gridStyle={gridStyle}
                  gridVisible={gridVisible}
                  bgColor={resolvedBgColor}
                  defaultFont={fontFamily}
                  strokeColor={resolvedStrokeColor}
                  hideUI={!showExcalidrawUI}
                />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Fullscreen floating toolbar overlay */}
        {isFullscreen && (
          <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-end px-4 h-10 bg-background/60 backdrop-blur-sm border-b border-border/50 opacity-0 hover:opacity-100 transition-opacity duration-200">
            <span className="text-xs text-muted-foreground mr-auto">{boardTitle}</span>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title="Exit fullscreen (F11)"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <Suspense fallback={null}>
        {exportOpen && (
          <ExportMenu
            isOpen={exportOpen}
            onClose={() => setExportOpen(false)}
            excalidrawRef={excalidrawRef}
            boardTitle={activeBoard?.title || 'FlyBoard'}
            bgColor={resolvedBgColor}
          />
        )}
        {templatePickerOpen && (
          <TemplatePicker
            isOpen={templatePickerOpen}
            onClose={() => setTemplatePickerOpen(false)}
            onSelect={handleTemplateSelect}
          />
        )}
      </Suspense>

      {/* Mobile tools bottom sheet */}
      {mobileToolsOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" onClick={() => setMobileToolsOpen(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl border-t shadow-xl max-h-[80dvh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-border mx-auto mt-2 mb-1 shrink-0" />
            <div className="overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] overscroll-contain">

            {/* Drawing tools */}
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium mb-2">Drawing Tools</p>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {DRAW_TOOLS.filter(t => !['selection', 'rectangle', 'freedraw', 'text', 'eraser'].includes(t.id)).map(tool => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => { handleToolSelect(tool.id); setMobileToolsOpen(false); }}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${activeTool === tool.id ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px]">{tool.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>

            {/* Canvas controls */}
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium mb-2">Canvas</p>
            <div className="grid grid-cols-5 gap-2 mb-4">
              <button
                onClick={() => { handleZoomOut(); }}
                className="flex flex-col items-center gap-1 p-2 rounded-xl text-muted-foreground hover:bg-muted"
              >
                <ZoomOut className="w-5 h-5" />
                <span className="text-[10px]">Zoom-</span>
              </button>
              <button
                onClick={() => { handleZoomIn(); }}
                className="flex flex-col items-center gap-1 p-2 rounded-xl text-muted-foreground hover:bg-muted"
              >
                <ZoomIn className="w-5 h-5" />
                <span className="text-[10px]">Zoom+</span>
              </button>
              <button
                onClick={handleGridToggle}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${gridVisible ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
              >
                {gridVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                <span className="text-[10px]">Grid</span>
              </button>
              <button
                onClick={() => { toggleTheme(); setMobileToolsOpen(false); }}
                className="flex flex-col items-center gap-1 p-2 rounded-xl text-muted-foreground hover:bg-muted"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                <span className="text-[10px]">Theme</span>
              </button>
              <button
                onClick={() => { setExportOpen(true); setMobileToolsOpen(false); }}
                className="flex flex-col items-center gap-1 p-2 rounded-xl text-muted-foreground hover:bg-muted"
              >
                <Download className="w-5 h-5" />
                <span className="text-[10px]">Export</span>
              </button>
            </div>

            {/* Grid style */}
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium mb-2">Grid Style</p>
            <div className="flex gap-2 mb-4">
              {GRID_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleGridStyleChange(opt.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs transition-colors ${
                    gridStyle === opt.id ? 'bg-primary/15 text-primary font-medium' : 'text-muted-foreground hover:bg-muted border border-border/50'
                  }`}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label.replace(' Grid', '')}</span>
                </button>
              ))}
            </div>

            {/* Background */}
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium mb-2">Background</p>
            <div className="flex gap-2 mb-4">
              {BG_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => handleBgChange(preset.id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] transition-colors ${
                    bgPreset === preset.id ? 'bg-primary/15 text-primary font-medium' : 'text-muted-foreground hover:bg-muted border border-border/50'
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-full border border-border"
                    style={{ backgroundColor: isDark ? preset.swatch.dark : preset.swatch.light }}
                  />
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Font */}
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium mb-2">Font</p>
            <div className="grid grid-cols-2 gap-1.5 mb-4">
              {FONT_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleFontChange(opt.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors ${
                    fontFamily === opt.id ? 'bg-primary/15 text-primary font-medium' : 'text-muted-foreground hover:bg-muted border border-border/50'
                  }`}
                >
                  <span className="font-medium">{opt.label}</span>
                  <span className="text-[10px] text-muted-foreground/60 ml-auto">{opt.desc}</span>
                </button>
              ))}
            </div>

            {/* Stroke Color */}
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium mb-2">Stroke Color</p>
            <div className="flex items-center gap-2 mb-4">
              {STROKE_COLORS.map(color => (
                <button
                  key={color.id}
                  onClick={() => handleStrokeColorChange(color.id)}
                  className="flex items-center justify-center"
                  title={color.label}
                >
                  <span
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      strokeColorMode === color.id ? 'scale-110 border-primary ring-2 ring-primary/30' : 'border-border/50 active:scale-95'
                    }`}
                    style={{
                      backgroundColor: color.hex || 'transparent',
                      ...(color.id === 'auto' ? { background: 'conic-gradient(#e8e4df 0deg, #e8e4df 180deg, #1e1e1e 180deg, #1e1e1e 360deg)' } : {}),
                    }}
                  />
                </button>
              ))}
            </div>

            {/* Text Size */}
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium mb-2">Text Size</p>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => {
                  const api = excalidrawRef.current?.getAPI();
                  if (!api) return;
                  const selected = api.getSceneElements().filter(el => api.getAppState().selectedElementIds?.[el.id] && el.type === 'text');
                  if (selected.length) {
                    const updated = selected.map(el => {
                      const idx = FONT_SIZES.findIndex(s => s >= el.fontSize);
                      return { ...el, fontSize: FONT_SIZES[Math.max((idx >= 0 ? idx : 3) - 1, 0)] };
                    });
                    api.updateScene({ elements: api.getSceneElements().map(el => updated.find(u => u.id === el.id) || el) });
                  }
                }}
                className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-muted-foreground hover:bg-muted border border-border/50 text-sm font-bold"
              >
                A-
              </button>
              <button
                onClick={() => {
                  const api = excalidrawRef.current?.getAPI();
                  if (!api) return;
                  const selected = api.getSceneElements().filter(el => api.getAppState().selectedElementIds?.[el.id] && el.type === 'text');
                  if (selected.length) {
                    const updated = selected.map(el => {
                      const idx = FONT_SIZES.findIndex(s => s >= el.fontSize);
                      return { ...el, fontSize: FONT_SIZES[Math.min((idx >= 0 ? idx : 3) + 1, FONT_SIZES.length - 1)] };
                    });
                    api.updateScene({ elements: api.getSceneElements().map(el => updated.find(u => u.id === el.id) || el) });
                  }
                }}
                className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-muted-foreground hover:bg-muted border border-border/50 text-lg font-bold"
              >
                A+
              </button>
            </div>

            {/* Symbols */}
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium mb-2">Symbols</p>
            <div className="grid grid-cols-10 gap-1 mb-4">
              {SYMBOL_GROUPS.flatMap(g => g.symbols).slice(0, 20).map(sym => (
                <button
                  key={sym}
                  onClick={() => handleInsertSymbol(sym)}
                  className="flex items-center justify-center h-8 rounded-lg text-[16px] text-foreground hover:bg-muted active:scale-90 transition-transform"
                  title={`Copy "${sym}"`}
                >
                  {sym}
                </button>
              ))}
            </div>

            {/* Emojis */}
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium mb-2">Emojis</p>
            <div className="grid grid-cols-8 gap-1 mb-4">
              {EMOJI_GROUPS.flatMap(g => g.emojis).slice(0, 16).map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleInsertSymbol(emoji)}
                  className="flex items-center justify-center h-9 rounded-lg text-[20px] hover:bg-muted active:scale-90 transition-transform"
                  title={`Copy ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Show Excalidraw native toolbar */}
            <div className="rounded-xl border border-dashed border-border/60 p-3 mb-1">
              <button
                onClick={() => { handleToggleExcalidrawUI(); setMobileToolsOpen(false); }}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  showExcalidrawUI ? 'bg-primary/15 text-primary' : 'bg-muted/50 text-foreground hover:bg-muted'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                {showExcalidrawUI ? 'Hide Native Toolbar' : 'Show Native Toolbar'}
              </button>
              <p className="text-[10px] text-muted-foreground/50 text-center mt-1.5">
                Colors per element, links, images, LaTeX math ($$x^2$$)
              </p>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Board context menu */}
      {boardContextMenu && (
        <div
          ref={contextMenuRef}
          className="flyboard-grid-menu"
          style={{
            position: 'fixed',
            left: Math.min(boardContextMenu.x, window.innerWidth - 200),
            top: Math.min(boardContextMenu.y, window.innerHeight - 250),
            zIndex: 9999,
          }}
        >
          <button onClick={() => handleStartRename(boardContextMenu.boardId, boards.find(b => b.id === boardContextMenu.boardId)?.title || '')}>
            <TypeIcon className="w-3.5 h-3.5 mr-2" />
            Rename
          </button>
          <button onClick={() => handleToggleFavorite(boardContextMenu.boardId)}>
            <Star className={`w-3.5 h-3.5 mr-2 ${boards.find(b => b.id === boardContextMenu.boardId)?.is_favorite ? 'text-yellow-500 fill-yellow-500' : ''}`} />
            {boards.find(b => b.id === boardContextMenu.boardId)?.is_favorite ? 'Unfavorite' : 'Favorite'}
          </button>
          {folders.length > 0 && (
            <button onClick={() => { setMovingBoardId(boardContextMenu.boardId); setBoardContextMenu(null); }}>
              <Folder className="w-3.5 h-3.5 mr-2" />
              Move to folder
            </button>
          )}
          <button onClick={() => handleDuplicateBoard(boardContextMenu.boardId)}>
            <Copy className="w-3.5 h-3.5 mr-2" />
            Duplicate
          </button>
          <div className="h-px bg-border my-1" />
          {deleteConfirmId === boardContextMenu.boardId ? (
            <div className="px-2 py-1.5 space-y-1.5">
              <p className="text-[11px] text-destructive">Delete this board?</p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleDeleteBoard(boardContextMenu.boardId)}
                  className="flex-1 px-2 py-1 rounded bg-destructive/10 text-destructive text-[11px] hover:bg-destructive/20"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-2 py-1 rounded bg-muted text-muted-foreground text-[11px] hover:bg-muted/80"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setDeleteConfirmId(boardContextMenu.boardId)} className="text-destructive hover:!bg-destructive/10">
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Delete
            </button>
          )}
        </div>
      )}

      {/* Folder context menu */}
      {folderContextMenu && (
        <div
          ref={folderContextMenuRef}
          className="flyboard-grid-menu"
          style={{
            position: 'fixed',
            left: Math.min(folderContextMenu.x, window.innerWidth - 180),
            top: Math.min(folderContextMenu.y, window.innerHeight - 120),
            zIndex: 9999,
          }}
        >
          <button onClick={() => handleStartFolderRename(folderContextMenu.folderId, folders.find(f => f.id === folderContextMenu.folderId)?.name || '')}>
            <TypeIcon className="w-3.5 h-3.5 mr-2" />
            Rename Folder
          </button>
          <div className="h-px bg-border my-1" />
          <button onClick={() => { deleteFolder(folderContextMenu.folderId); setFolderContextMenu(null); }} className="text-destructive hover:!bg-destructive/10">
            <Trash2 className="w-3.5 h-3.5 mr-2" />
            Delete Folder
          </button>
        </div>
      )}

      {/* Move to folder picker */}
      {movingBoardId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setMovingBoardId(null)}>
          <div className="bg-card rounded-xl border shadow-xl p-4 w-[280px] max-h-[400px] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold mb-3">Move to folder</h3>
            <button
              onClick={() => handleMoveBoard(movingBoardId, null)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors mb-1"
            >
              No folder (unfiled)
            </button>
            {folders.map(f => (
              <button
                key={f.id}
                onClick={() => handleMoveBoard(movingBoardId, f.id)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors flex items-center gap-2 mb-1"
              >
                <Folder className="w-3.5 h-3.5 text-muted-foreground" />
                {f.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Inline keyframe styles for toast/saved animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translate(-50%, -8px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
        .animate-fade-out {
          animation: fade-out 1s ease-out 1s forwards;
        }
      `}</style>
    </>
  );
}

function formatTimeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}
