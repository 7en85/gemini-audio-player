# Design Document

## Overview

This design document describes the architecture for migrating the React-based web audio player to Tauri Mobile for Android. The application will use a hybrid architecture where React handles the UI layer and Rust handles the backend operations including file system access, audio processing, and Android system integration.

The design follows Tauri's IPC (Inter-Process Communication) pattern where the frontend and backend communicate through a secure command/event system. This approach allows us to preserve the existing React UI while gaining the benefits of Rust's performance, safety, and native platform access.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Android System                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ File Picker  │  │ Media Session│  │ Notifications│  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ▲
                            │ Native APIs
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   Tauri Core (Rust)                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Backend Services                     │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐ │   │
│  │  │File Manager│  │Audio Engine│  │Media Service│ │   │
│  │  └────────────┘  └────────────┘  └────────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              IPC Layer                            │   │
│  │  Commands ◄──────────────────────► Events        │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                            ▲
                            │ IPC Bridge
                            ▼
┌─────────────────────────────────────────────────────────┐
│                Frontend (React + TypeScript)             │
│  ┌──────────────────────────────────────────────────┐   │
│  │                 UI Components                     │   │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐ │   │
│  │  │ Player │  │Playlist│  │Controls│  │ Menu   │ │   │
│  │  └────────┘  └────────┘  └────────┘  └────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │                 State Management                  │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐ │   │
│  │  │useAudioIPC │  │usePlaylist │  │useControls │ │   │
│  │  └────────────┘  └────────────┘  └────────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 19 + TypeScript
- Tauri API (@tauri-apps/api)
- Existing UI components (minimal changes)

**Backend:**
- Rust 1.70+
- Tauri Core 2.0+
- Audio libraries: rodio, symphonia
- Android integration: tauri-plugin-fs, custom plugins

**Build Tools:**
- Vite (frontend bundler)
- Cargo (Rust build system)
- Android SDK & NDK
- Tauri CLI

## Components and Interfaces

### Frontend Components

#### 1. App Component (App.tsx)
**Responsibilities:**
- Main UI orchestration
- State management for UI elements
- Routing IPC calls to backend

**Changes from current:**
- Replace `<input type="file">` with Tauri file picker commands
- Replace Web Audio API with IPC commands to Rust backend
- Add error handling for IPC failures
- Add Android-specific UI adjustments (safe areas, back button)

**Key hooks:**
```typescript
useAudioIPC()      // Replaces useAudioPlayer
useFileSystem()    // For file/folder selection
useMediaSession()  // For Android media controls
```

#### 2. useAudioIPC Hook
**Purpose:** Bridge between React UI and Rust audio engine

**Interface:**
```typescript
interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  currentTrack: Track | null;
}

interface AudioControls {
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  seek: (time: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  loadTrack: (path: string) => Promise<void>;
}

function useAudioIPC(): [AudioState, AudioControls]
```

**IPC Commands:**
- `audio:play`
- `audio:pause`
- `audio:stop`
- `audio:seek`
- `audio:set_volume`
- `audio:load_track`

**IPC Events:**
- `audio:state_changed`
- `audio:time_update`
- `audio:track_ended`
- `audio:error`

#### 3. useFileSystem Hook
**Purpose:** Handle file and folder selection

**Interface:**
```typescript
interface FileSystemAPI {
  pickAudioFiles: () => Promise<Track[]>;
  pickAudioFolder: () => Promise<Track[]>;
  getTrackMetadata: (path: string) => Promise<TrackMetadata>;
}

function useFileSystem(): FileSystemAPI
```

**IPC Commands:**
- `fs:pick_audio_files`
- `fs:pick_audio_folder`
- `fs:get_metadata`

### Backend Components (Rust)

#### 1. File Manager Module
**File:** `src-tauri/src/file_manager.rs`

**Responsibilities:**
- Invoke Android file picker
- Scan directories for audio files
- Extract audio metadata
- Validate file formats

**Key structures:**
```rust
pub struct FileManager {
    supported_formats: Vec<String>,
}

pub struct TrackMetadata {
    pub title: String,
    pub artist: String,
    pub duration: f64,
    pub file_path: String,
}
```

**Commands:**
```rust
#[tauri::command]
async fn pick_audio_files(app: AppHandle) -> Result<Vec<TrackMetadata>, String>

#[tauri::command]
async fn pick_audio_folder(app: AppHandle) -> Result<Vec<TrackMetadata>, String>

#[tauri::command]
async fn get_metadata(file_path: String) -> Result<TrackMetadata, String>
```

