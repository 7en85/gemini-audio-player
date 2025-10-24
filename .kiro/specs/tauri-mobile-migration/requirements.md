# Requirements Document

## Introduction

This document outlines the requirements for migrating the existing React-based web audio player to a Tauri Mobile application for Android. The goal is to create a native Android application that preserves the existing UI and functionality while leveraging Rust for backend operations, file system access, and audio processing. The migration will enable the application to run as a native Android app with improved performance, security, and access to device capabilities.

## Glossary

- **Tauri**: A framework for building native applications using web technologies for the frontend and Rust for the backend
- **Audio Player System**: The complete application including UI, audio playback engine, and file management
- **Frontend**: The React-based user interface layer
- **Backend**: The Rust-based core that handles file operations and audio processing
- **IPC (Inter-Process Communication)**: The communication bridge between Frontend and Backend
- **Track**: An audio file with metadata (title, artist, file path)
- **Playlist**: A collection of tracks managed by the user
- **Media Session**: Android system integration for media controls and notifications
- **File Picker**: Native Android file selection interface
- **Audio Engine**: The Rust component responsible for audio decoding and playback

## Requirements

### Requirement 1

**User Story:** As a user, I want to install and run the audio player as a native Android application, so that I can use it like any other Android app on my device

#### Acceptance Criteria

1. WHEN the user installs the APK, THE Audio Player System SHALL install successfully on Android devices running API level 24 (Android 7.0) or higher
2. WHEN the user launches the app from the Android launcher, THE Audio Player System SHALL start within 3 seconds and display the main player interface
3. WHEN the app is running, THE Audio Player System SHALL request necessary permissions (storage access) on first launch
4. THE Audio Player System SHALL display an app icon in the Android launcher that matches the application branding

### Requirement 2

**User Story:** As a user, I want to select audio files from my device storage, so that I can add them to my playlist

#### Acceptance Criteria

1. WHEN the user taps "Добавить файлы" in the menu, THE Audio Player System SHALL open the native Android file picker filtered to audio files
2. WHEN the user selects one or more audio files, THE Audio Player System SHALL add the selected files to the playlist within 1 second
3. WHEN the user taps "Добавить папку" in the menu, THE Audio Player System SHALL open the native Android directory picker
4. WHEN the user selects a directory, THE Audio Player System SHALL scan the directory recursively for audio files and add all found audio files to the playlist
5. THE Audio Player System SHALL support common audio formats including MP3, FLAC, WAV, OGG, and M4A

### Requirement 3

**User Story:** As a user, I want to play, pause, and navigate through my playlist, so that I can control my music playback

#### Acceptance Criteria

1. WHEN the user taps the play button, THE Audio Player System SHALL begin playback of the current track within 500 milliseconds
2. WHEN the user taps the pause button during playback, THE Audio Player System SHALL pause playback immediately
3. WHEN the user taps the next track button, THE Audio Player System SHALL skip to the next track in the playlist and begin playback
4. WHEN the user taps the previous track button, THE Audio Player System SHALL skip to the previous track in the playlist and begin playback
5. WHEN a track finishes playing, THE Audio Player System SHALL automatically advance to the next track based on repeat mode settings

### Requirement 4

**User Story:** As a user, I want the audio to continue playing when the app is in the background, so that I can use other apps while listening to music

#### Acceptance Criteria

1. WHEN the user switches to another app during playback, THE Audio Player System SHALL continue playing audio without interruption
2. WHEN audio is playing in the background, THE Audio Player System SHALL display a persistent notification with track information and playback controls
3. WHEN the user interacts with notification controls, THE Audio Player System SHALL respond to play, pause, next, and previous commands
4. WHEN the user returns to the app from background, THE Audio Player System SHALL display the current playback state accurately

### Requirement 5

**User Story:** As a user, I want to control playback progress and volume, so that I can customize my listening experience

#### Acceptance Criteria

