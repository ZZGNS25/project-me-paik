import { GEMINI_MAX_OUTPUT_TOKENS, GEMINI_MODEL } from "./constants";

type GeminiResponse = {
  error?: { message?: string };
  candidates?: { content?: { parts?: { text?: string }[] } }[];
};

function apiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("서버에 Gemini 키가 없습니다. GEMINI_API_KEY를 설정해 주세요.");
  }
  return key;
}

function extractText(data: GeminiResponse) {
  return (
    data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim() ?? ""
  );
}

function requestBody(prompt: string, maxOutputTokens: number) {
  return JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens,
    },
  });
}

export async function generateGeminiText(
  prompt: string,
  maxOutputTokens = GEMINI_MAX_OUTPUT_TOKENS,
) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey())}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: requestBody(prompt, maxOutputTokens),
  });

  const data = (await response.json()) as GeminiResponse;

  if (!response.ok) {
    throw new Error(data.error?.message || `Gemini API 오류 (${response.status})`);
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
) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey())}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: requestBody(prompt, maxOutputTokens),
  });

  if (!response.ok) {
    const data = (await response.json()) as GeminiResponse;
    throw new Error(data.error?.message || `Gemini API 오류 (${response.status})`);
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

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split(/\r?\n\r?\n/);
          buffer = events.pop() ?? "";

          for (const event of events) {
            const dataLine = event
              .split(/\r?\n/)
              .find((line) => line.startsWith("data:"));
            if (!dataLine) continue;
            const json = dataLine.replace(/^data:\s*/, "");
            if (!json || json === "[DONE]") continue;

            let parsed: GeminiResponse;
            try {
              parsed = JSON.parse(json) as GeminiResponse;
            } catch {
              continue;
            }

            if (parsed.error?.message) {
              throw new Error(parsed.error.message);
            }

            const text =
              parsed.candidates?.[0]?.content?.parts
                ?.map((part) => part.text || "")
                .join("") ?? "";
            if (!text) continue;
            emitted = true;
            controller.enqueue(encoder.encode(text));
          }
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
