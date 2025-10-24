# Implementation Plan

- [x] 1. Initialize Tauri Mobile project structure





  - Install Tauri CLI and initialize Tauri in the existing project
  - Configure Tauri for Android mobile target
  - Set up Android SDK and NDK paths in environment
  - Create initial `src-tauri` directory structure with main.rs
  - Configure tauri.conf.json for mobile capabilities
  - _Requirements: 1.1, 1.2, 1.3_



- [x] 2. Configure Android build environment and permissions
  - Configure Android manifest with required permissions (READ_EXTERNAL_STORAGE, FOREGROUND_SERVICE)
  - Set up Android build.gradle with proper SDK versions (minSdk 24, targetSdk 33+)
  - Configure app icon and branding in Android resources
  - Set up Tauri capabilities for file system and notifications
  - Test basic Android build and deployment to emulator
  - _Requirements: 1.1, 1.3, 1.4, 2.1, 10.2_

- [x] 3. Implement Rust File Manager module





- [ ] 3.1 Create file manager structure and basic file operations
  - Create `src-tauri/src/file_manager.rs` module
  - Implement FileManager struct with supported audio formats list
  - Implement file format validation function
  - Add dependencies: tauri-plugin-fs, walkdir


  - _Requirements: 2.5, 8.2_

- [ ] 3.2 Implement audio file picker command
  - Create `pick_audio_files` Tauri command
  - Integrate with Android file picker using Tauri dialog API


  - Filter files by audio MIME types
  - Return selected file paths to frontend
  - _Requirements: 2.1, 2.2, 8.1_

- [x] 3.3 Implement folder picker and recursive scanning


  - Create `pick_audio_folder` Tauri command
  - Integrate with Android directory picker
  - Implement recursive directory scanning with walkdir
  - Filter audio files during scan
  - _Requirements: 2.3, 2.4, 8.2_



- [ ] 3.4 Implement metadata extraction
  - Add symphonia dependency for audio metadata
  - Create `get_metadata` Tauri command





  - Extract title, artist, and duration from audio files
  - Handle missing metadata gracefully with fallbacks
  - Return TrackMetadata struct to frontend
  - _Requirements: 2.5, 8.2_

- [x] 3.5 Add error handling and validation


  - Implement custom error types for file operations
  - Add file existence validation
  - Add permission error handling
  - Add logging for debugging
  - _Requirements: 10.1, 10.2_


- [ ] 4. Implement Rust Audio Engine module
- [ ] 4.1 Create audio engine structure and state management
  - Create `src-tauri/src/audio_engine.rs` module
  - Implement AudioEngine struct with rodio Sink
  - Implement PlaybackState struct with Arc<Mutex> for thread safety
  - Add dependencies: rodio, symphonia
  - Initialize audio output stream


  - _Requirements: 3.1, 8.3, 8.4_

- [ ] 4.2 Implement audio loading and playback commands
  - Create `audio_load_track` command to load audio file
  - Decode audio using symphonia
  - Create `audio_play` command to start playback

  - Create `audio_pause` command to pause playback
  - Create `audio_stop` command to stop and reset playback
  - _Requirements: 3.1, 3.2, 8.3, 8.4_

- [ ] 4.3 Implement seek and volume control commands
  - Create `audio_seek` command to change playback position
  - Implement seek functionality with rodio
  - Create `audio_set_volume` command
  - Implement volume control with clamping (0.0-1.0)
  - Persist volume setting to preferences
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 8.4_

- [ ] 4.4 Implement playback state events
  - Create background thread for time updates
  - Emit `audio:time_update` event every 500ms during playback
  - Emit `audio:track_ended` event when track finishes
  - Emit `audio:state_changed` event on play/pause/stop
  - Update PlaybackState and emit to frontend
  - _Requirements: 3.5, 5.5, 8.5_

- [ ] 4.5 Add audio engine error handling
  - Implement AudioError enum with error types
  - Handle decode errors gracefully
  - Handle playback errors and emit error events
  - Add cleanup on errors
  - _Requirements: 10.1, 10.5_

- [ ] 5. Implement Rust Media Service module for Android integration
- [ ] 5.1 Create media service structure
  - Create `src-tauri/src/media_service.rs` module
  - Implement MediaService struct
  - Set up JNI bridge for Android MediaSession
  - Add jni dependency
  - _Requirements: 9.1, 9.2_

- [ ] 5.2 Implement media session integration
  - Create `media_update_metadata` command
  - Register MediaSession with Android system
  - Update MediaSession metadata (title, artist, duration)
  - Create `media_update_state` command for playback state
  - _Requirements: 9.1, 9.4_

- [ ] 5.3 Implement notification with media controls
  - Create persistent notification with media controls
  - Add play/pause, next, previous buttons to notification





  - Update notification when track changes
  - Handle notification button clicks and forward to audio engine
  - _Requirements: 4.2, 4.3, 9.2_

- [ ] 5.4 Implement lock screen controls
  - Display media controls on lock screen


  - Update lock screen metadata when track changes
  - Handle lock screen button interactions
  - _Requirements: 9.2, 9.4_

- [ ] 5.5 Implement hardware button handling
  - Listen for media button events (headphone controls)
  - Handle play/pause, next, previous from hardware buttons


  - Forward commands to audio engine
  - _Requirements: 9.3_




- [ ] 5.6 Implement audio focus handling
  - Request audio focus when starting playback
  - Handle audio focus loss (pause playback)
  - Handle audio focus gain (resume if was playing)
  - Handle transient focus loss
  - _Requirements: 10.3, 10.4_


