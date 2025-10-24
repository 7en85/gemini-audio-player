// Module declarations
mod errors;
mod file_manager;
mod audio_engine;
mod media_service;
mod permissions;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  // Initialize audio engine
  let audio_engine = audio_engine::AudioEngine::new()
    .expect("Failed to initialize audio engine");
  
  tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_notification::init())
    .manage(audio_engine::AudioEngineState {
      engine: std::sync::Arc::new(std::sync::Mutex::new(audio_engine)),
    })
    .invoke_handler(tauri::generate_handler![
      permissions::request_permissions,
      permissions::get_permission_status,
      file_manager::pick_audio_files,
      file_manager::pick_audio_folder,
      file_manager::get_metadata,
      file_manager::get_multiple_metadata,
      audio_engine::audio_load_track,
      audio_engine::audio_play,
      audio_engine::audio_pause,
      audio_engine::audio_stop,
      audio_engine::audio_get_state,
      audio_engine::audio_set_volume,
      audio_engine::audio_check_finished,
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
