<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Gemini Audio Player - Tauri Mobile

A native Android audio player built with React, TypeScript, and Tauri Mobile.

View your app in AI Studio: https://ai.studio/apps/drive/19hKCqUgvsMWWNTSMVMicM_tKVlJk95w5

## Features

- Native Android application
- Audio playback with support for MP3, FLAC, WAV, OGG, and M4A formats
- Background playback with media controls
- Lock screen controls and notifications
- Playlist management with shuffle and repeat modes
- Native file and folder picker

## Prerequisites

- Node.js (v18 or higher)
- Rust (latest stable)
- Android SDK and NDK (for Android builds)
- Java Development Kit (JDK 17)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Android Environment (for mobile builds)

See [ANDROID_SETUP.md](ANDROID_SETUP.md) for detailed instructions on setting up the Android development environment.

### 3. Initialize Android Project

After setting up the Android environment:

```bash
npm run tauri:android:init
```

## Development

### Run Web Version (Desktop)

```bash
npm run tauri:dev
```

### Run Android Version

```bash
npm run tauri:android:dev
```

This will build and run the app on a connected Android device or emulator.

## Building

### Build Desktop Version

```bash
npm run tauri:build
```

### Build Android APK

```bash
# Debug build
npm run tauri:android:build -- --debug

# Release build
npm run tauri:android:build
```

The APK will be generated in `src-tauri/gen/android/app/build/outputs/apk/`

## Project Structure

```
.
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── lib.rs         # Main Tauri application
│   │   ├── file_manager.rs    # File operations module
│   │   ├── audio_engine.rs    # Audio playback module
│   │   └── media_service.rs   # Android media integration
│   ├── capabilities/      # Tauri capabilities configuration
│   └── tauri.conf.json    # Tauri configuration
├── hooks/                 # React hooks
├── App.tsx               # Main React component
└── index.tsx             # Entry point
```

## Migration Status

This project is being migrated from a web-based audio player to a native Android application using Tauri Mobile. See `.kiro/specs/tauri-mobile-migration/` for detailed requirements, design, and implementation tasks.

## License

[Your License Here]
