'use client';
import { useEffect, useState, useCallback } from 'react';
import Nav from '@/components/Nav';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'] as const;

type Meal = {
  id: string;
  name: string;
  category: string;
  ingredients: { quantity: string; ingredient: { name: string } }[];
};
type Entry = { dayOfWeek: number; mealType: string; meal: Meal };
type Plan = { weekStart: string; entries: Entry[] };
type GroceryItem = { name: string; quantity: string; meals: string[] };

function getMondayOfWeek(offset = 0): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + offset * 7;
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function formatWeek(weekStart: string): string {
  const d = new Date(weekStart + 'T00:00:00');
  const end = new Date(d);
  end.setDate(d.getDate() + 6);
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

export default function PlannerPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = getMondayOfWeek(weekOffset);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[] | null>(null);
  const [sendTo, setSendTo] = useState('both');
  const [sendMethod, setSendMethod] = useState('both');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  const loadPlan = useCallback(async () => {
    const res = await fetch(`/api/meal-plan?weekStart=${weekStart}`);
    setPlan(await res.json());
    setGroceryItems(null);
    setSendResult(null);
  }, [weekStart]);

  useEffect(() => {
    fetch('/api/meals').then((r) => r.json()).then(setMeals);
  }, []);

  useEffect(() => { loadPlan(); }, [loadPlan]);

  async function setMealSlot(dayOfWeek: number, mealType: string, mealId: string | null) {
    await fetch('/api/meal-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekStart, dayOfWeek, mealType, mealId }),
    });
    loadPlan();
  }

  async function generateGroceryList() {
    const res = await fetch(`/api/grocery-list?weekStart=${weekStart}`);
    const data = await res.json();
    setGroceryItems(data.items ?? []);
  }

  async function sendList() {
    if (!groceryItems) return;
    setSending(true);
    setSendResult(null);
    const res = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekStart, items: groceryItems, sendTo, method: sendMethod }),
    });
    const data = await res.json();
    setSendResult(data.ok ? 'Sent successfully!' : `Error: ${data.errors?.join(', ')}`);
    setSending(false);
  }

  function getEntry(dayOfWeek: number, mealType: string): Meal | undefined {
    return plan?.entries.find((e) => e.dayOfWeek === dayOfWeek && e.mealType === mealType)?.meal;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {/* Week navigation */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="px-3 py-1 rounded-lg bg-rose-200 hover:bg-rose-300 text-rose-800 font-bold transition-colors"
          >
            ‹
          </button>
          <h1 className="text-lg font-semibold text-black min-w-60 text-center">
            {formatWeek(weekStart)}
          </h1>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="px-3 py-1 rounded-lg bg-rose-200 hover:bg-rose-300 text-rose-800 font-bold transition-colors"
          >
            ›
          </button>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-sm text-rose-500 hover:underline ml-2"
            >
              This week
            </button>
          )}
        </div>

        {/* Planner grid */}
        <div className="overflow-x-auto rounded-xl border border-rose-200 bg-white shadow-sm mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-rose-100">
                <th className="p-3 text-left font-semibold text-rose-700 w-32">Day</th>
                {MEAL_TYPES.map((t) => (
                  <th key={t} className="p-3 text-left font-semibold text-rose-700 capitalize">{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day, i) => (
                <tr key={day} className="border-t border-rose-100 hover:bg-rose-50/50 transition-colors">
                  <td className="p-3 font-medium text-black whitespace-nowrap">{day}</td>
                  {MEAL_TYPES.map((type) => {
                    const assigned = getEntry(i, type);
                    const filtered = meals.filter((m) => m.category === 'any' || m.category === type);
                    return (
                      <td key={type} className="p-2">
                        <div className="flex items-center gap-1">
                          <select
                            value={assigned?.id ?? ''}
                            onChange={(e) => setMealSlot(i, type, e.target.value || null)}
                            className="flex-1 rounded-lg border border-rose-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                          >
                            <option value="">— none —</option>
                            {filtered.map((m) => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </select>
                          {assigned && (
                            <button
                              onClick={() => setMealSlot(i, type, null)}
                              title="Remove"
                              className="text-gray-300 hover:text-red-400 px-1 transition-colors"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Grocery list */}
        <div className="bg-white rounded-xl border border-rose-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-black">Grocery List</h2>
            <button
              onClick={generateGroceryList}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-medium text-sm transition-colors"
            >
              Generate List
            </button>
          </div>

          {groceryItems === null && (
            <p className="text-gray-400 text-sm">
              Click &quot;Generate List&quot; to compile ingredients from this week&apos;s meals.
            </p>
          )}

          {groceryItems !== null && groceryItems.length === 0 && (
            <p className="text-gray-400 text-sm">
              No meals planned yet — add meals to the planner above.
            </p>
          )}

          {groceryItems && groceryItems.length > 0 && (
            <>
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
                {groceryItems.map((item) => (
                  <li
                    key={item.name}
                    className="flex items-center gap-2 bg-rose-50 rounded-lg px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-rose-700 whitespace-nowrap">{item.quantity}</span>
                    <span className="text-black capitalize">{item.name}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center gap-4 border-t border-rose-100 pt-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-black">Send to:</label>
                  <select
                    value={sendTo}
                    onChange={(e) => setSendTo(e.target.value)}
                    className="rounded-lg border border-rose-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  >
                    <option value="both">Both</option>
                    <option value="person1">Person 1</option>
                    <option value="person2">Person 2</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-black">Via:</label>
                  <select
                    value={sendMethod}
                    onChange={(e) => setSendMethod(e.target.value)}
                    className="rounded-lg border border-rose-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  >
                    <option value="both">Email + Text</option>
                    <option value="email">Email only</option>
                    <option value="sms">Text only</option>
                  </select>
                </div>
                <button
                  onClick={sendList}
                  disabled={sending}
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg font-medium text-sm transition-colors"
                >
                  {sending ? 'Sending…' : 'Send List'}
                </button>
                {sendResult && (
                  <span
                    className={`text-sm font-medium ${
                      sendResult.startsWith('Error') ? 'text-red-500' : 'text-green-600'
                    }`}
                  >
                    {sendResult}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
