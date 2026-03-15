/**
 * Board API utilities for FlyBoard
 * Client-side helpers for board content extraction and element generation
 */

/**
 * Extract human-readable content summary from Excalidraw scene data.
 * Used to give FlyBot context about what's on the canvas.
 * @param {Object} sceneData - Excalidraw scene { elements, appState }
 * @returns {string} Human-readable summary of board contents
 */
export function extractBoardContent(sceneData) {
  if (!sceneData?.elements?.length) return 'The board is empty.';

  const elements = sceneData.elements.filter(e => !e.isDeleted);
  if (elements.length === 0) return 'The board is empty.';

  // Cap extraction at 200 elements for performance
  const capped = elements.slice(0, 200);
  const overflow = elements.length > 200;

  const texts = capped.filter(e => e.type === 'text');
  const shapes = capped.filter(e => ['rectangle', 'diamond', 'ellipse'].includes(e.type));
  const arrows = capped.filter(e => e.type === 'arrow');
  const freeDraws = capped.filter(e => e.type === 'freedraw');

  // Separate bound text (labels inside shapes) from free text
  const boundTexts = texts.filter(t => t.containerId);
  const freeTexts = texts.filter(t => !t.containerId);

  const summary = [];

  if (freeTexts.length > 0) {
    const textList = freeTexts
      .map(t => `"${t.text.slice(0, 100)}"`)
      .join(', ');
    summary.push(`Text blocks: ${textList}`);
  }

  if (shapes.length > 0) {
    const labeledShapes = shapes.map(s => {
      const label = boundTexts.find(t => t.containerId === s.id);
      return label ? `${s.type} labeled "${label.text.slice(0, 80)}"` : s.type;
    });
    summary.push(`Shapes: ${labeledShapes.join(', ')}`);
  }

  if (arrows.length > 0) {
    summary.push(`${arrows.length} connecting arrow(s)`);
  }

  if (freeDraws.length > 0) {
    summary.push(`${freeDraws.length} freehand drawing(s)`);
  }

  const overflowNote = overflow ? ` (showing first 200 of ${elements.length} elements)` : '';

  return `Board contains ${elements.length} elements${overflowNote}. ${summary.join('. ')}.`;
}

/**
 * Generate Excalidraw element skeletons for common layout patterns.
 * Used by FlyBot to create structured content on the canvas.
 * @param {string} type - Layout type (e.g., 'grid', 'flow', 'kanban')
 * @param {Object} data - Layout-specific data
 * @returns {Array} Array of Excalidraw element skeletons
 */
