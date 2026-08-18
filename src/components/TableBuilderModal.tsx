import React, { useState, useEffect } from 'react';
import { 
  X, Table as TableIcon, Sparkles, Plus, Trash2, Check, 
  LayoutGrid, FileSpreadsheet, Eye, Copy, RefreshCw, Eraser
} from 'lucide-react';

interface TableBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertTable: (html: string) => void;
  initialText?: string;
}

// Preset definitions
interface Preset {
  id: string;
  name: string;
  headers: string[];
  sampleRows: string[][];
}

const PRESETS: Preset[] = [
  {
    id: 'upate',
    name: 'Kohhran Upate (Church Elders)',
    headers: ['Sl.No', 'Upa Hming', 'Nemnghettu', 'Nemnghehna Hmun', 'Kum'],
    sampleRows: [
      ['1', 'Upa Manhleia', 'Rev. C. Vanlalhruaia', 'Kahrawt Biak In', '1983'],
      ['2', 'Upa Khawidawla (Puan)', 'Rev. Lalramliana', 'Zotlang', '1986'],
      ['3', 'Upa B. Hranghlira', 'Rev. Sikulfala', 'Hnahlan', '1987'],
      ['4', 'Upa K. Vanlalhmuaka', 'Rev. C. Lianhmingthanga', 'Champhai Venglai', '1988'],
      ['5', 'Upa Saizama Sailo', 'Upa Lalawia', 'Champhai Kahrawt', '1992'],
      ['6', 'Upa HT. Vanlalsawma', 'Rev. R. Ramdinmawia', 'Champhai Bethel', '1994'],
      ['7', 'Upa H. Lalmawia (Puan)', 'Rev. PC. Pachhunga', 'Champhai Venglai', '1999'],
      ['8', 'Upa PC. Lalhmingliana', 'Rev. H. Lalrinawma', 'Champhai Bethel', '2004'],
      ['9', 'Upa C. Lalrintluanga', 'Rev. Lalmuanawma', 'Zote Biak In', '2008'],
      ['10', 'Upa R. Lalramhluna', 'Rev. Lalmuanawma', 'Zote Biak In', '2008'],
      ['11', 'Upa HT. Lalthlengliana', 'Rev. H. Vanlalhriata', 'Ngur', '2014'],
      ['12', 'Upa C. Lalthantluanga', 'Rev. H. Vanlalhriata', 'Ngur', '2014'],
      ['13', 'Upa David Lalchhanhima', 'Rev. H. Vanlalhriata', 'Ngur', '2014'],
      ['14', 'Upa Daikhawzama (Puan)', 'Rev. H. Vanlalhriata', 'Ngur', '2014'],
      ['15', 'Upa H. Zairemmawia', 'Upa Daldothanga', 'Champhai Vengthlang', '2022']
    ]
  },
  {
    id: 'committee',
    name: 'Committee & Hruaitute',
    headers: ['Sl.No', 'Hming', 'Nihna', 'Bial / Veng', 'Phone / Contact'],
    sampleRows: [
      ['1', 'Pu Lalhmachhuana', 'Chairman', 'Bethel Veng', '9862300000'],
      ['2', 'Pu Vanlalruata', 'Secretary', 'Vengthlang', '9436100000'],
      ['3', 'Pi Lalhmingmawii', 'Treasurer', 'Kanan Veng', '9612000000']
    ]
  },
  {
    id: 'timeline',
    name: 'Chanchin & Thil Thleng (Milestones)',
    headers: ['Kum (Year)', 'Thil Thleng / Milestone', 'Hruaitu / Kohhran Dinhmun'],
    sampleRows: [
      ['1983', 'Bethel Kohhran Din Tan a ni', 'Member 45 in bul tan a ni'],
      ['1994', 'Biak In Hmasa ber sak zawh a ni', 'Rev. R. Ramdinmawia’n a hawng'],
      ['2014', 'Biak In Thar Lungphum phum a ni', 'Rev. H. Vanlalhriata’n a phum']
    ]
  },
  {
    id: 'blank',
    name: 'Empty 3-Column Table',
    headers: ['Sl.No', 'Description / Hming', 'Remarks / Kum'],
    sampleRows: [
      ['1', '', ''],
      ['2', '', ''],
      ['3', '', '']
    ]
  }
];

