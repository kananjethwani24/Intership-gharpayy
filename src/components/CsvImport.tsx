import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileSpreadsheet, Check } from 'lucide-react';
import { toast } from 'sonner';

const LEAD_FIELDS = [
  { key: 'skip', label: '— Skip —' },
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'source', label: 'Source' },
  { key: 'budget', label: 'Budget' },
  { key: 'preferredLocation', label: 'Location' },
  { key: 'notes', label: 'Notes' },
];

const CsvImport = ({ onComplete }: { onComplete?: () => void }) => {
  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'done'>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<number, string>>({});
  const [importing, setImporting] = useState(false);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const csvRows: string[][] = [];
      let currentRow: string[] = [];
      let currentField = '';
      let inQuotes = false;

      // Robust CSV parsing
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          currentRow.push(currentField.trim().replace(/^"|"$/g, ''));
          currentField = '';
        } else if ((char === '\n' || (char === '\r' && text[i+1] === '\n')) && !inQuotes) {
          if (char === '\r') i++;
          currentRow.push(currentField.trim().replace(/^"|"$/g, ''));
          csvRows.push(currentRow);
          currentRow = [];
          currentField = '';
        } else {
          currentField += char;
        }
      }
      if (currentRow.length > 0 || currentField) {
        currentRow.push(currentField.trim().replace(/^"|"$/g, ''));
        csvRows.push(currentRow);
      }

      if (csvRows.length === 0) {
        toast.error('Invalid CSV format');
        return;
      }

      const headers = csvRows[0];
      const dataRows = csvRows.slice(1).filter(r => r.some(c => c));

      setHeaders(headers);
      setRows(dataRows);
      
      // Smart Auto-map
      const autoMap: Record<number, string> = {};
      headers.forEach((h, i) => {
        const lower = h.toLowerCase().trim();
        if (lower.includes('name')) autoMap[i] = 'name';
        else if (lower.includes('phone') || lower.includes('mobile') || lower.includes('contact')) autoMap[i] = 'phone';
        else if (lower.includes('email')) autoMap[i] = 'email';
        else if (lower.includes('location') || lower.includes('locality')) autoMap[i] = 'preferredLocation';
        else if (lower.includes('budget')) autoMap[i] = 'budget';
        else if (lower.includes('note') || lower.includes('form full')) autoMap[i] = 'notes';
      });
      setMapping(autoMap);
      setStep('map');
    };
    reader.readAsText(file);
  }, []);

  const handleImport = async () => {
    setImporting(true);
    let dummyCount = 1;

    try {
      const leads = rows.map(row => {
        const lead: Record<string, any> = { status: 'new', source: 'csv_import' };
        
        // Map fields based on user selection
        Object.entries(mapping).forEach(([idx, field]) => {
          if (field !== 'skip' && row[Number(idx)]) {
            lead[field] = row[Number(idx)];
          }
        });

        // If Name is missing, use Dummy X
        if (!lead.name || lead.name.trim() === '') {
          lead.name = `Dummy ${dummyCount++}`;
        }

        return lead;
      }).filter(l => l.phone && l.phone.trim().length >= 6);

      if (leads.length === 0) {
        toast.error('No leads found with valid phone numbers. Please make sure the Phone column is mapped.');
        setImporting(false);
        return;
      }

      const res = await fetch('/api/leads/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads }),
      });

      if (!res.ok) throw new Error('Bulk import failed');
      const data = await res.json();

      toast.success(`${data.count || leads.length} leads imported successfully!`);
      setStep('done');
      onComplete?.();
    } catch (err: any) {
      toast.error(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  if (step === 'upload' || step === 'done') {
    return (
      <div className="text-center py-8">
        {step === 'done' && (
          <div className="mb-4 flex items-center justify-center gap-2 text-success text-xs font-medium">
            <Check size={14} /> Import complete!
          </div>
        )}
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
          <FileSpreadsheet size={24} className="text-indigo-500" />
        </div>
        <p className="text-sm font-medium mb-1">Upload Leads CSV</p>
        <p className="text-xs text-muted-foreground mb-6 max-w-[240px] mx-auto">Upload a file to automatically import leads into your dashboard</p>
        <label className="cursor-pointer">
          <input type="file" accept=".csv" onChange={handleFile} className="hidden" />
          <Button variant="default" size="sm" className="bg-indigo-600 hover:bg-indigo-700 h-9 px-6 rounded-xl" asChild>
            <div className="flex items-center gap-2">
              <Upload size={14} />
              <span>{step === 'done' ? 'Import More' : 'Choose CSV File'}</span>
            </div>
          </Button>
        </label>
      </div>
    );
  }

  if (step === 'map') {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h4 className="font-semibold text-sm">Map CSV Columns</h4>
          <p className="text-xs text-muted-foreground">Link your file columns to the dashboard fields</p>
        </div>
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
          {headers.map((h, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 border border-border/50">
              <span className="text-xs font-medium truncate max-w-[150px]">{h}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Map to</span>
                <Select value={mapping[i] || 'skip'} onValueChange={v => setMapping(m => ({ ...m, [i]: v }))}>
                  <SelectTrigger className="h-8 text-xs w-32 bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEAD_FIELDS.map(f => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-2 border-t border-border">
          <Button size="sm" onClick={() => setStep('preview')} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-6">
            Continue to Preview
          </Button>
        </div>
      </div>
    );
  }

  // Preview
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm">Preview Leads</h4>
          <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full font-bold uppercase">{rows.length} Total</span>
        </div>
        <p className="text-xs text-muted-foreground">Confirm the import details below</p>
      </div>
      
      <div className="overflow-hidden border border-border rounded-xl bg-background/50">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-secondary/50 border-b border-border">
                {Object.entries(mapping).filter(([, v]) => v !== 'skip').map(([idx, field]) => (
                  <th key={idx} className="px-4 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-tight text-[10px]">{field}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 5).map((row, ri) => (
                <tr key={ri} className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors">
                  {Object.entries(mapping).filter(([, v]) => v !== 'skip').map(([idx]) => (
                    <td key={idx} className="px-4 py-2 text-foreground/80 truncate max-w-[120px]">{row[Number(idx)] || <span className="text-muted-foreground italic">empty</span>}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {rows.length > 5 && (
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/50">
            <Check size={10} className="text-success" /> and {rows.length - 5} more detected leads
          </p>
        </div>
      )}
      
      <div className="flex items-center justify-between pt-4 border-t border-border mt-2">
        <Button variant="ghost" size="sm" onClick={() => setStep('map')} className="text-xs rounded-xl pr-4">
          ← Back to Map
        </Button>
        <Button size="sm" onClick={handleImport} disabled={importing} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-8 h-9 shadow-lg shadow-indigo-500/20">
          {importing ? 'Processing...' : `Confirm Import`}
        </Button>
      </div>
    </div>
  );
};

export default CsvImport;
