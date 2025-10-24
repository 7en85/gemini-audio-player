// Audio Engine Module
// Handles audio playback, decoding, and state management using rodio

use crate::errors::AudioEngineError;
use rodio::{Decoder, OutputStream, OutputStreamHandle, Sink, Source};
use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::BufReader;
use std::path::Path;
use std::sync::{Arc, Mutex};
use std::time::Duration;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlaybackState {
    pub is_playing: bool,
    pub current_time: f64,
    pub duration: f64,
    pub volume: f32,
    pub current_track: Option<String>,
}

impl Default for PlaybackState {
    fn default() -> Self {
        Self {
            is_playing: false,
            current_time: 0.0,
            duration: 0.0,
            volume: 1.0,
            current_track: None,
        }
    }
}

pub struct AudioEngine {
    state: Arc<Mutex<PlaybackState>>,
    sink: Arc<Mutex<Option<Sink>>>,
    _stream: Arc<Mutex<Option<(OutputStream, OutputStreamHandle)>>>,
}

impl AudioEngine {
    pub fn new() -> Result<Self, AudioEngineError> {
        // Initialize audio output stream
        let (stream, stream_handle) = OutputStream::try_default()
            .map_err(|e| AudioEngineError::DeviceError(e.to_string()))?;
        
        Ok(Self {
            state: Arc::new(Mutex::new(PlaybackState::default())),
            sink: Arc::new(Mutex::new(None)),
            _stream: Arc::new(Mutex::new(Some((stream, stream_handle)))),
        })
    }
    
    /// Get current playback state
    pub fn get_state(&self) -> Result<PlaybackState, AudioEngineError> {
        self.state
            .lock()
            .map(|state| state.clone())
            .map_err(|e| AudioEngineError::PlaybackError(format!("Failed to lock state: {}", e)))
    }
    
    /// Update playback state
    fn update_state<F>(&self, updater: F) -> Result<(), AudioEngineError>
    where
        F: FnOnce(&mut PlaybackState),
    {
        self.state
            .lock()
            .map(|mut state| updater(&mut state))
            .map_err(|e| AudioEngineError::PlaybackError(format!("Failed to update state: {}", e)))
    }
    
    /// Load an audio file
    pub fn load_track(&self, file_path: &Path) -> Result<Duration, AudioEngineError> {
        // Open the file
        let file = File::open(file_path)
            .map_err(|e| AudioEngineError::LoadError(format!("Failed to open file: {}", e)))?;
        
        let buf_reader = BufReader::new(file);
        
        // Decode the audio file
        let source = Decoder::new(buf_reader)
            .map_err(|e| AudioEngineError::DecodeError(format!("Failed to decode audio: {}", e)))?;
        
        // Get duration
        let duration = source.total_duration()
            .ok_or_else(|| AudioEngineError::LoadError("Could not determine duration".to_string()))?;
        
        // Create new sink
        let stream_guard = self._stream.lock()
            .map_err(|e| AudioEngineError::DeviceError(format!("Failed to lock stream: {}", e)))?;
        
        let (_stream, stream_handle) = stream_guard.as_ref()
            .ok_or_else(|| AudioEngineError::DeviceError("Audio stream not initialized".to_string()))?;
        
        let sink = Sink::try_new(stream_handle)
            .map_err(|e| AudioEngineError::DeviceError(format!("Failed to create sink: {}", e)))?;
        
        // Set volume from state
        let current_volume = self.get_state()?.volume;
        sink.set_volume(current_volume);
        
        // Reload the file for the sink
        let file2 = File::open(file_path)
            .map_err(|e| AudioEngineError::LoadError(format!("Failed to reopen file: {}", e)))?;
        let buf_reader2 = BufReader::new(file2);
        let source2 = Decoder::new(buf_reader2)
            .map_err(|e| AudioEngineError::DecodeError(format!("Failed to decode audio: {}", e)))?;
        
        sink.append(source2);
        sink.pause(); // Start paused
        
        // Store the sink
        let mut sink_guard = self.sink.lock()
            .map_err(|e| AudioEngineError::PlaybackError(format!("Failed to lock sink: {}", e)))?;
        *sink_guard = Some(sink);
        
        // Update state
        self.update_state(|state| {
            state.duration = duration.as_secs_f64();
            state.current_time = 0.0;
            state.is_playing = false;
            state.current_track = Some(file_path.to_string_lossy().to_string());
        })?;
        
        Ok(duration)
    }
    
