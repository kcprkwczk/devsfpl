// 7.3 - Grounding (RAG w miniaturze + wymuszony cytat)
//
// Nie kazemy modelowi ZNAC odpowiedzi. Podajemy mu material i mowimy: odpowiadaj
// TYLKO z tego, i wskaz, z ktorego zrodla. Wtedy kazda odpowiedz da sie
// zweryfikowac w sekunde - a gdy zrodla milcza, model mowi "nie ma", zamiast zmyslac.
import { ask } from "../../lib/client.js";

// Nasza mala "baza wiedzy". W realu fragmenty wyszukiwalbys wektorowo.
const ZRODLA = [
  "Zwroty przyjmujemy do 30 dni od zakupu, produkt musi byc nieuzywany.",
  "Dostawa kurierem trwa 1-2 dni robocze, paczkomatem 2-3 dni.",
  "Gwarancja na sprzet elektroniczny wynosi 24 miesiace.",
];

// Uproszczone "wyszukiwanie": wybierz fragmenty ze wspolnym slowem. Chodzi o mechanizm.
function znajdzFragmenty(pytanie: string): { nr: number; tekst: string }[] {
  const slowa = pytanie.toLowerCase().split(/\W+/).filter((s) => s.length > 3);
  return ZRODLA
    .map((tekst, i) => ({ nr: i + 1, tekst }))
    .filter(({ tekst }) => slowa.some((s) => tekst.toLowerCase().includes(s)));
}

async function odpowiedzZGroundingiem(pytanie: string): Promise<string> {
  const frag = znajdzFragmenty(pytanie);
  const kontekst = frag.length
    ? frag.map((f) => `[${f.nr}] ${f.tekst}`).join("\n")
    : "(brak pasujacych zrodel)";

  return ask(
    `Zrodla:\n${kontekst}\n\nPytanie: ${pytanie}`,
    {
      maxTokens: 200,
      system:
        "Odpowiadasz WYLACZNIE na podstawie podanych zrodel. Po kazdym fakcie " +
        "podaj numer zrodla w nawiasie kwadratowym, np. [1]. Jesli zrodla nie " +
        "zawieraja odpowiedzi, napisz dokladnie: 'W zrodlach nie ma odpowiedzi na to pytanie.'",
    },
  );
}

async function main() {
  const pytania = [
    "Ile dni mam na zwrot towaru?",          // pokrycie w [1]
    "Jak dlugo trwa dostawa paczkomatem?",   // pokrycie w [2]
    "Czy mozna platnosc rozlozyc na raty?",  // BRAK pokrycia - test odmowy
  ];

  for (const p of pytania) {
    console.log("\nPytanie: " + p);
    console.log("Odpowiedz: " + (await odpowiedzZGroundingiem(p)));
  }

  console.log("\n---");
  console.log("Dwa pierwsze pytania: odpowiedz z numerem zrodla - latwo sprawdzic.");
  console.log("Trzecie: model mowi 'nie ma', zamiast zmyslac. To jest sukces groundingu.");
}

main().catch((e) => { console.error(e); process.exit(1); });
