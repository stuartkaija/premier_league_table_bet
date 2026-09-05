#!/usr/bin/env node
// Fetches current Premier League standings from football-data.org and
// writes them to src/data/standings.json in the app's StandingsEntry shape.

const API_URL = 'https://api.football-data.org/v4/competitions/PL/standings'

const token = process.env.FOOTBALL_DATA_API_KEY
if (!token) {
  console.error('Missing FOOTBALL_DATA_API_KEY environment variable')
  process.exit(1)
}

const res = await fetch(API_URL, {
  headers: { 'X-Auth-Token': token },
})

if (!res.ok) {
  console.error(`football-data.org request failed: ${res.status} ${res.statusText}`)
  process.exit(1)
}

const data = await res.json()
const total = data.standings.find((s) => s.type === 'TOTAL')

if (!total) {
  console.error('No TOTAL standings table in response')
  process.exit(1)
}

const standings = total.table.map((row) => ({
  position: row.position,
  teamId: row.team.tla,
  teamName: row.team.name,
}))

const fs = await import('node:fs/promises')
await fs.writeFile(
  new URL('../src/data/standings.json', import.meta.url),
  JSON.stringify(standings, null, 2) + '\n',
)

console.log(`Wrote ${standings.length} standings entries.`)
