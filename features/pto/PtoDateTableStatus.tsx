import type { PtoStatus } from "../../lib/domain/pto/date-table";
import { statusControlStyle } from "../../shared/ui/statusBadge";
import { ptoStatusBadgeStyle } from "./ptoDateTableStyles";

type PtoStatusCellProps = {
  status: PtoStatus;
};

export function PtoStatusCell({ status }: PtoStatusCellProps) {
  return (
    <span
      title="\u0421\u0442\u0430\u0442\u0443\u0441 \u0440\u0430\u0441\u0441\u0447\u0438\u0442\u044b\u0432\u0430\u0435\u0442\u0441\u044f \u043f\u043e \u0440\u0430\u0431\u043e\u0447\u0435\u0439 \u0434\u0430\u0442\u0435 \u0438 \u0437\u0430\u043f\u043e\u043b\u043d\u0435\u043d\u043d\u044b\u043c \u0437\u043d\u0430\u0447\u0435\u043d\u0438\u044f\u043c \u043c\u0435\u0441\u044f\u0446\u0430"
      style={{ ...ptoStatusBadgeStyle, ...statusControlStyle(status) }}
    >
      {status}
    </span>
  );
}
