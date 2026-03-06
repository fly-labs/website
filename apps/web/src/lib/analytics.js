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
  gtag('event', 'page_view', {
    page_path: path,
    page_title: document.title,
    page_location: window.location.href,
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
  gtag('config', GA_ID, { user_id: userId || undefined });
};
