import { Printer } from "lucide-react";
import { IconButton, TopButton } from "@/shared/ui/buttons";
import {
  reportAreaTabsListStyle,
  reportAreaTabsToolbarStyle,
} from "./reportSectionStyles";

const ALL_AREAS_LABEL = "Все участки";

type ReportAreaToolbarProps = {
  reportAreaTabs: string[];
  reportArea: string;
  onSelectReportArea: (area: string) => void;
  onPrintReport: () => void;
};

export function ReportAreaToolbar({
  reportAreaTabs,
  reportArea,
  onSelectReportArea,
  onPrintReport,
}: ReportAreaToolbarProps) {
  return (
    <div className="report-screen-toolbar" style={reportAreaTabsToolbarStyle}>
      <div style={reportAreaTabsListStyle}>
        {reportAreaTabs.map((area) => (
          <TopButton
            key={area}
            active={reportArea !== ALL_AREAS_LABEL && reportArea === area}
            onClick={() => onSelectReportArea(area)}
            label={area}
          />
        ))}
      </div>
      <IconButton label="Печать отчетности: A3, альбомная ориентация" onClick={onPrintReport}>
        <Printer size={16} aria-hidden />
      </IconButton>
    </div>
  );
}
