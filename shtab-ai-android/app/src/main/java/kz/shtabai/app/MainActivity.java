package kz.shtabai.app;

import android.Manifest;
import android.app.Activity;
import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

public class MainActivity extends Activity {
    public static final String CHANNEL_ID = "shtab_ai_reminders";
    private static final int NOTIFICATION_PERMISSION_REQUEST = 1001;
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().setStatusBarColor(Color.rgb(11, 12, 18));
        getWindow().setNavigationBarColor(Color.rgb(11, 12, 18));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            getWindow().getDecorView().setSystemUiVisibility(0);
        }

        createNotificationChannel();

        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(11, 12, 18));
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(false);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
            settings.setAllowFileAccessFromFileURLs(false);
            settings.setAllowUniversalAccessFromFileURLs(false);
        }
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(false);

        webView.addJavascriptInterface(new AndroidBridge(), "Android");
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                view.evaluateJavascript(
                    "if(window.syncAllNotifications){window.syncAllNotifications();}",
                    null
                );
            }
        });

        setContentView(webView);
        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Напоминания Штаб AI",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Напоминания по задачам и плану");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private int requestCodeFor(String id) {
        return id == null ? 0 : (id.hashCode() & 0x7fffffff);
    }

    private PendingIntent reminderPendingIntent(String id, String title) {
        Intent intent = new Intent(this, ReminderReceiver.class);
        intent.setAction("kz.shtabai.app.REMIND." + id);
        intent.putExtra("id", id);
        intent.putExtra("title", title);
        intent.putExtra("requestCode", requestCodeFor(id));
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        return PendingIntent.getBroadcast(
            this,
            requestCodeFor(id),
            intent,
            flags
        );
    }

    private void scheduleReminder(String id, String title, long triggerAtMillis) {
        if (triggerAtMillis <= System.currentTimeMillis()) {
            cancelReminder(id);
            return;
        }
        AlarmManager alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;

        PendingIntent pendingIntent = reminderPendingIntent(id, title);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                triggerAtMillis,
                pendingIntent
            );
        } else {
            alarmManager.set(
                AlarmManager.RTC_WAKEUP,
                triggerAtMillis,
                pendingIntent
            );
        }
    }

    private void cancelReminder(String id) {
        AlarmManager alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;
        PendingIntent pendingIntent = reminderPendingIntent(id, "");
        alarmManager.cancel(pendingIntent);
        pendingIntent.cancel();
    }

    public class AndroidBridge {
        @JavascriptInterface
        public void requestNotifications() {
            runOnUiThread(() -> {
                createNotificationChannel();
                if (Build.VERSION.SDK_INT >= 33
                    && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                    requestPermissions(
                        new String[]{Manifest.permission.POST_NOTIFICATIONS},
                        NOTIFICATION_PERMISSION_REQUEST
                    );
                } else {
                    Toast.makeText(
                        MainActivity.this,
                        "Напоминания включены",
                        Toast.LENGTH_SHORT
                    ).show();
                }
            });
        }

        @JavascriptInterface
        public void scheduleNotification(String id, String title, double epochMillis) {
            scheduleReminder(id, title, (long) epochMillis);
        }

        @JavascriptInterface
        public void cancelNotification(String id) {
            cancelReminder(id);
        }
    }
}
