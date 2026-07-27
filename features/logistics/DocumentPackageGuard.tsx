"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import styles from "./document-package.module.css";

type StoredTemplate = {
  id: string;
  name: string;
  version?: string;
  active: boolean;
  fileName?: string;
  usedCount?: number;
};

type StoredRequest = {
  id: string;
  number: string;
  status: string;
  docs?: string[];
};

type StoredState = {
  templates?: StoredTemplate[];
  requests?: StoredRequest[];
};

type PackageSettings = {
  selectedTemplateIds: string[];
  snapshots: Record<string, string[]>;
};

const DATA_KEY = "gazel-logistics-web-v2";
const PACKAGE_KEY = "gazel-logistics-print-package-v2";

function readData(): StoredState {
  try {
    return JSON.parse(localStorage.getItem(DATA_KEY) || "{}") as StoredState;
  } catch {
    return {};
  }
}

function readSettings(templates: StoredTemplate[]): PackageSettings {
  try {
    const stored = localStorage.getItem(PACKAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<PackageSettings>;
      return {
        selectedTemplateIds: Array.isArray(parsed.selectedTemplateIds) ? parsed.selectedTemplateIds : [],
        snapshots: parsed.snapshots && typeof parsed.snapshots === "object" ? parsed.snapshots : {},
      };
    }
  } catch {
    // Create defaults below.
  }
  return {
    selectedTemplateIds: templates.filter((item) => item.active).map((item) => item.id),
    snapshots: {},
  };
}

function templateLabel(template: StoredTemplate) {
  const version = String(template.version || "").trim();
  return version ? `${template.name} · версия ${version}` : template.name;
}

function sameStrings(left: string[] | undefined, right: string[]) {
  return Array.isArray(left) && left.length === right.length && left.every((item, index) => item === right[index]);
}

function findRequestNumber(html: string) {
  try {
    const parsed = new DOMParser().parseFromString(html, "text/html");
    return parsed.title.trim();
  } catch {
    return "";
  }
}

function resolvePrintDocs(requestNumber: string, data: StoredState, settings: PackageSettings) {
  const request = data.requests?.find((item) => item.number === requestNumber);
  if (request && settings.snapshots[request.id]?.length) return settings.snapshots[request.id];

  const templates = data.templates || [];
  return templates
    .filter((item) => item.active && settings.selectedTemplateIds.includes(item.id))
    .map(templateLabel);
}

function transformPrintHtml(html: string, documentNames: string[]) {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  const sourceSection = parsed.querySelector("section");

  if (!sourceSection || documentNames.length === 0) {
    parsed.body.innerHTML = `
      <main style="font-family:Arial,sans-serif;padding:40px">
        <h1>Печатный пакет не сформирован</h1>
        <p>В разделе «Бланки и документы» нет выбранных официальных бланков для печати.</p>
      </main>`;
    return `<!doctype html>${parsed.documentElement.outerHTML}`;
  }

  parsed.body.innerHTML = "";
  documentNames.forEach((name, index) => {
    const section = sourceSection.cloneNode(true) as HTMLElement;
    const heading = section.querySelector("h1");
    if (heading) heading.textContent = name;
    section.setAttribute("data-package-document", String(index + 1));
    parsed.body.appendChild(section);
  });

  return `<!doctype html>${parsed.documentElement.outerHTML}`;
}

