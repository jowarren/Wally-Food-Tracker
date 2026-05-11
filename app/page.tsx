'use client';

import { useEffect, useState, useCallback } from 'react';
import Nav from '@/components/Nav';
import MealCell from '@/components/MealCell';
import MealModal from '@/components/MealModal';
import type { WeekLog, MealTime, FoodEntry } from '@/lib/types';
import { MEAL_TIMES } from '@/lib/types';
import {
  getMondayOf,
  getMondayKey,
  weekDays,
  formatDate,
  entriesToWeekLog,
  type DbEntry,
} from '@/lib/store';

interface ModalState {
  dateKey: string;
  mealTime: MealTime;
  entries: FoodEntry[];
}

export default function WeekPage() {
  const [log, setLog] = useState<WeekLog>({});
  const [weekOffset, setWeekOffset] = useState(0);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [knownFoods, setKnownFoods] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monday = getMondayOf(weekOffset);
  const mondayKey = getMondayKey(weekOffset);
  const days = weekDays(monday);

  // Load week entries from the API
  const loadWeek = useCallback(async (offset: number) => {
    setLoading(true);
    setError(null);
    try {
      const key = getMondayKey(offset);
      const res = await fetch(`/api/week?monday=${key}`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json() as { entries: DbEntry[] };
      setLog(entriesToWeekLog(data.entries));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  // Load autocomplete food names once
  useEffect(() => {
    fetch('/api/foods')
      .then((r) => r.json())
      .then((d: { foods: string[] }) => setKnownFoods(d.foods))
      .catch(() => {/* non-critical */});
  }, []);

  useEffect(() => { loadWeek(weekOffset); }, [weekOffset, loadWeek]);

  const weekLabel = (() => {
    const start = new Date(days[0] + 'T00:00:00');
    const end   = new Date(days[6] + 'T00:00:00');
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  })();

  function openModal(dateKey: string, mealTime: MealTime) {
    const day = log[dateKey];
    const entries = day?.[mealTime] ?? [];
    setModal({ dateKey, mealTime, entries });
  }

  async function handleSave(entries: FoodEntry[]) {
    if (!modal) return;
    const { dateKey, mealTime } = modal;

    try {
      const res = await fetch('/api/slot', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateKey, mealTime, entries }),
      });
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
      const data = await res.json() as { entries: DbEntry[] };

      // Merge the updated slot into local log
      setLog((prev) => ({
        ...prev,
        [dateKey]: {
          ...(prev[dateKey] ?? { breakfast: [], 'morning-snack': [], lunch: [], 'afternoon-snack': [], dinner: [] }),
          [mealTime]: data.entries.map((e) => ({
            id: e.id,
            foodName: e.foodName,
            reaction: e.reaction,
            isNew: e.isNew,
            notes: e.notes,
          } as FoodEntry)),
        },
      }));

      // Refresh autocomplete
      fetch('/api/foods')
        .then((r) => r.json())
        .then((d: { foods: string[] }) => setKnownFoods(d.foods))
        .catch(() => {});
    } catch (e) {
      alert(`Failed to save: ${String(e)}`);
    }
  }

  // Stats for the week
  const allEntries = days.flatMap((dk) =>
    MEAL_TIMES.flatMap((m) => log[dk]?.[m.key] ?? []),
  );
  const weekFoodCount  = allEntries.length;
  const newFoodsThisWeek = allEntries.filter((e) => e.isNew).length;

  return (
    <div className="min-h-screen flex flex-col bg-rose-50">
      <Nav />
      <main className="flex-1 px-4 py-5 max-w-[1400px] mx-auto w-full flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Weekly Food Log</h1>
            <p className="text-sm text-slate-500 mt-0.5">{weekLabel}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {weekFoodCount > 0 && (
              <div className="flex gap-3">
                <span className="text-sm bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 font-medium shadow-sm">
                  🍽️ {weekFoodCount} food{weekFoodCount !== 1 ? 's' : ''} offered
                </span>
                {newFoodsThisWeek > 0 && (
                  <span className="text-sm bg-blue-50 border border-blue-200 rounded-xl px-3 py-1.5 text-blue-700 font-medium shadow-sm">
                    ✨ {newFoodsThisWeek} new
                  </span>
                )}
              </div>
            )}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setWeekOffset((w) => w - 1)}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold shadow-sm"
              >‹</button>
              {weekOffset !== 0 && (
                <button
                  onClick={() => setWeekOffset(0)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-sm text-rose-500 font-medium shadow-sm"
                >Today</button>
              )}
              <button
                onClick={() => setWeekOffset((w) => w + 1)}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold shadow-sm"
              >›</button>
            </div>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            ⚠️ {error}
            <button onClick={() => loadWeek(weekOffset)} className="ml-auto underline font-medium">Retry</button>
          </div>
        )}

        {/* Grid */}
        <div className={`overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm transition-opacity ${loading ? 'opacity-50' : 'opacity-100'}`}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-slate-400 text-sm animate-pulse">Loading…</span>
            </div>
          )}
          <table className="w-full border-collapse" style={{ minWidth: '760px' }}>
            <thead>
              <tr className="bg-rose-500">
                <th className="w-32 px-3 py-3 text-left text-xs font-bold uppercase tracking-wide text-rose-100 border-r border-rose-400">
                  Meal
                </th>
                {days.map((dk) => {
                  const { day, short, isToday } = formatDate(dk);
                  return (
                    <th key={dk} className={`px-2 py-3 text-center border-r border-rose-400 last:border-r-0 ${isToday ? 'bg-rose-600' : ''}`}>
                      <div className={`text-xs font-bold uppercase tracking-wide ${isToday ? 'text-white' : 'text-rose-100'}`}>{day}</div>
                      <div className={`text-sm font-semibold mt-0.5 ${isToday ? 'text-white' : 'text-rose-200'}`}>{short}</div>
                      {isToday && <div className="text-xs bg-white text-rose-600 rounded-full px-2 mt-1 font-bold inline-block">TODAY</div>}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {MEAL_TIMES.map((meal, mealIdx) => (
                <tr key={meal.key} className={`border-t border-slate-100 ${mealIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                  <td className="px-3 py-3 border-r border-slate-100 align-top w-32">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-lg leading-none">{meal.emoji}</span>
                      <span className="text-xs font-bold text-slate-700 leading-tight">{meal.label}</span>
                    </div>
                  </td>
                  {days.map((dk) => (
                    <td key={dk} className="px-2 py-2 border-r border-slate-100 last:border-r-0 align-top" style={{ minWidth: '120px' }}>
                      <MealCell
                        dateKey={dk}
                        mealTime={meal.key}
                        entries={log[dk]?.[meal.key] ?? []}
                        onClick={() => openModal(dk, meal.key)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-500 font-medium">Reactions:</span>
          {(
            [
              { key: 'loved',    label: 'Loved it!',   emoji: '😍', color: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
              { key: 'liked',    label: 'Liked it',    emoji: '👍', color: 'bg-green-100',   text: 'text-green-700',   border: 'border-green-200'   },
              { key: 'neutral',  label: 'Neutral',     emoji: '😐', color: 'bg-yellow-100',  text: 'text-yellow-700',  border: 'border-yellow-200'  },
              { key: 'disliked', label: 'Disliked',    emoji: '👎', color: 'bg-orange-100',  text: 'text-orange-700',  border: 'border-orange-200'  },
              { key: 'refused',  label: 'Refused',     emoji: '🙅', color: 'bg-red-100',     text: 'text-red-700',     border: 'border-red-200'     },
              { key: 'allergic', label: 'Allergic ⚠️', emoji: '⚠️', color: 'bg-purple-100',  text: 'text-purple-700',  border: 'border-purple-200'  },
            ] as const
          ).map((r) => (
            <span key={r.key} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border ${r.color} ${r.text} ${r.border} font-medium`}>
              {r.emoji} {r.label}
            </span>
          ))}
          <span className="text-xs px-2 py-1 rounded-lg border bg-blue-50 text-blue-700 border-blue-200 font-medium">✨ New food</span>
        </div>
      </main>

      {modal && (
        <MealModal
          dateKey={modal.dateKey}
          mealTime={modal.mealTime}
          entries={modal.entries}
          knownFoods={knownFoods}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
