import { aiApiDomainConnector } from "./ai-api-connector";
import { calendarDomainConnector } from "./calendar-connector";
import { documentologDomainConnector } from "./documentolog-connector";
import { knowledgeBaseDomainConnector } from "./knowledge-base-connector";
import { mailDomainConnector } from "./mail-connector";
import { notificationDomainConnector } from "./notification-connector";
import { whatsappDomainConnector } from "./whatsapp-connector";

export const aiAssistantConnectorRegistry = [
  aiApiDomainConnector,
  whatsappDomainConnector,
  mailDomainConnector,
  calendarDomainConnector,
  documentologDomainConnector,
  notificationDomainConnector,
  knowledgeBaseDomainConnector,
] as const;

export const aiAssistantConnectorByKey = new Map(
  aiAssistantConnectorRegistry.map((connector) => [connector.key, connector]),
);
