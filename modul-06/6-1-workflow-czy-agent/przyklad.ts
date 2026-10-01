// 6.1 - Workflow czy agent?
//
// Ten sam problem rozwiazany dwa razy:
//   A) workflow - dwa ustalone kroki, jedno po drugim
//   B) agent    - dajemy modelowi narzedzia i wolnosc, niech sam kombinuje
//
// Na koncu porownujemy liczbe wywolan modelu i zuzycie tokenow. Puenta:
// dla zadania, ktore da sie rozpisac z gory, agent tylko przepala budzet.
import { client, MODEL } from "../../lib/client.js";
import type OpenAI from "openai";

// Model czasem opakowuje JSON w ```json ... ``` albo komentarz. Wyluskaj obiekt.
function parseJson<T>(text: string): T {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("Nie znalazlem JSON w odpowiedzi:\n" + text);
  return JSON.parse(m[0]) as T;
}

function textOf(response: OpenAI.Chat.Completions.ChatCompletion): string {
  return response.choices[0]?.message?.content ?? "";
}

// Zadanie: z tego maila wyciagnij dane i zaklasyfikuj sprawe.
const MAIL = `
Dzien dobry, nazywam sie Anna Kowalska. Wczoraj kupilam u Panstwa ekspres do
kawy (zamowienie ZK-4471) i dzis rano nie chce sie wlaczyc - dioda miga na
czerwono. Prosze o pilna pomoc, bo to prezent na jutro. Mail: anna.k@example.com
`;

// Prosty licznik zuzycia, wspolny dla obu wersji.
function counter() {
  let calls = 0, input = 0, output = 0;
  return {
    add(u?: { prompt_tokens: number; completion_tokens: number }) {
      calls++;
      if (u) { input += u.prompt_tokens; output += u.completion_tokens; }
    },
    summary() {
      return { calls, inputTokens: input, outputTokens: output, totalTokens: input + output };
    },
  };
}

// ---------------------------------------------------------------------------
// A) WORKFLOW - kolejnosc krokow jest w kodzie, nie w glowie modelu.
// ---------------------------------------------------------------------------
async function workflow() {
  const c = counter();

  // Krok 1: wyciagnij dane. Prosimy wprost o JSON - kolejnosc krokow jest w kodzie.
  const step1 = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 512,
    messages: [{
      role: "user",
      content: `Wyciagnij dane z maila i zwroc TYLKO JSON o polach ` +
        `imie, email, numer_zamowienia, problem:\n${MAIL}`,
    }],
  });
  c.add(step1.usage);
  const data = parseJson<{ problem: string; [k: string]: string }>(textOf(step1));

  // Krok 2: zaklasyfikuj. Drugi ustalony krok, znowu przewidywalnie.
  const step2 = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 256,
    messages: [{
      role: "user",
      content: `Zaklasyfikuj sprawe "${data.problem}". Zwroc TYLKO JSON: ` +
        `{ "kategoria": "zwrot|usterka|pytanie|inne", "priorytet": "niski|sredni|wysoki" }`,
    }],
  });
  c.add(step2.usage);
  const classification = parseJson<Record<string, string>>(textOf(step2));

  return { wynik: { ...data, ...classification }, koszt: c.summary() };
}

// ---------------------------------------------------------------------------
// B) AGENT - dajemy narzedzia i wolnosc. Model sam decyduje, co i kiedy.
// ---------------------------------------------------------------------------
const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "save_field",
      description: "Zapisz jedno wyciagniete pole (imie, email, numer_zamowienia, problem).",
      parameters: {
        type: "object",
        properties: { name: { type: "string" }, value: { type: "string" } },
        required: ["name", "value"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "classify_and_finish",
      description: "Gdy masz komplet pol, zaklasyfikuj sprawe i zakoncz.",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", enum: ["zwrot", "usterka", "pytanie", "inne"] },
          priority: { type: "string", enum: ["niski", "sredni", "wysoki"] },
        },
        required: ["category", "priority"],
      },
    },
  },
];

async function agent() {
  const c = counter();
  const collected: Record<string, string> = {};
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "user", content: `Obsluz to zgloszenie - wyciagnij dane i zaklasyfikuj:\n${MAIL}` },
  ];

  // Recznie prowadzona petla agenta. Kreci sie, dopoki model wola narzedzia.
  for (let i = 0; i < 10; i++) {
    const response = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 512,
      tools: TOOLS,
      messages: messages,
    });
    c.add(response.usage);
    const message = response.choices[0].message;
    messages.push(message);

    if (!message.tool_calls || message.tool_calls.length === 0) break;

    for (const tc of message.tool_calls) {
      if (tc.type !== "function") continue;
      const arg = JSON.parse(tc.function.arguments || "{}");
      if (tc.function.name === "save_field") {
        collected[arg.name] = arg.value;
        messages.push({ role: "tool", tool_call_id: tc.id, content: "zapisano" });
      } else if (tc.function.name === "classify_and_finish") {
        Object.assign(collected, arg);
        messages.push({ role: "tool", tool_call_id: tc.id, content: "gotowe" });
      }
    }
    if (collected.category) break; // model zakonczyl
  }

  return { wynik: collected, koszt: c.summary() };
}

// ---------------------------------------------------------------------------
async function main() {
  console.log("=== A) WORKFLOW - dwa ustalone kroki ===");
  const a = await workflow();
  console.log(a.wynik);
  console.log("koszt:", a.koszt, "\n");

  console.log("=== B) AGENT - petla z narzedziami ===");
  const b = await agent();
  console.log(b.wynik);
  console.log("koszt:", b.koszt, "\n");

  console.log("=== POROWNANIE ===");
  console.log(`Workflow: ${a.koszt.calls} wywolania, ${a.koszt.totalTokens} tokenow`);
  console.log(`Agent:    ${b.koszt.calls} wywolan,   ${b.koszt.totalTokens} tokenow`);
  console.log("\nTen sam wynik. Workflow tanszy i za kazdym razem identyczny.");
  console.log("Agent nic tu nie dodal - zadanie dalo sie rozpisac z gory.");
}

main().catch((e) => { console.error(e); process.exit(1); });
