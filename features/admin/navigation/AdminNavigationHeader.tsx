import { Plus } from "lucide-react";
import { IconButton } from "@/shared/ui/buttons";
import { Field } from "@/shared/ui/layout";
import { addFormStyle, headerStyle, inputStyle, mutedTextStyle, titleStyle } from "./adminNavigationStyles";

type AdminNavigationHeaderProps = {
  newTabTitle: string;
  setNewTabTitle: (title: string) => void;
  addTab: () => void;
};

export function AdminNavigationHeader({ newTabTitle, setNewTabTitle, addTab }: AdminNavigationHeaderProps) {
  return (
    <div style={headerStyle}>
      <div>
        <div style={titleStyle}>Вкладки</div>
        <div style={mutedTextStyle}>Название меняется без потери данных. Системные вкладки удаляются как скрытие, чтобы их можно было вернуть.</div>
      </div>
      <div style={addFormStyle}>
        <Field label="Новая вкладка">
          <input
            value={newTabTitle}
            onChange={(event) => setNewTabTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") addTab();
              if (event.key === "Escape") setNewTabTitle("");
            }}
            placeholder="Название"
            style={inputStyle}
          />
        </Field>
        <IconButton label="Добавить вкладку" onClick={addTab} disabled={!newTabTitle.trim()}>
          <Plus size={16} aria-hidden />
        </IconButton>
      </div>
    </div>
  );
}
