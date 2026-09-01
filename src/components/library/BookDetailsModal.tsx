import React, { useState, useEffect } from 'react';
import { X, BookOpen, QrCode, Printer, Download, Edit3, Trash2, Tag, MapPin, Hash, User, Globe, Calendar, Layers, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { LibraryBook, LibraryTransaction, LibraryMember } from '../../types';
import { generateQrCodeDataUrl, encodeBookQr } from '../../utils/qrHelper';

interface BookDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: LibraryBook | null;
  isAdmin: boolean;
  onEditBook: (book: LibraryBook) => void;
  onDeleteBook: (book: LibraryBook) => void;
  onIssueBook: (book: LibraryBook) => void;
  onReturnBook: (book: LibraryBook) => void;
  transactions: LibraryTransaction[];
  members: LibraryMember[];
}

export const BookDetailsModal: React.FC<BookDetailsModalProps> = ({
  isOpen,
  onClose,
  book,
  isAdmin,
  onEditBook,
  onDeleteBook,
  onIssueBook,
  onReturnBook,
  transactions,
  members,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (book) {
      const payload = book.qrCode || encodeBookQr(book.accessionNo, book.id);
      generateQrCodeDataUrl(payload, { width: 280 }).then((url) => {
        setQrDataUrl(url);
      });
    }
  }, [book]);

  if (!isOpen || !book) return null;

  // Active loans for this book
  const activeLoans = transactions.filter((t) => t.bookId === book.id && t.status === 'active');
  const pastLoans = transactions.filter((t) => t.bookId === book.id && t.status === 'returned').slice(0, 5);

  const handlePrintSticker = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up window a in-block a ni. Allow popups to print sticker.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Book QR Label - ${book.accessionNo}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; display: flex; justify-content: center; }
            .sticker { width: 260px; border: 2px solid #0f172a; border-radius: 8px; padding: 12px; text-align: center; background: #fff; }
            .church { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #475569; }
            .title { font-size: 12px; font-weight: bold; color: #0f172a; margin: 4px 0 2px; }
            .author { font-size: 10px; color: #64748b; margin-bottom: 6px; }
            .qr { width: 120px; height: 120px; margin: 0 auto; }
            .acc { font-family: monospace; font-size: 13px; font-weight: bold; color: #0f172a; margin-top: 4px; letter-spacing: 1px; }
            .shelf { font-size: 9px; color: #64748b; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="sticker">
            <div class="church">Champhai Bethel Kohhran Library</div>
            <div class="title">${book.title}</div>
            <div class="author">By ${book.author}</div>
            <img src="${qrDataUrl}" class="qr" alt="QR Code" />
            <div class="acc">${book.accessionNo}</div>
            ${book.shelfLocation ? `<div class="shelf">Shelf: ${book.shelfLocation}</div>` : ''}
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `Bethel_Book_${book.accessionNo}_QR.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-church-900 via-church-800 to-church-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <BookOpen className="w-5 h-5 text-church-200" />
            </div>
            <div>
              <span className="font-mono text-xs font-bold text-amber-300 uppercase tracking-widest block">
                {book.accessionNo}
              </span>
              <h3 className="font-bold text-lg leading-snug line-clamp-1">{book.title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* Main Book Card & QR Sticker */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="sm:col-span-2 space-y-2">
              <div className="flex flex-wrap gap-1.5 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-church-100 text-church-800 border border-church-200">
                  {book.category}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    book.availableCopies > 0
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}
                >
                  {book.availableCopies > 0 ? `${book.availableCopies} Copies Available` : 'All Issued Out'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700">
                  {book.language || 'Mizo'}
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900">{book.title}</h2>
              <p className="text-sm font-semibold text-slate-700">
                Author: <span className="text-church-700">{book.author}</span>
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-200">
                <div>
                  <span className="text-slate-400 block">Shelf Location:</span>
                  <span className="font-semibold text-slate-800">{book.shelfLocation || 'Rack / General'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Total Copies:</span>
                  <span className="font-semibold text-slate-800">{book.totalCopies} Copy</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Publisher:</span>
                  <span className="font-semibold text-slate-800">{book.publisher || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Year / Edition:</span>
                  <span className="font-semibold text-slate-800">
                    {book.publishedYear || '-'} {book.edition ? `(${book.edition})` : ''}
                  </span>
                </div>
                {book.isbn && (
                  <div className="col-span-2">
                    <span className="text-slate-400 block">ISBN:</span>
                    <span className="font-mono font-semibold text-slate-800">{book.isbn}</span>
                  </div>
                )}
              </div>

              {book.description && (
                <div className="pt-2 border-t border-slate-200 text-xs text-slate-600">
                  <span className="text-slate-400 block font-semibold mb-0.5">Description:</span>
                  <p className="leading-relaxed">{book.description}</p>
                </div>
              )}
            </div>

            {/* QR Label Container */}
            <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
                Book QR Sticker
              </span>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Book QR" className="w-28 h-28 object-contain" />
              ) : (
                <div className="w-28 h-28 flex items-center justify-center bg-slate-100 rounded-lg">
                  <QrCode className="w-8 h-8 text-slate-400" />
                </div>
              )}
              <span className="font-mono font-bold text-xs text-slate-800 mt-1">
                {book.accessionNo}
              </span>

              <div className="flex gap-1 mt-2 w-full">
                <button
                  type="button"
                  onClick={handlePrintSticker}
                  className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center justify-center space-x-1 border border-slate-300"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center justify-center space-x-1 border border-slate-300"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          </div>

          {/* Active Loans Section */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-2 flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-church-600" />
              <span>Tun Laia Hawhtute (Active Loans)</span>
            </h4>

            {activeLoans.length > 0 ? (
              <div className="space-y-2">
                {activeLoans.map((loan) => (
                  <div
                    key={loan.id}
                    className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-amber-950">
                        {loan.memberName} ({loan.memberNo})
                      </p>
                      <p className="text-amber-800 text-[11px]">
                        Phone: {loan.memberPhone} • Issued: {loan.issueDate} • Due: {loan.dueDate}
                      </p>
                    </div>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onReturnBook(book);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs"
                      >
                        Return Book
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                He lehkhabu hi tunah hawh mek a awm lo. A la kim vek e.
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
          {isAdmin ? (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditBook(book);
                }}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1"
              >
                <Edit3 className="w-3.5 h-3.5 text-church-600" />
                <span>Edit Book</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`'${book.title}' hi library atanga delete i duh ngei em?`)) {
                    onDeleteBook(book);
                    onClose();
                  }
                }}
                className="px-3 py-1.5 bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 rounded-lg text-xs font-semibold flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold"
            >
              Close
            </button>

            {isAdmin && book.availableCopies > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onIssueBook(book);
                }}
                className="px-5 py-2 bg-church-800 hover:bg-church-900 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center space-x-1.5"
              >
                <span>Issue Book (Hawhtir)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
