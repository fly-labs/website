import React from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { AuthModal } from '@/components/AuthModal.jsx';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative z-10" role="status" aria-label="Loading">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground font-medium">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthModal />;
  }

  return <>{children}</>;
};
