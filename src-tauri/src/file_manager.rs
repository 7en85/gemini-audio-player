// File Manager Module
// Handles file system operations, audio file picking, and metadata extraction

use crate::errors::FileManagerError;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackMetadata {
    pub id: String,
    pub title: String,
    pub artist: String,
    pub duration: f64,
    pub file_path: String,
}

#[derive(Debug, Clone)]
pub struct FileManager {
    supported_formats: Vec<String>,
}

impl FileManager {
    pub fn new() -> Self {
        Self {
            supported_formats: vec![
                "mp3".to_string(),
                "flac".to_string(),
                "wav".to_string(),
                "ogg".to_string(),
                "m4a".to_string(),
                "aac".to_string(),
                "opus".to_string(),
                "wma".to_string(),
            ],
        }
    }
    
    /// Check if a file has a supported audio format
    pub fn is_supported_format(&self, path: &Path) -> bool {
        if let Some(extension) = path.extension() {
            if let Some(ext_str) = extension.to_str() {
                return self.supported_formats.contains(&ext_str.to_lowercase());
            }
        }
        false
    }
    
    /// Get list of supported formats
    pub fn get_supported_formats(&self) -> &[String] {
        &self.supported_formats
    }
    
    /// Validate that a file exists and is a supported audio file
    pub fn validate_audio_file(&self, path: &Path) -> Result<(), String> {
        if !path.exists() {
            return Err(format!("File does not exist: {}", path.display()));
        }
        
        if !path.is_file() {
            return Err(format!("Path is not a file: {}", path.display()));
        }
        
        if !self.is_supported_format(path) {
            return Err(format!(
                "Unsupported file format: {}. Supported formats: {}",
                path.display(),
                self.supported_formats.join(", ")
            ));
        }
        
        Ok(())
    }
    
    /// Scan a directory recursively for audio files
    pub fn scan_directory(&self, dir_path: &Path) -> Result<Vec<PathBuf>, String> {
        if !dir_path.exists() {
            return Err(format!("Directory does not exist: {}", dir_path.display()));
        }
        
        if !dir_path.is_dir() {
            return Err(format!("Path is not a directory: {}", dir_path.display()));
        }
        
        let mut audio_files = Vec::new();
        
        for entry in WalkDir::new(dir_path)
            .follow_links(true)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            let path = entry.path();
            if path.is_file() && self.is_supported_format(path) {
                audio_files.push(path.to_path_buf());
            }
        }
        
        Ok(audio_files)
    }
    
    /// Get file name without extension
    pub fn get_file_name(&self, path: &Path) -> String {
        path.file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("Unknown")
            .to_string()
    }
}

impl Default for FileManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_supported_formats() {
        let fm = FileManager::new();
        assert!(fm.is_supported_format(Path::new("test.mp3")));
        assert!(fm.is_supported_format(Path::new("test.flac")));
        assert!(fm.is_supported_format(Path::new("test.MP3"))); // case insensitive
        assert!(!fm.is_supported_format(Path::new("test.txt")));
        assert!(!fm.is_supported_format(Path::new("test")));
    }
    
    #[test]
    fn test_get_file_name() {
        let fm = FileManager::new();
        assert_eq!(fm.get_file_name(Path::new("song.mp3")), "song");
        assert_eq!(fm.get_file_name(Path::new("/path/to/song.mp3")), "song");
    }
}

// Tauri Commands

use tauri::AppHandle;

#[tauri::command]
pub async fn pick_audio_files(app: AppHandle) -> Result<Vec<String>, String> {
    use tauri_plugin_dialog::{DialogExt, FileDialogBuilder};
    
    let file_manager = FileManager::new();
    
    // Create file dialog with audio file filters
    let files = app.dialog()
        .file()
        .add_filter("Audio Files", &["mp3", "flac", "wav", "ogg", "m4a", "aac", "opus", "wma"])
        .add_filter("All Files", &["*"])
        .set_title("Select Audio Files")
        .blocking_pick_files();
    
    match files {
        Some(file_paths) => {
            let mut valid_files = Vec::new();
            
            for file_path in file_paths {
                let path = file_path.as_path()
                    .ok_or_else(|| "Invalid file path".to_string())?;
                
                // Validate the file
                match file_manager.validate_audio_file(path) {
                    Ok(_) => {
                        if let Some(path_str) = path.to_str() {
                            valid_files.push(path_str.to_string());
                        }
                    }
                    Err(e) => {
                        log::warn!("Skipping invalid file: {}", e);
                    }
                }
            }
            
            if valid_files.is_empty() {
                Err("No valid audio files selected".to_string())
            } else {
                Ok(valid_files)
            }
        }
        None => Err("No files selected".to_string()),
    }
}

