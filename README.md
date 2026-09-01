# BudgetFlow — Budgeting App + Gemini AI

A professional, static budgeting dashboard designed for GitHub Pages. It includes:

- Income and expense tracking
- Category budgets and spending progress
- Savings goals
- Dashboard metrics
- Local browser storage
- Gemini AI advisor using the Gemini REST API
- Responsive mobile UI

## GitHub Pages setup

Upload `index.html`, `style.css`, and `script.js` to the root of a public GitHub repository, then enable **Settings → Pages → Deploy from a branch → main → / (root)**.

## Gemini setup

1. Create a Gemini API key in Google AI Studio.
2. Open the live BudgetFlow site.
3. Open **AI advisor**.
4. Paste the key into **Gemini API** and click **Save key**.
5. Ask a budgeting question.

The app uses the currently documented `gemini-3.7-flash` `generateContent` endpoint. The key is stored locally in the browser and is never written into the source code.

### Important security note

This is appropriate for a personal/static prototype. A browser-based app cannot keep a Gemini API key secret from a determined user. **Never commit a real API key to GitHub.** For a public multi-user production app, place the Gemini request behind your own server or serverless function and keep the API key in a server-side secret.

## Data

Transactions, budgets and savings goals are saved in `localStorage` in the browser. Clearing site data will remove them.

## Customise

Change colours and layout in `style.css`. Change categories, seed data, or the Gemini model in `script.js`.


## Adding shared Gemini API keys

In `script.js`, find `GEMINI_API_KEYS` and replace the three placeholder strings with your keys. The app will try key 1, then key 2, then key 3 if a request fails.

**Security warning:** because GitHub Pages serves JavaScript to browsers, these keys are not secret. Anyone who visits the site can inspect the code and potentially use the keys. For a public site, a server/serverless proxy with the keys stored as environment secrets is strongly recommended.
