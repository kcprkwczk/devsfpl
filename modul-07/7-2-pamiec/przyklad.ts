// 7.2 - Pamiec miedzy sesjami
//
// Kontekst zyje jedna sesje i przepada. Pamiec to zapis na zewnatrz, ktory
// przezywa restart. Najprostsza pamiec, jaka dziala, to nie baza wektorowa -
// to plik. Symulujemy dwie sesje: pierwsza zapisuje fakty, druga startuje od
// zera i wczytuje je z powrotem.
import { ask } from "../../lib/client.js";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const PLIK = join(dirname(fileURLToPath(import.meta.url)), "pamiec.json");

function wczytajPamiec(): Record<string, string> {
  return existsSync(PLIK) ? JSON.parse(readFileSync(PLIK, "utf8")) : {};
}
function zapiszPamiec(p: Record<string, string>) {
  writeFileSync(PLIK, JSON.stringify(p, null, 2), "utf8");
}

// SESJA 1: client sie przedstawia. Agent wylawia fakty warte zapamietania.
async function sesja1() {
  console.log("=== SESJA 1 ===");
  const wypowiedz = "Czesc, jestem Ola. Wole rozmowe na Ty i interesuje mnie Python.";
  console.log("Klient: " + wypowiedz);

  const wyciag = await ask(
    `Z wypowiedzi klienta wyciagnij fakty warte zapamietania na przyszlosc ` +
      `i zwroc TYLKO JSON typu { "imie": "...", "forma": "...", "zainteresowania": "..." }:\n\n"${wypowiedz}"`,
    { maxTokens: 150 },
  );
  const fakty = JSON.parse(wyciag.match(/\{[\s\S]*\}/)![0]);
  zapiszPamiec(fakty);
  console.log("Agent zapisal do pamieci:", fakty);
  console.log("(plik: pamiec.json). Sesja konczy sie - kontekst przepada.\n");
}

// SESJA 2: agent startuje OD ZERA. Zaden kontekst z sesji 1 nie przetrwal -
// ale wczytuje plik i wita klienta po imieniu.
async function sesja2() {
  console.log("=== SESJA 2 (nowy start, pusty kontekst) ===");
  const pamiec = wczytajPamiec();
  console.log("Agent wczytal pamiec:", pamiec);

  const powitanie = await ask(
    `Przywitaj wracajacego klienta. Wiesz o nim: ${JSON.stringify(pamiec)}. ` +
      `Uzyj tych informacji naturalnie, jedno-dwa zdania.`,
    { maxTokens: 120 },
  );
  console.log("\nAgent: " + powitanie);
  console.log("\nStartowal od zera, a pamietal. Kontekst to okno, pamiec to dysk.");
}

async function main() {
  await sesja1();
  await sesja2();
}

main().catch((e) => { console.error(e); process.exit(1); });
