import React, { lazy, Suspense, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useChatContext } from '@/contexts/ChatContext.jsx';
import { FlyBotTrigger } from '@/components/flybot/FlyBotTrigger.jsx';

const FlyBotPanel = lazy(() =>
  import('@/components/flybot/FlyBotPanel.jsx').then(m => ({ default: m.FlyBotPanel }))
);

export function FlyBotWidget() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isWidgetOpen, toggleWidget, closeWidget, limitReached } = useChatContext();
  const [hasEverOpened, setHasEverOpened] = useState(false);

  // Track when widget is opened externally (e.g. from PromptsPage CTA)
  React.useEffect(() => {
    if (isWidgetOpen && !hasEverOpened) setHasEverOpened(true);
  }, [isWidgetOpen, hasEverOpened]);

  // Hide on the full-page FlyBot chat route
  if (location.pathname === '/flybot/chat') return null;

  const handleToggle = () => {
    // Guests see the trigger but get redirected to login when they click
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!hasEverOpened) setHasEverOpened(true);
    toggleWidget();
  };

  return (
    <>
      <FlyBotTrigger isOpen={isWidgetOpen} onToggle={handleToggle} limitReached={limitReached} />

      {/* Panel stays mounted after first open for AnimatePresence exit animations */}
      {hasEverOpened && isAuthenticated && (
        <Suspense fallback={null}>
          <FlyBotPanel isOpen={isWidgetOpen} onClose={closeWidget} />
        </Suspense>
      )}
    </>
  );
}
