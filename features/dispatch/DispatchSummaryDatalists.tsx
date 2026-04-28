type DispatchSummaryDatalistsProps = {
  dispatchAreaOptions: string[];
  dispatchExcavatorOptions: string[];
  dispatchLocationOptions: string[];
  dispatchWorkTypeOptions: string[];
};

export function DispatchSummaryDatalists({
  dispatchAreaOptions,
  dispatchExcavatorOptions,
  dispatchLocationOptions,
  dispatchWorkTypeOptions,
}: DispatchSummaryDatalistsProps) {
  return (
    <>
      <datalist id="dispatch-area-options">
        {dispatchAreaOptions.filter((area) => area !== "Все участки").map((area) => (
          <option key={area} value={area} />
        ))}
      </datalist>
      <datalist id="dispatch-location-options">
        {dispatchLocationOptions.map((location) => (
          <option key={location} value={location} />
        ))}
      </datalist>
      <datalist id="dispatch-worktype-options">
        {dispatchWorkTypeOptions.map((workType) => (
          <option key={workType} value={workType} />
        ))}
      </datalist>
      <datalist id="dispatch-excavator-options">
        {dispatchExcavatorOptions.map((excavator) => (
          <option key={excavator} value={excavator} />
        ))}
      </datalist>
    </>
  );
}
