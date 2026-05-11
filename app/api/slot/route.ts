import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { nanoid } from 'nanoid';

interface EntryInput {
  id?: string;
  foodName: string;
  reaction: string;
  isNew: boolean;
  notes: string;
}

// PUT /api/slot
// Replaces all entries for a given date + mealTime with the provided list.
// This is a full replace (delete old, insert new) so the client stays simple.
export async function PUT(req: NextRequest) {
  const body = await req.json() as {
    date: string;
    mealTime: string;
    entries: EntryInput[];
  };

  const { date, mealTime, entries } = body;
  if (!date || !mealTime || !Array.isArray(entries)) {
    return Response.json({ error: 'Invalid payload' }, { status: 400 });
  }

  // Delete all existing entries for this slot, then insert the new list
  await prisma.$transaction([
    prisma.foodEntry.deleteMany({ where: { date, mealTime } }),
    prisma.foodEntry.createMany({
      data: entries.map((e) => ({
        id: e.id ?? nanoid(),
        date,
        mealTime,
        foodName: e.foodName.trim(),
        reaction: e.reaction,
        isNew: e.isNew,
        notes: e.notes.trim(),
      })),
    }),
  ]);

  const updated = await prisma.foodEntry.findMany({
    where: { date, mealTime },
    orderBy: { createdAt: 'asc' },
  });

  return Response.json({ entries: updated });
}
