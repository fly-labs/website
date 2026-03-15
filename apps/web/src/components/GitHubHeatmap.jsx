import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Trophy, Calendar, Github } from 'lucide-react';
import { cn } from '@/lib/utils.js';
import { fetchContributions, fetchRecentCommits } from '@/lib/githubApi.js';
import { trackEvent } from '@/lib/analytics.js';

const INTENSITY_CLASSES = [
  'bg-muted',
  'bg-primary/20',
  'bg-primary/40',
  'bg-primary/60',
  'bg-primary',
];

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS_SHORT = ['', 'M', '', 'W', '', 'F', ''];

const DAY_LABELS_FULL = [
  { label: 'Mon', row: 1 },
  { label: 'Wed', row: 3 },
  { label: 'Fri', row: 5 },
];

// Shared layout constants
const COMPACT_LABEL_W = 16;
const FULL_LABEL_W = 28;
const COMPACT_GAP = 3;
const FULL_GAP = 2;

function getMonthPositions(weeks) {
  const positions = [];
  let lastMonth = -1;
  weeks.forEach((week, colIdx) => {
    const firstDay = week.find((d) => d);
    if (!firstDay) return;
    const month = new Date(firstDay.date + 'T00:00:00').getMonth();
    if (month !== lastMonth) {
      positions.push({ month, col: colIdx });
      lastMonth = month;
    }
  });
  return positions;
}

