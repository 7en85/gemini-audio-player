# Быстрая настройка Android для Tauri

## Шаг 1: Установить Java JDK 17

### Вариант A: Через Chocolatey (рекомендуется)
```powershell
# Установить Chocolatey (если еще не установлен)
# Запустить PowerShell от имени администратора и выполнить:
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Установить Java
choco install openjdk17 -y
```

### Вариант B: Скачать вручную
1. Скачать: https://adoptium.net/temurin/releases/?version=17
2. Установить
3. Добавить в PATH

## Шаг 2: Установить Android Studio

1. Скачать: https://developer.android.com/studio
2. Установить Android Studio
3. Запустить Android Studio
4. Пройти Setup Wizard
5. Установить через SDK Manager:
   - Android SDK Platform 33
   - Android SDK Platform 24
   - Android SDK Build-Tools
   - Android SDK Command-line Tools
   - Android SDK Platform-Tools
   - Android Emulator
   - NDK (Side by side)

## Шаг 3: Настроить переменные окружения

### Автоматическая настройка (PowerShell от администратора):

```powershell
# ANDROID_HOME
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', "$env:LOCALAPPDATA\Android\Sdk", 'User')

# NDK_HOME (проверьте версию в папке ndk)
$ndkVersion = "27.0.12077973"  # Замените на вашу версию
[System.Environment]::SetEnvironmentVariable('NDK_HOME', "$env:LOCALAPPDATA\Android\Sdk\ndk\$ndkVersion", 'User')

# Обновить PATH
$currentPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')
$newPaths = @(
    "$env:LOCALAPPDATA\Android\Sdk\platform-tools",
    "$env:LOCALAPPDATA\Android\Sdk\cmdline-tools\latest\bin"
)
$updatedPath = ($newPaths -join ';') + ';' + $currentPath
[System.Environment]::SetEnvironmentVariable('Path', $updatedPath, 'User')
```

### Перезапустить терминал после настройки!

## Шаг 4: Установить Rust Android targets

```powershell
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
```

## Шаг 5: Проверить установку

```powershell
java -version
echo $env:ANDROID_HOME
echo $env:NDK_HOME
adb --version
```

## Шаг 6: Инициализировать Android проект

```powershell
npm run tauri:android:init
```

## Шаг 7: Собрать APK

### Debug версия:
```powershell
npm run tauri:android:build -- --debug
```

### Release версия:
```powershell
npm run tauri:android:build
```

APK будет в: `src-tauri/gen/android/app/build/outputs/apk/`

## Шаг 8: Установить на устройство

### Через USB:
1. Включить "Режим разработчика" на Android
2. Включить "Отладка по USB"
3. Подключить устройство
4. Разрешить отладку на устройстве
5. Установить APK:
```powershell
adb install src-tauri/gen/android/app/build/outputs/apk/debug/app-debug.apk
```

### Или скопировать APK на устройство и установить вручную

---

## Быстрый старт (если все установлено):

```powershell
# 1. Инициализация
npm run tauri:android:init

# 2. Сборка
npm run tauri:android:build -- --debug

# 3. Установка
adb install src-tauri/gen/android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Troubleshooting

### Java not found
- Перезапустите терминал после установки
- Проверьте JAVA_HOME: `echo $env:JAVA_HOME`

### Android SDK not found
- Проверьте ANDROID_HOME: `echo $env:ANDROID_HOME`
- Путь должен быть: `C:\Users\[USER]\AppData\Local\Android\Sdk`

### NDK not found
- Установите NDK через Android Studio SDK Manager
- Проверьте версию в папке: `%LOCALAPPDATA%\Android\Sdk\ndk\`
- Обновите NDK_HOME с правильной версией

### Build errors
- Убедитесь что установлены SDK Platform 24 и 33
- Проверьте что NDK установлен
- Попробуйте очистить: `cd src-tauri/gen/android && gradlew clean`

---

## Альтернатива: Использовать эмулятор

Если нет физического устройства:

1. Открыть Android Studio
2. Tools → Device Manager
3. Create Virtual Device
4. Выбрать устройство (например, Pixel 5)
5. Выбрать system image (API 33)
6. Finish
7. Запустить эмулятор
8. Запустить: `npm run tauri:android:dev`

---

**Примерное время установки:** 30-60 минут  
**Размер загрузки:** ~3-5 GB (Android Studio + SDK)
