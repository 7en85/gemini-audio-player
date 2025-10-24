// useFileSystem Hook
// Provides file system operations through Tauri IPC

import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface TrackMetadata {
  id: string;
  title: string;
  artist: string;
  duration: number;
  file_path: string;
}

export interface FileSystemAPI {
  pickAudioFiles: () => Promise<string[]>;
  pickAudioFolder: () => Promise<string[]>;
  getTrackMetadata: (filePath: string) => Promise<TrackMetadata>;
  getMultipleMetadata: (filePaths: string[]) => Promise<TrackMetadata[]>;
}

export interface UseFileSystemReturn {
  api: FileSystemAPI;
  error: string | null;
  isLoading: boolean;
}

export function useFileSystem(): UseFileSystemReturn {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Pick audio files
  const pickAudioFiles = useCallback(async (): Promise<string[]> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const files = await invoke<string[]>('pick_audio_files');
      return files;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to pick files: ${errorMessage}`);
      console.error('Pick files error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Pick audio folder
  const pickAudioFolder = useCallback(async (): Promise<string[]> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const files = await invoke<string[]>('pick_audio_folder');
      return files;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to pick folder: ${errorMessage}`);
      console.error('Pick folder error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get track metadata
  const getTrackMetadata = useCallback(async (filePath: string): Promise<TrackMetadata> => {
    try {
      setError(null);
      
      const metadata = await invoke<TrackMetadata>('get_metadata', {
        filePath,
      });
      
      return metadata;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to get metadata: ${errorMessage}`);
      console.error('Get metadata error:', err);
      
      // Return fallback metadata
      return {
        id: filePath,
        title: filePath.split(/[\\/]/).pop() || 'Unknown',
        artist: 'Unknown Artist',
        duration: 0,
        file_path: filePath,
      };
    }
  }, []);

  // Get multiple metadata
  const getMultipleMetadata = useCallback(async (filePaths: string[]): Promise<TrackMetadata[]> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const metadataList = await invoke<TrackMetadata[]>('get_multiple_metadata', {
        filePaths,
      });
      
      return metadataList;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to get metadata: ${errorMessage}`);
      console.error('Get multiple metadata error:', err);
      
      // Return fallback metadata for all files
      return filePaths.map((filePath) => ({
        id: filePath,
        title: filePath.split(/[\\/]/).pop() || 'Unknown',
        artist: 'Unknown Artist',
        duration: 0,
        file_path: filePath,
      }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const api: FileSystemAPI = {
    pickAudioFiles,
    pickAudioFolder,
    getTrackMetadata,
    getMultipleMetadata,
  };

  return {
    api,
    error,
    isLoading,
  };
}
