import type { AuthPasswordResetChannel } from "@/lib/domain/auth/types";

type AuthCodeDeliveryInput = {
  channel: AuthPasswordResetChannel;
  destination: string;
  code: string;
  purpose: "password-reset";
};

type AuthCodeDeliveryResult = {
  delivered: boolean;
  developmentCode?: string;
  message: string;
};

export async function sendAuthCode(input: AuthCodeDeliveryInput): Promise<AuthCodeDeliveryResult> {
  const webhookUrl = process.env.AUTH_CODE_DELIVERY_WEBHOOK_URL?.trim();
  if (webhookUrl) {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: input.channel,
        destination: input.destination,
        code: input.code,
        purpose: input.purpose,
      }),
    });

    if (!response.ok) {
      throw new Error("Сервис отправки кода не принял запрос");
    }

    return { delivered: true, message: "Код отправлен" };
  }

  if (process.env.NODE_ENV !== "production") {
    return {
      delivered: false,
      developmentCode: input.code,
      message: "Код сформирован для локальной проверки",
    };
  }

  return {
    delivered: false,
    message: "Отправка кода на сервере пока не настроена",
  };
}
