// 7.4 - Weryfikacja i evale
//
// "Dziala u mnie" to nie dowod. Dokladamy warstwe, ktora sprawdza wynik ZA nas:
//   1) LLM jako sedzia - drugi model, swiezy kontekst, ocenia wedlug rubryki
//   2) evale (testy regresji) - zestaw przypadkow, patrzymy ile na ile przeszlo
import { ask } from "../../lib/client.js";

// SYSTEM POD TESTEM: agent odpowiada na pytanie klienta o zamowienie.
async function agentWsparcia(pytanie: string): Promise<string> {
  return ask(pytanie, {
    system: "Jestes wsparciem sklepu. Odpowiadasz krotko, uprzejmie i konkretnie.",
    maxTokens: 200,
  });
}

// SEDZIA: swiezy model ocenia odpowiedz wedlug rubryki. Zwraca ZALICZONE/ODRZUCONE.
async function sedzia(pytanie: string, odpowiedz: string, rubryka: string): Promise<boolean> {
  const werdykt = await ask(
    `Rubryka: ${rubryka}\n\nPytanie klienta: ${pytanie}\nOdpowiedz agenta: ${odpowiedz}\n\n` +
      `Czy odpowiedz spelnia rubryke? Pierwsza linia: ZALICZONE albo ODRZUCONE.`,
    { model: "gpt-4o", maxTokens: 80 },
  );
  return /ZALICZONE/i.test(werdykt.split("\n")[0]);
}

// ZESTAW EWALUACYJNY: przypadki z oczekiwaniem. To one zamieniaja "chyba lepiej" w liczbe.
const EVALE = [
  { pytanie: "Czy dostane fakture VAT?", rubryka: "Odpowiedz wprost potwierdza mozliwosc otrzymania faktury." },
  { pytanie: "Zamowilem 3 dni temu, gdzie paczka?", rubryka: "Odpowiedz jest empatyczna i proponuje konkretny nastepny krok." },
  { pytanie: "Chce zwrocic buty, sa za male.", rubryka: "Odpowiedz nie odmawia z gory i kieruje do procedury zwrotu." },
];

async function main() {
  // --- Czesc 1: pojedynczy sedzia ---
  console.log("=== 1) LLM jako sedzia ===");
  const p = "Czy mozecie wystawic fakture na firme?";
  const odp = await agentWsparcia(p);
  console.log("Pytanie:  " + p);
  console.log("Agent:    " + odp);
  const ok = await sedzia(p, odp, "Odpowiedz wprost adresuje prosbe o fakture na firme.");
  console.log("Sedzia:   " + (ok ? "ZALICZONE" : "ODRZUCONE"));

  // --- Czesc 2: caly zestaw ewaluacyjny ---
  console.log("\n=== 2) Evale (testy regresji) ===");
  let zaliczone = 0;
  for (const e of EVALE) {
    const a = await agentWsparcia(e.pytanie);
    const wynik = await sedzia(e.pytanie, a, e.rubryka);
    if (wynik) zaliczone++;
    console.log(`  [${wynik ? "OK " : "XXX"}] ${e.pytanie}`);
  }
  console.log(`\nWynik: ${zaliczone}/${EVALE.length} przypadkow przeszlo.`);
  console.log("Zmien prompt albo model, puszcz evale znowu - i zobacz, czy liczba urosla.");
  console.log("Bez tej liczby kazda 'poprawka' to strzal w ciemno.");
}

main().catch((e) => { console.error(e); process.exit(1); });
