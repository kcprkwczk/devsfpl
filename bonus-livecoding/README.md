# Bonus — livecoding: wpinamy MCP w agenta

Kod z bonusowego odcinka. Punkt wyjścia to najprostszy agent w LangChain
z jednym ręcznie napisanym narzędziem (`save_index_html` — robi landing page).
W odcinku wpinamy do niego **serwer MCP Gammy** — agent dostaje pięć gotowych
narzędzi (`create_presentation`, `create_document`, `list_themes`, `list_folders`,
`get_generation_status`), których nie piszemy ani linijki, i sam dobiera parametry
prezentacji z jednego zdania po ludzku.

## Jak odpalić

Wymagany Node 24 (`.nvmrc`).

```bash
npm install
cp .env.example .env      # OPENAI_API_KEY + GAMMA_API_KEY
npm run chat
```

Przykładowe prompty:

```
zrób landing page dla kawiarni specialty w Krakowie
zrób prezentację na 5 slajdów o tym, czym jest agent AI, dla programistów
wypisz dostępne motywy w Gamma
```

Landing page ląduje w `index.html`, prezentacja wraca jako link `gamma.app/docs/...`.

## O co chodzi

MCP (Model Context Protocol) to standard: wpinasz serwer, a agent dostaje jego
narzędzia automatycznie. Cała integracja to klient MCP z adresem serwera
i `...mcpTools` w liście narzędzi agenta — resztę, łącznie z doborem parametrów
prezentacji, robi model.
