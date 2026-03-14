import React, { lazy, Suspense, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useChatContext } from '@/contexts/ChatContext.jsx';
import { FlyBotTrigger } from '@/components/flybot/FlyBotTrigger.jsx';

const FlyBotPanel = lazy(() =>
  import('@/components/flybot/FlyBotPanel.jsx').then(m => ({ default: m.FlyBotPanel }))
);

export function FlyBotWidget() {
  const location = useLocation();
  const { isWidgetOpen, toggleWidget, closeWidget, limitReached } = useChatContext();
  const [hasEverOpened, setHasEverOpened] = useState(false);

  // Hide on the full-page FlyBot route
  if (location.pathname === '/flybot') return null;

  const handleToggle = () => {
    if (!hasEverOpened) setHasEverOpened(true);
    toggleWidget();
  };

  return (
    <>
      <FlyBotTrigger isOpen={isWidgetOpen} onToggle={handleToggle} limitReached={limitReached} />

      {/* Panel stays mounted after first open for AnimatePresence exit animations */}
      {hasEverOpened && (
        <Suspense fallback={null}>
          <FlyBotPanel isOpen={isWidgetOpen} onClose={closeWidget} />
        </Suspense>
      )}
    </>
  );
}
