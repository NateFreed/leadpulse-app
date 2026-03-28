'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getUser } from '@/lib/auth';
import { getDeals, getContacts, getPipelineStats, updateDealStage } from '@/lib/db';
import type { Deal, Contact, DealStage } from '@/lib/types';
import DealPipeline from '@/components/DealPipeline';

function formatCurrency(cents: number): string {
  if (cents >= 10000000) return `$${(cents / 100000).toFixed(0)}K`;
  return `$${(cents / 100).toLocaleString()}`;
}

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contactMap, setContactMap] = useState<Map<string, Contact>>(new Map());
  const [stats, setStats] = useState<{ totalDeals: number; totalValue: number; weightedValue: number; wonDeals: number; lostDeals: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const user = await getUser();
        if (!user) return;
        setUserId(user.id);

        const [dealList, contactList, pipeStats] = await Promise.all([
          getDeals(user.id),
          getContacts(user.id),
          getPipelineStats(user.id),
        ]);

        setDeals(dealList);
        setContactMap(new Map(contactList.map((c) => [c.id, c])));
        setStats(pipeStats);
      } catch (err) {
        console.error('Failed to load:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleDealClick = useCallback((deal: Deal) => {
    // TODO: Open deal detail modal
    console.log('Deal clicked:', deal.title);
  }, []);

  const handleStageChange = useCallback(async (dealId: string, stage: DealStage) => {
    try {
      await updateDealStage(dealId, stage);
      setDeals((prev) => prev.map((d) => d.id === dealId ? { ...d, stage } : d));
    } catch (err) {
      console.error('Failed to update stage:', err);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sales Pipeline</h1>
          <p className="text-sm text-muted mt-1">{deals.length} active deals</p>
        </div>
        <Link
          href="/contacts/new"
          className="px-4 py-2 bg-accent hover:bg-accent-light rounded-xl text-sm font-semibold text-white shadow-sm shadow-accent/10 transition-all"
        >
          + Add Deal
        </Link>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="glow-card p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{stats.totalDeals}</div>
            <div className="text-xs text-muted">Active Deals</div>
          </div>
          <div className="glow-card p-4 text-center">
            <div className="text-2xl font-bold text-accent">{formatCurrency(stats.totalValue)}</div>
            <div className="text-xs text-muted">Pipeline Value</div>
          </div>
          <div className="glow-card p-4 text-center">
            <div className="text-2xl font-bold text-success">{stats.wonDeals}</div>
            <div className="text-xs text-muted">Deals Won</div>
          </div>
          <div className="glow-card p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{stats.totalDeals > 0 ? Math.round((stats.wonDeals / stats.totalDeals) * 100) : 0}%</div>
            <div className="text-xs text-muted">Win Rate</div>
          </div>
        </div>
      )}

      {/* Pipeline kanban */}
      <DealPipeline
        deals={deals.filter((d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost')}
        contacts={contactMap}
        onDealClick={handleDealClick}
        onStageChange={handleStageChange}
      />

      {/* Empty state */}
      {deals.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted mb-2">No deals in your pipeline yet.</p>
          <p className="text-sm text-muted/60">Add a contact and create your first deal to get started.</p>
        </div>
      )}
    </div>
  );
}
