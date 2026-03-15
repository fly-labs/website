import React, { createContext, useContext, useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { vibes, tracks } from '@/lib/data/tracks.js';
import { trackEvent } from '@/lib/analytics.js';

const MusicContext = createContext(null);

export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error('useMusic must be used within MusicProvider');
  return ctx;
}

function generateShuffleOrder(length) {
  const order = Array.from({ length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

function getInitialVibe() {
  if (typeof window === 'undefined') return vibes[0];
  const savedId = localStorage.getItem('flylab-music-vibe');
  if (savedId) {
    const found = vibes.find(v => v.id === savedId);
    if (found) return found;
  }
  return vibes[0];
}

export function MusicProvider({ children }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [currentVibe, setCurrentVibeState] = useState(getInitialVibe);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolumeState] = useState(() => {
    if (typeof window === 'undefined') return 0.5;
    const saved = localStorage.getItem('flylab-music-volume');
    return saved !== null ? parseFloat(saved) : 0.5;
  });
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isShuffle] = useState(true);
  const [shuffleOrder, setShuffleOrder] = useState(() => generateShuffleOrder(currentVibe.tracks.length));
  const [pendingPlay, setPendingPlay] = useState(false);
  const [trackTransition, setTrackTransition] = useState(false);
  const [trackError, setTrackError] = useState(null);

  const isIOSDevice = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }, []);

  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const analyserRef = useRef(null);
  const playSourceRef = useRef('user');
  const isPlayingRef = useRef(false);

  // Refs to avoid stale closures in audio event handlers
  const vibeRef = useRef(currentVibe);
  const shuffleOrderRef = useRef(shuffleOrder);
  const trackIndexRef = useRef(currentTrackIndex);

  isPlayingRef.current = isPlaying;
  vibeRef.current = currentVibe;
  shuffleOrderRef.current = shuffleOrder;
  trackIndexRef.current = currentTrackIndex;

  // Active tracks from current vibe
  const vibeTracks = currentVibe.tracks;
  const vibeTrackCount = vibeTracks.length;

  // Resolve the actual track index through shuffle mapping
  const getActualIndex = useCallback((idx) => {
    if (isShuffle && shuffleOrder.length > 0) {
      return shuffleOrder[idx % shuffleOrder.length];
    }
    return idx % vibeTrackCount;
  }, [isShuffle, shuffleOrder, vibeTrackCount]);

  const currentTrack = vibeTrackCount > 0 ? vibeTracks[getActualIndex(currentTrackIndex)] : null;

  // Load a track into the audio element by playlist index
  const loadTrack = useCallback((index) => {
    const audio = audioRef.current;
    if (!audio || vibeTrackCount === 0) return;
    const actualIdx = isShuffle && shuffleOrder.length > 0
      ? shuffleOrder[index % shuffleOrder.length]
      : index % vibeTrackCount;
    const track = vibeTracks[actualIdx];
    if (!track) return;
    audio.src = track.src;
    audio.load();
  }, [isShuffle, shuffleOrder, vibeTracks, vibeTrackCount]);

  // Advance to next track (loop within current vibe) — uses refs for freshness
  const advanceTrack = useCallback(() => {
    setTrackTransition(true);
    setTimeout(() => setTrackTransition(false), 300);

    const count = vibeRef.current.tracks.length;
    setCurrentTrackIndex(prevIdx => (prevIdx + 1) % count);
  }, []);

  // Switch vibe
  const setVibe = useCallback((vibeId) => {
    const vibe = vibes.find(v => v.id === vibeId);
    if (!vibe || vibe.id === vibeRef.current.id) return;

    const newShuffleOrder = generateShuffleOrder(vibe.tracks.length);

    setCurrentVibeState(vibe);
    setShuffleOrder(newShuffleOrder);
    setCurrentTrackIndex(0);
    localStorage.setItem('flylab-music-vibe', vibeId);

    // Load first track of new vibe
    const audio = audioRef.current;
    if (audio && vibe.tracks.length > 0) {
      const firstTrack = vibe.tracks[isShuffle ? newShuffleOrder[0] : 0];
      if (firstTrack) {
        audio.src = firstTrack.src;
        audio.load();

        if (isPlayingRef.current) {
          const onCanPlay = () => {
            audio.play().catch(() => {});
            audio.removeEventListener('canplay', onCanPlay);
          };
          audio.addEventListener('canplay', onCanPlay);
        }
      }
    }

    trackEvent('music_vibe_changed', { vibe: vibeId });
  }, [isShuffle]);

  // Load + autoplay when currentTrackIndex changes
  const prevTrackIndexRef = useRef(currentTrackIndex);
  useEffect(() => {
    if (prevTrackIndexRef.current === currentTrackIndex) return;
    prevTrackIndexRef.current = currentTrackIndex;
    loadTrack(currentTrackIndex);

    if (isPlayingRef.current) {
      const audio = audioRef.current;
      if (!audio) return;
      const onCanPlay = () => {
        audio.play().catch(() => {});
        audio.removeEventListener('canplay', onCanPlay);
      };
      audio.addEventListener('canplay', onCanPlay);
    }
  }, [currentTrackIndex, loadTrack]);

  // Initialize Audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = volume;
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
    };
    const onEnded = () => advanceTrack();
    const onError = () => {
      // Use refs for current state (avoid stale closures)
      const vibe = vibeRef.current;
      const order = shuffleOrderRef.current;
      const idx = trackIndexRef.current;
      const actualIdx = order.length > 0 ? order[idx % order.length] : idx % vibe.tracks.length;
      const failedTrack = vibe.tracks[actualIdx];
      if (failedTrack) {
        setTrackError(failedTrack.title);
        setTimeout(() => setTrackError(null), 3000);
      }
      advanceTrack();
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.pause();
      audio.src = '';
    };
  }, [advanceTrack]);

  // Initialize Web Audio API lazily on first play
  const initAudioContext = useCallback(() => {
    if (audioContextRef.current || !audioRef.current) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const source = ctx.createMediaElementSource(audioRef.current);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      audioContextRef.current = ctx;
      sourceNodeRef.current = source;
      analyserRef.current = analyser;
    } catch (e) {
      // Web Audio API unavailable
    }
  }, []);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || vibeTrackCount === 0) return;

    if (!audio.src || audio.src === window.location.href) {
      loadTrack(currentTrackIndex);
    }

    initAudioContext();

    if (audioContextRef.current?.state === 'suspended') {
      try { await audioContextRef.current.resume(); } catch (e) {}
    }

    try {
      await audio.play();
      setIsPlaying(true);
      setPendingPlay(false);
      const track = vibeTracks[getActualIndex(currentTrackIndex)];
      if (track) {
        trackEvent('music_track_played', {
          track_title: track.title,
          track_artist: track.artist,
          vibe: currentVibe.id,
          source: playSourceRef.current,
        });
      }
    } catch (e) {
      if (e.name === 'NotAllowedError') {
        setPendingPlay(true);
        setIsPanelOpen(true);
      }
    }
  }, [currentTrackIndex, loadTrack, initAudioContext, getActualIndex, vibeTracks, vibeTrackCount, currentVibe.id]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      playSourceRef.current = 'user';
      play();
    }
  }, [isPlaying, play, pause]);

  const next = useCallback(() => {
    const track = currentTrack;
    if (track) {
      trackEvent('music_track_skipped', { track_title: track.title, direction: 'next' });
    }
    advanceTrack();
  }, [currentTrack, advanceTrack]);

  const prev = useCallback(() => {
    const audio = audioRef.current;
    const track = currentTrack;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    if (track) {
      trackEvent('music_track_skipped', { track_title: track.title, direction: 'prev' });
    }
    setTrackTransition(true);
    setTimeout(() => setTrackTransition(false), 300);
    setCurrentTrackIndex(idx => (idx === 0 ? vibeTrackCount - 1 : idx - 1));
  }, [currentTrack, vibeTrackCount]);

  const setVolume = useCallback((v) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    if (audioRef.current) audioRef.current.volume = clamped;
    localStorage.setItem('flylab-music-volume', String(clamped));
  }, []);

  const seekTo = useCallback((ratio) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    audio.currentTime = ratio * audio.duration;
  }, []);

  const openPanel = useCallback(() => setIsPanelOpen(true), []);
  const closePanel = useCallback(() => setIsPanelOpen(false), []);
  const togglePanel = useCallback(() => setIsPanelOpen(p => !p), []);

  const playFromFlyBot = useCallback((vibeId) => {
    playSourceRef.current = 'flybot';
    if (vibeId) {
      const vibe = vibes.find(v => v.id === vibeId);
      if (vibe) {
        const newShuffleOrder = generateShuffleOrder(vibe.tracks.length);
        setCurrentVibeState(vibe);
        setShuffleOrder(newShuffleOrder);
        setCurrentTrackIndex(0);
        localStorage.setItem('flylab-music-vibe', vibeId);
      }
    }
    setIsPanelOpen(true);
    play();
  }, [play]);

  // FlyBot bridge via CustomEvent
  useEffect(() => {
    const handler = (e) => {
      const action = e.detail?.action;
      const vibe = e.detail?.vibe;
      if (action === 'play') playFromFlyBot(vibe);
      else if (action === 'pause') pause();
      else if (action === 'open') openPanel();
    };
    window.addEventListener('flybot-music-action', handler);
    return () => window.removeEventListener('flybot-music-action', handler);
  }, [playFromFlyBot, pause, openPanel]);

  // MediaSession API for lock screen / notification controls
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: `Fly Labs — ${currentVibe.name}`,
    });

    navigator.mediaSession.setActionHandler('play', play);
    navigator.mediaSession.setActionHandler('pause', pause);
    navigator.mediaSession.setActionHandler('nexttrack', next);
    navigator.mediaSession.setActionHandler('previoustrack', prev);
  }, [currentTrack, currentVibe.name, play, pause, next, prev]);

  const value = useMemo(() => ({
    isPlaying,
    isPanelOpen,
    currentTrackIndex,
    currentTrack,
    currentVibe,
    vibes,
    volume,
    progress,
    duration,
    currentTime,
    isShuffle,
    pendingPlay,
    trackTransition,
    trackError,
    isIOSDevice,
    analyserRef,
    hasTracks: vibeTrackCount > 0,
    trackCount: vibeTrackCount,
    totalTrackCount: tracks.length,
    play,
    pause,
    togglePlay,
    next,
    prev,
    setVolume,
    seekTo,
    setVibe,
    openPanel,
    closePanel,
    togglePanel,
    playFromFlyBot,
  }), [
    isPlaying, isPanelOpen, currentTrackIndex, currentTrack, currentVibe,
    volume, progress, duration, currentTime, isShuffle, pendingPlay, trackTransition,
    trackError, isIOSDevice, vibeTrackCount,
    play, pause, togglePlay, next, prev, setVolume, seekTo, setVibe,
    openPanel, closePanel, togglePanel, playFromFlyBot,
  ]);

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
}
