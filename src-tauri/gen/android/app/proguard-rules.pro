# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.

# Keep Tauri classes
-keep class app.tauri.** { *; }
-keep class com.gemini.audioplayer.** { *; }

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep WebView JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep media session classes
-keep class androidx.media.** { *; }
-keep interface androidx.media.** { *; }

# Keep notification classes
-keep class androidx.core.app.NotificationCompat** { *; }

# Preserve line numbers for debugging
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
