export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { transporter, RECIPIENTS } from '@/lib/mailer';

export async function POST(req: NextRequest) {
  const { weekStart, items, sendTo, method } = await req.json();

  const recipientKeys: (keyof typeof RECIPIENTS)[] =
    sendTo === 'both' ? ['person1', 'person2'] : [sendTo as keyof typeof RECIPIENTS];

  const listText = items
    .map((item: { name: string; quantity: string }) => `• ${item.quantity} ${item.name}`)
    .join('\n');

  const subject = `Grocery List – Week of ${weekStart}`;
  const htmlBody = `
    <h2>Grocery List – Week of ${weekStart}</h2>
    <ul>
      ${items
        .map(
          (item: { name: string; quantity: string }) =>
            `<li><strong>${item.quantity}</strong> ${item.name}</li>`
        )
        .join('')}
    </ul>
  `;

  const errors: string[] = [];

  for (const key of recipientKeys) {
    const recipient = RECIPIENTS[key];

    if ((method === 'email' || method === 'both') && recipient.email) {
      try {
        await transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: recipient.email,
          subject,
          html: htmlBody,
          text: `Grocery List – Week of ${weekStart}\n\n${listText}`,
        });
      } catch (e) {
        errors.push(`Email to ${recipient.name} failed: ${(e as Error).message}`);
      }
    }

    if ((method === 'sms' || method === 'both') && recipient.smsGateway) {
      try {
        await transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: recipient.smsGateway,
          subject: '',
          text: `Grocery List (${weekStart}):\n${listText}`,
        });
      } catch (e) {
        errors.push(`SMS to ${recipient.name} failed: ${(e as Error).message}`);
      }
    }
  }

  if (errors.length > 0) {
    return Response.json({ ok: false, errors }, { status: 500 });
  }

  return Response.json({ ok: true });
}
