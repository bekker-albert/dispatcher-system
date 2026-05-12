export const appShellCss = `
.erp-shell {
  min-height: calc(100vh - 48px);
  display: grid;
  grid-template-columns: 252px minmax(0, 1fr);
  gap: 16px;
}

.erp-shell[data-collapsed="true"] {
  grid-template-columns: 70px minmax(0, 1fr);
}

.erp-sidebar {
  position: sticky;
  top: 24px;
  height: calc(100vh - 48px);
  border: 1px solid #d8dee8;
  border-radius: 8px;
  background: #ffffff;
  color: #0f172a;
  overflow: visible;
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
}

.erp-sidebar__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px;
}

.erp-sidebar,
.erp-sidebar * {
  min-width: 0;
}

.erp-sidebar__inline-editor {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px;
  border-bottom: 1px solid #e2e8f0;
}

.erp-sidebar__inline-editor-button,
.erp-sidebar__inline-editor-reset {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid #d8dee8;
  border-radius: 7px;
  background: #ffffff;
  color: #334155;
  cursor: pointer;
  font: inherit;
  font-size: 11px;
  font-weight: 800;
  min-height: 28px;
  padding: 4px 8px;
}

.erp-sidebar__inline-editor-button {
  flex: 1 1 auto;
}

.erp-sidebar__inline-editor-button[aria-pressed="true"] {
  background: #e8f1ff;
  color: #0f4c81;
}

.erp-sidebar__inline-editor-reset {
  margin-left: auto;
  color: #64748b;
  flex: 0 0 auto;
}

.erp-sidebar-inline-label {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  width: 100%;
}

.erp-sidebar-inline-label input {
  width: 100%;
  min-width: 0;
  border: 1px solid #cbd5e1;
  border-radius: 5px;
  background: #ffffff;
  color: #0f172a;
  font: inherit;
  font-size: 12px;
  font-weight: 750;
  padding: 3px 5px;
}

.erp-sidebar-inline-label button {
  width: 20px;
  height: 20px;
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  background: #ffffff;
  color: #64748b;
  cursor: pointer;
  flex: 0 0 auto;
  line-height: 1;
}

.erp-sidebar-inline-label__handle {
  color: #94a3b8;
  cursor: grab;
  flex: 0 0 auto;
  font-size: 12px;
}

.erp-sidebar__brand {
  height: 68px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid #e2e8f0;
}

.erp-sidebar__brand-mark {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  color: #0f172a;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  flex: 0 0 auto;
  overflow: hidden;
}

.erp-sidebar__brand-logo {
  width: 34px;
  height: 34px;
  object-fit: contain;
}

.erp-sidebar__brand-text {
  min-width: 0;
}

.erp-sidebar__brand-title {
  font-size: 14px;
  font-weight: 800;
  line-height: 1.1;
}

.erp-sidebar__brand-subtitle {
  margin-top: 3px;
  font-size: 12px;
  color: #64748b;
}

.erp-sidebar-group {
  margin-bottom: 6px;
}

.erp-sidebar-group__button,
.erp-sidebar-item {
  width: 100%;
  min-height: 34px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  font: inherit;
  font-size: 13px;
  text-align: left;
  overflow: hidden;
}

.erp-sidebar-group__button {
  font-weight: 750;
}

.erp-sidebar-group__chevron {
  flex: 0 0 auto;
  display: inline-flex;
}

.erp-sidebar-group__button:hover,
.erp-sidebar-item:hover {
  background: #f1f5f9;
}

.erp-sidebar-group__button[data-active="true"],
.erp-sidebar-item[data-active="true"] {
  background: #e8f1ff;
  color: #0f4c81;
}

.erp-sidebar-item[data-disabled="true"] {
  color: #94a3b8;
  cursor: default;
}

.erp-sidebar-item[data-editing="true"] {
  cursor: grab;
}

.erp-sidebar-item[data-disabled="true"]:hover {
  background: transparent;
}

.erp-sidebar-item__label,
.erp-sidebar-group__label {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.erp-sidebar-item__badge {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  display: inline-grid;
  place-items: center;
  margin-left: auto;
  border-radius: 999px;
  padding: 0;
  background: #f1f5f9;
  color: #64748b;
}

.erp-sidebar-item__badge[data-status="preview"] {
  background: #fff7ed;
  color: #9a3412;
}

.erp-sidebar-item__badge[data-status="planned"] {
  background: #f1f5f9;
  color: #64748b;
}

.erp-sidebar-group__items {
  display: grid;
  gap: 2px;
  padding: 2px 0 4px 18px;
  overflow: hidden;
}

.erp-sidebar-group__items .erp-sidebar-group__items {
  padding-left: 14px;
}

.erp-shell[data-collapsed="true"] .erp-sidebar__brand-text,
.erp-shell[data-collapsed="true"] .erp-sidebar__inline-editor-reset,
.erp-shell[data-collapsed="true"] .erp-sidebar-group__label,
.erp-shell[data-collapsed="true"] .erp-sidebar-group__chevron,
.erp-shell[data-collapsed="true"] .erp-sidebar-group__items,
.erp-shell[data-collapsed="true"] .erp-sidebar-item__label,
.erp-shell[data-collapsed="true"] .erp-sidebar-item__badge {
  display: none;
}

.erp-shell[data-collapsed="true"] .erp-sidebar__brand {
  justify-content: center;
  padding-inline: 6px;
}

.erp-shell[data-collapsed="true"] .erp-sidebar__inline-editor {
  justify-content: center;
  padding-inline: 6px;
}

.erp-shell[data-collapsed="true"] .erp-sidebar__inline-editor-button {
  width: 34px;
  flex: 0 0 34px;
  padding-inline: 0;
}

.erp-shell[data-collapsed="true"] .erp-sidebar-group__button,
.erp-shell[data-collapsed="true"] .erp-sidebar-item {
  justify-content: center;
  padding-inline: 0;
}

.erp-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.erp-topbar {
  min-height: 48px;
  border: 1px solid #d8dee8;
  border-radius: 8px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 10px;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.05);
}

.erp-topbar__left {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1 1 auto;
}

.erp-topbar__subtitle {
  min-width: 0;
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 750;
  line-height: 1.2;
  color: #334155;
}

.erp-topbar__right {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  justify-content: flex-end;
}

.erp-topbar__date {
  border: 1px solid #d8dee8;
  border-radius: 7px;
  min-height: 30px;
  padding: 4px 8px;
  font-size: 12px;
  color: #475569;
  background: #f8fafc;
}

.erp-topbar__date {
  display: flex;
  align-items: center;
  gap: 7px;
}

.erp-topbar__date input {
  border: 0;
  background: transparent;
  color: #0f172a;
  font: inherit;
}

.erp-topbar .app-auth-session {
  flex: 0 1 320px;
  width: auto !important;
  min-width: 170px;
  max-width: min(360px, 34vw);
}

.erp-topbar .app-auth-session > button {
  width: 100% !important;
  min-height: 30px;
  padding: 4px 8px !important;
}

.erp-content {
  min-width: 0;
}

.erp-icon-button {
  width: 36px;
  height: 36px;
  border-radius: 7px;
  border: 1px solid #d8dee8;
  background: #ffffff;
  color: #0f172a;
  display: inline-grid;
  place-items: center;
}

.erp-icon-button:hover {
  background: #f1f5f9;
}

.erp-sidebar__toggle {
  position: absolute;
  z-index: 8;
  right: -16px;
  top: 54px;
  width: 30px;
  height: 30px;
  border-radius: 999px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.16);
}

.erp-mobile-backdrop {
  display: none;
}

@media (min-width: 901px) {
  .erp-topbar__left > .erp-icon-button {
    display: none;
  }
}

@media (max-width: 900px) {
  .erp-shell,
  .erp-shell[data-collapsed="true"] {
    grid-template-columns: minmax(0, 1fr);
  }

  .erp-sidebar {
    position: fixed;
    z-index: 50;
    inset: 12px auto 12px 12px;
    width: min(252px, calc(100vw - 24px));
    height: auto;
    transform: translateX(-112%);
    transition: transform 160ms ease;
  }

  .erp-shell[data-mobile-open="true"] .erp-sidebar {
    transform: translateX(0);
  }

  .erp-sidebar__toggle {
    display: none;
  }

  .erp-mobile-backdrop {
    display: block;
    position: fixed;
    z-index: 40;
    inset: 0;
    border: 0;
    background: rgba(15, 23, 42, 0.32);
  }

  .erp-shell[data-mobile-open="false"] .erp-mobile-backdrop {
    display: none;
  }

  .erp-topbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .erp-topbar__right {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .erp-topbar .app-auth-session {
    flex: 1 1 180px;
    max-width: 100%;
  }
}

`;
