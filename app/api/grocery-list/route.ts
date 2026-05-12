export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const weekStart = searchParams.get('weekStart');
    if (!weekStart) return Response.json({ error: 'weekStart required' }, { status: 400 });

    const plan = await prisma.mealPlan.findUnique({
      where: { weekStart },
      include: {
        entries: {
          include: {
            meal: {
              include: {
                ingredients: { include: { ingredient: true } },
              },
            },
          },
        },
      },
    });

    if (!plan) return Response.json({ weekStart, items: [] });

    const aggregated = new Map<string, { quantity: string; meals: string[] }>();
    for (const entry of plan.entries) {
      for (const mi of entry.meal.ingredients) {
        const name = mi.ingredient.name;
        if (aggregated.has(name)) {
          const item = aggregated.get(name)!;
          if (!item.meals.includes(entry.meal.name)) item.meals.push(entry.meal.name);
        } else {
          aggregated.set(name, { quantity: mi.quantity, meals: [entry.meal.name] });
        }
      }
    }

    const items = Array.from(aggregated.entries())
      .map(([name, { quantity, meals }]) => ({ name, quantity, meals }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return Response.json({ weekStart, items });
  } catch (e) {
    console.error(e);
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
