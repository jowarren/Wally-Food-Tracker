'use client';
import { useState } from 'react';
import Nav from '@/components/Nav';

type Ingredient = { name: string; quantity: string; isNew?: boolean };
type Suggestion = {
  name: string;
  description: string;
  category: string;
  ingredients: Ingredient[];
};

const CATEGORY_COLORS: Record<string, string> = {
  breakfast: 'bg-yellow-100 text-yellow-700',
  lunch: 'bg-blue-100 text-blue-700',
  dinner: 'bg-purple-100 text-purple-700',
  any: 'bg-gray-100 text-gray-500',
};

const CATEGORY_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  any: 'Any',
};

export default function IdeasPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loved, setLoved] = useState<string[]>([]);
  const [liked, setLiked] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Record<number, 'saving' | 'saved' | 'error'>>({});

  async function generate() {
    setLoading(true);
    setError(null);
    setSuggestions([]);
    setSaved({});
    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 5 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to generate ideas');
      setSuggestions(data.suggestions ?? []);
      setLoved(data.loved ?? []);
      setLiked(data.liked ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function saveToLibrary(suggestion: Suggestion, idx: number) {
    setSaved((s) => ({ ...s, [idx]: 'saving' }));
    try {
      const res = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: suggestion.name,
          description: suggestion.description,
          category: suggestion.category,
          ingredients: suggestion.ingredients.map((i) => ({
            name: i.name,
            quantity: i.quantity || '1 serving',
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to save');
      }
      setSaved((s) => ({ ...s, [idx]: 'saved' }));
    } catch {
      setSaved((s) => ({ ...s, [idx]: 'error' }));
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black">Meal Ideas</h1>
          <p className="text-sm text-gray-500 mt-1">
            AI-generated meal suggestions based on what your toddler loves, designed to gently introduce new foods.
          </p>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={generate}
            disabled={loading}
            className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white rounded-lg font-medium text-sm transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Generating…
              </span>
            ) : suggestions.length > 0 ? 'Regenerate Ideas' : 'Generate Meal Ideas'}
          </button>
          {suggestions.length > 0 && !loading && (
            <span className="text-sm text-gray-500">{suggestions.length} ideas generated</span>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-6">
            {error}
          </div>
        )}

        {!loading && suggestions.length === 0 && !error && (
          <div className="bg-white rounded-xl border border-rose-200 p-8 text-center">
            <div className="text-4xl mb-3">💡</div>
            <p className="text-gray-500 text-sm">
              Click &quot;Generate Meal Ideas&quot; to get personalised suggestions based on your toddler&apos;s food history.
            </p>
            {loved.length === 0 && liked.length === 0 && (
              <p className="text-gray-400 text-xs mt-2">
                Tip: log some food reactions in the Week View first so suggestions are personalised.
              </p>
            )}
          </div>
        )}

        {(loved.length > 0 || liked.length > 0) && suggestions.length > 0 && (
          <div className="bg-rose-50 rounded-xl border border-rose-100 px-4 py-3 mb-6 text-sm">
            <span className="font-medium text-rose-700">Based on: </span>
            <span className="text-rose-600">
              {[...loved.map(f => `${f} 😍`), ...liked.map(f => `${f} 👍`)].join(' · ')}
            </span>
          </div>
        )}

        <div className="space-y-4">
          {suggestions.map((s, idx) => {
            const saveState = saved[idx];
            const newIngredients = s.ingredients.filter((i) => i.isNew);
            const familiarIngredients = s.ingredients.filter((i) => !i.isNew);

            return (
              <div key={idx} className="bg-white rounded-xl border border-rose-200 shadow-sm p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-black text-base">{s.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[s.category ?? 'any']}`}>
                        {CATEGORY_LABELS[s.category ?? 'any']}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{s.description}</p>

                    <div className="flex flex-wrap gap-1.5">
                      {familiarIngredients.map((ing) => (
                        <span key={ing.name} className="text-xs bg-green-50 text-green-700 border border-green-100 rounded-full px-2.5 py-0.5">
                          {ing.quantity} {ing.name}
                        </span>
                      ))}
                      {newIngredients.map((ing) => (
                        <span key={ing.name} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5 font-medium">
                          ✨ {ing.quantity} {ing.name}
                        </span>
                      ))}
                    </div>

                    {newIngredients.length > 0 && (
                      <p className="text-xs text-blue-500 mt-2">
                        ✨ New ingredients to introduce: {newIngredients.map(i => i.name).join(', ')}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => saveToLibrary(s, idx)}
                    disabled={saveState === 'saving' || saveState === 'saved'}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      saveState === 'saved'
                        ? 'bg-green-100 text-green-700 cursor-default'
                        : saveState === 'error'
                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                        : saveState === 'saving'
                        ? 'bg-rose-100 text-rose-400 cursor-wait'
                        : 'bg-rose-500 hover:bg-rose-600 text-white'
                    }`}
                  >
                    {saveState === 'saved' ? '✓ Saved' : saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Retry' : 'Save to Library'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