**Dependencies:**
- `tauri-plugin-fs` - File system access
- `symphonia` - Audio metadata extraction
- `walkdir` - Directory traversal

#### 2. Audio Engine Module
**File:** `src-tauri/src/audio_engine.rs`

**Responsibilities:**
- Audio decoding and playback
- Playback state management
- Volume control
- Seek operations
- Event emission to frontend

**Key structures:**
```rust
pub struct AudioEngine {
    sink: Option<rodio::Sink>,
    current_track: Option<String>,
    state: Arc<Mutex<PlaybackState>>,
}

pub struct PlaybackState {
    pub is_playing: bool,
    pub current_time: f64,
    pub duration: f64,
    pub volume: f32,
}
```

**Commands:**
```rust
#[tauri::command]
async fn audio_play(state: State<'_, AudioEngine>) -> Result<(), String>

#[tauri::command]
async fn audio_pause(state: State<'_, AudioEngine>) -> Result<(), String>

#[tauri::command]
async fn audio_stop(state: State<'_, AudioEngine>) -> Result<(), String>

#[tauri::command]
async fn audio_seek(state: State<'_, AudioEngine>, time: f64) -> Result<(), String>

#[tauri::command]
async fn audio_set_volume(state: State<'_, AudioEngine>, volume: f32) -> Result<(), String>

#[tauri::command]
async fn audio_load_track(state: State<'_, AudioEngine>, path: String) -> Result<f64, String>
```

**Events:**
```rust
// Emitted periodically during playback
app.emit_all("audio:time_update", TimeUpdate { current_time, duration })

// Emitted when track ends
app.emit_all("audio:track_ended", ())

// Emitted on errors
app.emit_all("audio:error", ErrorPayload { message })
```

**Dependencies:**
- `rodio` - Audio playback
- `symphonia` - Audio decoding
- `tokio` - Async runtime

#### 3. Media Service Module
**File:** `src-tauri/src/media_service.rs`

**Responsibilities:**
- Android media session integration
- Notification management
- Lock screen controls
- Hardware button handling

**Key structures:**
```rust
pub struct MediaService {
    session: Option<MediaSession>,
    notification_manager: NotificationManager,
}

pub struct MediaMetadata {
    pub title: String,
    pub artist: String,
    pub duration: i64,
}
```

**Commands:**
```rust
#[tauri::command]
async fn media_update_metadata(
    state: State<'_, MediaService>,
    metadata: MediaMetadata
) -> Result<(), String>

#[tauri::command]
async fn media_update_state(
    state: State<'_, MediaService>,
    is_playing: bool
) -> Result<(), String>
```

**Android Integration:**
- Uses JNI to call Android MediaSession APIs
- Creates persistent notification with media controls
- Handles media button events and forwards to audio engine

**Dependencies:**
- `jni` - Java Native Interface
- Custom Android plugin code

## Data Models

### Track Model

**Frontend (TypeScript):**
```typescript
interface Track {
  id: string;           // Unique identifier (file path hash)
  title: string;        // Track title from metadata or filename
  artist: string;       // Artist from metadata or "Unknown Artist"
  duration: number;     // Duration in seconds
  filePath: string;     // Absolute file path on device
}
```

**Backend (Rust):**
```rust
#[derive(Serialize, Deserialize, Clone)]
pub struct Track {
    pub id: String,
    pub title: String,
    pub artist: String,
    pub duration: f64,
    pub file_path: String,
}
```

### Playback State Model

**Frontend (TypeScript):**
```typescript
interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  repeatMode: 'none' | 'all' | 'one';
  isShuffled: boolean;
}
```

**Backend (Rust):**
```rust
#[derive(Serialize, Deserialize, Clone)]
pub struct PlaybackState {
    pub is_playing: bool,
    pub current_time: f64,
    pub duration: f64,
    pub volume: f32,
}
```

### Playlist Model

**Frontend only (managed in React state):**
```typescript
interface Playlist {
  tracks: Track[];
  currentIndex: number;
  originalOrder: Track[];  // For shuffle/unshuffle
}
```

## Error Handling

### Frontend Error Handling

**Strategy:** Graceful degradation with user feedback

**Error types:**
```typescript
enum AudioErrorType {
  FILE_NOT_FOUND = 'file_not_found',
  DECODE_ERROR = 'decode_error',
  PERMISSION_DENIED = 'permission_denied',
  IPC_ERROR = 'ipc_error',
  UNKNOWN = 'unknown'
}

interface AudioError {
  type: AudioErrorType;
  message: string;
  details?: any;
}
```

