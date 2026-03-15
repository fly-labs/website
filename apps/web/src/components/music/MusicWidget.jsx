import React, { lazy, Suspense, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useMusic } from '@/contexts/MusicContext.jsx';
import { MusicTrigger } from '@/components/music/MusicTrigger.jsx';
import { trackEvent } from '@/lib/analytics.js';

const MusicPanel = lazy(() =>
  import('@/components/music/MusicPanel.jsx').then(m => ({ default: m.MusicPanel }))
);

export function MusicWidget() {
  const location = useLocation();
  const { isPanelOpen, isPlaying, togglePanel, closePanel, hasTracks } = useMusic();
  const [hasEverOpened, setHasEverOpened] = useState(false);

  // Sync hasEverOpened when panel is opened externally (FlyBot bridge)
  useEffect(() => {
    if (isPanelOpen && !hasEverOpened) setHasEverOpened(true);
  }, [isPanelOpen, hasEverOpened]);

  if (!hasTracks) return null;

  const handleToggle = () => {
    if (!hasEverOpened) setHasEverOpened(true);
    const newState = !isPanelOpen;
    togglePanel();
    trackEvent('music_player_toggled', { state: newState ? 'open' : 'close' });
  };

  return (
    <>
      <MusicTrigger isOpen={isPanelOpen} isPlaying={isPlaying} onToggle={handleToggle} />

      {hasEverOpened && (
        <Suspense fallback={null}>
          <MusicPanel isOpen={isPanelOpen} onClose={closePanel} />
        </Suspense>
      )}
    </>
  );
}
