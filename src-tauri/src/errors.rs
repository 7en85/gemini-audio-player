// Error handling module

use thiserror::Error;

#[derive(Error, Debug)]
pub enum FileManagerError {
    #[error("File not found: {0}")]
    FileNotFound(String),
    
    #[error("Invalid file path: {0}")]
    InvalidPath(String),
    
    #[error("Unsupported file format: {0}")]
    UnsupportedFormat(String),
    
    #[error("Permission denied: {0}")]
    PermissionDenied(String),
    
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
    
    #[error("Failed to read metadata: {0}")]
    MetadataError(String),
    
    #[error("Directory scan failed: {0}")]
    ScanError(String),
    
    #[error("No files selected")]
    NoFilesSelected,
    
    #[error("No valid audio files found")]
    NoValidFiles,
}

impl From<FileManagerError> for String {
    fn from(error: FileManagerError) -> Self {
        error.to_string()
    }
}

#[derive(Error, Debug)]
pub enum AudioEngineError {
    #[error("Failed to load audio: {0}")]
    LoadError(String),
    
    #[error("Playback error: {0}")]
    PlaybackError(String),
    
    #[error("Decode error: {0}")]
    DecodeError(String),
    
    #[error("Invalid audio format: {0}")]
    InvalidFormat(String),
    
    #[error("Audio device error: {0}")]
    DeviceError(String),
}

impl From<AudioEngineError> for String {
    fn from(error: AudioEngineError) -> Self {
        error.to_string()
    }
}

#[derive(Error, Debug)]
pub enum PermissionError {
    #[error("Storage permission not granted")]
    StoragePermissionDenied,
    
    #[error("Notification permission not granted")]
    NotificationPermissionDenied,
    
    #[error("Permission check failed: {0}")]
    CheckFailed(String),
}

impl From<PermissionError> for String {
    fn from(error: PermissionError) -> Self {
        error.to_string()
    }
}
