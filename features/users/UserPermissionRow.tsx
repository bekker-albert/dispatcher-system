import { checkboxLabelStyle } from "./UserManagementStyles";

export function UserPermissionRow({
  label,
  access,
  onChange,
}: {
  label: string;
  access: { view: boolean; edit: boolean };
  onChange: (access: { view: boolean; edit: boolean }) => void;
}) {
  return (
    <>
      <div style={{ fontSize: 12, fontWeight: 700 }}>{label}</div>
      <label style={{ ...checkboxLabelStyle, justifyContent: "center" }}>
        <input
          type="checkbox"
          checked={access.view}
          onChange={(event) => onChange({ view: event.target.checked, edit: event.target.checked ? access.edit : false })}
        />
      </label>
      <label style={{ ...checkboxLabelStyle, justifyContent: "center" }}>
        <input
          type="checkbox"
          checked={access.edit}
          onChange={(event) => onChange({ view: access.view || event.target.checked, edit: event.target.checked })}
        />
      </label>
    </>
  );
}
