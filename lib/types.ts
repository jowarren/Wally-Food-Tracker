export type MealTime = 'breakfast' | 'morning-snack' | 'lunch' | 'afternoon-snack' | 'dinner';

export type Reaction =
  | 'loved'       // 😍 ate enthusiastically
  | 'liked'       // 👍 ate well
  | 'neutral'     // 😐 ate some
  | 'disliked'    // 👎 ate reluctantly / little
  | 'refused'     // 🙅 would not eat
  | 'allergic';   // ⚠️ showed allergic reaction

export interface FoodEntry {
  id: string;
  foodName: string;
  reaction: Reaction;
  isNew: boolean;       // first time offering this food
  notes: string;
}

export interface MealSlot {
  mealTime: MealTime;
  entries: FoodEntry[];
}

// Key: "YYYY-MM-DD"
export type DayLog = Record<MealTime, FoodEntry[]>;

// Key: "YYYY-MM-DD"
export type WeekLog = Record<string, DayLog>;

export const MEAL_TIMES: { key: MealTime; label: string; emoji: string }[] = [
  { key: 'breakfast',       label: 'Breakfast',        emoji: '🌅' },
  { key: 'morning-snack',   label: 'Morning Snack',    emoji: '🍌' },
  { key: 'lunch',           label: 'Lunch',            emoji: '☀️' },
  { key: 'afternoon-snack', label: 'Afternoon Snack',  emoji: '🍎' },
  { key: 'dinner',          label: 'Dinner',           emoji: '🌙' },
];

export const REACTIONS: {
  key: Reaction;
  label: string;
  emoji: string;
  color: string;       // Tailwind bg class
  text: string;        // Tailwind text class
  border: string;      // Tailwind border class
}[] = [
  { key: 'loved',    label: 'Loved it!',   emoji: '😍', color: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  { key: 'liked',    label: 'Liked it',    emoji: '👍', color: 'bg-green-100',   text: 'text-green-800',   border: 'border-green-300'   },
  { key: 'neutral',  label: 'Neutral',     emoji: '😐', color: 'bg-yellow-100',  text: 'text-yellow-800',  border: 'border-yellow-300'  },
  { key: 'disliked', label: 'Disliked',    emoji: '👎', color: 'bg-orange-100',  text: 'text-orange-800',  border: 'border-orange-300'  },
  { key: 'refused',  label: 'Refused',     emoji: '🙅', color: 'bg-red-100',     text: 'text-red-800',     border: 'border-red-300'     },
  { key: 'allergic', label: 'Allergic ⚠️', emoji: '⚠️', color: 'bg-purple-100',  text: 'text-purple-800',  border: 'border-purple-300'  },
];

export function getReaction(key: Reaction) {
  return REACTIONS.find((r) => r.key === key)!;
}

export function emptyDay(): DayLog {
  return {
    breakfast: [],
    'morning-snack': [],
    lunch: [],
    'afternoon-snack': [],
    dinner: [],
  };
}
