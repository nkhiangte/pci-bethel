import React, { useState, useEffect } from 'react';
import { X, Printer, CheckSquare, Square, Filter, QrCode, BookOpen, Users, Sparkles, Download } from 'lucide-react';
import { LibraryBook, LibraryMember } from '../../types';
import { generateQrCodeDataUrl, encodeBookQr, encodeMemberQr } from '../../utils/qrHelper';

interface BatchQrPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: LibraryBook[];
  members: LibraryMember[];
  initialType?: 'books' | 'members';
}

export const BatchQrPrintModal: React.FC<BatchQrPrintModalProps> = ({
  isOpen,
  onClose,
  books,
  members,
  initialType = 'books',
}) => {
  const [printType, setPrintType] = useState<'books' | 'members'>(initialType);
  const [selectedBookIds, setSelectedBookIds] = useState<Set<string>>(new Set());
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setPrintType(initialType);
    if (books.length > 0) {
      setSelectedBookIds(new Set(books.slice(0, 24).map((b) => b.id)));
    }
    if (members.length > 0) {
      setSelectedMemberIds(new Set(members.slice(0, 12).map((m) => m.id)));
    }
  }, [books, members, initialType, isOpen]);

  // Pre-generate QR codes for selected items
  useEffect(() => {
    if (!isOpen) return;

    const generateQrs = async () => {
      setIsGenerating(true);
      const newMap: Record<string, string> = {};

      if (printType === 'books') {
        for (const book of books) {
          if (selectedBookIds.has(book.id)) {
            const payload = book.qrCode || encodeBookQr(book.accessionNo, book.id);
            newMap[book.id] = await generateQrCodeDataUrl(payload, { width: 180, margin: 1 });
          }
        }
      } else {
        for (const member of members) {
          if (selectedMemberIds.has(member.id)) {
            const payload = member.qrCode || encodeMemberQr(member.memberNo, member.id);
            newMap[member.id] = await generateQrCodeDataUrl(payload, { width: 180, margin: 1 });
          }
        }
      }

      setQrMap(newMap);
      setIsGenerating(false);
    };

    generateQrs();
  }, [printType, selectedBookIds, selectedMemberIds, isOpen]);

  const categories = ['ALL', ...Array.from(new Set(books.map((b) => b.category)))];
  const departments = ['ALL', ...Array.from(new Set(members.map((m) => m.department).filter(Boolean)))];

  const filteredBooks = books.filter(
    (b) => categoryFilter === 'ALL' || b.category === categoryFilter
  );

  const filteredMembers = members.filter(
    (m) => departmentFilter === 'ALL' || m.department === departmentFilter
  );

  const toggleBook = (id: string) => {
    const next = new Set(selectedBookIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedBookIds(next);
  };

  const selectAllFilteredBooks = () => {
    const next = new Set(selectedBookIds);
    filteredBooks.forEach((b) => next.add(b.id));
    setSelectedBookIds(next);
  };

  const clearAllBooks = () => {
    setSelectedBookIds(new Set());
  };

  const toggleMember = (id: string) => {
    const next = new Set(selectedMemberIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedMemberIds(next);
  };

  const selectAllFilteredMembers = () => {
    const next = new Set(selectedMemberIds);
    filteredMembers.forEach((m) => next.add(m.id));
    setSelectedMemberIds(next);
  };

  const clearAllMembers = () => {
    setSelectedMemberIds(new Set());
  };

  const handleExecutePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up window a in-block a ni. Allow popups to print sheet.');
      return;
    }

    if (printType === 'books') {
      const itemsToPrint = books.filter((b) => selectedBookIds.has(b.id));
      const itemsHtml = itemsToPrint
        .map((b) => {
          const qr = qrMap[b.id] || '';
          return `
          <div class="sticker">
            <div class="church">Champhai Bethel Kohhran Library</div>
            <div class="title">${b.title}</div>
            <div class="author">By ${b.author}</div>
            <img src="${qr}" class="qr" alt="QR Code" />
            <div class="acc">${b.accessionNo}</div>
            ${b.shelfLocation ? `<div class="shelf">Shelf: ${b.shelfLocation}</div>` : ''}
          </div>
        `;
        })
        .join('');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Batch Book QR Labels - PCI Champhai Bethel</title>
            <style>
              @page { size: A4 portrait; margin: 10mm; }
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #fff; }
              .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8mm; }
              .sticker { border: 1.5px solid #0f172a; border-radius: 6px; padding: 8px 6px; text-align: center; background: #fff; page-break-inside: avoid; box-sizing: border-box; }
              .church { font-size: 8px; font-weight: bold; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; }
              .title { font-size: 11px; font-weight: bold; color: #0f172a; margin: 2px 0 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
              .author { font-size: 9px; color: #64748b; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
              .qr { width: 95px; height: 95px; margin: 0 auto; display: block; }
              .acc { font-family: monospace; font-size: 12px; font-weight: bold; color: #0f172a; margin-top: 2px; }
              .shelf { font-size: 8px; color: #64748b; }
            </style>
          </head>
          <body>
            <div class="grid">
              ${itemsHtml}
            </div>
            <script>
              window.onload = function() { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
    } else {
      // Member ID cards
      const itemsToPrint = members.filter((m) => selectedMemberIds.has(m.id));
      const itemsHtml = itemsToPrint
        .map((m) => {
          const qr = qrMap[m.id] || '';
          return `
          <div class="card">
            <div class="card-header">
              <div class="church-name">PCI CHAMPHAI BETHEL KOHHRAN</div>
              <div class="card-title">LIBRARY BORROWER CARD</div>
            </div>
            <div class="card-body">
              <div class="info">
                <div class="label">MEMBER ID</div>
                <div class="id-val">${m.memberNo}</div>
                <div class="label" style="margin-top: 4px;">NAME</div>
                <div class="name-val">${m.name}</div>
                <div class="dept-val">${m.department || 'Member'} • ${m.phone}</div>
              </div>
              <div class="qr-box">
                <img src="${qr}" class="qr-img" alt="QR" />
                <div class="scan-label">SCAN TO BORROW</div>
              </div>
            </div>
          </div>
        `;
        })
        .join('');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Batch Library Member Cards - PCI Champhai Bethel</title>
            <style>
              @page { size: A4 portrait; margin: 10mm; }
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #fff; }
              .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6mm; }
              .card { border: 2px solid #0f172a; border-radius: 8px; padding: 12px; background: #fff; page-break-inside: avoid; box-sizing: border-box; }
              .card-header { text-align: center; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px; }
              .church-name { font-size: 10px; font-weight: bold; color: #0f172a; letter-spacing: 0.5px; }
              .card-title { font-size: 11px; font-weight: bold; color: #475569; }
              .card-body { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
              .info { flex: 1; }
              .label { font-size: 8px; color: #64748b; font-weight: bold; }
              .id-val { font-family: monospace; font-size: 13px; font-weight: bold; color: #0f172a; }
              .name-val { font-size: 12px; font-weight: bold; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px; }
              .dept-val { font-size: 9px; color: #475569; margin-top: 2px; }
              .qr-box { text-align: center; }
              .qr-img { width: 75px; height: 75px; }
              .scan-label { font-size: 7px; font-weight: bold; color: #64748b; }
            </style>
          </head>
          <body>
            <div class="grid">
              ${itemsHtml}
            </div>
            <script>
              window.onload = function() { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
    }

    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-church-900 via-church-800 to-church-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Printer className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-snug">Batch QR Code Print Sheets</h3>
              <p className="text-xs text-church-200 font-light">
                Lehkhabu sticker emaw Member ID card print chhuahna tur siam rawh
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

        {/* Tab selector */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setPrintType('books')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                printType === 'books'
                  ? 'bg-church-800 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Book QR Sticker Labels ({selectedBookIds.size} selected)</span>
            </button>

            <button
              type="button"
              onClick={() => setPrintType('members')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                printType === 'members'
                  ? 'bg-church-800 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Borrower Member ID Cards ({selectedMemberIds.size} selected)</span>
            </button>
          </div>
        </div>

        {/* Body Items Checklist */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {printType === 'books' ? (
            <div>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-600 font-semibold">Filter Category:</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-md"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={selectAllFilteredBooks}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md border border-slate-300"
                  >
                    Select All ({filteredBooks.length})
                  </button>
                  <button
                    type="button"
                    onClick={clearAllBooks}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md border border-slate-300"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto p-1 border border-slate-200 rounded-xl">
                {filteredBooks.map((b) => {
                  const isChecked = selectedBookIds.has(b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => toggleBook(b.id)}
                      className={`text-left p-2.5 rounded-lg border text-xs flex items-start space-x-2 transition-all ${
                        isChecked
                          ? 'bg-church-50/80 border-church-300 text-church-950 font-semibold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-church-600 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-[10px] text-amber-700 font-bold">{b.accessionNo}</p>
                        <p className="line-clamp-1 font-bold text-slate-800">{b.title}</p>
                        <p className="line-clamp-1 text-[11px] text-slate-500">{b.author}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-600 font-semibold">Filter Department:</span>
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-md"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={selectAllFilteredMembers}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md border border-slate-300"
                  >
                    Select All ({filteredMembers.length})
                  </button>
                  <button
                    type="button"
                    onClick={clearAllMembers}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md border border-slate-300"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto p-1 border border-slate-200 rounded-xl">
                {filteredMembers.map((m) => {
                  const isChecked = selectedMemberIds.has(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMember(m.id)}
                      className={`text-left p-2.5 rounded-lg border text-xs flex items-start space-x-2 transition-all ${
                        isChecked
                          ? 'bg-church-50/80 border-church-300 text-church-950 font-semibold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-church-600 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-[10px] text-amber-700 font-bold">{m.memberNo}</p>
                        <p className="line-clamp-1 font-bold text-slate-800">{m.name}</p>
                        <p className="text-[11px] text-slate-500">{m.department || 'Member'}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {printType === 'books'
              ? `${selectedBookIds.size} Book Sticker Labels ready`
              : `${selectedMemberIds.size} Member Cards ready`}
          </span>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleExecutePrint}
              disabled={
                isGenerating ||
                (printType === 'books' ? selectedBookIds.size === 0 : selectedMemberIds.size === 0)
              }
              className="px-6 py-2.5 bg-gradient-to-r from-church-700 to-church-900 hover:from-church-800 hover:to-slate-900 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>{isGenerating ? 'Preparing QR Sheet...' : 'Print A4 Sheet Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
