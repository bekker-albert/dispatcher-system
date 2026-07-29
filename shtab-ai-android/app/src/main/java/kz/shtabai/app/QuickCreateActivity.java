package kz.shtabai.app;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.view.Window;

public class QuickCreateActivity extends Activity {
    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Window window = getWindow();
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);
        window.setBackgroundDrawableResource(android.R.color.transparent);
        setContentView(R.layout.activity_quick_create);

        bind(R.id.quick_task, "task");
        bind(R.id.quick_trip, "trip");
        bind(R.id.quick_event, "event");
        bind(R.id.quick_note, "note");
        findViewById(R.id.quick_cancel).setOnClickListener(view -> finish());
    }

    private void bind(int viewId, String type) {
        View view = findViewById(viewId);
        view.setOnClickListener(ignored -> openEditor(type));
    }

    private void openEditor(String type) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.putExtra("widget_page", "quick_create");
        intent.putExtra("analytics_focus", type);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        startActivity(intent);
        finish();
    }
}