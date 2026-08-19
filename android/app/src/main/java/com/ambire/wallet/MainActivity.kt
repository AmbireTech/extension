package com.ambire.wallet
import expo.modules.splashscreen.SplashScreenManager

import android.os.Build
import android.os.Bundle
import android.util.Log
import android.webkit.WebView

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    // setTheme(R.style.AppTheme);
    // @generated begin expo-splashscreen - expo prebuild (DO NOT MODIFY) sync-f3ff59a738c56c9a6119210cb55f0b613eb8b6af
    SplashScreenManager.registerOnActivity(this)
    // @generated end expo-splashscreen
    super.onCreate(null)

    // Posted on the decor view so it lands after the splash frame is drawn instead of
    // competing with it.
    window.decorView.post { warmUpWebViewProvider() }
  }

  /**
   * Loads the system WebView provider so the worker's WebView does not have to.
   *
   * The wallet's controllers all run inside a WebView that the JS side mounts on its first
   * render, and the first WebView created in a process pays for loading the provider - the
   * system WebView APK plus its native init. Creating and discarding a throwaway one here
   * moves that cost to a point where it overlaps the JS bundle eval, and the provider then
   * stays loaded for the life of the process.
   */
  private fun warmUpWebViewProvider() {
    if (hasWarmedUpWebViewProvider) return
    // Set before the attempt, so a provider that blows up does it once and not on every
    // activity recreation.
    hasWarmedUpWebViewProvider = true

    try {
      WebView(this).destroy()
    } catch (e: Throwable) {
      // Prevent crashing the app if this fails
      Log.w(TAG, "WebView provider warm-up failed", e)
    }
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              // For non-root activities, use the default implementation to finish them.
              super.invokeDefaultOnBackPressed()
          }
          return
      }

      // Use the default back button implementation on Android S
      // because it's doing more than [Activity.moveTaskToBack] in fact.
      super.invokeDefaultOnBackPressed()
  }

  private companion object {
    const val TAG = "Ambire"

    // The provider is loaded per process, so warming it again on every activity recreation
    // (rotation, dark mode, font size) would build a WebView for nothing. Only ever touched
    // on the main thread.
    var hasWarmedUpWebViewProvider = false
  }
}
