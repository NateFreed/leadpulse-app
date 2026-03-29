import { supabase } from './supabase';

export interface CSVContact {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
  source?: string;
}

export function parseCSV(csvText: string): CSVContact[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  const contacts: CSVContact[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 2) continue;

    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = (values[idx] || '').trim().replace(/^["']|["']$/g, '');
    });

    const name = row['name'] || row['full name'] || row['contact'] || `${row['first name'] || ''} ${row['last name'] || ''}`.trim();
    const email = row['email'] || row['email address'] || '';

    if (name && email) {
      contacts.push({
        name,
        email,
        phone: row['phone'] || row['phone number'] || row['tel'] || '',
        company: row['company'] || row['organization'] || row['org'] || '',
        title: row['title'] || row['job title'] || row['position'] || '',
        source: row['source'] || 'csv_import',
      });
    }
  }

  return contacts;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export async function importContacts(userId: string, contacts: CSVContact[]): Promise<number> {
  let imported = 0;
  for (const contact of contacts) {
    try {
      await supabase.from('lp_contacts').insert({
        user_id: userId,
        name: contact.name,
        email: contact.email,
        phone: contact.phone || '',
        company: contact.company || '',
        title: contact.title || '',
        source: contact.source || 'csv_import',
        tags: [],
      });
      imported++;
    } catch {
      // Skip duplicates or errors
    }
  }
  return imported;
}