    /// Start or resume playback
    pub fn play(&self) -> Result<(), AudioEngineError> {
        let sink_guard = self.sink.lock()
            .map_err(|e| AudioEngineError::PlaybackError(format!("Failed to lock sink: {}", e)))?;
        
        if let Some(sink) = sink_guard.as_ref() {
            sink.play();
            drop(sink_guard);
            
            self.update_state(|state| {
                state.is_playing = true;
            })?;
            
            Ok(())
        } else {
            Err(AudioEngineError::PlaybackError("No track loaded".to_string()))
        }
    }
    
    /// Pause playback
    pub fn pause(&self) -> Result<(), AudioEngineError> {
        let sink_guard = self.sink.lock()
            .map_err(|e| AudioEngineError::PlaybackError(format!("Failed to lock sink: {}", e)))?;
        
        if let Some(sink) = sink_guard.as_ref() {
            sink.pause();
            drop(sink_guard);
            
            self.update_state(|state| {
                state.is_playing = false;
            })?;
            
            Ok(())
        } else {
            Err(AudioEngineError::PlaybackError("No track loaded".to_string()))
        }
    }
    
    /// Stop playback and reset
    pub fn stop(&self) -> Result<(), AudioEngineError> {
        let mut sink_guard = self.sink.lock()
            .map_err(|e| AudioEngineError::PlaybackError(format!("Failed to lock sink: {}", e)))?;
        
        if let Some(sink) = sink_guard.take() {
            sink.stop();
        }
        
        drop(sink_guard);
        
        self.update_state(|state| {
            state.is_playing = false;
            state.current_time = 0.0;
            state.current_track = None;
        })?;
        
        Ok(())
    }
    
    /// Set volume (0.0 to 1.0)
    pub fn set_volume(&self, volume: f32) -> Result<(), AudioEngineError> {
        let clamped_volume = volume.clamp(0.0, 1.0);
        
        let sink_guard = self.sink.lock()
            .map_err(|e| AudioEngineError::PlaybackError(format!("Failed to lock sink: {}", e)))?;
        
        if let Some(sink) = sink_guard.as_ref() {
            sink.set_volume(clamped_volume);
        }
        
        drop(sink_guard);
        
        self.update_state(|state| {
            state.volume = clamped_volume;
        })?;
        
        Ok(())
    }
    
    /// Check if playback is finished
    pub fn is_finished(&self) -> Result<bool, AudioEngineError> {
        let sink_guard = self.sink.lock()
            .map_err(|e| AudioEngineError::PlaybackError(format!("Failed to lock sink: {}", e)))?;
        
        Ok(sink_guard.as_ref().map(|s| s.empty()).unwrap_or(true))
    }
}

impl Default for AudioEngine {
    fn default() -> Self {
        Self::new().expect("Failed to initialize audio engine")
    }
}

// Tauri Commands

use tauri::{AppHandle, Emitter, State};
use std::sync::Mutex as StdMutex;

// Wrapper to make AudioEngine Send + Sync
pub struct AudioEngineState {
    pub engine: Arc<StdMutex<AudioEngine>>,
}

// Implement Send and Sync manually (safe because we use Mutex)
unsafe impl Send for AudioEngineState {}
unsafe impl Sync for AudioEngineState {}

#[tauri::command]
pub fn audio_load_track(
    file_path: String,
    engine: State<'_, AudioEngineState>,
    app: AppHandle,
) -> Result<PlaybackState, String> {
    let engine_guard = engine.engine.lock()
        .map_err(|e| format!("Failed to lock engine: {}", e))?;
    
    let path = Path::new(&file_path);
    
    engine_guard.load_track(path)
        .map_err(|e| e.to_string())?;
    
    let state = engine_guard.get_state()
        .map_err(|e| e.to_string())?;
    
    // Emit state changed event
    app.emit("audio:state_changed", &state)
        .map_err(|e| format!("Failed to emit event: {}", e))?;
    
    Ok(state)
}