1. WHEN the user drags the progress bar, THE Audio Player System SHALL seek to the corresponding position in the track within 200 milliseconds
2. WHEN the user taps on the progress bar, THE Audio Player System SHALL seek to the tapped position within 200 milliseconds
3. WHEN the user adjusts the volume slider, THE Audio Player System SHALL change the playback volume to the selected level immediately
4. THE Audio Player System SHALL persist the volume setting and restore it when the app is relaunched
5. THE Audio Player System SHALL display current playback time and total track duration with accuracy within 1 second

### Requirement 6

**User Story:** As a user, I want to use shuffle and repeat modes, so that I can customize how my playlist plays

#### Acceptance Criteria

1. WHEN the user enables shuffle mode, THE Audio Player System SHALL randomize the playback order while keeping the currently playing track active
2. WHEN the user disables shuffle mode, THE Audio Player System SHALL restore the original playlist order
3. WHEN repeat mode is set to "all", THE Audio Player System SHALL restart the playlist from the beginning after the last track finishes
4. WHEN repeat mode is set to "one", THE Audio Player System SHALL replay the current track continuously
5. WHEN repeat mode is set to "none", THE Audio Player System SHALL stop playback after the last track finishes

### Requirement 7

**User Story:** As a user, I want to manage my playlist by viewing, selecting, and deleting tracks, so that I can organize my music

#### Acceptance Criteria

1. WHEN the user taps the playlist toggle button, THE Audio Player System SHALL display or hide the playlist within 300 milliseconds with smooth animation
2. WHEN the user taps a track in the playlist, THE Audio Player System SHALL begin playing that track immediately
3. WHEN the user taps the delete button on a track, THE Audio Player System SHALL remove that track from the playlist immediately
4. WHEN the user taps "Очистить плейлист", THE Audio Player System SHALL remove all tracks from the playlist and stop playback
5. THE Audio Player System SHALL display visual indicators showing which track is currently playing and whether it is playing or paused

### Requirement 8

**User Story:** As a developer, I want the Rust backend to handle all file operations and audio processing, so that the application is performant and secure

#### Acceptance Criteria

1. THE Backend SHALL provide IPC commands for file selection that invoke native Android file pickers
2. THE Backend SHALL scan directories for audio files and extract metadata (title, artist, duration) using Rust audio libraries
3. THE Backend SHALL handle audio decoding and playback using Rust audio processing libraries
4. THE Backend SHALL expose playback control commands (play, pause, stop, seek, volume) to the Frontend via IPC
5. THE Backend SHALL emit playback state events (playing, paused, time updates, track ended) to the Frontend via IPC

### Requirement 9

**User Story:** As a user, I want the app to integrate with Android system media controls, so that I can control playback from lock screen and notification shade

#### Acceptance Criteria

1. WHEN audio is playing, THE Audio Player System SHALL register a media session with the Android system
2. WHEN the device is locked during playback, THE Audio Player System SHALL display media controls on the lock screen with track information
3. WHEN the user uses hardware media buttons (headphone controls), THE Audio Player System SHALL respond to play, pause, next, and previous commands
4. THE Audio Player System SHALL update the media session metadata when the track changes
5. THE Audio Player System SHALL release the media session when playback stops and the app is closed

### Requirement 10

**User Story:** As a user, I want the app to handle errors gracefully, so that I have a smooth experience even when issues occur

#### Acceptance Criteria

1. WHEN a file cannot be loaded or decoded, THE Audio Player System SHALL display an error message and skip to the next track
2. WHEN storage permissions are denied, THE Audio Player System SHALL display a message explaining why permissions are needed
3. WHEN the app loses audio focus (incoming call), THE Audio Player System SHALL pause playback automatically
4. WHEN audio focus is regained, THE Audio Player System SHALL resume playback if it was playing before interruption
5. IF the Backend encounters a critical error, THEN THE Audio Player System SHALL log the error and display a user-friendly error message