// Helper to parse church elder lines or general table lines
export function parseTextToTableData(rawText: string): { headers: string[]; rows: string[][] } {
  if (!rawText || !rawText.trim()) {
    return { headers: ['Sl.No', 'Hming / Description', 'Remarks / Kum'], rows: [] };
  }

  const lines = rawText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length === 0) {
    return { headers: ['Sl.No', 'Hming / Description', 'Remarks / Kum'], rows: [] };
  }

  // Check if first line is a title like "KOHHRAN UPATE"
  let dataLines = [...lines];
  if (dataLines.length > 1 && /^(KOHHRAN\s+UPATE|MEMBERS|LIST|TABLE|HRUAITUTE)/i.test(dataLines[0])) {
    dataLines.shift(); // Remove top title header
  }

  // Check if first line contains header keywords like SI.No / Sl.No UPA HMING...
  let customHeaders: string[] | null = null;
  if (dataLines.length > 0 && /(S[Il]\.?\s*No|HMING|NEMNGHETTU|KUM|NAME|ROLE|YEAR)/i.test(dataLines[0])) {
    const headerLine = dataLines.shift()!;
    if (headerLine.includes('\t')) {
      customHeaders = headerLine.split('\t').map(h => h.trim()).filter(Boolean);
    } else if (headerLine.includes('|')) {
      customHeaders = headerLine.split('|').map(h => h.trim()).filter(Boolean);
    } else if (headerLine.includes(',')) {
      customHeaders = headerLine.split(',').map(h => h.trim()).filter(Boolean);
    } else if (/\s{2,}/.test(headerLine)) {
      customHeaders = headerLine.split(/\s{2,}/).map(h => h.trim()).filter(Boolean);
    } else {
      // Default church header
      customHeaders = ['Sl.No', 'Upa Hming', 'Nemnghettu', 'Nemnghehna Hmun', 'Kum'];
    }
  }

  const rows: string[][] = [];

  for (const line of dataLines) {
    // 1. Tab separated
    if (line.includes('\t')) {
      const parts = line.split('\t').map(p => p.trim());
      if (parts.length > 1) {
        rows.push(parts);
        continue;
      }
    }

    // 2. Pipe separated
    if (line.includes('|')) {
      const parts = line.split('|').map(p => p.trim()).filter(Boolean);
      if (parts.length > 1) {
        rows.push(parts);
        continue;
      }
    }

    // 3. Multi-space separated (e.g. 2 or more spaces)
    if (/\s{2,}/.test(line)) {
      const parts = line.split(/\s{2,}/).map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        rows.push(parts);
        continue;
      }
    }

    // 4. Church Elder Regex Parser for single-spaced lines:
    // e.g. "1 Upa Manhleia Rev.C.Vanlalhruaia Kahrawt Biak In 1983"
    // e.g. "5 Upa Saizama Sailo Upa Lalawia Champhai Kahrawt 1992"
    // e.g. "15 Upa H.Zairemmawia Upa Daldothanga Champhai Vengthlang 2022"
    const elderMatch = line.match(/^(\d+)\.?\s+(.+?)\s+(Rev\.[^\s]+|Upa\s+[A-Za-z\.]+|Pastor\s+[A-Za-z\.]+|Rev\s+[A-Za-z\.]+)\s+(.+?)\s+(\d{4}(?:\s*-\s*\d{2,4})?)$/i);
    if (elderMatch) {
      const [, slNo, name, ordainedBy, place, year] = elderMatch;
      rows.push([slNo.trim(), name.trim(), ordainedBy.trim(), place.trim(), year.trim()]);
      continue;
    }

    // Alternative numbered match: starts with number, ends with year
    const generalNumberedMatch = line.match(/^(\d+)\.?\s+(.+?)\s+(\d{4})$/);
    if (generalNumberedMatch) {
      const [, slNo, middle, year] = generalNumberedMatch;
      const words = middle.split(/\s+/);
      if (words.length >= 4) {
        const namePart = words.slice(0, Math.ceil(words.length / 2)).join(' ');
        const otherPart = words.slice(Math.ceil(words.length / 2)).join(' ');
        rows.push([slNo, namePart, otherPart, year]);
      } else {
        rows.push([slNo, middle, year]);
      }
      continue;
    }

    // Fallback: split by spaces if there are 2+ words
    const words = line.split(/\s+/);
    if (words.length >= 2) {
      rows.push(words);
    } else {
      rows.push([line]);
    }
  }

  const finalHeaders = customHeaders || (
    rows.length > 0 && rows[0].length === 5 
      ? ['Sl.No', 'Upa Hming', 'Nemnghettu', 'Nemnghehna Hmun', 'Kum']
      : rows.length > 0 && rows[0].length === 4
      ? ['Sl.No', 'Hming', 'Hmun / Role', 'Kum']
      : rows.length > 0 && rows[0].length === 3
      ? ['Sl.No', 'Hming / Description', 'Kum / Remarks']
      : ['Sl.No', 'Col 2', 'Col 3']
  );

  return { headers: finalHeaders, rows };
}

