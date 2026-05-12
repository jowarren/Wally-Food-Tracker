export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

function getMondayOfWeek(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

const includeEntries = {
  entries: {
    include: {
      meal: {
        include: {
          ingredients: { include: { ingredient: true } },
        },
      },
    },
    orderBy: [{ dayOfWeek: 'asc' as const }, { mealType: 'asc' as const }],
  },
};

async function buildPlanResponse(weekStart: string) {
  const plan = await prisma.mealPlan.findUnique({
    where: { weekStart },
    include: includeEntries,
  });

  if (!plan) return { weekStart, entries: [] };

  return {
    weekStart,
    entries: plan.entries.map((e) => ({
      dayOfWeek: e.dayOfWeek,
      mealType: e.mealType,
      meal: {
        id: e.meal.id,
        name: e.meal.name,
        description: e.meal.description,
        category: e.meal.category,
        ingredients: e.meal.ingredients.map((mi) => ({
          quantity: mi.quantity,
          ingredient: { id: mi.ingredient.id, name: mi.ingredient.name },
        })),
      },
    })),
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const weekStart = searchParams.get('weekStart') ?? getMondayOfWeek();
    return Response.json(await buildPlanResponse(weekStart));
  } catch (e) {
    console.error(e);
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { weekStart, dayOfWeek, mealType, mealId } = await req.json();

    let plan = await prisma.mealPlan.findUnique({ where: { weekStart } });
    if (!plan) {
      plan = await prisma.mealPlan.create({ data: { weekStart } });
    }

    if (mealId === null) {
      await prisma.mealPlanEntry.deleteMany({
        where: { mealPlanId: plan.id, dayOfWeek, mealType },
      });
    } else {
      await prisma.mealPlanEntry.upsert({
        where: {
          mealPlanId_dayOfWeek_mealType: {
            mealPlanId: plan.id,
            dayOfWeek,
            mealType,
          },
        },
        update: { mealId },
        create: { mealPlanId: plan.id, mealId, dayOfWeek, mealType },
      });
    }

    return Response.json(await buildPlanResponse(weekStart));
  } catch (e) {
    console.error(e);
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
