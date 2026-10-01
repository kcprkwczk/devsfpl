# AI with Agent Studio — moduły 6 i 7

Przykłady kodu z dwóch modułów kursu: **wzorce i architektura agentów** (moduł 6)
oraz **kontekst i niezawodność** (moduł 7). To ten sam kod, który widzisz
w odcinkach — sklonuj repo, wpisz swój klucz API i odpalaj.

## Jak odpalić

```bash
npm install
cp .env.example .env      # i wklej swój klucz z platform.openai.com
npm run 6.1               # odpala przykład z odcinka 6.1
```

Każdy przykład ma swój skrypt w `package.json` (`npm run 6.3`, `npm run 7.2` itd.).
Wspólny setup (klucz, klient, model) siedzi w `lib/client.ts` — tam zmienisz model,
jeśli chcesz.

## Moduł 6 — wzorce i architektura agentów

Jaki kształt ma mieć system, zanim zaczniesz go budować.

| Odcinek | Przykład | Skrypt |
|---|---|---|
| 6.1 Workflow czy agent? | ten sam problem raz jako workflow, raz jako agent | `npm run 6.1` |
| 6.2 Pięć wzorców workflow | routing | `npm run 6.2:routing` |
| 6.2 Pięć wzorców workflow | ewaluator–optymalizator | `npm run 6.2:ewaluator` |
| 6.3 Anatomia pętli agenta | żywa pętla: myśl → narzędzie → obserwacja → decyzja | `npm run 6.3` |
| 6.4 Sterowanie i guardraile | limit iteracji + bramka zgody na akcję nieodwracalną | `npm run 6.4` |
| 6.5 Multi-agent | orkiestrator i wykonawcy | `npm run 6.5` |

## Moduł 7 — kontekst i niezawodność

Żeby agentowi można było ufać.

| Odcinek | Przykład | Skrypt |
|---|---|---|
| 7.1 Kontekst jako budżet | licznik tokenów: iteracja 1 vs 10 | `npm run 7.1` |
| 7.1 Kontekst jako budżet | kompakcja rozmowy w trakcie | `npm run 7.1:kompakcja` |
| 7.2 Pamięć agenta | pamięć między sesjami (plik `pamiec.json`) | `npm run 7.2` |
| 7.3 Zmyślanie i grounding | halucynacja wywołana na żywo | `npm run 7.3` |
| 7.3 Zmyślanie i grounding | grounding: wymuszone narzędzie + cytaty | `npm run 7.3:grounding` |
| 7.4 Evale i observability | LLM-jako-sędzia + test regresji | `npm run 7.4` |

## Bonus — livecoding: wpinamy MCP w agenta

Kod z bonusowego odcinka livecodingu leży w [`bonus-livecoding/`](bonus-livecoding/).
Bierzemy prostego agenta w LangChain (jedno ręcznie napisane narzędzie, robi
landing page) i wpinamy serwer MCP Gammy — agent dostaje pięć gotowych narzędzi,
których nie piszemy, i sam dobiera parametry prezentacji z jednego zdania.
To osobny projekt z własnym `package.json` — instrukcja w jego README.

## Zasada przewodnia

> Najprostsza rzecz, która zadziała. Złożoność dokładasz dopiero wtedy,
> gdy problem cię do niej zmusi.
