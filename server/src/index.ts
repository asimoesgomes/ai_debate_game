import express from "express";
import cors from "cors";
import { InMemoryDB, Language, Player, Topic } from "./game/types";
import { router as gameRouter } from "./routes/game";
import { router as forecastRouter } from "./routes/forecast";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// In-memory state
export const db: InMemoryDB = {
  players: new Map(),
  topics: [
    {
      id: "safety",
      category: "debate",
      prompt: {
        en: "How would you improve safety in your community or school?",
        pt: "Como você melhoraria a segurança na sua comunidade ou escola?",
      },
    },
    {
      id: "school-excitement",
      category: "debate",
      prompt: {
        en: "What would you change in your school to make it more exciting and useful?",
        pt: "O que você mudaria na sua escola para torná-la mais empolgante e útil?",
      },
    },
    {
      id: "forecast-school-value",
      category: "forecast",
      prompt: {
        en: "What share (0-100) of kids in your community value school?",
        pt: "Qual a porcentagem (0-100) de jovens na sua comunidade que valorizam a escola?",
      },
      truth: 62,
    },
  ],
  rounds: [],
  forecastRounds: [],
};

app.get("/api/topics", (_req, res) => {
  res.json(db.topics);
});

app.use("/api/game", gameRouter);
app.use("/api/forecast", forecastRouter);

app.post("/api/player", (req, res) => {
  const { name, language, avatar } = req.body as {
    name: string;
    language: Language;
    avatar: { style: "emoji" | "color" | "upload"; value: string };
  };
  if (!name || !language || !avatar) {
    return res.status(400).json({ error: "Missing fields" });
  }
  const id = Math.random().toString(36).slice(2);
  const player: Player = {
    id,
    name,
    language,
    avatar,
    profiles: {},
    points: 0,
  };
  db.players.set(id, player);
  res.json(player);
});

app.get("/api/players", (_req, res) => {
  res.json(Array.from(db.players.values()));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
