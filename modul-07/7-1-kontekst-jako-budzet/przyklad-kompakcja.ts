// 7.1 - Kontekst jako budzet (kompakcja w trakcie sesji)
//
// Budujemy dluga rozmowe i mierzymy tokeny wejsciowe. Potem zwijamy stare tury
// w JEDNO zdanie podsumowania i mierzymy znowu. Widac spadek, a ciaglosc
// rozmowy zostaje - bo podsumowanie niesie to, co wazne.
import { client, MODEL, ask } from "../../lib/client.js";
import type OpenAI from "openai";

type Wiad = OpenAI.Chat.Completions.ChatCompletionMessageParam;

// Ile tokenow wejsciowych zjada obecna historia? Mierzymy jednym tanim strzalem.
async function tokenyWejscia(wiadomosci: Wiad[]): Promise<number> {
  const odp = await client.chat.completions.create({ model: MODEL, max_tokens: 1, messages: wiadomosci });
  return odp.usage?.prompt_tokens ?? 0;
}

// Kompakcja: bierzemy pierwsze `ile` wiadomosci i prosimy model o jedno zdanie streszczenia.
async function skompaktuj(wiadomosci: Wiad[], ile: number): Promise<Wiad[]> {
  const stare = wiadomosci.slice(0, ile);
  const reszta = wiadomosci.slice(ile);
  const doStreszczenia = stare
    .map((m) => `${m.role}: ${typeof m.content === "string" ? m.content : "[...]"}`)
    .join("\n");
  const streszczenie = await ask(
    `Streszcz ten fragment rozmowy w JEDNYM zdaniu, zachowujac fakty potrzebne dalej:\n\n${doStreszczenia}`,
    { maxTokens: 120 },
  );
  // Podsumowanie wchodzi jako pojedyncza notatka na poczatku, reszta zostaje.
  return [
    { role: "user", content: "[Podsumowanie wczesniejszej rozmowy] " + streszczenie },
    { role: "assistant", content: "Zanotowane, kontynuujmy." },
    ...reszta,
  ];
}

async function main() {
  // Zbuduj dluga rozmowe - kazda tura z konkretnym faktem, zeby podsumowanie mialo co niesc.
  const fakty = [
    "Klient nazywa sie Marek.", "Ma abonament Premium.", "Zglosil problem z faktura.",
    "Faktura ma numer FV-2231.", "Kwota to 349 zl.", "Termin platnosci minal wczoraj.",
    "Marek prosi o przesuniecie terminu.", "Zgadzamy sie na 7 dni.",
  ];
  const wiadomosci: Wiad[] = [];
  for (const f of fakty) {
    wiadomosci.push({ role: "user", content: f + " Potwierdz krotko." });
    const odp = await client.chat.completions.create({ model: MODEL, max_tokens: 30, messages: wiadomosci });
    wiadomosci.push(odp.choices[0].message);
  }

  const przed = await tokenyWejscia(wiadomosci);
  console.log(`Historia po ${fakty.length} turach: ${przed} tokenow wejsciowych, ${wiadomosci.length} wiadomosci.`);

  // Kompaktujemy pierwsze 12 wiadomosci (6 tur) w jedno podsumowanie.
  const czyste = await skompaktuj(wiadomosci, 12);
  const po = await tokenyWejscia(czyste);
  console.log(`Po kompakcji:              ${po} tokenow wejsciowych, ${czyste.length} wiadomosci.`);
  console.log(`Oszczednosc: ${przed - po} tokenow (${Math.round((1 - po / przed) * 100)}%).`);

  // Sprawdzamy, ze ciaglosc zostala - model wciaz "pamieta" fakty z podsumowania.
  const test = await client.chat.completions.create({
    model: MODEL, max_tokens: 80,
    messages: [...czyste, { role: "user", content: "Jak sie nazywa klient i o ile dni przesuwamy termin?" }],
  });
  console.log("\nTest ciaglosci: " + (test.choices[0].message.content?.trim() ?? ""));
  console.log("\nSprzataj w trakcie, nie po. Zostaw wniosek, wyrzuc droge do niego.");
}

main().catch((e) => { console.error(e); process.exit(1); });
