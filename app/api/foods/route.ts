import { prisma } from '@/lib/db';

// GET /api/foods
// Returns all unique food names ever logged, sorted alphabetically.
// Used for autocomplete in the meal modal.
export async function GET() {
  const rows = await prisma.foodEntry.findMany({
    select: { foodName: true },
    distinct: ['foodName'],
    orderBy: { foodName: 'asc' },
  });

  return Response.json({ foods: rows.map((r: { foodName: string }) => r.foodName) });
}