#[tauri::command]
pub async fn pick_audio_folder(app: AppHandle) -> Result<Vec<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    
    let file_manager = FileManager::new();
    
    // Create folder dialog
    let folder = app.dialog()
        .file()
        .set_title("Select Folder with Audio Files")
        .blocking_pick_folder();
    
    match folder {
        Some(folder_path) => {
            let path = folder_path.as_path()
                .ok_or_else(|| "Invalid folder path".to_string())?;
            
            log::info!("Scanning folder: {}", path.display());
            
            // Scan directory recursively
            let audio_files = file_manager.scan_directory(path)
                .map_err(|e| format!("Failed to scan directory: {}", e))?;
            
            if audio_files.is_empty() {
                return Err("No audio files found in the selected folder".to_string());
            }
            
            log::info!("Found {} audio files", audio_files.len());
            
            // Convert paths to strings
            let file_paths: Vec<String> = audio_files
                .iter()
                .filter_map(|p| p.to_str().map(|s| s.to_string()))
                .collect();
            
            Ok(file_paths)
        }
        None => Err("No folder selected".to_string()),
    }
}

// Metadata extraction using symphonia

use symphonia::core::formats::FormatOptions;
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::MetadataOptions;
use symphonia::core::probe::Hint;
use std::fs::File;
use std::time::Duration;

impl FileManager {
    /// Extract metadata from an audio file
    pub fn extract_metadata(&self, file_path: &Path) -> Result<TrackMetadata, String> {
        // Validate file first
        self.validate_audio_file(file_path)?;
        
        // Open the file
        let file = File::open(file_path)
            .map_err(|e| format!("Failed to open file: {}", e))?;
        
        // Create media source
        let mss = MediaSourceStream::new(Box::new(file), Default::default());
        
        // Create a hint to help the format registry guess the format
        let mut hint = Hint::new();
        if let Some(extension) = file_path.extension() {
            if let Some(ext_str) = extension.to_str() {
                hint.with_extension(ext_str);
            }
        }
        
        // Probe the media source
        let format_opts = FormatOptions::default();
        let metadata_opts = MetadataOptions::default();
        
        let probed = symphonia::default::get_probe()
            .format(&hint, mss, &format_opts, &metadata_opts)
            .map_err(|e| format!("Failed to probe file: {}", e))?;
        
        let mut format = probed.format;
        
        // Get metadata
        let metadata = format.metadata();
        
        let mut title = None;
        let mut artist = None;
        
        // Try to get metadata from tags
        if let Some(metadata_rev) = metadata.current() {
            for tag in metadata_rev.tags() {
                match tag.std_key {
                    Some(symphonia::core::meta::StandardTagKey::TrackTitle) => {
                        title = Some(tag.value.to_string());
                    }
                    Some(symphonia::core::meta::StandardTagKey::Artist) => {
                        artist = Some(tag.value.to_string());
                    }
                    _ => {}
                }
            }
        }
        
        // Calculate duration
        let mut duration_secs = 0.0;
        if let Some(track) = format.default_track() {
            if let Some(time_base) = track.codec_params.time_base {
                if let Some(n_frames) = track.codec_params.n_frames {
                    let duration = time_base.calc_time(n_frames);
                    duration_secs = duration.seconds as f64 + (duration.frac as f64);
                }
            }
        }
        
        // Fallback to file name if no title
        let final_title = title.unwrap_or_else(|| self.get_file_name(file_path));
        let final_artist = artist.unwrap_or_else(|| "Unknown Artist".to_string());
        
        // Generate ID from file path
        let id = format!("{:x}", md5::compute(file_path.to_string_lossy().as_bytes()));
        
        Ok(TrackMetadata {
            id,
            title: final_title,
            artist: final_artist,
            duration: duration_secs,
            file_path: file_path.to_string_lossy().to_string(),
        })
    }
}

#[tauri::command]
pub async fn get_metadata(file_path: String) -> Result<TrackMetadata, String> {
    let file_manager = FileManager::new();
    let path = Path::new(&file_path);
    
    file_manager.extract_metadata(path)
}

#[tauri::command]
pub async fn get_multiple_metadata(file_paths: Vec<String>) -> Result<Vec<TrackMetadata>, String> {
    let file_manager = FileManager::new();
    let mut metadata_list = Vec::new();
    
    for file_path in file_paths {
        let path = Path::new(&file_path);
        match file_manager.extract_metadata(path) {
            Ok(metadata) => metadata_list.push(metadata),
            Err(e) => {
                log::warn!("Failed to extract metadata from {}: {}", file_path, e);
                // Create fallback metadata
                metadata_list.push(TrackMetadata {
                    id: format!("{:x}", md5::compute(file_path.as_bytes())),
                    title: file_manager.get_file_name(path),
                    artist: "Unknown Artist".to_string(),
                    duration: 0.0,
                    file_path,
                });
            }
        }
    }
    
    Ok(metadata_list)
}