// Convert table data into clean responsive HTML table string
export function generateTableHtml(headers: string[], rows: string[][], caption?: string): string {
  const headerHtml = headers.map(h => `<th style="padding: 12px 14px; background-color: #1e293b; color: #ffffff; font-weight: 700; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; border-right: 1px solid #334155; text-align: left;">${h}</th>`).join('');
  
  const rowsHtml = rows.map((row, index) => {
    const bg = index % 2 === 0 ? '#ffffff' : '#f8fafc';
    const cells = headers.map((_, colIndex) => {
      const val = row[colIndex] || '';
      const isNumOrYear = /^\d+$/.test(val.trim());
      const align = isNumOrYear ? 'text-align: center;' : 'text-align: left;';
      return `<td style="padding: 11px 14px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #f1f5f9; color: #334155; font-size: 14px; ${align}">${val}</td>`;
    }).join('');
    return `<tr style="background-color: ${bg};">${cells}</tr>`;
  }).join('');

  const captionHtml = caption && caption.trim() 
    ? `<div style="font-weight: 800; font-size: 15px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">${caption.trim()}</div>` 
    : '';

  return `<div class="table-responsive-wrapper my-6 overflow-x-auto border border-slate-300 rounded-2xl shadow-sm bg-white">
  ${captionHtml ? `<div style="padding: 12px 16px; background: #f1f5f9; border-bottom: 1px solid #cbd5e1;">${captionHtml}</div>` : ''}
  <table class="church-table w-full border-collapse min-w-[600px] text-left font-sans">
    <thead>
      <tr>${headerHtml}</tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
</div>`;
}

