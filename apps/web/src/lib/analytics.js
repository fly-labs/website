const GA_ID = import.meta.env.VITE_GA_ID || '';

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

export const trackPageView = (path) => {
  if (typeof window !== 'undefined' && window.gtag && GA_ID) {
    window.gtag('event', 'page_view', { page_path: path });
  }
};