- [ ] 6. Create frontend IPC hooks
- [ ] 6.1 Create useAudioIPC hook
  - Create `hooks/useAudioIPC.ts` file
  - Implement AudioState and AudioControls interfaces
  - Create IPC command wrappers (play, pause, stop, seek, setVolume, loadTrack)
  - Set up event listeners for audio:time_update, audio:track_ended, audio:state_changed

  - Manage state synchronization between backend and frontend
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 5.1, 5.2, 5.3_

- [ ] 6.2 Create useFileSystem hook
  - Create `hooks/useFileSystem.ts` file
  - Implement FileSystemAPI interface
  - Create pickAudioFiles function using IPC command
  - Create pickAudioFolder function using IPC command
  - Create getTrackMetadata function using IPC command
  - Handle errors and return user-friendly messages
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 6.3 Create useMediaSession hook
  - Create `hooks/useMediaSession.ts` file
  - Implement functions to update media session metadata
  - Implement functions to update playback state
  - Sync with audio playback state
  - _Requirements: 9.1, 9.4_

- [ ] 7. Migrate App.tsx to use Tauri IPC
- [ ] 7.1 Replace useAudioPlayer with useAudioIPC
  - Import useAudioIPC hook
  - Replace all Web Audio API calls with IPC commands
  - Update state management to use IPC events
  - Remove old useAudioPlayer hook
  - Test basic playback functionality
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 7.2 Replace file input with native file picker
  - Import useFileSystem hook
  - Replace handleFileChange with pickAudioFiles IPC call
  - Update handleMenuAction to use pickAudioFolder IPC call
  - Remove file input element and ref
  - Update track loading to use file paths instead of blob URLs
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 7.3 Integrate media session updates
  - Import useMediaSession hook
  - Update media session when track changes
  - Update media session when playback state changes
  - Sync metadata with current track
  - _Requirements: 9.1, 9.2, 9.4_

- [x] 7.4 Add Android-specific UI adjustments

  - Add safe area handling for Android notch/navigation
  - Handle Android back button to minimize instead of exit
  - Adjust touch targets for mobile (larger buttons)
  - Test UI responsiveness on various screen sizes
  - _Requirements: 1.2_

- [x] 7.5 Implement error handling UI


  - Create error toast component
  - Display errors from IPC calls
  - Add permission request dialogs
  - Add error recovery options
  - _Requirements: 10.1, 10.2, 10.5_

- [ ] 8. Implement background playback support
- [ ] 8.1 Configure Android foreground service
  - Update Android manifest with FOREGROUND_SERVICE permission
  - Create foreground service in Rust
  - Start service when playback begins
  - Stop service when playback ends and app is closed
  - _Requirements: 4.1, 4.2_

- [ ] 8.2 Ensure audio continues in background
  - Test playback when app is minimized
  - Test playback when screen is locked
  - Test playback when switching apps
  - Verify audio doesn't stop in background
  - _Requirements: 4.1_

- [ ] 8.3 Test notification controls in background
  - Test play/pause from notification
  - Test next/previous from notification
  - Test notification updates when track changes
  - Verify app state syncs when returning from background
  - _Requirements: 4.2, 4.3, 4.4_

- [x] 9. Implement playlist management features



- [x] 9.1 Update shuffle functionality for file-based tracks

  - Update toggleShuffle to work with file paths
  - Ensure current track continues playing when shuffle is toggled
  - Test shuffle with various playlist sizes
  - _Requirements: 6.1, 6.2_

- [x] 9.2 Update repeat mode functionality

  - Ensure repeat modes work with IPC-based playback
  - Test repeat all mode
  - Test repeat one mode
  - Test no repeat mode
  - _Requirements: 6.3, 6.4, 6.5_

- [x] 9.3 Update playlist UI interactions

  - Ensure track selection works with new audio system
  - Ensure track deletion works correctly
  - Ensure clear playlist works correctly
  - Test playlist visibility toggle
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 10. Build and test Android APK
- [ ] 10.1 Create debug build
  - Run `npm run tauri android build -- --debug`
  - Install APK on Android emulator
  - Test basic functionality on emulator
  - Fix any build errors
  - _Requirements: 1.1, 1.2_

- [ ] 10.2 Test on physical Android device
  - Install debug APK on physical device
  - Test all features on real hardware
  - Test various audio formats
  - Test background playback
  - Test notification controls
  - Test lock screen controls
  - Test hardware button controls
  - _Requirements: 1.1, 1.2, 2.5, 4.1, 4.2, 4.3, 9.2, 9.3_

- [ ] 10.3 Configure release build
  - Generate Android keystore for signing
  - Configure signing in build.gradle
  - Update tauri.conf.json for release
  - Create release build
  - _Requirements: 1.1_

- [ ] 10.4 Optimize performance and battery usage
  - Profile app performance
  - Optimize audio buffer sizes
  - Optimize notification update frequency
  - Test battery usage during extended playback
  - Implement wake lock management
  - _Requirements: 4.1_

- [ ] 11. Final polish and documentation
- [ ] 11.1 Update README with Android build instructions
  - Document prerequisites (Android SDK, NDK, Rust)
  - Document build commands
  - Document development workflow
  - Add troubleshooting section
  - _Requirements: 1.1_

- [ ] 11.2 Add user documentation
  - Document how to add files and folders
  - Document playback controls
  - Document shuffle and repeat modes
  - Document background playback features
  - _Requirements: 2.1, 2.3, 3.1, 4.1, 6.1_

- [ ] 11.3 Create demo video or screenshots
  - Capture screenshots of main UI
  - Capture notification controls
  - Capture lock screen controls
  - Create demo video showing key features
  - _Requirements: 1.2_