function getDateRange(weeks) {
  const firstWeek = weeks[0];
  const lastWeek = weeks[weeks.length - 1];
  const firstDay = firstWeek.find((d) => d);
  const lastDay = [...lastWeek].reverse().find((d) => d);
  if (!firstDay || !lastDay) return '';
  const from = new Date(firstDay.date + 'T00:00:00');
  const to = new Date(lastDay.date + 'T00:00:00');
  const fmt = (d) => `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
  return `${fmt(from)} - ${fmt(to)}`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Tooltip({ children, text }) {
  const [show, setShow] = useState(false);
  const ref = useRef(null);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={() => setShow(prev => !prev)}
    >
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 text-xs font-medium rounded-md bg-popover text-popover-foreground border border-border shadow-md whitespace-nowrap z-50 pointer-events-none">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-popover" />
        </div>
      )}
    </div>
  );
}

function SkeletonGrid({ cols, labelWidth, gap }) {
  return (
    <div className="animate-pulse w-full">
      {/* Month labels spacer row */}
      <div className="flex" style={{ gap: `${gap}px` }}>
        <div className="shrink-0" style={{ width: `${labelWidth}px` }} />
        <div
          className="grid w-full flex-1"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gap: `${gap}px`,
          }}
        >
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-3" />
          ))}
        </div>
      </div>

      {/* Day labels + cells */}
      <div className="flex" style={{ gap: `${gap}px` }}>
        <div className="grid grid-rows-7 shrink-0" style={{ width: `${labelWidth}px`, gap: `${gap}px` }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="aspect-square" />
          ))}
        </div>
        <div
          className="grid w-full flex-1"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridTemplateRows: 'repeat(7, 1fr)',
            gridAutoFlow: 'column',
            gap: `${gap}px`,
          }}
        >
          {Array.from({ length: cols * 7 }).map((_, i) => (
            <div key={i} className="rounded-sm bg-muted aspect-square" />
          ))}
        </div>
      </div>
    </div>
  );
}

function MonthLabelsRow({ weeks, labelWidth, gap }) {
  const monthPositions = useMemo(() => getMonthPositions(weeks), [weeks]);

  return (
    <div className="flex" style={{ gap: `${gap}px` }}>
      <div className="shrink-0" style={{ width: `${labelWidth}px` }} />
      <div
        className="grid w-full flex-1"
        style={{
          gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))`,
          gap: `${gap}px`,
        }}
      >
        {weeks.map((_, colIdx) => {
          const pos = monthPositions.find((p) => p.col === colIdx);
          return (
            <div key={colIdx} className="text-[10px] text-muted-foreground/60 leading-none h-3 truncate">
              {pos ? MONTH_LABELS[pos.month] : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompactHeatmapGrid({ weeks }) {
  return (
    <div className="w-full flex flex-col gap-1">
      <MonthLabelsRow weeks={weeks} labelWidth={COMPACT_LABEL_W} gap={COMPACT_GAP} />

      {/* Day labels + cells */}
      <div className="flex" style={{ gap: `${COMPACT_GAP}px` }}>
        {/* Day of week labels */}
        <div className="grid grid-rows-7 shrink-0" style={{ width: `${COMPACT_LABEL_W}px`, gap: `${COMPACT_GAP}px` }}>
          {DAY_LABELS_SHORT.map((label, i) => (
            <div key={i} className="aspect-square flex items-center justify-end pr-0.5">
              <span className="text-[9px] text-muted-foreground/50 leading-none">{label}</span>
            </div>
          ))}
        </div>

        {/* Cells */}
        <div
          className="grid w-full flex-1"
          style={{
            gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))`,
            gridTemplateRows: 'repeat(7, 1fr)',
            gridAutoFlow: 'column',
            gap: `${COMPACT_GAP}px`,
          }}
        >
          {weeks.map((week, colIdx) =>
            week.map((day, rowIdx) => (
              <div
                key={`${colIdx}-${rowIdx}`}
                className={cn(
                  'rounded-sm aspect-square',
                  INTENSITY_CLASSES[day.intensity] || INTENSITY_CLASSES[0]
                )}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function FullHeatmapGrid({ weeks }) {
  return (
    <div className="w-full flex flex-col gap-1">
      <MonthLabelsRow weeks={weeks} labelWidth={FULL_LABEL_W} gap={FULL_GAP} />

      {/* Day labels + cells */}
      <div className="flex" style={{ gap: `${FULL_GAP}px` }}>
        {/* Day labels */}
        <div className="grid grid-rows-7 shrink-0" style={{ width: `${FULL_LABEL_W}px`, gap: `${FULL_GAP}px` }}>
          {Array.from({ length: 7 }).map((_, row) => {
            const dayLabel = DAY_LABELS_FULL.find((d) => d.row === row);
            return (
              <div key={row} className="aspect-square flex items-center justify-end pr-1">
                <span className="text-[10px] text-muted-foreground leading-none">
                  {dayLabel ? dayLabel.label : ''}
                </span>
              </div>
            );
          })}
        </div>

        {/* Grid cells */}
        <div
          className="grid w-full flex-1"
          style={{
            gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))`,
            gridTemplateRows: 'repeat(7, 1fr)',
            gridAutoFlow: 'column',
            gap: `${FULL_GAP}px`,
          }}
        >
          {weeks.map((week, colIdx) =>
            week.map((day, rowIdx) => (
              <Tooltip
                key={`${colIdx}-${rowIdx}`}
                text={`${day.count} contribution${day.count !== 1 ? 's' : ''} on ${formatDate(day.date)}`}
              >
                <div
                  className={cn(
                    'rounded-sm cursor-default aspect-square',
                    INTENSITY_CLASSES[day.intensity] || INTENSITY_CLASSES[0]
                  )}
                />
              </Tooltip>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <span>Less</span>
      {INTENSITY_CLASSES.map((cls, i) => (
        <div key={i} className={cn('w-2.5 h-2.5 rounded-sm', cls)} />
      ))}
      <span>More</span>
    </div>
  );
}

function Stats({ stats }) {
  const items = [
    { icon: Calendar, label: 'contributions', value: stats.total },
    { icon: Flame, label: 'current streak', value: `${stats.currentStreak}d` },
    { icon: Trophy, label: 'longest streak', value: `${stats.longestStreak}d` },
  ];

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <item.icon className="w-3.5 h-3.5" />
          <span className="font-semibold text-foreground">{item.value}</span>
          <span>{item.label}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <span>Most active:</span>
        <span className="font-semibold text-foreground">{stats.mostActiveDay}</span>
      </div>
    </div>
  );
}

function timeAgoShort(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 604800)}w ago`;
}

function CommitSkeleton() {
  return (
    <div className="animate-pulse space-y-2.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="w-14 h-3.5 bg-muted rounded shrink-0 mt-0.5" />
          <div className="flex-1 h-3.5 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

export function RecentCommits({ count = 10 }) {
  const [commits, setCommits] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchRecentCommits(count).then((result) => {
      if (!cancelled) {
        setCommits(result);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [count]);

  if (!loading && !commits) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Recent updates</h4>
        <a
          href="https://github.com/fly-labs/website/commits/main"
          target="_blank"
          rel="noreferrer"
          className="text-[11px] font-medium text-muted-foreground/50 hover:text-primary transition-colors"
          onClick={() => trackEvent('outbound_click', { link_url: 'https://github.com/fly-labs/website/commits/main', link_label: 'View all commits', location: 'github_heatmap' })}
        >
          View all
        </a>
      </div>

      {loading ? (
        <CommitSkeleton />
      ) : (
        <div className="space-y-0">
          {commits.map((commit) => (
            <a
              key={commit.sha}
              href={commit.url}
              target="_blank"
              rel="noreferrer"
              className="group flex items-start gap-3 py-1.5 hover:bg-muted/30 -mx-2 px-2 rounded transition-colors"
              onClick={() => trackEvent('outbound_click', { link_url: commit.url, link_label: commit.message, location: 'recent_commits' })}
            >
              <code className="text-[11px] font-mono text-primary/60 group-hover:text-primary shrink-0 mt-[1px] transition-colors">
                {commit.sha}
              </code>
              <span className="text-[13px] text-muted-foreground group-hover:text-foreground leading-snug flex-1 min-w-0 truncate transition-colors">
                {commit.message}
              </span>
              <span className="text-[10px] text-muted-foreground/40 shrink-0 mt-[2px] tabular-nums">
                {timeAgoShort(commit.date)}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export function GitHubHeatmap({ variant = 'full' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const compact = variant === 'compact';

  useEffect(() => {
    let cancelled = false;
    fetchContributions().then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  if (!loading && !data) return null;

  if (compact) {
    const dateRange = data ? getDateRange(data.weeks) : '';

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <a
            href="https://github.com/fly-labs"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors"
          >
            <Github className="w-4 h-4" />
            <h3 className="text-sm font-bold">GitHub Activity</h3>
          </a>
          {dateRange && (
            <span className="text-[11px] text-muted-foreground/60 font-medium">{dateRange}</span>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <SkeletonGrid cols={52} labelWidth={COMPACT_LABEL_W} gap={COMPACT_GAP} />
        ) : (
          <CompactHeatmapGrid weeks={data.weeks} />
        )}

        {/* Footer */}
        {!loading && data && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{data.stats.total}</span> contributions
              </p>
              <Legend />
            </div>
            <Link
              to="/about"
              className="inline-flex items-center text-xs font-semibold text-primary hover:underline"
            >
              See full activity <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
        )}
      </div>
    );
  }

  const dateRange = data ? getDateRange(data.weeks) : '';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <a
          href="https://github.com/fly-labs"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors"
        >
          <Github className="w-4 h-4" />
          <h3 className="text-sm font-bold">GitHub Activity</h3>
        </a>
        {dateRange && (
          <span className="text-[11px] text-muted-foreground/60 font-medium">{dateRange}</span>
        )}
      </div>

      {loading ? (
        <SkeletonGrid cols={52} labelWidth={FULL_LABEL_W} gap={FULL_GAP} />
      ) : (
        <>
          <FullHeatmapGrid weeks={data.weeks} />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <Stats stats={data.stats} />
            <Legend />
          </div>
        </>
      )}
    </div>
  );
}

export default GitHubHeatmap;
