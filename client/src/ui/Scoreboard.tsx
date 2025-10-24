import React, { useEffect, useState } from 'react'

type Row = { id: string; name: string; points: number }

export function Scoreboard({ apiBase }: { apiBase: string }) {
  const [rows, setRows] = useState<Row[]>([])

  async function load() {
    const res = await fetch(`${apiBase}/api/game/scoreboard`)
    if (res.ok) setRows(await res.json())
  }

  useEffect(() => { load() }, [apiBase])

  return (
    <div>
      <h3>Scoreboard</h3>
      <table>
        <thead>
          <tr>
            <th>Player</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={load} style={{ marginTop: 8 }}>Refresh</button>
    </div>
  )
}
