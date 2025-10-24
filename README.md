### Community Leader Simulation Game (MVP)

This MVP implements a 4-stage game where teens prepare AI agents to represent their views, debate on community topics, and receive feedback. It also includes a forecast mode where closer estimates earn points.

### Prerequisites
- Node.js 18+

### Start a session (local)

1) Install deps and build once:

```bash
cd server && npm install && npm run build
cd ../client && npm install && npm run build
```

2) Run the backend API:

```bash
cd server
npm start
# Server on http://localhost:4000
```

3) Run the frontend in dev or preview:

Dev (hot-reload):
```bash
cd client
npm run dev
# Open the printed URL (e.g., http://localhost:5173)
```

Preview (serves the built bundle):
```bash
cd client
npm run preview
# http://localhost:5173 by default
```

### How to play
1. Stage 0 (Lobby): Create players, choose language (PT/EN), set avatar emoji. Pick a debate topic.
2. Stage 1 (Preparation): Start preparation. For each player, answer the Socratic questions (semicolon or line breaks to separate items). Mode can be Lightning or Deep.
3. Stage 2 (Debate): Start debate to auto-generate transcript and votes using only player-provided content. View feedback and scores; scoreboard updates.
4. Forecast mode: Start a forecast round, enter each player’s estimate (0–100), finish round to see truth, errors, and awarded points.

### Notes
- All data is in-memory; restarting the server resets state.
- The AI is a deterministic heuristic that only uses player-provided content, aligned with the constraint of not injecting external knowledge.

