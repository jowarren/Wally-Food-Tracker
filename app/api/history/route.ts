export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db';

// GET /api/history
// Returns all food entries ever logged, for the history page.
export async function GET() {
  const entries = await prisma.foodEntry.findMany({
    orderBy: { createdAt: 'asc' },
  });

  return Response.json({ entries });
}