#[tauri::command]
pub fn audio_play(
    engine: State<'_, AudioEngineState>,
    app: AppHandle,
) -> Result<PlaybackState, String> {
    let engine_guard = engine.engine.lock()
        .map_err(|e| format!("Failed to lock engine: {}", e))?;
    
    engine_guard.play()
        .map_err(|e| e.to_string())?;
    
    let state = engine_guard.get_state()
        .map_err(|e| e.to_string())?;
    
    // Emit state changed event
    app.emit("audio:state_changed", &state)
        .map_err(|e| format!("Failed to emit event: {}", e))?;
    
    Ok(state)
}

#[tauri::command]
pub fn audio_pause(
    engine: State<'_, AudioEngineState>,
    app: AppHandle,
) -> Result<PlaybackState, String> {
    let engine_guard = engine.engine.lock()
        .map_err(|e| format!("Failed to lock engine: {}", e))?;
    
    engine_guard.pause()
        .map_err(|e| e.to_string())?;
    
    let state = engine_guard.get_state()
        .map_err(|e| e.to_string())?;
    
    // Emit state changed event
    app.emit("audio:state_changed", &state)
        .map_err(|e| format!("Failed to emit event: {}", e))?;
    
    Ok(state)
}

#[tauri::command]
pub fn audio_stop(
    engine: State<'_, AudioEngineState>,
    app: AppHandle,
) -> Result<PlaybackState, String> {
    let engine_guard = engine.engine.lock()
        .map_err(|e| format!("Failed to lock engine: {}", e))?;
    
    engine_guard.stop()
        .map_err(|e| e.to_string())?;
    
    let state = engine_guard.get_state()
        .map_err(|e| e.to_string())?;
    
    // Emit state changed event
    app.emit("audio:state_changed", &state)
        .map_err(|e| format!("Failed to emit event: {}", e))?;
    
    Ok(state)
}

#[tauri::command]
pub fn audio_get_state(
    engine: State<'_, AudioEngineState>,
) -> Result<PlaybackState, String> {
    let engine_guard = engine.engine.lock()
        .map_err(|e| format!("Failed to lock engine: {}", e))?;
    
    engine_guard.get_state()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn audio_set_volume(
    volume: f32,
    engine: State<'_, AudioEngineState>,
    app: AppHandle,
) -> Result<PlaybackState, String> {
    let engine_guard = engine.engine.lock()
        .map_err(|e| format!("Failed to lock engine: {}", e))?;
    
    engine_guard.set_volume(volume)
        .map_err(|e| e.to_string())?;
    
    let state = engine_guard.get_state()
        .map_err(|e| e.to_string())?;
    
    // Emit state changed event
    app.emit("audio:state_changed", &state)
        .map_err(|e| format!("Failed to emit event: {}", e))?;
    
    Ok(state)
}


#[tauri::command]
pub fn audio_check_finished(
    engine: State<'_, AudioEngineState>,
    app: AppHandle,
) -> Result<bool, String> {
    let engine_guard = engine.engine.lock()
        .map_err(|e| format!("Failed to lock engine: {}", e))?;
    
    let is_finished = engine_guard.is_finished()
        .map_err(|e| e.to_string())?;
    
    if is_finished {
        // Update state
        drop(engine_guard);
        let mut engine_guard = engine.engine.lock()
            .map_err(|e| format!("Failed to lock engine: {}", e))?;
        
        engine_guard.update_state(|state| {
            state.is_playing = false;
            state.current_time = state.duration;
        }).map_err(|e| e.to_string())?;
        
        let state = engine_guard.get_state()
            .map_err(|e| e.to_string())?;
        
        // Emit track ended event
        app.emit("audio:track_ended", &state)
            .map_err(|e| format!("Failed to emit event: {}", e))?;
    }
    
    Ok(is_finished)
}
