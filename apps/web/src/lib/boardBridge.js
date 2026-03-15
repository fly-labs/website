/**
 * FlyBot x FlyBoard Bridge
 *
 * Translates simplified element descriptions from FlyBot (Claude) into
 * full Excalidraw element objects, and extracts human-readable board
 * content summaries for FlyBot context.
 *
 * Uses the same CustomEvent bridge pattern as the music player:
 * Claude response → api/chat.js parses <board_action> → useChat.js dispatches
 * CustomEvent('flybot-board-action') → BoardContext.jsx listener → canvas update.
 */

const CHALK_COLORS = {
  yellow: '#f5e6a3',
  blue: '#a3c4e8',
  pink: '#e8a3b8',
  green: '#a3d9b1',
  white: '#e8e4df',
  red: '#e03131',
  orange: '#e8590c',
  purple: '#7048e8',
};

function baseProps() {
  return {
    id: crypto.randomUUID(),
    angle: 0,
    opacity: 100,
    isDeleted: false,
    roughness: 1,
    groupIds: [],
    frameId: null,
    link: null,
    locked: false,
    seed: Math.floor(Math.random() * 100000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 2000000000),
    updated: Date.now(),
  };
}

function resolveColor(color) {
  if (!color) return '#e8e4df';
  return CHALK_COLORS[color] || color;
}

/**
 * Build a text element for Excalidraw
 */
function buildText(x, y, content, opts = {}) {
  const fontSize = opts.fontSize || 20;
  const lines = content.split('\n');
  const maxLineLen = Math.max(...lines.map(l => l.length));
  const approxWidth = maxLineLen * fontSize * 0.6;
  const approxHeight = lines.length * fontSize * 1.35;

  return {
    ...baseProps(),
    type: 'text',
    x,
    y,
    text: content,
    originalText: content,
    autoResize: true,
    fontSize,
    fontFamily: 1,
    strokeColor: resolveColor(opts.color),
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 1,
    strokeStyle: 'solid',
    textAlign: opts.textAlign || 'left',
    verticalAlign: opts.verticalAlign || 'top',
    containerId: opts.containerId || null,
    lineHeight: 1.25,
    width: approxWidth,
    height: approxHeight,
    boundElements: null,
    roundness: null,
  };
}

/**
 * Build a rectangle element for Excalidraw
 */
function buildRect(x, y, w, h, opts = {}) {
  const id = crypto.randomUUID();
  const elements = [];
  const boundElements = [];

  if (opts.label) {
    const textId = crypto.randomUUID();
    boundElements.push({ id: textId, type: 'text' });

    const textEl = buildText(
      x + w / 2,
      y + h / 2,
      opts.label,
      {
        fontSize: 16,
        color: opts.color || 'white',
        containerId: id,
        textAlign: 'center',
        verticalAlign: 'middle',
      }
    );
    textEl.id = textId;
    elements.push(textEl);
  }

  const rect = {
    ...baseProps(),
    id,
    type: 'rectangle',
    x,
    y,
    width: w,
    height: h,
    strokeColor: resolveColor(opts.color),
    backgroundColor: opts.bg || 'transparent',
    fillStyle: opts.fillStyle || 'solid',
    strokeWidth: 1,
    strokeStyle: 'solid',
    roundness: { type: 3 },
    boundElements: boundElements.length > 0 ? boundElements : [],
  };

  return [rect, ...elements];
}

/**
 * Build a sticky note (filled rectangle + bound text)
 */
function buildSticky(x, y, text, opts = {}) {
  const w = opts.w || 160;
  const h = opts.h || 100;
  const color = resolveColor(opts.color || 'yellow');
  const rectId = crypto.randomUUID();
  const textId = crypto.randomUUID();

  const rect = {
    ...baseProps(),
    id: rectId,
    type: 'rectangle',
    x,
    y,
    width: w,
    height: h,
    strokeColor: color,
    backgroundColor: color,
    fillStyle: 'hachure',
    strokeWidth: 1,
    strokeStyle: 'solid',
    roundness: { type: 3 },
    boundElements: [{ id: textId, type: 'text' }],
  };

  const textEl = buildText(x + w / 2, y + h / 2, text, {
    fontSize: 16,
    color: '#1e1e1e',
    containerId: rectId,
    textAlign: 'center',
    verticalAlign: 'middle',
  });
  textEl.id = textId;

  return [rect, textEl];
}

/**
 * Build an ellipse element for Excalidraw
 */
