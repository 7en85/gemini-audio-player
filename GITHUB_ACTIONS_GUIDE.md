# 🚀 Автоматическая сборка Android APK через GitHub Actions

## Что это дает?

✅ **Не нужно устанавливать Android SDK локально**  
✅ **Автоматическая сборка при каждом коммите**  
✅ **Бесплатно** (2000 минут в месяц для публичных репозиториев)  
✅ **APK доступен для скачивания**

---

## 📋 Шаги для настройки

### 1. Создать GitHub репозиторий

Если еще не создан:

```bash
# Инициализировать git (если еще не сделано)
git init

# Добавить все файлы
git add .

# Сделать первый коммит
git commit -m "Initial commit: Tauri Audio Player"

# Создать репозиторий на GitHub.com
# Затем подключить его:
git remote add origin https://github.com/ВАШ_USERNAME/gemini-audio-player.git
git branch -M main
git push -u origin main
```

### 2. Workflow уже создан!

Файл `.github/workflows/android-build.yml` уже создан в проекте.

### 3. Запушить изменения

```bash
git add .github/workflows/android-build.yml
git commit -m "Add GitHub Actions workflow for Android build"
git push
```

### 4. Проверить сборку

1. Откройте ваш репозиторий на GitHub
2. Перейдите во вкладку **Actions**
3. Вы увидите запущенный workflow "Build Android APK"
4. Дождитесь завершения (~10-15 минут)

### 5. Скачать APK

После успешной сборки:

1. Откройте завершенный workflow
2. Прокрутите вниз до секции **Artifacts**
3. Скачайте `android-debug-apk`
4. Распакуйте ZIP
5. Установите APK на Android устройство

---

## 🎯 Как использовать

### Автоматическая сборка

Каждый раз когда вы делаете `git push`, автоматически:
1. ✅ Устанавливается Android SDK
2. ✅ Компилируется Rust код
3. ✅ Собирается APK
4. ✅ APK загружается как artifact

### Ручной запуск

Можно запустить сборку вручную:

1. Откройте **Actions** на GitHub
2. Выберите **Build Android APK**
3. Нажмите **Run workflow**
4. Выберите ветку
5. Нажмите **Run workflow**

### Скачивание APK

**Вариант 1: Через Artifacts**
1. Actions → Выбрать workflow
2. Artifacts → Скачать `android-debug-apk`

**Вариант 2: Через Releases (если создан тег)**
1. Создать тег: `git tag v1.0.0 && git push --tags`
2. APK автоматически прикрепится к Release

---

## 📱 Установка APK на Android

### Способ 1: Через USB

```bash
# Скачать APK из GitHub Artifacts
# Распаковать ZIP
# Установить через adb (если есть)
adb install app-debug.apk
```

### Способ 2: Прямая установка

1. Скачать APK на Android устройство
2. Открыть файл
3. Разрешить установку из неизвестных источников
4. Установить

### Способ 3: Через облако

1. Загрузить APK в Google Drive / Dropbox
2. Открыть на Android устройстве
3. Установить

---

## ⚙️ Настройка workflow

### Изменить триггеры

Редактировать `.github/workflows/android-build.yml`:

```yaml
on:
  push:
    branches: [ main ]  # Только main ветка
  # или
  schedule:
    - cron: '0 0 * * 0'  # Каждое воскресенье
```

### Добавить подпись Release APK

Для production нужен signing key:

1. Создать keystore:
```bash
keytool -genkey -v -keystore release.keystore -alias release -keyalg RSA -keysize 2048 -validity 10000
```

2. Добавить secrets в GitHub:
   - Settings → Secrets → New repository secret
   - `KEYSTORE_PASSWORD`
   - `KEY_ALIAS`
   - `KEY_PASSWORD`

3. Обновить workflow для использования secrets

---

## 🔍 Troubleshooting

### Сборка не запускается

- Проверьте что файл в `.github/workflows/`
- Проверьте синтаксис YAML
- Проверьте что Actions включены в настройках репозитория

### Сборка падает

- Откройте логи workflow
- Найдите ошибку
- Обычно проблемы с:
  - Версиями зависимостей
  - Правами доступа
  - Отсутствующими файлами

### APK не работает на устройстве

- Проверьте минимальную версию Android (API 24 = Android 7.0)
- Проверьте архитектуру (arm64-v8a, armeabi-v7a)
- Проверьте логи: `adb logcat`

---

## 💰 Лимиты GitHub Actions

### Бесплатный план:

- **Публичные репозитории:** Unlimited
- **Приватные репозитории:** 2000 минут/месяц

### Одна сборка занимает:

- ~10-15 минут (первая сборка)
- ~5-8 минут (последующие, с кешем)

### Оптимизация:

Добавить кеширование в workflow:

```yaml
- name: Cache Cargo
  uses: actions/cache@v3
  with:
    path: |
      ~/.cargo/bin/
      ~/.cargo/registry/index/
      ~/.cargo/registry/cache/
      ~/.cargo/git/db/
      target/
    key: ${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}
```

---

## 📊 Статус сборки

Добавить badge в README.md:

```markdown
![Android Build](https://github.com/ВАШ_USERNAME/gemini-audio-player/workflows/Build%20Android%20APK/badge.svg)
```

---

## 🎓 Дополнительные возможности

### Автоматическое тестирование

Добавить шаг тестирования:

```yaml
- name: Run tests
  run: cargo test --manifest-path src-tauri/Cargo.toml
```

### Уведомления

Настроить уведомления в Slack/Discord при успешной сборке.

### Множественные варианты

Собирать разные варианты (debug, release, beta):

```yaml
strategy:
  matrix:
    build-type: [debug, release]
```

---

## ✅ Checklist

- [ ] Создан GitHub репозиторий
- [ ] Запушен код с workflow файлом
- [ ] Проверена вкладка Actions
- [ ] Дождались завершения сборки
- [ ] Скачали APK из Artifacts
- [ ] Установили на Android устройство
- [ ] Протестировали приложение

---

## 🆘 Нужна помощь?

1. Проверьте логи в Actions
2. Откройте Issue в репозитории
3. Проверьте документацию Tauri: https://tauri.app/

---

**Готово!** Теперь у вас автоматическая сборка Android APK без локальной установки Android SDK! 🎉
