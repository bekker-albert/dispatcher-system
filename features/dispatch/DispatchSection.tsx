"use client";

import { Plus, Trash2 } from "lucide-react";
import { dispatchProductivity, dispatchShiftLabel, type DispatchSummaryRow } from "@/lib/domain/dispatch/summary";
import { buildVehicleDisplayName } from "@/lib/domain/vehicles/import-export";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import { formatNumber, statusColor, statusTextColor } from "@/lib/domain/reports/display";
import { formatReportDate } from "@/lib/domain/reports/display";
import { formatPtoCellNumber } from "@/lib/domain/pto/formatting";
import { MiniIconButton } from "@/shared/ui/buttons";
import { Field, Pill, SectionCard } from "@/shared/ui/layout";
import {
  blockStyle,
  dispatchSuggestionStyle,
  dispatchSummaryActionTdStyle,
  dispatchSummaryBadRowStyle,
  dispatchSummaryButtonStyle,
  dispatchSummaryEmptyStyle,
  dispatchSummaryHeaderStyle,
  dispatchSummaryInputStyle,
  dispatchSummaryNumberInputStyle,
  dispatchSummaryNumberThStyle,
  dispatchSummaryReadonlyNoteStyle,
  dispatchSummaryReadonlyNumberStyle,
  dispatchSummarySecondaryButtonStyle,
  dispatchSummaryStatCardStyle,
  dispatchSummaryStatsStyle,
  dispatchSummaryTableScrollStyle,
  dispatchSummaryTableStyle,
  dispatchSummaryTdNumberStyle,
  dispatchSummaryTdStyle,
  dispatchSummaryTextareaStyle,
  dispatchSummaryThStyle,
  dispatchSummaryToolbarDailyStyle,
  dispatchSummaryToolbarStyle,
  inputStyle,
} from "@/features/dispatch/dispatchSectionStyles";

export type DispatchTotals = {
  plan: number;
  fact: number;
  workHours: number;
  repairHours: number;
  downtimeHours: number;
  trips: number;
  delta: number;
  percent: number;
  productivity: number;
};

export type DispatchSectionProps = {
  activeDispatchSubtabLabel: string;
  dispatchTab: string;
  activeDispatchSubtabContent: string;
  reportDate: string;
  isDailyDispatchShift: boolean;
  currentDispatchShift: "daily" | "night" | "day";
  dispatchSummaryTotals: DispatchTotals;
  search: string;
  onSearchChange: (value: string) => void;
  areaFilter: string;
  onAreaFilterChange: (value: string) => void;
  dispatchAreaOptions: string[];
  dispatchVehicleToAddId: string;
  onDispatchVehicleToAddIdChange: (value: string) => void;
  dispatchVehicleOptions: VehicleRow[];
  onAddSelectedDispatchVehicle: () => void;
  onAddFilteredVehiclesToDispatchSummary: () => void;
  dispatchAiSuggestion: string;
  filteredDispatchSummaryRows: DispatchSummaryRow[];
  onUpdateDispatchSummaryVehicle: (rowId: string, vehicleId: string) => void;
  onUpdateDispatchSummaryText: (rowId: string, field: "vehicleName" | "area" | "location" | "workType" | "excavator" | "reason" | "comment", value: string) => void;
  onUpdateDispatchSummaryNumber: (rowId: string, field: "planVolume" | "factVolume" | "workHours" | "rentHours" | "repairHours" | "downtimeHours" | "trips", value: string) => void;
  onDeleteDispatchSummaryRow: (rowId: string) => void;
  dispatchLocationOptions: string[];
  dispatchWorkTypeOptions: string[];
  dispatchExcavatorOptions: string[];
};

