import React, { useEffect, useState } from 'react'
import type { Player } from './App'

type Question = {
  key: 'beliefs' | 'actions' | 'mechanisms' | 'outcomes' | 'evidence' | 'tradeoffs' | 'metrics' | 'summary'
  text: { en: string; pt: string }
  minItems?: number
}

export function Preparation({ apiBase, players, topicId }: { apiBase: string; players: Player[]; topicId: string }) {
  const [mode, setMode] = useState<'lightning' | 'deep'>('lightning')
  const [current, setCurrent] = useState<Player | null>(null)
  const [question, setQuestion] = useState<Question | null>(null)
  const [answer, setAnswer] = useState('')

  useEffect(() => { if (players.length > 0) setCurrent(players[0]) }, [players])

  async function startPrep() {
    await fetch(`${apiBase}/api/game/prepare/start`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topicId, mode }) })
    if (current) await fetchNext(current)
  }

  async function fetchNext(p: Player) {
    const res = await fetch(`${apiBase}/api/game/prepare/next?playerId=${p.id}&topicId=${topicId}`)
    const data = await res.json()
    setQuestion(data.question)
  }

  async function submitAnswer() {
    if (!current || !question) return
    await fetch(`${apiBase}/api/game/prepare/answer`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ playerId: current.id, topicId, key: question.key, answer })
    })
    setAnswer('')
    await fetchNext(current)
  }

  return (
    <div>
      <h3>Stage 1: Prepare Agents</h3>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <label>Mode
          <select value={mode} onChange={e => setMode(e.target.value as any)}>
            <option value='lightning'>Lightning</option>
            <option value='deep'>Deep</option>
          </select>
        </label>
        <label>Player
          <select value={current?.id ?? ''} onChange={e => setCurrent(players.find(p => p.id === e.target.value) ?? null)}>
            {players.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
          </select>
        </label>
        <button onClick={startPrep} disabled={!topicId}>Start</button>
      </div>

      {question ? (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>{question.text.pt}</div>
          <textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={4} style={{ width: '100%' }} placeholder='Separe itens com ponto-e-vírgula ;' />
          <button onClick={submitAnswer} style={{ marginTop: 8 }} disabled={!answer.trim()}>Enviar</button>
        </div>
      ) : (
        <p style={{ marginTop: 16 }}>Clique em Start e responda as perguntas. Troque de jogador no seletor para preparar todos.</p>
      )}
    </div>
  )
}
