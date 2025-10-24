import { DebateTranscript, Player, PlayerFeedback } from "./types";

function sentencesFrom(items: string[], max: number): string {
  const use = items.slice(0, max);
  if (use.length === 0) return "";
  return use.map((x) => x.replace(/^[*-]\s*/, "")).join(". ") + ".";
}

function openingStatement(p: Player, topicId: string): string {
  const prof = p.profiles[topicId];
  const intro = prof.summary || sentencesFrom(prof.actions, 2);
  const why = sentencesFrom(prof.mechanisms, 2);
  const outcomes = sentencesFrom(prof.outcomes, 2);
  return [intro, why, outcomes].filter(Boolean).join(" ");
}

function rebuttalAgainst(target: Player, self: Player, topicId: string): string {
  const t = target.profiles[topicId];
  const s = self.profiles[topicId];
  // Heuristic: point a tradeoff of target, restate one of our mechanisms
  const trade = t.tradeoffs[0] || "";
  const mech = s.mechanisms[0] || s.actions[0] || "";
  const metric = s.metrics[0] || "";
  const parts = [] as string[];
  if (trade) parts.push(`I am concerned about: ${trade}`);
  if (mech) parts.push(`My plan focuses on: ${mech}`);
  if (metric) parts.push(`We'll check success by: ${metric}`);
  return parts.join(" ");
}

function closingStatement(p: Player, topicId: string): string {
  const prof = p.profiles[topicId];
  const belief = prof.beliefs[0] || "";
  const metric = prof.metrics[0] || "";
  const trade = prof.tradeoffs[0] || "";
  const parts = [] as string[];
  if (belief) parts.push(`We believe: ${belief}`);
  if (trade) parts.push(`We will monitor risks: ${trade}`);
  if (metric) parts.push(`Measured by: ${metric}`);
  return parts.join(" ");
}

export function buildDebateTranscript(players: Player[], topicId: string): DebateTranscript {
  const transcript: DebateTranscript = [];
  // Opening round
  for (const p of players) {
    transcript.push({ playerId: p.id, text: openingStatement(p, topicId), role: "opening" });
  }
  // Rebuttal: each responds to previous player (simple ring)
  for (let i = 0; i < players.length; i++) {
    const self = players[i];
    const target = players[(i + players.length - 1) % players.length];
    transcript.push({ playerId: self.id, text: rebuttalAgainst(target, self, topicId), role: "rebuttal" });
  }
  // Closing
  for (const p of players) {
    transcript.push({ playerId: p.id, text: closingStatement(p, topicId), role: "closing" });
  }
  return transcript;
}

export function computeVotesAndScores(players: Player[], transcript: DebateTranscript, topicId: string) {
  // Rule-based evaluation using only each player's own completeness/coherence
  const completeness = new Map<string, number>();
  for (const p of players) {
    const prof = p.profiles[topicId];
    let score = 0;
    if (prof.summary) score += 2;
    score += Math.min(3, prof.actions.length);
    score += Math.min(3, prof.mechanisms.length);
    if (prof.metrics.length > 0) score += 1;
    if (prof.tradeoffs.length > 0) score += 1;
    completeness.set(p.id, score);
  }

  // Each agent "votes" for the highest other completeness score
  const votes = [] as { voterPlayerId: string; votedForPlayerId: string; justification: string }[];
  for (const voter of players) {
    let bestId: string | null = null;
    let bestScore = -Infinity;
    for (const candidate of players) {
      if (candidate.id === voter.id) continue;
      const s = completeness.get(candidate.id) || 0;
      if (s > bestScore) {
        bestScore = s;
        bestId = candidate.id;
      }
    }
    const chosen = players.find((p) => p.id === bestId)!;
    const cprof = chosen.profiles[topicId];
    const justificationParts = [] as string[];
    if (cprof.summary) justificationParts.push(`Clear plan: ${cprof.summary}`);
    if (cprof.mechanisms[0]) justificationParts.push(`Reasoning: ${cprof.mechanisms[0]}`);
    if (cprof.metrics[0]) justificationParts.push(`Measurement: ${cprof.metrics[0]}`);
    if (cprof.tradeoffs[0]) justificationParts.push(`Risk awareness: ${cprof.tradeoffs[0]}`);
    votes.push({
      voterPlayerId: voter.id,
      votedForPlayerId: bestId!,
      justification: justificationParts.join(" "),
    });
  }

  // Winner by plurality
  const tally = new Map<string, number>();
  for (const v of votes) tally.set(v.votedForPlayerId, (tally.get(v.votedForPlayerId) || 0) + 1);
  let winnerPlayerId: string | null = null;
  let top = 0;
  for (const [pid, c] of tally) {
    if (c > top) {
      top = c;
      winnerPlayerId = pid;
    } else if (c === top) {
      winnerPlayerId = null; // tie
    }
  }

  const scoresAwarded: Record<string, number> = {};
  for (const p of players) scoresAwarded[p.id] = 0;
  if (winnerPlayerId) scoresAwarded[winnerPlayerId] = 3; // award 3 points to winner

  return { votes, winnerPlayerId, scoresAwarded };
}

export function generateFeedback(player: Player, topicId: string): PlayerFeedback {
  const p = player.profiles[topicId];
  const highlights: string[] = [];
  const improvements: string[] = [];
  if (p.summary) highlights.push("Your summary made the plan clear.");
  if (p.mechanisms.length > 0) highlights.push("You explained why your actions would work.");
  if (p.metrics.length > 0) highlights.push("You proposed a way to measure success.");
  if (p.tradeoffs.length > 0) highlights.push("You acknowledged risks and tradeoffs.");

  if (p.actions.length === 0) improvements.push("Add at least one concrete action.");
  if (p.mechanisms.length === 0) improvements.push("Explain the causal link from action to outcome.");
  if (p.metrics.length === 0) improvements.push("Add a metric to track if it works.");
  if (p.summary.trim().length < 20) improvements.push("Write a 2-3 sentence summary in your own words.");

  return { highlights, improvements };
}
