'use client';

import { useState, useEffect, useRef } from 'react';
import type { FoodEntry, MealTime, Reaction } from '@/lib/types';
import { REACTIONS, MEAL_TIMES } from '@/lib/types';
import { makeEntry } from '@/lib/store';

interface Props {
  dateKey: string;
  mealTime: MealTime;
  entries: FoodEntry[];
  knownFoods: string[];
  onSave: (entries: FoodEntry[]) => void;
  onClose: () => void;
}

const DEFAULT_REACTION: Reaction = 'liked';

export default function MealModal({ dateKey, mealTime, entries, knownFoods, onSave, onClose }: Props) {
  const [list, setList] = useState<FoodEntry[]>([...entries]);
  const [foodName, setFoodName] = useState('');
  const [reaction, setReaction] = useState<Reaction>(DEFAULT_REACTION);
  const [isNew, setIsNew] = useState(false);
  const [notes, setNotes] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const meal = MEAL_TIMES.find((m) => m.key === mealTime)!;
  const date = new Date(dateKey + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
  });

  // Auto-detect "new food" based on history
  useEffect(() => {
    if (foodName.trim()) {
      const known = knownFoods.some(
        (f) => f.toLowerCase() === foodName.trim().toLowerCase(),
      );
      setIsNew(!known);
      const filtered = knownFoods.filter((f) =>
        f.toLowerCase().startsWith(foodName.toLowerCase()),
      );
      setSuggestions(filtered.slice(0, 6));
      setShowSuggestions(filtered.length > 0 && foodName.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [foodName, knownFoods]);

  function addFood() {
    if (!foodName.trim()) return;
    setList((l) => [...l, makeEntry(foodName, reaction, isNew, notes)]);
    setFoodName('');
    setReaction(DEFAULT_REACTION);
    setIsNew(false);
    setNotes('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  }

  function removeEntry(id: string) {
    setList((l) => l.filter((e) => e.id !== id));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); addFood(); }
    if (e.key === 'Escape') setShowSuggestions(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div>
            <h2 className="font-bold text-lg text-slate-900">
              {meal.emoji} {meal.label}
            </h2>
            <p className="text-sm text-slate-500">{date}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none w-8 h-8 flex items-center justify-center">✕</button>
        </div>

        {/* Current entries */}
        <div className="px-5 pt-4 flex flex-col gap-2 overflow-y-auto flex-1">
          {list.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-3">No foods added yet — add one below.</p>
          )}
          {list.map((entry) => {
            const r = REACTIONS.find((x) => x.key === entry.reaction)!;
            return (
              <div
                key={entry.id}
                className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 ${r.color} ${r.border}`}
              >
                <span className="text-xl leading-none mt-0.5">{r.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-semibold ${r.text}`}>{entry.foodName}</span>
                    {entry.isNew && (
                      <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5 font-medium">
                        ✨ New food!
                      </span>
                    )}
                    <span className={`text-xs font-medium ${r.text}`}>{r.label}</span>
                  </div>
                  {entry.notes && <p className="text-xs text-slate-500 mt-0.5">{entry.notes}</p>}
                </div>
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="text-slate-300 hover:text-red-400 ml-1 transition-colors shrink-0"
                >✕</button>
              </div>
            );
          })}
        </div>

        {/* Add food form */}
        <div className="p-5 border-t border-slate-200 flex flex-col gap-3">
          {/* Food name input */}
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Food name (e.g. Banana, Peas, Chicken)"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 pr-10"
              autoFocus
            />
            {showSuggestions && (
              <ul className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                {suggestions.map((s) => (
                  <li
                    key={s}
                    onClick={() => { setFoodName(s); setShowSuggestions(false); }}
                    className="px-3 py-2 text-sm hover:bg-rose-50 cursor-pointer text-slate-700"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Reaction picker */}
          <div className="grid grid-cols-3 gap-2">
            {REACTIONS.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setReaction(r.key)}
                className={`rounded-xl border-2 px-2 py-2 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  reaction === r.key
                    ? `${r.color} ${r.border} ${r.text} scale-105 shadow-sm`
                    : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'
                }`}
              >
                <span className="text-base">{r.emoji}</span>
                {r.label}
              </button>
            ))}
          </div>

          {/* New food toggle + notes */}
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isNew}
                onChange={(e) => setIsNew(e.target.checked)}
                className="w-4 h-4 rounded accent-rose-500"
              />
              ✨ First time trying this food
            </label>
          </div>

          <input
            type="text"
            placeholder="Notes (optional — e.g. mixed with oatmeal, made a face)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 text-slate-600 placeholder:text-slate-400"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={addFood}
              disabled={!foodName.trim()}
              className="flex-1 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
            >
              + Add Food
            </button>
            <button
              type="button"
              onClick={() => { onSave(list); onClose(); }}
              className="flex-1 bg-slate-800 hover:bg-slate-900 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
            >
              Save & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
