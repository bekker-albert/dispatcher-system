import type { CSSProperties } from "react";

import { SourceNote } from "@/shared/ui/layout";
import {
  dependencyNodeLabel,
  dependencyStages,
  type DependencyLink,
  type DependencyNode,
} from "@/lib/domain/admin/structure";

type AdminStructureSchemeProps = {
  dependencyNodes: DependencyNode[];
  dependencyLinks: DependencyLink[];
};

export function AdminStructureScheme({ dependencyNodes, dependencyLinks }: AdminStructureSchemeProps) {
  return (
    <div style={sectionStyle}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>Поток данных</div>
      <div style={reportSourceGridStyle}>
        <SourceNote
          title="База смены"
          source="БД"
          text="дата, участок, техника, рейсы, часы, смена, диспетчер, состояние техники"
        />
        <SourceNote
          title="Справочник техники"
          source="СводТехники / Список техники"
          text="марка, модель, госномер, гаражный номер, статус, участок и местоположение"
        />
        <SourceNote
          title="ПТО"
          source="План, ПланС, График, Объемы кузова"
          text="план по датам, объем кузова и плановые показатели"
        />
        <SourceNote
          title="Итог"
          source="AAM"
          text="отчетность собирает план, маркзамер, оперучет, производительность и причины"
        />
      </div>

      <div style={dependencyStageGridStyle}>
        {dependencyStages.map((stage) => (
          <div key={stage.title} style={dependencyStageStyle}>
            <div style={{ color: "#475569", fontWeight: 700, marginBottom: 8 }}>{stage.title}</div>
            <div style={{ display: "grid", gap: 8 }}>
              {stage.nodeIds.map((nodeId) => {
                const node = dependencyNodes.find((item) => item.id === nodeId);
                if (!node) return null;

                return (
                  <div key={node.id} style={dependencyNodeCardStyle}>
                    <div style={{ fontWeight: 700 }}>{node.name}</div>
                    <div style={{ color: "#64748b", fontSize: 13, marginTop: 3 }}>
                      {node.kind} · {node.owner || "Ответственный не задан"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={dependencyLinkGridStyle}>
        {dependencyLinks
          .filter((link) => link.visible)
          .map((link) => (
            <div key={link.id} style={dependencyLinkCardStyle}>
              <div style={{ fontWeight: 700 }}>
                {dependencyNodeLabel(dependencyNodes, link.fromNodeId)} →{" "}
                {dependencyNodeLabel(dependencyNodes, link.toNodeId)}
              </div>
              <div style={{ color: "#475569", marginTop: 4 }}>{link.linkType} связь</div>
              <div style={{ color: "#64748b", marginTop: 6 }}>{link.rule || "Правило не заполнено."}</div>
            </div>
          ))}
      </div>
    </div>
  );
}

const sectionStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: 12,
  background: "#ffffff",
  marginBottom: 16,
};

const reportSourceGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 10,
  marginBottom: 14,
};

const dependencyStageGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 10,
};

const dependencyStageStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#f8fafc",
  padding: 10,
};

const dependencyNodeCardStyle: CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  padding: 10,
};

const dependencyLinkGridStyle: CSSProperties = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 10,
};

const dependencyLinkCardStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#f8fafc",
  padding: 12,
};
