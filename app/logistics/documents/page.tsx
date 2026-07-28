import type { Metadata } from "next";

import DocumentWorkspace from "@/features/logistics/DocumentWorkspace";

export const metadata: Metadata = {
  title: "Документы логистики",
  description: "Версии шаблонов, правила комплекта и неизменяемые экземпляры документов",
};

export default function LogisticsDocumentsPage() {
  return <DocumentWorkspace />;
}
