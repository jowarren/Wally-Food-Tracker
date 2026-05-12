export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db';

// GET /api/history
// Returns all food entries ever logged, for the history page.
export async function GET() {
  try {
    const entries = await prisma.foodEntry.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return Response.json({ entries });
  } catch (e) {
    console.error('[/api/history]', e);
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