export default function DocumentPackageGuard({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<StoredTemplate[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    let lastTemplateSignature = "";

    const sync = () => {
      const data = readData();
      const currentTemplates = Array.isArray(data.templates) ? data.templates : [];
      const settings = readSettings(currentTemplates);
      const signature = JSON.stringify(currentTemplates.map((item) => [item.id, item.name, item.version, item.active, item.fileName]));

      if (signature !== lastTemplateSignature) {
        lastTemplateSignature = signature;
        setTemplates(currentTemplates);
      }
      setSelectedIds(settings.selectedTemplateIds);

      let dataChanged = false;
      let settingsChanged = false;
      const snapshots = { ...settings.snapshots };
      const selectedTemplates = currentTemplates.filter((item) => item.active && settings.selectedTemplateIds.includes(item.id));
      const selectedLabels = selectedTemplates.map(templateLabel);
      const requests = (data.requests || []).map((request) => {
        if (request.status !== "Согласована" && request.status !== "Завершена") return request;

        let snapshot = snapshots[request.id];
        if (!snapshot) {
          const knownTemplateNames = new Set(currentTemplates.flatMap((item) => [item.name, templateLabel(item)]));
          const existingDocs = Array.isArray(request.docs) ? request.docs.filter((item) => knownTemplateNames.has(item)) : [];
          snapshot = existingDocs.length > 0 && existingDocs.length === request.docs?.length ? existingDocs : selectedLabels;
          snapshots[request.id] = snapshot;
          settingsChanged = true;
        }

        if (!sameStrings(request.docs, snapshot)) {
          dataChanged = true;
          return { ...request, docs: snapshot };
        }
        return request;
      });

      if (dataChanged) {
        localStorage.setItem(DATA_KEY, JSON.stringify({ ...data, requests }));
      }
      if (settingsChanged) {
        localStorage.setItem(PACKAGE_KEY, JSON.stringify({ ...settings, snapshots }));
      } else if (!localStorage.getItem(PACKAGE_KEY)) {
        localStorage.setItem(PACKAGE_KEY, JSON.stringify(settings));
      }

      const generatedTitle = Array.from(window.document.querySelectorAll("h2")).find((node) => node.textContent?.trim() === "Сформированные пакеты");
      const generatedTable = generatedTitle?.nextElementSibling?.querySelector("table") || (generatedTitle?.nextElementSibling?.matches("table") ? generatedTitle.nextElementSibling : null);
      generatedTable?.querySelectorAll("tbody tr").forEach((row) => {
        const cells = row.querySelectorAll("td");
        const number = cells[0]?.textContent?.trim();
        const request = requests.find((item) => item.number === number);
        if (cells[2] && request?.docs) cells[2].textContent = request.docs.join(", ");
      });
    };

    sync();
    const timer = window.setInterval(sync, 500);
    const observer = new MutationObserver(sync);
    observer.observe(window.document.body, { childList: true, subtree: true });
    return () => { window.clearInterval(timer); observer.disconnect(); };
  }, []);

  useEffect(() => {
    const originalOpen = window.open.bind(window);

    window.open = ((url?: string | URL, target?: string, features?: string) => {
      const isPrintPopup = (url === "" || url === undefined) && target === "_blank" && String(features || "").includes("width=1000");
      const popup = originalOpen(url, target, features);
      if (!popup || !isPrintPopup) return popup;

      const originalWrite = popup.document.write.bind(popup.document);
      const originalPrint = popup.print.bind(popup);
      let cancelled = false;
      let emptyPackage = false;

      popup.document.write = ((...parts: string[]) => {
        const html = parts.join("");
        const data = readData();
        const settings = readSettings(data.templates || []);
        const requestNumber = findRequestNumber(html);
        const documentNames = resolvePrintDocs(requestNumber, data, settings);

        if (documentNames.length === 0) {
          emptyPackage = true;
          window.alert("Печатный пакет пуст. Сначала выберите активные бланки в разделе «Состав печати».");
        } else {
          cancelled = !window.confirm(`На печать будут выведены документы:\n\n${documentNames.map((name, index) => `${index + 1}. ${name}`).join("\n")}\n\nПродолжить печать?`);
        }

        originalWrite(transformPrintHtml(html, cancelled ? [] : documentNames));
      }) as typeof popup.document.write;

      popup.print = (() => {
        if (cancelled || emptyPackage) {
          popup.close();
          return;
        }
        originalPrint();
      }) as typeof popup.print;

      return popup;
    }) as typeof window.open;

    return () => { window.open = originalOpen as typeof window.open; };
  }, []);

  const activeCount = useMemo(() => templates.filter((item) => item.active && selectedIds.includes(item.id)).length, [templates, selectedIds]);

  function save() {
    const current = readSettings(templates);
    localStorage.setItem(PACKAGE_KEY, JSON.stringify({ ...current, selectedTemplateIds: selectedIds }));
    setOpen(false);
  }

  return (
    <>
      {children}
      <button className={styles.floatingButton} onClick={() => setOpen(true)}>Состав печати · {activeCount}</button>
      {open ? <div className={styles.backdrop} onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
        <div className={styles.modal}>
          <header><div><h2>Состав печатного пакета</h2><p>Только выбранные официальные бланки попадут в новые утверждённые заявки.</p></div><button onClick={() => setOpen(false)} aria-label="Закрыть">×</button></header>
          <div className={styles.toolbar}><button onClick={() => setSelectedIds(templates.filter((item) => item.active).map((item) => item.id))}>Выбрать все активные</button><button onClick={() => setSelectedIds([])}>Снять все</button></div>
          <div className={styles.list}>
            {templates.length === 0 ? <div className={styles.empty}>Официальные бланки ещё не добавлены.</div> : templates.map((template) => <label key={template.id} className={`${styles.templateCard} ${!template.active ? styles.inactive : ""}`}>
              <input type="checkbox" disabled={!template.active} checked={template.active && selectedIds.includes(template.id)} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...new Set([...current, template.id])] : current.filter((id) => id !== template.id))} />
              <span><b>{template.name}</b><small>Версия {template.version || "не указана"} · {template.fileName || "файл не загружен"}</small><em>{template.active ? "Действующий бланк" : "Архив — в новые пакеты не включается"}</em></span>
            </label>)}
          </div>
          <div className={styles.note}>При утверждении заявки состав фиксируется. Последующее изменение набора бланков не изменяет уже утверждённый пакет.</div>
          <footer><button onClick={() => setOpen(false)}>Отмена</button><button className={styles.primary} onClick={save}>Сохранить состав</button></footer>
        </div>
      </div> : null}
    </>
  );
}
