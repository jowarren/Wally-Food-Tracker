'use client';

import type { FoodEntry, MealTime } from '@/lib/types';
import { REACTIONS, MEAL_TIMES } from '@/lib/types';

interface Props {
  dateKey: string;
  mealTime: MealTime;
  entries: FoodEntry[];
  onClick: () => void;
  compact?: boolean;
}

export default function MealCell({ entries, onClick, mealTime, compact = false }: Props) {
  const meal = MEAL_TIMES.find((m) => m.key === mealTime)!;
  const isEmpty = entries.length === 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border-2 transition-all hover:shadow-md group ${
        isEmpty
          ? 'border-dashed border-slate-200 hover:border-rose-300 bg-white'
          : 'border-slate-200 hover:border-rose-300 bg-white'
      } ${compact ? 'p-2' : 'p-3'}`}
    >
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-1 text-slate-300 group-hover:text-rose-300 transition-colors py-2">
          <span className="text-2xl">{meal.emoji}</span>
          <span className="text-xs font-medium">{compact ? '+' : '+ Add foods'}</span>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {entries.map((entry) => {
            const r = REACTIONS.find((x) => x.key === entry.reaction)!;
            return (
              <div
                key={entry.id}
                className={`flex items-center gap-1.5 rounded-lg px-2 py-1 ${r.color}`}
              >
                <span className="text-sm leading-none shrink-0">{r.emoji}</span>
                <span className={`text-xs font-semibold truncate ${r.text}`}>
                  {entry.foodName}
                </span>
                {entry.isNew && (
                  <span className="text-xs ml-auto shrink-0">✨</span>
                )}
              </div>
            );
          })}
          <span className="text-xs text-slate-400 mt-0.5 group-hover:text-rose-400 transition-colors">
            tap to edit
          </span>
        </div>
      )}
    </button>
  );
}
