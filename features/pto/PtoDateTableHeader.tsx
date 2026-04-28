import type { CSSProperties, MouseEvent, ReactNode } from "react";
import {
  ptoColumnResizeHandleStyle,
  ptoHeaderContentStyle,
  ptoPlanThStyle,
} from "./PtoDateTablePartStyles";

type PtoPlanThProps = {
  children: ReactNode;
  colSpan?: number;
  rowSpan?: number;
  align?: CSSProperties["textAlign"];
  columnKey?: string;
  width?: number;
  onResizeStart?: (event: MouseEvent<HTMLElement>, key: string, width: number) => void;
};

type PtoVirtualSpacerRowProps = {
  height: number;
  colSpan: number;
};

export function PtoPlanTh({
  children,
  colSpan = 1,
  rowSpan = 1,
  align = "left",
  columnKey,
  width,
  onResizeStart,
}: PtoPlanThProps) {
  const justifyContent = align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";

  return (
    <th
      colSpan={colSpan}
      rowSpan={rowSpan}
      style={{
        ...ptoPlanThStyle,
        textAlign: align,
        ...(width ? { width, minWidth: width, maxWidth: width } : null),
      }}
    >
      <div style={{ ...ptoHeaderContentStyle, justifyContent, textAlign: align }}>{children}</div>
      {columnKey && width && onResizeStart ? (
        <span
          onMouseDown={(event) => onResizeStart(event, columnKey, width)}
          style={ptoColumnResizeHandleStyle}
          title="\u041f\u043e\u0442\u044f\u043d\u0438, \u0447\u0442\u043e\u0431\u044b \u0438\u0437\u043c\u0435\u043d\u0438\u0442\u044c \u0448\u0438\u0440\u0438\u043d\u0443 \u0441\u0442\u043e\u043b\u0431\u0446\u0430"
          aria-hidden
        />
      ) : null}
    </th>
  );
}

export function PtoVirtualSpacerRow({ height, colSpan }: PtoVirtualSpacerRowProps) {
  if (height <= 0) return null;

  return (
    <tr aria-hidden>
      <td colSpan={colSpan} style={{ height, padding: 0, border: "none", background: "transparent" }} />
    </tr>
  );
}
