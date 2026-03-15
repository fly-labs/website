import React, { useEffect, useCallback, useRef, useState, useMemo, forwardRef, useImperativeHandle } from 'react';

import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';

// Fallback stroke colors
const CHALK_WHITE = '#e8e4df';
const INK_BLACK = '#1e1e1e';

// Excalidraw's own default colors that we need to intercept (all known defaults)
const EXCALIDRAW_DEFAULTS = new Set(['#1e1e1e', '#000000', '#000', '#e8e4df', '#ffffff', '#fff', '#1b1b1f', '#343a40']);

/**
 * Check if a hex color clashes with the background (both dark or both light).
 * Returns true if the element color would be invisible/hard to read.
 */
function colorClashesWithBg(elementHex, bgHex) {
  if (!elementHex || !bgHex || bgHex === 'transparent') return false;
  try {
    const elR = parseInt(elementHex.slice(1, 3), 16);
    const elG = parseInt(elementHex.slice(3, 5), 16);
    const elB = parseInt(elementHex.slice(5, 7), 16);
    const elLum = (0.299 * elR + 0.587 * elG + 0.114 * elB) / 255;

    const bgR = parseInt(bgHex.slice(1, 3), 16);
    const bgG = parseInt(bgHex.slice(3, 5), 16);
    const bgB = parseInt(bgHex.slice(5, 7), 16);
    const bgLum = (0.299 * bgR + 0.587 * bgG + 0.114 * bgB) / 255;

    // Both dark (lum < 0.4) or both light (lum > 0.6) = clash
    return (elLum < 0.4 && bgLum < 0.4) || (elLum > 0.6 && bgLum > 0.6);
  } catch {
    return false;
  }
}

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
 */
