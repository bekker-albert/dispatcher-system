"use client";

import dynamic from "next/dynamic";

export const AiAssistantFloatingDockHost = dynamic(
  () => import("@/features/ai-assistant/components/AiAssistantFloatingDock")
    .then((module) => module.AiAssistantFloatingDock),
  { ssr: false },
);
