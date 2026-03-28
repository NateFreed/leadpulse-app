import { supabase } from './supabase';
import type { Deal, Contact, Activity } from './types';

export interface SalesAnalytics {
  pipelineValue: number;       // total value of open deals (cents)
  wonValue: number;            // total won deal value (cents)
  totalDeals: number;
  wonDeals: number;
  winRate: number;             // percentage
  avgDealSize: number;         // cents
  avgTimeToClose: number;      // days
  stageBreakdown: { stage: string; count: number; value: number }[];
  sourceBreakdown: { source: string; leads: number; won: number }[];
  dailyActivity: { date: string; activities: number }[];
}

export async function fetchSalesAnalytics(workspaceId: string): Promise<SalesAnalytics> {
  const [dealsRes, contactsRes, activitiesRes] = await Promise.all([
    supabase.from('lp_deals').select('*').eq('workspace_id', workspaceId),
    supabase.from('lp_contacts').select('*').eq('workspace_id', workspaceId),
    supabase.from('lp_activities').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: true }),
  ]);

  const deals: Deal[] = dealsRes.data || [];
  const contacts: Contact[] = contactsRes.data || [];
  const activities: Activity[] = activitiesRes.data || [];

  const openDeals = deals.filter(d => !['closed_won', 'closed_lost'].includes(d.stage));
  const wonDeals = deals.filter(d => d.stage === 'closed_won');
  const closedDeals = deals.filter(d => ['closed_won', 'closed_lost'].includes(d.stage));

  const pipelineValue = openDeals.reduce((s, d) => s + d.value, 0);
  const wonValue = wonDeals.reduce((s, d) => s + d.value, 0);
  const winRate = closedDeals.length > 0 ? Math.round((wonDeals.length / closedDeals.length) * 100) : 0;
  const avgDealSize = wonDeals.length > 0 ? Math.round(wonValue / wonDeals.length) : 0;

  // Avg time to close
  let avgTimeToClose = 0;
  if (wonDeals.length > 0) {
    const totalDays = wonDeals.reduce((sum, d) => {
      return sum + (new Date(d.updated_at).getTime() - new Date(d.created_at).getTime()) / 86400000;
    }, 0);
    avgTimeToClose = Math.round(totalDays / wonDeals.length);
  }

  // Stage breakdown
  const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
  const stageBreakdown = stages.map(stage => {
    const stageDeals = deals.filter(d => d.stage === stage);
    return { stage, count: stageDeals.length, value: stageDeals.reduce((s, d) => s + d.value, 0) };
  });

  // Source breakdown
  const sourceMap = new Map<string, { leads: number; won: number }>();
  for (const c of contacts) {
    const src = c.source || 'manual';
    const existing = sourceMap.get(src) || { leads: 0, won: 0 };
    existing.leads++;
    sourceMap.set(src, existing);
  }
  // Count wins per source via contact → deal linkage
  for (const d of wonDeals) {
    if (d.contact_id) {
      const contact = contacts.find(c => c.id === d.contact_id);
      if (contact) {
        const src = contact.source || 'manual';
        const existing = sourceMap.get(src) || { leads: 0, won: 0 };
        existing.won++;
        sourceMap.set(src, existing);
      }
    }
  }
  const sourceBreakdown = Array.from(sourceMap.entries())
    .map(([source, data]) => ({ source, ...data }))
    .sort((a, b) => b.leads - a.leads);

  // Daily activity
  const byDate = new Map<string, number>();
  for (const a of activities) {
    const date = a.created_at.slice(0, 10);
    byDate.set(date, (byDate.get(date) || 0) + 1);
  }
  const dailyActivity = Array.from(byDate.entries())
    .map(([date, count]) => ({ date, activities: count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    pipelineValue, wonValue, totalDeals: deals.length, wonDeals: wonDeals.length,
    winRate, avgDealSize, avgTimeToClose, stageBreakdown, sourceBreakdown, dailyActivity,
  };
}
