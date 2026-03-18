const GA_ID = import.meta.env.VITE_GA_ID || '';
const IS_DEV = import.meta.env.DEV;

// Dynamically load GA4 when a measurement ID is configured
if (GA_ID && typeof window !== 'undefined') {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { send_page_view: false });
}

const gtag = (...args) => {
  if (typeof window !== 'undefined' && window.gtag && GA_ID) {
    if (IS_DEV) console.log('[GA4]', ...args);
    window.gtag(...args);
  }
};

export const trackPageView = (path) => {
  // Parse UTM params from URL
  const params = new URLSearchParams(window.location.search);
  const utmParams = {};
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
    const val = params.get(key);
    if (val) utmParams[key] = val;
  }

  gtag('event', 'page_view', {
    page_path: path,
    page_title: document.title,
    page_location: window.location.href,
    page_referrer: document.referrer || undefined,
    ...utmParams,
    ...(IS_DEV ? { debug_mode: true } : {}),
  });
};

export const trackEvent = (eventName, params = {}) => {
  gtag('event', eventName, {
    ...params,
    ...(IS_DEV ? { debug_mode: true } : {}),
  });
};

export const trackError = (message, fatal = false) => {
  gtag('event', 'exception', {
    description: String(message).slice(0, 150),
    fatal,
    ...(IS_DEV ? { debug_mode: true } : {}),
  });
};

// Set GA4 user properties for authenticated sessions
export const setUserProperties = (properties) => {
  gtag('set', 'user_properties', properties);
};

// Set user ID for cross-device tracking
export const setUserId = (userId) => {
  gtag('set', { user_id: userId || undefined });
};

// Core Web Vitals reporting (lazy-loaded, zero bundle cost)
export const trackWebVitals = () => {
  import('web-vitals').then(({ onCLS, onLCP, onFCP, onTTFB, onINP }) => {
    const send = (metric) => {
      trackEvent('web_vitals', {
        metric_name: metric.name,
        metric_value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        metric_rating: metric.rating,
        metric_id: metric.id,
      });
    };
    onCLS(send);
    onLCP(send);
    onFCP(send);
    onTTFB(send);
    onINP(send);
  }).catch(() => {});
};

// Scroll depth tracking (fires at 25/50/75/90%, once each)
export const trackScrollDepth = (pageName) => {
  const thresholds = [25, 50, 75, 90];
  const fired = new Set();

  const handler = () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) return;
    const pct = Math.round((window.scrollY / scrollHeight) * 100);

    for (const t of thresholds) {
      if (pct >= t && !fired.has(t)) {
        fired.add(t);
        trackEvent('scroll_depth', { page: pageName, depth: t });
      }
    }

    if (fired.size === thresholds.length) {
      window.removeEventListener('scroll', handler, { passive: true });
    }
  };

  window.addEventListener('scroll', handler, { passive: true });
  return () => window.removeEventListener('scroll', handler, { passive: true });
};

// Debounced event tracking (prevents rapid duplicate clicks)
const _eventCooldowns = new Map();
export const trackEventOnce = (eventName, params = {}, cooldownMs = 1000) => {
  const key = `${eventName}:${JSON.stringify(params)}`;
  const now = Date.now();
  const last = _eventCooldowns.get(key) || 0;
  if (now - last < cooldownMs) return;
  _eventCooldowns.set(key, now);
  trackEvent(eventName, params);
};
