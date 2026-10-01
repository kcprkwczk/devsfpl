// 6.3 - Anatomia petli agenta
//
// Agent to nie magia - to jedna petla powtarzana az do skutku:
//   mysl -> narzedzie -> obserwacja -> decyzja
// Dajemy agentowi zadanie wymagajace kilku krokow i wypisujemy KAZDA iteracje.
// Narzedzia to czesc tej petli: model prosi, my wykonujemy, wynik wraca jako
// obserwacja. Wynik narzedzia to dane, nie prawda.
import { client, MODEL } from "../../lib/client.js";
import type OpenAI from "openai";

// Nasze "narzedzia" siegaja do prostych tabel - w realu byloby to API albo baza.
const PRICES: Record<string, number> = { "kubek termiczny": 79, "bidon": 45, "plecak": 199 };

function productPrice(name: string): string {
  const price = PRICES[name.toLowerCase()];
  return price ? `${name}: ${price} zl/szt` : `Nie znam produktu "${name}".`;
}
function applyDiscount(amount: number, percent: number): string {
  return `Po rabacie ${percent}%: ${(amount * (1 - percent / 100)).toFixed(2)} zl`;
}

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "product_price",
      description: "Zwraca cene jednostkowa produktu po nazwie.",
      parameters: {
        type: "object",
        properties: { name: { type: "string" } },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "apply_discount",
      description: "Odejmuje rabat procentowy od podanej kwoty.",
      parameters: {
        type: "object",
        properties: { amount: { type: "number" }, percent: { type: "number" } },
        required: ["amount", "percent"],
      },
    },
  },
];

function runTool(name: string, arg: Record<string, unknown>): string {
  if (name === "product_price") return productPrice(String(arg.name));
  if (name === "apply_discount") return applyDiscount(Number(arg.amount), Number(arg.percent));
  return "nieznane narzedzie";
}

async function main() {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [{
    role: "user",
    content:
      "Klient bierze jeden kubek termiczny i jeden bidon, oba z kodem na 15% rabatu. " +
      "Ile zaplaci lacznie? Korzystaj z narzedzi.",
  }];

  console.log("Zadanie: kubek + bidon, 15% rabatu, ile lacznie?\n");

  for (let iter = 1; iter <= 8; iter++) {
    const res = await client.chat.completions.create({
      model: MODEL, max_tokens: 500, tools: tools, messages: messages,
    });
    const msg = res.choices[0].message;
    messages.push(msg);

    console.log(`--- ITERACJA ${iter} ---`);
    // [MYSL] - to, co model napisal zanim (albo zamiast) siegnal po narzedzie
    if (msg.content && msg.content.trim()) console.log("  [mysl]       " + msg.content.trim());

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      console.log("  [decyzja]    koniec - model ma komplet i nie wola juz narzedzi.");
      break;
    }

    // [NARZEDZIE] + [OBSERWACJA] - akcja i jej wynik wracaja do petli
    for (const tc of msg.tool_calls) {
      if (tc.type !== "function") continue;
      const arg = JSON.parse(tc.function.arguments || "{}") as Record<string, unknown>;
      const result = runTool(tc.function.name, arg);
      console.log(`  [narzedzie]  ${tc.function.name}(${tc.function.arguments})`);
      console.log(`  [obserwacja] ${result}`);
      messages.push({ role: "tool", tool_call_id: tc.id, content: result });
    }
    console.log("  [decyzja]    obserwacja wraca do modelu -> kolejna iteracja\n");
  }

  console.log("\nTa sama petla za kazdym razem: mysl -> narzedzie -> obserwacja -> decyzja.");
  console.log("Kto widzi petle, ten ja kontroluje.");
}

main().catch((e) => { console.error(e); process.exit(1); });
