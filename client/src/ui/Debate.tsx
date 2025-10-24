import React, { useState } from 'react'
import type { Player } from './App'

type Vote = { voterPlayerId: string; votedForPlayerId: string; justification: string }

type RoundResult = {
  roundId: string;
  topicId: string;
  transcript: { playerId: string; text: string; role: 'opening' | 'rebuttal' | 'closing' }[];
  votes: Vote[];
  winnerPlayerId: string | null;
  scoresAwarded: Record<string, number>;
  feedbackByPlayer: Record<string, { highlights: string[]; improvements: string[] }>;
}

export function Debate({ apiBase, players, topicId }: { apiBase: string; players: Player[]; topicId: string }) {
  const [result, setResult] = useState<RoundResult | null>(null)

  async function startDebate() {
    const res = await fetch(`${apiBase}/api/game/debate/start`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topicId }) })
    if (res.ok) setResult(await res.json())
  }

  return (
    <div>
      <h3>Stage 2: Debate</h3>
      <button onClick={startDebate}>Start debate</button>

      {result && (
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <section>
            <h4>Transcript</h4>
            <ul>
              {result.transcript.map((t, i) => (
                <li key={i}>
                  <strong>{players.find(p => p.id === t.playerId)?.name || t.playerId}</strong> ({t.role}): {t.text}
                </li>
              ))}
            </ul>

            <h4 style={{ marginTop: 12 }}>Votes</h4>
            <ul>
              {result.votes.map((v, i) => (
                <li key={i}>
                  {players.find(p => p.id === v.voterPlayerId)?.name} → {players.find(p => p.id === v.votedForPlayerId)?.name}: {v.justification}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h4>Feedback</h4>
            {players.map(p => (
              <div key={p.id} style={{ border: '1px solid #ddd', padding: 8, marginBottom: 8 }}>
                <div><strong>{p.name}</strong></div>
                <div>
                  <em>Highlights</em>
                  <ul>
                    {(result.feedbackByPlayer[p.id]?.highlights ?? []).map((h, i) => (<li key={i}>{h}</li>))}
                  </ul>
                </div>
                <div>
                  <em>Improvements</em>
                  <ul>
                    {(result.feedbackByPlayer[p.id]?.improvements ?? []).map((h, i) => (<li key={i}>{h}</li>))}
                  </ul>
                </div>
              </div>
            ))}

            <div style={{ marginTop: 8 }}>
              Winner: {result.winnerPlayerId ? players.find(p => p.id === result.winnerPlayerId)?.name : 'Tie'}
            </div>
            <div>Scores awarded: {Object.entries(result.scoresAwarded).map(([pid, s]) => `${players.find(p => p.id === pid)?.name}: ${s}`).join(', ')}</div>
          </section>
        </div>
      )}
    </div>
  )
}
