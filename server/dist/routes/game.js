"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const __1 = require("..");
const socratic_1 = require("../game/socratic");
const sim_1 = require("../game/sim");
exports.router = (0, express_1.Router)();
// Begin preparation for a topic (Stage 1)
exports.router.post("/prepare/start", (req, res) => {
    const { topicId, mode } = req.body;
    if (!topicId || !mode)
        return res.status(400).json({ error: "Missing fields" });
    const topic = __1.db.topics.find((t) => t.id === topicId && t.category === "debate");
    if (!topic)
        return res.status(404).json({ error: "Topic not found" });
    for (const player of __1.db.players.values()) {
        player.profiles[topicId] = (0, socratic_1.createEmptyPrepared)(topicId, mode);
    }
    res.json({ ok: true });
});
// Answer a Socratic question
exports.router.post("/prepare/answer", (req, res) => {
    const { playerId, topicId, key, answer } = req.body;
    const player = __1.db.players.get(playerId);
    if (!player)
        return res.status(404).json({ error: "Player not found" });
    const prepared = player.profiles[topicId];
    if (!prepared)
        return res.status(404).json({ error: "Preparation not started" });
    if (!answer || !key)
        return res.status(400).json({ error: "Missing fields" });
    (0, socratic_1.addAnswer)(prepared, key, answer);
    prepared.complete = (0, socratic_1.isComplete)(prepared);
    res.json({ ok: true });
});
// Get next question for a player
exports.router.get("/prepare/next", (req, res) => {
    const { playerId, topicId } = req.query;
    const player = __1.db.players.get(String(playerId));
    if (!player)
        return res.status(404).json({ error: "Player not found" });
    const prepared = player.profiles[String(topicId)];
    if (!prepared)
        return res.status(404).json({ error: "Preparation not started" });
    const q = (0, socratic_1.nextQuestion)(prepared, player.language);
    res.json({ question: q, complete: prepared.complete });
});
// Start debate and compute results (Stage 2)
exports.router.post("/debate/start", (req, res) => {
    const { topicId } = req.body;
    const players = Array.from(__1.db.players.values()).filter((p) => p.profiles[topicId]?.complete);
    if (players.length < 2)
        return res.status(400).json({ error: "Need at least 2 prepared players" });
    const transcript = (0, sim_1.buildDebateTranscript)(players, topicId);
    const { votes, winnerPlayerId, scoresAwarded } = (0, sim_1.computeVotesAndScores)(players, transcript, topicId);
    // Update points
    for (const [pid, delta] of Object.entries(scoresAwarded)) {
        const pl = __1.db.players.get(pid);
        if (pl)
            pl.points += delta;
    }
    const feedbackByPlayer = {};
    for (const p of players) {
        feedbackByPlayer[p.id] = (0, sim_1.generateFeedback)(p, topicId);
    }
    const result = {
        roundId: Math.random().toString(36).slice(2),
        topicId,
        transcript,
        votes,
        winnerPlayerId,
        scoresAwarded,
        feedbackByPlayer,
    };
    __1.db.rounds.push(result);
    res.json(result);
});
exports.router.get("/scoreboard", (_req, res) => {
    const rows = Array.from(__1.db.players.values()).map((p) => ({ id: p.id, name: p.name, points: p.points }));
    res.json(rows.sort((a, b) => b.points - a.points));
});
