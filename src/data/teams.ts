import type { Team } from '../types'

// The 20 clubs everyone predicted. `id` is each club's football-data.org
// tla code, matching what src/data/standings.json uses.
export const TEAMS: Team[] = [
  { id: 'MCI', name: 'Man City' },
  { id: 'ARS', name: 'Arsenal' },
  { id: 'CHE', name: 'Chelsea' },
  { id: 'LIV', name: 'Liverpool' },
  { id: 'MUN', name: 'Man United' },
  { id: 'TOT', name: 'Tottenham' },
  { id: 'NEW', name: 'Newcastle' },
  { id: 'AVL', name: 'Aston Villa' },
  { id: 'NOT', name: 'Nottingham Forest' },
  { id: 'BHA', name: 'Brighton' },
  { id: 'CRY', name: 'Crystal Palace' },
  { id: 'BRE', name: 'Brentford' },
  { id: 'BOU', name: 'Bournemouth' },
  { id: 'EVE', name: 'Everton' },
  { id: 'FUL', name: 'Fulham' },
  { id: 'LEE', name: 'Leeds' },
  { id: 'SUN', name: 'Sunderland' },
  { id: 'COV', name: 'Coventry' },
  { id: 'IPS', name: 'Ipswich Town' },
  { id: 'HUL', name: 'Hull' },
]
