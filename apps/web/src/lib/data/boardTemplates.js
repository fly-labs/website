/**
 * FlyBoard templates: real frameworks with known creators.
 * Each template contains Excalidraw element JSON that loads directly into the canvas.
 *
 * Stroke colors use chalk palette for dark mode readability:
 * - White chalk: #e8e4df
 * - Yellow chalk: #f5e6a3
 * - Blue chalk: #a3c4e8
 * - Pink chalk: #e8a3b8
 * - Green chalk: #a3d9b1
 */

const WHITE = '#e8e4df';
const YELLOW = '#f5e6a3';
const BLUE = '#a3c4e8';
const PINK = '#e8a3b8';
const GREEN = '#a3d9b1';

// Shared base properties required by Excalidraw v0.18 for all elements
function baseProps(id, opts = {}) {
  return {
    id,
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

// Helper: create a text element
function text(id, x, y, content, opts = {}) {
  const fontSize = opts.fontSize || 20;
  const lines = content.split('\n');
  const maxLineLen = Math.max(...lines.map(l => l.length));
  const approxWidth = opts.width || maxLineLen * fontSize * 0.6;
  const approxHeight = opts.height || lines.length * fontSize * 1.35;

  return {
    ...baseProps(id),
    type: 'text',
    x,
    y,
    text: content,
    originalText: content,
    autoResize: true,
    fontSize,
    fontFamily: opts.fontFamily || 1,
    strokeColor: opts.color || WHITE,
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

// Helper: create a rectangle element
function rect(id, x, y, w, h, opts = {}) {
  return {
    ...baseProps(id),
    type: 'rectangle',
    x,
    y,
    width: w,
    height: h,
    strokeColor: opts.color || WHITE,
    backgroundColor: opts.bg || 'transparent',
    fillStyle: opts.fillStyle || 'solid',
    strokeWidth: opts.strokeWidth || 1,
    strokeStyle: opts.strokeStyle || 'solid',
    roundness: opts.roundness || { type: 3 },
    boundElements: opts.boundElements || [],
  };
}

// Helper: create a line element
function line(id, x, y, points, opts = {}) {
  return {
    ...baseProps(id),
    type: 'line',
    x,
    y,
    width: 0,
    height: 0,
    points,
    strokeColor: opts.color || WHITE,
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: opts.strokeWidth || 1,
    strokeStyle: 'solid',
    roundness: null,
    boundElements: null,
    startArrowhead: null,
    endArrowhead: null,
  };
}

// Helper: create an ellipse
function ellipse(id, x, y, w, h, opts = {}) {
  return {
    ...baseProps(id),
    type: 'ellipse',
    x,
    y,
    width: w,
    height: h,
    strokeColor: opts.color || WHITE,
    backgroundColor: opts.bg || 'transparent',
    fillStyle: opts.fillStyle || 'solid',
    strokeWidth: 1,
    strokeStyle: 'solid',
    roundness: { type: 2 },
    boundElements: opts.boundElements || [],
  };
}

// Helper: create an arrow
function arrow(id, x, y, points, opts = {}) {
  return {
    ...baseProps(id),
    type: 'arrow',
    x,
    y,
    width: 0,
    height: 0,
    points,
    strokeColor: opts.color || WHITE,
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: opts.strokeWidth || 1,
    strokeStyle: 'solid',
    roundness: { type: 2 },
    boundElements: null,
    startBinding: opts.startBinding || null,
    endBinding: opts.endBinding || null,
    startArrowhead: null,
    endArrowhead: 'arrow',
  };
}

// ============================================================
// TEMPLATES
// ============================================================

const dailyPage = {
  id: 'daily-page',
  title: 'Daily Page',
  description: 'Date header, time blocks, notes area, and evening reflection. Leuchtturm1917 inspired.',
  category: 'Journal',
  creator: 'Leuchtturm1917 style',
  sceneData: {
    elements: [
      // Date header
      text('dp-date', 60, 40, 'March 15, 2026', { fontSize: 28, color: YELLOW }),
      line('dp-line1', 60, 80, [[0, 0], [680, 0]], { color: YELLOW }),

      // Time slots
      ...['8:00', '9:00', '10:00', '11:00', '12:00', '1:00', '2:00', '3:00', '4:00', '5:00', '6:00', '7:00'].map((t, i) =>
        text(`dp-time-${i}`, 60, 100 + i * 42, t, { fontSize: 16, color: WHITE })
      ),
      // Time slot lines
      ...[...Array(12)].map((_, i) =>
        line(`dp-tline-${i}`, 130, 120 + i * 42, [[0, 0], [610, 0]], { color: WHITE, strokeWidth: 0.5 })
      ),

      // Notes section
      line('dp-line2', 60, 620, [[0, 0], [680, 0]], { color: BLUE }),
      text('dp-notes', 60, 630, 'Notes', { fontSize: 22, color: BLUE }),

      // Reflection
      line('dp-line3', 60, 820, [[0, 0], [680, 0]], { color: PINK }),
      text('dp-reflect', 60, 830, 'Evening Reflection', { fontSize: 22, color: PINK }),
      text('dp-prompt', 60, 865, 'What went well today? What would I do differently?', { fontSize: 14, color: PINK }),
    ],
    appState: {},
  },
};

const weeklyPlanner = {
  id: 'weekly-planner',
  title: 'Weekly Planner',
  description: 'Seven weekday columns with an actions sidebar. Moleskine Action Planner style.',
  category: 'Journal',
  creator: 'Moleskine style',
  sceneData: {
    elements: (() => {
      const els = [];
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Actions'];
      const colW = 150;
      const colH = 500;
      const startX = 40;
      const startY = 80;

      // Title
      els.push(text('wp-title', startX, 30, 'Week of March 15, 2026', { fontSize: 26, color: YELLOW }));

      days.forEach((day, i) => {
        const x = startX + i * (colW + 8);
        const isActions = i === 7;
        const color = isActions ? GREEN : WHITE;

        // Column header
        els.push(text(`wp-day-${i}`, x + 10, startY, day, { fontSize: 16, color }));
        // Column box
        els.push(rect(`wp-col-${i}`, x, startY + 30, colW, colH, {
          color,
          strokeStyle: isActions ? 'dashed' : 'solid',
        }));
      });

      return els;
    })(),
    appState: {},
  },
};

const businessModelCanvas = {
  id: 'bmc',
  title: 'Business Model Canvas',
  description: 'The 9-box framework for mapping your entire business model at a glance.',
  category: 'Strategy',
  creator: 'Alexander Osterwalder, 2010',
  sceneData: {
    elements: (() => {
      const els = [];
      const W = 240;
      const H = 260;
      const gap = 4;
      const startX = 40;
      const startY = 80;

      // Title
      els.push(text('bmc-title', startX, 30, 'Business Model Canvas', { fontSize: 28, color: YELLOW }));

      // Row 1: Key Partners | Key Activities / Key Resources | Value Propositions | Customer Relationships / Channels | Customer Segments
      // The BMC layout is a specific 5-column arrangement:
      // Col1: Key Partners (full height)
      // Col2: Key Activities (top) + Key Resources (bottom)
      // Col3: Value Propositions (full height)
      // Col4: Customer Relationships (top) + Channels (bottom)
      // Col5: Customer Segments (full height)
      const fullH = H * 2 + gap;
      const halfH = H;

      const boxes = [
        { label: 'Key Partners', x: 0, y: 0, w: W, h: fullH, color: BLUE },
        { label: 'Key Activities', x: W + gap, y: 0, w: W, h: halfH, color: GREEN },
        { label: 'Key Resources', x: W + gap, y: halfH + gap, w: W, h: halfH, color: GREEN },
        { label: 'Value\nPropositions', x: (W + gap) * 2, y: 0, w: W, h: fullH, color: YELLOW },
        { label: 'Customer\nRelationships', x: (W + gap) * 3, y: 0, w: W, h: halfH, color: PINK },
        { label: 'Channels', x: (W + gap) * 3, y: halfH + gap, w: W, h: halfH, color: PINK },
        { label: 'Customer\nSegments', x: (W + gap) * 4, y: 0, w: W, h: fullH, color: WHITE },
      ];

      boxes.forEach((b, i) => {
        const rx = startX + b.x;
        const ry = startY + b.y;
        els.push(rect(`bmc-r-${i}`, rx, ry, b.w, b.h, { color: b.color }));
        els.push(text(`bmc-t-${i}`, rx + 12, ry + 12, b.label, { fontSize: 16, color: b.color }));
      });

      // Bottom row: Cost Structure | Revenue Streams
      const bottomY = startY + fullH + gap;
      const bottomW = W * 2.5 + gap;

      els.push(rect('bmc-r-cost', startX, bottomY, bottomW, halfH * 0.7, { color: BLUE }));
      els.push(text('bmc-t-cost', startX + 12, bottomY + 12, 'Cost Structure', { fontSize: 16, color: BLUE }));

      els.push(rect('bmc-r-rev', startX + bottomW + gap, bottomY, bottomW, halfH * 0.7, { color: GREEN }));
      els.push(text('bmc-t-rev', startX + bottomW + gap + 12, bottomY + 12, 'Revenue Streams', { fontSize: 16, color: GREEN }));

      return els;
    })(),
    appState: {},
  },
};

const leanCanvas = {
  id: 'lean-canvas',
  title: 'Lean Canvas',
  description: 'One-page business plan adapted for startups. Focus on problems and solutions.',
  category: 'Strategy',
  creator: 'Ash Maurya',
  sceneData: {
    elements: (() => {
      const els = [];
      const W = 240;
      const H = 260;
      const gap = 4;
      const startX = 40;
      const startY = 80;
      const fullH = H * 2 + gap;
      const halfH = H;

      els.push(text('lc-title', startX, 30, 'Lean Canvas', { fontSize: 28, color: YELLOW }));

      const boxes = [
        { label: 'Problem', x: 0, y: 0, w: W, h: fullH, color: PINK },
        { label: 'Solution', x: W + gap, y: 0, w: W, h: halfH, color: GREEN },
        { label: 'Key Metrics', x: W + gap, y: halfH + gap, w: W, h: halfH, color: BLUE },
        { label: 'Unique Value\nProposition', x: (W + gap) * 2, y: 0, w: W, h: fullH, color: YELLOW },
        { label: 'Unfair\nAdvantage', x: (W + gap) * 3, y: 0, w: W, h: halfH, color: GREEN },
        { label: 'Channels', x: (W + gap) * 3, y: halfH + gap, w: W, h: halfH, color: BLUE },
        { label: 'Customer\nSegments', x: (W + gap) * 4, y: 0, w: W, h: fullH, color: WHITE },
      ];

      boxes.forEach((b, i) => {
        const rx = startX + b.x;
        const ry = startY + b.y;
        els.push(rect(`lc-r-${i}`, rx, ry, b.w, b.h, { color: b.color }));
        els.push(text(`lc-t-${i}`, rx + 12, ry + 12, b.label, { fontSize: 16, color: b.color }));
      });

      const bottomY = startY + fullH + gap;
      const bottomW = W * 2.5 + gap;
      els.push(rect('lc-r-cost', startX, bottomY, bottomW, halfH * 0.7, { color: BLUE }));
      els.push(text('lc-t-cost', startX + 12, bottomY + 12, 'Cost Structure', { fontSize: 16, color: BLUE }));
      els.push(rect('lc-r-rev', startX + bottomW + gap, bottomY, bottomW, halfH * 0.7, { color: GREEN }));
      els.push(text('lc-t-rev', startX + bottomW + gap + 12, bottomY + 12, 'Revenue Streams', { fontSize: 16, color: GREEN }));

      return els;
    })(),
    appState: {},
  },
};

const swotAnalysis = {
  id: 'swot',
  title: 'SWOT Analysis',
  description: 'Map Strengths, Weaknesses, Opportunities, and Threats in a 2x2 grid.',
  category: 'Strategy',
  creator: 'Albert Humphrey / Stanford Research Institute',
  sceneData: {
    elements: (() => {
      const els = [];
      const W = 360;
      const H = 280;
      const gap = 8;
      const startX = 80;
      const startY = 80;

      els.push(text('swot-title', startX, 25, 'SWOT Analysis', { fontSize: 28, color: YELLOW }));

      const boxes = [
        { label: 'Strengths', x: 0, y: 0, color: GREEN },
        { label: 'Weaknesses', x: W + gap, y: 0, color: PINK },
        { label: 'Opportunities', x: 0, y: H + gap, color: BLUE },
        { label: 'Threats', x: W + gap, y: H + gap, color: YELLOW },
      ];

      boxes.forEach((b, i) => {
        const rx = startX + b.x;
        const ry = startY + b.y;
        els.push(rect(`swot-r-${i}`, rx, ry, W, H, { color: b.color }));
        els.push(text(`swot-t-${i}`, rx + 16, ry + 16, b.label, { fontSize: 20, color: b.color }));
      });

      return els;
    })(),
    appState: {},
  },
};

const kanbanBoard = {
  id: 'kanban',
  title: 'Kanban Board',
  description: 'Visual workflow with Backlog, To Do, In Progress, and Done columns.',
  category: 'Productivity',
  creator: 'Toyota / David Anderson',
  sceneData: {
    elements: (() => {
      const els = [];
      const columns = ['Backlog', 'To Do', 'In Progress', 'Done'];
      const colW = 220;
      const colH = 500;
      const gap = 16;
      const startX = 60;
      const startY = 80;
      const colors = [WHITE, BLUE, YELLOW, GREEN];

      els.push(text('kb-title', startX, 25, 'Kanban Board', { fontSize: 28, color: YELLOW }));

      columns.forEach((col, i) => {
        const x = startX + i * (colW + gap);
        els.push(text(`kb-h-${i}`, x + 12, startY, col, { fontSize: 18, color: colors[i] }));
        els.push(rect(`kb-c-${i}`, x, startY + 32, colW, colH, {
          color: colors[i],
          strokeStyle: 'dashed',
        }));
      });

      return els;
    })(),
    appState: {},
  },
};

const mindMap = {
  id: 'mind-map',
  title: 'Mind Map',
  description: 'Central idea with radiating branches for brainstorming and idea organization.',
  category: 'Planning',
  creator: 'Tony Buzan',
  sceneData: {
    elements: (() => {
      const els = [];
      const cx = 500;
      const cy = 350;
      const centerW = 180;
      const centerH = 80;

      // Central node
      els.push(ellipse('mm-center', cx - centerW / 2, cy - centerH / 2, centerW, centerH, { color: YELLOW }));
      els.push(text('mm-ct', cx - 50, cy - 12, 'Central Idea', { fontSize: 20, color: YELLOW, textAlign: 'center' }));

      // Branch positions (4 main branches)
      const branches = [
        { label: 'Branch 1', angle: -45, dist: 250, color: GREEN },
        { label: 'Branch 2', angle: 45, dist: 250, color: BLUE },
        { label: 'Branch 3', angle: 135, dist: 250, color: PINK },
        { label: 'Branch 4', angle: -135, dist: 250, color: WHITE },
      ];

      branches.forEach((b, i) => {
        const rad = (b.angle * Math.PI) / 180;
        const bx = cx + Math.cos(rad) * b.dist;
        const by = cy + Math.sin(rad) * b.dist;
        const branchW = 140;
        const branchH = 50;

        els.push(ellipse(`mm-b-${i}`, bx - branchW / 2, by - branchH / 2, branchW, branchH, { color: b.color }));
        els.push(text(`mm-bt-${i}`, bx - 45, by - 10, b.label, { fontSize: 16, color: b.color }));

        // Arrow from center to branch
        const edgeX = Math.cos(rad) * (centerW / 2 + 10);
        const edgeY = Math.sin(rad) * (centerH / 2 + 10);
        els.push(arrow(`mm-a-${i}`, cx + edgeX, cy + edgeY, [
          [0, 0],
          [Math.cos(rad) * (b.dist - centerW / 2 - branchW / 2 - 20), Math.sin(rad) * (b.dist - centerH / 2 - branchH / 2 - 20)],
        ], { color: b.color }));

        // Sub-branches (2 per branch)
        [-30, 30].forEach((offset, j) => {
          const subRad = ((b.angle + offset) * Math.PI) / 180;
          const sx = bx + Math.cos(subRad) * 140;
          const sy = by + Math.sin(subRad) * 100;
          els.push(ellipse(`mm-sb-${i}-${j}`, sx - 55, sy - 20, 110, 40, { color: b.color }));
          els.push(text(`mm-sbt-${i}-${j}`, sx - 35, sy - 8, `Sub ${j + 1}`, { fontSize: 14, color: b.color }));
          els.push(line(`mm-sl-${i}-${j}`, bx, by, [
            [0, 0],
            [sx - bx, sy - by],
          ], { color: b.color, strokeWidth: 0.5 }));
        });
      });

      return els;
    })(),
    appState: {},
  },
};

const eisenhowerMatrix = {
  id: 'eisenhower',
  title: 'Eisenhower Matrix',
  description: 'Prioritize tasks by urgency and importance. Do, Schedule, Delegate, or Eliminate.',
  category: 'Productivity',
  creator: 'Stephen Covey / Dwight Eisenhower',
  sceneData: {
    elements: (() => {
      const els = [];
      const W = 340;
      const H = 260;
      const gap = 8;
      const startX = 140;
      const startY = 120;

      els.push(text('em-title', 80, 25, 'Eisenhower Matrix', { fontSize: 28, color: YELLOW }));

      // Axis labels
      els.push(text('em-urgent', startX + W / 2 - 20, startY - 40, 'URGENT', { fontSize: 14, color: WHITE }));
      els.push(text('em-not-urgent', startX + W + gap + W / 2 - 40, startY - 40, 'NOT URGENT', { fontSize: 14, color: WHITE }));
      els.push(text('em-important', startX - 120, startY + H / 2 - 10, 'IMPORTANT', { fontSize: 14, color: WHITE }));
      els.push(text('em-not-imp', startX - 140, startY + H + gap + H / 2 - 10, 'NOT IMPORTANT', { fontSize: 14, color: WHITE }));

      const quadrants = [
        { label: 'DO FIRST', sub: 'Urgent + Important', x: 0, y: 0, color: PINK },
        { label: 'SCHEDULE', sub: 'Not Urgent + Important', x: W + gap, y: 0, color: GREEN },
        { label: 'DELEGATE', sub: 'Urgent + Not Important', x: 0, y: H + gap, color: YELLOW },
        { label: 'ELIMINATE', sub: 'Neither', x: W + gap, y: H + gap, color: BLUE },
      ];

      quadrants.forEach((q, i) => {
        const rx = startX + q.x;
        const ry = startY + q.y;
        els.push(rect(`em-r-${i}`, rx, ry, W, H, { color: q.color }));
        els.push(text(`em-t-${i}`, rx + 16, ry + 16, q.label, { fontSize: 20, color: q.color }));
        els.push(text(`em-s-${i}`, rx + 16, ry + 44, q.sub, { fontSize: 12, color: q.color }));
      });

      return els;
    })(),
    appState: {},
  },
};

// ============================================================
// CONTENT CREATION TEMPLATES
// ============================================================

const quoteCard = {
  id: 'quote-card',
  title: 'Quote Card',
  description: 'Eye-catching quote card for social media. Large quote marks, attribution line, hand-drawn style.',
  category: 'Content',
  creator: 'Social media visual',
  sceneData: {
    elements: (() => {
      const els = [];
      const cardW = 500;
      const cardH = 400;
      const startX = 60;
      const startY = 60;

      // Card background
      els.push(rect('qc-bg', startX, startY, cardW, cardH, { color: YELLOW, strokeWidth: 2 }));

      // Opening quote mark
      els.push(text('qc-open', startX + 30, startY + 20, '\u201C', { fontSize: 80, color: YELLOW, fontFamily: 1 }));

      // Quote text
      els.push(text('qc-quote', startX + 50, startY + 110, 'Your quote here.\nMake it memorable.', { fontSize: 28, color: WHITE, fontFamily: 1, width: cardW - 100 }));

      // Closing quote mark
      els.push(text('qc-close', startX + cardW - 80, startY + 240, '\u201D', { fontSize: 80, color: YELLOW, fontFamily: 1 }));

      // Separator line
      els.push(line('qc-sep', startX + 50, startY + 310, [[0, 0], [cardW - 100, 0]], { color: PINK, strokeWidth: 1 }));

      // Attribution
      els.push(text('qc-author', startX + 50, startY + 325, '- Author Name', { fontSize: 18, color: PINK, fontFamily: 1 }));

      return els;
    })(),
    appState: {},
  },
};

const codeSnippet = {
  id: 'code-snippet',
  title: 'Code Snippet',
  description: 'Terminal-style code display with traffic light dots. Perfect for dev content.',
  category: 'Content',
  creator: 'Developer content',
  sceneData: {
    elements: (() => {
      const els = [];
      const cardW = 520;
      const cardH = 340;
      const startX = 60;
      const startY = 60;

      // Editor window background
      els.push(rect('cs-bg', startX, startY, cardW, cardH, {
        color: WHITE,
        bg: '#1a1a2e',
        fillStyle: 'solid',
        strokeWidth: 2,
        roundness: { type: 3 },
      }));

      // Top bar
      els.push(rect('cs-topbar', startX, startY, cardW, 36, {
        color: WHITE,
        bg: '#252540',
        fillStyle: 'solid',
        strokeWidth: 0,
        roundness: null,
      }));

      // Traffic light dots
      els.push(ellipse('cs-dot-r', startX + 14, startY + 10, 14, 14, { color: '#ff5f56', bg: '#ff5f56', fillStyle: 'solid' }));
      els.push(ellipse('cs-dot-y', startX + 34, startY + 10, 14, 14, { color: '#ffbd2e', bg: '#ffbd2e', fillStyle: 'solid' }));
      els.push(ellipse('cs-dot-g', startX + 54, startY + 10, 14, 14, { color: '#27c93f', bg: '#27c93f', fillStyle: 'solid' }));

      // File name
      els.push(text('cs-filename', startX + 80, startY + 9, 'app.js', { fontSize: 13, color: '#888899', fontFamily: 3 }));

      // Code text (monospace, green on dark)
      els.push(text('cs-code', startX + 20, startY + 50, 'const idea = getIdea();\n\nif (idea.score > 65) {\n  console.log("BUILD IT");\n  ship(idea);\n} else {\n  validate(idea);\n}', {
        fontSize: 16,
        color: GREEN,
        fontFamily: 3,
        width: cardW - 40,
      }));

      return els;
    })(),
    appState: {},
  },
};

const promptCard = {
  id: 'prompt-card',
  title: 'Prompt Card',
  description: 'Display an AI prompt with a label and hint. Great for sharing prompt templates.',
  category: 'Content',
  creator: 'AI prompt visual',
  sceneData: {
    elements: (() => {
      const els = [];
      const cardW = 480;
      const cardH = 360;
      const startX = 60;
      const startY = 60;

      // Card background
      els.push(rect('pc-bg', startX, startY, cardW, cardH, {
        color: BLUE,
        strokeWidth: 2,
        roundness: { type: 3 },
      }));

      // Corner flourishes (decorative lines)
      els.push(line('pc-fl-tl', startX + 12, startY + 12, [[0, 20], [0, 0], [20, 0]], { color: BLUE, strokeWidth: 1 }));
      els.push(line('pc-fl-tr', startX + cardW - 32, startY + 12, [[0, 0], [20, 0], [20, 20]], { color: BLUE, strokeWidth: 1 }));
      els.push(line('pc-fl-bl', startX + 12, startY + cardH - 32, [[0, 0], [0, 20], [20, 20]], { color: BLUE, strokeWidth: 1 }));
      els.push(line('pc-fl-br', startX + cardW - 32, startY + cardH - 32, [[20, 0], [20, 20], [0, 20]], { color: BLUE, strokeWidth: 1 }));

      // PROMPT label
      els.push(text('pc-label', startX + 30, startY + 30, 'PROMPT', { fontSize: 12, color: BLUE, fontFamily: 2 }));

      // Prompt text
      els.push(text('pc-prompt', startX + 30, startY + 65, 'Act as a senior product manager.\nAnalyze this idea and tell me:\n1. Who is the user?\n2. What pain does it solve?\n3. Why would they pay?', {
        fontSize: 20,
        color: WHITE,
        fontFamily: 1,
        width: cardW - 60,
      }));

      // Hint text
      els.push(text('pc-hint', startX + 30, startY + cardH - 45, 'copy & paste into your favorite AI', { fontSize: 13, color: BLUE, fontFamily: 1 }));

      return els;
    })(),
    appState: {},
  },
};

const xPostMockup = {
  id: 'x-post-mockup',
  title: 'X / Twitter Post',
  description: 'Hand-drawn tweet mockup with profile, text, and engagement metrics.',
  category: 'Content',
  creator: 'Social media mockup',
  sceneData: {
    elements: (() => {
      const els = [];
      const cardW = 500;
      const cardH = 320;
      const startX = 60;
      const startY = 60;

      // Tweet card
      els.push(rect('xp-card', startX, startY, cardW, cardH, {
        color: WHITE,
        strokeWidth: 1,
        roundness: { type: 3 },
      }));

      // Profile circle
      els.push(ellipse('xp-avatar', startX + 16, startY + 16, 44, 44, { color: BLUE, bg: BLUE, fillStyle: 'cross-hatch' }));

      // Display name
      els.push(text('xp-name', startX + 70, startY + 18, 'Your Name', { fontSize: 16, color: WHITE, fontFamily: 2 }));
      // Handle
      els.push(text('xp-handle', startX + 70, startY + 40, '@yourhandle', { fontSize: 14, color: '#888899', fontFamily: 2 }));

      // Tweet body
      els.push(text('xp-body', startX + 20, startY + 80, 'Your tweet goes here.\n\nMake it punchy, make it real.\nThe best posts sound like\nsomething you would actually say.', {
        fontSize: 18,
        color: WHITE,
        fontFamily: 1,
        width: cardW - 40,
      }));

      // Timestamp
      els.push(text('xp-time', startX + 20, startY + 230, '10:42 AM \u00B7 Mar 15, 2026', { fontSize: 13, color: '#888899', fontFamily: 2 }));

      // Separator
      els.push(line('xp-sep', startX + 20, startY + 258, [[0, 0], [cardW - 40, 0]], { color: WHITE, strokeWidth: 0.5 }));

      // Engagement row
      els.push(text('xp-reply', startX + 20, startY + 270, '\uD83D\uDCAC 12', { fontSize: 14, color: '#888899', fontFamily: 2 }));
      els.push(text('xp-rt', startX + 120, startY + 270, '\uD83D\uDD01 48', { fontSize: 14, color: '#888899', fontFamily: 2 }));
      els.push(text('xp-like', startX + 220, startY + 270, '\u2764\uFE0F 247', { fontSize: 14, color: '#888899', fontFamily: 2 }));
      els.push(text('xp-share', startX + 340, startY + 270, '\u2197\uFE0F 8', { fontSize: 14, color: '#888899', fontFamily: 2 }));

      return els;
    })(),
    appState: {},
  },
};

// ============================================================
// EXPORTS
// ============================================================

export const boardTemplates = [
  dailyPage,
  weeklyPlanner,
  businessModelCanvas,
  leanCanvas,
  swotAnalysis,
  kanbanBoard,
  mindMap,
  eisenhowerMatrix,
  quoteCard,
  codeSnippet,
  promptCard,
  xPostMockup,
];

export const boardCategories = ['All', 'Journal', 'Strategy', 'Planning', 'Productivity', 'Content'];
