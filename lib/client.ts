// Wspolny setup dla wszystkich przykladow: wczytuje klucz z .env i tworzy klienta.
// Bez zaleznosci na dotenv - prosty parser wystarczy.
import OpenAI from "openai";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  if (process.env.OPENAI_API_KEY) return;
  try {
    const text = readFileSync(join(here, "..", ".env"), "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (m) process.env[m[1]] ??= m[2];
    }
  } catch {
    // brak .env - klucz musi byc w srodowisku
  }
}

loadEnv();

if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes("...")) {
  console.error("Brak klucza. Skopiuj .env.example do .env i wklej OPENAI_API_KEY.");
  process.exit(1);
}

// Do dem wystarczy szybki i tani model. Zmien na "gpt-4o", gdy chcesz wyzsza
// jakosc. Model musi wspierac tool calling - wszystkie z rodziny gpt-4o wspieraja.
export const MODEL = "gpt-4o-mini";

export const client = new OpenAI();

// Skrot: jeden strzal, zwraca sam tekst odpowiedzi.
export async function ask(
  prompt: string,
  options: { system?: string; model?: string; maxTokens?: number } = {},
): Promise<string> {
  const res = await client.chat.completions.create({
    model: options.model ?? MODEL,
    max_tokens: options.maxTokens ?? 1024,
    messages: [
      ...(options.system ? [{ role: "system" as const, content: options.system }] : []),
      { role: "user" as const, content: prompt },
    ],
  });
  return res.choices[0]?.message?.content?.trim() ?? "";
}
