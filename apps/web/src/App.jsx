import React, { Suspense, lazy, useEffect } from 'react';
import { Route, Routes, BrowserRouter as Router, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext.jsx';
import { AuthProvider } from '@/contexts/AuthContext.jsx';
import { Toaster } from '@/components/ui/toaster.jsx';
import ScrollToTop from '@/components/ScrollToTop.jsx';
import GridBackground from '@/components/GridBackground.jsx';
import { ProtectedRoute } from '@/components/ProtectedRoute.jsx';
import { HelmetProvider } from 'react-helmet-async';
import { AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

import { ErrorBoundary } from '@/components/ErrorBoundary.jsx';
import { trackPageView } from '@/lib/analytics.js';

// Lazy-loaded pages
const HomePage = lazy(() => import('@/pages/HomePage.jsx'));
const ExplorePage = lazy(() => import('@/pages/ExplorePage.jsx'));
const PromptsPage = lazy(() => import('@/pages/PromptsPage.jsx'));
const NotionTemplatesPage = lazy(() => import('@/pages/NotionTemplatesPage.jsx'));
const GarminToNotionPage = lazy(() => import('@/pages/GarminToNotionPage.jsx'));
const NewsletterPage = lazy(() => import('@/pages/NewsletterPage.jsx'));
const IdeaSubmissionPage = lazy(() => import('@/pages/IdeaSubmissionPage.jsx'));
const AboutPage = lazy(() => import('@/pages/AboutPage.jsx'));
const LoginPage = lazy(() => import('@/pages/LoginPage.jsx'));
const SignupPage = lazy(() => import('@/pages/SignupPage.jsx'));
const MicroSaasPage = lazy(() => import('@/pages/MicroSaasPage.jsx'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage.jsx'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage.jsx'));

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

// Component to track page views on route change
const PageTracker = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  return null;
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/ideas" element={<IdeaSubmissionPage />} />
        <Route path="/newsletter" element={<NewsletterPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected Routes */}
        <Route path="/prompts" element={<PromptsPage />} />
        <Route path="/templates" element={<ProtectedRoute><NotionTemplatesPage /></ProtectedRoute>} />
        <Route path="/templates/garmin-to-notion" element={<ProtectedRoute><GarminToNotionPage /></ProtectedRoute>} />
        <Route path="/microsaas" element={<MicroSaasPage />} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <ErrorBoundary>
              <ScrollToTop />
              <PageTracker />
              <GridBackground />

              <Suspense fallback={<PageFallback />}>
                <AnimatedRoutes />
              </Suspense>
              <Toaster />
            </ErrorBoundary>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
