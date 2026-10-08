# Tech Day 2026 — Spot the Scam

Free phishing-awareness training you can host on **GitHub Pages**.  
No database server — scores and feedback use the browser, with an optional free **Google Sheet** for a shared leaderboard.

## What you get

| Feature | How it works |
|--------|----------------|
| **Name / ID at start** | Players enter name + participant ID before training |
| **Leaderboard** | Quiz + scenario clues + videos → ranked score |
| **Feedback form** | Stars, usefulness, suggestions |
| **Progress tracking** | Per-user completion, scores, engagement |
| **Videos & animations** | Short YouTube clips + on-page animation demo |
| **Instant alerts** | Toast tips when a quiz answer is wrong (or right) |

## Quick start (local)

1. Open `index.html` in a browser (or use any static server).
2. Enter a name and ID → start training.
3. Without Sheet setup, the leaderboard is **this device only** (still useful for demos).

## Host free on GitHub Pages

1. Create a new GitHub repository (public is fine for Pages).
2. Upload / push this project to the repo (keep `index.html` at the root).
3. On GitHub: **Settings → Pages → Source: Deploy from a branch → `main` / `/ (root)`**.
4. After a minute, open:  
   `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

### Push from this folder (once Git is set up)

```bash
git init
git add .
git commit -m "Tech Day 2026 phishing awareness training"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Then enable Pages as above.

## Shared leaderboard (no database)

Uses a **free Google Sheet + Apps Script** (not a paid DB).

1. Create a Google Sheet. Add three tabs: `Leaderboard`, `Feedback`, `Progress` (or let the script create them).
2. **Extensions → Apps Script** → paste everything from [`sheets-apps-script.gs`](sheets-apps-script.gs) → Save.
3. **Deploy → New deployment → Web app**  
   - Execute as: **Me**  
   - Who has access: **Anyone**
4. Copy the Web App URL into [`js/config.js`](js/config.js):

```js
SCRIPT_URL: 'https://script.google.com/macros/s/XXXX/exec',
```

5. Redeploy / refresh the site. Scores and feedback sync to the Sheet; the Leaderboard page loads shared ranks.

Organizers can monitor participants in the **Progress** and **Leaderboard** tabs of the Sheet.

## File map

```
index.html          Home + name/ID gate
quiz.html           Trivia + live alerts
simulation.html     Interactive scam scenarios
videos.html         Awareness videos + animation
leaderboard.html    Rankings
progress.html       Personal tracking
feedback.html       Feedback form
js/config.js        SCRIPT_URL + video IDs
js/app.js           Session, scores, Sheet sync
sheets-apps-script.gs   Google Apps Script backend
styles.css
```

## Scoring (leaderboard)

- Quiz best score → up to **100** pts  
- Scenario clues (24) → up to **100** pts  
- All scenes cleared → **+20**  
- Videos marked watched → up to **+15**

## Notes

- Educational / fictional demos only.
- YouTube embeds need network access.
- `SCRIPT_URL` left blank = local/demo mode (still fully playable).
