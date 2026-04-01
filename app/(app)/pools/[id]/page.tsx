import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Grid } from '@/components/grid/Grid'
import Link from 'next/link'

export default async function PoolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: pool } = await supabase
    .from('pools')
    .select('*, squares(*), pool_numbers(*), score_snapshots(*)')
    .eq('id', id)
    .single()

  if (!pool) notFound()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">{pool.name}</h1>
      <p className="text-slate-400 mb-6">{pool.team_home} vs {pool.team_away} — {pool.status}</p>
      <div className="mb-6 rounded border border-slate-700 bg-slate-800/40 p-4">
        <p className="text-sm text-slate-300 mb-2">This page is a read-only pool view.</p>
        <p className="text-sm text-slate-400 mb-3">To select and claim squares, open the join page:</p>
        <Link
          href={`/join/${pool.join_token}`}
          className="inline-block rounded bg-blue-600 px-3 py-2 text-sm text-white"
        >
          Open Join Page
        </Link>
      </div>
      <Grid
        poolId={pool.id}
        teamHome={pool.team_home}
        teamAway={pool.team_away}
        initialSquares={pool.squares}
        initialPoolNumbers={pool.pool_numbers}
        initialSnapshots={pool.score_snapshots}
      />
    </div>
  )
}