export function generateBoardElements(type, data) {
  const baseId = () => crypto.randomUUID();
  const PADDING = 40;
  const BOX_WIDTH = 240;
  const BOX_HEIGHT = 160;
  const TEXT_SIZE = 20;
  const LABEL_SIZE = 16;
  const STROKE_COLOR = '#ffffff';
  const BG_COLOR = 'transparent';

  switch (type) {
    case 'grid': {
      // Grid layout: rows x cols of labeled boxes
      const { title, boxes, cols = 3 } = data;
      const elements = [];
      const startX = 100;
      const startY = 100;

      // Title text
      if (title) {
        elements.push({
          id: baseId(),
          type: 'text',
          x: startX,
          y: startY - 60,
          text: title,
          fontSize: 28,
          fontFamily: 1, // Virgil
          strokeColor: STROKE_COLOR,
        });
      }

      boxes.forEach((box, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = startX + col * (BOX_WIDTH + PADDING);
        const y = startY + row * (BOX_HEIGHT + PADDING);

        const rectId = baseId();
        const textId = baseId();

        elements.push({
          id: rectId,
          type: 'rectangle',
          x,
          y,
          width: BOX_WIDTH,
          height: BOX_HEIGHT,
          strokeColor: STROKE_COLOR,
          backgroundColor: BG_COLOR,
          fillStyle: 'solid',
          roughness: 1,
          boundElements: [{ id: textId, type: 'text' }],
        });

        elements.push({
          id: textId,
          type: 'text',
          x: x + 10,
          y: y + 10,
          width: BOX_WIDTH - 20,
          text: box.label || box,
          fontSize: LABEL_SIZE,
          fontFamily: 1,
          strokeColor: STROKE_COLOR,
          containerId: rectId,
          textAlign: 'center',
          verticalAlign: 'top',
        });
      });

      return elements;
    }

    case 'flow': {
      // Vertical or horizontal flow with arrows
      const { title, steps, direction = 'vertical' } = data;
      const elements = [];
      const startX = 100;
      const startY = 100;

      if (title) {
        elements.push({
          id: baseId(),
          type: 'text',
          x: startX,
          y: startY - 60,
          text: title,
          fontSize: 28,
          fontFamily: 1,
          strokeColor: STROKE_COLOR,
        });
      }

      steps.forEach((step, i) => {
        const isVertical = direction === 'vertical';
        const x = isVertical ? startX : startX + i * (BOX_WIDTH + PADDING + 40);
        const y = isVertical ? startY + i * (BOX_HEIGHT + PADDING + 40) : startY;

        const rectId = baseId();
        const textId = baseId();

        elements.push({
          id: rectId,
          type: 'rectangle',
          x,
          y,
          width: BOX_WIDTH,
          height: BOX_HEIGHT,
          strokeColor: STROKE_COLOR,
          backgroundColor: BG_COLOR,
          fillStyle: 'solid',
          roughness: 1,
          roundness: { type: 3 },
          boundElements: [{ id: textId, type: 'text' }],
        });

        elements.push({
          id: textId,
          type: 'text',
          x: x + 10,
          y: y + 10,
          width: BOX_WIDTH - 20,
          text: typeof step === 'string' ? step : step.label,
          fontSize: LABEL_SIZE,
          fontFamily: 1,
          strokeColor: STROKE_COLOR,
          containerId: rectId,
          textAlign: 'center',
          verticalAlign: 'middle',
        });

        // Arrow to next step
        if (i < steps.length - 1) {
          const arrowId = baseId();
          if (isVertical) {
            elements.push({
              id: arrowId,
              type: 'arrow',
              x: x + BOX_WIDTH / 2,
              y: y + BOX_HEIGHT,
              width: 0,
              height: PADDING + 40,
              strokeColor: STROKE_COLOR,
              points: [[0, 0], [0, PADDING + 40]],
              startBinding: { elementId: rectId, focus: 0, gap: 4 },
            });
          } else {
            elements.push({
              id: arrowId,
              type: 'arrow',
              x: x + BOX_WIDTH,
              y: y + BOX_HEIGHT / 2,
              width: PADDING + 40,
              height: 0,
              strokeColor: STROKE_COLOR,
              points: [[0, 0], [PADDING + 40, 0]],
              startBinding: { elementId: rectId, focus: 0, gap: 4 },
            });
          }
        }
      });

      return elements;
    }

    case 'kanban': {
      // Kanban columns
      const { title, columns } = data;
      const elements = [];
      const startX = 100;
      const startY = 100;
      const COL_WIDTH = 220;
      const COL_HEIGHT = 500;

      if (title) {
        elements.push({
          id: baseId(),
          type: 'text',
          x: startX,
          y: startY - 60,
          text: title,
          fontSize: 28,
          fontFamily: 1,
          strokeColor: STROKE_COLOR,
        });
      }

      columns.forEach((col, i) => {
        const x = startX + i * (COL_WIDTH + PADDING);

        // Column header
        elements.push({
          id: baseId(),
          type: 'text',
          x: x + 10,
          y: startY,
          text: typeof col === 'string' ? col : col.label,
          fontSize: TEXT_SIZE,
          fontFamily: 1,
          strokeColor: STROKE_COLOR,
        });

        // Column rectangle
        elements.push({
          id: baseId(),
          type: 'rectangle',
          x,
          y: startY + 40,
          width: COL_WIDTH,
          height: COL_HEIGHT,
          strokeColor: STROKE_COLOR,
          backgroundColor: BG_COLOR,
          fillStyle: 'solid',
          roughness: 1,
          strokeStyle: 'dashed',
        });
      });

      return elements;
    }

    default:
      return [];
  }
}
