# Android Development Environment Setup

This guide will help you set up the Android development environment required for building the Tauri Mobile application.

## Prerequisites

### 1. Install Java Development Kit (JDK)

**Option A: Install via Chocolatey (Recommended for Windows)**
```powershell
choco install openjdk17
```

**Option B: Manual Installation**
1. Download JDK 17 from [Oracle](https://www.oracle.com/java/technologies/downloads/#java17) or [Adoptium](https://adoptium.net/)
2. Install and note the installation path (e.g., `C:\Program Files\Java\jdk-17`)
3. Set JAVA_HOME environment variable:
   ```powershell
   [System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Java\jdk-17', 'Machine')
   ```

### 2. Install Android Studio

1. Download Android Studio from [developer.android.com](https://developer.android.com/studio)
2. Install Android Studio
3. Open Android Studio and go through the setup wizard
4. Install the following components via SDK Manager:
   - Android SDK Platform 33 (API Level 33)
   - Android SDK Platform 24 (API Level 24) - minimum supported
   - Android SDK Build-Tools
   - Android SDK Command-line Tools
   - Android SDK Platform-Tools
   - Android Emulator
   - NDK (Side by side)

### 3. Set Environment Variables

Add the following environment variables (adjust paths based on your installation):

**ANDROID_HOME**
```powershell
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', "$env:LOCALAPPDATA\Android\Sdk", 'User')
```

**NDK_HOME**
```powershell
$ndkVersion = "27.0.12077973"  # Check your installed version
[System.Environment]::SetEnvironmentVariable('NDK_HOME', "$env:LOCALAPPDATA\Android\Sdk\ndk\$ndkVersion", 'User')
```

**Update PATH**
```powershell
$currentPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')
$newPaths = @(
    "$env:LOCALAPPDATA\Android\Sdk\platform-tools",
    "$env:LOCALAPPDATA\Android\Sdk\cmdline-tools\latest\bin",
    "$env:LOCALAPPDATA\Android\Sdk\emulator"
)
$updatedPath = ($newPaths + $currentPath) -join ';'
[System.Environment]::SetEnvironmentVariable('Path', $updatedPath, 'User')
```

### 4. Install Rust Android Targets

```powershell
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
```

### 5. Verify Installation

Close and reopen your terminal, then verify:

```powershell
java -version
echo $env:JAVA_HOME
echo $env:ANDROID_HOME
echo $env:NDK_HOME
adb --version
```

## Initialize Android Project

Once the environment is set up, initialize the Android project:

```powershell
npm run tauri:android:init
```

This will create the `src-tauri/gen/android` directory with the Android project structure.

## Running on Android

### Development Mode (with hot reload)
```powershell
npm run tauri:android:dev
```

### Build APK
```powershell
# Debug build
npm run tauri:android:build -- --debug

# Release build
npm run tauri:android:build
```

## Troubleshooting

### Java not found
- Ensure JAVA_HOME is set correctly
- Restart your terminal/IDE after setting environment variables
- Verify with `java -version`

### Android SDK not found
- Ensure ANDROID_HOME points to your SDK location
- Default location: `%LOCALAPPDATA%\Android\Sdk`
- Verify with `echo $env:ANDROID_HOME`

### NDK not found
- Install NDK via Android Studio SDK Manager
- Set NDK_HOME to the specific version directory
- Example: `%LOCALAPPDATA%\Android\Sdk\ndk\27.0.12077973`

### Build errors
- Ensure all SDK components are installed
- Check that minSdkVersion (24) and targetSdkVersion (33) are installed
- Run `sdkmanager --list` to see installed packages

## Next Steps

After setting up the environment:
1. Run `npm run tauri:android:init` to initialize the Android project
2. Configure Android manifest permissions (Task 2)
3. Start implementing Rust modules (Tasks 3-5)
