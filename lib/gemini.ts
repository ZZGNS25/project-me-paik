import { GEMINI_MAX_OUTPUT_TOKENS, GEMINI_MODEL } from "./constants";

export async function generateGeminiText(apiKey: string, prompt: string) {
  if (!apiKey.trim()) {
    throw new Error("Gemini API 키가 없습니다.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
      },
    }),
  });

  const data = (await response.json()) as {
    error?: { message?: string };
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  if (!response.ok) {
    throw new Error(data.error?.message || `Gemini API 오류 (${response.status})`);
  }

  const text = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini 응답이 비어 있습니다. 잠시 후 다시 시도해 주세요.");
  }

  return text;
}
