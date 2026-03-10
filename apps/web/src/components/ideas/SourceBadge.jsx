import { trackEvent } from '@/lib/analytics.js';

const sourceConfig = {
  problemhunt: { label: 'ProblemHunt', color: 'text-accent', fallbackUrl: 'https://problemhunt.pro' },
  reddit: { color: 'text-red-500' },
  producthunt: { label: 'Product Hunt', color: 'text-orange-600', fallbackUrl: 'https://producthunt.com' },
  x: { label: 'X', color: 'text-foreground' },
  hackernews: { label: 'Hacker News', color: 'text-orange-500', fallbackUrl: 'https://news.ycombinator.com' },
  github: { color: 'text-muted-foreground' },
};

const SourceBadge = ({ source, sourceUrl, tags, name, location = 'ideas' }) => {
  const config = sourceConfig[source];

  if (!config) {
    return <span>by {name || 'Anonymous'}</span>;
  }

  // Reddit: show subreddit from tags
  if (source === 'reddit') {
    const subreddit = tags?.split(',')[0]?.trim();
    const label = subreddit ? `r/${subreddit}` : 'via Reddit';
    return sourceUrl ? (
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${config.color} hover:underline font-medium`}
        onClick={(e) => { e.stopPropagation(); trackEvent('outbound_click', { link_url: sourceUrl, link_label: label, location }); }}
      >
        {label}
      </a>
    ) : (
      <span className={`${config.color} font-medium`}>{label}</span>
    );
  }

  // GitHub: show repo name from tags
  if (source === 'github') {
    const label = tags || 'via GitHub';
    return sourceUrl ? (
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${config.color} hover:underline font-medium`}
        onClick={(e) => { e.stopPropagation(); trackEvent('outbound_click', { link_url: sourceUrl, link_label: label, location }); }}
      >
        {label}
      </a>
    ) : (
      <span className={`${config.color} font-medium`}>{label}</span>
    );
  }

  // Other sources
  const url = sourceUrl || config.fallbackUrl;
  const label = `via ${config.label}`;

  return url ? (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${config.color} hover:underline font-medium`}
      onClick={(e) => { e.stopPropagation(); trackEvent('outbound_click', { link_url: url, link_label: config.label, location }); }}
    >
      {label}
    </a>
  ) : (
    <span className={`${config.color} font-medium`}>{label}</span>
  );
};

export default SourceBadge;
