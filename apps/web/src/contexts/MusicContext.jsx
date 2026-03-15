import React, { createContext, useContext, useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { tracks } from '@/lib/data/tracks.js';
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

export function MusicProvider({ children }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
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
  const [shuffleOrder] = useState(() => generateShuffleOrder(tracks.length));
  const [pendingPlay, setPendingPlay] = useState(false);
  const [trackTransition, setTrackTransition] = useState(false);

  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const analyserRef = useRef(null);
  const playSourceRef = useRef('user');
  const isPlayingRef = useRef(false);

  // Keep ref in sync for use in non-reactive callbacks
  isPlayingRef.current = isPlaying;

  // Resolve the actual track index through shuffle mapping
  const getActualIndex = useCallback((idx) => {
    if (isShuffle && shuffleOrder.length > 0) {
      return shuffleOrder[idx % shuffleOrder.length];
    }
    return idx % tracks.length;
  }, [isShuffle, shuffleOrder]);

  const currentTrack = tracks.length > 0 ? tracks[getActualIndex(currentTrackIndex)] : null;

  // Load a track into the audio element by playlist index
  const loadTrack = useCallback((index) => {
    const audio = audioRef.current;
    if (!audio || tracks.length === 0) return;
    const actualIdx = isShuffle && shuffleOrder.length > 0
      ? shuffleOrder[index % shuffleOrder.length]
      : index % tracks.length;
    const track = tracks[actualIdx];
    if (!track) return;
    audio.src = track.src;
    audio.load();
  }, [isShuffle, shuffleOrder]);

  // Advance to next track (stable ref to avoid stale closures)
  const advanceTrack = useCallback(() => {
    setTrackTransition(true);
    setTimeout(() => setTrackTransition(false), 300);

    setCurrentTrackIndex(prevIdx => {
      const nextIdx = (prevIdx + 1) % tracks.length;
      return nextIdx;
    });
  }, []);

  // Load + autoplay when currentTrackIndex changes (driven by state, not side effects in updaters)
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
    if (tracks.length === 0) return;
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = volume;
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    // Event listeners using refs to avoid stale closures
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
    };
    const onEnded = () => advanceTrack();
    const onError = () => advanceTrack();

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
      // Web Audio API unavailable, visualizer won't work but audio still plays
    }
  }, []);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || tracks.length === 0) return;

    // Load track if not loaded yet
    if (!audio.src || audio.src === window.location.href) {
      loadTrack(currentTrackIndex);
    }

    initAudioContext();

    // Resume suspended AudioContext (Chrome autoplay policy)
    if (audioContextRef.current?.state === 'suspended') {
      try { await audioContextRef.current.resume(); } catch (e) {}
    }

    try {
      await audio.play();
      setIsPlaying(true);
      setPendingPlay(false);
      const track = tracks[getActualIndex(currentTrackIndex)];
      if (track) {
        trackEvent('music_track_played', {
          track_title: track.title,
          track_artist: track.artist,
          source: playSourceRef.current,
        });
      }
    } catch (e) {
      if (e.name === 'NotAllowedError') {
        setPendingPlay(true);
        setIsPanelOpen(true);
      }
    }
  }, [currentTrackIndex, loadTrack, initAudioContext, getActualIndex]);

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
    // Restart current track if more than 3 seconds in
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    if (track) {
      trackEvent('music_track_skipped', { track_title: track.title, direction: 'prev' });
    }
    setTrackTransition(true);
    setTimeout(() => setTrackTransition(false), 300);
    setCurrentTrackIndex(idx => (idx === 0 ? tracks.length - 1 : idx - 1));
  }, [currentTrack]);

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

  const playFromFlyBot = useCallback(() => {
    playSourceRef.current = 'flybot';
    setIsPanelOpen(true);
    play();
  }, [play]);

  // FlyBot bridge via CustomEvent
  useEffect(() => {
    const handler = (e) => {
      const action = e.detail?.action;
      if (action === 'play') playFromFlyBot();
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
      album: 'Fly Labs Vibe Coding',
    });

    navigator.mediaSession.setActionHandler('play', play);
    navigator.mediaSession.setActionHandler('pause', pause);
    navigator.mediaSession.setActionHandler('nexttrack', next);
    navigator.mediaSession.setActionHandler('previoustrack', prev);
  }, [currentTrack, play, pause, next, prev]);

  const value = useMemo(() => ({
    isPlaying,
    isPanelOpen,
    currentTrackIndex,
    currentTrack,
    volume,
    progress,
    duration,
    currentTime,
    isShuffle,
    pendingPlay,
    trackTransition,
    analyserRef,
    hasTracks: tracks.length > 0,
    trackCount: tracks.length,
    play,
    pause,
    togglePlay,
    next,
    prev,
    setVolume,
    seekTo,
    openPanel,
    closePanel,
    togglePanel,
    playFromFlyBot,
  }), [
    isPlaying, isPanelOpen, currentTrackIndex, currentTrack, volume,
    progress, duration, currentTime, isShuffle, pendingPlay, trackTransition,
    play, pause, togglePlay, next, prev, setVolume, seekTo,
    openPanel, closePanel, togglePanel, playFromFlyBot,
  ]);

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
}
