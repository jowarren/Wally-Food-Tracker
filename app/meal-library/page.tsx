'use client';
import { useEffect, useState } from 'react';
import Nav from '@/components/Nav';

type IngredientInput = { name: string; quantity: string };
type Meal = {
  id: string;
  name: string;
  description?: string;
  category: string;
  ingredients: { quantity: string; ingredient: { name: string } }[];
};

const CATEGORIES = [
  { value: 'any', label: 'Any / Flexible' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  breakfast: 'bg-yellow-100 text-yellow-700',
  lunch: 'bg-blue-100 text-blue-700',
  dinner: 'bg-purple-100 text-purple-700',
  any: 'bg-gray-100 text-gray-500',
};

const emptyForm = () => ({ name: '', description: '', category: 'any', ingredients: [{ name: '', quantity: '' }] });

export default function MealLibraryPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [form, setForm] = useState(emptyForm());
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMeals() {
    const res = await fetch('/api/meals');
    setMeals(await res.json());
  }

  useEffect(() => { loadMeals(); }, []);

  function startEdit(meal: Meal) {
    setEditing(meal.id);
    setForm({
      name: meal.name,
      description: meal.description ?? '',
      category: meal.category ?? 'any',
      ingredients: meal.ingredients.map((i) => ({ name: i.ingredient.name, quantity: i.quantity })),
    });
    setError(null);
  }

  function cancelEdit() {
    setEditing(null);
    setForm(emptyForm());
    setError(null);
  }

  function addIngredient() {
    setForm((f) => ({ ...f, ingredients: [...f.ingredients, { name: '', quantity: '' }] }));
  }

  function removeIngredient(idx: number) {
    setForm((f) => ({ ...f, ingredients: f.ingredients.filter((_, i) => i !== idx) }));
  }

  function updateIngredient(idx: number, field: keyof IngredientInput, value: string) {
    setForm((f) => {
      const updated = [...f.ingredients];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...f, ingredients: updated };
    });
  }

  async function save() {
    setError(null);
    const ingredients = form.ingredients.filter((i) => i.name.trim());
    if (!form.name.trim()) { setError('Meal name is required.'); return; }
    if (ingredients.length === 0) { setError('Add at least one ingredient.'); return; }

    setSaving(true);
    try {
      const url = editing ? `/api/meals/${editing}` : '/api/meals';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ingredients }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to save');
      }
      setForm(emptyForm());
      setEditing(null);
      await loadMeals();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteMeal(id: string) {
    if (!confirm('Delete this meal?')) return;
    await fetch(`/api/meals/${id}`, { method: 'DELETE' });
    loadMeals();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Form */}
          <div className="bg-white rounded-xl border border-rose-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-black mb-4">
              {editing ? 'Edit Meal' : 'Add New Meal'}
            </h2>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Meal name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-rose-200 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-lg border border-rose-200 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full rounded-lg border border-rose-200 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-rose-400"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>

              <div>
                <p className="text-sm font-medium text-black mb-2">Ingredients</p>
                <div className="space-y-2">
                  {form.ingredients.map((ing, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Quantity (e.g. 2 lbs)"
                        value={ing.quantity}
                        onChange={(e) => updateIngredient(idx, 'quantity', e.target.value)}
                        className="w-32 rounded-lg border border-rose-200 px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-rose-400"
                      />
                      <input
                        type="text"
                        placeholder="Ingredient name"
                        value={ing.name}
                        onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                        className="flex-1 rounded-lg border border-rose-200 px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-rose-400"
                      />
                      {form.ingredients.length > 1 && (
                        <button
                          onClick={() => removeIngredient(idx)}
                          className="text-gray-300 hover:text-red-400 transition-colors px-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={addIngredient}
                  className="mt-2 text-sm text-rose-500 hover:text-rose-700 font-medium"
                >
                  + Add ingredient
                </button>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white rounded-lg font-medium text-sm transition-colors"
                >
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Meal'}
                </button>
                {editing && (
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-2 rounded-lg border border-rose-200 text-black hover:bg-rose-50 text-sm transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Meal list */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-black">Saved Meals ({meals.length})</h2>
            {meals.length === 0 && (
              <p className="text-gray-400 text-sm bg-white rounded-xl border border-rose-200 p-6">
                No meals yet — add your first meal on the left.
              </p>
            )}
            {meals.map((meal) => (
              <div
                key={meal.id}
                className="bg-white rounded-xl border border-rose-200 shadow-sm p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-black">{meal.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${CATEGORY_COLORS[meal.category ?? 'any']}`}>
                        {CATEGORIES.find((c) => c.value === (meal.category ?? 'any'))?.label ?? 'Any'}
                      </span>
                    </div>
                    {meal.description && (
                      <p className="text-sm text-black mt-0.5">{meal.description}</p>
                    )}
                    <ul className="mt-2 flex flex-wrap gap-1">
                      {meal.ingredients.map((i) => (
                        <li
                          key={i.ingredient.name}
                          className="text-xs bg-rose-50 text-rose-700 rounded-full px-2 py-0.5"
                        >
                          {i.quantity} {i.ingredient.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => startEdit(meal)}
                      className="text-sm text-rose-500 hover:text-rose-700 font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteMeal(meal.id)}
                      className="text-sm text-gray-400 hover:text-red-500 font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
