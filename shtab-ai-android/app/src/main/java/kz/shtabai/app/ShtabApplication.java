package kz.shtabai.app;

import android.app.Application;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.webkit.WebView;

/** Clears only cached interface files after an APK update; DOM storage with user data stays intact. */
public final class ShtabApplication extends Application {
    private static final String PREFS = "shtab_interface_runtime";
    private static final String KEY_ASSET_VERSION = "asset_version";

    @Override public void onCreate() {
        super.onCreate();
        SharedPreferences preferences = getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        long currentVersion = installedVersionCode();
        if (currentVersion >= 0 && preferences.getLong(KEY_ASSET_VERSION, -1L) == currentVersion) return;

        WebView cacheCleaner = null;
        try {
            cacheCleaner = new WebView(getApplicationContext());
            cacheCleaner.clearCache(true);
            if (currentVersion >= 0) preferences.edit().putLong(KEY_ASSET_VERSION, currentVersion).apply();
        } catch (RuntimeException ignored) {
            // Keep the old marker so the app retries on the next start.
        } finally {
            if (cacheCleaner != null) cacheCleaner.destroy();
        }
    }

    private long installedVersionCode() {
        try {
            PackageInfo info = getPackageManager().getPackageInfo(getPackageName(), 0);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) return info.getLongVersionCode();
            return info.versionCode;
        } catch (PackageManager.NameNotFoundException ignored) {
            return -1L;
        }
    }
}
