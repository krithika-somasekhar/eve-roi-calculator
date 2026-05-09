# EVE Health — ROI Calculator

A lead-magnet web calculator for the EVE Health sales team. A prospect enters
five numbers about their current support operations and gets an estimate of
the dollar and time savings they could capture with EVE Platform.

## Run it locally

```bash
npm run dev
# open http://localhost:3000
```

No build step. No backend. Pure HTML + JS + Tailwind CDN + Chart.js.

## Project structure

| File | Purpose |
|---|---|
| `index.html` | Page shell — hero, form, results, chart canvas |
| `app.js` | Form handling, calculation engine, edge cases, Chart.js rendering |
| `styles.css` | Brand color variables (Tailwind handles the rest) |
| `REQUIREMENTS.md` | Locked product spec — every formula and assumption |
| `CLAUDE.md` | Project brief and tech-stack decisions |
| `AGENTS.md` | Roles for the build (PM, engineer, design review) |

## Math

Every assumption lives in a single `ASSUMPTIONS` constant in `app.js` —
edit there to retune the model. The "How this is calculated" panel on the
page mirrors the same numbers so they stay in sync with what users see.

Defensive design: if year-1 ROI would be negative or payback exceeds 5
years, the calculator hides the embarrassing numbers and routes the
prospect to a sales conversation.

## Deployment

Deployed via Vercel — see `/start-4-5` in the parent course for the deploy
walkthrough.
