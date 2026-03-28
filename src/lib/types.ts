export interface Contact {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  source: string;
  tags: string[];
  ai_score: number | null;       // 0-100
  ai_score_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  user_id: string;
  contact_id: string;
  title: string;
  value: number;            // in cents
  stage: DealStage;
  probability: number;      // 0-100
  expected_close: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export type DealStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';

export const DEAL_STAGES: { key: DealStage; label: string; color: string }[] = [
  { key: 'lead', label: 'New Lead', color: '#6b7a99' },
  { key: 'qualified', label: 'Qualified', color: '#f59e0b' },
  { key: 'proposal', label: 'Proposal', color: '#6366f1' },
  { key: 'negotiation', label: 'Negotiation', color: '#8b5cf6' },
  { key: 'closed_won', label: 'Won', color: '#34d399' },
  { key: 'closed_lost', label: 'Lost', color: '#ef4444' },
];

export interface Activity {
  id: string;
  user_id: string;
  contact_id: string;
  deal_id: string | null;
  type: 'email' | 'call' | 'meeting' | 'note' | 'task';
  description: string;
  completed: boolean;
  due_date: string | null;
  created_at: string;
}

export interface PipelineStats {
  totalDeals: number;
  totalValue: number;        // cents
  weightedValue: number;     // value * probability
  stageBreakdown: { stage: DealStage; count: number; value: number }[];
  conversionRate: number;
  avgDealSize: number;
}
