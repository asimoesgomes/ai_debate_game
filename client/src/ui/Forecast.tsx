import React, { useEffect, useState } from 'react'
import type { Player } from './App'

type ForecastRound = {
  roundId: string;
  topicId: string;
  estimates: Record<string, number>;
  truth: number;
  distances: Record<string, number>;
  scoresAwarded: Record<string, number>;
}

export function Forecast({ apiBase, players }: { apiBase: string; players: Player[] }) {
  const [topics, setTopics] = useState<any[]>([])
  const [topicId, setTopicId] = useState<string>('forecast-school-value')
  const [round, setRound] = useState<ForecastRound | null>(null)
  const [estimates, setEstimates] = useState<Record<string, number>>({})

  useEffect(() => { fetch(`${apiBase}/api/topics`).then(r => r.json()).then(setTopics) }, [apiBase])

  async function start() {
    const res = await fetch(`${apiBase}/api/forecast/start`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topicId }) })
    if (res.ok) {
      const data = await res.json()
      setRound({ roundId: data.roundId, topicId, estimates: {}, truth: 0, distances: {}, scoresAwarded: {} })
    }
  }

  async function submitAll() {
    if (!round) return
    for (const p of players) {
      const est = estimates[p.id]
      if (typeof est === 'number') {
        await fetch(`${apiBase}/api/forecast/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roundId: round.roundId, playerId: p.id, estimate: est }) })
      }
    }
    const res = await fetch(`${apiBase}/api/forecast/finish`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roundId: round.roundId }) })
    if (res.ok) setRound(await res.json())
  }

  return (
    <div>
      <h3>Forecast Mode</h3>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <select value={topicId} onChange={e => setTopicId(e.target.value)}>
          {topics.filter(t => t.category === 'forecast').map(t => (
            <option key={t.id} value={t.id}>{t.id}</option>
          ))}
        </select>
        <button onClick={start}>Start round</button>
      </div>

      {round && (
        <div style={{ marginTop: 12 }}>
          <h4>Enter estimates (0-100)</h4>
          {players.map(p => (
            <div key={p.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
              <span style={{ width: 160 }}>{p.name}</span>
              <input type='number' min={0} max={100} value={estimates[p.id] ?? ''} onChange={e => setEstimates(s => ({ ...s, [p.id]: Number(e.target.value) }))} />
            </div>
          ))}
          <button onClick={submitAll} style={{ marginTop: 8 }}>Submit & Finish</button>
        </div>
      )}

      {round && round.truth > 0 && (
        <div style={{ marginTop: 16 }}>
          <h4>Results</h4>
          <div>Truth: {round.truth}</div>
          <ul>
            {Object.keys(round.estimates).map(pid => (
              <li key={pid}>{players.find(p => p.id === pid)?.name}: est {round.estimates[pid]}, error {round.distances[pid]}, +{round.scoresAwarded[pid] || 0} pts</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
