import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AGENTMAIL_INBOX_ID, sendAgentMail } from './_agentmail.js';
import { listDueReminderDeliveries, markCaseReminderEmailed } from './_auth.js';

const DISPATCH_TOKEN = process.env.REMINDER_DISPATCH_TOKEN;

function isAuthorized(req: VercelRequest) {
  const headerToken = req.headers['x-reminder-dispatch-token'];
  const queryToken = req.query.token;
  const token = Array.isArray(headerToken)
    ? headerToken[0]
    : typeof headerToken === 'string'
      ? headerToken
      : Array.isArray(queryToken)
        ? queryToken[0]
        : typeof queryToken === 'string'
          ? queryToken
          : '';

  return Boolean(DISPATCH_TOKEN && token && token === DISPATCH_TOKEN);
}

function buildReminderEmailBody(userName: string | undefined, reminder: Awaited<ReturnType<typeof listDueReminderDeliveries>>[number]['reminder']) {
  const dueDate = new Date(reminder.dueAt);
  const now = new Date();
  const hoursUntilDue = Math.round((dueDate.getTime() - now.getTime()) / (60 * 60 * 1000));
  const timingLine = hoursUntilDue < 0
    ? 'This reminder is already due or slightly past due.'
    : hoursUntilDue <= 24
      ? 'This reminder is due within the next 24 hours.'
      : 'This reminder is coming up soon.';

  return [
    `Hi ${userName || 'there'},`,
    '',
    'DivorceOS reminder:',
    `• ${reminder.title}`,
    reminder.description ? `• ${reminder.description}` : null,
    `• Due: ${dueDate.toLocaleString()}`,
    reminder.forms.length ? `• Suggested forms: ${reminder.forms.join(', ')}` : null,
    `• ${timingLine}`,
    '',
    'You can log in to DivorceOS to review the reminder, update dates, and jump back into forms or county filing guidance.',
  ].filter(Boolean).join('\n');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!DISPATCH_TOKEN) {
    return res.status(500).json({ error: 'REMINDER_DISPATCH_TOKEN is not configured' });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const deliveries = await listDueReminderDeliveries(24);
    let sent = 0;
    const failures: Array<{ reminderId: string; error: string }> = [];

    for (const delivery of deliveries) {
      try {
        await sendAgentMail({
          to: delivery.userEmail,
          from: AGENTMAIL_INBOX_ID,
          subject: `DivorceOS reminder: ${delivery.reminder.title}`,
          body: buildReminderEmailBody(delivery.userName, delivery.reminder),
          name: delivery.userName || delivery.userEmail,
          metadata: {
            type: 'case-reminder-live',
            reminderId: delivery.reminder.id,
            userId: delivery.userId,
          },
        });
        await markCaseReminderEmailed(delivery.userId, delivery.reminder.id);
        sent += 1;
      } catch (error) {
        console.error('Failed to send due reminder email', error);
        failures.push({
          reminderId: delivery.reminder.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return res.status(200).json({
      ok: true,
      dueCount: deliveries.length,
      sent,
      failures,
    });
  } catch (error) {
    console.error('Reminder dispatch error', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Reminder dispatch failed' });
  }
}
