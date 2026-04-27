import https from "node:https";

export function createOpenAiResponse(apiKeyValue, requestBody) {
  const body = JSON.stringify(requestBody);

  return new Promise((resolve) => {
    const request = https.request(
      {
        hostname: "api.openai.com",
        path: "/v1/responses",
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKeyValue}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (response) => {
        const chunks = [];

        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          const responseText = Buffer.concat(chunks).toString("utf8");
          const parsedBody = parseJsonSafe(responseText);

          resolve({
            ok: response.statusCode >= 200 && response.statusCode < 300,
            status: response.statusCode,
            statusText: response.statusMessage,
            body: parsedBody,
          });
        });
      },
    );

    request.on("error", (error) => {
      resolve({
        ok: false,
        status: 0,
        statusText: error.message,
        body: null,
      });
    });

    request.write(body);
    request.end();
  });
}

export function extractOutputText(payload) {
  if (typeof payload?.output_text === "string") return payload.output_text;

  const parts = [];
  for (const item of payload?.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") parts.push(content.text);
    }
  }

  return parts.join("\n").trim();
}

export function printOpenAiError(status, message) {
  if (status === 429) {
    console.error("OpenAI API returned 429: quota or account balance is exhausted.");
    console.error("Check OpenAI Billing/Usage or use another API key with available quota.");
    console.error("Without quota, run the local context check: npm run refactor:ai -- --offline");
    return;
  }

  if (status === 401) {
    console.error("OpenAI API returned 401: the API key is invalid or has no access.");
    console.error("Check OPENAI_API_KEY in .env.local. Do not send the key in chat.");
    return;
  }

  if (status === 0) {
    console.error(`Could not connect to OpenAI API: ${message}`);
    return;
  }

  console.error(`OpenAI API returned ${status}: ${message}`);
}

function parseJsonSafe(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
