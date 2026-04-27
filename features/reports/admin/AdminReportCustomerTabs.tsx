import { Plus } from "lucide-react";
import type { CSSProperties } from "react";
import type { ReportCustomerConfig } from "@/lib/domain/reports/types";
import { IconButton, TopButton } from "@/shared/ui/buttons";

export function AdminReportCustomerTabs({
  customers,
  activeCustomerId,
  onSelectCustomer,
  onAddCustomer,
  onDeleteCustomer,
}: {
  customers: ReportCustomerConfig[];
  activeCustomerId: string;
  onSelectCustomer: (customerId: string) => void;
  onAddCustomer: () => void;
  onDeleteCustomer: (customerId: string) => void;
}) {
  return (
    <div style={customerTabsStyle}>
      {customers.map((customer) => (
        <TopButton
          key={customer.id}
          active={activeCustomerId === customer.id}
          onClick={() => onSelectCustomer(customer.id)}
          label={customer.label}
          showDelete={activeCustomerId === customer.id && customers.length > 1}
          deleteLabel={`Удалить заказчика ${customer.label}`}
          onDelete={() => onDeleteCustomer(customer.id)}
        />
      ))}
      <IconButton label="Добавить заказчика" onClick={onAddCustomer}>
        <Plus size={16} aria-hidden />
      </IconButton>
    </div>
  );
}

const customerTabsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: 6,
  flexWrap: "wrap",
  maxWidth: "100%",
};
