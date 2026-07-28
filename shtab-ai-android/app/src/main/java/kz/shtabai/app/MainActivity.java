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
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class MainActivity extends Activity implements TextToSpeech.OnInitListener {
    public static final String CHANNEL_NORMAL = "shtab_ai_normal";
    public static final String CHANNEL_IMPORTANT = "shtab_ai_important";
    public static final String CHANNEL_FINANCE = "shtab_ai_finance";
    public static final String CHANNEL_HEALTH = "shtab_ai_health";
    private static final int REQ_NOTIFICATIONS = 1001;
    private static final int REQ_AUDIO = 1002;
    private static final int REQ_SPEECH = 1003;
    private static final int REQ_INITIAL = 1004;
    private WebView webView;
    private TextToSpeech tts;

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(11,13,19));
        getWindow().setNavigationBarColor(Color.rgb(11,13,19));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) getWindow().getDecorView().setSystemUiVisibility(0);
        createChannels();
        tts = new TextToSpeech(this, this);
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(11,13,19));
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
            @Override public void onPageFinished(WebView view, String url) {
                view.evaluateJavascript("if(window.syncAllNotifications){window.syncAllNotifications();}", null);
            }
        });
        setContentView(webView);
        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override public void onInit(int status) {
        if (status == TextToSpeech.SUCCESS) {
            tts.setLanguage(new Locale("ru", "RU"));
            tts.setSpeechRate(1.0f);
        }
    }
    @Override protected void onDestroy() {
        if (tts != null) { tts.stop(); tts.shutdown(); }
        if (webView != null) webView.destroy();
        super.onDestroy();
    }
    @Override public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    private void createChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager == null) return;
        NotificationChannel normal = new NotificationChannel(CHANNEL_NORMAL, "Обычные напоминания", NotificationManager.IMPORTANCE_DEFAULT);
        normal.setDescription("Задачи, планы и обзоры");
        NotificationChannel important = new NotificationChannel(CHANNEL_IMPORTANT, "Важные напоминания", NotificationManager.IMPORTANCE_HIGH);
        important.setDescription("Срочные задачи и повторные сигналы");
        important.enableVibration(true);
        NotificationChannel finance = new NotificationChannel(CHANNEL_FINANCE, "Финансы", NotificationManager.IMPORTANCE_HIGH);
        finance.setDescription("Платежи, доходы и бюджеты");
        NotificationChannel health = new NotificationChannel(CHANNEL_HEALTH, "Спорт и привычки", NotificationManager.IMPORTANCE_DEFAULT);
        health.setDescription("Тренировки, привычки и здоровье");
        manager.createNotificationChannel(normal);
        manager.createNotificationChannel(important);
        manager.createNotificationChannel(finance);
        manager.createNotificationChannel(health);
    }

    private void requestInitialPermissions() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            requestExactAlarmPermissionIfNeeded();
            return;
        }
        List<String> missing = new ArrayList<>();
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            missing.add(Manifest.permission.RECORD_AUDIO);
        }
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            missing.add(Manifest.permission.POST_NOTIFICATIONS);
        }
        if (missing.isEmpty()) requestExactAlarmPermissionIfNeeded();
        else requestPermissions(missing.toArray(new String[0]), REQ_INITIAL);
    }

    private void requestExactAlarmPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return;
        AlarmManager alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null || alarmManager.canScheduleExactAlarms()) return;
        try {
            Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:" + getPackageName()));
            startActivity(intent);
        } catch (Exception ignored) {
            Toast.makeText(this, "Разрешите точные напоминания в настройках приложения", Toast.LENGTH_LONG).show();
        }
    }

    private String channelId(String key) {
        if ("important".equals(key)) return CHANNEL_IMPORTANT;
        if ("finance".equals(key)) return CHANNEL_FINANCE;
        if ("health".equals(key)) return CHANNEL_HEALTH;
        return CHANNEL_NORMAL;
    }
    private int code(String id) { return id == null ? 0 : (id.hashCode() & 0x7fffffff); }
    private PendingIntent pending(String id, String title, String body, String channel) {
        Intent intent = new Intent(this, ReminderReceiver.class);
        intent.setAction("kz.shtabai.app.REMIND." + id);
        intent.putExtra("id", id);
        intent.putExtra("title", title);
        intent.putExtra("body", body);
        intent.putExtra("channel", channelId(channel));
        intent.putExtra("requestCode", code(id));
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getBroadcast(this, code(id), intent, flags);
    }
    private void schedule(String id, String title, String body, long at, String channel) {
        if (at <= System.currentTimeMillis()) { cancel(id); return; }
        AlarmManager alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;
        PendingIntent pendingIntent = pending(id, title, body, channel);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && alarmManager.canScheduleExactAlarms()) {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pendingIntent);
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pendingIntent);
        } else alarmManager.set(AlarmManager.RTC_WAKEUP, at, pendingIntent);
    }
    private void cancel(String id) {
        AlarmManager alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;
        PendingIntent pendingIntent = pending(id, "", "", "normal");
        alarmManager.cancel(pendingIntent);
        pendingIntent.cancel();
    }

    private void startSpeech() {
        if (!SpeechRecognizer.isRecognitionAvailable(this)) { voiceError("Распознавание речи недоступно"); return; }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQ_AUDIO);
            return;
        }
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "ru-RU");
        intent.putExtra(RecognizerIntent.EXTRA_PROMPT, "Говорите");
        startActivityForResult(intent, REQ_SPEECH);
    }
    private void voiceError(String message) {
        if (webView != null) webView.post(() -> webView.evaluateJavascript("window.onVoiceError(" + quote(message) + ");", null));
    }
    private String quote(String value) {
        return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n") + "\"";
    }
    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_SPEECH) {
            if (resultCode == RESULT_OK && data != null) {
                ArrayList<String> results = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
                String text = results != null && !results.isEmpty() ? results.get(0) : "";
                webView.evaluateJavascript("window.onVoiceResult(" + quote(text) + ");", null);
            } else voiceError("Команда не распознана");
        }
    }
    @Override public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grants) {
        super.onRequestPermissionsResult(requestCode, permissions, grants);
        if (requestCode == REQ_AUDIO) {
            if (grants.length > 0 && grants[0] == PackageManager.PERMISSION_GRANTED) startSpeech();
            else voiceError("Нет доступа к микрофону");
        } else if (requestCode == REQ_INITIAL) {
            requestExactAlarmPermissionIfNeeded();
        }
    }

    public class AndroidBridge {
        @JavascriptInterface public void requestInitialPermissions() { runOnUiThread(MainActivity.this::requestInitialPermissions); }
        @JavascriptInterface public void requestNotifications() {
            runOnUiThread(() -> {
                createChannels();
                if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                    requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQ_NOTIFICATIONS);
                } else {
                    Intent intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, getPackageName());
                    startActivity(intent);
                }
            });
        }
        @JavascriptInterface public void requestExactAlarmPermission() { runOnUiThread(MainActivity.this::requestExactAlarmPermissionIfNeeded); }
        @JavascriptInterface public void scheduleNotification(String id, String title, String body, double epochMillis, String channel) { schedule(id, title, body, (long) epochMillis, channel); }
        @JavascriptInterface public void cancelNotification(String id) { cancel(id); }
        @JavascriptInterface public void startVoiceInput() { runOnUiThread(MainActivity.this::startSpeech); }
        @JavascriptInterface public void speak(String text) { runOnUiThread(() -> { if (tts != null) tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "shtab-ai"); }); }
        @JavascriptInterface public void showToast(String text) { runOnUiThread(() -> Toast.makeText(MainActivity.this, text, Toast.LENGTH_SHORT).show()); }
    }
}
