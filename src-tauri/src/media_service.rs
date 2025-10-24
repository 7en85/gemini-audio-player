// Media Service Module
// This module will handle Android media session integration, notifications, and lock screen controls
// Implementation will be done in Task 5

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaMetadata {
    pub title: String,
    pub artist: String,
    pub duration: i64,
}

pub struct MediaService {
    // Will be implemented with Android-specific code
}

impl MediaService {
    pub fn new() -> Self {
        Self {}
    }
}
