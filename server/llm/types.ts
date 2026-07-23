export interface JsonLLM {
  generateJson(prompt: string, schema?: Record<string, unknown>): Promise<string>;
}