const ExcalidrawCanvas = forwardRef(function ExcalidrawCanvas(
  { board, onSceneChange, isDark, gridStyle = 'dot', gridVisible = true, bgColor, defaultFont = 1, strokeColor: strokeColorProp, hideUI = false },
  ref
) {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);

  // Use refs for callbacks to keep onChange handler stable
  const onSceneChangeRef = useRef(onSceneChange);
  onSceneChangeRef.current = onSceneChange;

  // Track board ID changes to reset the initialization guard
  const activeBoardIdRef = useRef(board?.id || null);
  const changeCountRef = useRef(0);
  const changeTimerRef = useRef(null);

  // Use prop if provided, otherwise compute from background
  const strokeColor = strokeColorProp || getContrastStroke(bgColor) || (isDark ? CHALK_WHITE : INK_BLACK);

  // Keep refs of latest values for use in closures and onChange
  const strokeColorRef = useRef(strokeColor);
  strokeColorRef.current = strokeColor;
  const defaultFontRef = useRef(defaultFont);
  defaultFontRef.current = defaultFont;
  const isDarkRef = useRef(isDark);
  isDarkRef.current = isDark;
  const bgColorRef = useRef(bgColor);
  bgColorRef.current = bgColor;

  // Track known element IDs to detect newly created elements
  const knownElementIdsRef = useRef(new Set());

  // When board ID changes, reset the guard and known elements
  useEffect(() => {
    const newId = board?.id || null;
    if (newId !== activeBoardIdRef.current) {
      activeBoardIdRef.current = newId;
      changeCountRef.current = 0;
      knownElementIdsRef.current = new Set(
        (board?.scene_data?.elements || []).map(el => el.id)
      );
    }
  }, [board?.id, board?.scene_data?.elements]);

  // Expose API to parent via ref
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
    setTool: (tool) => {
      if (!excalidrawAPI) return;
      excalidrawAPI.setActiveTool({ type: tool });
    },
  }), [excalidrawAPI]);

  // Stable onChange handler - uses refs so it never changes identity
  const handleChange = useCallback((elements, appState) => {
    changeCountRef.current += 1;
    if (changeCountRef.current <= 2) return;

    const targetStroke = strokeColorRef.current;
    let needsUpdate = false;
    const fixedElements = [];

    // Check each element: fix newly created ones that have wrong contrast color
    const currentBg = bgColorRef.current;
    for (const el of elements) {
      if (!knownElementIdsRef.current.has(el.id) && !el.isDeleted) {
        // This is a NEW element - ensure it uses the correct auto-contrast color
        // Fix if: (1) has a known Excalidraw default color, OR (2) clashes with background
        const hasDefaultColor = EXCALIDRAW_DEFAULTS.has(el.strokeColor);
        const clashesWithBg = colorClashesWithBg(el.strokeColor, currentBg);
        if ((hasDefaultColor || clashesWithBg) && el.strokeColor !== targetStroke) {
          fixedElements.push({ ...el, strokeColor: targetStroke });
          needsUpdate = true;
        } else {
          fixedElements.push(el);
        }
        knownElementIdsRef.current.add(el.id);
      } else {
        fixedElements.push(el);
      }
    }

    // Also ensure currentItemStrokeColor stays correct
    if (appState.currentItemStrokeColor !== targetStroke) {
      needsUpdate = true;
    }

    // Debounce: batch rapid onChange calls into one save
    if (changeTimerRef.current) clearTimeout(changeTimerRef.current);
    changeTimerRef.current = setTimeout(() => {
      const cleanAppState = {
        viewBackgroundColor: appState.viewBackgroundColor,
        currentItemFontFamily: appState.currentItemFontFamily,
        currentItemStrokeColor: targetStroke,
        gridSize: appState.gridSize,
      };

      onSceneChangeRef.current?.({
        elements: fixedElements.map(el => ({ ...el, selected: undefined })),
        appState: cleanAppState,
      });
    }, 300);

    // If we need to fix elements or stroke color, update immediately (not debounced)
    if (needsUpdate && excalidrawAPIRef.current) {
      excalidrawAPIRef.current.updateScene({
        elements: needsUpdate ? fixedElements : undefined,
        appState: { currentItemStrokeColor: targetStroke },
      });
    }
  }, []); // empty deps = stable identity

  // Ref for excalidrawAPI used in onChange (avoids stale closure)
  const excalidrawAPIRef = useRef(null);
  excalidrawAPIRef.current = excalidrawAPI;

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (changeTimerRef.current) clearTimeout(changeTimerRef.current);
    };
  }, []);

  // Memoize initial data to prevent Excalidraw from re-initializing on every render
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
        zoom: { value: 1 },
      },
      scrollToContent: false,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board?.id]);

  // Update theme/font/stroke reactively without re-initializing
  useEffect(() => {
    if (excalidrawAPI) {
      excalidrawAPI.updateScene({
        appState: {
          theme: isDark ? 'dark' : 'light',
          viewBackgroundColor: 'transparent',
          currentItemStrokeColor: strokeColor,
          currentItemFontFamily: defaultFont,
        },
      });
    }
  }, [isDark, excalidrawAPI, defaultFont, strokeColor]);

  // When board changes, load the new scene data into existing Excalidraw instance
  useEffect(() => {
    if (excalidrawAPI && board?.scene_data) {
      // Update known element IDs
      knownElementIdsRef.current = new Set(
        (board.scene_data.elements || []).map(el => el.id)
      );

      excalidrawAPI.updateScene({
        elements: board.scene_data.elements || [],
        appState: {
          ...(board.scene_data.appState || {}),
          theme: isDark ? 'dark' : 'light',
          viewBackgroundColor: 'transparent',
          currentItemStrokeColor: strokeColor,
          currentItemFontFamily: defaultFont,
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

  // Grid style CSS class
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
      {/* Grid overlay */}
      {gridVisible && gridClass && (
        <div className={`flyboard-grid-overlay ${gridClass}`} />
      )}

      <Excalidraw
        excalidrawAPI={(api) => {
          setExcalidrawAPI(api);
          // Force correct state after mount using refs for fresh values
          // Multiple passes to survive Excalidraw's internal init resets
          const applyState = () => {
            api.updateScene({
              appState: {
                viewBackgroundColor: 'transparent',
                currentItemStrokeColor: strokeColorRef.current,
                currentItemFontFamily: defaultFontRef.current,
              },
            });
          };
          applyState();
          setTimeout(applyState, 50);
          setTimeout(applyState, 200);
          setTimeout(applyState, 500);
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
