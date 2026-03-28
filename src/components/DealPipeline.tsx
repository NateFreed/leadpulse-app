'use client';

import type { Deal, Contact, DealStage } from '@/lib/types';
import { DEAL_STAGES } from '@/lib/types';
import DealCard from './DealCard';

interface DealPipelineProps {
  deals: Deal[];
  contacts: Map<string, Contact>;
  onDealClick: (deal: Deal) => void;
  onStageChange: (dealId: string, stage: DealStage) => void;
}

function formatCurrency(cents: number): string {
  if (cents >= 100000) return `$${(cents / 100000).toFixed(0)}K`;
  return `$${(cents / 100).toLocaleString()}`;
}

export default function DealPipeline({ deals, contacts, onDealClick }: DealPipelineProps) {
  const activeStages = DEAL_STAGES.filter((s) => s.key !== 'closed_won' && s.key !== 'closed_lost');

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {activeStages.map((stage) => {
        const stageDeals = deals.filter((d) => d.stage === stage.key);
        const stageValue = stageDeals.reduce((sum, d) => sum + d.value, 0);

        return (
          <div key={stage.key} className="flex-shrink-0 w-72">
            {/* Column header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                <span className="text-sm font-semibold text-foreground">{stage.label}</span>
                <span className="text-xs text-muted bg-surface border border-border rounded-full px-2 py-0.5">
                  {stageDeals.length}
                </span>
              </div>
              <span className="text-xs font-medium text-accent">{formatCurrency(stageValue)}</span>
            </div>

            {/* Deal cards */}
            <div className="space-y-2 min-h-[200px] p-2 bg-surface/30 border border-border/50 rounded-xl">
              {stageDeals.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  contact={contacts.get(deal.contact_id)}
                  onClick={onDealClick}
                />
              ))}
              {stageDeals.length === 0 && (
                <div className="flex items-center justify-center h-20 text-xs text-muted/40">
                  No deals
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
