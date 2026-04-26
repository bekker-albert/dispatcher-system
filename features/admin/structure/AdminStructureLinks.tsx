import { Fragment, type CSSProperties } from "react";
import { Check, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";

import { IconButton } from "@/shared/ui/buttons";
import { CompactTd, CompactTh, Field } from "@/shared/ui/layout";
import {
  dependencyNodeLabel,
  type DependencyLink,
  type DependencyLinkType,
  type DependencyNode,
} from "@/lib/domain/admin/structure";

type AdminStructureLinksProps = {
  dependencyNodes: DependencyNode[];
  dependencyLinks: DependencyLink[];
  dependencyLinkForm: DependencyLink;
  editingDependencyLinkId: string | null;
  onEditDependencyLink: (id: string | null) => void;
  onUpdateDependencyLink: (id: string, field: keyof DependencyLink, value: string | boolean) => void;
  onUpdateDependencyLinkForm: (field: keyof DependencyLink, value: string | boolean) => void;
  onAddDependencyLink: () => void;
  onDeleteDependencyLink: (id: string) => void;
};

export function AdminStructureLinks({
  dependencyNodes,
  dependencyLinks,
  dependencyLinkForm,
  editingDependencyLinkId,
  onEditDependencyLink,
  onUpdateDependencyLink,
  onUpdateDependencyLinkForm,
  onAddDependencyLink,
  onDeleteDependencyLink,
}: AdminStructureLinksProps) {
  return (
    <div style={sectionStyle}>
      <div style={{ fontWeight: 700, marginBottom: 12 }}>Связи зависимостей</div>
      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
              <CompactTh>Откуда</CompactTh>
              <CompactTh>Тип связи</CompactTh>
              <CompactTh>Куда</CompactTh>
              <CompactTh>Правило / что передает</CompactTh>
              <CompactTh>Ответственный</CompactTh>
              <CompactTh>Показ</CompactTh>
              <CompactTh>Действия</CompactTh>
            </tr>
          </thead>
          <tbody>
            {dependencyLinks.map((link) => {
              const isEditing = editingDependencyLinkId === link.id;

              return (
                <Fragment key={link.id}>
                  <tr>
                    <CompactTd>{dependencyNodeLabel(dependencyNodes, link.fromNodeId)}</CompactTd>
                    <CompactTd>{link.linkType}</CompactTd>
                    <CompactTd>{dependencyNodeLabel(dependencyNodes, link.toNodeId)}</CompactTd>
                    <CompactTd>{link.rule || "—"}</CompactTd>
                    <CompactTd>{link.owner || "—"}</CompactTd>
                    <CompactTd>{link.visible ? "Показывается" : "Скрыта"}</CompactTd>
                    <CompactTd>
                      <div style={{ display: "flex", gap: 6 }}>
                        <IconButton
                          label={isEditing ? "Завершить редактирование" : "Редактировать связь"}
                          onClick={() => onEditDependencyLink(isEditing ? null : link.id)}
                        >
                          {isEditing ? <Check size={16} aria-hidden /> : <Pencil size={16} aria-hidden />}
                        </IconButton>
                        <IconButton
                          label={link.visible ? "Скрыть связь" : "Вернуть связь"}
                          onClick={() => onUpdateDependencyLink(link.id, "visible", !link.visible)}
                        >
                          {link.visible ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
                        </IconButton>
                        <IconButton label="Удалить связь" onClick={() => onDeleteDependencyLink(link.id)}>
                          <Trash2 size={16} aria-hidden />
                        </IconButton>
                      </div>
                    </CompactTd>
                  </tr>
                  {isEditing && (
                    <tr>
                      <td colSpan={7} style={detailCellStyle}>
                        <div style={inlineEditStyle}>
                          <Field label="Откуда">
                            <select
                              value={link.fromNodeId}
                              onChange={(event) => onUpdateDependencyLink(link.id, "fromNodeId", event.target.value)}
                              style={inputStyle}
                            >
                              {dependencyNodes.map((node) => (
                                <option key={node.id} value={node.id}>
                                  {node.name}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <Field label="Тип связи">
                            <select
                              value={link.linkType}
                              onChange={(event) =>
                                onUpdateDependencyLink(link.id, "linkType", event.target.value as DependencyLinkType)
                              }
                              style={inputStyle}
                            >
                              <option value="Линейная">Линейная</option>
                              <option value="Функциональная">Функциональная</option>
                            </select>
                          </Field>
                          <Field label="Куда">
                            <select
                              value={link.toNodeId}
                              onChange={(event) => onUpdateDependencyLink(link.id, "toNodeId", event.target.value)}
                              style={inputStyle}
                            >
                              {dependencyNodes.map((node) => (
                                <option key={node.id} value={node.id}>
                                  {node.name}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <Field label="Правило / что передает">
                            <input
                              value={link.rule}
                              onChange={(event) => onUpdateDependencyLink(link.id, "rule", event.target.value)}
                              placeholder="Например: рейсы × объем кузова"
                              style={inputStyle}
                            />
                          </Field>
                          <Field label="Ответственный">
                            <input
                              value={link.owner}
                              onChange={(event) => onUpdateDependencyLink(link.id, "owner", event.target.value)}
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
        <Field label="Откуда">
          <select
            value={dependencyLinkForm.fromNodeId}
            onChange={(event) => onUpdateDependencyLinkForm("fromNodeId", event.target.value)}
            style={inputStyle}
          >
            {dependencyNodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Тип связи">
          <select
            value={dependencyLinkForm.linkType}
            onChange={(event) =>
              onUpdateDependencyLinkForm("linkType", event.target.value as DependencyLinkType)
            }
            style={inputStyle}
          >
            <option value="Линейная">Линейная</option>
            <option value="Функциональная">Функциональная</option>
          </select>
        </Field>
        <Field label="Куда">
          <select
            value={dependencyLinkForm.toNodeId}
            onChange={(event) => onUpdateDependencyLinkForm("toNodeId", event.target.value)}
            style={inputStyle}
          >
            {dependencyNodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Правило">
          <input
            value={dependencyLinkForm.rule}
            onChange={(event) => onUpdateDependencyLinkForm("rule", event.target.value)}
            placeholder="Что передает / как считается"
            style={inputStyle}
          />
        </Field>
        <Field label="Ответственный">
          <input
            value={dependencyLinkForm.owner}
            onChange={(event) => onUpdateDependencyLinkForm("owner", event.target.value)}
            placeholder="Ответственный"
            style={inputStyle}
          />
        </Field>
        <IconButton label="Добавить связь" onClick={onAddDependencyLink}>
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
  minWidth: 1180,
  borderCollapse: "collapse",
  fontSize: 14,
};

const detailCellStyle: CSSProperties = {
  padding: 10,
  background: "#f8fafc",
  borderBottom: "1px solid #e2e8f0",
};

const inlineEditStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 10,
  alignItems: "end",
};

const addFormStyle: CSSProperties = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr)) auto",
  gap: 10,
  alignItems: "end",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  outline: "none",
  fontSize: 14,
  background: "#ffffff",
};
