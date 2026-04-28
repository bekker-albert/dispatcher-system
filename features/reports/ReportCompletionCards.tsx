import type { ReportCompletionCard } from "@/lib/domain/reports/completion";
import { ReportCompletionGauge } from "./ReportTableParts";
import { reportGaugeGridStyle } from "./reportSectionStyles";

type ReportCompletionCardsProps = {
  cards: ReportCompletionCard[];
};

export function ReportCompletionCards({ cards }: ReportCompletionCardsProps) {
  return (
    <div style={reportGaugeGridStyle}>
      {cards.map((card) => (
        <ReportCompletionGauge
          key={card.title}
          fact={card.fact}
          lag={card.lag}
          monthPlan={card.monthPlan}
          overPlanPerDay={card.overPlanPerDay}
          percent={card.percent}
          plan={card.plan}
          remainingDays={card.remainingDays}
          title={card.title}
        />
      ))}
    </div>
  );
}
