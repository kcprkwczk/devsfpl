// 6.2 - Wzorzec: EWALUATOR-OPTYMALIZATOR
//
// Jeden model tworzy, drugi ocenia wedlug jasnego kryterium i odsyla z uwagami.
// Petla krazy, az wynik przejdzie - albo do limitu iteracji (zabezpieczenie
// przed nieskonczona petla). Dziala tam, gdzie umiesz powiedziec "dobre / zle".
import { client, ask } from "../../lib/client.js";

const TASK = "Napisz jednozdaniowy slogan reklamowy dla aplikacji do nauki jezykow.";
const CRITERION =
  "Dobry slogan: ma maksymalnie 8 slow, jest konkretny (nie ogolnik), " +
  "i nie zawiera slow 'najlepszy', 'rewolucyjny', 'innowacyjny'.";

// Ewaluator zwraca werdykt + uwagi. Prosimy o linie ZALICZONE/ODRZUCONE.
async function evaluate(candidate: string): Promise<{ ok: boolean; notes: string }> {
  const verdict = await ask(
    `${CRITERION}\n\nOcen ten slogan: "${candidate}"\n\n` +
      `Pierwsza linia: ZALICZONE albo ODRZUCONE. Druga linia: krotkie uzasadnienie.`,
    { model: "gpt-4o", maxTokens: 120 },
  );
  return { ok: /ZALICZONE/i.test(verdict.split("\n")[0]), notes: verdict };
}

async function main() {
  let candidate = await ask(TASK, { maxTokens: 60 });
  const LIMIT = 4;

  for (let i = 1; i <= LIMIT; i++) {
    console.log(`\nIteracja ${i}: "${candidate}"`);
    const { ok, notes } = await evaluate(candidate);
    console.log("  werdykt: " + notes.replace(/\n/g, " | "));

    if (ok) {
      console.log(`\nGotowe po ${i} iteracjach. Kryterium bylo jasne - dlatego petla mogla sie zamknac.`);
      return;
    }
    // optymalizator: poprawia na podstawie uwag ewaluatora
    candidate = await ask(
      `${TASK}\n${CRITERION}\n\nTwoj poprzedni slogan: "${candidate}"\n` +
        `Uwagi recenzenta: ${notes}\n\nPopraw. Zwroc TYLKO nowy slogan.`,
      { maxTokens: 60 },
    );
  }
  console.log(`\nLimit ${LIMIT} iteracji. Bez limitu petla moglaby krecic sie w nieskonczonosc.`);
}

void client;
main().catch((e) => { console.error(e); process.exit(1); });