const TableBuilderModal: React.FC<TableBuilderModalProps> = ({
  isOpen,
  onClose,
  onInsertTable,
  initialText = ''
}) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'designer'>('paste');
  const [pastedText, setPastedText] = useState('');
  const [tableCaption, setTableCaption] = useState('KOHHRAN UPATE');
  const [headers, setHeaders] = useState<string[]>(['Sl.No', 'Upa Hming', 'Nemnghettu', 'Nemnghehna Hmun', 'Kum']);
  const [rows, setRows] = useState<string[][]>([]);
  const [copied, setCopied] = useState(false);

  // When initial text or preset is selected
  useEffect(() => {
    if (initialText && initialText.trim()) {
      setPastedText(initialText);
      const parsed = parseTextToTableData(initialText);
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setActiveTab('designer');
    } else {
      // Default to empty or upate preset sample
      const preset = PRESETS[0];
      setHeaders(preset.headers);
      setRows(preset.sampleRows);
    }
  }, [initialText, isOpen]);

  if (!isOpen) return null;

  const handleConvertText = () => {
    if (!pastedText.trim()) return;
    const parsed = parseTextToTableData(pastedText);
    setHeaders(parsed.headers);
    setRows(parsed.rows);
    setActiveTab('designer');
  };

  const handleApplyPreset = (preset: Preset) => {
    setTableCaption(preset.id === 'blank' ? '' : preset.name.toUpperCase());
    setHeaders([...preset.headers]);
    setRows(preset.sampleRows.map(r => [...r]));
  };

  const handleClearTable = () => {
    setRows([]);
    setPastedText('');
    setTableCaption('');
  };

  const handleHeaderChange = (index: number, val: string) => {
    const newHeaders = [...headers];
    newHeaders[index] = val;
    setHeaders(newHeaders);
  };

  const handleCellChange = (rowIndex: number, colIndex: number, val: string) => {
    const newRows = [...rows];
    newRows[rowIndex] = [...newRows[rowIndex]];
    newRows[rowIndex][colIndex] = val;
    setRows(newRows);
  };

  const handleAddRow = () => {
    const newRow = headers.map((_, i) => i === 0 ? String(rows.length + 1) : '');
    setRows([...rows, newRow]);
  };

  const handleDeleteRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleAddColumn = () => {
    setHeaders([...headers, `Col ${headers.length + 1}`]);
    setRows(rows.map(row => [...row, '']));
  };

  const handleDeleteColumn = (colIndex: number) => {
    if (headers.length <= 1) return;
    setHeaders(headers.filter((_, i) => i !== colIndex));
    setRows(rows.map(row => row.filter((_, i) => i !== colIndex)));
  };

  const handleInsert = () => {
    const tableHtml = generateTableHtml(headers, rows, tableCaption);
    onInsertTable(tableHtml);
    onClose();
  };

  const handleCopyHtml = () => {
    const tableHtml = generateTableHtml(headers, rows, tableCaption);
    navigator.clipboard.writeText(tableHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/75 flex items-center justify-center p-3 sm:p-5 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b flex items-center justify-between bg-slate-900 text-white rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-church-600 flex items-center justify-center text-white shadow-md">
              <TableIcon size={22} />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold">Table Creator & Column Formatter</h3>
              <p className="text-xs text-slate-300">Format a specific list, elders records, or Excel table without altering your story paragraphs</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode Selector & Presets */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200 shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'paste' 
                  ? 'bg-church-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet size={15} />
              <span>Paste Specific Text / Excel</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('designer')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'designer' 
                  ? 'bg-church-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid size={15} />
              <span>Grid Column Designer ({rows.length} rows)</span>
            </button>
          </div>

          {/* Quick Presets & Clear */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Presets:</span>
            {PRESETS.map(preset => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:border-church-500 hover:text-church-600 rounded-xl text-xs font-bold text-slate-700 transition shadow-xs whitespace-nowrap flex items-center gap-1.5"
              >
                <Sparkles size={12} className="text-church-500" />
                <span>{preset.name}</span>
              </button>
            ))}

            <button
              type="button"
              onClick={handleClearTable}
              className="px-2.5 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition shadow-xs whitespace-nowrap flex items-center gap-1"
            >
              <Eraser size={13} />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">
          
          {/* PASTE TAB */}
          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Paste ONLY the table/list snippet below</h4>
                  <p className="text-xs text-slate-500">Copy the specific lines from Excel, WhatsApp, or Word and paste them here to turn into columns</p>
                </div>
                <button
                  type="button"
                  onClick={handleConvertText}
                  disabled={!pastedText.trim()}
                  className="px-4 py-2 bg-church-600 hover:bg-church-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 self-start sm:self-auto transition"
                >
                  <RefreshCw size={14} />
                  <span>Parse & Convert Snippet</span>
                </button>
              </div>

              <textarea
                rows={6}
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
                placeholder={`Paste ONLY the list rows you want in the table, for example:\n\n1 Upa Manhleia Rev.C.Vanlalhruaia Kahrawt Biak In 1983\n2 Upa Khawidawla (Puan) Rev.Lalramliana Zotlang 1986\n3 Upa B. Hranghlira Rev. Sikulfala Hnahlan 1987`}
                className="w-full font-mono text-xs p-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-church-500 focus:border-church-500 outline-none leading-relaxed"
              />
            </div>
          )}

          {/* Table Caption Input */}
          <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">
              Table Title / Caption (Optional):
            </label>
            <input
              type="text"
              value={tableCaption}
              onChange={e => setTableCaption(e.target.value)}
              placeholder="e.g. KOHHRAN UPATE (Leave empty if no header needed)"
              className="flex-1 font-bold text-sm text-slate-800 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl focus:ring-2 focus:ring-church-500 outline-none"
            />
          </div>

          {/* LIVE TABLE PREVIEW & GRID EDITOR */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-church-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Live Table Columns & Cells ({headers.length} Columns, {rows.length} Rows)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddColumn}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                >
                  <Plus size={13} /> Add Col
                </button>
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="px-2.5 py-1 bg-church-50 hover:bg-church-100 text-church-700 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                >
                  <Plus size={13} /> Add Row
                </button>
              </div>
            </div>

            {/* Render Editable Grid / Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[380px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                <thead className="sticky top-0 z-10 bg-slate-800 text-white">
                  <tr>
                    <th className="p-2 w-10 text-center font-bold text-slate-400">#</th>
                    {headers.map((header, colIdx) => (
                      <th key={colIdx} className="p-2 border-r border-slate-700">
                        <div className="flex items-center justify-between gap-1">
                          <input
                            type="text"
                            value={header}
                            onChange={e => handleHeaderChange(colIdx, e.target.value)}
                            className="w-full bg-slate-900 text-white font-bold text-xs px-2 py-1 rounded border border-slate-700 focus:border-church-400 outline-none"
                          />
                          {headers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteColumn(colIdx)}
                              title="Delete column"
                              className="text-slate-400 hover:text-red-400 p-1"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="p-2 w-10 text-center font-bold text-slate-400">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={headers.length + 2} className="p-8 text-center text-slate-400 italic">
                        No rows in table. Click "Paste Specific Text" or "Add Row" or choose a Preset above.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-slate-50 transition">
                        <td className="p-2 text-center text-slate-400 font-mono text-[11px] bg-slate-50/50">
                          {rowIdx + 1}
                        </td>
                        {headers.map((_, colIdx) => (
                          <td key={colIdx} className="p-1 border-r border-slate-100">
                            <input
                              type="text"
                              value={row[colIdx] || ''}
                              onChange={e => handleCellChange(rowIdx, colIdx, e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-transparent hover:border-slate-200 focus:border-church-500 focus:bg-white text-slate-800 text-xs font-medium outline-none bg-transparent"
                            />
                          </td>
                        ))}
                        <td className="p-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(rowIdx)}
                            title="Delete row"
                            className="p-1 text-slate-300 hover:text-red-500 rounded transition"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-5 sm:p-6 border-t bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-b-3xl">
          <div className="text-xs text-slate-500">
            Inserting will place only this specific table without modifying any other paragraphs in your story.
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleCopyHtml}
              disabled={rows.length === 0}
              className="px-4 py-2.5 text-slate-700 font-bold hover:bg-white transition rounded-xl border border-slate-300 text-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <Copy size={14} />
              <span>{copied ? 'HTML Copied!' : 'Copy HTML'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-700 font-bold hover:bg-white transition rounded-xl border border-slate-300 text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleInsert}
              disabled={rows.length === 0}
              className="px-6 py-2.5 bg-church-600 hover:bg-church-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition disabled:opacity-50"
            >
              <Check size={16} />
              <span>Insert Table ({rows.length} Rows)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TableBuilderModal;
