import { supabase } from './supabase';
import type { Contact, Activity } from './types';

/**
 * AI Lead Scoring Engine — scores contacts 0-100 based on engagement and fit.
 * Higher score = more likely to convert.
 */
export async function scoreContact(
  contactId: string,
  contact: Contact,
  activities: Activity[]
): Promise<{ score: number; insights: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('score-lead', {
      body: {
        contact_id: contactId,
        contact_name: contact.name,
        company: contact.company,
        title: contact.title,
        email: contact.email,
        source: contact.source,
        activities: activities.map(a => ({ type: a.type, title: a.description, date: a.created_at })),
      },
    });

    if (!error && data?.score !== undefined) {
      await supabase.from('lp_contacts').update({
        ai_score: data.score,
        ai_insights: data.insights,
        updated_at: new Date().toISOString(),
      }).eq('id', contactId);
      return { score: data.score, insights: data.insights };
    }

    return fallbackScoring(contact, activities);
  } catch {
    return fallbackScoring(contact, activities);
  }
}

function fallbackScoring(contact: Contact, activities: Activity[]): { score: number; insights: string } {
  let score = 30; // Base score
  const signals: string[] = [];

  // Email engagement
  const emails = activities.filter(a => a.type === 'email').length;
  if (emails > 2) { score += 20; signals.push(`${emails} email interactions (high engagement)`); }
  else if (emails > 0) { score += 10; signals.push(`${emails} email interactions`); }

  // Meeting/call activity
  const meetings = activities.filter(a => a.type === 'meeting').length;
  const calls = activities.filter(a => a.type === 'call').length;
  if (meetings > 0) { score += 25; signals.push(`${meetings} meetings scheduled`); }
  if (calls > 0) { score += 15; signals.push(`${calls} calls completed`); }

  // Recency
  if (activities.length > 0) {
    const latest = new Date(activities[activities.length - 1].created_at);
    const daysSince = (Date.now() - latest.getTime()) / 86400000;
    if (daysSince < 3) { score += 10; signals.push('Active in last 3 days'); }
    else if (daysSince > 14) { score -= 10; signals.push('No activity in 14+ days'); }
  }

  // Contact completeness
  if (contact.email) score += 5;
  if (contact.phone) score += 5;
  if (contact.company) score += 5;
  if (contact.title) score += 5;

  score = Math.min(95, Math.max(5, score));

  const insights = signals.length > 0
    ? `Score ${score}/100. Signals: ${signals.join(', ')}.`
    : `Score ${score}/100. Add activities to improve scoring accuracy.`;

  return { score, insights };
}
