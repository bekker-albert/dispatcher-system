import { Fragment, type CSSProperties } from "react";
import { Plus } from "lucide-react";

import { IconButton } from "@/shared/ui/buttons";
import { CompactTd, CompactTh, Field } from "@/shared/ui/layout";
import type { DependencyNode } from "@/lib/domain/admin/structure";

import { AdminStructureRowActions } from "./AdminStructureRowActions";
import { addFormStyle, detailCellStyle, inlineEditStyle, inputStyle } from "./AdminStructureSharedStyles";

type AdminStructureElementsProps = {
  dependencyNodes: DependencyNode[];
  dependencyNodeForm: DependencyNode;
  editingDependencyNodeId: string | null;
  onEditDependencyNode: (id: string | null) => void;
  onUpdateDependencyNode: (id: string, field: keyof DependencyNode, value: string | boolean) => void;
  onUpdateDependencyNodeForm: (field: keyof DependencyNode, value: string | boolean) => void;
  onAddDependencyNode: () => void;
  onDeleteDependencyNode: (id: string) => void;
};

export function AdminStructureElements({
  dependencyNodes,
  dependencyNodeForm,
  editingDependencyNodeId,
  onEditDependencyNode,
  onUpdateDependencyNode,
  onUpdateDependencyNodeForm,
  onAddDependencyNode,
  onDeleteDependencyNode,
}: AdminStructureElementsProps) {
  return (
    <div style={sectionStyle}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>Связка данных и процессов</div>
      <div style={{ color: "#64748b", marginBottom: 12 }}>
        Здесь задается, откуда берутся данные и куда они дальше уходят: техника, участки, объемы, ПТО,
        оперучет, маркзамеры и отчетность.
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
              <CompactTh>Элемент</CompactTh>
              <CompactTh>Тип</CompactTh>
              <CompactTh>Ответственный</CompactTh>
              <CompactTh>Показ</CompactTh>
              <CompactTh>Действия</CompactTh>
            </tr>
          </thead>
          <tbody>
            {dependencyNodes.map((node) => {
              const isEditing = editingDependencyNodeId === node.id;

              return (
                <Fragment key={node.id}>
                  <tr>
                    <CompactTd>
                      <div style={primaryTextStyle}>{node.name || "Без названия"}</div>
                    </CompactTd>
                    <CompactTd>{node.kind || "-"}</CompactTd>
                    <CompactTd>{node.owner || "-"}</CompactTd>
                    <CompactTd>{node.visible ? "Показывается" : "Скрыт"}</CompactTd>
                    <CompactTd>
                      <AdminStructureRowActions
                        deleteLabel="Удалить элемент"
                        editLabel="Редактировать элемент"
                        finishEditLabel="Завершить редактирование"
                        hiddenIconLabel="Вернуть элемент"
                        isEditing={isEditing}
                        visible={node.visible}
                        visibleIconLabel="Скрыть элемент"
                        onDelete={() => onDeleteDependencyNode(node.id)}
                        onToggleEdit={() => onEditDependencyNode(isEditing ? null : node.id)}
                        onToggleVisible={() => onUpdateDependencyNode(node.id, "visible", !node.visible)}
                      />
                    </CompactTd>
                  </tr>
                  {isEditing && (
                    <tr>
                      <td colSpan={5} style={detailCellStyle}>
                        <div style={inlineEditStyle}>
                          <Field label="Название элемента">
                            <input
                              value={node.name}
                              onChange={(event) => onUpdateDependencyNode(node.id, "name", event.target.value)}
                              placeholder="Например: Объемы"
                              style={inputStyle}
                            />
                          </Field>
                          <Field label="Тип элемента">
                            <input
                              value={node.kind}
                              onChange={(event) => onUpdateDependencyNode(node.id, "kind", event.target.value)}
                              placeholder="Справочник, расчет, факт"
                              style={inputStyle}
                            />
                          </Field>
                          <Field label="Ответственный">
                            <input
                              value={node.owner}
                              onChange={(event) => onUpdateDependencyNode(node.id, "owner", event.target.value)}
                              placeholder="Например: ПТО"
                              style={inputStyle}
                            />
                          </Field>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={addFormStyle}>
        <Field label="Новый элемент">
          <input
            value={dependencyNodeForm.name}
            onChange={(event) => onUpdateDependencyNodeForm("name", event.target.value)}
            placeholder="Например: Взвешивание"
            style={inputStyle}
          />
        </Field>
        <Field label="Тип">
          <input
            value={dependencyNodeForm.kind}
            onChange={(event) => onUpdateDependencyNodeForm("kind", event.target.value)}
            placeholder="Справочник / расчет / факт"
            style={inputStyle}
          />
        </Field>
        <Field label="Ответственный">
          <input
            value={dependencyNodeForm.owner}
            onChange={(event) => onUpdateDependencyNodeForm("owner", event.target.value)}
            placeholder="Ответственный"
            style={inputStyle}
          />
        </Field>
        <IconButton label="Добавить элемент" onClick={onAddDependencyNode}>
          <Plus size={16} aria-hidden />
        </IconButton>
      </div>
    </div>
  );
}

const sectionStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: 12,
  background: "#ffffff",
  marginBottom: 16,
};

const tableStyle: CSSProperties = {
  width: "100%",
  minWidth: 960,
  borderCollapse: "collapse",
  fontSize: 14,
};

const primaryTextStyle: CSSProperties = {
  fontWeight: 700,
  color: "#0f172a",
};
