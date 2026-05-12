export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { count = 5 } = await req.json().catch(() => ({}));

    const [reactionRows, existingMeals] = await Promise.all([
      prisma.foodEntry.findMany({
        where: { reaction: { in: ['loved', 'liked'] } },
        select: { foodName: true, reaction: true },
        distinct: ['foodName'],
        orderBy: { foodName: 'asc' },
      }),
      prisma.meal.findMany({ select: { name: true } }),
    ]);

    const loved = reactionRows.filter(r => r.reaction === 'loved').map(r => r.foodName);
    const liked = reactionRows.filter(r => r.reaction === 'liked').map(r => r.foodName);
    const existingNames = existingMeals.map(m => m.name);

    if (loved.length === 0 && liked.length === 0) {
      return Response.json({ error: 'No loved or liked foods logged yet.' }, { status: 400 });
    }

    const prompt = `You are a pediatric nutrition assistant helping parents plan meals for a toddler.

The toddler has tried these foods and their reactions are:
- LOVED: ${loved.length > 0 ? loved.join(', ') : 'none yet'}
- LIKED: ${liked.length > 0 ? liked.join(', ') : 'none yet'}

Already in the meal library (don't suggest these): ${existingNames.length > 0 ? existingNames.join(', ') : 'none yet'}

Suggest ${count} toddler-appropriate meal ideas that:
1. Build on the foods they already love/like as the base
2. Gently introduce 1-2 new ingredients per meal (not too wild — age-appropriate, common, easy to prepare)
3. Are nutritionally balanced across breakfast, lunch, and dinner
4. Are practical for parents to prepare

Return ONLY a JSON array with no markdown, no explanation — just the raw JSON array. Each item must have exactly these fields:
{
  "name": "Meal name",
  "description": "One sentence describing the meal and why it suits the toddler",
  "category": "breakfast" | "lunch" | "dinner" | "any",
  "ingredients": [
    { "name": "ingredient name", "quantity": "amount", "isNew": true | false }
  ]
}

Mark isNew: true for ingredients the toddler hasn't tried yet (not in the loved/liked list).`;

    const message = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON array found in response');

    const suggestions = JSON.parse(jsonMatch[0]);
    return Response.json({ suggestions, loved, liked });
  } catch (e) {
    console.error('[/api/ideas]', e);
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
