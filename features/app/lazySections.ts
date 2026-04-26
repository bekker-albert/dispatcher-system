import dynamic from "next/dynamic";

export const AdminVehiclesSection = dynamic(() => import("../admin/vehicles/AdminVehiclesSection"), {
  ssr: false,
});

export const AdminDatabaseSection = dynamic(() => import("../admin/database/AdminDatabaseSection"), {
  ssr: false,
});

export const AdminLogsSection = dynamic(() => import("../admin/logs/AdminLogsSection"), {
  ssr: false,
});

export const AdminNavigationSection = dynamic(() => import("../admin/navigation/AdminNavigationSection"), {
  ssr: false,
});

export const DispatchSection = dynamic(() => import("../dispatch/DispatchSection"), {
  ssr: false,
});

export const ReportsSection = dynamic(() => import("../reports/ReportsSection"), {
  ssr: false,
});

export const PtoSection = dynamic(() => import("../pto/PtoSection"), {
  ssr: false,
});

export const AdminReportSettingsSection = dynamic(() => import("../reports/admin/AdminReportSettingsSection"), {
  ssr: false,
});
