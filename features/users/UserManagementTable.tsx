"use client";

import { Ban, Pencil, Trash2 } from "lucide-react";

import type { AuthUserListItem } from "@/lib/domain/auth/types";
import { formatDateTime } from "./UserManagementModel";
import {
  actionCellStyle,
  cellStyle,
  dangerIconButtonStyle,
  emptyStateCellStyle,
  iconButtonStyle,
  tableStyle,
  tableWrapStyle,
} from "./UserManagementStyles";

type UserManagementTableProps = {
  users: AuthUserListItem[];
  loading: boolean;
  onEdit: (user: AuthUserListItem) => void;
  onToggleActive: (user: AuthUserListItem) => void;
  onDelete: (user: AuthUserListItem) => void;
};

export function UserManagementTable({
  users,
  loading,
  onEdit,
  onToggleActive,
  onDelete,
}: UserManagementTableProps) {
  return (
    <div style={tableWrapStyle}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={cellStyle}>Создан</th>
            <th style={cellStyle}>Логин</th>
            <th style={cellStyle}>Фамилия Имя Отчество</th>
            <th style={cellStyle}>Почта</th>
            <th style={cellStyle}>Статус</th>
            <th style={actionCellStyle}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? users.map((user) => (
            <tr key={user.id}>
              <td style={cellStyle}>{formatDateTime(user.createdAt)}</td>
              <td style={cellStyle}>{user.login}</td>
              <td style={cellStyle}>{user.displayName}</td>
              <td style={cellStyle}>{user.email || "-"}</td>
              <td style={cellStyle}>{user.active ? "Активен" : "Заблокирован"}</td>
              <td style={actionCellStyle}>
                <button type="button" onClick={() => onEdit(user)} disabled={loading} style={iconButtonStyle} title="Редактировать">
                  <Pencil size={15} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => onToggleActive(user)}
                  disabled={loading}
                  style={iconButtonStyle}
                  title={user.active ? "Заблокировать" : "Разблокировать"}
                >
                  <Ban size={15} aria-hidden />
                </button>
                <button type="button" onClick={() => onDelete(user)} disabled={loading} style={dangerIconButtonStyle} title="Удалить">
                  <Trash2 size={15} aria-hidden />
                </button>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={6} style={emptyStateCellStyle}>Пользователи пока не добавлены.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
