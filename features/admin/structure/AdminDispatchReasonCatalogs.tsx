"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { Plus, Trash2 } from "lucide-react";

import { createDispatchReasonCatalogId, type DispatchReasonCatalogKind } from "@/lib/domain/dispatch/reason-catalog";
import { useDispatchReasonCatalogs } from "@/features/dispatch/useDispatchReasonCatalogs";

const catalogMeta: Record<DispatchReasonCatalogKind, { title: string; groupLabel: string; itemLabel: string; detailLabel: string }> = {
  downtime: {
    title: "Причины простоев",
    groupLabel: "1 уровень",
    itemLabel: "2 уровень",
    detailLabel: "3 уровень",
  },
  repair: {
    title: "Виды ремонтов",
    groupLabel: "1 уровень",
    itemLabel: "2 уровень",
    detailLabel: "3 уровень",
  },
};

export function AdminDispatchReasonCatalogs() {
  const { catalogs, setCatalogs, loading, saving, error, save } = useDispatchReasonCatalogs();
  const [newGroupName, setNewGroupName] = useState<Record<DispatchReasonCatalogKind, string>>({ downtime: "", repair: "" });
  const [newItemName, setNewItemName] = useState<Record<string, string>>({});
  const [newDetailName, setNewDetailName] = useState<Record<string, string>>({});

  const statusText = useMemo(() => {
    if (loading) return "Загрузка...";
    if (saving) return "Сохранение...";
    if (error) return error;
    return "Изменения сохраняются в общей базе.";
  }, [error, loading, saving]);

  const persist = async () => {
    await save(catalogs);
  };

  const updateGroupName = (kind: DispatchReasonCatalogKind, groupId: string, value: string) => {
    setCatalogs((current) => ({
      ...current,
      [kind]: current[kind].map((group) => group.id === groupId ? { ...group, name: value } : group),
    }));
  };

  const updateItemName = (kind: DispatchReasonCatalogKind, groupId: string, itemId: string, value: string) => {
    setCatalogs((current) => ({
      ...current,
      [kind]: current[kind].map((group) => group.id === groupId
        ? { ...group, items: group.items.map((item) => item.id === itemId ? { ...item, name: value } : item) }
        : group),
    }));
  };

  const updateDetailName = (
    kind: DispatchReasonCatalogKind,
    groupId: string,
    itemId: string,
    detailId: string,
    value: string,
  ) => {
    setCatalogs((current) => ({
      ...current,
      [kind]: current[kind].map((group) => group.id === groupId
        ? {
            ...group,
            items: group.items.map((item) => item.id === itemId
              ? { ...item, items: item.items.map((detail) => detail.id === detailId ? { ...detail, name: value } : detail) }
              : item),
          }
        : group),
    }));
  };

  const addGroup = async (kind: DispatchReasonCatalogKind) => {
    const name = newGroupName[kind].trim();
    if (!name) return;
    const next = {
      ...catalogs,
      [kind]: [...catalogs[kind], { id: createDispatchReasonCatalogId(kind), name, items: [] }],
    };
    setNewGroupName((current) => ({ ...current, [kind]: "" }));
    await save(next);
  };

  const deleteGroup = async (kind: DispatchReasonCatalogKind, groupId: string) => {
    const group = catalogs[kind].find((item) => item.id === groupId);
    if (!group) return;
    if (!window.confirm(`Удалить «${group.name}» и все значения второго и третьего уровней?`)) return;
    await save({ ...catalogs, [kind]: catalogs[kind].filter((item) => item.id !== groupId) });
  };

  const addItem = async (kind: DispatchReasonCatalogKind, groupId: string) => {
    const name = (newItemName[groupId] ?? "").trim();
    if (!name) return;
    const next = {
      ...catalogs,
      [kind]: catalogs[kind].map((group) => group.id === groupId
        ? { ...group, items: [...group.items, { id: createDispatchReasonCatalogId(`${kind}-item`), name, items: [] }] }
        : group),
    };
    setNewItemName((current) => ({ ...current, [groupId]: "" }));
    await save(next);
  };

  const deleteItem = async (kind: DispatchReasonCatalogKind, groupId: string, itemId: string) => {
    const next = {
      ...catalogs,
      [kind]: catalogs[kind].map((group) => group.id === groupId
        ? { ...group, items: group.items.filter((item) => item.id !== itemId) }
        : group),
    };
    await save(next);
  };

  const addDetail = async (kind: DispatchReasonCatalogKind, groupId: string, itemId: string) => {
    const name = (newDetailName[itemId] ?? "").trim();
    if (!name) return;
    const next = {
      ...catalogs,
      [kind]: catalogs[kind].map((group) => group.id === groupId
        ? {
            ...group,
            items: group.items.map((item) => item.id === itemId
              ? { ...item, items: [...item.items, { id: createDispatchReasonCatalogId(`${kind}-detail`), name }] }
              : item),
          }
        : group),
    };
    setNewDetailName((current) => ({ ...current, [itemId]: "" }));
    await save(next);
  };

  const deleteDetail = async (kind: DispatchReasonCatalogKind, groupId: string, itemId: string, detailId: string) => {
    const next = {
      ...catalogs,
      [kind]: catalogs[kind].map((group) => group.id === groupId
        ? {
            ...group,
            items: group.items.map((item) => item.id === itemId
              ? { ...item, items: item.items.filter((detail) => detail.id !== detailId) }
              : item),
          }
        : group),
    };
    await save(next);
  };

  return (
    <div style={wrapStyle}>
      <div style={introStyle}>
        <strong>Справочники простоев и ремонтов</strong>
        <span style={{ color: error ? "#b91c1c" : "#64748b" }}>{statusText}</span>
      </div>

      <div style={catalogGridStyle}>
        {(["downtime", "repair"] as DispatchReasonCatalogKind[]).map((kind) => (
          <section key={kind} style={catalogCardStyle}>
            <div style={catalogHeaderStyle}>
              <div>
                <div style={{ fontWeight: 700 }}>{catalogMeta[kind].title}</div>
                <div style={hintStyle}>
                  {catalogMeta[kind].groupLabel} → {catalogMeta[kind].itemLabel} → {catalogMeta[kind].detailLabel}
                </div>
              </div>
            </div>

            <div style={addRowStyle}>
              <input
                value={newGroupName[kind]}
                onChange={(event) => setNewGroupName((current) => ({ ...current, [kind]: event.target.value }))}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void addGroup(kind);
                }}
                placeholder={`Добавить ${catalogMeta[kind].groupLabel.toLowerCase()}`}
                style={inputStyle}
              />
              <button type="button" onClick={() => void addGroup(kind)} style={iconButtonStyle} title="Добавить">
                <Plus size={16} aria-hidden />
              </button>
            </div>

            <div style={groupsStyle}>
              {catalogs[kind].map((group) => (
                <div key={group.id} style={groupStyle}>
                  <div style={groupHeaderStyle}>
                    <input
                      value={group.name}
                      onChange={(event) => updateGroupName(kind, group.id, event.target.value)}
                      onBlur={() => void persist()}
                      style={{ ...inputStyle, fontWeight: 700 }}
                      aria-label={`${catalogMeta[kind].groupLabel}: ${group.name}`}
                    />
                    <button type="button" onClick={() => void deleteGroup(kind, group.id)} style={dangerIconButtonStyle} title="Удалить группу">
                      <Trash2 size={15} aria-hidden />
                    </button>
                  </div>

                  <div style={itemsStyle}>
                    {group.items.map((item) => (
                      <div key={item.id} style={itemBlockStyle}>
                        <div style={itemRowStyle}>
                          <span style={treeMarkerStyle}>↳</span>
                          <input
                            value={item.name}
                            onChange={(event) => updateItemName(kind, group.id, item.id, event.target.value)}
                            onBlur={() => void persist()}
                            style={inputStyle}
                            aria-label={`${catalogMeta[kind].itemLabel}: ${item.name}`}
                          />
                          <button type="button" onClick={() => void deleteItem(kind, group.id, item.id)} style={dangerIconButtonStyle} title="Удалить значение второго уровня">
                            <Trash2 size={14} aria-hidden />
                          </button>
                        </div>

                        <div style={detailsStyle}>
                          {item.items.map((detail) => (
                            <div key={detail.id} style={detailRowStyle}>
                              <span style={treeMarkerStyle}>↳</span>
                              <input
                                value={detail.name}
                                onChange={(event) => updateDetailName(kind, group.id, item.id, detail.id, event.target.value)}
                                onBlur={() => void persist()}
                                style={inputStyle}
                                aria-label={`${catalogMeta[kind].detailLabel}: ${detail.name}`}
                              />
                              <button type="button" onClick={() => void deleteDetail(kind, group.id, item.id, detail.id)} style={dangerIconButtonStyle} title="Удалить значение третьего уровня">
                                <Trash2 size={14} aria-hidden />
                              </button>
                            </div>
                          ))}

                          <div style={detailRowStyle}>
                            <span style={treeMarkerStyle}>↳</span>
                            <input
                              value={newDetailName[item.id] ?? ""}
                              onChange={(event) => setNewDetailName((current) => ({ ...current, [item.id]: event.target.value }))}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") void addDetail(kind, group.id, item.id);
                              }}
                              placeholder={`Добавить ${catalogMeta[kind].detailLabel.toLowerCase()}`}
                              style={inputStyle}
                            />
                            <button type="button" onClick={() => void addDetail(kind, group.id, item.id)} style={iconButtonStyle} title="Добавить третий уровень">
                              <Plus size={14} aria-hidden />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div style={itemRowStyle}>
                      <span style={treeMarkerStyle}>↳</span>
                      <input
                        value={newItemName[group.id] ?? ""}
                        onChange={(event) => setNewItemName((current) => ({ ...current, [group.id]: event.target.value }))}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") void addItem(kind, group.id);
                        }}
                        placeholder={`Добавить ${catalogMeta[kind].itemLabel.toLowerCase()}`}
                        style={inputStyle}
                      />
                      <button type="button" onClick={() => void addItem(kind, group.id)} style={iconButtonStyle} title="Добавить второй уровень">
                        <Plus size={14} aria-hidden />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {!loading && catalogs[kind].length === 0 ? (
                <div style={emptyStyle}>Справочник пока пуст.</div>
              ) : null}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

const wrapStyle: CSSProperties = { display: "grid", gap: 14 };
const introStyle: CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" };
const catalogGridStyle: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 14, alignItems: "start" };
const catalogCardStyle: CSSProperties = { background: "#fff", border: "1px solid #dbe3ed", borderRadius: 12, padding: 14, display: "grid", gap: 12, alignSelf: "start", height: "fit-content" };
const catalogHeaderStyle: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 };
const hintStyle: CSSProperties = { color: "#64748b", fontSize: 12, marginTop: 3 };
const addRowStyle: CSSProperties = { display: "grid", gridTemplateColumns: "1fr 36px", gap: 8 };
const groupsStyle: CSSProperties = { display: "grid", gap: 10 };
const groupStyle: CSSProperties = { border: "1px solid #e2e8f0", borderRadius: 10, padding: 10, background: "#f8fafc", display: "grid", gap: 8 };
const groupHeaderStyle: CSSProperties = { display: "grid", gridTemplateColumns: "1fr 34px", gap: 8 };
const itemsStyle: CSSProperties = { display: "grid", gap: 8, paddingLeft: 10 };
const itemBlockStyle: CSSProperties = { display: "grid", gap: 6 };
const detailsStyle: CSSProperties = { display: "grid", gap: 6, paddingLeft: 26 };
const itemRowStyle: CSSProperties = { display: "grid", gridTemplateColumns: "20px 1fr 34px", gap: 6, alignItems: "center" };
const detailRowStyle: CSSProperties = { ...itemRowStyle, gridTemplateColumns: "20px 1fr 34px" };
const treeMarkerStyle: CSSProperties = { color: "#64748b", textAlign: "center" };
const inputStyle: CSSProperties = { width: "100%", minWidth: 0, border: "1px solid #cbd5e1", borderRadius: 8, background: "#fff", padding: "8px 10px", font: "inherit" };
const iconButtonStyle: CSSProperties = { width: 36, height: 36, border: "1px solid #cbd5e1", borderRadius: 8, background: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };
const dangerIconButtonStyle: CSSProperties = { ...iconButtonStyle, color: "#b91c1c" };
const emptyStyle: CSSProperties = { color: "#64748b", fontSize: 13, padding: "8px 2px" };
