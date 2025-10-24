package com.gemini.audioplayer

import android.os.Bundle
import android.content.Intent
import android.net.Uri
import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : TauriActivity() {
    
    companion object {
        private const val PERMISSION_REQUEST_CODE = 100
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Request necessary permissions
        requestPermissions()
        
        // Handle intent if app was opened with audio file
        handleIntent(intent)
    }
    
    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        intent?.let { handleIntent(it) }
    }
    
    private fun requestPermissions() {
        val permissions = mutableListOf<String>()
        
        // Storage permissions based on Android version
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            // Android 13+
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_AUDIO)
                != PackageManager.PERMISSION_GRANTED) {
                permissions.add(Manifest.permission.READ_MEDIA_AUDIO)
            }
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
                permissions.add(Manifest.permission.POST_NOTIFICATIONS)
            }
        } else {
            // Android 12 and below
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE)
                != PackageManager.PERMISSION_GRANTED) {
                permissions.add(Manifest.permission.READ_EXTERNAL_STORAGE)
            }
        }
        
        if (permissions.isNotEmpty()) {
            ActivityCompat.requestPermissions(
                this,
                permissions.toTypedArray(),
                PERMISSION_REQUEST_CODE
            )
        }
    }
    
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        
        when (requestCode) {
            PERMISSION_REQUEST_CODE -> {
                if (grantResults.isNotEmpty() && 
                    grantResults.all { it == PackageManager.PERMISSION_GRANTED }) {
                    // All permissions granted
                    onPermissionsGranted()
                } else {
                    // Some permissions denied
                    onPermissionsDenied()
                }
            }
        }
    }
    
    private fun onPermissionsGranted() {
        // Notify WebView that permissions are granted
        evaluateJavascript("window.__TAURI__?.event?.emit('permissions-granted')", null)
    }
    
    private fun onPermissionsDenied() {
        // Notify WebView that permissions were denied
        evaluateJavascript("window.__TAURI__?.event?.emit('permissions-denied')", null)
    }
    
    private fun handleIntent(intent: Intent) {
        when (intent.action) {
            Intent.ACTION_VIEW -> {
                // App was opened with an audio file
                intent.data?.let { uri ->
                    handleAudioFile(uri)
                }
            }
        }
    }
    
    private fun handleAudioFile(uri: Uri) {
        // Send file URI to WebView
        val uriString = uri.toString()
        evaluateJavascript(
            "window.__TAURI__?.event?.emit('open-audio-file', '$uriString')",
            null
        )
    }
    
    override fun onBackPressed() {
        // Move app to background instead of closing
        moveTaskToBack(true)
    }
}