export default function DispatchSection({
  activeDispatchSubtabLabel,
  dispatchTab,
  activeDispatchSubtabContent,
  reportDate,
  isDailyDispatchShift,
  currentDispatchShift,
  dispatchSummaryTotals,
  search,
  onSearchChange,
  areaFilter,
  onAreaFilterChange,
  dispatchAreaOptions,
  dispatchVehicleToAddId,
  onDispatchVehicleToAddIdChange,
  dispatchVehicleOptions,
  onAddSelectedDispatchVehicle,
  onAddFilteredVehiclesToDispatchSummary,
  dispatchAiSuggestion,
  filteredDispatchSummaryRows,
  onUpdateDispatchSummaryVehicle,
  onUpdateDispatchSummaryText,
  onUpdateDispatchSummaryNumber,
  onDeleteDispatchSummaryRow,
  dispatchLocationOptions,
  dispatchWorkTypeOptions,
  dispatchExcavatorOptions,
}: DispatchSectionProps) {
  return (
    <SectionCard title={activeDispatchSubtabLabel}>
      {dispatchTab.startsWith("custom:") ? (
        <div style={blockStyle}>{activeDispatchSubtabContent || "В этой подвкладке пока нет информации."}</div>
      ) : (
        <>
          <div style={dispatchSummaryHeaderStyle}>
            <div>
              <div style={{ fontWeight: 800 }}>Заполнение сводки за {formatReportDate(reportDate)}</div>
              <div style={{ color: "#64748b", marginTop: 3 }}>
                {isDailyDispatchShift
                  ? "Сутки формируются автоматически из ночной и дневной смены за выбранную дату."
                  : `${dispatchShiftLabel(currentDispatchShift)}. Строки сохраняются локально и потом могут стать таблицей Supabase.`}
              </div>
            </div>
            <Pill bg={statusColor(dispatchSummaryTotals.percent)} color={statusTextColor(dispatchSummaryTotals.percent)}>
              {dispatchSummaryTotals.percent}%
            </Pill>
          </div>

          <div style={dispatchSummaryStatsStyle}>
            <div style={dispatchSummaryStatCardStyle}>
              <span>План</span>
              <strong>{formatNumber(dispatchSummaryTotals.plan)}</strong>
            </div>
            <div style={dispatchSummaryStatCardStyle}>
              <span>Факт</span>
              <strong>{formatNumber(dispatchSummaryTotals.fact)}</strong>
            </div>
            <div style={dispatchSummaryStatCardStyle}>
              <span>Отклонение</span>
              <strong style={{ color: dispatchSummaryTotals.delta < 0 ? "#991b1b" : "#166534" }}>{formatNumber(dispatchSummaryTotals.delta)}</strong>
            </div>
            <div style={dispatchSummaryStatCardStyle}>
              <span>Работа / ремонт / простой</span>
              <strong>{formatPtoCellNumber(dispatchSummaryTotals.workHours)} / {formatPtoCellNumber(dispatchSummaryTotals.repairHours)} / {formatPtoCellNumber(dispatchSummaryTotals.downtimeHours)} ч.</strong>
            </div>
            <div style={dispatchSummaryStatCardStyle}>
              <span>Производительность</span>
              <strong>{formatPtoCellNumber(dispatchSummaryTotals.productivity)}</strong>
            </div>
          </div>

          <div style={isDailyDispatchShift ? dispatchSummaryToolbarDailyStyle : dispatchSummaryToolbarStyle}>
            <Field label="Поиск">
              <input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Техника, участок, вид работ, причина..." style={{ ...inputStyle, padding: "9px 10px" }} />
            </Field>
            <Field label="Участок">
              <select value={areaFilter} onChange={(e) => onAreaFilterChange(e.target.value)} style={{ ...inputStyle, padding: "9px 10px" }}>
                {dispatchAreaOptions.map((area) => (
                  <option key={area}>{area}</option>
                ))}
              </select>
            </Field>
            {isDailyDispatchShift ? (
              <div style={dispatchSummaryReadonlyNoteStyle}>
                Редактирование закрыто: заполняй вкладки Ночь и День, эта вкладка покажет их сумму.
              </div>
            ) : (
              <>
                <Field label="Техника">
                  <select value={dispatchVehicleToAddId} onChange={(e) => onDispatchVehicleToAddIdChange(e.target.value)} style={{ ...inputStyle, padding: "9px 10px" }}>
                    <option value="">Пустая строка</option>
                    {dispatchVehicleOptions.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>{buildVehicleDisplayName(vehicle)}</option>
                    ))}
                  </select>
                </Field>
                <button onClick={onAddSelectedDispatchVehicle} style={dispatchSummaryButtonStyle} type="button">
                  <Plus size={14} aria-hidden />
                  Добавить строку
                </button>
                <button onClick={onAddFilteredVehiclesToDispatchSummary} style={dispatchSummarySecondaryButtonStyle} type="button">
                  Заполнить из техники
                </button>
              </>
            )}
          </div>

          <div style={dispatchSuggestionStyle}>
            <strong>Черновик для ИИ:</strong> {dispatchAiSuggestion}
          </div>

          <div style={dispatchSummaryTableScrollStyle}>
            <table style={dispatchSummaryTableStyle}>
              <colgroup>
                <col style={{ width: 190 }} />
                <col style={{ width: 120 }} />
                <col style={{ width: 140 }} />
                <col style={{ width: 230 }} />
                <col style={{ width: 140 }} />
                <col style={{ width: 80 }} />
                <col style={{ width: 80 }} />
                <col style={{ width: 68 }} />
                <col style={{ width: 68 }} />
                <col style={{ width: 68 }} />
                <col style={{ width: 68 }} />
                <col style={{ width: 68 }} />
                <col style={{ width: 82 }} />
                <col style={{ width: 82 }} />
                <col style={{ width: 260 }} />
                <col style={{ width: 230 }} />
                <col style={{ width: 42 }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={dispatchSummaryThStyle}>Техника</th>
                  <th style={dispatchSummaryThStyle}>Участок</th>
                  <th style={dispatchSummaryThStyle}>Местонахождение</th>
                  <th style={dispatchSummaryThStyle}>Вид работ</th>
                  <th style={dispatchSummaryThStyle}>Экскаватор</th>
                  <th style={dispatchSummaryNumberThStyle}>План</th>
                  <th style={dispatchSummaryNumberThStyle}>Факт</th>
                  <th style={dispatchSummaryNumberThStyle}>Работа</th>
                  <th style={dispatchSummaryNumberThStyle}>Аренда</th>
                  <th style={dispatchSummaryNumberThStyle}>Ремонт</th>
                  <th style={dispatchSummaryNumberThStyle}>Простой</th>
                  <th style={dispatchSummaryNumberThStyle}>Рейсы</th>
                  <th style={dispatchSummaryNumberThStyle}>Произв.</th>
                  <th style={dispatchSummaryNumberThStyle}>Итого</th>
                  <th style={dispatchSummaryThStyle}>Причина за сутки</th>
                  <th style={dispatchSummaryThStyle}>Комментарий диспетчера</th>
                  <th style={dispatchSummaryThStyle} />
                </tr>
              </thead>
              <tbody>
                {filteredDispatchSummaryRows.map((row) => {
                  const totalRowHours = row.workHours + row.rentHours + row.repairHours + row.downtimeHours;
                  const rowProductivity = dispatchProductivity(row);
                  const rowDelta = row.factVolume - row.planVolume;

                  return (
                    <tr key={row.id} style={rowDelta < 0 ? dispatchSummaryBadRowStyle : undefined}>
                      <td style={dispatchSummaryTdStyle}>
                        <select disabled={isDailyDispatchShift} value={row.vehicleId ?? ""} onChange={(e) => onUpdateDispatchSummaryVehicle(row.id, e.target.value)} style={dispatchSummaryInputStyle}>
                          <option value="">Вручную</option>
                          {dispatchVehicleOptions.map((vehicle) => (
                            <option key={vehicle.id} value={vehicle.id}>{buildVehicleDisplayName(vehicle)}</option>
                          ))}
                        </select>
                        {!row.vehicleId ? (
                          <input readOnly={isDailyDispatchShift} value={row.vehicleName} onChange={(e) => onUpdateDispatchSummaryText(row.id, "vehicleName", e.target.value)} placeholder="Название техники" style={{ ...dispatchSummaryInputStyle, marginTop: 4 }} />
                        ) : null}
                      </td>
                      <td style={dispatchSummaryTdStyle}>
                        <input readOnly={isDailyDispatchShift} list="dispatch-area-options" value={row.area} onChange={(e) => onUpdateDispatchSummaryText(row.id, "area", e.target.value)} style={dispatchSummaryInputStyle} />
                      </td>
                      <td style={dispatchSummaryTdStyle}>
                        <input readOnly={isDailyDispatchShift} list="dispatch-location-options" value={row.location} onChange={(e) => onUpdateDispatchSummaryText(row.id, "location", e.target.value)} style={dispatchSummaryInputStyle} />
                      </td>
                      <td style={dispatchSummaryTdStyle}>
                        <textarea readOnly={isDailyDispatchShift} value={row.workType} onChange={(e) => onUpdateDispatchSummaryText(row.id, "workType", e.target.value)} placeholder="Вид работ" style={dispatchSummaryTextareaStyle} />
                      </td>
                      <td style={dispatchSummaryTdStyle}>
                        <input readOnly={isDailyDispatchShift} list="dispatch-excavator-options" value={row.excavator} onChange={(e) => onUpdateDispatchSummaryText(row.id, "excavator", e.target.value)} style={dispatchSummaryInputStyle} />
                      </td>
                      <td style={dispatchSummaryTdNumberStyle}>
                        <input readOnly={isDailyDispatchShift} inputMode="decimal" value={dispatchNumberInputValue(row.planVolume)} onChange={(e) => onUpdateDispatchSummaryNumber(row.id, "planVolume", e.target.value)} style={dispatchSummaryNumberInputStyle} />
                      </td>
                      <td style={dispatchSummaryTdNumberStyle}>
                        <input readOnly={isDailyDispatchShift} inputMode="decimal" value={dispatchNumberInputValue(row.factVolume)} onChange={(e) => onUpdateDispatchSummaryNumber(row.id, "factVolume", e.target.value)} style={dispatchSummaryNumberInputStyle} />
                      </td>
                      <td style={dispatchSummaryTdNumberStyle}>
                        <input readOnly={isDailyDispatchShift} inputMode="decimal" value={dispatchNumberInputValue(row.workHours)} onChange={(e) => onUpdateDispatchSummaryNumber(row.id, "workHours", e.target.value)} style={dispatchSummaryNumberInputStyle} />
                      </td>
                      <td style={dispatchSummaryTdNumberStyle}>
                        <input readOnly={isDailyDispatchShift} inputMode="decimal" value={dispatchNumberInputValue(row.rentHours)} onChange={(e) => onUpdateDispatchSummaryNumber(row.id, "rentHours", e.target.value)} style={dispatchSummaryNumberInputStyle} />
                      </td>
                      <td style={dispatchSummaryTdNumberStyle}>
                        <input readOnly={isDailyDispatchShift} inputMode="decimal" value={dispatchNumberInputValue(row.repairHours)} onChange={(e) => onUpdateDispatchSummaryNumber(row.id, "repairHours", e.target.value)} style={dispatchSummaryNumberInputStyle} />
                      </td>
                      <td style={dispatchSummaryTdNumberStyle}>
                        <input readOnly={isDailyDispatchShift} inputMode="decimal" value={dispatchNumberInputValue(row.downtimeHours)} onChange={(e) => onUpdateDispatchSummaryNumber(row.id, "downtimeHours", e.target.value)} style={dispatchSummaryNumberInputStyle} />
                      </td>
                      <td style={dispatchSummaryTdNumberStyle}>
                        <input readOnly={isDailyDispatchShift} inputMode="numeric" value={dispatchNumberInputValue(row.trips)} onChange={(e) => onUpdateDispatchSummaryNumber(row.id, "trips", e.target.value)} style={dispatchSummaryNumberInputStyle} />
                      </td>
                      <td style={dispatchSummaryReadonlyNumberStyle}>{formatPtoCellNumber(rowProductivity)}</td>
                      <td style={dispatchSummaryReadonlyNumberStyle}>
                        <Pill bg={totalRowHours === 11 ? "#dcfce7" : "#fee2e2"} color={totalRowHours === 11 ? "#166534" : "#991b1b"}>
                          {formatPtoCellNumber(totalRowHours)}
                        </Pill>
                      </td>
                      <td style={dispatchSummaryTdStyle}>
                        <textarea readOnly={isDailyDispatchShift} value={row.reason} onChange={(e) => onUpdateDispatchSummaryText(row.id, "reason", e.target.value)} placeholder="Например: Простой ДСК (5 ч.)" style={dispatchSummaryTextareaStyle} />
                      </td>
                      <td style={dispatchSummaryTdStyle}>
                        <textarea readOnly={isDailyDispatchShift} value={row.comment} onChange={(e) => onUpdateDispatchSummaryText(row.id, "comment", e.target.value)} placeholder="Комментарий смены" style={dispatchSummaryTextareaStyle} />
                      </td>
                      <td style={dispatchSummaryActionTdStyle}>
                        {!isDailyDispatchShift ? (
                          <MiniIconButton label="Удалить строку сводки" onClick={() => onDeleteDispatchSummaryRow(row.id)}>
                            <Trash2 size={14} aria-hidden />
                          </MiniIconButton>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
                {filteredDispatchSummaryRows.length === 0 ? (
                  <tr>
                    <td colSpan={17} style={dispatchSummaryEmptyStyle}>
                      {isDailyDispatchShift
                        ? "Сутки пока пустые: заполни ночную и дневную смену за выбранную дату."
                        : "По выбранной дате, смене и фильтрам строк пока нет. Добавь строку вручную или заполни из списка техники."}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

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
      )}
    </SectionCard>
  );
}

function dispatchNumberInputValue(value: number) {
  return value === 0 ? "" : String(value);
}
