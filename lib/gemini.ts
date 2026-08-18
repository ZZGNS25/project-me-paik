import { GEMINI_MAX_OUTPUT_TOKENS, GEMINI_MODEL } from "./constants";

type ThinkingLevel = "minimal" | "low" | "medium";

type GeminiPart = {
  text?: string;
  thought?: boolean;
};

type GeminiResponse = {
  error?: { message?: string };
  candidates?: { content?: { parts?: GeminiPart[] } }[];
};

function apiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("서버에 Gemini 키가 없습니다. GEMINI_API_KEY를 설정해 주세요.");
  }
  return key;
}

function friendlyGeminiError(message: string) {
  const lower = message.toLowerCase();
  if (
    lower.includes("quota") ||
    lower.includes("rate limit") ||
    lower.includes("rate-limit") ||
    lower.includes("resource exhausted") ||
    lower.includes("free_tier")
  ) {
    return "오늘 Gemini 무료 API 한도를 다 썼습니다. Cursor·제미나이 앱 프로와는 별개입니다. 한도를 올리려면 AI Studio에서 이 키 프로젝트에 결제를 연결하세요.";
  }
  if (
    lower.includes("high demand") ||
    lower.includes("overloaded") ||
    lower.includes("unavailable") ||
    lower.includes("try again later")
  ) {
    return "지금 모델이 바빠서 요약을 못 만들었습니다. 잠시 후 다시 눌러 주세요.";
  }
  return message;
}

function candidateText(data: GeminiResponse) {
  return (
    data.candidates?.[0]?.content?.parts
      ?.filter((part) => !part.thought)
      .map((part) => part.text || "")
      .join("") ?? ""
  );
}

function extractText(data: GeminiResponse) {
  return candidateText(data).trim();
}

function requestBody(
  prompt: string,
  maxOutputTokens: number,
  thinkingLevel: ThinkingLevel,
) {
  return JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens,
      thinkingConfig: {
        thinkingLevel,
        includeThoughts: false,
      },
    },
  });
}

export async function generateGeminiText(
  prompt: string,
  maxOutputTokens = GEMINI_MAX_OUTPUT_TOKENS,
  thinkingLevel: ThinkingLevel = "minimal",
) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey())}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: requestBody(prompt, maxOutputTokens, thinkingLevel),
  });

  const data = (await response.json()) as GeminiResponse;

  if (!response.ok) {
    throw new Error(
      friendlyGeminiError(data.error?.message || `Gemini API 오류 (${response.status})`),
    );
  }

  const text = extractText(data);
  if (!text) {
    throw new Error("Gemini 응답이 비어 있습니다. 잠시 후 다시 시도해 주세요.");
  }

  return text;
}

export async function streamGeminiText(
  prompt: string,
  maxOutputTokens = GEMINI_MAX_OUTPUT_TOKENS,
  thinkingLevel: ThinkingLevel = "minimal",
) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey())}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: requestBody(prompt, maxOutputTokens, thinkingLevel),
  });

  if (!response.ok) {
    const data = (await response.json()) as GeminiResponse;
    throw new Error(
      friendlyGeminiError(data.error?.message || `Gemini API 오류 (${response.status})`),
    );
  }

  if (!response.body) {
    throw new Error("Gemini 응답이 비어 있습니다. 잠시 후 다시 시도해 주세요.");
  }

  const upstream = response.body;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buffer = "";
      let emitted = false;

      const emitEvent = (event: string) => {
        const dataLine = event
          .split(/\r?\n/)
          .find((line) => line.startsWith("data:"));
        if (!dataLine) return;
        const json = dataLine.replace(/^data:\s*/, "");
        if (!json || json === "[DONE]") return;

        let parsed: GeminiResponse;
        try {
          parsed = JSON.parse(json) as GeminiResponse;
        } catch {
          return;
        }

        if (parsed.error?.message) {
          throw new Error(friendlyGeminiError(parsed.error.message));
        }

        const text = candidateText(parsed);
        if (!text) return;
        emitted = true;
        controller.enqueue(encoder.encode(text));
      };

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split(/\r?\n\r?\n/);
          buffer = events.pop() ?? "";

          for (const event of events) {
            emitEvent(event);
          }
        }

        buffer += decoder.decode();
        if (buffer.trim()) {
          emitEvent(buffer);
        }

        if (!emitted) {
          throw new Error("Gemini 응답이 비어 있습니다. 잠시 후 다시 시도해 주세요.");
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    },
  });
}
