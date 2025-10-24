
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAudioIPC, useFileSystem, useMediaSession, TrackMetadata } from './hooks';

const Icon: React.FC<{ name: string; className?: string, 'aria-label'?: string }> = ({ name, className, 'aria-label': ariaLabel }) => (
    <span className={`material-symbols-outlined ${className}`} aria-label={ariaLabel}>{name}</span>
);

type RepeatMode = 'none' | 'all' | 'one';

const App: React.FC = () => {
    const [tracks, setTracks] = useState<TrackMetadata[]>([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isPlaylistVisible, setIsPlaylistVisible] = useState(false);
    const [isExited, setIsExited] = useState(false);
    const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
    const [isShuffled, setIsShuffled] = useState(false);
    
    const originalTracksOrder = useRef<TrackMetadata[]>([]);
    const menuRef = useRef<HTMLDivElement>(null);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const volumeBarRef = useRef<HTMLDivElement>(null);
    
    // Use Tauri IPC hooks
    const { state: audioState, controls: audioControls, error: audioError } = useAudioIPC();
    const { api: fileSystemAPI, error: fileSystemError } = useFileSystem();
    
    // Media session integration
    const { api: mediaSessionAPI } = useMediaSession(
        audioState,
        () => audioControls.play(),
        () => audioControls.pause(),
        () => audioControls.stop(),
        () => nextTrack(),
        () => prevTrack()
    );

    const changeTrack = useCallback(async (newIndex: number) => {
        setCurrentTrackIndex(newIndex);
        const track = tracks[newIndex];
        if (track) {
            await audioControls.loadTrack(track.file_path);
            await audioControls.play();
        }
    }, [tracks, audioControls]);

    const nextTrack = useCallback(() => {
        if (tracks.length === 0) return;
        if (isShuffled) {
            const nextIndex = Math.floor(Math.random() * tracks.length);
            changeTrack(nextIndex);
            return;
        }
        const nextIndex = currentTrackIndex + 1;
        if (nextIndex >= tracks.length) {
            if (repeatMode === 'all') {
                changeTrack(0);
            }
        } else {
            changeTrack(nextIndex);
        }
    }, [tracks.length, isShuffled, currentTrackIndex, repeatMode, changeTrack]);

    const currentTrack = tracks.length > 0 ? tracks[currentTrackIndex] : null;
    
    // Extract audio state
    const isPlaying = audioState.isPlaying;
    const duration = audioState.duration;
    const currentTime = audioState.currentTime;
    const volume = audioState.volume;
    
    // Handle track ended
    useEffect(() => {
        const checkTrackEnded = async () => {
            if (isPlaying) {
                const finished = await audioControls.checkFinished();
                if (finished) {
                    if (repeatMode === 'one') {
                        // Reload and play the same track
                        if (currentTrack) {
                            await audioControls.loadTrack(currentTrack.file_path);
                            await audioControls.play();
                        }
                    } else {
                        nextTrack();
                    }
                }
            }
        };
        
        const interval = setInterval(checkTrackEnded, 500);
        return () => clearInterval(interval);
    }, [isPlaying, repeatMode, currentTrack, audioControls]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    // Update media session when track changes
    useEffect(() => {
        if (currentTrack) {
            mediaSessionAPI.updateMetadata({
                title: currentTrack.title,
                artist: currentTrack.artist,
                duration: currentTrack.duration,
            });
        }
    }, [currentTrack, mediaSessionAPI]);
    
    const prevTrack = useCallback(() => {
        if (tracks.length < 2) return;
        const prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
        changeTrack(prevIndex);
    }, [tracks.length, currentTrackIndex, changeTrack]);
    
    const formatTime = (time: number) => {
        if (isNaN(time) || time === 0) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // TODO: Seek not implemented in rodio 0.17
        // Will be available when rodio is updated
        console.log('Seek not yet implemented');
    };

    const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (volumeBarRef.current) {
            const rect = volumeBarRef.current.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width;
            const newVolume = Math.max(0, Math.min(1, clickX / width));
            audioControls.setVolume(newVolume);
        }
    };
    
    const handlePickFiles = useCallback(async () => {
        try {
            const filePaths = await fileSystemAPI.pickAudioFiles();
            if (filePaths.length > 0) {
                const metadata = await fileSystemAPI.getMultipleMetadata(filePaths);
                setTracks(prevTracks => {
                    const wasPlaylistEmpty = prevTracks.length === 0;
                    const updatedTracks = [...prevTracks, ...metadata];
                    if (wasPlaylistEmpty && metadata.length > 0) {
                        setCurrentTrackIndex(0);
                        // Auto-load first track
                        audioControls.loadTrack(metadata[0].file_path);
                    }
                    return updatedTracks;
                });
            }
        } catch (error) {
            console.error('Failed to pick files:', error);
        }
    }, [fileSystemAPI, audioControls]);
    
    const handlePickFolder = useCallback(async () => {
        try {
            const filePaths = await fileSystemAPI.pickAudioFolder();
            if (filePaths.length > 0) {
                const metadata = await fileSystemAPI.getMultipleMetadata(filePaths);
                setTracks(prevTracks => {
                    const wasPlaylistEmpty = prevTracks.length === 0;
                    const updatedTracks = [...prevTracks, ...metadata];
                    if (wasPlaylistEmpty && metadata.length > 0) {
                        setCurrentTrackIndex(0);
                        // Auto-load first track
                        audioControls.loadTrack(metadata[0].file_path);
                    }
                    return updatedTracks;
                });
            }
        } catch (error) {
            console.error('Failed to pick folder:', error);
        }
    }, [fileSystemAPI, audioControls]);

    const handleClearPlaylist = useCallback(async () => {
        await audioControls.stop();
        setTracks([]);
        setIsShuffled(false);
        originalTracksOrder.current = [];
    }, [audioControls]);

    const handleMenuAction = useCallback(async (action: 'OpenFiles' | 'OpenFolder' | 'ClearPlaylist' | 'Exit') => {
        setIsMenuOpen(false);

        switch (action) {
            case 'OpenFiles':
                await handlePickFiles();
                break;
            case 'OpenFolder':
                await handlePickFolder();
                break;
            case 'ClearPlaylist':
                await handleClearPlaylist();
                break;
            case 'Exit':
                await audioControls.stop();
                setIsExited(true);
                break;
        }
    }, [handlePickFiles, handlePickFolder, handleClearPlaylist, audioControls]);

    const togglePlayPause = useCallback(async () => {
        if (isPlaying) {
            await audioControls.pause();
        } else {
            await audioControls.play();
        }
    }, [isPlaying, audioControls]);
    
    const handleTrackSelect = useCallback(async (index: number) => {
        if (index === currentTrackIndex) {
            await togglePlayPause();
        } else {
            await changeTrack(index);
        }
    }, [currentTrackIndex, togglePlayPause, changeTrack]);

    const handleDeleteTrack = useCallback(async (indexToDelete: number) => {
        await audioControls.stop();
        setTracks(prevTracks => {
            const newTracks = prevTracks.filter((_, index) => index !== indexToDelete);
            if (isShuffled) {
                originalTracksOrder.current = originalTracksOrder.current.filter(t => t.file_path !== prevTracks[indexToDelete].file_path);
            }
            if (newTracks.length === 0) {
                setCurrentTrackIndex(0);
            } else if (currentTrackIndex === indexToDelete) {
                setCurrentTrackIndex(indexToDelete % newTracks.length);
            } else if (currentTrackIndex > indexToDelete) {
                setCurrentTrackIndex(prev => prev - 1);
            }
            return newTracks;
        });
    }, [audioControls, isShuffled, currentTrackIndex]);

    const toggleRepeatMode = () => {
        const modes: RepeatMode[] = ['none', 'all', 'one'];
        const currentModeIndex = modes.indexOf(repeatMode);
        const nextMode = modes[(currentModeIndex + 1) % modes.length];
        setRepeatMode(nextMode);
    };

    const toggleShuffle = useCallback(() => {
        const newIsShuffled = !isShuffled;
        setIsShuffled(newIsShuffled);

        if (newIsShuffled) {
            originalTracksOrder.current = [...tracks];
            const current = tracks[currentTrackIndex];
            const rest = tracks.filter((_, i) => i !== currentTrackIndex);
            
            for (let i = rest.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [rest[i], rest[j]] = [rest[j], rest[i]];
            }

            const shuffledTracks = [current, ...rest];
            setTracks(shuffledTracks);
            setCurrentTrackIndex(0);
        } else {
            const currentFilePath = tracks[currentTrackIndex].file_path;
            const originalIndex = originalTracksOrder.current.findIndex(t => t.file_path === currentFilePath);
            setTracks(originalTracksOrder.current);
            setCurrentTrackIndex(originalIndex !== -1 ? originalIndex : 0);
        }
    }, [isShuffled, tracks, currentTrackIndex]);

    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

    const getVolumeIcon = () => {
        if (volume === 0) return 'volume_off';
        if (volume < 0.5) return 'volume_down';
        return 'volume_up';
    };

    if (isExited) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center font-sans">
                 <div className="text-white text-2xl font-inter text-center p-8">
                    Goodbye! <br/> You can now close this tab.
                 </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center font-sans p-4 gap-4">
            {/* Error display */}
            {(audioError || fileSystemError) && (
                <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded-lg max-w-md">
                    {audioError || fileSystemError}
                </div>
            )}
            <div
                className="relative bg-[#2c2d30] shadow-2xl rounded-lg w-full max-w-md p-5 flex flex-col gap-5"
            >
                {/* Header */}
                <div className="flex w-full items-center justify-between">
                    <div ref={menuRef} className="relative z-10">
                         <button 
                            onClick={() => setIsMenuOpen(prev => !prev)} 
                            className="p-2 rounded-full hover:bg-white/10 transition-colors" 
                            aria-haspopup="true" 
                            aria-expanded={isMenuOpen}
                            aria-label="Open menu"
                         >
                            <Icon name="menu" className="!text-3xl text-gray-300" />
                         </button>
                         {isMenuOpen && (
                             <div 
                                className="absolute left-0 top-12 bg-gray-800/90 backdrop-blur-sm border border-gray-700/50 rounded-md shadow-lg z-20 w-48 py-1" 
                                role="menu" 
                                aria-orientation="vertical" 
                                aria-labelledby="menu-button"
                             >
                                <button onClick={() => handleMenuAction('OpenFiles')} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-white/10 transition-colors block" role="menuitem">
                                    Добавить файлы
                                </button>
                                <button onClick={() => handleMenuAction('OpenFolder')} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-white/10 transition-colors block" role="menuitem">
                                    Добавить папку
                                </button>
                                <div className="my-1 border-t border-gray-700/50"></div>
                                <button onClick={() => handleMenuAction('ClearPlaylist')} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-white/10 transition-colors block" role="menuitem">
                                    Очистить плейлист
                                </button>
                                <button onClick={() => handleMenuAction('Exit')} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-white/10 transition-colors block" role="menuitem">
                                    Выход
                                </button>
                            </div>
                         )}
                    </div>
                    <h1 className="font-inter text-gray-500 font-semibold tracking-wider">Mini Player</h1>
                    <div className="w-12 h-12"></div>
                </div>

                {/* Track Info */}
                <div className="text-center h-14">
                    {currentTrack ? (
                        <>
                            <h2 className="text-white font-pacifico text-2xl truncate">{currentTrack.title}</h2>
                            <p className="text-gray-300 font-inter text-sm truncate">{currentTrack.artist}</p>
                        </>
                    ) : (
                        <>
                            <h2 className="text-white font-pacifico text-2xl">Local Player</h2>
                            <p className="text-gray-400 font-inter text-sm">No track selected</p>
                        </>
                    )}
                </div>

                {/* Progress Bar */}
                <div>
                    <div
                        ref={progressBarRef}
                        className="relative bg-gray-700/50 cursor-pointer h-1.5 rounded-full w-full group"
                        onClick={handleProgressClick}
                    >
                        <div
                            className="absolute bg-[#5c616e] h-full rounded-full group-hover:bg-green-400"
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-400 mt-1.5">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between w-full">
                    <button onClick={toggleShuffle} className={`p-2 rounded-full transition-colors hover:bg-white/10 ${isShuffled ? 'text-green-400' : 'text-white'}`} aria-label="Shuffle" disabled={!currentTrack}>
                        <Icon name={isShuffled ? 'shuffle_on' : 'shuffle'} className="!text-2xl" />
                    </button>
                    <button onClick={prevTrack} className="p-2 rounded-full text-white transition-colors hover:bg-white/10 disabled:text-gray-600 disabled:hover:bg-transparent" aria-label="Previous track" disabled={!currentTrack || tracks.length < 2}>
                        <Icon name="skip_previous" className="!text-4xl" />
                    </button>
                    <button onClick={togglePlayPause} className="p-2 rounded-full text-white bg-green-500/80 hover:bg-green-500 transition-colors disabled:bg-gray-700 disabled:text-gray-500" aria-label={isPlaying ? 'Pause' : 'Play'} disabled={!currentTrack}>
                        <Icon name={isPlaying ? 'pause' : 'play_arrow'} className="!text-5xl" />
                    </button>
                    <button onClick={nextTrack} className="p-2 rounded-full text-white transition-colors hover:bg-white/10 disabled:text-gray-600 disabled:hover:bg-transparent" aria-label="Next track" disabled={!currentTrack || tracks.length < 2}>
                        <Icon name="skip_next" className="!text-4xl" />
                    </button>
                    <button onClick={toggleRepeatMode} className={`p-2 rounded-full transition-colors hover:bg-white/10 ${repeatMode !== 'none' ? 'text-green-400' : 'text-white'}`} aria-label="Repeat">
                        <Icon name={repeatMode === 'one' ? 'repeat_one_on' : 'repeat'} className="!text-2xl" />
                    </button>
                </div>
                 {/* Volume Control */}
                <div className="flex items-center space-x-2 w-full">
                        <Icon name={getVolumeIcon()} className="!text-xl text-white" />
                        <div
                           ref={volumeBarRef}
                           onClick={handleVolumeClick}
                           className="w-full h-1.5 bg-gray-600 rounded-lg cursor-pointer relative group"
                           aria-label="Volume slider"
                           role="slider"
                           aria-valuemin={0}
                           aria-valuemax={100}
                           aria-valuenow={Math.round(volume * 100)}
                        >
                            <div 
                                className="bg-white h-full rounded-lg group-hover:bg-green-400"
                                style={{ width: `${volume * 100}%` }}
                            />
                        </div>
                </div>
            </div>

            <button
                onClick={() => setIsPlaylistVisible(p => !p)}
                className="text-white my-2 transition-transform hover:scale-110 active:scale-95 bg-[#2c2d30] rounded-full p-1"
                aria-controls="playlist-container"
                aria-expanded={isPlaylistVisible}
                aria-label={isPlaylistVisible ? "Hide playlist" : "Show playlist"}
            >
                <Icon name="keyboard_arrow_up" className={`!text-5xl transition-transform duration-300 ${isPlaylistVisible ? '' : 'rotate-180'}`} />
            </button>

            {isPlaylistVisible && (
                 <div
                    id="playlist-container"
                    className="bg-[#2c2d30] shadow-2xl rounded-lg flex flex-col p-4 w-full max-w-md h-72"
                >
                    <h3 className="text-white text-xl mb-2 flex-shrink-0 font-dancing-script">
                        Playlist
                    </h3>
                    <ul className="overflow-y-auto flex-grow custom-scrollbar space-y-1 pr-1">
                        {tracks.length > 0 ? tracks.map((track, index) => (
                            <li key={`${track.id}-${index}`}
                                onClick={() => handleTrackSelect(index)}
                                className={`p-2 rounded-md cursor-pointer flex items-center justify-between transition-colors ${
                                    currentTrackIndex === index ? 'bg-white/20' : 'hover:bg-white/10'
                                }`}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && handleTrackSelect(index)}
                            >
                                <div className="flex items-center truncate w-full pr-2">
                                    <span className="text-gray-400 text-sm w-6 text-center mr-2 flex-shrink-0">{index + 1}.</span>
                                    <div className="truncate">
                                       <p className="text-white text-sm truncate" title={track.title}>{track.title}</p>
                                       <p className="text-gray-400 text-xs truncate">{track.artist || 'Unknown Artist'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                    {currentTrackIndex === index && (
                                         isPlaying ? (
                                            <Icon name="volume_up" className="!text-xl text-green-400" aria-label="Playing"/>
                                         ) : (
                                            <Icon name="pause" className="!text-xl text-gray-400" aria-label="Paused"/>
                                         )
                                    )}
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteTrack(index);
                                        }} 
                                        className="text-gray-500 hover:text-white transition-colors"
                                        aria-label={`Delete ${track.title}`}
                                    >
                                        <Icon name="delete" className="!text-xl" />
                                    </button>
                                </div>
                            </li>
                        )) : (
                            <div className="text-gray-400 text-center py-4 h-full flex items-center justify-center">
                                <p>No tracks loaded</p>
                            </div>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default App;