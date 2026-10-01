// 7.1 - Kontekst jako budzet
//
// Model nie ma pamieci. Za kazdym razem dostaje CALA rozmowe od nowa. Prowadzimy
// wiec zwykla rozmowe tura po turze i drukujemy tokeny wejsciowe. Widac, jak
// budzet rosnie sam - bo z kazda tura wleczemy coraz dluzsza historie.
import { client, MODEL } from "../../lib/client.js";
import type OpenAI from "openai";

async function main() {
  const wiadomosci: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
  const tematy = [
    "Zaczynamy krotka opowiesc o robocie. Napisz pierwsze zdanie.",
    "Dopisz drugie zdanie.", "Dopisz trzecie zdanie.", "I czwarte.",
    "Piate zdanie.", "Szoste.", "Siodme.", "Osme.", "Dziewiate.", "Ostatnie, dziesiate.",
  ];

  console.log("tura | tokeny_wej | tokeny_wyj | (wejscie to CALA dotychczasowa rozmowa)");
  console.log("-----+------------+------------+-------------------------------------------");

  let pierwsza = 0, ostatnia = 0;
  for (let t = 0; t < tematy.length; t++) {
    wiadomosci.push({ role: "user", content: tematy[t] });
    const odp = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 60,
      messages: wiadomosci,
    });
    wiadomosci.push(odp.choices[0].message);

    const wej = odp.usage?.prompt_tokens ?? 0;
    if (t === 0) pierwsza = wej;
    ostatnia = wej;
    console.log(
      ` ${String(t + 1).padStart(2)}  |   ${String(wej).padStart(6)}   |   ` +
        `${String(odp.usage?.completion_tokens ?? 0).padStart(6)}   |`,
    );
  }

  console.log("\nTura 1 kosztowala " + pierwsza + " tokenow wejsciowych.");
  console.log("Tura 10 to " + ostatnia + " tokenow - kilka razy wiecej, a nic madrzejszego sie nie dzialo.");
  console.log("Tyle wlasnie placisz przy KAZDEJ kolejnej turze, bo cala historia leci od nowa.");
  console.log("\nKontekst to budzet, nie tasma. Zarzadzanie nim to temat kolejnych odcinkow.");
}

main().catch((e) => { console.error(e); process.exit(1); });
