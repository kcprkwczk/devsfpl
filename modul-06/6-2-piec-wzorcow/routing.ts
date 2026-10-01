// 6.2 - Wzorzec: ROUTING
//
// Najpierw klasyfikujemy pytanie, potem kierujemy je do wlasciwej sciezki.
// Proste pytanie -> tani model i krotka odpowiedz. Trudne -> mocniejszy model
// i wiecej miejsca. Kolejnosc i rozgalezienie sa w kodzie, nie w glowie modelu.
import { client, ask } from "../../lib/client.js";

type Category = "proste" | "techniczne" | "reklamacja";

// Krok 1: router. Jedno tanie wywolanie, ktore tylko wybiera sciezke.
async function classify(question: string): Promise<Category> {
  const answer = await ask(
    `Zaklasyfikuj pytanie klienta do jednej kategorii i odpowiedz JEDNYM slowem ` +
      `(proste | techniczne | reklamacja):\n\n"${question}"`,
    { model: "gpt-4o-mini", maxTokens: 16 },
  );
  const normalized = answer.toLowerCase();
  if (normalized.includes("techn")) return "techniczne";
  if (normalized.includes("rekl")) return "reklamacja";
  return "proste";
}

// Krok 2: wyspecjalizowane sciezki. Kazda ma inny model, system i budzet.
const ROUTES: Record<Category, { model: string; system: string; maxTokens: number }> = {
  proste: {
    model: "gpt-4o-mini",
    system: "Odpowiadasz krotko i uprzejmie. Maksymalnie dwa zdania.",
    maxTokens: 200,
  },
  techniczne: {
    model: "gpt-4o",
    system: "Jestes inzynierem wsparcia. Podaj konkretne kroki do rozwiazania problemu.",
    maxTokens: 600,
  },
  reklamacja: {
    model: "gpt-4o",
    system: "Obslugujesz reklamacje z empatia. Uznaj problem i zaproponuj nastepny krok.",
    maxTokens: 400,
  },
};

async function handle(question: string) {
  const category = await classify(question);
  const route = ROUTES[category];
  const answer = await ask(question, { model: route.model, system: route.system, maxTokens: route.maxTokens });
  return { kategoria: category, model: route.model, odpowiedz: answer };
}

async function main() {
  const questions = [
    "O ktorej macie otwarte w soboty?",
    "Aplikacja wywala blad 500 przy logowaniu przez Google, co robic?",
    "Zamowilem laptopa, przyszedl z peknietym ekranem. Chce zwrot.",
  ];
  for (const question of questions) {
    const result = await handle(question);
    console.log(`\n[${result.kategoria} -> ${result.model}]  ${question}`);
    console.log("  " + result.odpowiedz.replace(/\n/g, "\n  "));
  }
  console.log("\nRouter raz wybral sciezke - dalej kazde pytanie poszlo tam, gdzie trzeba.");
}

// client importujemy, zeby lib sprawdzil klucz zanim polecimy
void client;
main().catch((e) => { console.error(e); process.exit(1); });
