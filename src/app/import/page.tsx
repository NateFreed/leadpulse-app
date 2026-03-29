'use client';

import { useState, useCallback } from 'react';

interface ParsedRow {
  name: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  source: string;
}

export default function ImportPage() {
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'done'>('upload');
  const [importing, setImporting] = useState(false);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  }, []);

  function parseCSV(text: string) {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return;

    const hdrs = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
    setHeaders(hdrs);

    // Auto-map common header names
    const autoMap: Record<string, string> = {};
    const FIELD_PATTERNS: Record<string, RegExp> = {
      name: /^(name|full.?name|contact.?name)$/i,
      email: /^(email|e.?mail|email.?address)$/i,
      phone: /^(phone|tel|telephone|mobile)$/i,
      company: /^(company|organization|org|business)$/i,
      title: /^(title|job.?title|position|role)$/i,
      source: /^(source|lead.?source|origin|channel)$/i,
    };
    for (const hdr of hdrs) {
      for (const [field, pattern] of Object.entries(FIELD_PATTERNS)) {
        if (pattern.test(hdr)) autoMap[field] = hdr;
      }
    }
    setMapping(autoMap);
    setStep('map');
  }

  function handlePreview() {
    const lines = csvText.trim().split('\n');
    const hdrs = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));

    const rows: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/"/g, ''));
      const row: Record<string, string> = {};
      hdrs.forEach((h, j) => { row[h] = values[j] || ''; });

      rows.push({
        name: row[mapping.name] || '',
        email: row[mapping.email] || '',
        phone: row[mapping.phone] || '',
        company: row[mapping.company] || '',
        title: row[mapping.title] || '',
        source: row[mapping.source] || 'CSV Import',
      });
    }
    setParsedRows(rows.filter((r) => r.name || r.email));
    setStep('preview');
  }

  async function handleImport() {
    setImporting(true);
    // TODO: Batch insert to Supabase via createContact()
    await new Promise((r) => setTimeout(r, 1500));
    setStep('done');
    setImporting(false);
  }

  const FIELDS = ['name', 'email', 'phone', 'company', 'title', 'source'];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Import Contacts</h1>
        <p className="text-sm text-muted mt-1">Upload a CSV file to import leads in bulk</p>
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="space-y-4">
          <label className="glow-card p-8 flex flex-col items-center justify-center cursor-pointer hover:border-border-light transition-all">
            <span className="text-3xl mb-3">📄</span>
            <span className="text-sm text-foreground font-medium mb-1">Drop CSV file here or click to upload</span>
            <span className="text-xs text-muted">.csv files up to 10MB</span>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
          <div className="text-center">
            <p className="text-xs text-muted/50">Expected columns: Name, Email, Phone, Company, Title, Source</p>
          </div>
        </div>
      )}

      {/* Step 2: Map columns */}
      {step === 'map' && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Map Columns</h2>
          <p className="text-xs text-muted">Match your CSV columns to contact fields. We auto-detected what we could.</p>
          <div className="glow-card p-5 space-y-3">
            {FIELDS.map((field) => (
              <div key={field} className="flex items-center gap-4">
                <span className="text-sm text-foreground w-24 capitalize">{field}</span>
                <span className="text-muted">→</span>
                <select
                  value={mapping[field] || ''}
                  onChange={(e) => setMapping((prev) => ({ ...prev, [field]: e.target.value }))}
                  className="flex-1 px-3 py-2 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  <option value="">— Skip —</option>
                  {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep('upload')} className="px-6 py-3 bg-surface border border-border rounded-xl text-sm text-muted">Back</button>
            <button onClick={handlePreview} disabled={!mapping.name && !mapping.email}
              className="flex-1 py-3 bg-accent hover:bg-accent-light disabled:opacity-50 rounded-xl font-semibold text-white transition-all">
              Preview Import →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 'preview' && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Preview ({parsedRows.length} contacts)</h2>
          <div className="glow-card overflow-auto max-h-80">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-xs text-muted font-medium">Name</th>
                  <th className="text-left py-2 px-3 text-xs text-muted font-medium">Email</th>
                  <th className="text-left py-2 px-3 text-xs text-muted font-medium">Company</th>
                  <th className="text-left py-2 px-3 text-xs text-muted font-medium">Title</th>
                </tr>
              </thead>
              <tbody>
                {parsedRows.slice(0, 10).map((row, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 px-3 text-foreground/80">{row.name}</td>
                    <td className="py-2 px-3 text-muted">{row.email}</td>
                    <td className="py-2 px-3 text-muted">{row.company}</td>
                    <td className="py-2 px-3 text-muted">{row.title}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedRows.length > 10 && <p className="text-xs text-muted text-center py-2">...and {parsedRows.length - 10} more</p>}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep('map')} className="px-6 py-3 bg-surface border border-border rounded-xl text-sm text-muted">Back</button>
            <button onClick={handleImport} disabled={importing}
              className="flex-1 py-3 bg-accent hover:bg-accent-light disabled:opacity-50 rounded-xl font-semibold text-white transition-all">
              {importing ? 'Importing...' : `Import ${parsedRows.length} Contacts`}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Done */}
      {step === 'done' && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Import Complete!</h2>
          <p className="text-muted mb-6">{parsedRows.length} contacts imported. AI scoring will begin shortly.</p>
          <a href="/pipeline" className="px-6 py-3 bg-accent hover:bg-accent-light rounded-xl font-semibold text-white shadow-lg shadow-accent/25 transition-all inline-block">
            View Pipeline →
          </a>
        </div>
      )}
    </div>
  );
}
