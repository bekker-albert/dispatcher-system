package kz.shtabai.app;

import android.app.Application;
import android.content.Context;
import android.content.SharedPreferences;
import android.webkit.WebView;

/** Clears only cached interface files after an APK update; DOM storage with user data stays intact. */
public final class ShtabApplication extends Application {
    private static final String PREFS = "shtab_interface_runtime";
    private static final String KEY_ASSET_VERSION = "asset_version";

    @Override public void onCreate() {
        super.onCreate();
        SharedPreferences preferences = getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        int currentVersion = BuildConfig.VERSION_CODE;
        if (preferences.getInt(KEY_ASSET_VERSION, -1) == currentVersion) return;

        WebView cacheCleaner = null;
        try {
            cacheCleaner = new WebView(getApplicationContext());
            cacheCleaner.clearCache(true);
            preferences.edit().putInt(KEY_ASSET_VERSION, currentVersion).apply();
        } catch (RuntimeException ignored) {
            // Keep the old marker so the app retries on the next start.
        } finally {
            if (cacheCleaner != null) cacheCleaner.destroy();
        }
    }
}
