import React, { useEffect, useState, useCallback, useRef, useMemo, lazy, Suspense } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Menu, Plus, Loader2, Grid3x3, ChevronDown, Keyboard, X,
  Sun, Moon, Palette, Download, LayoutTemplate, Eye, EyeOff,
  Maximize2, Minimize2, PanelLeftClose,
  Undo2, Redo2, ZoomIn, ZoomOut, PenTool, MousePointer2,
  Square, Circle, ArrowRight, Minus, TypeIcon, Eraser, Hand,
  SlidersHorizontal, Star, Search, MoreHorizontal, Copy, Trash2,
  FolderPlus, Folder, FolderOpen, ChevronRight,
} from 'lucide-react';
import { SEO } from '@/components/SEO.jsx';
import { SmileLogo } from '@/components/SmileLogo.jsx';
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
// CSS font-family strings must match what Excalidraw registers internally
const FONT_OPTIONS = [
  // Handwritten (sketchy, organic feel)
  { id: 1, label: 'Virgil', desc: 'Sketchy notes', category: 'Sketch', css: 'Virgil, cursive' },
  { id: 4, label: 'Excalifont', desc: 'Whiteboard', category: 'Sketch', css: 'Excalifont, cursive' },
  { id: 7, label: 'Comic Shanns', desc: 'Playful', category: 'Sketch', css: '"Comic Shanns", cursive' },
  // Clean (presentations, exports, social)
  { id: 5, label: 'Nunito', desc: 'Slides & thumbnails', category: 'Clean', css: 'Nunito, sans-serif' },
  { id: 6, label: 'Lilita One', desc: 'Bold headlines', category: 'Clean', css: '"Lilita One", sans-serif' },
  { id: 2, label: 'Helvetica', desc: 'Professional', category: 'Clean', css: '"Liberation Sans", Helvetica, sans-serif' },
  // Monospace (code, diagrams, data)
  { id: 3, label: 'Cascadia', desc: 'Code & data', category: 'Mono', css: 'Cascadia, monospace' },
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

// Fill color presets (transparent + 8 chalk colors)
const FILL_COLORS = [
  { id: 'transparent', label: 'No fill', hex: 'transparent' },
  { id: 'yellow', label: 'Yellow', hex: '#f5e6a3' },
  { id: 'blue', label: 'Blue', hex: '#a3c4e8' },
  { id: 'pink', label: 'Pink', hex: '#e8a3b8' },
  { id: 'green', label: 'Green', hex: '#a3d9b1' },
  { id: 'white', label: 'White', hex: '#e8e4df' },
  { id: 'red', label: 'Red', hex: '#e03131' },
  { id: 'orange', label: 'Orange', hex: '#e8590c' },
  { id: 'purple', label: 'Purple', hex: '#7048e8' },
];

// Fill style options
const FILL_STYLES = [
  { id: 'hachure', label: 'Hatch' },
  { id: 'cross-hatch', label: 'Cross' },
  { id: 'solid', label: 'Solid' },
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

// Arrow presets for content creators: frameworks, flowcharts, diagrams
const ARROW_PRESETS = [
  { id: 'sketch',    label: 'Sketch',      roughness: 1, arrowType: 'round', startArrowhead: null,    endArrowhead: 'arrow' },
  { id: 'sharp',     label: 'Sharp',       roughness: 0, arrowType: 'sharp', startArrowhead: null,    endArrowhead: 'triangle' },
  { id: 'elbow',     label: 'Elbow',       roughness: 0, arrowType: 'elbow', startArrowhead: null,    endArrowhead: 'triangle' },
  { id: 'both',      label: 'Both ways',   roughness: 0, arrowType: 'sharp', startArrowhead: 'arrow', endArrowhead: 'arrow' },
  { id: 'connector', label: 'Connector',   roughness: 0, arrowType: 'sharp', startArrowhead: null,    endArrowhead: null },
  { id: 'dot',       label: 'Dot end',     roughness: 0, arrowType: 'sharp', startArrowhead: null,    endArrowhead: 'dot' },
  { id: 'bar',       label: 'Bar end',     roughness: 0, arrowType: 'sharp', startArrowhead: null,    endArrowhead: 'bar' },
  { id: 'dot-both',  label: 'Dot both',    roughness: 0, arrowType: 'sharp', startArrowhead: 'dot',   endArrowhead: 'dot' },
];

// Stroke width options
const STROKE_WIDTHS = [
  { id: 1, label: 'Thin' },
  { id: 2, label: 'Medium' },
  { id: 4, label: 'Thick' },
];

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

/** SVG icon for each arrow preset */
function ArrowPresetIcon({ preset, size = 18 }) {
  const s = size;
  // Arrowhead markers
  const endHead = (x, y, dir = 'right') => {
    if (!preset.endArrowhead) return null;
    if (preset.endArrowhead === 'dot') return <circle cx={x} cy={y} r={2.5} fill="currentColor" />;
    if (preset.endArrowhead === 'bar') return <line x1={x} y1={y - 4} x2={x} y2={y + 4} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />;
    // arrow or triangle
    if (dir === 'up') return <polygon points={`${x},${y - 3} ${x - 3},${y + 2} ${x + 3},${y + 2}`} fill="currentColor" />;
    return <polygon points={`${x + 2},${y} ${x - 3},${y - 3} ${x - 2},${y + 3}`} fill="currentColor" />;
  };
  const startHead = (x, y) => {
    if (!preset.startArrowhead) return null;
    if (preset.startArrowhead === 'dot') return <circle cx={x} cy={y} r={2.5} fill="currentColor" />;
    if (preset.startArrowhead === 'bar') return <line x1={x} y1={y - 4} x2={x} y2={y + 4} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />;
    return <polygon points={`${x - 2},${y} ${x + 3},${y - 3} ${x + 2},${y + 3}`} fill="currentColor" />;
  };

  const vb = `0 0 ${s} ${s}`;
  const sw = 1.5;
  const midY = s * 0.55;

  if (preset.arrowType === 'round' || preset.id === 'sketch') {
    return (
      <svg width={s} height={s} viewBox={vb} fill="none" className="text-current">
        <path d={`M3 ${midY + 3} Q${s * 0.35} ${midY - 3} ${s * 0.5} ${midY} Q${s * 0.65} ${midY + 3} ${s - 5} ${midY - 2}`} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" fill="none" />
        {endHead(s - 3, midY - 2)}
        {startHead(3, midY + 3)}
      </svg>
    );
  }
  if (preset.arrowType === 'elbow') {
    return (
      <svg width={s} height={s} viewBox={vb} fill="none" className="text-current">
        <polyline points={`3,${midY + 2} ${s * 0.55},${midY + 2} ${s * 0.55},${midY - 4}`} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {endHead(s * 0.55, midY - 5, 'up')}
        {startHead(3, midY + 2)}
      </svg>
    );
  }
  // sharp / default: straight line
  return (
    <svg width={s} height={s} viewBox={vb} fill="none" className="text-current">
      <line x1={4} y1={midY} x2={s - 5} y2={midY} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" />
      {endHead(s - 3, midY)}
      {startHead(4, midY)}
    </svg>
  );
}

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
    registerCanvas, lastBoardAction,
  } = useBoardContext();

  const [searchParams, setSearchParams] = useSearchParams();
  // Sidebar is overlay-only, always starts closed. Clean up old localStorage key.
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try { localStorage.removeItem('flyboard-sidebar'); } catch {}
    return false;
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

  // Fill color and style state (persisted to localStorage)
  const [fillColor, setFillColor] = useState(() => localStorage.getItem('flyboard-fill-color') || 'transparent');
  const [fillStyle, setFillStyle] = useState(() => localStorage.getItem('flyboard-fill-style') || 'hachure');

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

  // Style controls (persisted to localStorage)
  const [strokeWidth, setStrokeWidth] = useState(() => parseInt(localStorage.getItem('flyboard-stroke-width') || '2', 10));
  const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem('flyboard-font-size') || '20', 10));
  const [arrowPreset, setArrowPreset] = useState(() => localStorage.getItem('flyboard-arrow-preset') || 'sketch');
  const [strokeWidthMenuOpen, setStrokeWidthMenuOpen] = useState(false);
  const [inlineColorMenuOpen, setInlineColorMenuOpen] = useState(false);
  const [inlineFontMenuOpen, setInlineFontMenuOpen] = useState(false);
  const [arrowMenuOpen, setArrowMenuOpen] = useState(false);
  const [fillMenuOpen, setFillMenuOpen] = useState(false);
  const strokeWidthMenuRef = useRef(null);
  const inlineColorMenuRef = useRef(null);
  const inlineFontMenuRef = useRef(null);
  const arrowMenuRef = useRef(null);
  const fillMenuRef = useRef(null);

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

  // Lock body scroll when sidebar or bottom sheet is open (prevents iOS scroll-behind)
  useEffect(() => {
    if (sidebarOpen || mobileToolsOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [sidebarOpen, mobileToolsOpen]);



  // Close dropdowns and context menus on outside click
  useEffect(() => {
    if (!gridMenuOpen && !bgMenuOpen && !fontMenuOpen && !colorMenuOpen && !symbolMenuOpen && !emojiMenuOpen && !boardContextMenu && !folderContextMenu && !strokeWidthMenuOpen && !inlineColorMenuOpen && !inlineFontMenuOpen && !arrowMenuOpen && !fillMenuOpen) return;
    const handler = (e) => {
      if (gridMenuOpen && gridMenuRef.current && !gridMenuRef.current.contains(e.target)) setGridMenuOpen(false);
      if (bgMenuOpen && bgMenuRef.current && !bgMenuRef.current.contains(e.target)) setBgMenuOpen(false);
      if (colorMenuOpen && colorMenuRef.current && !colorMenuRef.current.contains(e.target)) setColorMenuOpen(false);
      if (fontMenuOpen && fontMenuRef.current && !fontMenuRef.current.contains(e.target)) setFontMenuOpen(false);
      if (symbolMenuOpen && symbolMenuRef.current && !symbolMenuRef.current.contains(e.target)) setSymbolMenuOpen(false);
      if (emojiMenuOpen && emojiMenuRef.current && !emojiMenuRef.current.contains(e.target)) setEmojiMenuOpen(false);
      if (boardContextMenu && contextMenuRef.current && !contextMenuRef.current.contains(e.target)) setBoardContextMenu(null);
      if (folderContextMenu && folderContextMenuRef.current && !folderContextMenuRef.current.contains(e.target)) setFolderContextMenu(null);
      if (strokeWidthMenuOpen && strokeWidthMenuRef.current && !strokeWidthMenuRef.current.contains(e.target)) setStrokeWidthMenuOpen(false);
      if (inlineColorMenuOpen && inlineColorMenuRef.current && !inlineColorMenuRef.current.contains(e.target)) setInlineColorMenuOpen(false);
      if (inlineFontMenuOpen && inlineFontMenuRef.current && !inlineFontMenuRef.current.contains(e.target)) setInlineFontMenuOpen(false);
      if (arrowMenuOpen && arrowMenuRef.current && !arrowMenuRef.current.contains(e.target)) setArrowMenuOpen(false);
      if (fillMenuOpen && fillMenuRef.current && !fillMenuRef.current.contains(e.target)) setFillMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [gridMenuOpen, bgMenuOpen, fontMenuOpen, colorMenuOpen, symbolMenuOpen, emojiMenuOpen, boardContextMenu, folderContextMenu, strokeWidthMenuOpen, inlineColorMenuOpen, inlineFontMenuOpen, arrowMenuOpen, fillMenuOpen]);

  // Init board context on mount (guests get localStorage mode automatically)
  useEffect(() => {
    initBoard();
  }, [initBoard]);

  // Auto-create first board when none exist (Figma-style instant start)
  useEffect(() => {
    if (!isInitialized || boards.length > 0) return;
    // Prevent infinite retries if creation fails
    if (sessionStorage.getItem('flyboard-autocreated')) return;
    sessionStorage.setItem('flyboard-autocreated', '1');
    (async () => {
      const board = await createBoard({ title: 'Untitled Board' });
      if (board) await openBoard(board.id);
    })();
  }, [isInitialized, boards.length, createBoard, openBoard]);

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

  // Register canvas ref with BoardContext for FlyBot integration
  // Re-register whenever active board changes (ensures ref is up to date)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (excalidrawRef.current) {
        registerCanvas(excalidrawRef.current);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [activeBoard?.id, registerCanvas]);

  // Handle FlyBot template load actions
  useEffect(() => {
    if (!lastBoardAction) return;
    if (lastBoardAction.type === 'load_template') {
      // Dynamically import templates and load the requested one
      import('@/lib/data/boardTemplates.js').then(mod => {
        const template = mod.boardTemplates?.find(t => t.id === lastBoardAction.template);
        if (template) {
          handleTemplateSelect(template);
        } else {
          setToast(`Template "${lastBoardAction.template}" not found`);
          if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
          toastTimerRef.current = setTimeout(() => setToast(null), 2000);
        }
      });
    } else if (lastBoardAction.type === 'add_elements') {
      setToast(`FlyBot added ${lastBoardAction.count} element${lastBoardAction.count > 1 ? 's' : ''}`);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setToast(null), 2000);
    } else if (lastBoardAction.type === 'clear') {
      setToast('FlyBot cleared the board');
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setToast(null), 2000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastBoardAction]);

  // Fullscreen API integration
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Refs for keyboard shortcuts (declared early, effect registered after handlers)
  const prevToolRef = useRef('selection');
  const spaceDownRef = useRef(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

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

  // When background changes and manual color clashes, auto-switch to 'auto'
  const prevBgRef = useRef(resolvedBgColor);
  useEffect(() => {
    const prevBg = prevBgRef.current;
    prevBgRef.current = resolvedBgColor;
    if (strokeColorMode === 'auto' || prevBg === resolvedBgColor) return;

    const manualHex = STROKE_COLORS.find(c => c.id === strokeColorMode)?.hex;
    if (!manualHex) return;
    try {
      const mR = parseInt(manualHex.slice(1, 3), 16), mG = parseInt(manualHex.slice(3, 5), 16), mB = parseInt(manualHex.slice(5, 7), 16);
      const mLum = (0.299 * mR + 0.587 * mG + 0.114 * mB) / 255;
      const bR = parseInt(resolvedBgColor.slice(1, 3), 16), bG = parseInt(resolvedBgColor.slice(3, 5), 16), bB = parseInt(resolvedBgColor.slice(5, 7), 16);
      const bLum = (0.299 * bR + 0.587 * bG + 0.114 * bB) / 255;
      if ((mLum < 0.4 && bLum < 0.4) || (mLum > 0.6 && bLum > 0.6)) {
        setStrokeColorMode('auto');
        localStorage.setItem('flyboard-stroke-color', 'auto');
      }
    } catch {}
  }, [resolvedBgColor, strokeColorMode]);

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

  // Helper: get Excalidraw API (prefers raw API from getAPI(), falls back to imperative handle)
  const getExcalidrawAPI = useCallback(() => {
    const handle = excalidrawRef.current;
    if (!handle) return null;
    return handle.getAPI?.() || handle;
  }, []);

  // Shared utility: apply props to selected elements (optionally filter by type)
  // Returns number of elements changed (0 = nothing selected/matched)
  const applyToSelected = useCallback((props, filter) => {
    const api = getExcalidrawAPI();
    if (!api?.getSceneElements || !api?.getAppState) return 0;
    const appState = api.getAppState();
    const elements = api.getSceneElements();
    const selectedIds = appState.selectedElementIds || {};
    let changed = 0;
    const updated = elements.map(el => {
      if (!selectedIds[el.id] || el.isDeleted) return el;
      if (filter && !filter(el)) return el;
      changed++;
      return { ...el, ...props };
    });
    if (changed) api.updateScene({ elements: updated });
    return changed;
  }, [getExcalidrawAPI]);

  const handleBgChange = useCallback((presetId) => {
    setBgPreset(presetId);
    localStorage.setItem('flyboard-bg-preset', presetId);
    setBgMenuOpen(false);
    trackEvent('flyboard_bg_changed', { bg_preset: presetId });
  }, []);

  const handleFontChange = useCallback((fontId) => {
    setFontFamily(fontId);
    localStorage.setItem('flyboard-font', String(fontId));
    setFontMenuOpen(false);
    setInlineFontMenuOpen(false);
    const api = getExcalidrawAPI();
    if (api?.updateScene) {
      api.updateScene({ appState: { currentItemFontFamily: fontId } });
    }
    applyToSelected({ fontFamily: fontId }, el => el.type === 'text');
    trackEvent('flyboard_font_changed', { font_id: fontId });
  }, [getExcalidrawAPI, applyToSelected]);

  const handleStrokeColorChange = useCallback((colorId) => {
    setStrokeColorMode(colorId);
    localStorage.setItem('flyboard-stroke-color', colorId);
    setColorMenuOpen(false);
    setInlineColorMenuOpen(false);
    const hex = colorId === 'auto'
      ? getContrastStroke(resolvedBgColor)
      : (STROKE_COLORS.find(c => c.id === colorId)?.hex);
    if (hex) {
      const api = getExcalidrawAPI();
      if (api?.updateScene) {
        api.updateScene({ appState: { currentItemStrokeColor: hex } });
      }
      applyToSelected({ strokeColor: hex });
    }
    trackEvent('flyboard_stroke_color_changed', { color: colorId });
  }, [resolvedBgColor, getExcalidrawAPI, applyToSelected]);

  const handleFillColorChange = useCallback((colorId) => {
    setFillColor(colorId);
    localStorage.setItem('flyboard-fill-color', colorId);
    setFillMenuOpen(false);
    const hex = FILL_COLORS.find(c => c.id === colorId)?.hex || 'transparent';
    const api = getExcalidrawAPI();
    if (api?.updateScene) {
      api.updateScene({ appState: { currentItemBackgroundColor: hex } });
    }
    applyToSelected({ backgroundColor: hex }, el => el.type !== 'text' && el.type !== 'arrow' && el.type !== 'line');
    trackEvent('flyboard_fill_color_changed', { color: colorId });
  }, [getExcalidrawAPI, applyToSelected]);

  const handleFillStyleChange = useCallback((styleId) => {
    setFillStyle(styleId);
    localStorage.setItem('flyboard-fill-style', styleId);
    const api = getExcalidrawAPI();
    if (api?.updateScene) {
      api.updateScene({ appState: { currentItemFillStyle: styleId } });
    }
    applyToSelected({ fillStyle: styleId }, el => el.type !== 'text' && el.type !== 'arrow' && el.type !== 'line');
    trackEvent('flyboard_fill_style_changed', { fill_style: styleId });
  }, [getExcalidrawAPI, applyToSelected]);

  const handleStrokeWidthChange = useCallback((width) => {
    setStrokeWidth(width);
    localStorage.setItem('flyboard-stroke-width', String(width));
    setStrokeWidthMenuOpen(false);
    const api = getExcalidrawAPI();
    if (api?.updateScene) {
      api.updateScene({ appState: { currentItemStrokeWidth: width } });
    }
    applyToSelected({ strokeWidth: width });
    trackEvent('flyboard_stroke_width_changed', { width });
  }, [getExcalidrawAPI, applyToSelected]);

  const handleArrowPresetSelect = useCallback((presetId) => {
    const preset = ARROW_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    setArrowPreset(preset.id);
    localStorage.setItem('flyboard-arrow-preset', preset.id);
    const api = getExcalidrawAPI();
    if (api?.updateScene) {
      api.updateScene({
        appState: {
          currentItemRoughness: preset.roughness,
          currentItemEndArrowhead: preset.endArrowhead,
          currentItemStartArrowhead: preset.startArrowhead,
        },
      });
    }
    applyToSelected(
      {
        roughness: preset.roughness,
        roundness: preset.arrowType === 'round' ? { type: 2 } : null,
        startArrowhead: preset.startArrowhead,
        endArrowhead: preset.endArrowhead,
      },
      el => el.type === 'arrow'
    );
    trackEvent('flyboard_arrow_preset_changed', { preset: preset.id });
  }, [getExcalidrawAPI, applyToSelected]);

  // Compute derived arrow preset properties for ExcalidrawCanvas
  const activeArrowPreset = ARROW_PRESETS.find(p => p.id === arrowPreset) || ARROW_PRESETS[0];

  // Font size change: applies to selected text + sets default for new text
  const handleFontSizeChange = useCallback((direction) => {
    const api = getExcalidrawAPI();
    if (!api?.getSceneElements || !api?.getAppState) return;

    const appState = api.getAppState();
    const elements = api.getSceneElements();
    const selectedIds = appState.selectedElementIds || {};
    const selectedText = elements.filter(el => selectedIds[el.id] && !el.isDeleted && el.type === 'text');

    if (selectedText.length > 0) {
      // Resize selected text elements
      const updated = elements.map(el => {
        if (!selectedIds[el.id] || el.isDeleted || el.type !== 'text') return el;
        const idx = FONT_SIZES.findIndex(s => s >= el.fontSize);
        const newIdx = direction === 'up'
          ? Math.min((idx >= 0 ? idx : 3) + 1, FONT_SIZES.length - 1)
          : Math.max((idx >= 0 ? idx : 3) - 1, 0);
        return { ...el, fontSize: FONT_SIZES[newIdx] };
      });
      api.updateScene({ elements: updated });
    }

    // Also update the default font size for new text
    const curIdx = FONT_SIZES.findIndex(s => s >= fontSize);
    const newIdx = direction === 'up'
      ? Math.min((curIdx >= 0 ? curIdx : 3) + 1, FONT_SIZES.length - 1)
      : Math.max((curIdx >= 0 ? curIdx : 3) - 1, 0);
    const newSize = FONT_SIZES[newIdx];
    setFontSize(newSize);
    localStorage.setItem('flyboard-font-size', String(newSize));
    api.updateScene({ appState: { currentItemFontSize: newSize } });

    if (selectedText.length === 0) {
      setToast(`Default text size: ${newSize}px`);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setToast(null), 1500);
    }
  }, [getExcalidrawAPI, fontSize]);

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
    // Lock drawing tools so they stay active for multiple placements
    const nonLockedTools = ['selection', 'eraser', 'hand'];
    const locked = !nonLockedTools.includes(toolId);
    if (excalidrawRef.current?.setTool) {
      excalidrawRef.current.setTool(toolId, { locked });
    } else {
      setToast('Board is loading, try again in a moment');
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setToast(null), 2000);
    }
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

  // Keyboard shortcuts: tool switching, undo/redo, zoom, fullscreen, help overlay
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;

      if (e.key === 'F11') { e.preventDefault(); toggleFullscreen(); return; }
      if (e.key === '?' || (e.shiftKey && e.key === '/')) { e.preventDefault(); setShowShortcuts(prev => !prev); return; }

      if (e.key === 'Escape') {
        if (showShortcuts) { setShowShortcuts(false); return; }
        if (mobileToolsOpen) { setMobileToolsOpen(false); return; }
        if (sidebarOpen) { setSidebarOpen(false); return; }
        handleToolSelect('selection');
        return;
      }

      if (e.code === 'Space' && !e.repeat && !spaceDownRef.current) {
        e.preventDefault();
        spaceDownRef.current = true;
        prevToolRef.current = activeTool;
        handleToolSelect('hand');
        return;
      }

      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'z' && e.shiftKey) { e.preventDefault(); handleRedo(); return; }
        if (e.key === 'z') { e.preventDefault(); handleUndo(); return; }
        if (e.key === '=' || e.key === '+') { e.preventDefault(); handleZoomIn(); return; }
        if (e.key === '-') { e.preventDefault(); handleZoomOut(); return; }
        return;
      }

      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        const key = e.key.toUpperCase();
        const tool = DRAW_TOOLS.find(t => t.shortcut === key);
        if (tool) { e.preventDefault(); handleToolSelect(tool.id); return; }
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space' && spaceDownRef.current) {
        spaceDownRef.current = false;
        handleToolSelect(prevToolRef.current);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeTool, showShortcuts, mobileToolsOpen, sidebarOpen, handleToolSelect, handleUndo, handleRedo, handleZoomIn, handleZoomOut, toggleFullscreen]);

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

  // Render a single board item (sidebar overlay)
  const renderBoardItem = (board) => {
    const isActive = activeBoard?.id === board.id;
    const isRenaming = renamingBoardId === board.id;

    const handleBoardClick = (e) => {
      e.preventDefault();
      openBoard(board.id);
      setSidebarOpen(false);
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

  // Render sidebar content (overlay only, always mobile-style)
  const renderSidebarContent = () => {
    return (
      <>
        {/* Search + Actions */}
        <div className="p-3 border-b space-y-2">
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
              onClick={() => { handleNewBoard(); setSidebarOpen(false); }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-muted/50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Board
            </button>
            <button
              onClick={() => { setTemplatePickerOpen(true); setSidebarOpen(false); }}
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
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-none">
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
                  {filteredBoards.favorites.map(b => renderBoardItem(b))}
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
                          folderBoards.map(b => renderBoardItem(b))
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
                  {boardsByFolder.unfiled.map(b => renderBoardItem(b))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t">
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
        {/* Sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-[52] bg-black/40 backdrop-blur-[2px]" onClick={() => setSidebarOpen(false)}>
            <div
              className="absolute left-0 top-0 bottom-0 w-[280px] sm:w-[300px] bg-card border-r flex flex-col shadow-2xl animate-slide-in-left"
              onClick={e => e.stopPropagation()}
            >
              {renderSidebarContent()}
            </div>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden relative">
          {/* ---- Main canvas area ---- */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Toolbar: single clean row, overflow menu catches the rest */}
            <div className="flyboard-toolbar flex items-center px-2 sm:px-3 h-[48px] border-b shrink-0">
              {/* Left: logo + sidebar toggle + title */}
              <div className="flex items-center gap-1 min-w-0 shrink-0">
                <Link to="/" className="flyboard-tb-btn !w-auto !px-1.5 gap-1 text-foreground hover:text-primary" title="Fly Labs home">
                  <SmileLogo className="w-5 h-5 text-primary" />
                  <span className="hidden sm:inline text-[12px] font-bold tracking-tight">Fly Labs</span>
                </Link>

                <div className="w-px h-5 bg-border/50 mx-0.5" />

                <button
                  onClick={() => setSidebarOpen(prev => !prev)}
                  className="flyboard-tb-btn"
                  title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                  aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                >
                  {sidebarOpen ? <PanelLeftClose className="w-[18px] h-[18px]" /> : <Menu className="w-[18px] h-[18px]" />}
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

              {/* CENTER: Drawing tools pill + overflow */}
              <div className="flex items-center gap-1 flex-1 min-w-0 ml-2 sm:ml-3 mr-1 justify-center">
                <div className="flyboard-tool-pill">
                  {DRAW_TOOLS.map(tool => {
                    const Icon = tool.icon;
                    // Mobile: 3 tools (selection, freedraw, text)
                    const isMobileCore = ['selection', 'freedraw', 'text'].includes(tool.id);
                    // Tablet (sm): add rectangle, ellipse, arrow, eraser
                    const isTabletExtra = ['rectangle', 'ellipse', 'arrow', 'eraser'].includes(tool.id);
                    // Desktop (lg): add line, hand (all 9 tools)
                    const isDesktopExtra = ['line', 'hand'].includes(tool.id);
                    const visibilityClass = isMobileCore
                      ? ''
                      : isTabletExtra
                        ? '!hidden sm:!inline-flex'
                        : isDesktopExtra
                          ? '!hidden lg:!inline-flex'
                          : '';
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

                  {/* Style controls separator + inline controls */}
                  <div className="flyboard-style-sep" />

                  {/* Inline color dot (always visible) */}
                  <div ref={inlineColorMenuRef} className="relative">
                    <button
                      onClick={() => { setInlineColorMenuOpen(p => !p); setStrokeWidthMenuOpen(false); setInlineFontMenuOpen(false); }}
                      className="flyboard-tb-btn"
                      title={`Stroke color: ${strokeColorMode === 'auto' ? 'Auto' : STROKE_COLORS.find(c => c.id === strokeColorMode)?.label || 'Auto'}`}
                    >
                      <span
                        className="w-4 h-4 rounded-full ring-2 ring-white/80 dark:ring-white/20"
                        style={{
                          backgroundColor: strokeColorMode === 'auto' ? resolvedStrokeColor : (STROKE_COLORS.find(c => c.id === strokeColorMode)?.hex || resolvedStrokeColor),
                          ...(strokeColorMode === 'auto' ? { background: 'conic-gradient(#e8e4df 0deg, #e8e4df 180deg, #1e1e1e 180deg, #1e1e1e 360deg)' } : {}),
                        }}
                      />
                    </button>
                    {inlineColorMenuOpen && (
                      <div
                        className="absolute top-full mt-1.5 z-[100] p-3 rounded-xl shadow-xl"
                        style={{
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: isDark ? '#1e1e24' : '#ffffff',
                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                        }}
                      >
                        <div className="grid grid-cols-5 gap-2.5" style={{ width: 'max-content' }}>
                          {STROKE_COLORS.map(color => (
                            <button
                              key={color.id}
                              onClick={() => handleStrokeColorChange(color.id)}
                              className="flex items-center justify-center"
                              title={color.label}
                              style={{ width: 32, height: 32 }}
                            >
                              <span
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: '50%',
                                  border: strokeColorMode === color.id
                                    ? '2.5px solid hsl(142 72% 50%)'
                                    : `2px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}`,
                                  boxShadow: strokeColorMode === color.id ? '0 0 0 3px rgba(50,190,100,0.25)' : 'none',
                                  backgroundColor: color.hex || 'transparent',
                                  ...(color.id === 'auto' ? { background: 'conic-gradient(#e8e4df 0deg, #e8e4df 180deg, #1e1e1e 180deg, #1e1e1e 360deg)' } : {}),
                                }}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Fill color picker (after stroke color, hidden on mobile) */}
                  <div ref={fillMenuRef} className="relative hidden sm:block">
                    <button
                      onClick={() => { setFillMenuOpen(p => !p); setInlineColorMenuOpen(false); setStrokeWidthMenuOpen(false); setInlineFontMenuOpen(false); }}
                      className="flyboard-tb-btn"
                      title={`Fill: ${fillColor === 'transparent' ? 'None' : FILL_COLORS.find(c => c.id === fillColor)?.label || 'None'}`}
                    >
                      <span
                        className="w-4 h-4 rounded"
                        style={{
                          backgroundColor: fillColor === 'transparent' ? 'transparent' : (FILL_COLORS.find(c => c.id === fillColor)?.hex || 'transparent'),
                          border: `2px solid ${isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'}`,
                          ...(fillColor === 'transparent' ? {
                            background: `linear-gradient(135deg, transparent 45%, ${isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'} 45%, ${isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'} 55%, transparent 55%)`,
                          } : {}),
                        }}
                      />
                    </button>
                    {fillMenuOpen && (
                      <div
                        className="absolute top-full mt-1.5 z-[100] p-3 rounded-xl shadow-xl"
                        style={{
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: isDark ? '#1e1e24' : '#ffffff',
                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                        }}
                      >
                        <div className="grid grid-cols-3 gap-2" style={{ width: 'max-content' }}>
                          {FILL_COLORS.map(color => (
                            <button
                              key={color.id}
                              onClick={() => handleFillColorChange(color.id)}
                              className="flex items-center justify-center"
                              title={color.label}
                              style={{ width: 32, height: 32 }}
                            >
                              <span
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: 4,
                                  border: fillColor === color.id
                                    ? '2.5px solid hsl(142 72% 50%)'
                                    : `2px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}`,
                                  boxShadow: fillColor === color.id ? '0 0 0 3px rgba(50,190,100,0.25)' : 'none',
                                  backgroundColor: color.hex === 'transparent' ? 'transparent' : color.hex,
                                  ...(color.id === 'transparent' ? {
                                    background: `linear-gradient(135deg, transparent 45%, ${isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)'} 45%, ${isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)'} 55%, transparent 55%)`,
                                  } : {}),
                                }}
                              />
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-1 mt-2 pt-2 border-t border-border/30">
                          {FILL_STYLES.map(style => (
                            <button
                              key={style.id}
                              onClick={() => handleFillStyleChange(style.id)}
                              className={`flex-1 py-1 rounded text-[10px] font-medium transition-colors ${
                                fillStyle === style.id
                                  ? 'bg-primary/15 text-primary'
                                  : 'text-muted-foreground hover:bg-muted/50'
                              }`}
                            >
                              {style.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Font size A-/A+ (always visible, compact on mobile) */}
                  <button
                    onClick={() => handleFontSizeChange('down')}
                    className="flyboard-tb-btn !w-[28px] sm:!w-[36px] text-[11px] font-bold"
                    title={`Decrease text size (${fontSize}px)`}
                  >
                    A-
                  </button>
                  <button
                    onClick={() => handleFontSizeChange('up')}
                    className="flyboard-tb-btn !w-[28px] sm:!w-[36px] text-[13px] font-bold"
                    title={`Increase text size (${fontSize}px)`}
                  >
                    A+
                  </button>

                  {/* Stroke width icon (sm+) */}
                  <div ref={strokeWidthMenuRef} className="relative hidden sm:block">
                    <button
                      onClick={() => { setStrokeWidthMenuOpen(p => !p); setInlineColorMenuOpen(false); setInlineFontMenuOpen(false); }}
                      className="flyboard-tb-btn"
                      title={`Stroke width: ${STROKE_WIDTHS.find(w => w.id === strokeWidth)?.label || 'Medium'}`}
                    >
                      {/* 3 stacked lines icon (thin/med/thick) */}
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-current">
                        <line x1="2" y1="4" x2="14" y2="4" stroke="currentColor" strokeWidth={strokeWidth === 1 ? 2 : 1} strokeLinecap="round" />
                        <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth={strokeWidth === 2 ? 2.5 : 1.5} strokeLinecap="round" />
                        <line x1="2" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth={strokeWidth === 4 ? 3.5 : 2.5} strokeLinecap="round" />
                      </svg>
                    </button>
                    {strokeWidthMenuOpen && (
                      <div className="flyboard-grid-menu !min-w-[120px]" style={{ left: '50%', transform: 'translateX(-50%)' }}>
                        {STROKE_WIDTHS.map(w => (
                          <button
                            key={w.id}
                            onClick={() => handleStrokeWidthChange(w.id)}
                            className={strokeWidth === w.id ? 'active' : ''}
                          >
                            <span className="w-5 flex items-center justify-center mr-2">
                              <span className="w-4 rounded-full bg-current" style={{ height: `${Math.max(w.id, 1.5)}px` }} />
                            </span>
                            {w.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Font picker (sm+) */}
                  <div ref={inlineFontMenuRef} className="relative hidden sm:flex items-center">
                    <div className="flyboard-style-sep" />
                    <button
                      onClick={() => { setInlineFontMenuOpen(p => !p); setInlineColorMenuOpen(false); setStrokeWidthMenuOpen(false); }}
                      className="flyboard-tb-btn flyboard-tb-dropdown text-[11px] font-medium"
                      title={`Font: ${FONT_OPTIONS.find(f => f.id === fontFamily)?.label || 'Virgil'}`}
                    >
                      <span className="hidden lg:inline text-[12px]" style={{ fontFamily: FONT_OPTIONS.find(f => f.id === fontFamily)?.css }}>{(FONT_OPTIONS.find(f => f.id === fontFamily)?.label || 'Virgil')}</span>
                      <span className="lg:hidden text-[12px]" style={{ fontFamily: FONT_OPTIONS.find(f => f.id === fontFamily)?.css }}>Aa</span>
                    </button>
                    {inlineFontMenuOpen && (
                      <div
                        className="absolute top-full mt-1.5 z-[100] rounded-xl shadow-xl overflow-hidden"
                        style={{
                          left: '50%', transform: 'translateX(-50%)',
                          background: isDark ? '#1e1e24' : '#ffffff',
                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                          minWidth: 220,
                        }}
                      >
                        {['Sketch', 'Clean', 'Mono'].map(cat => (
                          <div key={cat}>
                            <p className="text-[9px] text-muted-foreground/40 uppercase tracking-[0.15em] font-semibold px-3 pt-2.5 pb-1">{cat}</p>
                            {FONT_OPTIONS.filter(f => f.category === cat).map(f => (
                              <button
                                key={f.id}
                                onClick={() => handleFontChange(f.id)}
                                className={`flex items-center gap-3 w-full px-3 py-2 text-left transition-colors ${
                                  fontFamily === f.id
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-foreground hover:bg-muted/50'
                                }`}
                              >
                                <span className="text-[15px] leading-none w-[110px] truncate" style={{ fontFamily: f.css }}>{f.label}</span>
                                <span className="text-[10px] text-muted-foreground/50 ml-auto whitespace-nowrap">{f.desc}</span>
                              </button>
                            ))}
                          </div>
                        ))}
                        <div className="border-t border-border/30 px-3 py-1.5">
                          <p className="text-[9px] text-muted-foreground/30 text-center">Excalidraw native toolbar has more fonts</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Arrow style picker (sm+) */}
                  <div ref={arrowMenuRef} className="relative hidden sm:flex items-center">
                    <div className="flyboard-style-sep" />
                    <button
                      onClick={() => { setArrowMenuOpen(p => !p); setInlineColorMenuOpen(false); setStrokeWidthMenuOpen(false); setInlineFontMenuOpen(false); }}
                      className="flyboard-tb-btn"
                      title={`Arrow style: ${activeArrowPreset.label}`}
                    >
                      <ArrowPresetIcon preset={activeArrowPreset} size={18} />
                    </button>
                    {arrowMenuOpen && (
                      <div
                        className="absolute top-full mt-1.5 z-[100] p-2 rounded-xl shadow-xl"
                        style={{
                          right: 0,
                          background: isDark ? '#1e1e24' : '#ffffff',
                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                          minWidth: 200,
                        }}
                      >
                        <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium px-2 pt-1 pb-2">Arrow Style</p>
                        <div className="grid grid-cols-2 gap-1">
                          {ARROW_PRESETS.map(preset => (
                            <button
                              key={preset.id}
                              onClick={() => { handleArrowPresetSelect(preset.id); setArrowMenuOpen(false); }}
                              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors ${
                                arrowPreset === preset.id
                                  ? 'bg-primary/15 text-primary font-medium'
                                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                              }`}
                            >
                              <ArrowPresetIcon preset={preset} size={20} />
                              <span>{preset.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Overflow: always visible, opens bottom sheet with everything else */}
                <button
                  onClick={() => setMobileToolsOpen(true)}
                  className="flyboard-tb-btn"
                  title="More tools"
                >
                  <MoreHorizontal className="w-[18px] h-[18px]" />
                </button>
              </div>

              {/* RIGHT: Export + Native UI + Fullscreen + Help */}
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
                  className={`flyboard-tb-btn flyboard-native-toggle hidden sm:inline-flex ${showExcalidrawUI ? 'active' : ''}`}
                  title={showExcalidrawUI ? 'Hide native toolbar' : 'Show native Excalidraw toolbar (colors, links, images, LaTeX math)'}
                >
                  <SlidersHorizontal className="w-[18px] h-[18px]" />
                </button>

                <button
                  onClick={toggleTheme}
                  className="flyboard-tb-btn hidden sm:inline-flex"
                  title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="flyboard-tb-btn hidden sm:inline-flex"
                  title={isFullscreen ? 'Exit fullscreen (F11)' : 'Fullscreen (F11)'}
                >
                  {isFullscreen ? <Minimize2 className="w-[18px] h-[18px]" /> : <Maximize2 className="w-[18px] h-[18px]" />}
                </button>

                <button
                  onClick={() => setShowShortcuts(prev => !prev)}
                  className={`flyboard-tb-btn hidden sm:inline-flex ${showShortcuts ? 'active' : ''}`}
                  title="Keyboard shortcuts (?)"
                >
                  <Keyboard className="w-[18px] h-[18px]" />
                </button>

                {!isAuthenticated && (
                  <Link to="/login" className="text-[11px] text-primary hover:underline ml-1 whitespace-nowrap font-medium">
                    Sign in
                  </Link>
                )}
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 relative">
              {/* Toast notification */}
              {toast && (
                <div role="status" aria-live="polite" className="absolute top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-foreground/10 backdrop-blur-md border border-border text-sm text-foreground/80 shadow-lg animate-fade-in">
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
                  strokeWidth={strokeWidth}
                  roughness={activeArrowPreset.roughness}
                  fontSize={fontSize}
                  startArrowhead={activeArrowPreset.startArrowhead}
                  endArrowhead={activeArrowPreset.endArrowhead}
                  fillColor={FILL_COLORS.find(c => c.id === fillColor)?.hex || 'transparent'}
                  fillStyle={fillStyle}
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

            {/* Undo / Redo */}
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium mb-2">History</p>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => { handleUndo(); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-muted-foreground hover:bg-muted border border-border/50"
              >
                <Undo2 className="w-5 h-5" />
                <span className="text-xs">Undo</span>
              </button>
              <button
                onClick={() => { handleRedo(); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-muted-foreground hover:bg-muted border border-border/50"
              >
                <Redo2 className="w-5 h-5" />
                <span className="text-xs">Redo</span>
              </button>
            </div>

            {/* Drawing tools - ALL tools available here */}
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium mb-2">Drawing Tools</p>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {DRAW_TOOLS.map(tool => {
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
            <div className="space-y-1 mb-4">
              {FONT_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleFontChange(opt.id)}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-colors ${
                    fontFamily === opt.id ? 'bg-primary/15 text-primary' : 'text-foreground hover:bg-muted/50 border border-border/30'
                  }`}
                >
                  <span className="text-[15px] leading-none truncate" style={{ fontFamily: opt.css }}>{opt.label}</span>
                  <span className="text-[10px] text-muted-foreground/50 ml-auto whitespace-nowrap">{opt.desc}</span>
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

            {/* Fill Color */}
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium mb-2">Fill Color</p>
            <div className="flex items-center gap-2 mb-2">
              {FILL_COLORS.map(color => (
                <button
                  key={color.id}
                  onClick={() => handleFillColorChange(color.id)}
                  className="flex items-center justify-center"
                  title={color.label}
                >
                  <span
                    className={`w-7 h-7 rounded border-2 transition-transform ${
                      fillColor === color.id ? 'scale-110 border-primary ring-2 ring-primary/30' : 'border-border/50 active:scale-95'
                    }`}
                    style={{
                      backgroundColor: color.hex === 'transparent' ? 'transparent' : color.hex,
                      ...(color.id === 'transparent' ? {
                        background: `linear-gradient(135deg, transparent 45%, ${isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)'} 45%, ${isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)'} 55%, transparent 55%)`,
                      } : {}),
                    }}
                  />
                </button>
              ))}
            </div>
            <div className="flex gap-2 mb-4">
              {FILL_STYLES.map(style => (
                <button
                  key={style.id}
                  onClick={() => handleFillStyleChange(style.id)}
                  className={`flex-1 flex items-center justify-center py-2 rounded-xl text-xs transition-colors ${
                    fillStyle === style.id ? 'bg-primary/15 text-primary font-medium' : 'text-muted-foreground hover:bg-muted border border-border/50'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>

            {/* Stroke Width */}
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium mb-2">Stroke Width</p>
            <div className="flex gap-2 mb-4">
              {STROKE_WIDTHS.map(w => (
                <button
                  key={w.id}
                  onClick={() => handleStrokeWidthChange(w.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs transition-colors ${
                    strokeWidth === w.id ? 'bg-primary/15 text-primary font-medium' : 'text-muted-foreground hover:bg-muted border border-border/50'
                  }`}
                >
                  <span className="w-5 rounded-full bg-current" style={{ height: `${Math.max(w.id, 1.5)}px` }} />
                  {w.label}
                </button>
              ))}
            </div>

            {/* Arrow Style */}
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium mb-2">Arrow Style</p>
            <div className="grid grid-cols-4 gap-1.5 mb-4">
              {ARROW_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => handleArrowPresetSelect(preset.id)}
                  className={`flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] transition-colors ${
                    arrowPreset === preset.id ? 'bg-primary/15 text-primary font-medium' : 'text-muted-foreground hover:bg-muted border border-border/50'
                  }`}
                >
                  <ArrowPresetIcon preset={preset} size={28} />
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Text Size */}
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium mb-2">Text Size <span className="normal-case font-normal">({fontSize}px)</span></p>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => handleFontSizeChange('down')}
                className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-muted-foreground hover:bg-muted border border-border/50 text-sm font-bold"
              >
                A-
              </button>
              <button
                onClick={() => handleFontSizeChange('up')}
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

      {/* Keyboard shortcuts overlay */}
      {showShortcuts && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center" onClick={() => setShowShortcuts(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-md w-[calc(100%-2rem)] max-h-[80dvh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Keyboard Shortcuts</h2>
              <button onClick={() => setShowShortcuts(false)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium mb-2">Tools</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                  {DRAW_TOOLS.map(tool => (
                    <div key={tool.id} className="flex items-center justify-between">
                      <span className="text-muted-foreground">{tool.label.split(' (')[0]}</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-muted text-[11px] font-mono font-medium">{tool.shortcut}</kbd>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-px bg-border" />

              <div>
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium mb-2">Canvas</p>
                <div className="grid grid-cols-1 gap-y-1.5">
                  {[
                    ['Space + Drag', 'Pan (temporary)'],
                    ['Ctrl/Cmd + Z', 'Undo'],
                    ['Ctrl/Cmd + Shift + Z', 'Redo'],
                    ['Ctrl/Cmd + +', 'Zoom in'],
                    ['Ctrl/Cmd + -', 'Zoom out'],
                    ['Escape', 'Back to Select'],
                    ['F11', 'Fullscreen'],
                    ['?', 'This help'],
                  ].map(([key, action]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-muted-foreground">{action}</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-muted text-[11px] font-mono font-medium whitespace-nowrap">{key}</kbd>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline keyframe styles for toast/saved/sidebar animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translate(-50%, -8px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes slide-in-left {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
        .animate-fade-out {
          animation: fade-out 1s ease-out 1s forwards;
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.2s ease-out forwards;
        }
      `}</style>
    </>
  );
}
