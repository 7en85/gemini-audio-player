
import { useState, useRef, useEffect, useCallback } from 'react';

export const useAudioPlayer = (trackUrl: string | null, onEnded: () => void) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolumeState] = useState(() => {
        try {
            const item = window.localStorage.getItem('playerVolume');
            const parsedVolume = item ? parseFloat(item) : 1;
            return isNaN(parsedVolume) ? 1 : parsedVolume;
        } catch (error) {
            console.error("Error reading volume from localStorage", error);
            return 1;
        }
    });

    useEffect(() => {
        if (trackUrl) {
            const wasPlaying = isPlaying;
            if (audioRef.current) {
                audioRef.current.pause();
            }
            audioRef.current = new Audio(trackUrl);
            const audio = audioRef.current;
            audio.volume = volume;

            const setAudioData = () => {
                setDuration(audio.duration);
                setCurrentTime(audio.currentTime);
            };

            const setAudioTime = () => setCurrentTime(audio.currentTime);

            const handleEnded = () => {
                onEnded();
            };

            audio.addEventListener('loadedmetadata', setAudioData);
            audio.addEventListener('timeupdate', setAudioTime);
            audio.addEventListener('ended', handleEnded);

            if(wasPlaying) {
                audio.play().catch(e => console.error("Error playing audio:", e));
                setIsPlaying(true);
            }

            return () => {
                audio.removeEventListener('loadedmetadata', setAudioData);
                audio.removeEventListener('timeupdate', setAudioTime);
                audio.removeEventListener('ended', handleEnded);
                audio.pause();
            };
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trackUrl]);


    const play = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.error("Error playing audio:", e));
            setIsPlaying(true);
        }
    }, []);

    const pause = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    }, []);
    
    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
        }
    }, []);

    const seek = useCallback((time: number) => {
        if (audioRef.current && isFinite(time)) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    }, []);
    
    const togglePlayPause = useCallback(() => {
        if (isPlaying) {
            pause();
        } else {
            play();
        }
    }, [isPlaying, pause, play]);

    const setVolume = useCallback((newVolume: number) => {
        const clampedVolume = Math.max(0, Math.min(1, newVolume));
        if (audioRef.current) {
            audioRef.current.volume = clampedVolume;
        }
        setVolumeState(clampedVolume);
        try {
            window.localStorage.setItem('playerVolume', clampedVolume.toString());
        } catch (error) {
            console.error("Error saving volume to localStorage", error);
        }
    }, []);

    return { isPlaying, duration, currentTime, togglePlayPause, stop, seek, play, pause, volume, setVolume };
};
