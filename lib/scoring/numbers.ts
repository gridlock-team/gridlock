type Axis = 'row' | 'col'

export interface PoolNumberEntry {
  axis: Axis
  position: number
  number: number
}

function shuffle(arr: number[]): number[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function generatePoolNumbers(): PoolNumberEntry[] {
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  const rows = shuffle(digits)
  const cols = shuffle(digits)

  const entries: PoolNumberEntry[] = []
  for (let i = 0; i < 10; i++) {
    entries.push({ axis: 'row', position: i, number: rows[i] })
    entries.push({ axis: 'col', position: i, number: cols[i] })
  }
  return entries
}
