import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

const includeIngredients = {
  ingredients: {
    include: { ingredient: true },
  },
};

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.meal.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, description, category, ingredients } = await req.json();

    // Delete existing ingredient links first, then recreate
    await prisma.mealIngredient.deleteMany({ where: { mealId: id } });

    const meal = await prisma.meal.update({
      where: { id },
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
    return Response.json(meal);
  } catch (e) {
    console.error(e);
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
