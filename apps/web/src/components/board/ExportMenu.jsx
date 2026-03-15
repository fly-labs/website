import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Copy, Check, Loader2 } from 'lucide-react';
import { trackEvent } from '@/lib/analytics.js';

const EMPTY_BOARD_MSG = 'Draw something first, then export.';

const EXPORT_PRESETS = [
  { id: 'png', label: 'PNG (2x Retina)', width: null, height: null, scale: 2, ext: 'png', desc: 'High quality, general use' },
  { id: 'png-4x', label: 'PNG (4x Ultra)', width: null, height: null, scale: 4, ext: 'png', desc: 'Maximum quality' },
  { id: 'twitter', label: 'Twitter / X Post', width: 1200, height: 675, scale: 2, ext: 'png', desc: '1200 x 675' },
  { id: 'instagram', label: 'Instagram Post', width: 1080, height: 1350, scale: 2, ext: 'png', desc: '1080 x 1350' },
  { id: 'ig-story', label: 'Instagram Story', width: 1080, height: 1920, scale: 2, ext: 'png', desc: '1080 x 1920' },
  { id: 'youtube', label: 'YouTube Thumbnail', width: 1280, height: 720, scale: 2, ext: 'png', desc: '1280 x 720' },
  { id: 'linkedin', label: 'LinkedIn Post', width: 1200, height: 627, scale: 2, ext: 'png', desc: '1200 x 627' },
  { id: 'presentation', label: 'Presentation Slide', width: 1920, height: 1080, scale: 2, ext: 'png', desc: '1920 x 1080' },
  { id: 'svg', label: 'SVG Vector', width: null, height: null, scale: 1, ext: 'svg', desc: 'Scalable, Figma import' },
  { id: 'clipboard', label: 'Copy to Clipboard', width: null, height: null, scale: 2, ext: 'clipboard', desc: 'Paste into Notion, Slack' },
];

// Generous padding around elements for clean exports (in scene units)
const EXPORT_PADDING = 40;

/**
 * Export modal for FlyBoard.
 * Uses Excalidraw's exportToBlob/exportToSvg for platform-specific exports.
 */
export default function ExportMenu({ isOpen, onClose, excalidrawRef, boardTitle, bgColor }) {
  const [exporting, setExporting] = useState(null);
  const [copied, setCopied] = useState(false);
  const [emptyMsg, setEmptyMsg] = useState(null);

  const handleExport = useCallback(async (preset) => {
    const api = excalidrawRef?.current?.getAPI?.();
    if (!api) return;

    setExporting(preset.id);

    try {
      const elements = api.getSceneElements().filter(el => !el.isDeleted);
      const appState = api.getAppState();

      if (elements.length === 0) {
        setExporting(null);
        setEmptyMsg(EMPTY_BOARD_MSG);
        setTimeout(() => setEmptyMsg(null), 3000);
        return;
      }

      // Use the actual canvas background for export (never transparent, never hardcoded)
      const exportBg = bgColor || (appState.theme === 'dark' ? '#141414' : '#ffffff');

      const exportAppState = {
        ...appState,
        viewBackgroundColor: exportBg,
        exportWithDarkMode: appState.theme === 'dark',
        exportBackground: true,
        exportPadding: EXPORT_PADDING,
      };

      if (preset.ext === 'svg') {
        // SVG export
        const { exportToSvg } = await import('@excalidraw/excalidraw');
        const svg = await exportToSvg({
          elements,
          appState: exportAppState,
          files: api.getFiles?.() || {},
        });
        const svgString = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        downloadBlob(blob, `${sanitizeFilename(boardTitle)}.svg`);
      } else if (preset.ext === 'clipboard') {
        // Copy to clipboard as PNG
        const { exportToBlob } = await import('@excalidraw/excalidraw');
        const blob = await exportToBlob({
          elements,
          appState: exportAppState,
          files: api.getFiles?.() || {},
          quality: 1,
        });
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // PNG export
        const { exportToBlob } = await import('@excalidraw/excalidraw');
        const exportOpts = {
          elements,
          appState: exportAppState,
          files: api.getFiles?.() || {},
          quality: 1,
        };

        if (preset.width) {
          // Fixed-dimension export (social media presets)
          exportOpts.getDimensions = () => ({
            width: preset.width,
            height: preset.height,
            scale: preset.scale,
          });
        } else if (preset.scale) {
          // Scale-based export (2x retina, 4x ultra)
          exportOpts.getDimensions = (width, height) => ({
            width,
            height,
            scale: preset.scale,
          });
        }

        const blob = await exportToBlob(exportOpts);
        const filename = preset.id === 'png' || preset.id === 'png-4x'
          ? `${sanitizeFilename(boardTitle)}.png`
          : `${sanitizeFilename(boardTitle)}-${preset.id}.png`;
        downloadBlob(blob, filename);
      }

      trackEvent('flyboard_exported', {
        format: preset.id,
        element_count: elements.length,
      });
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(null);
    }
  }, [excalidrawRef, boardTitle, bgColor]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />

          {/* Modal */}
          <motion.div
            className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-semibold text-base">Export Board</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Export options grid */}
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto">
              {EXPORT_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => handleExport(preset)}
                  disabled={exporting !== null}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
                >
                  {exporting === preset.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
                  ) : preset.ext === 'clipboard' ? (
                    copied ? (
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground shrink-0" />
                    )
                  ) : (
                    <Download className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{preset.label}</div>
                    <div className="text-xs text-muted-foreground">{preset.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t text-xs text-muted-foreground">
              {emptyMsg ? (
                <span className="text-amber-500 font-medium">{emptyMsg}</span>
              ) : (
                'Exports use your canvas background with padding for a clean result.'
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function sanitizeFilename(title) {
  return (title || 'flyboard')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
