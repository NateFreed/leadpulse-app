'use client';

import Tutorial from './Tutorial';

const STEPS = [
  {
    title: 'Add Your Contacts',
    description: 'Build your contact database with names, companies, and details. Every lead starts here.',
  },
  {
    title: 'Create a Deal',
    description: 'Link a deal to a contact with a value and expected close date. Track every opportunity in your pipeline.',
  },
  {
    title: 'Work Your Pipeline',
    description: 'Drag deals across stages — New Lead, Qualified, Proposal, Negotiation. See your total pipeline value at a glance.',
  },
  {
    title: 'Let AI Score Your Leads',
    description: 'AI ranks your leads Hot, Warm, or Cold based on engagement signals. Focus on the deals most likely to close.',
  },
];

export default function AppTutorial() {
  return (
    <Tutorial
      appName="LeadPulse"
      steps={STEPS}
      accentColor="bg-accent"
    />
  );
}
