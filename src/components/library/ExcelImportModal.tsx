import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  RefreshCw,
  FileText,
  Trash2,
  Edit2,
  Check,
  Search,
  Layers,
  Settings2,
  HelpCircle,
  Plus,
  ArrowRight,
  ClipboardPaste,
  BookOpen
} from 'lucide-react';
import { db } from '../../services/firebase';
import { LibraryBook } from '../../types';
import {
  readExcelRawData,
  mapRawRowsToBooks,
  autoDetectColumns,
  downloadSampleBookTemplate,
  downloadSimpleTitlesTemplate,
  parseRawTextBookTitles,
  ParsedBookRow,
  ExcelRawData,
} from '../../utils/libraryExcel';
import { encodeBookQr } from '../../utils/qrHelper';
import { DEFAULT_LIBRARY_GENRES } from '../../constants/libraryGenres';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingBooksCount: number;
  existingAccessionNos: Set<string>;
  existingBooks?: LibraryBook[];
  onImportComplete: () => void;
  onOpenBatchPrint?: () => void;
  availableGenres?: string[];
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  existingBooksCount,
  existingAccessionNos,
  existingBooks = [],
  onImportComplete,
  onOpenBatchPrint,
  availableGenres,
}) => {
  const categoryOptions = availableGenres && availableGenres.length > 0 ? availableGenres : DEFAULT_LIBRARY_GENRES;
  const initialCategory = categoryOptions[0] || 'Theology & Thurin (Doctrine & Theology)';

  // Mode selection: 'file' | 'paste'
  const [importMode, setImportMode] = useState<'file' | 'paste'>('file');

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<ExcelRawData | null>(null);
  const [columnMapping, setColumnMapping] = useState<{
    titleCol?: string;
    authorCol?: string;
    accessionNoCol?: string;
    categoryCol?: string;
    isbnCol?: string;
    publisherCol?: string;
    yearCol?: string;
    editionCol?: string;
    copiesCol?: string;
    shelfCol?: string;
    languageCol?: string;
    descCol?: string;
  }>({});
  const [showColumnMapping, setShowColumnMapping] = useState(false);

  // Paste text state
  const [pasteText, setPasteText] = useState('');

  // Default values applied when field is blank
  const [defaults, setDefaults] = useState({
    defaultAuthor: 'Unknown',
    defaultCategory: initialCategory,
    defaultCopies: 1,
    defaultShelf: 'Main Library Rack',
    defaultLanguage: 'Mizo',
    accessionPrefix: 'BTH-',
  });

  // Duplicate handling: 'create_new' | 'increment_copies' | 'skip'
  const [duplicatePolicy, setDuplicatePolicy] = useState<'create_new' | 'increment_copies' | 'skip'>('create_new');

  // Parsed and editable rows
  const [parsedRows, setParsedRows] = useState<ParsedBookRow[]>([]);
  const [previewSearch, setPreviewSearch] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);

  // Re-map rows when file, columnMapping or defaults change
  useEffect(() => {
    if (importMode === 'file' && rawData) {
      const books = mapRawRowsToBooks(rawData.rawRows, columnMapping, defaults);
      setParsedRows(books);
    }
  }, [columnMapping, defaults, rawData, importMode]);

  // Handle raw pasted text change
  const handlePasteTextChange = (text: string) => {
    setPasteText(text);
    if (!text.trim()) {
      setParsedRows([]);
      return;
    }
    const rows = parseRawTextBookTitles(text, defaults);
    setParsedRows(rows);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    await processFile(selectedFile);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;

    if (
      !droppedFile.name.endsWith('.xlsx') &&
      !droppedFile.name.endsWith('.xls') &&
      !droppedFile.name.endsWith('.csv')
    ) {
      setError('Excel file (.xlsx, .xls) emaw .csv file chauh upload theih a ni.');
      return;
    }

    await processFile(droppedFile);
  };

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setIsParsing(true);
    setSuccessCount(null);

    try {
      const data = await readExcelRawData(selectedFile);
      setRawData(data);
      const detected = autoDetectColumns(data.headers);
      setColumnMapping(detected);
      const rows = mapRawRowsToBooks(data.rawRows, detected, defaults);
      setParsedRows(rows);
    } catch (err: any) {
      console.error('Failed to parse Excel file:', err);
      setError(err?.message || 'Excel file chhiar theih a ni lo. Template emaw format en nawn rawh.');
      setParsedRows([]);
      setRawData(null);
    } finally {
      setIsParsing(false);
    }
  };

  // Row operations in preview
  const handleUpdateRow = (index: number, updated: Partial<ParsedBookRow>) => {
    setParsedRows((prev) => {
      const clone = [...prev];
      clone[index] = {
        ...clone[index],
        ...updated,
        valid: !!(updated.title !== undefined ? updated.title.trim() : clone[index].title.trim()),
      };
      return clone;
    });
  };

  const handleDeleteRow = (index: number) => {
    setParsedRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleClearInvalidRows = () => {
    setParsedRows((prev) => prev.filter((r) => r.valid));
  };

  // Perform Firestore batch saving
  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter((r) => r.valid && r.title.trim());
    if (validRows.length === 0) {
      setError('Import tur lehkhabu title valid a awm lo.');
      return;
    }

    setIsImporting(true);
    setError(null);
    setImportProgress(0);

    try {
      // Build title to existing book map for duplicate policy
      const titleToExistingBook = new Map<string, LibraryBook>();
      existingBooks.forEach((b) => {
        titleToExistingBook.set(b.title.toLowerCase().trim(), b);
      });

      let nextNumber = existingBooksCount;
      let insertedCount = 0;
      let updatedCount = 0;
      const batchSize = 45;

      for (let i = 0; i < validRows.length; i += batchSize) {
        const chunk = validRows.slice(i, i + batchSize);
        const batch = db.batch();

        for (const row of chunk) {
          const normalizedTitle = row.title.toLowerCase().trim();
          const existing = titleToExistingBook.get(normalizedTitle);

          if (existing && duplicatePolicy === 'skip') {
            continue;
          }

          if (existing && duplicatePolicy === 'increment_copies') {
            // Update copy count on existing doc
            const addCopies = row.totalCopies || defaults.defaultCopies || 1;
            const newTotal = (existing.totalCopies || 1) + addCopies;
            const newAvailable = (existing.availableCopies || 1) + addCopies;
            const docRef = db.collection('library_books').doc(existing.id);
            batch.update(docRef, {
              totalCopies: newTotal,
              availableCopies: newAvailable,
              updatedAt: new Date().toISOString(),
            });
            updatedCount++;
            continue;
          }

          // Create new book entry
          nextNumber++;
          let accNo = row.accessionNo?.trim();
          if (!accNo || existingAccessionNos.has(accNo)) {
            accNo = `${defaults.accessionPrefix}${nextNumber.toString().padStart(3, '0')}`;
          }

          const bookId = 'book_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
          const qrCodePayload = encodeBookQr(accNo, bookId);
          const copies = row.totalCopies || defaults.defaultCopies || 1;

          const newBook: LibraryBook = {
            id: bookId,
            accessionNo: accNo,
            title: row.title.trim(),
            author: row.author?.trim() || defaults.defaultAuthor,
            category: row.category?.trim() || defaults.defaultCategory,
            isbn: row.isbn?.trim() || undefined,
            publisher: row.publisher?.trim() || undefined,
            publishedYear: row.publishedYear ? String(row.publishedYear).trim() : undefined,
            edition: row.edition?.trim() || undefined,
            totalCopies: copies,
            availableCopies: copies,
            shelfLocation: row.shelfLocation?.trim() || defaults.defaultShelf || undefined,
            language: row.language?.trim() || defaults.defaultLanguage,
            description: row.description?.trim() || undefined,
            status: 'available',
            qrCode: qrCodePayload,
            createdAt: new Date().toISOString(),
          };

          const docRef = db.collection('library_books').doc(bookId);
          batch.set(docRef, newBook);
          insertedCount++;
        }

        await batch.commit();
        setImportProgress(Math.round(((i + chunk.length) / validRows.length) * 100));
      }

      setSuccessCount(insertedCount + updatedCount);
      onImportComplete();
    } catch (err: any) {
      console.error('Batch import failed:', err);
      setError(err?.message || 'Database-a save a hlawhchham. Firebase rules emaw connection en rawh.');
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  const validRowCount = parsedRows.filter((r) => r.valid).length;
  const invalidRowCount = parsedRows.filter((r) => !r.valid).length;

  const filteredPreviewRows = parsedRows.filter((r) => {
    if (!previewSearch) return true;
    const q = previewSearch.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.author.toLowerCase().includes(q) ||
      (r.category || '').toLowerCase().includes(q) ||
      (r.accessionNo || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-church-950 via-church-900 to-church-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-inner">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-lg leading-tight">Import Book Titles & Catalog</h3>
                <span className="bg-emerald-500/30 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Bulk Importer
                </span>
              </div>
              <p className="text-xs text-church-200 font-light mt-0.5">
                Excel (.xlsx, .csv) upload emaw book titles paste hmangin lehkhabu thun lut zung zung rawh
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Control Bar: Mode Toggle & Template Downloads */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {/* Mode Switcher */}
          <div className="inline-flex p-1 bg-slate-200/80 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setImportMode('file')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                importMode === 'file'
                  ? 'bg-white text-church-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              <span>Upload Excel / CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setImportMode('paste')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                importMode === 'paste'
                  ? 'bg-white text-church-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-church-600" />
              <span>Paste Title List</span>
            </button>
          </div>

          {/* Download Templates Group */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
              Download Templates:
            </span>
            <button
              type="button"
              onClick={downloadSimpleTitlesTemplate}
              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors"
              title="Download simple 3-column book titles template"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Simple Titles Template</span>
            </button>
            <button
              type="button"
              onClick={downloadSampleBookTemplate}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
              title="Download complete library catalog template with all fields"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Full Template</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* Error Banner */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded-xl flex items-start space-x-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Error encountered during import</p>
                <p className="text-[11px] text-rose-700 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {successCount !== null && (
            <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-300 text-emerald-950 rounded-2xl text-center space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-lg text-emerald-900">
                  Lehkhabu {successCount} hlawhtling taka luh tir a ni e!
                </h4>
                <p className="text-xs text-emerald-700 mt-1 max-w-md mx-auto">
                  Database-ah QR code, Accession Numbers, leh category fel takin in-save vek a ni tawh e.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {onOpenBatchPrint && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenBatchPrint();
                    }}
                    className="px-4 py-2 bg-church-800 hover:bg-church-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
                  >
                    <span>Print QR Labels Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSuccessCount(null);
                    setParsedRows([]);
                    setFile(null);
                    setRawData(null);
                    setPasteText('');
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Import More Books</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl transition-colors"
                >
                  Close Window
                </button>
              </div>
            </div>
          )}

          {successCount === null && (
            <>
              {/* SOURCE INPUT: Mode A (File Upload) */}
              {importMode === 'file' && (
                <div className="space-y-3">
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center bg-slate-50/70 hover:bg-emerald-50/30 transition-all flex flex-col items-center justify-center cursor-pointer group"
                  >
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleFileChange}
                      className="hidden"
                      id="excel-file-input"
                    />
                    <label htmlFor="excel-file-input" className="cursor-pointer flex flex-col items-center w-full">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 group-hover:bg-emerald-200 text-emerald-700 flex items-center justify-center mb-3 transition-colors shadow-xs">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-sm text-slate-800 group-hover:text-emerald-900">
                        {file ? file.name : 'Click to upload or Drag & Drop Excel spreadsheet'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Supports standard Microsoft Excel (.xlsx, .xls) and CSV (.csv) formats
                      </p>
                      {file && (
                        <span className="mt-2 px-3 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full">
                          File loaded ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      )}
                    </label>
                  </div>

                  {/* Column Mapping Collapsible */}
                  {rawData && rawData.headers.length > 0 && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                      <button
                        type="button"
                        onClick={() => setShowColumnMapping(!showColumnMapping)}
                        className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <Settings2 className="w-4 h-4 text-church-600" />
                          <span>Custom Column Header Mapping</span>
                          <span className="text-[10px] font-normal text-slate-500">
                            (Detected {rawData.headers.length} columns)
                          </span>
                        </div>
                        <span className="text-church-600 text-xs font-bold">
                          {showColumnMapping ? 'Hide' : 'Customize Mappings'}
                        </span>
                      </button>

                      {showColumnMapping && (
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs border-t border-slate-200">
                          {/* Title Column */}
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">
                              Book Title Column <span className="text-rose-500">*</span>
                            </label>
                            <select
                              value={columnMapping.titleCol || ''}
                              onChange={(e) =>
                                setColumnMapping({ ...columnMapping, titleCol: e.target.value })
                              }
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
                            >
                              <option value="">-- Select Column --</option>
                              {rawData.headers.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Author Column */}
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Author Column</label>
                            <select
                              value={columnMapping.authorCol || ''}
                              onChange={(e) =>
                                setColumnMapping({ ...columnMapping, authorCol: e.target.value })
                              }
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
                            >
                              <option value="">-- None / Use Default --</option>
                              {rawData.headers.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Category Column */}
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Category Column</label>
                            <select
                              value={columnMapping.categoryCol || ''}
                              onChange={(e) =>
                                setColumnMapping({ ...columnMapping, categoryCol: e.target.value })
                              }
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
                            >
                              <option value="">-- None / Use Default --</option>
                              {rawData.headers.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Accession No Column */}
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Accession No Column</label>
                            <select
                              value={columnMapping.accessionNoCol || ''}
                              onChange={(e) =>
                                setColumnMapping({ ...columnMapping, accessionNoCol: e.target.value })
                              }
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
                            >
                              <option value="">-- Auto-Generate Numbers --</option>
                              {rawData.headers.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Total Copies Column */}
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Copies / Quantity</label>
                            <select
                              value={columnMapping.copiesCol || ''}
                              onChange={(e) =>
                                setColumnMapping({ ...columnMapping, copiesCol: e.target.value })
                              }
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
                            >
                              <option value="">-- None / Default (1) --</option>
                              {rawData.headers.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Shelf Column */}
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Shelf Location</label>
                            <select
                              value={columnMapping.shelfCol || ''}
                              onChange={(e) =>
                                setColumnMapping({ ...columnMapping, shelfCol: e.target.value })
                              }
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
                            >
                              <option value="">-- None / Default --</option>
                              {rawData.headers.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* SOURCE INPUT: Mode B (Paste Title List) */}
              {importMode === 'paste' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                      <BookOpen className="w-4 h-4 text-church-600" />
                      <span>Paste Book Titles (One title per line)</span>
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Supports &quot;Title - Author&quot; or &quot;Title by Author&quot;
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={pasteText}
                    onChange={(e) => handlePasteTextChange(e.target.value)}
                    placeholder={`Pathian Thu Chianna - Rev. Dr. Zairema
Mizo Kristiante Chanchin - Rev. Lalrinawma
The Purpose Driven Life by Rick Warren
Naupang Bible Chanchin
Thuthlung Thar Hrilhfiahna (Matthaia)
Kristian Chhungkua`}
                    className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-church-500 focus:outline-none placeholder:text-slate-400"
                  />
                </div>
              )}

              {/* SMART DEFAULTS & CUSTOMIZATION SETTINGS */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span>Import Defaults & Settings</span>
                  </h4>
                  <span className="text-[10px] text-slate-500">
                    Applied automatically when a field is missing or empty
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {/* Default Category */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Default Category
                    </label>
                    <select
                      value={defaults.defaultCategory}
                      onChange={(e) =>
                        setDefaults({ ...defaults, defaultCategory: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                    >
                      {categoryOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Default Copies */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Copies Per Book
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={defaults.defaultCopies}
                      onChange={(e) =>
                        setDefaults({
                          ...defaults,
                          defaultCopies: Math.max(1, parseInt(e.target.value) || 1),
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                    />
                  </div>

                  {/* Acc No Prefix */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Acc No Prefix
                    </label>
                    <input
                      type="text"
                      value={defaults.accessionPrefix}
                      onChange={(e) =>
                        setDefaults({ ...defaults, accessionPrefix: e.target.value })
                      }
                      placeholder="BTH-"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                    />
                  </div>

                  {/* Duplicate Policy */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      If Title Exists
                    </label>
                    <select
                      value={duplicatePolicy}
                      onChange={(e) => setDuplicatePolicy(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                    >
                      <option value="create_new">Add as New Copy</option>
                      <option value="increment_copies">Increase Copy Count</option>
                      <option value="skip">Skip Duplicate</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* PARSED PREVIEW DATA GRID */}
              {parsedRows.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-800">
                        Preview Catalog ({parsedRows.length} Total Titles)
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-full">
                        {validRowCount} Ready
                      </span>
                      {invalidRowCount > 0 && (
                        <button
                          type="button"
                          onClick={handleClearInvalidRows}
                          className="bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-[10px] px-2 py-0.5 rounded-full transition-colors flex items-center space-x-1"
                          title="Click to remove invalid blank rows"
                        >
                          <span>{invalidRowCount} Invalid (Remove)</span>
                        </button>
                      )}
                    </div>

                    {/* Preview Filter */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                      <input
                        type="text"
                        placeholder="Search in preview..."
                        value={previewSearch}
                        onChange={(e) => setPreviewSearch(e.target.value)}
                        className="pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-church-500 w-48"
                      />
                    </div>
                  </div>

                  {/* Interactive Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto bg-white shadow-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                        <tr>
                          <th className="p-2.5 w-10">#</th>
                          <th className="p-2.5 w-24">Acc No</th>
                          <th className="p-2.5">Book Title</th>
                          <th className="p-2.5 w-36">Author</th>
                          <th className="p-2.5 w-32">Category</th>
                          <th className="p-2.5 w-16 text-center">Copies</th>
                          <th className="p-2.5 w-28">Shelf</th>
                          <th className="p-2.5 w-12 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {filteredPreviewRows.map((row, idx) => {
                          const isEditing = editingRowIndex === idx;
                          return (
                            <tr
                              key={idx}
                              className={`transition-colors ${
                                !row.valid
                                  ? 'bg-rose-50/60'
                                  : idx % 2 === 0
                                  ? 'bg-white hover:bg-slate-50'
                                  : 'bg-slate-50/40 hover:bg-slate-50'
                              }`}
                            >
                              <td className="p-2.5 text-slate-400 font-mono">{idx + 1}</td>
                              <td className="p-2.5 font-mono text-[11px] text-slate-600 font-semibold">
                                {row.accessionNo ||
                                  `Auto (${defaults.accessionPrefix}${(
                                    existingBooksCount +
                                    idx +
                                    1
                                  )
                                    .toString()
                                    .padStart(3, '0')})`}
                              </td>
                              <td className="p-2.5">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={row.title}
                                    onChange={(e) => handleUpdateRow(idx, { title: e.target.value })}
                                    className="w-full px-2 py-1 bg-white border border-church-500 rounded text-xs"
                                  />
                                ) : (
                                  <span className="font-bold text-slate-900">{row.title}</span>
                                )}
                              </td>
                              <td className="p-2.5 text-slate-600">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={row.author}
                                    onChange={(e) =>
                                      handleUpdateRow(idx, { author: e.target.value })
                                    }
                                    className="w-full px-2 py-1 bg-white border border-church-500 rounded text-xs"
                                  />
                                ) : (
                                  row.author || defaults.defaultAuthor
                                )}
                              </td>
                              <td className="p-2.5 text-slate-500">
                                {isEditing ? (
                                  <select
                                    value={row.category || defaults.defaultCategory}
                                    onChange={(e) =>
                                      handleUpdateRow(idx, { category: e.target.value })
                                    }
                                    className="w-full px-2 py-1 bg-white border border-church-500 rounded text-xs"
                                  >
                                    {categoryOptions.map((c) => (
                                      <option key={c} value={c}>
                                        {c}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium">
                                    {row.category || defaults.defaultCategory}
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 text-center font-semibold text-slate-700">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    min="1"
                                    value={row.totalCopies || 1}
                                    onChange={(e) =>
                                      handleUpdateRow(idx, {
                                        totalCopies: parseInt(e.target.value) || 1,
                                      })
                                    }
                                    className="w-12 px-1 py-1 bg-white border border-church-500 rounded text-xs text-center"
                                  />
                                ) : (
                                  row.totalCopies || defaults.defaultCopies
                                )}
                              </td>
                              <td className="p-2.5 text-slate-500 text-[11px]">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={row.shelfLocation || ''}
                                    onChange={(e) =>
                                      handleUpdateRow(idx, { shelfLocation: e.target.value })
                                    }
                                    className="w-full px-2 py-1 bg-white border border-church-500 rounded text-xs"
                                  />
                                ) : (
                                  row.shelfLocation || defaults.defaultShelf || '-'
                                )}
                              </td>
                              <td className="p-2.5 text-center">
                                <div className="flex items-center justify-center space-x-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditingRowIndex(isEditing ? null : idx)
                                    }
                                    className="p-1 text-slate-400 hover:text-church-600 transition-colors"
                                    title={isEditing ? 'Save edits' : 'Edit this row'}
                                  >
                                    {isEditing ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                                    ) : (
                                      <Edit2 className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRow(idx)}
                                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                    title="Delete from list"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Progress bar during batch import */}
              {isImporting && (
                <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center space-x-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-church-600" />
                      <span>Saving Books & Generating QR Codes...</span>
                    </span>
                    <span className="text-church-700">{importProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-600 to-church-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-bold transition-colors"
          >
            Cancel
          </button>

          {successCount === null && (
            <div className="flex items-center space-x-3">
              {parsedRows.length > 0 && (
                <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
                  Ready to insert: <strong className="text-slate-900">{validRowCount} books</strong>
                </span>
              )}
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isImporting || isParsing || validRowCount === 0}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Importing ({importProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    <span>
                      {validRowCount > 0
                        ? `Import ${validRowCount} Books into Database`
                        : 'Upload / Enter Books to Import'}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
