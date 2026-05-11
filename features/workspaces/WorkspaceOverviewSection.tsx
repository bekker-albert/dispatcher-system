"use client";

import { ArrowRight, Database, Gauge, Layers3, ShieldCheck } from "lucide-react";
import { useMemo, type ReactNode } from "react";

import { useAuth } from "@/features/auth/AuthContext";
import { canAuthUserViewTab } from "@/lib/domain/auth/types";
import { appNavigationEventName } from "@/lib/domain/navigation/appNavigationEvents";
import type { TopTab } from "@/lib/domain/navigation/tabs";
import { createWorkspaceHandlerRolloutSummary } from "@/lib/domain/workspaces/handlerRolloutSummary";
import { createWorkspaceImplementationRoadmap } from "@/lib/domain/workspaces/implementationRoadmap";
import { countWorkspaceModulesByStatus, getWorkspaceModuleCatalog } from "@/lib/domain/workspaces/moduleCatalog";
import { createWorkspaceReadinessSummary } from "@/lib/domain/workspaces/readiness";
import { createStage2FirstReadModelActivationSummary } from "@/lib/domain/workspaces/stage2ReadModelActivationSummary";
import { dispatchServiceWorkspaces, type DispatchWorkspaceDefinition } from "@/lib/domain/workspaces/workspaces";
import { SectionCard } from "@/shared/ui/layout";
import {
  actionButtonStyle,
  cardTextStyle,
  cardTitleStyle,
  catalogSummaryStyle,
  disabledActionButtonStyle,
  eyebrowStyle,
  handlerRolloutStyle,
  heroStyle,
  leadStyle,
  metricIconStyle,
  metricLabelStyle,
  metricStyle,
  metricValueStyle,
  moduleListStyle,
  modulePillStyle,
  readinessBarFillStyle,
  readinessBarTrackStyle,
  readinessHeaderStyle,
  readinessNextStepStyle,
  readinessStyle,
  roadmapStyle,
  statusStyle,
  summaryGridStyle,
  titleStyle,
  workspaceCardStyle,
  workspaceGridStyle,
  workspaceHeaderStyle,
} from "./workspaceOverviewStyles";

export function WorkspaceOverviewSection() {
  const { user } = useAuth();
  const overview = useMemo(() => {
    const workspaces = dispatchServiceWorkspaces.filter((workspace) => workspace.id !== "home");
    const activeCount = workspaces.filter((workspace) => workspace.status === "active").length;
    const scaffoldCount = workspaces.filter((workspace) => workspace.status === "scaffold").length;
    const catalogModules = workspaces.flatMap((workspace) => getWorkspaceModuleCatalog(workspace.id));
    const stage2Summary = createStage2FirstReadModelActivationSummary();

    return {
      activeCount,
      catalogModules,
      scaffoldCount,
      stage2Summary,
      workspaces,
    };
  }, []);

  return (
    <SectionCard title="Главная">
      <div style={heroStyle}>
        <div>
          <div style={eyebrowStyle}>AA Mining Dispatch Service</div>
          <h1 style={titleStyle}>Рабочие зоны диспетчерской службы</h1>
          <p style={leadStyle}>
            Каркас связывает текущие вкладки с будущей модульной системой: один Next.js проект, единая
            авторизация, единый data layer и ленивое открытие тяжелых разделов.
          </p>
        </div>
        <div style={summaryGridStyle}>
          <Metric icon={<Layers3 size={18} aria-hidden />} label="Зон" value={String(overview.workspaces.length)} />
          <Metric icon={<ShieldCheck size={18} aria-hidden />} label="Активно" value={String(overview.activeCount)} />
          <Metric icon={<Gauge size={18} aria-hidden />} label="Каркас" value={String(overview.scaffoldCount)} />
          <Metric icon={<Database size={18} aria-hidden />} label="Модулей" value={String(overview.catalogModules.length)} />
          <Metric icon={<ArrowRight size={18} aria-hidden />} label="Stage 2" value={overview.stage2Summary.ready ? `${overview.stage2Summary.totalActions} ready` : `${overview.stage2Summary.issueCount} issues`} />
        </div>
      </div>

      <div style={workspaceGridStyle}>
        {overview.workspaces.map((workspace) => (
          <WorkspaceCard
            key={workspace.id}
            workspace={workspace}
            canNavigate={canAuthUserViewTab(user, workspace.topTab)}
          />
        ))}
      </div>
    </SectionCard>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div style={metricStyle}>
      <div style={metricIconStyle}>{icon}</div>
      <div>
        <div style={metricValueStyle}>{value}</div>
        <div style={metricLabelStyle}>{label}</div>
      </div>
    </div>
  );
}

