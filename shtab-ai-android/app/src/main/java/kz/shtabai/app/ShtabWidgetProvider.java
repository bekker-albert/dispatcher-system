package kz.shtabai.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.widget.RemoteViews;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class ShtabWidgetProvider extends AppWidgetProvider {
    public static final String PREFS = "shtab_widget";

    @Override public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) updateWidget(context, manager, appWidgetId);
    }

    @Override public void onEnabled(Context context) {
        updateAll(context);
    }

    public static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName component = new ComponentName(context, ShtabWidgetProvider.class);
        int[] ids = manager.getAppWidgetIds(component);
        for (int id : ids) updateWidget(context, manager, id);
    }

    private static PendingIntent activityIntent(Context context, int requestCode, String page, String focus) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.setAction("kz.shtabai.app.WIDGET." + page + "." + focus + "." + requestCode);
        intent.putExtra("widget_page", page);
        if (focus != null && !focus.isEmpty()) intent.putExtra("analytics_focus", focus);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getActivity(context, requestCode, intent, flags);
    }

    private static PendingIntent quickCreateIntent(Context context) {
        Intent intent = new Intent(context, QuickCreateActivity.class);
        intent.setAction("kz.shtabai.app.WIDGET.QUICK_CREATE");
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getActivity(context, 440, intent, flags);
    }

    private static void updateWidget(Context context, AppWidgetManager manager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.shtab_widget_4x2);

        views.setTextViewText(R.id.widget_date, new SimpleDateFormat("d MMM, EEE", new Locale("ru", "RU")).format(new Date()));
        views.setTextViewText(R.id.widget_tasks_count, String.valueOf(prefs.getInt("tasks", 0)));
        views.setTextViewText(R.id.widget_trips_count, String.valueOf(prefs.getInt("trips", 0)));
        views.setTextViewText(R.id.widget_events_count, String.valueOf(prefs.getInt("events", 0)));
        views.setTextViewText(R.id.widget_important_count, String.valueOf(prefs.getInt("important", 0)));
        views.setTextViewText(R.id.widget_tasks_meta, prefs.getString("taskMeta", "0 важные"));
        views.setTextViewText(R.id.widget_trips_meta, prefs.getString("tripMeta", "нет"));
        views.setTextViewText(R.id.widget_events_meta, prefs.getString("eventMeta", "нет"));
        views.setTextViewText(R.id.widget_important_meta, prefs.getString("importantMeta", "спокойно"));

        views.setOnClickPendingIntent(R.id.widget_root, activityIntent(context, 401, "today", ""));
        views.setOnClickPendingIntent(R.id.widget_title, activityIntent(context, 402, "today", ""));
        views.setOnClickPendingIntent(R.id.widget_tasks, activityIntent(context, 403, "analytics", "tasks"));
        views.setOnClickPendingIntent(R.id.widget_trips, activityIntent(context, 404, "analytics", "trips"));
        views.setOnClickPendingIntent(R.id.widget_events, activityIntent(context, 405, "analytics", "events"));
        views.setOnClickPendingIntent(R.id.widget_important, activityIntent(context, 406, "today", ""));
        views.setOnClickPendingIntent(R.id.widget_add, quickCreateIntent(context));

        manager.updateAppWidget(appWidgetId, views);
    }
}