function buildEllipse(x, y, w, h, opts = {}) {
  const id = crypto.randomUUID();
  const elements = [];
  const boundElements = [];

  if (opts.label) {
    const textId = crypto.randomUUID();
    boundElements.push({ id: textId, type: 'text' });

    const textEl = buildText(
      x + w / 2,
      y + h / 2,
      opts.label,
      {
        fontSize: 16,
        color: opts.color || 'white',
        containerId: id,
        textAlign: 'center',
        verticalAlign: 'middle',
      }
    );
    textEl.id = textId;
    elements.push(textEl);
  }

  const ellipse = {
    ...baseProps(),
    id,
    type: 'ellipse',
    x,
    y,
    width: w,
    height: h,
    strokeColor: resolveColor(opts.color),
    backgroundColor: opts.bg || 'transparent',
    fillStyle: opts.fillStyle || 'solid',
    strokeWidth: 1,
    strokeStyle: 'solid',
    roundness: { type: 2 },
    boundElements: boundElements.length > 0 ? boundElements : [],
  };

  return [ellipse, ...elements];
}

/**
 * Build an arrow element for Excalidraw
 */
function buildArrow(from, to) {
  const [x1, y1] = from;
  const [x2, y2] = to;
  return {
    ...baseProps(),
    type: 'arrow',
    x: x1,
    y: y1,
    width: x2 - x1,
    height: y2 - y1,
    points: [[0, 0], [x2 - x1, y2 - y1]],
    strokeColor: '#e8e4df',
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 1,
    strokeStyle: 'solid',
    roundness: { type: 2 },
    boundElements: null,
    startArrowhead: null,
    endArrowhead: 'arrow',
    startBinding: null,
    endBinding: null,
  };
}

/**
 * Build a line element for Excalidraw
 */
function buildLine(from, to) {
  const [x1, y1] = from;
  const [x2, y2] = to;
  return {
    ...baseProps(),
    type: 'line',
    x: x1,
    y: y1,
    width: x2 - x1,
    height: y2 - y1,
    points: [[0, 0], [x2 - x1, y2 - y1]],
    strokeColor: '#e8e4df',
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 1,
    strokeStyle: 'solid',
    roundness: null,
    boundElements: null,
    startArrowhead: null,
    endArrowhead: null,
  };
}

/**
 * Convert simplified FlyBot element descriptions into full Excalidraw elements.
 * Returns an array of Excalidraw-compatible element objects.
 */
export function buildExcalidrawElements(simplifiedElements) {
  if (!Array.isArray(simplifiedElements)) return [];

  const allElements = [];

  for (const el of simplifiedElements) {
    switch (el.type) {
      case 'sticky':
        allElements.push(...buildSticky(el.x || 0, el.y || 0, el.text || '', {
          color: el.color,
          w: el.w,
          h: el.h,
        }));
        break;

      case 'text':
        allElements.push(buildText(el.x || 0, el.y || 0, el.text || '', {
          fontSize: el.fontSize,
          color: el.color,
        }));
        break;

      case 'rectangle':
        allElements.push(...buildRect(el.x || 0, el.y || 0, el.w || 200, el.h || 150, {
          color: el.color,
          label: el.label,
        }));
        break;

      case 'ellipse':
        allElements.push(...buildEllipse(el.x || 0, el.y || 0, el.w || 200, el.h || 150, {
          color: el.color,
          label: el.label,
        }));
        break;

      case 'arrow':
        if (el.from && el.to) {
          allElements.push(buildArrow(el.from, el.to));
        }
        break;

      case 'line':
        if (el.from && el.to) {
          allElements.push(buildLine(el.from, el.to));
        }
        break;

      default:
        break;
    }
  }

  return allElements;
}

/**
 * Extract a human-readable summary of board content for FlyBot context.
 * Max 2000 characters, truncates gracefully.
 */
export function extractBoardContent(sceneElements) {
  if (!Array.isArray(sceneElements) || sceneElements.length === 0) {
    return 'Empty board.';
  }

  const active = sceneElements.filter(el => !el.isDeleted);
  if (active.length === 0) return 'Empty board.';

  // Count element types
  const counts = {};
  for (const el of active) {
    counts[el.type] = (counts[el.type] || 0) + 1;
  }

  const parts = [];
  parts.push(`${active.length} elements: ${Object.entries(counts).map(([t, c]) => `${c} ${t}`).join(', ')}.`);

  // Extract all text content
  const texts = active
    .filter(el => el.type === 'text' && el.text)
    .map(el => el.text.trim())
    .filter(t => t.length > 0);

  if (texts.length > 0) {
    parts.push('Text content:');
    let charBudget = 1600;
    for (const t of texts) {
      const snippet = t.length > 100 ? t.slice(0, 100) + '...' : t;
      if (charBudget - snippet.length < 0) {
        parts.push(`...and ${texts.length - parts.length + 2} more text elements.`);
        break;
      }
      parts.push(`- "${snippet}"`);
      charBudget -= snippet.length;
    }
  }

  // Layout bounds
  const xs = active.map(el => el.x || 0);
  const ys = active.map(el => el.y || 0);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  parts.push(`Layout: ${Math.round(maxX - minX)}x${Math.round(maxY - minY)}px area.`);

  return parts.join('\n').slice(0, 2000);
}
