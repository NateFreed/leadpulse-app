'use client';

import type { Deal, Contact } from '@/lib/types';

interface DealCardProps {
  deal: Deal;
  contact?: Contact;
  onClick: (deal: Deal) => void;
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString()}`;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-success bg-success/15';
  if (score >= 60) return 'text-accent bg-accent/15';
  if (score >= 40) return 'text-warning bg-warning/15';
  return 'text-muted bg-surface';
}

export default function DealCard({ deal, contact, onClick }: DealCardProps) {
  return (
    <div
      onClick={() => onClick(deal)}
      className="glow-card p-4 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-semibold text-foreground line-clamp-1">{deal.title}</h4>
        <span className="text-sm font-bold text-accent ml-2 flex-shrink-0">
          {formatCurrency(deal.value)}
        </span>
      </div>

      {contact && (
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-accent/15 flex items-center justify-center text-xs font-bold text-accent">
            {contact.name.charAt(0)}
          </div>
          <div>
            <p className="text-xs text-foreground/80">{contact.name}</p>
            <p className="text-xs text-muted">{contact.company}</p>
          </div>
          {contact.ai_score !== null && (
            <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${getScoreColor(contact.ai_score)}`}>
              {contact.ai_score}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted">
        <span>{deal.probability}% likely</span>
        {deal.expected_close && (
          <span>Close: {new Date(deal.expected_close).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        )}
      </div>

      {contact && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
          <a href={`https://bookpulse.pages.dev/book`} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-[10px] text-accent hover:text-accent-light font-medium">
            Book a call
          </a>
          <span className="text-border">·</span>
          <a href={`https://proposalpulse.pages.dev/editor`} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-[10px] text-muted hover:text-foreground font-medium">
            Send proposal
          </a>
        </div>
      )}
    </div>
  );
}
