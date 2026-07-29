package kz.shtabai.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.os.Bundle;

public class QuickCreateActivity extends Activity {
    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        String[] actions = new String[]{"✓  Задача", "✎  Заметка"};
        AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle("Быстро создать")
                .setItems(actions, (ignored, which) -> openEditor(which == 0 ? "task" : "note"))
                .setNegativeButton("Отмена", (ignored, which) -> finish())
                .setOnCancelListener(ignored -> finish())
                .create();
        dialog.setOnDismissListener(ignored -> { if (!isFinishing()) finish(); });
        dialog.show();
    }

    private void openEditor(String type) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.putExtra("quick_create", type);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        startActivity(intent);
        finish();
    }
}
