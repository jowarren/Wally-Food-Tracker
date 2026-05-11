'use client';

import { useEffect, useState } from 'react';
import Nav from '@/components/Nav';
import { buildFoodHistory, type FoodSummary, type DbEntry } from '@/lib/store';
import { REACTIONS, type Reaction } from '@/lib/types';

type SortKey = 'name' | 'timesOffered' | 'lastOffered';

function BestReaction({ reactions }: { reactions: Record<Reaction, number> }) {
  const order: Reaction[] = ['loved', 'liked', 'neutral', 'disliked', 'refused', 'allergic'];
  const best = order.find((r) => reactions[r] > 0);
  if (!best) return null;
  const r = REACTIONS.find((x) => x.key === best)!;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${r.color} ${r.text} ${r.border}`}>
      {r.emoji} {r.label}
    </span>
  );
}

function ReactionBar({ reactions }: { reactions: Record<Reaction, number> }) {
  const total = Object.values(reactions).reduce((s, v) => s + v, 0);
  if (total === 0) return null;
  const order: Reaction[] = ['loved', 'liked', 'neutral', 'disliked', 'refused', 'allergic'];
  const colors: Record<Reaction, string> = {
    loved: 'bg-emerald-400', liked: 'bg-green-400', neutral: 'bg-yellow-400',
    disliked: 'bg-orange-400', refused: 'bg-red-400', allergic: 'bg-purple-400',
  };
  return (
    <div className="flex rounded-full overflow-hidden h-2 w-full gap-px">
      {order.map((r) => {
        const pct = (reactions[r] / total) * 100;
        if (pct === 0) return null;
        return <div key={r} className={colors[r]} style={{ width: `${pct}%` }} title={`${r}: ${reactions[r]}`} />;
      })}
    </div>
  );
}

export default function HistoryPage() {
  const [foods, setFoods] = useState<FoodSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('lastOffered');
  const [filterAllergic, setFilterAllergic] = useState(false);
  const [filterNew, setFilterNew] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/history')
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then((d: { entries: DbEntry[] }) => setFoods(buildFoodHistory(d.entries)))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = foods
    .filter((f) => {
      if (filterAllergic && !f.everAllergic) return false;
      if (filterNew && !f.isNew) return false;
      if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name);
      if (sortKey === 'timesOffered') return b.timesOffered - a.timesOffered;
      return b.lastOffered.localeCompare(a.lastOffered);
    });

  function ColHeader({ label, k }: { label: string; k: SortKey }) {
    const active = sortKey === k;
    return (
      <th onClick={() => setSortKey(k)} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 cursor-pointer hover:text-slate-800 select-none whitespace-nowrap">
        {label}{active ? ' ↓' : ''}
      </th>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-rose-50">
      <Nav />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 flex flex-col gap-5">

        <div>
          <h1 className="text-2xl font-bold text-slate-900">Food History</h1>
          <p className="text-sm text-slate-500 mt-0.5">All foods ever offered — {foods.length} unique foods</p>
        </div>

        {/* Stats */}
        {foods.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Foods',       value: foods.length,                                                                     emoji: '🍽️' },
              { label: 'Times Offered',     value: foods.reduce((s, f) => s + f.timesOffered, 0),                                    emoji: '📋' },
              { label: 'Loved / Liked',     value: foods.filter((f) => f.reactions.loved > 0 || f.reactions.liked > 0).length,       emoji: '😍' },
              { label: 'Allergic Reactions',value: foods.filter((f) => f.everAllergic).length,                                       emoji: '⚠️' },
            ].map(({ label, value, emoji }) => (
              <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3">
                <p className="text-xs text-slate-500 font-medium">{label}</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{emoji} {value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Search foods…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 w-52"
          />
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer bg-white border border-slate-200 rounded-xl px-3 py-2 hover:bg-slate-50 select-none">
            <input type="checkbox" checked={filterAllergic} onChange={(e) => setFilterAllergic(e.target.checked)} className="accent-rose-500" />
            ⚠️ Allergic only
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer bg-white border border-slate-200 rounded-xl px-3 py-2 hover:bg-slate-50 select-none">
            <input type="checkbox" checked={filterNew} onChange={(e) => setFilterNew(e.target.checked)} className="accent-rose-500" />
            ✨ First introductions
          </label>
        </div>

        {/* Loading / error / empty states */}
        {loading && (
          <div className="text-center py-16 text-slate-400">
            <p className="text-4xl mb-3 animate-bounce">🍼</p>
            <p className="text-sm">Loading food history…</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}

        {!loading && !error && foods.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <p className="text-4xl mb-3">🍼</p>
            <p className="font-semibold text-slate-600 text-lg">No foods logged yet</p>
            <p className="text-sm mt-1">Go to the Week View and start adding foods!</p>
          </div>
        )}

        {!loading && !error && foods.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <ColHeader label="Food" k="name" />
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Best Reaction</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 w-32">Breakdown</th>
                  <ColHeader label="Offered" k="timesOffered" />
                  <ColHeader label="Last Offered" k="lastOffered" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((food, i) => (
                  <tr key={food.name} className={`border-t border-slate-100 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/40'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900">{food.name}</span>
                        {food.isNew && <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5 font-medium">✨ New</span>}
                        {food.everAllergic && <span className="text-xs bg-purple-100 text-purple-700 border border-purple-200 rounded-full px-2 py-0.5 font-medium">⚠️ Allergic</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3"><BestReaction reactions={food.reactions} /></td>
                    <td className="px-4 py-3 w-32">
                      <ReactionBar reactions={food.reactions} />
                      <p className="text-xs text-slate-400 mt-1">
                        {Object.entries(food.reactions)
                          .filter(([, v]) => v > 0)
                          .map(([k, v]) => { const r = REACTIONS.find((x) => x.key === k)!; return `${r.emoji}×${v}`; })
                          .join(' ')}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-sm tabular-nums">{food.timesOffered}×</td>
                    <td className="px-4 py-3 text-slate-500 text-sm">
                      {new Date(food.lastOffered + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="text-center py-8 text-slate-400 text-sm">No foods match your filters.</p>}
          </div>
        )}
      </main>
    </div>
  );
}
