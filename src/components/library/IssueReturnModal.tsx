import React, { useState, useEffect } from 'react';
import { X, BookOpen, QrCode, CheckCircle2, AlertTriangle, Clock, ArrowRight, UserCheck, Calendar, RefreshCw, Sparkles, BookMarked, Search, Phone, ShieldCheck } from 'lucide-react';
import { db } from '../../services/firebase';
import { LibraryBook, LibraryMember, LibraryTransaction } from '../../types';
import { QrScannerModal } from './QrScannerModal';
import { parseScannedQr } from '../../utils/qrHelper';

interface IssueReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'issue' | 'return';
  initialBook?: LibraryBook | null;
  initialMember?: LibraryMember | null;
  books: LibraryBook[];
  members: LibraryMember[];
  transactions: LibraryTransaction[];
  onDataChanged: () => void;
  adminName?: string;
  defaultLoanDays?: number;
}

export const IssueReturnModal: React.FC<IssueReturnModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'issue',
  initialBook = null,
  initialMember = null,
  books,
  members,
  transactions,
  onDataChanged,
  adminName = 'Librarian',
  defaultLoanDays = 14,
}) => {
  const [mode, setMode] = useState<'issue' | 'return'>(initialMode);
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(initialBook);
  const [selectedMember, setSelectedMember] = useState<LibraryMember | null>(initialMember);
  
  // Search queries for manual lookup
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  
  // Loan config
  const [loanDays, setLoanDays] = useState(defaultLoanDays);
  const [customDueDate, setCustomDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + defaultLoanDays);
    return d.toISOString().split('T')[0];
  });
  const [remarks, setRemarks] = useState('');
  
  // Scanner state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'book' | 'member' | 'any'>('any');

  // Processing state
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setSelectedBook(initialBook);
    setSelectedMember(initialMember);
    setSuccessMessage(null);
    setErrorMessage(null);
  }, [initialMode, initialBook, initialMember, isOpen]);

  // Recalculate customDueDate when loanDays changes
  const handleLoanDaysChange = (days: number) => {
    setLoanDays(days);
    const d = new Date();
    d.setDate(d.getDate() + days);
    setCustomDueDate(d.toISOString().split('T')[0]);
  };

  // Filtered books & members for search dropdowns
  const filteredBooks = bookSearchQuery.trim()
    ? books.filter(
        (b) =>
          b.title.toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
          b.accessionNo.toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
          b.author.toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
          (b.isbn && b.isbn.includes(bookSearchQuery))
      ).slice(0, 8)
    : [];

  const filteredMembers = memberSearchQuery.trim()
    ? members.filter(
        (m) =>
          m.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
          m.memberNo.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
          m.phone.includes(memberSearchQuery)
      ).slice(0, 8)
    : [];

  // Active loans for selected book or member
  const activeBookTransaction = selectedBook
    ? transactions.find((t) => t.bookId === selectedBook.id && t.status === 'active')
    : null;

  const activeMemberTransactions = selectedMember
    ? transactions.filter((t) => t.memberId === selectedMember.id && t.status === 'active')
    : [];

  // Handle scanned QR payload
  const handleScanResult = (raw: string, parsed: ReturnType<typeof parseScannedQr>) => {
    setErrorMessage(null);

    if (scannerTarget === 'member' || parsed.type === 'member') {
      const match = members.find(
        (m) =>
          m.memberNo.toLowerCase() === parsed.identifier.toLowerCase() ||
          m.id === parsed.identifier ||
          m.id === parsed.id ||
          m.phone === parsed.identifier
      );
      if (match) {
        setSelectedMember(match);
        setMemberSearchQuery('');
        setSuccessMessage(`Borrower hmuh a ni: ${match.name} (${match.memberNo})`);
      } else {
        setErrorMessage(`Borrower ID '${parsed.identifier}' hi database-ah a awm lo. Register hmasak a ngai e.`);
      }
    } else {
      // It's a book
      const match = books.find(
        (b) =>
          b.accessionNo.toLowerCase() === parsed.identifier.toLowerCase() ||
          b.id === parsed.identifier ||
          b.id === parsed.id ||
          (b.isbn && b.isbn === parsed.identifier)
      );
      if (match) {
        setSelectedBook(match);
        setBookSearchQuery('');
        setSuccessMessage(`Lehkhabu hmuh a ni: ${match.title} (${match.accessionNo})`);

        // If in return mode and this book is issued, auto-select borrower too
        if (mode === 'return') {
          const loan = transactions.find((t) => t.bookId === match.id && t.status === 'active');
          if (loan) {
            const borrower = members.find((m) => m.id === loan.memberId);
            if (borrower) setSelectedMember(borrower);
          }
        }
      } else {
        setErrorMessage(`Lehkhabu Accession No / ID '${parsed.identifier}' hi hmuh a ni lo.`);
      }
    }
  };

  // Perform Issue Book
  const handleIssueBook = async () => {
    if (!selectedBook) {
      setErrorMessage('Lehkhabu thlan a ngai e.');
      return;
    }
    if (!selectedMember) {
      setErrorMessage('Borrower thlan a ngai e.');
      return;
    }
    if (selectedBook.availableCopies <= 0) {
      setErrorMessage(`He lehkhabu (${selectedBook.title}) hi a copy zawng zawng hawh chhuah vek a ni a, a hawh theih loh.`);
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const transactionId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const today = new Date().toISOString().split('T')[0];

      const newTx: LibraryTransaction = {
        id: transactionId,
        bookId: selectedBook.id,
        bookTitle: selectedBook.title,
        accessionNo: selectedBook.accessionNo,
        memberId: selectedMember.id,
        memberName: selectedMember.name,
        memberNo: selectedMember.memberNo,
        memberPhone: selectedMember.phone,
        issueDate: today,
        dueDate: customDueDate,
        returnDate: null,
        status: 'active',
        issuedBy: adminName,
        remarks: remarks.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      if (db && db.collection) {
        // 1. Save Transaction
        await db.collection('library_transactions').doc(transactionId).set(newTx);

        // 2. Decrement available copies & update status
        const newAvailable = Math.max(0, selectedBook.availableCopies - 1);
        await db.collection('library_books').doc(selectedBook.id).update({
          availableCopies: newAvailable,
          status: newAvailable === 0 ? 'issued' : 'available',
          updatedAt: new Date().toISOString(),
        });

        // 3. Increment active loans for member
        await db.collection('library_members').doc(selectedMember.id).update({
          activeLoansCount: (selectedMember.activeLoansCount || 0) + 1,
          updatedAt: new Date().toISOString(),
        });
      }

      setSuccessMessage(`Hlawhtling taka hawh tir a ni! Due date: ${customDueDate}`);
      onDataChanged();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Issue book error:', err);
      setErrorMessage(err?.message || 'Lehkhabu hawh tir a hlawhchham.');
    } finally {
      setSubmitting(false);
    }
  };

  // Perform Return Book
  const handleReturnBook = async (transactionToReturn?: LibraryTransaction) => {
    const tx = transactionToReturn || activeBookTransaction;
    if (!tx) {
      setErrorMessage('Active loan record hmuh a ni lo.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const today = new Date().toISOString().split('T')[0];

      if (db && db.collection) {
        // 1. Update Transaction to returned
        await db.collection('library_transactions').doc(tx.id).update({
          status: 'returned',
          returnDate: today,
          returnedTo: adminName,
          remarks: remarks ? `${tx.remarks || ''} [Returned remarks: ${remarks}]` : tx.remarks,
          updatedAt: new Date().toISOString(),
        });

        // 2. Increment book available copies
        const bookDoc = books.find((b) => b.id === tx.bookId);
        if (bookDoc) {
          const newAvailable = Math.min(bookDoc.totalCopies, bookDoc.availableCopies + 1);
          await db.collection('library_books').doc(tx.bookId).update({
            availableCopies: newAvailable,
            status: 'available',
            updatedAt: new Date().toISOString(),
          });
        }

        // 3. Decrement member active loans
        const memberDoc = members.find((m) => m.id === tx.memberId);
        if (memberDoc) {
          const newLoansCount = Math.max(0, (memberDoc.activeLoansCount || 1) - 1);
          await db.collection('library_members').doc(tx.memberId).update({
            activeLoansCount: newLoansCount,
            updatedAt: new Date().toISOString(),
          });
        }
      }

      setSuccessMessage(`Lehkhabu '${tx.bookTitle}' peklet a ni ta!`);
      onDataChanged();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Return book error:', err);
      setErrorMessage(err?.message || 'Lehkhabu peklet a hlawhchham.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
          {/* Top Bar with Mode Toggle */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-church-900 via-church-800 to-church-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                <BookOpen className="w-5 h-5 text-church-200" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-snug">
                  {mode === 'issue' ? 'Lehkhabu Hawhtirna (Issue Book)' : 'Lehkhabu Pekletna (Return Book)'}
                </h3>
                <p className="text-xs text-church-200 font-light">
                  QR code scan emaw search hmangin awlsam takin issue/return rawh
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="bg-church-950/80 p-1 rounded-xl flex border border-church-700/60">
                <button
                  type="button"
                  onClick={() => setMode('issue')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    mode === 'issue'
                      ? 'bg-amber-400 text-slate-900 shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Issue (Hawhtir)
                </button>
                <button
                  type="button"
                  onClick={() => setMode('return')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    mode === 'return'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Return (Peklet)
                </button>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-5 overflow-y-auto flex-1 space-y-5">
            {/* Feedback Messages */}
            {successMessage && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-semibold">{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <span className="font-semibold">{errorMessage}</span>
              </div>
            )}

            {/* DUAL SECTIONS: 1. BORROWER + 2. BOOK */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SECTION 1: BORROWER PROFILE */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                      <UserCheck className="w-4 h-4 text-church-600" />
                      <span>1. Borrower Profile</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setScannerTarget('member');
                        setScannerOpen(true);
                      }}
                      className="px-2.5 py-1 bg-church-800 hover:bg-church-900 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-xs transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Scan Borrower</span>
                    </button>
                  </div>

                  {selectedMember ? (
                    <div className="bg-white rounded-xl p-3.5 border border-slate-200 relative group shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setSelectedMember(null)}
                        className="absolute right-2 top-2 p-1 text-slate-400 hover:text-rose-500 rounded-md"
                        title="Remove selection"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-church-100 text-church-700 font-bold flex items-center justify-center text-sm border border-church-200">
                          {selectedMember.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                          <h4 className="font-bold text-sm text-slate-900 truncate">
                            {selectedMember.name}
                          </h4>
                          <p className="text-xs text-slate-500 font-mono">
                            {selectedMember.memberNo} • {selectedMember.department}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{selectedMember.phone}</span>
                          </p>
                        </div>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Active Loans:</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full ${
                            (selectedMember.activeLoansCount || 0) >= 3
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {selectedMember.activeLoansCount || 0} Lehkhabu
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search borrower by name, ID, or phone..."
                          value={memberSearchQuery}
                          onChange={(e) => setMemberSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-church-500"
                        />
                      </div>

                      {filteredMembers.length > 0 && (
                        <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100 max-h-36 overflow-y-auto shadow-sm">
                          {filteredMembers.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                setSelectedMember(m);
                                setMemberSearchQuery('');
                              }}
                              className="w-full text-left p-2 hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
                            >
                              <div>
                                <p className="font-semibold text-slate-800">{m.name}</p>
                                <p className="text-[11px] text-slate-400 font-mono">{m.memberNo} • {m.phone}</p>
                              </div>
                              <span className="text-[10px] text-church-600 font-bold bg-church-50 px-2 py-0.5 rounded">
                                Select
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="p-3 bg-slate-100 rounded-lg text-center text-xs text-slate-500">
                        Scan borrower's card QR code or type their name/phone above.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 2: BOOK DETAILS */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                      <BookMarked className="w-4 h-4 text-church-600" />
                      <span>2. Book Details</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setScannerTarget('book');
                        setScannerOpen(true);
                      }}
                      className="px-2.5 py-1 bg-church-800 hover:bg-church-900 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-xs transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Scan Book</span>
                    </button>
                  </div>

                  {selectedBook ? (
                    <div className="bg-white rounded-xl p-3.5 border border-slate-200 relative group shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setSelectedBook(null)}
                        className="absolute right-2 top-2 p-1 text-slate-400 hover:text-rose-500 rounded-md"
                        title="Remove selection"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-12 rounded bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs border border-amber-200 shrink-0">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                          <h4 className="font-bold text-sm text-slate-900 line-clamp-1">
                            {selectedBook.title}
                          </h4>
                          <p className="text-xs text-slate-600 line-clamp-1">
                            By {selectedBook.author}
                          </p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">
                            Acc: {selectedBook.accessionNo} • {selectedBook.category}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Copies Available:</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full ${
                            selectedBook.availableCopies > 0
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {selectedBook.availableCopies} / {selectedBook.totalCopies} Available
                        </span>
                      </div>
                      {selectedBook.shelfLocation && (
                        <p className="text-[11px] text-slate-500 mt-1">
                          Shelf: <span className="font-semibold text-slate-700">{selectedBook.shelfLocation}</span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search book by title, author, or Acc No..."
                          value={bookSearchQuery}
                          onChange={(e) => setBookSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-church-500"
                        />
                      </div>

                      {filteredBooks.length > 0 && (
                        <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100 max-h-36 overflow-y-auto shadow-sm">
                          {filteredBooks.map((b) => (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => {
                                setSelectedBook(b);
                                setBookSearchQuery('');
                              }}
                              className="w-full text-left p-2 hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
                            >
                              <div className="pr-2">
                                <p className="font-semibold text-slate-800 line-clamp-1">{b.title}</p>
                                <p className="text-[11px] text-slate-400 font-mono">{b.accessionNo} • {b.author}</p>
                              </div>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                                  b.availableCopies > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
                                }`}
                              >
                                {b.availableCopies > 0 ? 'Available' : 'Issued'}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="p-3 bg-slate-100 rounded-lg text-center text-xs text-slate-500">
                        Scan book sticker QR code or search book title above.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ISSUE MODE CONFIG */}
            {mode === 'issue' && (
              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950 flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Loan Duration & Due Date</span>
                  </span>
                  <div className="flex space-x-1.5">
                    {[7, 14, 21, 30].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => handleLoanDaysChange(days)}
                        className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                          loanDays === days
                            ? 'bg-amber-600 text-white'
                            : 'bg-white border border-amber-200 text-amber-800 hover:bg-amber-100'
                        }`}
                      >
                        {days} Days
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                      Due Date (Peklet Hun Tur)
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-amber-600 absolute left-3 top-2.5" />
                      <input
                        type="date"
                        value={customDueDate}
                        onChange={(e) => setCustomDueDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-amber-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                      Remarks / Notes (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Condition good, Sunday School reference"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* RETURN MODE SUMMARY */}
            {mode === 'return' && (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-3">
                <span className="text-xs font-bold text-emerald-950 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Return Verification</span>
                </span>

                {activeBookTransaction ? (
                  <div className="bg-white p-3 rounded-lg border border-emerald-200 text-xs space-y-1">
                    <p className="font-semibold text-slate-800">
                      Active Loan Record: <span className="text-church-700">{activeBookTransaction.bookTitle}</span>
                    </p>
                    <p className="text-slate-600">
                      Borrower: <span className="font-medium">{activeBookTransaction.memberName}</span> ({activeBookTransaction.memberNo})
                    </p>
                    <p className="text-slate-500">
                      Issued: {activeBookTransaction.issueDate} • Due: {activeBookTransaction.dueDate}
                    </p>
                  </div>
                ) : selectedBook ? (
                  <p className="text-xs text-slate-500 italic">
                    No active loan found for this book in current records (it may already be in the library).
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">
                    Scan or select the book being returned to verify loan record.
                  </p>
                )}

                {/* If member is selected, show their active borrowed books list */}
                {selectedMember && activeMemberTransactions.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-bold text-slate-700 mb-1.5">
                      {selectedMember.name}'s Active Borrowed Books:
                    </p>
                    <div className="space-y-1.5">
                      {activeMemberTransactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div>
                            <p className="font-bold text-slate-800">{tx.bookTitle}</p>
                            <p className="text-[11px] text-slate-400 font-mono">Acc: {tx.accessionNo} • Due: {tx.dueDate}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleReturnBook(tx)}
                            disabled={submitting}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold text-xs transition-colors"
                          >
                            Return This
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            {mode === 'issue' ? (
              <button
                type="button"
                onClick={handleIssueBook}
                disabled={submitting || !selectedBook || !selectedMember || (selectedBook?.availableCopies || 0) <= 0}
                className="px-6 py-2.5 bg-gradient-to-r from-church-700 to-church-900 hover:from-church-800 hover:to-slate-900 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{submitting ? 'Hawhtir Mek...' : 'Issue Book (Hawhtir Rawh)'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleReturnBook()}
                disabled={submitting || (!activeBookTransaction && !selectedBook)}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>{submitting ? 'Peklet Mek...' : 'Return Book (Peklet Rawh)'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Camera Scanner Modal */}
      <QrScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScanResult}
        expectedType={scannerTarget}
        title={scannerTarget === 'member' ? 'Scan Borrower Library Card' : 'Scan Book QR Sticker'}
      />
    </>
  );
};
