export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/week?monday=YYYY-MM-DD
// Returns all food entries for the 7-day period starting on monday.
export async function GET(req: NextRequest) {
  const monday = req.nextUrl.searchParams.get('monday');
  if (!monday || !/^\d{4}-\d{2}-\d{2}$/.test(monday)) {
    return Response.json({ error: 'Missing or invalid ?monday=YYYY-MM-DD' }, { status: 400 });
  }

  // Build the 7 date strings for the week
  const dates: string[] = [];
  const start = new Date(monday + 'T00:00:00Z');
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }

  const entries = await prisma.foodEntry.findMany({
    where: { date: { in: dates } },
    orderBy: { createdAt: 'asc' },
  });

  return Response.json({ entries });
}
