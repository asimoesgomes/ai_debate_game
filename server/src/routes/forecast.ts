import { Router } from "express";
import { db } from "..";

export const router = Router();

router.post("/start", (req, res) => {
  const { topicId } = req.body as { topicId: string };
  const topic = db.topics.find((t) => t.id === topicId && t.category === "forecast");
  if (!topic || typeof topic.truth !== "number") return res.status(404).json({ error: "Forecast topic not found" });
  const roundId = Math.random().toString(36).slice(2);
  db.forecastRounds.push({ roundId, topicId, estimates: {}, truth: topic.truth, distances: {}, scoresAwarded: {} });
  res.json({ roundId, prompt: topic.prompt });
});

router.post("/submit", (req, res) => {
  const { roundId, playerId, estimate } = req.body as { roundId: string; playerId: string; estimate: number };
  const round = db.forecastRounds.find((r) => r.roundId === roundId);
  if (!round) return res.status(404).json({ error: "Round not found" });
  if (!db.players.has(playerId)) return res.status(404).json({ error: "Player not found" });
  const val = Math.max(0, Math.min(100, Math.round(estimate)));
  round.estimates[playerId] = val;
  res.json({ ok: true });
});

router.post("/finish", (req, res) => {
  const { roundId } = req.body as { roundId: string };
  const round = db.forecastRounds.find((r) => r.roundId === roundId);
  if (!round) return res.status(404).json({ error: "Round not found" });
  // Compute distances and award points (closer gets 2 points)
  const distances: Record<string, number> = {};
  const scoresAwarded: Record<string, number> = {};
  let bestId: string | null = null;
  let bestDist = Infinity;
  for (const [pid, est] of Object.entries(round.estimates)) {
    const d = Math.abs(est - round.truth);
    distances[pid] = d;
    if (d < bestDist) {
      bestDist = d;
      bestId = pid;
    } else if (d === bestDist) {
      bestId = null; // tie -> no single winner
    }
  }
  for (const pid of Object.keys(round.estimates)) scoresAwarded[pid] = 0;
  if (bestId) scoresAwarded[bestId] = 2;

  // Update players' points
  for (const [pid, delta] of Object.entries(scoresAwarded)) {
    const p = db.players.get(pid);
    if (p) p.points += delta;
  }

  round.distances = distances;
  round.scoresAwarded = scoresAwarded;
  res.json(round);
});
