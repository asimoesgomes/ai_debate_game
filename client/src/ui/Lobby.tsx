import React, { useEffect, useState } from 'react'
import type { Player } from './App'

export function Lobby({ apiBase, onPlayers, onTopic }: { apiBase: string; onPlayers: (p: Player[]) => void; onTopic: (t: string) => void }) {
  const [name, setName] = useState('')
  const [language, setLanguage] = useState<'en' | 'pt'>('pt')
  const [avatar, setAvatar] = useState<string>('😊')
  const [players, setPlayers] = useState<Player[]>([])
  const [topics, setTopics] = useState<any[]>([])
  const [topicId, setTopicId] = useState<string>('safety')

  useEffect(() => {
    fetch(`${apiBase}/api/players`).then(r => r.json()).then(setPlayers).catch(() => {})
    fetch(`${apiBase}/api/topics`).then(r => r.json()).then(setTopics).catch(() => {})
  }, [apiBase])

  useEffect(() => { onPlayers(players) }, [players])
  useEffect(() => { onTopic(topicId) }, [topicId])

  async function addPlayer() {
    const res = await fetch(`${apiBase}/api/player`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, language, avatar: { style: 'emoji', value: avatar } })
    })
    if (res.ok) {
      const player = await res.json()
      setPlayers(prev => [...prev, player])
      setName('')
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <section>
        <h3>Create Player (Stage 0)</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          <label>
            Name
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" />
          </label>
          <label>
            Language
            <select value={language} onChange={e => setLanguage(e.target.value as any)}>
              <option value="pt">Português</option>
              <option value="en">English</option>
            </select>
          </label>
          <label>
            Avatar (emoji)
            <input value={avatar} onChange={e => setAvatar(e.target.value)} />
          </label>
          <button onClick={addPlayer} disabled={!name.trim()}>Add player</button>
        </div>

        <h4 style={{ marginTop: 16 }}>Players</h4>
        <ul>
          {players.map(p => (
            <li key={p.id}>
              <span style={{ marginRight: 8 }}>{p.avatar?.value ?? '🙂'}</span>
              {p.name} · {p.language} · {p.points} pts
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Choose Topic</h3>
        <select value={topicId} onChange={e => setTopicId(e.target.value)}>
          {topics.filter(t => t.category === 'debate').map(t => (
            <option key={t.id} value={t.id}>{t.id}</option>
          ))}
        </select>
        <div style={{ marginTop: 8 }}>
          {topics.find(t => t.id === topicId)?.prompt?.pt}
        </div>

        <h3 style={{ marginTop: 24 }}>Forecast Topics</h3>
        <ul>
          {topics.filter(t => t.category === 'forecast').map(t => (
            <li key={t.id}>{t.id}: {t.prompt.pt}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
