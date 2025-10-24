// useMediaSession Hook
// Provides media session integration (Android MediaSession, Web Media Session API)

import { useEffect, useCallback } from 'react';
import { AudioState } from './useAudioIPC';

export interface MediaMetadata {
  title: string;
  artist: string;
  duration: number;
}

export interface MediaSessionAPI {
  updateMetadata: (metadata: MediaMetadata) => void;
  updatePlaybackState: (isPlaying: boolean) => void;
}

export interface UseMediaSessionReturn {
  api: MediaSessionAPI;
}

export function useMediaSession(
  audioState: AudioState,
  onPlay?: () => void,
  onPause?: () => void,
  onStop?: () => void,
  onNext?: () => void,
  onPrevious?: () => void
): UseMediaSessionReturn {
  
  // Update metadata
  const updateMetadata = useCallback((metadata: MediaMetadata) => {
    // Check if running in browser with Media Session API
    if ('mediaSession' in navigator && navigator.mediaSession) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: metadata.title,
        artist: metadata.artist,
        album: '',
        artwork: [],
      });
    }
    
    // TODO: When Android MediaSession is implemented (Task 5),
    // call Tauri command here:
    // await invoke('media_update_metadata', { metadata });
  }, []);

  // Update playback state
  const updatePlaybackState = useCallback((isPlaying: boolean) => {
    // Check if running in browser with Media Session API
    if ('mediaSession' in navigator && navigator.mediaSession) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
    
    // TODO: When Android MediaSession is implemented (Task 5),
    // call Tauri command here:
    // await invoke('media_update_state', { isPlaying });
  }, []);

  // Set up media session action handlers
  useEffect(() => {
    if ('mediaSession' in navigator && navigator.mediaSession) {
      const mediaSession = navigator.mediaSession;
      
      // Set up action handlers
      if (onPlay) {
        mediaSession.setActionHandler('play', onPlay);
      }
      
      if (onPause) {
        mediaSession.setActionHandler('pause', onPause);
      }
      
      if (onStop) {
        mediaSession.setActionHandler('stop', onStop);
      }
      
      if (onNext) {
        mediaSession.setActionHandler('nexttrack', onNext);
      }
      
      if (onPrevious) {
        mediaSession.setActionHandler('previoustrack', onPrevious);
      }
      
      // Cleanup
      return () => {
        mediaSession.setActionHandler('play', null);
        mediaSession.setActionHandler('pause', null);
        mediaSession.setActionHandler('stop', null);
        mediaSession.setActionHandler('nexttrack', null);
        mediaSession.setActionHandler('previoustrack', null);
      };
    }
  }, [onPlay, onPause, onStop, onNext, onPrevious]);

  // Auto-update playback state when audio state changes
  useEffect(() => {
    updatePlaybackState(audioState.isPlaying);
  }, [audioState.isPlaying, updatePlaybackState]);

  const api: MediaSessionAPI = {
    updateMetadata,
    updatePlaybackState,
  };

  return {
    api,
  };
}
