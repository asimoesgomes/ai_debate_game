import { Router } from "express";
import { db } from "..";
import { DebateTranscript, PlayerFeedback, PreparedPosition, RoundResult, StageMode } from "../game/types";
import { addAnswer, createEmptyPrepared, nextQuestion, isComplete } from "../game/socratic";
import { buildDebateTranscript, computeVotesAndScores, generateFeedback } from "../game/sim";

export const router = Router();

// Begin preparation for a topic (Stage 1)
router.post("/prepare/start", (req, res) => {
  const { topicId, mode } = req.body as { topicId: string; mode: StageMode };
  if (!topicId || !mode) return res.status(400).json({ error: "Missing fields" });
  const topic = db.topics.find((t) => t.id === topicId && t.category === "debate");
  if (!topic) return res.status(404).json({ error: "Topic not found" });
  for (const player of db.players.values()) {
    player.profiles[topicId] = createEmptyPrepared(topicId, mode);
  }
  res.json({ ok: true });
});

// Answer a Socratic question
router.post("/prepare/answer", (req, res) => {
  const { playerId, topicId, key, answer } = req.body as {
    playerId: string;
    topicId: string;
    key: ReturnType<typeof nextQuestion>["key"] | string;
    answer: string;
  };
  const player = db.players.get(playerId);
  if (!player) return res.status(404).json({ error: "Player not found" });
  const prepared = player.profiles[topicId];
  if (!prepared) return res.status(404).json({ error: "Preparation not started" });
  if (!answer || !key) return res.status(400).json({ error: "Missing fields" });
  addAnswer(prepared, key as any, answer);
  prepared.complete = isComplete(prepared);
  res.json({ ok: true });
});

// Get next question for a player
router.get("/prepare/next", (req, res) => {
  const { playerId, topicId } = req.query as any;
  const player = db.players.get(String(playerId));
  if (!player) return res.status(404).json({ error: "Player not found" });
  const prepared = player.profiles[String(topicId)];
  if (!prepared) return res.status(404).json({ error: "Preparation not started" });
  const q = nextQuestion(prepared, player.language);
  res.json({ question: q, complete: prepared.complete });
});

// Start debate and compute results (Stage 2)
router.post("/debate/start", (req, res) => {
  const { topicId } = req.body as { topicId: string };
  const players = Array.from(db.players.values()).filter((p) => p.profiles[topicId]?.complete);
  if (players.length < 2) return res.status(400).json({ error: "Need at least 2 prepared players" });

  const transcript: DebateTranscript = buildDebateTranscript(players, topicId);
  const { votes, winnerPlayerId, scoresAwarded } = computeVotesAndScores(players, transcript, topicId);

  // Update points
  for (const [pid, delta] of Object.entries(scoresAwarded)) {
    const pl = db.players.get(pid);
    if (pl) pl.points += delta;
  }

  const feedbackByPlayer: Record<string, PlayerFeedback> = {};
  for (const p of players) {
    feedbackByPlayer[p.id] = generateFeedback(p, topicId);
  }

  const result: RoundResult = {
    roundId: Math.random().toString(36).slice(2),
    topicId,
    transcript,
    votes,
    winnerPlayerId,
    scoresAwarded,
    feedbackByPlayer,
  };
  db.rounds.push(result);
  res.json(result);
});

router.get("/scoreboard", (_req, res) => {
  const rows = Array.from(db.players.values()).map((p) => ({ id: p.id, name: p.name, points: p.points }));
  res.json(rows.sort((a, b) => b.points - a.points));
});