**Handling:**
- Display toast notifications for non-critical errors
- Show modal dialogs for critical errors (permissions)
- Auto-skip to next track on playback errors
- Log errors to console for debugging

### Backend Error Handling

**Strategy:** Result-based error propagation with detailed error types

**Error types:**
```rust
#[derive(Debug, thiserror::Error)]
pub enum AudioError {
    #[error("File not found: {0}")]
    FileNotFound(String),
    
    #[error("Failed to decode audio: {0}")]
    DecodeError(String),
    
    #[error("Playback error: {0}")]
    PlaybackError(String),
    
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
}
```

**Handling:**
- Convert errors to user-friendly messages
- Emit error events to frontend
- Log detailed errors for debugging
- Graceful cleanup on errors

### Android-Specific Error Handling

**Permission errors:**
- Request permissions on first use
- Show rationale dialog if denied
- Provide settings link if permanently denied

**Audio focus errors:**
- Pause on audio focus loss
- Resume on audio focus gain (if was playing)
- Handle transient focus loss (notifications)

## Testing Strategy

### Frontend Testing

**Unit Tests:**
- Test custom hooks (useAudioIPC, useFileSystem)
- Test utility functions (formatTime, etc.)
- Mock IPC calls using Tauri's test utilities

**Integration Tests:**
- Test IPC command/event flow
- Test state synchronization between frontend and backend
- Test error handling and recovery

**Tools:**
- Vitest for unit tests
- React Testing Library for component tests
- Tauri's mock API for IPC testing

### Backend Testing

**Unit Tests:**
- Test audio engine operations (play, pause, seek)
- Test file manager operations (scan, metadata extraction)
- Test media service integration

**Integration Tests:**
- Test full playback flow
- Test file selection and loading
- Test Android media session integration

**Tools:**
- Rust's built-in test framework
- `mockall` for mocking
- Android emulator for integration tests

### End-to-End Testing

**Manual Testing:**
- Test on physical Android devices
- Test various audio formats
- Test background playback
- Test notification controls
- Test lock screen controls
- Test hardware button controls

**Automated E2E:**
- Use Tauri's WebDriver integration
- Test critical user flows
- Test on Android emulator

## Migration Strategy

### Phase 1: Setup and Configuration
1. Initialize Tauri project structure
2. Configure Android build environment
3. Set up Rust dependencies
4. Configure Tauri permissions and capabilities

### Phase 2: Backend Implementation
1. Implement file manager module
2. Implement audio engine module
3. Implement media service module
4. Create IPC command handlers

### Phase 3: Frontend Migration
1. Create IPC hooks (useAudioIPC, useFileSystem)
2. Replace Web Audio API with IPC calls
3. Replace file input with native pickers
4. Add Android-specific UI adjustments

### Phase 4: Integration and Testing
1. Test IPC communication
2. Test audio playback
3. Test file operations
4. Test background playback
5. Test media controls

### Phase 5: Polish and Optimization
1. Optimize performance
2. Improve error handling
3. Add loading states
4. Optimize battery usage
5. Test on various devices

## Performance Considerations

**Audio Playback:**
- Use buffering to prevent stuttering
- Decode audio in background thread
- Minimize main thread blocking

**File Operations:**
- Scan directories asynchronously
- Cache metadata to avoid re-scanning
- Use efficient file format detection

**Memory Management:**
- Release audio resources when not playing
- Limit playlist size if needed
- Clean up file handles properly

**Battery Optimization:**
- Use Android's wake locks appropriately
- Stop background services when not needed
- Optimize notification updates

## Security Considerations

**File Access:**
- Use scoped storage (Android 10+)
- Request only necessary permissions
- Validate file paths before access

**IPC Security:**
- Use Tauri's built-in IPC security
- Validate all command parameters
- Sanitize file paths

**Data Storage:**
- Store preferences securely
- Don't store sensitive data
- Use Android's secure storage APIs

## Build and Deployment

**Development Build:**
```bash
npm run tauri android dev
```

**Production Build:**
```bash
npm run tauri android build
```

**APK Output:**
- Debug APK: `src-tauri/gen/android/app/build/outputs/apk/debug/`
- Release APK: `src-tauri/gen/android/app/build/outputs/apk/release/`

**Signing:**
- Generate keystore for release builds
- Configure signing in `build.gradle`
- Store keystore securely

**Distribution:**
- Google Play Store (recommended)
- Direct APK distribution
- F-Droid (if open source)
