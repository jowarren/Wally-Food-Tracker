import { nanoid } from 'nanoid';
import type { WeekLog, MealTime, FoodEntry, Reaction } from './types';
import { emptyDay } from './types';

// ── Date helpers ──────────────────────────────────────────────────────────────

/** Returns "YYYY-MM-DD" for a Date */
export function toKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Returns the Date for Monday of the given week offset (0 = current week) */
export function getMondayOf(offset = 0): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff + offset * 7);
  return d;
}

/** Returns the "YYYY-MM-DD" key for Monday of the given week offset */
export function getMondayKey(offset = 0): string {
  return toKey(getMondayOf(offset));
}

/** Returns array of 7 date keys for Mon–Sun of a week */
export function weekDays(monday: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toKey(d);
  });
}

export function formatDate(dateKey: string): { short: string; day: string; isToday: boolean } {
  const d = new Date(dateKey + 'T00:00:00');
  const today = toKey(new Date());
  return {
    day: d.toLocaleDateString('en-US', { weekday: 'short' }),
    short: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    isToday: dateKey === today,
  };
}

// ── Entry factory ─────────────────────────────────────────────────────────────

export function makeEntry(
  foodName: string,
  reaction: Reaction,
  isNew: boolean,
  notes: string,
): FoodEntry {
  return { id: nanoid(), foodName: foodName.trim(), reaction, isNew, notes: notes.trim() };
}

// ── DB row → client type ──────────────────────────────────────────────────────

export interface DbEntry {
  id: string;
  date: string;
  mealTime: string;
  foodName: string;
  reaction: string;
  isNew: boolean;
  notes: string;
}

/** Convert a flat array of DB rows into the nested WeekLog structure */
export function entriesToWeekLog(entries: DbEntry[]): WeekLog {
  const log: WeekLog = {};
  for (const e of entries) {
    if (!log[e.date]) log[e.date] = emptyDay();
    const mealTime = e.mealTime as MealTime;
    if (!log[e.date][mealTime]) log[e.date][mealTime] = [];
    log[e.date][mealTime].push({
      id: e.id,
      foodName: e.foodName,
      reaction: e.reaction as Reaction,
      isNew: e.isNew,
      notes: e.notes,
    } satisfies FoodEntry);
  }
  return log;
}

// ── Food history (computed client-side from DB entries) ───────────────────────

export interface FoodSummary {
  name: string;
  timesOffered: number;
  reactions: Record<Reaction, number>;
  lastOffered: string;
  isNew: boolean;
  everAllergic: boolean;
}

export function buildFoodHistory(entries: DbEntry[]): FoodSummary[] {
  const map = new Map<string, FoodSummary>();

  for (const e of entries) {
    const key = e.foodName.toLowerCase();
    const existing = map.get(key);
    const reaction = e.reaction as Reaction;

    if (!existing) {
      map.set(key, {
        name: e.foodName,
        timesOffered: 1,
        reactions: { loved: 0, liked: 0, neutral: 0, disliked: 0, refused: 0, allergic: 0, [reaction]: 1 },
        lastOffered: e.date,
        isNew: e.isNew,
        everAllergic: reaction === 'allergic',
      });
    } else {
      existing.timesOffered++;
      existing.reactions[reaction]++;
      if (e.date > existing.lastOffered) existing.lastOffered = e.date;
      if (reaction === 'allergic') existing.everAllergic = true;
    }
  }

  return [...map.values()].sort((a, b) => b.lastOffered.localeCompare(a.lastOffered));
}
