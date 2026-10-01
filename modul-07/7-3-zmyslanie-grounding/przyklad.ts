// 7.3 - Dlaczego agenty zmyslaja
//
// Model zawsze generuje najbardziej prawdopodobna kontynuacje. "Nie wiem"
// rzadko nia jest - dlatego pewnym tonem potrafi podac fakt, ktorego nie ma.
// Pytamy o funkcje, ktora NIE ISTNIEJE, na dwa sposoby:
//   A) zwykly prompt - model chetnie zmysla szczegoly
//   B) ten sam prompt + jedno zdanie o prawie do "nie wiem"
// To pierwsza, darmowa dzwignia przeciw halucynacjom.
import { ask } from "../../lib/client.js";

// Ta funkcja nie istnieje w standardzie JavaScript - swietny wabik na halucynacje.
const PYTANIE =
  "Jak dziala metoda Array.prototype.shuffleStable() w JavaScript? " +
  "Podaj krotki opis i przyklad uzycia.";

async function main() {
  console.log("Pytamy o Array.prototype.shuffleStable() - taka metoda NIE ISTNIEJE.\n");

  console.log("=== A) Zwykly prompt ===");
  const a = await ask(PYTANIE, { maxTokens: 300 });
  console.log(a);
  console.log("\n(Czesto model grzecznie 'wyjasnia' nieistniejaca metode - to jest halucynacja.)\n");

  console.log("=== B) Ten sam prompt + prawo do 'nie wiem' ===");
  const b = await ask(PYTANIE, {
    maxTokens: 300,
    system:
      "Odpowiadasz tylko na podstawie tego, co wiesz na pewno. Jesli funkcja, " +
      "fakt lub API moga nie istniec - powiedz wprost, ze nie masz pewnosci albo " +
      "ze cos nie istnieje. Nie zmyslaj przykladow ani szczegolow.",
  });
  console.log(b);

  console.log("\n---");
  console.log("Ta sama wiedza modelu, inny wynik. Wersja B chetniej przyznaje niewiedze.");
  console.log("To warstwa 1. Warstwa 2 to zrodla, warstwa 3 to weryfikacja - w kolejnych odcinkach.");
  console.log("Uwaga: wynik moze sie roznic miedzy odpaleniami - taka jest natura halucynacji.");
}

main().catch((e) => { console.error(e); process.exit(1); });
