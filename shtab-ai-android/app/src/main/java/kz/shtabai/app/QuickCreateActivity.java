package kz.shtabai.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.os.Bundle;

public class QuickCreateActivity extends Activity {
    private static final String[] LABELS = new String[]{
            "✓  Задача",
            "✈  Командировка",
            "◉  Событие",
            "✎  Заметка"
    };
    private static final String[] TYPES = new String[]{"task", "trip", "event", "note"};

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle("Быстро создать")
                .setItems(LABELS, (ignored, which) -> openEditor(TYPES[which]))
                .setNegativeButton("Отмена", (ignored, which) -> finish())
                .setOnCancelListener(ignored -> finish())
                .create();
        dialog.setOnDismissListener(ignored -> { if (!isFinishing()) finish(); });
        dialog.show();
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
