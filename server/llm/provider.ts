import type { JsonLLM } from "./types";

function getEnv(name: string): string | undefined {
  const value = process.env[name];
  return value?.trim() || undefined;
}

function withSchemaHint(prompt: string, schema?: Record<string, unknown>): string {
  if (!schema) return prompt;
  return `${prompt}\n\nReturn JSON that matches this schema exactly:\n${JSON.stringify(schema, null, 2)}`;
}

function extractGeminiText(data: any): string {
  return (data?.candidates?.[0]?.content?.parts ?? [])
    .map((p: any) => p?.text ?? "")
    .join("")
    .trim();
}

function extractOpenAIText(data: any): string {
  return data?.choices?.[0]?.message?.content?.trim?.() ?? "";
}

function extractAnthropicText(data: any): string {
  return (data?.content ?? [])
    .map((part: any) => part?.text ?? "")
    .join("")
    .trim();
}

export function createLLMClient(): JsonLLM {
  const provider = (getEnv("LLM_PROVIDER") ?? "gemini").toLowerCase();
  const apiKey = getEnv("LLM_API_KEY");
  const model =
    getEnv("LLM_MODEL") ??
    (provider === "openai" ? "gpt-4o-mini" : provider === "anthropic" ? "claude-3-5-sonnet-latest" : "gemini-2.5-flash");
  const baseUrl =
    getEnv("LLM_BASE_URL") ??
    getEnv("LLM_URL") ??
    (provider === "openai"
      ? "https://api.openai.com/v1"
      : provider === "anthropic"
        ? "https://api.anthropic.com"
        : "");

  if (!apiKey) throw new Error("LLM_API_KEY is required");

  return {
    async generateJson(prompt: string, schema?: Record<string, unknown>) {
      const finalPrompt = withSchemaHint(prompt, schema);

      if (provider === "gemini") {
        const url = new URL(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`
        );
        url.searchParams.set("key", apiKey);

        const res = await fetch(url.toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.2,
            },
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          console.error("Gemini raw response:", JSON.stringify(data, null, 2));
          throw new Error(`Gemini request failed: ${res.status}`);
        }

        const text = extractGeminiText(data);
        if (!text) {
          console.error("Gemini raw response:", JSON.stringify(data, null, 2));
          return "";
        }

        return text;
      }

      if (provider === "openai") {
        const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;

        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            temperature: 0.2,
            response_format: { type: "json_object" },
            messages: [{ role: "user", content: finalPrompt }],
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          console.error("OpenAI raw response:", JSON.stringify(data, null, 2));
          throw new Error(`OpenAI request failed: ${res.status}`);
        }

        return extractOpenAIText(data);
      }

      if (provider === "anthropic") {
        const url = `${baseUrl.replace(/\/$/, "")}/v1/messages`;

        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model,
            max_tokens: 1024,
            temperature: 0.2,
            system: "Return JSON only.",
            messages: [{ role: "user", content: finalPrompt }],
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          console.error("Anthropic raw response:", JSON.stringify(data, null, 2));
          throw new Error(`Anthropic request failed: ${res.status}`);
        }

        return extractAnthropicText(data);
      }

      throw new Error(`Unsupported LLM_PROVIDER: ${provider}`);
    },
  };
}