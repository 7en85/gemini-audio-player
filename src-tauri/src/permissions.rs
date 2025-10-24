// Permissions Module
// Handles Android runtime permissions

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionStatus {
    pub storage: bool,
    pub notifications: bool,
}

#[cfg(target_os = "android")]
pub fn check_permissions() -> PermissionStatus {
    // This will be implemented with JNI calls to Android
    // For now, return a placeholder
    PermissionStatus {
        storage: false,
        notifications: false,
    }
}

#[cfg(not(target_os = "android"))]
pub fn check_permissions() -> PermissionStatus {
    // On non-Android platforms, permissions are always granted
    PermissionStatus {
        storage: true,
        notifications: true,
    }
}

#[tauri::command]
pub async fn request_permissions() -> Result<PermissionStatus, String> {
    #[cfg(target_os = "android")]
    {
        // Permissions are requested in MainActivity.kt
        // This command just checks the current status
        Ok(check_permissions())
    }
    
    #[cfg(not(target_os = "android"))]
    {
        Ok(check_permissions())
    }
}

#[tauri::command]
pub async fn get_permission_status() -> Result<PermissionStatus, String> {
    Ok(check_permissions())
}
