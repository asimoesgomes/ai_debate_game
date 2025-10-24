"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const __1 = require("..");
exports.router = (0, express_1.Router)();
exports.router.post("/start", (req, res) => {
    const { topicId } = req.body;
    const topic = __1.db.topics.find((t) => t.id === topicId && t.category === "forecast");
    if (!topic || typeof topic.truth !== "number")
        return res.status(404).json({ error: "Forecast topic not found" });
    const roundId = Math.random().toString(36).slice(2);
    __1.db.forecastRounds.push({ roundId, topicId, estimates: {}, truth: topic.truth, distances: {}, scoresAwarded: {} });
    res.json({ roundId, prompt: topic.prompt });
});
exports.router.post("/submit", (req, res) => {
    const { roundId, playerId, estimate } = req.body;
    const round = __1.db.forecastRounds.find((r) => r.roundId === roundId);
    if (!round)
        return res.status(404).json({ error: "Round not found" });
    if (!__1.db.players.has(playerId))
        return res.status(404).json({ error: "Player not found" });
    const val = Math.max(0, Math.min(100, Math.round(estimate)));
    round.estimates[playerId] = val;
    res.json({ ok: true });
});
exports.router.post("/finish", (req, res) => {
    const { roundId } = req.body;
    const round = __1.db.forecastRounds.find((r) => r.roundId === roundId);
    if (!round)
        return res.status(404).json({ error: "Round not found" });
    // Compute distances and award points (closer gets 2 points)
    const distances = {};
    const scoresAwarded = {};
    let bestId = null;
    let bestDist = Infinity;
    for (const [pid, est] of Object.entries(round.estimates)) {
        const d = Math.abs(est - round.truth);
        distances[pid] = d;
        if (d < bestDist) {
            bestDist = d;
            bestId = pid;
        }
        else if (d === bestDist) {
            bestId = null; // tie -> no single winner
        }
    }
    for (const pid of Object.keys(round.estimates))
        scoresAwarded[pid] = 0;
    if (bestId)
        scoresAwarded[bestId] = 2;
    // Update players' points
    for (const [pid, delta] of Object.entries(scoresAwarded)) {
        const p = __1.db.players.get(pid);
        if (p)
            p.points += delta;
    }
    round.distances = distances;
    round.scoresAwarded = scoresAwarded;
    res.json(round);
});
