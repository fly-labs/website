import React from 'react';
import { trackError } from '@/lib/analytics.js';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    trackError(error?.message || 'Unknown error', true);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="max-w-md w-full text-center bg-card border border-border rounded-3xl p-10 shadow-xl">
            <h1 className="text-3xl font-black tracking-tight mb-3">Something went wrong</h1>
            <p className="text-muted-foreground font-medium mb-8">
              Try refreshing the page. If the problem persists, reach out at flylabs.fun/about.
            </p>
            <button
              onClick={() => { window.location.href = '/'; }}
              className="inline-flex items-center px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
            >
              Go home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
