'use client';

import type { Contact } from '@/lib/types';

interface ContactCardProps {
  contact: Contact;
  onClick: (contact: Contact) => void;
}

function getScoreBadge(score: number | null): { text: string; class: string } | null {
  if (score === null) return null;
  if (score >= 80) return { text: 'Hot', class: 'bg-success/15 text-success' };
  if (score >= 60) return { text: 'Warm', class: 'bg-accent/15 text-accent' };
  if (score >= 40) return { text: 'Cool', class: 'bg-blue-400/15 text-blue-400' };
  return { text: 'Cold', class: 'bg-muted/15 text-muted' };
}

export default function ContactCard({ contact, onClick }: ContactCardProps) {
  const badge = getScoreBadge(contact.ai_score);

  return (
    <div
      onClick={() => onClick(contact)}
      className="glow-card p-4 cursor-pointer hover:border-border-light transition-all flex items-center gap-4"
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center text-sm font-bold text-accent flex-shrink-0">
        {contact.name.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-foreground truncate">{contact.name}</h4>
          {badge && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.class}`}>
              {badge.text} {contact.ai_score}
            </span>
          )}
        </div>
        <p className="text-xs text-muted truncate">
          {contact.title}{contact.title && contact.company ? ' at ' : ''}{contact.company}
        </p>
      </div>

      {/* Source + tags */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {contact.source && (
          <span className="text-xs text-muted/60 bg-surface border border-border rounded-full px-2 py-0.5">
            {contact.source}
          </span>
        )}
      </div>
    </div>
  );
}
