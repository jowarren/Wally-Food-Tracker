import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

const includeIngredients = {
  ingredients: {
    include: { ingredient: true },
  },
};

async function getMealsWithIngredients() {
  return prisma.meal.findMany({
    orderBy: { name: 'asc' },
    include: includeIngredients,
  });
}

export async function GET() {
  try {
    return Response.json(await getMealsWithIngredients());
  } catch (e) {
    console.error(e);
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, description, category, ingredients } = await req.json();
    const meal = await prisma.meal.create({
      data: {
        name,
        description: description || null,
        category: category ?? 'any',
        ingredients: {
          create: (ingredients as { name: string; quantity: string }[]).map((ing) => ({
            quantity: ing.quantity,
            ingredient: {
              connectOrCreate: {
                where: { name: ing.name.toLowerCase().trim() },
                create: { name: ing.name.toLowerCase().trim() },
              },
            },
          })),
        },
      },
      include: includeIngredients,
    });
    return Response.json(meal, { status: 201 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