function WorkspaceCard({
  workspace,
  canNavigate,
}: {
  workspace: DispatchWorkspaceDefinition;
  canNavigate: boolean;
}) {
  const readiness = createWorkspaceReadinessSummary(workspace);
  const catalogModules = getWorkspaceModuleCatalog(workspace.id);
  const handlerRollout = createWorkspaceHandlerRolloutSummary(workspace.id);
  const roadmap = createWorkspaceImplementationRoadmap(workspace.id, 3);
  const firstRoadmapAction = roadmap.nextBatch[0];
  const scaffoldModules = countWorkspaceModulesByStatus(catalogModules, "scaffold");

  return (
    <article style={workspaceCardStyle}>
      <div style={workspaceHeaderStyle}>
        <div>
          <div style={statusStyle(workspace.status)}>{workspaceStatusLabel[workspace.status]}</div>
          <h2 style={cardTitleStyle}>{workspace.title}</h2>
        </div>
      </div>
      <p style={cardTextStyle}>{workspace.purpose}</p>
      <div style={readinessStyle}>
        <div style={readinessHeaderStyle}>
          <span>Готовность каркаса</span>
          <strong>{readiness.score}%</strong>
        </div>
        <div style={readinessBarTrackStyle}>
          <div style={{ ...readinessBarFillStyle, width: `${readiness.score}%` }} />
        </div>
        <div style={readinessNextStepStyle}>Следующий шаг: {readiness.nextStep}</div>
      </div>
      {catalogModules.length > 0 && (
        <div style={catalogSummaryStyle}>
          Модули: {catalogModules.length}; каркас: {scaffoldModules}; стратегия: {catalogModules[0]?.tableStrategy ?? "none"}
        </div>
      )}
      {handlerRollout.totalActions > 0 && (
        <div style={handlerRolloutStyle}>
          Handlers: {handlerRollout.readyActions}/{handlerRollout.totalActions}; next {handlerRollout.nextPhase ?? "none"} ({handlerRollout.nextBatchSize})
        </div>
      )}
      {roadmap.nextBatch.length > 0 && (
        <div style={roadmapStyle}>
          Roadmap: {roadmap.nextBatch.length} read-model; first {firstRoadmapAction?.databaseAction ?? "none"}
        </div>
      )}
      <div style={moduleListStyle}>
        {workspace.futureModules.slice(0, 4).map((module) => (
          <span key={module} style={modulePillStyle}>{module}</span>
        ))}
      </div>
      <button
        type="button"
        disabled={!canNavigate}
        onClick={() => navigateToWorkspace(workspace.topTab)}
        style={canNavigate ? actionButtonStyle : disabledActionButtonStyle}
        title={canNavigate ? `Открыть ${workspace.title}` : "Нет права просмотра этой рабочей зоны"}
      >
        Открыть
        <ArrowRight size={15} aria-hidden />
      </button>
    </article>
  );
}

function navigateToWorkspace(topTab: TopTab) {
  window.dispatchEvent(new CustomEvent(appNavigationEventName, { detail: { topTab } }));
}

const workspaceStatusLabel: Record<DispatchWorkspaceDefinition["status"], string> = {
  active: "работает",
  scaffold: "каркас",
  planned: "план",
};
