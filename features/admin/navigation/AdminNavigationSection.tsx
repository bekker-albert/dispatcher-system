"use client";

import { Check, Eye, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { CustomTab, TopTabDefinition } from "@/lib/domain/navigation/tabs";
import { IconButton } from "@/shared/ui/buttons";
import { Field } from "@/shared/ui/layout";

type AdminNavigationSectionProps = {
  topTabs: TopTabDefinition[];
  customTabs: CustomTab[];
  onAddCustomTab: (title: string) => void;
  onUpdateTopTabLabel: (id: TopTabDefinition["id"], label: string) => void;
  onUpdateCustomTabTitle: (id: string, title: string) => void;
  onDeleteTopTab: (id: TopTabDefinition["id"]) => void;
  onShowTopTab: (id: TopTabDefinition["id"]) => void;
  onDeleteCustomTab: (id: string) => void;
  onShowCustomTab: (id: string) => void;
};

type EditingTab =
  | { type: "top"; id: TopTabDefinition["id"] }
  | { type: "custom"; id: string };

function editingKey(editing: EditingTab | null) {
  return editing ? `${editing.type}:${editing.id}` : "";
}

export default function AdminNavigationSection({
  topTabs,
  customTabs,
  onAddCustomTab,
  onUpdateTopTabLabel,
  onUpdateCustomTabTitle,
  onDeleteTopTab,
  onShowTopTab,
  onDeleteCustomTab,
  onShowCustomTab,
}: AdminNavigationSectionProps) {
  const [editing, setEditing] = useState<EditingTab | null>(null);
  const [draftLabel, setDraftLabel] = useState("");
  const [newTabTitle, setNewTabTitle] = useState("");

  function startEditing(nextEditing: EditingTab, label: string) {
    setEditing(nextEditing);
    setDraftLabel(label);
  }

  function cancelEditing() {
    setEditing(null);
    setDraftLabel("");
  }

  function commitEditing() {
    if (!editing) return;

    const label = draftLabel.trim();
    if (!label) return;

    if (editing.type === "top") {
      onUpdateTopTabLabel(editing.id, label);
    } else {
      onUpdateCustomTabTitle(editing.id, label);
    }

    cancelEditing();
  }

  function addTab() {
    const title = newTabTitle.trim();
    if (!title) return;

    onAddCustomTab(title);
    setNewTabTitle("");
  }

  return (
    <div style={sectionStyle}>
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

      <div style={tableWrapStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={headRowStyle}>
              <th style={thStyle}>Название</th>
              <th style={thStyle}>Тип</th>
              <th style={thStyle}>Статус</th>
              <th style={actionThStyle} />
            </tr>
          </thead>
          <tbody>
            {topTabs.map((tab) => {
              const key = `top:${tab.id}`;
              const isEditing = editingKey(editing) === key;

              return (
                <tr key={key}>
                  <td style={tdStyle}>
                    {isEditing ? (
                      <input
                        autoFocus
                        value={draftLabel}
                        onChange={(event) => setDraftLabel(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") commitEditing();
                          if (event.key === "Escape") cancelEditing();
                        }}
                        style={inlineInputStyle}
                      />
                    ) : (
                      <span style={nameStyle}>{tab.label}</span>
                    )}
                  </td>
                  <td style={tdStyle}>Системная</td>
                  <td style={tdStyle}>{tab.visible ? "Показывается" : "Скрыта"}</td>
                  <td style={actionsTdStyle}>
                    {isEditing ? (
                      <>
                        <IconButton label="Сохранить название" onClick={commitEditing}>
                          <Check size={16} aria-hidden />
                        </IconButton>
                        <IconButton label="Отменить" onClick={cancelEditing}>
                          <X size={16} aria-hidden />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton label="Редактировать название" onClick={() => startEditing({ type: "top", id: tab.id }, tab.label)}>
                          <Pencil size={16} aria-hidden />
                        </IconButton>
                        {tab.visible ? (
                          <IconButton label={tab.locked ? "Эту вкладку нельзя удалить" : "Удалить вкладку"} onClick={() => onDeleteTopTab(tab.id)} disabled={tab.locked}>
                            {tab.locked ? <Eye size={16} aria-hidden /> : <Trash2 size={16} aria-hidden />}
                          </IconButton>
                        ) : (
                          <IconButton label="Вернуть вкладку" onClick={() => onShowTopTab(tab.id)}>
                            <Eye size={16} aria-hidden />
                          </IconButton>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              );
            })}

            {customTabs.map((tab) => {
              const key = `custom:${tab.id}`;
              const isEditing = editingKey(editing) === key;

              return (
                <tr key={key}>
                  <td style={tdStyle}>
                    {isEditing ? (
                      <input
                        autoFocus
                        value={draftLabel}
                        onChange={(event) => setDraftLabel(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") commitEditing();
                          if (event.key === "Escape") cancelEditing();
                        }}
                        style={inlineInputStyle}
                      />
                    ) : (
                      <span style={nameStyle}>{tab.title}</span>
                    )}
                  </td>
                  <td style={tdStyle}>Добавленная</td>
                  <td style={tdStyle}>{tab.visible === false ? "Скрыта" : "Показывается"}</td>
                  <td style={actionsTdStyle}>
                    {isEditing ? (
                      <>
                        <IconButton label="Сохранить название" onClick={commitEditing}>
                          <Check size={16} aria-hidden />
                        </IconButton>
                        <IconButton label="Отменить" onClick={cancelEditing}>
                          <X size={16} aria-hidden />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton label="Редактировать название" onClick={() => startEditing({ type: "custom", id: tab.id }, tab.title)}>
                          <Pencil size={16} aria-hidden />
                        </IconButton>
                        {tab.visible === false ? (
                          <IconButton label="Вернуть вкладку" onClick={() => onShowCustomTab(tab.id)}>
                            <Eye size={16} aria-hidden />
                          </IconButton>
                        ) : (
                          <IconButton label="Удалить вкладку" onClick={() => onDeleteCustomTab(tab.id)}>
                            <Trash2 size={16} aria-hidden />
                          </IconButton>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#e2e8f0",
  borderRadius: 8,
  background: "#f8fafc",
  padding: 14,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "end",
  flexWrap: "wrap",
  marginBottom: 12,
};

const titleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
};

const mutedTextStyle: React.CSSProperties = {
  color: "#64748b",
  fontSize: 13,
  marginTop: 4,
};

const addFormStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(180px, 260px) 34px",
  gap: 8,
  alignItems: "end",
};

const tableWrapStyle: React.CSSProperties = {
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#e2e8f0",
  borderRadius: 8,
  background: "#ffffff",
  overflowX: "auto",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 720,
  borderCollapse: "collapse",
  fontSize: 13,
};

const headRowStyle: React.CSSProperties = {
  background: "#f1f5f9",
  textAlign: "left",
};

const thStyle: React.CSSProperties = {
  borderBottomWidth: 1,
  borderBottomStyle: "solid",
  borderBottomColor: "#cbd5e1",
  padding: "8px 10px",
  whiteSpace: "normal",
};

const actionThStyle: React.CSSProperties = {
  ...thStyle,
  width: 116,
};

const tdStyle: React.CSSProperties = {
  borderBottomWidth: 1,
  borderBottomStyle: "solid",
  borderBottomColor: "#e2e8f0",
  padding: "8px 10px",
  verticalAlign: "middle",
};

const actionsTdStyle: React.CSSProperties = {
  ...tdStyle,
  display: "flex",
  justifyContent: "flex-end",
  gap: 6,
};

const nameStyle: React.CSSProperties = {
  fontWeight: 700,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  color: "#0f172a",
  fontFamily: "inherit",
  fontSize: 13,
  outline: "none",
  padding: "8px 10px",
};

const inlineInputStyle: React.CSSProperties = {
  ...inputStyle,
  padding: "7px 9px",
};
