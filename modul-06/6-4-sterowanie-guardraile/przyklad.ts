// 6.4 - Sterowanie i guardraile
//
// Petla bez hamulcow kreci sie, az skonczy sie budzet - albo zrobi cos
// nieodwracalnego. Zakladamy hamulce:
//   - LIMIT ITERACJI: twardy sufit, petla nie moze krecic sie w nieskonczonosc
//   - BRAMKA ZGODY: akcje nieodwracalne (wyslanie maila) ida przez potwierdzenie
//     czlowieka; akcje odwracalne (odczyt) leca same
import { client, MODEL } from "../../lib/client.js";
import type OpenAI from "openai";

const ITERATION_LIMIT = 6;     // twardy sufit
const AUTO_APPROVE = true;     // w realu tu pyta czlowiek: tak/nie

// Klasyfikacja akcji: ktore narzedzia sa nieodwracalne i wymagaja bramki.
const IRREVERSIBLE = new Set(["send_email"]);

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "order_status",
      description: "Zwraca status zamowienia po numerze. Akcja odwracalna (tylko odczyt).",
      parameters: {
        type: "object",
        properties: { order_id: { type: "string" } },
        required: ["order_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_email",
      description: "Wysyla maila do klienta. Akcja NIEODWRACALNA.",
      parameters: {
        type: "object",
        properties: { to: { type: "string" }, body: { type: "string" } },
        required: ["to", "body"],
      },
    },
  },
];

function runTool(name: string, arg: Record<string, unknown>): string {
  if (name === "order_status") return `Zamowienie ${arg.order_id}: spakowane, wysylka jutro.`;
  if (name === "send_email") return `Mail do ${arg.to} wyslany.`;
  return "nieznane narzedzie";
}

async function main() {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [{
    role: "user",
    content: "Sprawdz status zamowienia ZK-9001 i wyslij klientowi (klient@example.com) krotkie podsumowanie mailem.",
  }];

  console.log(`Hamulce: limit ${ITERATION_LIMIT} iteracji, bramka na akcje nieodwracalne.\n`);

  for (let iter = 1; iter <= ITERATION_LIMIT; iter++) {
    const res = await client.chat.completions.create({
      model: MODEL, max_tokens: 500, tools: tools, messages: messages,
    });
    const msg = res.choices[0].message;
    messages.push(msg);
    console.log(`--- iteracja ${iter}/${ITERATION_LIMIT} ---`);

    // WARUNEK STOPU: model przestal wolac narzedzia -> koniec pracy
    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      console.log("  [stop] agent skonczyl: " + (msg.content?.trim() ?? ""));
      break;
    }

    for (const tc of msg.tool_calls) {
      if (tc.type !== "function") continue;
      const arg = JSON.parse(tc.function.arguments || "{}") as Record<string, unknown>;

      // BRAMKA ZGODY: akcja nieodwracalna czeka na potwierdzenie czlowieka
      if (IRREVERSIBLE.has(tc.function.name)) {
        console.log(`  [BRAMKA] agent chce wykonac akcje NIEODWRACALNA: ${tc.function.name}(${tc.function.arguments})`);
        if (!AUTO_APPROVE) {
          console.log("  [BRAMKA] czlowiek odmowil - akcja NIE wykonana.");
          messages.push({ role: "tool", tool_call_id: tc.id, content: "Odmowa uzytkownika. Nie wysylaj." });
          continue;
        }
        console.log("  [BRAMKA] czlowiek zatwierdzil -> wykonuje.");
      } else {
        console.log(`  [auto]   akcja odwracalna: ${tc.function.name}(${tc.function.arguments})`);
      }
      messages.push({ role: "tool", tool_call_id: tc.id, content: runTool(tc.function.name, arg) });
    }

    if (iter === ITERATION_LIMIT) {
      console.log(`\n  [LIMIT] osiagnieto sufit ${ITERATION_LIMIT} iteracji - przerywam, choc agent nie zglosil konca.`);
    }
  }

  console.log("\nOdczyt poszedl sam, mail przeszedl przez bramke, a licznik pilnowal, by nic sie nie urwalo.");
  console.log("Cztery hamulce: limit, budzet, warunek stopu, zgoda na to, co nieodwracalne.");
}

main().catch((e) => { console.error(e); process.exit(1); });
