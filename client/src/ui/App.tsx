import React, { useMemo, useState } from 'react'
import { Lobby } from './Lobby'
import { Preparation } from './Preparation'
import { Debate } from './Debate'
import { Forecast } from './Forecast'
import { Scoreboard } from './Scoreboard'

export type Player = {
  id: string
  name: string
  language: 'en' | 'pt'
  avatar: { style: 'emoji' | 'color' | 'upload'; value: string }
  points: number
  profiles?: Record<string, any>
}

type View = 'lobby' | 'prep' | 'debate' | 'forecast' | 'scoreboard'

export function App() {
  const [view, setView] = useState<View>('lobby')
  const [players, setPlayers] = useState<Player[]>([])
  const [topicId, setTopicId] = useState<string>('safety')

  const apiBase = useMemo(() => (import.meta.env.VITE_API_BASE ?? 'http://localhost:4000'), [])

  return (
    <div style={{ fontFamily: 'Inter, system-ui, Arial', padding: 16, maxWidth: 960, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Community Leader Simulation</h2>
        <nav style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setView('lobby')}>Stage 0</button>
          <button onClick={() => setView('prep')}>Stage 1</button>
          <button onClick={() => setView('debate')}>Stage 2</button>
          <button onClick={() => setView('scoreboard')}>Scoreboard</button>
          <button onClick={() => setView('forecast')}>Forecast</button>
        </nav>
      </header>

      {view === 'lobby' && (
        <Lobby apiBase={apiBase} onPlayers={(ps) => setPlayers(ps)} onTopic={(t) => setTopicId(t)} />
      )}
      {view === 'prep' && (
        <Preparation apiBase={apiBase} players={players} topicId={topicId} />
      )}
      {view === 'debate' && (
        <Debate apiBase={apiBase} players={players} topicId={topicId} />
      )}
      {view === 'scoreboard' && (
        <Scoreboard apiBase={apiBase} />
      )}
      {view === 'forecast' && (
        <Forecast apiBase={apiBase} players={players} />
      )}
    </div>
  )
}
