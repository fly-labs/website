import React, { useEffect, useCallback, useRef, useState, useMemo, forwardRef, useImperativeHandle } from 'react';

import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';

// Fallback stroke colors
const CHALK_WHITE = '#e8e4df';
const INK_BLACK = '#1e1e1e';

/**
 * Auto-contrast: pick stroke color based on background luminance.
 */
function getContrastStroke(bgHex) {
  if (!bgHex || bgHex === 'transparent') return null;
  try {
    const r = parseInt(bgHex.slice(1, 3), 16);
    const g = parseInt(bgHex.slice(3, 5), 16);
    const b = parseInt(bgHex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? INK_BLACK : CHALK_WHITE;
  } catch {
    return null;
  }
}

/**
 * FlyBoard canvas wrapper around Excalidraw.
 *
 * All style props map directly to Excalidraw appState keys.
 * We trust Excalidraw to apply currentItem* to new elements.
 * No aggressive onChange recoloring - that causes flashing.
 */
// Tools that should NOT be re-applied after Excalidraw resets to selection
const SINGLE_USE_TOOLS = new Set(['selection', 'eraser', 'hand']);

const ExcalidrawCanvas = forwardRef(function ExcalidrawCanvas(
  { board, onSceneChange, isDark, gridStyle = 'dot', gridVisible = true, bgColor, defaultFont = 1, strokeColor: strokeColorProp, strokeWidth: strokeWidthProp = 2, roughness: roughnessProp = 1, fontSize: fontSizeProp = 20, startArrowhead: startArrowheadProp = null, endArrowhead: endArrowheadProp = 'arrow', hideUI = false },
  ref
) {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);

  const onSceneChangeRef = useRef(onSceneChange);
  onSceneChangeRef.current = onSceneChange;

  const activeBoardIdRef = useRef(board?.id || null);
  const changeCountRef = useRef(0);
  const changeTimerRef = useRef(null);

  // Track the desired tool so we can re-apply it when Excalidraw resets to selection
  // (e.g. after finishing text editing, Excalidraw forcibly switches to selection)
  const desiredToolRef = useRef(null);
  const reapplyTimerRef = useRef(null);

  // Resolve stroke color from prop or auto-contrast
  const strokeColor = strokeColorProp || getContrastStroke(bgColor) || (isDark ? CHALK_WHITE : INK_BLACK);

  // Refs for stable onChange closure
  const strokeColorRef = useRef(strokeColor);
  strokeColorRef.current = strokeColor;

  // When board ID changes, reset the init guard
  useEffect(() => {
    const newId = board?.id || null;
    if (newId !== activeBoardIdRef.current) {
      activeBoardIdRef.current = newId;
      changeCountRef.current = 0;
    }
  }, [board?.id]);

  // Expose API to parent
  useImperativeHandle(ref, () => ({
    getAPI: () => excalidrawAPI,
    getSceneElements: () => excalidrawAPI?.getSceneElements() || [],
    getAppState: () => excalidrawAPI?.getAppState() || {},
    updateScene: (data) => excalidrawAPI?.updateScene(data),
    undo: () => excalidrawAPI?.history?.undo?.(),
    redo: () => excalidrawAPI?.history?.redo?.(),
    zoomIn: () => {
      if (!excalidrawAPI) return;
      const st = excalidrawAPI.getAppState();
      excalidrawAPI.updateScene({ appState: { zoom: { value: Math.min((st.zoom?.value || 1) * 1.2, 10) } } });
    },
    zoomOut: () => {
      if (!excalidrawAPI) return;
      const st = excalidrawAPI.getAppState();
      excalidrawAPI.updateScene({ appState: { zoom: { value: Math.max((st.zoom?.value || 1) / 1.2, 0.1) } } });
    },
    resetZoom: () => {
      if (!excalidrawAPI) return;
      excalidrawAPI.updateScene({ appState: { zoom: { value: 1 } } });
    },
    setTool: (tool, opts = {}) => {
      if (!excalidrawAPI) return;
      // Track desired tool for re-application after Excalidraw resets
      desiredToolRef.current = SINGLE_USE_TOOLS.has(tool) ? null : tool;
      excalidrawAPI.setActiveTool({ type: tool, ...opts });
    },
  }), [excalidrawAPI]);

  // Build the full appState object from current props
  const getAppStateFromProps = useCallback(() => ({
    theme: isDark ? 'dark' : 'light',
    viewBackgroundColor: 'transparent',
    currentItemStrokeColor: strokeColor,
    currentItemFontFamily: defaultFont,
    currentItemStrokeWidth: strokeWidthProp,
    currentItemRoughness: roughnessProp,
    currentItemFontSize: fontSizeProp,
    currentItemStartArrowhead: startArrowheadProp,
    currentItemEndArrowhead: endArrowheadProp,
  }), [isDark, strokeColor, defaultFont, strokeWidthProp, roughnessProp, fontSizeProp, startArrowheadProp, endArrowheadProp]);

  // onChange: debounce save + re-apply tool when Excalidraw resets to selection
  const handleChange = useCallback((elements, appState) => {
    changeCountRef.current += 1;
    if (changeCountRef.current <= 2) return; // skip init

    // Re-apply locked tool when Excalidraw forcibly switches to selection
    // (happens after text editing, for example)
    const currentTool = appState?.activeTool?.type;
    const desired = desiredToolRef.current;
    const isEditing = appState?.editingTextElement || appState?.editingLinearElement;
    if (desired && currentTool === 'selection' && !isEditing) {
      if (reapplyTimerRef.current) clearTimeout(reapplyTimerRef.current);
      reapplyTimerRef.current = setTimeout(() => {
        const api = excalidrawAPIRef.current;
        if (api && desiredToolRef.current) {
          api.setActiveTool({ type: desiredToolRef.current, locked: true });
        }
      }, 150);
    }

    if (changeTimerRef.current) clearTimeout(changeTimerRef.current);
    changeTimerRef.current = setTimeout(() => {
      onSceneChangeRef.current?.({
        elements: elements.map(el => ({ ...el, selected: undefined })),
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
          currentItemFontFamily: appState.currentItemFontFamily,
          currentItemStrokeColor: appState.currentItemStrokeColor,
          currentItemStrokeWidth: appState.currentItemStrokeWidth,
          gridSize: appState.gridSize,
        },
      });
    }, 300);
  }, []);

  // Ref for API in init callback
  const excalidrawAPIRef = useRef(null);
  excalidrawAPIRef.current = excalidrawAPI;

  useEffect(() => {
    return () => {
      if (changeTimerRef.current) clearTimeout(changeTimerRef.current);
      if (reapplyTimerRef.current) clearTimeout(reapplyTimerRef.current);
    };
  }, []);

  // Initial data (only recomputed on board change)
  const initialData = useMemo(() => {
    const sceneData = board?.scene_data;
    return {
      elements: sceneData?.elements || [],
      appState: {
        ...(sceneData?.appState || {}),
        theme: isDark ? 'dark' : 'light',
        viewBackgroundColor: 'transparent',
        currentItemStrokeColor: strokeColor,
        currentItemFontFamily: defaultFont,
        currentItemStrokeWidth: strokeWidthProp,
        currentItemRoughness: roughnessProp,
        currentItemFontSize: fontSizeProp,
        currentItemStartArrowhead: startArrowheadProp,
    currentItemEndArrowhead: endArrowheadProp,
        zoom: { value: 1 },
      },
      scrollToContent: false,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board?.id]);

  // Reactively push prop changes to Excalidraw
  useEffect(() => {
    if (excalidrawAPI) {
      excalidrawAPI.updateScene({ appState: getAppStateFromProps() });
    }
  }, [excalidrawAPI, getAppStateFromProps]);

  // When board changes, load scene data
  useEffect(() => {
    if (excalidrawAPI && board?.scene_data) {
      excalidrawAPI.updateScene({
        elements: board.scene_data.elements || [],
        appState: {
          ...(board.scene_data.appState || {}),
          ...getAppStateFromProps(),
        },
      });
      if (board.scene_data.elements?.length) {
        setTimeout(() => {
          excalidrawAPI.scrollToContent(undefined, { fitToViewport: true, viewportZoomFactor: 0.85 });
        }, 100);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board?.id, excalidrawAPI]);

  const gridClass = {
    dot: 'flyboard-grid-dot',
    ruled: 'flyboard-grid-ruled',
    square: 'flyboard-grid-square',
    iso: 'flyboard-grid-iso',
  }[gridStyle] || '';

  return (
    <div
      className={`flyboard-canvas w-full h-full relative${hideUI ? ' flyboard-hide-excalidraw-ui' : ''}`}
      style={bgColor ? { backgroundColor: bgColor } : undefined}
    >
      {gridVisible && gridClass && (
        <div className={`flyboard-grid-overlay ${gridClass}`} />
      )}

      <Excalidraw
        excalidrawAPI={(api) => {
          setExcalidrawAPI(api);
          // Multiple passes to survive Excalidraw's internal init resets
          const apply = () => api.updateScene({ appState: getAppStateFromProps() });
          apply();
          setTimeout(apply, 50);
          setTimeout(apply, 200);
        }}
        initialData={initialData}
        onChange={handleChange}
        theme={isDark ? 'dark' : 'light'}
        langCode="en"
        UIOptions={{
          canvasActions: {
            saveAsImage: true,
            loadScene: false,
            export: false,
            toggleTheme: false,
          },
          tools: {
            image: false,
          },
        }}
      />
    </div>
  );
});

export default ExcalidrawCanvas;
