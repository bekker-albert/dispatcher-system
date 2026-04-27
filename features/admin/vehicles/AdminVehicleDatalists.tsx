import type { VehicleFilterKey } from "@/lib/domain/vehicles/grid";

export function AdminVehicleDatalists({
  vehicleAutocompleteOptions,
}: {
  vehicleAutocompleteOptions: Partial<Record<VehicleFilterKey, string[]>>;
}) {
  return (
    <>
      <datalist id="admin-vehicle-category-options">
        {(vehicleAutocompleteOptions.vehicleType ?? []).filter(Boolean).map((value) => (
          <option key={value} value={value} />
        ))}
      </datalist>
      <datalist id="admin-vehicle-equipment-type-options">
        {(vehicleAutocompleteOptions.equipmentType ?? []).filter(Boolean).map((value) => (
          <option key={value} value={value} />
        ))}
      </datalist>
      <datalist id="admin-vehicle-brand-options">
        {(vehicleAutocompleteOptions.brand ?? []).filter(Boolean).map((value) => (
          <option key={value} value={value} />
        ))}
      </datalist>
      <datalist id="admin-vehicle-owner-options">
        {(vehicleAutocompleteOptions.owner ?? []).filter(Boolean).map((value) => (
          <option key={value} value={value} />
        ))}
      </datalist>
    </>
  );
}
