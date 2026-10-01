// 6.5 - Multi-agent: wzorzec SUPERVISOR (orkiestrator-wykonawcy)
//
// Orkiestrator podejmuje jedna decyzje: na jakie sekcje podzielic material.
// Potem wykonawcy pisza swoje sekcje ROWNOLEGLE - kazdy zna tylko swoj kawalek,
// zaden nie wie o pozostalych. Na koncu orkiestrator sklada calosc.
//
// To ta sama idea, co orkiestrator-wykonawcy z 6.2, tylko tu kazdy krok to
// osobne "spojrzenie" modelu z wlasnym, waskim kontekstem.
import { client, ask } from "../../lib/client.js";

const TOPIC = "dlaczego warto robic kopie zapasowe";

// Orkiestrator: rozbija zadanie. Prosimy o czysta liste sekcji, po jednej w linii.
async function planSections(topic: string): Promise<string[]> {
  const response = await ask(
    `Zaplanuj krotki material na temat "${topic}". ` +
      `Podaj 3 tytuly sekcji, kazdy w osobnej linii, bez numeracji i bez komentarza.`,
    { maxTokens: 120 },
  );
  return response.split("\n").map((s) => s.replace(/^[-*\d.\s]+/, "").trim()).filter(Boolean).slice(0, 3);
}

// Wykonawca: pisze JEDNA sekcje. Dostaje tylko swoj tytul - nic o reszcie.
async function writeSection(topic: string, title: string): Promise<string> {
  const text = await ask(
    `Napisz jeden zwiezly akapit (3-4 zdania) do materialu o "${topic}", ` +
      `do sekcji zatytulowanej "${title}". Sam akapit, bez tytulu.`,
    { maxTokens: 220 },
  );
  return `## ${title}\n${text}`;
}

async function main() {
  console.log(`Orkiestrator planuje material: "${TOPIC}"\n`);
  const sections = await planSections(TOPIC);
  console.log("Podzial na sekcje (jedna decyzja orkiestratora):");
  sections.forEach((s) => console.log("  - " + s));

  console.log("\nWykonawcy pisza rownolegle (kazdy zna tylko swoj kawalek)...");
  const written = await Promise.all(sections.map((s) => writeSection(TOPIC, s)));

  console.log("\n=== ORKIESTRATOR SKLEJA CALOSC ===\n");
  console.log(written.join("\n\n"));

  console.log("\n\nCzterech modeli, jeden material. Wykonawcy nie wiedzieli o sobie nawzajem -");
  console.log("to orkiestrator trzymal caly obraz. Kazdy dostal waski, tani kontekst.");
}

void client;
main().catch((e) => { console.error(e); process.exit(1); });
