import { supabase } from './supabase';
import type { Contact, Deal, Activity, DealStage } from './types';

// Contacts
export async function getContacts(userId: string): Promise<Contact[]> {
  const { data, error } = await supabase.from('lp_contacts').select('*').eq('user_id', userId).order('ai_score', { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function createContact(userId: string, name: string, email: string, company = '', source = 'manual'): Promise<Contact> {
  const { data, error } = await supabase.from('lp_contacts').insert({ user_id: userId, name, email, company, source, tags: [], title: '', phone: '' }).select().single();
  if (error) throw error;
  return data;
}

export async function updateContact(contactId: string, updates: Partial<Contact>): Promise<void> {
  await supabase.from('lp_contacts').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', contactId);
}

export async function deleteContact(contactId: string): Promise<void> {
  await supabase.from('lp_contacts').delete().eq('id', contactId);
}

// Deals
export async function getDeals(userId: string): Promise<Deal[]> {
  const { data, error } = await supabase.from('lp_deals').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getDealsByStage(userId: string, stage: DealStage): Promise<Deal[]> {
  const { data, error } = await supabase.from('lp_deals').select('*').eq('user_id', userId).eq('stage', stage).order('value', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createDeal(userId: string, contactId: string, title: string, value: number): Promise<Deal> {
  const { data, error } = await supabase.from('lp_deals').insert({ user_id: userId, contact_id: contactId, title, value, stage: 'lead', probability: 10, notes: '' }).select().single();
  if (error) throw error;
  return data;
}

export async function updateDealStage(dealId: string, stage: DealStage): Promise<void> {
  const probabilities: Record<DealStage, number> = { lead: 10, qualified: 25, proposal: 50, negotiation: 75, closed_won: 100, closed_lost: 0 };
  await supabase.from('lp_deals').update({ stage, probability: probabilities[stage], updated_at: new Date().toISOString() }).eq('id', dealId);
}

export async function updateDeal(dealId: string, updates: Partial<Deal>): Promise<void> {
  await supabase.from('lp_deals').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', dealId);
}

// Activities
export async function getActivities(contactId: string): Promise<Activity[]> {
  const { data, error } = await supabase.from('lp_activities').select('*').eq('contact_id', contactId).order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createActivity(userId: string, contactId: string, type: Activity['type'], description: string, dealId?: string): Promise<Activity> {
  const { data, error } = await supabase.from('lp_activities').insert({ user_id: userId, contact_id: contactId, deal_id: dealId || null, type, description, completed: false }).select().single();
  if (error) throw error;
  return data;
}

// Pipeline Stats
export async function getPipelineStats(userId: string): Promise<{
  totalDeals: number;
  totalValue: number;
  weightedValue: number;
  wonDeals: number;
  lostDeals: number;
}> {
  const deals = await getDeals(userId);
  const active = deals.filter(d => !['closed_won', 'closed_lost'].includes(d.stage));
  const totalValue = active.reduce((sum, d) => sum + d.value, 0);
  const weightedValue = active.reduce((sum, d) => sum + (d.value * d.probability / 100), 0);
  const wonDeals = deals.filter(d => d.stage === 'closed_won').length;
  const lostDeals = deals.filter(d => d.stage === 'closed_lost').length;
  return { totalDeals: active.length, totalValue, weightedValue, wonDeals, lostDeals };
}
