// useAudioIPC Hook
// Provides audio playback control through Tauri IPC

import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  currentTrack: string | null;
}

export interface PlaybackState {
  is_playing: boolean;
  current_time: number;
  duration: number;
  volume: number;
  current_track: string | null;
}

export interface AudioControls {
  loadTrack: (filePath: string) => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  checkFinished: () => Promise<boolean>;
}

export interface UseAudioIPCReturn {
  state: AudioState;
  controls: AudioControls;
  error: string | null;
  isLoading: boolean;
}

export function useAudioIPC(): UseAudioIPCReturn {
  const [state, setState] = useState<AudioState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1.0,
    currentTrack: null,
  });
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const unlistenersRef = useRef<UnlistenFn[]>([]);
  const checkIntervalRef = useRef<number | null>(null);

  // Convert backend state to frontend state
  const convertState = useCallback((backendState: PlaybackState): AudioState => {
    return {
      isPlaying: backendState.is_playing,
      currentTime: backendState.current_time,
      duration: backendState.duration,
      volume: backendState.volume,
      currentTrack: backendState.current_track,
    };
  }, []);

  // Load track
  const loadTrack = useCallback(async (filePath: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const backendState = await invoke<PlaybackState>('audio_load_track', {
        filePath,
      });
      
      setState(convertState(backendState));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to load track: ${errorMessage}`);
      console.error('Load track error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [convertState]);

  // Play
  const play = useCallback(async () => {
    try {
      setError(null);
      const backendState = await invoke<PlaybackState>('audio_play');
      setState(convertState(backendState));
      
      // Start checking for track end
      if (checkIntervalRef.current === null) {
        checkIntervalRef.current = window.setInterval(async () => {
          try {
            const finished = await invoke<boolean>('audio_check_finished');
            if (finished && checkIntervalRef.current !== null) {
              window.clearInterval(checkIntervalRef.current);
              checkIntervalRef.current = null;
            }
          } catch (err) {
            console.error('Check finished error:', err);
          }
        }, 500);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to play: ${errorMessage}`);
      console.error('Play error:', err);
    }
  }, [convertState]);

  // Pause
  const pause = useCallback(async () => {
    try {
      setError(null);
      const backendState = await invoke<PlaybackState>('audio_pause');
      setState(convertState(backendState));
      
      // Stop checking for track end
      if (checkIntervalRef.current !== null) {
        window.clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to pause: ${errorMessage}`);
      console.error('Pause error:', err);
    }
  }, [convertState]);

  // Stop
  const stop = useCallback(async () => {
    try {
      setError(null);
      const backendState = await invoke<PlaybackState>('audio_stop');
      setState(convertState(backendState));
      
      // Stop checking for track end
      if (checkIntervalRef.current !== null) {
        window.clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to stop: ${errorMessage}`);
      console.error('Stop error:', err);
    }
  }, [convertState]);

  // Set volume
  const setVolume = useCallback(async (volume: number) => {
    try {
      setError(null);
      const clampedVolume = Math.max(0, Math.min(1, volume));
      const backendState = await invoke<PlaybackState>('audio_set_volume', {
        volume: clampedVolume,
      });
      setState(convertState(backendState));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to set volume: ${errorMessage}`);
      console.error('Set volume error:', err);
    }
  }, [convertState]);

  // Check if finished
  const checkFinished = useCallback(async (): Promise<boolean> => {
    try {
      return await invoke<boolean>('audio_check_finished');
    } catch (err) {
      console.error('Check finished error:', err);
      return false;
    }
  }, []);

  // Set up event listeners
  useEffect(() => {
    const setupListeners = async () => {
      try {
        // Listen for state changes
        const unlistenStateChanged = await listen<PlaybackState>(
          'audio:state_changed',
          (event) => {
            setState(convertState(event.payload));
          }
        );

        // Listen for track ended
        const unlistenTrackEnded = await listen<PlaybackState>(
          'audio:track_ended',
          (event) => {
            setState(convertState(event.payload));
            
            // Stop checking interval
            if (checkIntervalRef.current !== null) {
              window.clearInterval(checkIntervalRef.current);
              checkIntervalRef.current = null;
            }
          }
        );

        unlistenersRef.current = [unlistenStateChanged, unlistenTrackEnded];
      } catch (err) {
        console.error('Failed to set up event listeners:', err);
      }
    };

    setupListeners();

    // Cleanup
    return () => {
      unlistenersRef.current.forEach((unlisten) => unlisten());
      unlistenersRef.current = [];
      
      if (checkIntervalRef.current !== null) {
        window.clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [convertState]);

  const controls: AudioControls = {
    loadTrack,
    play,
    pause,
    stop,
    setVolume,
    checkFinished,
  };

  return {
    state,
    controls,
    error,
    isLoading,
  };
}
