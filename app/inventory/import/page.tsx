"use client";

import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Check, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function IQImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; count?: number; error?: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setImportResult(null);
    }
  };

  const parseCSV = (text: string) => {
    if (!text) return [];
    
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1] || '';

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // It's an escaped quote inside quotes, add a single quote and skip the next
          currentCell += '"';
          i++; 
        } else {
          // Toggle quote state (this effectively strips the opening/closing quote chars)
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
        // End of row
        currentRow.push(currentCell.trim());
        
        if (char === '\r' && nextChar === '\n') {
          i++; // skip the \n
        }
        
        if (currentRow.length > 1 || currentRow[0] !== '') {
          rows.push(currentRow);
        }
        
        currentRow = [];
        currentCell = '';
      } else {
        // Normal characters
        currentCell += char;
      }
    }
    
    // Push the very last row if there wasn't a trailing newline
    if (currentCell !== '' || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.length > 1 || currentRow[0] !== '') {
        rows.push(currentRow);
      }
    }

    if (rows.length < 2) return [];

    // Find the actual header row automatically (Google Sheets sometimes exports links/metadata in row 1-2)
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(10, rows.length); i++) {
       const rowStr = rows[i].join('').toLowerCase();
       if (
         rowStr.includes('name of pg') || 
         rowStr.includes('area') || 
         rowStr.includes('price/monthly') ||
         rowStr.includes('pg name') ||
         rowStr.includes('location') ||
         rowStr.includes('monthly rent') ||
         (rowStr.includes('name') && rowStr.includes('price'))
       ) {
          headerRowIndex = i;
          break;
       }
    }

    // Clean headers: remove BOM
    const headers = rows[headerRowIndex].map(h => h.replace(/^\ufeff/, '').trim());
    console.log("📑 Imported CSV Headers:", headers);
    
    const result = [];
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      const obj: any = {};
      
      headers.forEach((header, index) => {
        if (header) {
          obj[header] = row[index] !== undefined ? row[index] : '';
        }
      });
      
      result.push(obj);
    }
    return result;
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const jsonData = parseCSV(text);

      if (jsonData.length === 0) {
        throw new Error("No data found in CSV file");
      }

      const response = await fetch('/api/iq-properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: jsonData }),
      });

      const result = await response.json();

      if (response.ok) {
        setImportResult({ success: true, count: result.count });
        toast.success(`Successfully imported ${result.count} properties`);
      } else {
        throw new Error(result.error || 'Failed to import data');
      }
    } catch (error: any) {
      console.error('Import error:', error);
      setImportResult({ success: false, error: error.message });
      toast.error(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AppLayout title="Import IQ Sheet" subtitle="Upload PG property details from Google Sheets">
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-card border rounded-2xl p-8 shadow-sm">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
              <Upload className="text-accent" size={32} />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Upload IQ Sheet CSV</h2>
              <p className="text-muted-foreground text-sm max-w-md">
                Export your Google IQ Sheet as CSV (File → Download → .csv) and upload it here to update the property database.
              </p>
            </div>

            <div className="w-full mt-6">
              <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-8 transition-colors hover:border-accent/40 relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                
                <div className="flex flex-col items-center gap-2">
                  <FileText className="text-muted-foreground" size={24} />
                  <span className="text-sm font-medium">
                    {file ? file.name : "Click to select or drag and drop CSV file"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Only .csv files are supported
                  </span>
                </div>
              </div>
            </div>

            {importResult && (
              <div className={`w-full p-4 rounded-xl flex items-center gap-3 text-sm ${
                importResult.success ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {importResult.success ? (
                  <>
                    <Check size={18} />
                    <span>Import complete! {importResult.count} properties updated.</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={18} />
                    <span>Error: {importResult.error}</span>
                  </>
                )}
              </div>
            )}

            <div className="flex gap-3 w-full pt-4">
              <Button 
                variant="outline" 
                className="flex-1 rounded-xl"
                onClick={() => {
                  setFile(null);
                  setImportResult(null);
                }}
              >
                Clear
              </Button>
              <Button 
                className="flex-1 rounded-xl gap-2"
                disabled={!file || isUploading}
                onClick={handleUpload}
              >
                {isUploading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Start Import
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-12 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Instructions</h3>
          <ul className="space-y-3 text-sm text-foreground/80">
            <li className="flex gap-2">
              <span className="w-5 h-5 bg-accent/10 rounded-full flex items-center justify-center text-[10px] font-bold text-accent shrink-0 mt-0.5">1</span>
              Open your <strong>IQ OF PG's</strong> Google Sheet.
            </li>
            <li className="flex gap-2">
              <span className="w-5 h-5 bg-accent/10 rounded-full flex items-center justify-center text-[10px] font-bold text-accent shrink-0 mt-0.5">2</span>
              Go to <strong>File &gt; Download &gt; Comma Separated Values (.csv)</strong>.
            </li>
            <li className="flex gap-2">
              <span className="w-5 h-5 bg-accent/10 rounded-full flex items-center justify-center text-[10px] font-bold text-accent shrink-0 mt-0.5">3</span>
              Select that file here and click <strong>Start Import</strong>.
            </li>
            <li className="flex gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100 italic">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>Note: This will replace the existing property data with the content of the CSV. Perfect for keeping the dashboard synced with your sheet.</span>
            </li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}
