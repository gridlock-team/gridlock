'use client'
import { useState } from 'react'
import { Grid } from '@/components/grid/Grid'

export default function JoinForm({
  poolId, poolStatus, teamHome, teamAway,
  initialSquares, initialPoolNumbers, initialSnapshots,
}: {
  poolId: string, poolStatus: string, teamHome: string, teamAway: string,
  initialSquares: any[], initialPoolNumbers: any[], initialSnapshots: any[]
}) {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [contactType, setContactType] = useState<'email' | 'sms'>('email')
  const [selectedSquare, setSelectedSquare] = useState<{row: number, col: number} | null>(null)
  const [claimedSquares, setClaimedSquares] = useState<Array<{ row: number, col: number }>>([])
  const [phase, setPhase] = useState<'form' | 'claiming' | 'confirm' | 'done'>('form')
  const [error, setError] = useState<string | null>(null)
  const [successHint, setSuccessHint] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isOpen = poolStatus === 'open'
  const hasContact = contact.trim().length > 0
  const canClaim = Boolean(
    isOpen &&
    selectedSquare &&
    name.trim().length > 0 &&
    hasContact
  )

  async function handleClaim() {
    if (!canClaim || !selectedSquare) return
    setSubmitting(true)
    setError(null)
    setSuccessHint(null)

    const res = await fetch(`/api/pools/${poolId}/squares`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        row: selectedSquare.row,
        col: selectedSquare.col,
        guest_name: name.trim(),
        guest_email: contactType === 'email' ? contact : undefined,
        guest_phone: contactType === 'sms' ? contact : undefined,
      }),
    })

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      setError(data?.error || 'Unable to claim that square. Please try another one.')
      setSelectedSquare(null)
      setSubmitting(false)
      return
    }

    const claimedNow = { row: selectedSquare.row, col: selectedSquare.col }
    setClaimedSquares(prev => [...prev, claimedNow])
    setSelectedSquare(null)
    setPhase('claiming')
    setSuccessHint(`✓ Row ${claimedNow.row + 1}, Col ${claimedNow.col + 1} claimed - tap a square to select another`)
    setSubmitting(false)
  }

  if (phase === 'done') {
    return (
      <p className="text-green-400 text-lg">
        Good luck, {name}! You&apos;ve claimed {claimedSquares.length} square(s).
      </p>
    )
  }

  if (phase === 'confirm') {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Confirm Your Squares</h2>
        <ul className="list-disc pl-5 text-slate-200">
          {claimedSquares.map((sq, idx) => (
            <li key={`${sq.row}-${sq.col}-${idx}`}>Row {sq.row + 1}, Col {sq.col + 1}</li>
          ))}
        </ul>
        <button
          onClick={() => setPhase('done')}
          className="w-full bg-green-600 text-white rounded py-2"
        >
          Looks good - I&apos;m done! 🎉
        </button>
        <button
          onClick={() => setPhase('claiming')}
          className="w-full border border-slate-600 rounded py-2"
        >
          ← Go back and claim more
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {phase === 'form' ? (
        <>
          <input className="w-full border rounded px-3 py-2 bg-slate-800 text-slate-100 placeholder:text-slate-400" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
          <div className="flex gap-2">
            <select className="border rounded px-3 py-2 bg-slate-800 text-slate-100 placeholder:text-slate-400" value={contactType} onChange={e => setContactType(e.target.value as 'email' | 'sms')}>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
            <input className="flex-1 border rounded px-3 py-2 bg-slate-800 text-slate-100 placeholder:text-slate-400" placeholder={contactType === 'email' ? 'your@email.com' : '+1 (555) 000-0000'} value={contact} onChange={e => setContact(e.target.value)} />
          </div>
        </>
      ) : (
        <div className="text-sm text-slate-300">Claiming as: <span className="font-semibold">{name}</span></div>
      )}

      <p className="text-slate-400 text-sm">Tap a square below to claim it</p>
      {!isOpen && <p className="text-amber-400 text-sm">This pool is not open for claiming.</p>}
      {selectedSquare && (
        <p className="text-sm text-blue-300">Selected: Row {selectedSquare.row + 1}, Col {selectedSquare.col + 1}</p>
      )}
      {successHint && <p className="text-sm text-green-300">{successHint}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {selectedSquare && (
        <button onClick={handleClaim} disabled={!canClaim || submitting} className="w-full bg-blue-600 text-white rounded py-2 disabled:opacity-60">
          {submitting ? 'Claiming...' : `Claim Square (Row ${selectedSquare.row + 1}, Col ${selectedSquare.col + 1})`}
        </button>
      )}
      <Grid
        poolId={poolId}
        teamHome={teamHome}
        teamAway={teamAway}
        initialSquares={initialSquares}
        initialPoolNumbers={initialPoolNumbers}
        initialSnapshots={initialSnapshots}
        selectedSquare={selectedSquare}
        onClaimSquare={(row, col) => {
          setError(null)
          setSelectedSquare(prev =>
            prev && prev.row === row && prev.col === col
              ? null
              : { row, col }
          )
        }}
      />
      {claimedSquares.length > 0 && (
        <button
          onClick={() => setPhase('confirm')}
          className="w-full border border-slate-600 rounded py-2"
        >
          I&apos;m finished
        </button>
      )}
    </div>
  )
}
