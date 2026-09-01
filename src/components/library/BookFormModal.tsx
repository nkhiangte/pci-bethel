import React, { useState, useEffect } from 'react';
import { X, BookPlus, Sparkles, BookOpen, Tag, MapPin, Hash, User, Globe, FileText, Layers, Plus } from 'lucide-react';
import { db } from '../../services/firebase';
import { LibraryBook } from '../../types';
import { encodeBookQr } from '../../utils/qrHelper';
import { DEFAULT_LIBRARY_GENRES } from '../../constants/libraryGenres';

interface BookFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookToEdit?: LibraryBook | null;
  existingBooksCount: number;
  onSaved: () => void;
  availableGenres?: string[];
  onAddNewGenre?: (newGenre: string) => void;
}

export const BookFormModal: React.FC<BookFormModalProps> = ({
  isOpen,
  onClose,
  bookToEdit,
  existingBooksCount,
  onSaved,
  availableGenres,
  onAddNewGenre,
}) => {
  const genres = availableGenres && availableGenres.length > 0 ? availableGenres : DEFAULT_LIBRARY_GENRES;
  const defaultCategory = genres[0] || 'Theology & Thurin (Doctrine & Theology)';

  const [formData, setFormData] = useState({
    accessionNo: '',
    title: '',
    author: '',
    category: defaultCategory,
    isbn: '',
    publisher: '',
    publishedYear: '',
    edition: '',
    totalCopies: 1,
    shelfLocation: '',
    language: 'Mizo',
    coverUrl: '',
    description: '',
    status: 'available' as 'available' | 'issued' | 'maintenance' | 'lost',
  });

  const [isCustomGenreMode, setIsCustomGenreMode] = useState(false);
  const [customGenreText, setCustomGenreText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bookToEdit) {
      setFormData({
        accessionNo: bookToEdit.accessionNo || '',
        title: bookToEdit.title || '',
        author: bookToEdit.author || '',
        category: bookToEdit.category || defaultCategory,
        isbn: bookToEdit.isbn || '',
        publisher: bookToEdit.publisher || '',
        publishedYear: bookToEdit.publishedYear ? String(bookToEdit.publishedYear) : '',
        edition: bookToEdit.edition || '',
        totalCopies: bookToEdit.totalCopies || 1,
        shelfLocation: bookToEdit.shelfLocation || '',
        language: bookToEdit.language || 'Mizo',
        coverUrl: bookToEdit.coverUrl || '',
        description: bookToEdit.description || '',
        status: bookToEdit.status || 'available',
      });
      setIsCustomGenreMode(false);
    } else {
      // Auto-generate accession number for new book
      const nextAcc = `BTH-${(existingBooksCount + 1).toString().padStart(3, '0')}`;
      setFormData({
        accessionNo: nextAcc,
        title: '',
        author: '',
        category: defaultCategory,
        isbn: '',
        publisher: 'Synod Literature & Publication Board',
        publishedYear: new Date().getFullYear().toString(),
        edition: '1st Edition',
        totalCopies: 1,
        shelfLocation: 'Rack A',
        language: 'Mizo',
        coverUrl: '',
        description: '',
        status: 'available',
      });
      setIsCustomGenreMode(false);
      setCustomGenreText('');
    }
    setError(null);
  }, [bookToEdit, existingBooksCount, isOpen, defaultCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Lehkhabu hming (Title) ziah a ngai e.');
      return;
    }
    if (!formData.accessionNo.trim()) {
      setError('Accession Number ziah a ngai e.');
      return;
    }

    const finalCategory = isCustomGenreMode ? customGenreText.trim() || defaultCategory : formData.category.trim();
    if (!finalCategory) {
      setError('Genre / Category thlan a ngai e.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // If a brand new custom genre was typed in, notify parent to persist it
      if (isCustomGenreMode && customGenreText.trim() && onAddNewGenre) {
        onAddNewGenre(customGenreText.trim());
      }

      const bookId = bookToEdit?.id || 'book_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const qrPayload = encodeBookQr(formData.accessionNo.trim(), bookId);
      const totalCopies = Math.max(1, Number(formData.totalCopies) || 1);

      // If editing, preserve available copies delta
      let availableCopies = totalCopies;
      if (bookToEdit) {
        const issuedCopies = (bookToEdit.totalCopies || 1) - (bookToEdit.availableCopies || 0);
        availableCopies = Math.max(0, totalCopies - issuedCopies);
      }

      const bookData: LibraryBook = {
        id: bookId,
        accessionNo: formData.accessionNo.trim(),
        title: formData.title.trim(),
        author: formData.author.trim() || 'Unknown',
        category: finalCategory,
        isbn: formData.isbn.trim() || undefined,
        publisher: formData.publisher.trim() || undefined,
        publishedYear: formData.publishedYear ? Number(formData.publishedYear) || formData.publishedYear.trim() : undefined,
        edition: formData.edition.trim() || undefined,
        totalCopies,
        availableCopies,
        shelfLocation: formData.shelfLocation.trim() || undefined,
        language: formData.language.trim() || 'Mizo',
        coverUrl: formData.coverUrl.trim() || undefined,
        description: formData.description.trim() || undefined,
        status: availableCopies > 0 ? (formData.status === 'issued' ? 'available' : formData.status) : 'issued',
        qrCode: qrPayload,
        createdAt: bookToEdit?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (db && db.collection) {
        await db.collection('library_books').doc(bookId).set(bookData, { merge: true });
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Failed to save book:', err);
      setError(err?.message || 'Lehkhabu save a hlawhchham.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-church-900 via-church-800 to-church-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <BookPlus className="w-5 h-5 text-church-200" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-snug">
                {bookToEdit ? 'Edit Book Details' : 'Add New Book to Library'}
              </h3>
              <p className="text-xs text-church-200 font-light">
                Lehkhabu chanchin kimchang thun lut rawh
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Book Title (Lehkhabu Hming) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Pathian Thu Chianna"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-church-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Accession No <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. BTH-001"
                  value={formData.accessionNo}
                  onChange={(e) => setFormData({ ...formData, accessionNo: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-church-500 font-mono font-bold text-church-800"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Author / Writer (Ziaktu) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rev. Dr. Zairema"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-church-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Genre / Category <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomGenreMode(!isCustomGenreMode);
                    if (!isCustomGenreMode) {
                      setCustomGenreText('');
                    }
                  }}
                  className="text-[11px] text-church-700 hover:text-church-900 font-bold hover:underline flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3 text-church-600" />
                  <span>{isCustomGenreMode ? 'Choose Existing' : '+ New Genre'}</span>
                </button>
              </div>

              {isCustomGenreMode ? (
                <div className="relative">
                  <Tag className="w-4 h-4 text-church-600 absolute left-3 top-3" />
                  <input
                    type="text"
                    required={isCustomGenreMode}
                    placeholder="Type new genre name..."
                    value={customGenreText}
                    onChange={(e) => setCustomGenreText(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-church-50/50 border border-church-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-church-500 font-medium"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="relative">
                  <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomGenreMode(true);
                        setCustomGenreText('');
                      } else {
                        setFormData({ ...formData, category: e.target.value });
                      }
                    }}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-church-500 truncate"
                  >
                    {genres.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__custom__">+ Add Custom Genre...</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Copies (A zat)
              </label>
              <div className="relative">
                <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.totalCopies}
                  onChange={(e) => setFormData({ ...formData, totalCopies: parseInt(e.target.value) || 1 })}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-church-500 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Shelf Location / Rack
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Rack A, Shelf 2"
                  value={formData.shelfLocation}
                  onChange={(e) => setFormData({ ...formData, shelfLocation: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-church-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Language (Ṭawng)
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Mizo / English"
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-church-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Publisher (Tichhuaktu)
              </label>
              <input
                type="text"
                placeholder="e.g. SLPB Aizawl"
                value={formData.publisher}
                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-church-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Published Year / Edition
              </label>
              <input
                type="text"
                placeholder="e.g. 2020 (3rd Ed)"
                value={formData.publishedYear}
                onChange={(e) => setFormData({ ...formData, publishedYear: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-church-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ISBN Number (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 978-81-1234..."
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-church-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cover Image URL (Optional)
            </label>
            <input
              type="url"
              placeholder="e.g. https://example.com/cover.jpg"
              value={formData.coverUrl}
              onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-church-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Summary (Thuhmahruai / Zirchianna)
            </label>
            <textarea
              rows={3}
              placeholder="Lehkhabu chhungchang tawi fel tak..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-church-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-church-700 to-church-900 hover:from-church-800 hover:to-slate-900 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{saving ? 'Saving Book...' : bookToEdit ? 'Save Changes' : 'Add Book & Generate QR'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
