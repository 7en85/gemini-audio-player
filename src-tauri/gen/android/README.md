# Android Project Configuration

Эта директория содержит конфигурацию Android проекта для Tauri Mobile приложения.

## Структура

```
android/
├── app/
│   ├── src/main/
│   │   ├── AndroidManifest.xml      # Манифест приложения с разрешениями
│   │   └── res/                     # Ресурсы Android
│   │       ├── values/
│   │       │   ├── strings.xml      # Строковые ресурсы
│   │       │   ├── colors.xml       # Цветовая палитра
│   │       │   └── styles.xml       # Стили приложения
│   │       └── mipmap/              # Иконки приложения (будут созданы)
│   ├── build.gradle.kts             # Конфигурация сборки приложения
│   └── proguard-rules.pro           # Правила ProGuard для release
├── build.gradle.kts                 # Корневая конфигурация Gradle
├── settings.gradle.kts              # Настройки проекта Gradle
└── gradle.properties                # Свойства Gradle

```

## Настроенные разрешения

В `AndroidManifest.xml` настроены следующие разрешения:

### Основные разрешения
- `INTERNET` - для загрузки данных (если потребуется)
- `READ_EXTERNAL_STORAGE` - чтение аудио файлов (Android ≤ 12)
- `READ_MEDIA_AUDIO` - чтение аудио файлов (Android 13+)

### Разрешения для фонового воспроизведения
- `FOREGROUND_SERVICE` - запуск foreground service
- `FOREGROUND_SERVICE_MEDIA_PLAYBACK` - воспроизведение медиа в фоне
- `WAKE_LOCK` - предотвращение засыпания устройства
- `POST_NOTIFICATIONS` - отображение уведомлений (Android 13+)

## Конфигурация сборки

### SDK версии
- **minSdk**: 24 (Android 7.0)
- **targetSdk**: 34 (Android 14)
- **compileSdk**: 34

### Типы сборки
- **debug**: Отладочная сборка с символами отладки
- **release**: Релизная сборка с минификацией и ProGuard

## Компоненты приложения

### MainActivity
Главная активность приложения с поддержкой:
- Запуска приложения
- Открытия аудио файлов из других приложений
- Обработки изменений конфигурации

### AudioPlaybackService
Foreground service для фонового воспроизведения:
- Тип: `mediaPlayback`
- Отображает постоянное уведомление
- Управляет воспроизведением в фоне

### MediaButtonReceiver
Приемник для обработки:
- Кнопок на наушниках
- Bluetooth кнопок управления
- Системных медиа-кнопок

## Зависимости

### AndroidX
- `webkit` - WebView компонент
- `appcompat` - Совместимость с разными версиями Android
- `core-ktx` - Kotlin расширения
- `media` - Media Session API

### Material Design
- `material` - Material Design компоненты

## Следующие шаги

1. **Создать иконки приложения**
   - Разместить иконки в `app/src/main/res/mipmap-*/`
   - Размеры: mdpi (48x48), hdpi (72x72), xhdpi (96x96), xxhdpi (144x144), xxxhdpi (192x192)

2. **Настроить окружение**
   - Установить Android SDK и NDK
   - Установить Java JDK 17
   - Настроить переменные окружения

3. **Инициализировать проект**
   ```bash
   npm run tauri:android:init
   ```

4. **Собрать и запустить**
   ```bash
   npm run tauri:android:dev
   ```

## Примечания

- Файлы в этой директории созданы вручную для продолжения разработки
- После настройки Android окружения, команда `tauri android init` может перезаписать некоторые файлы
- Убедитесь, что все разрешения запрашиваются у пользователя в runtime (для Android 6.0+)
