import React, { useState } from 'react';
import {
  X,
  Tag,
  Plus,
  Trash2,
  Edit2,
  Check,
  RotateCcw,
  BookOpen,
  AlertTriangle,
  Sparkles,
  Layers,
  Search,
} from 'lucide-react';
import { db } from '../../services/firebase';
import { LibraryBook, LibrarySettings } from '../../types';
import { DEFAULT_LIBRARY_GENRES } from '../../constants/libraryGenres';

interface GenreManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGenres: string[];
  books: LibraryBook[];
  settings: LibrarySettings;
  onGenresUpdated: (updatedGenres: string[]) => void;
}

export const GenreManagementModal: React.FC<GenreManagementModalProps> = ({
  isOpen,
  onClose,
  currentGenres,
  books,
  settings,
  onGenresUpdated,
}) => {
  const [genresList, setGenresList] = useState<string[]>(
    currentGenres && currentGenres.length > 0 ? currentGenres : DEFAULT_LIBRARY_GENRES
  );
  const [newGenreInput, setNewGenreInput] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [updateBooksOnRename, setUpdateBooksOnRename] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync state when opened
  React.useEffect(() => {
    if (isOpen) {
      setGenresList(currentGenres && currentGenres.length > 0 ? currentGenres : DEFAULT_LIBRARY_GENRES);
      setNewGenreInput('');
      setEditingIndex(null);
      setStatusMessage(null);
    }
  }, [isOpen, currentGenres]);

  if (!isOpen) return null;

  // Calculate book counts per genre
  const getBookCount = (genreName: string) => {
    return books.filter((b) => (b.category || '').toLowerCase().trim() === genreName.toLowerCase().trim()).length;
  };

  // Add a new genre
  const handleAddGenre = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newGenreInput.trim();
    if (!trimmed) return;

    if (genresList.some((g) => g.toLowerCase().trim() === trimmed.toLowerCase())) {
      setStatusMessage({ type: 'error', text: `Genre "${trimmed}" hi a awm sa tawh e.` });
      return;
    }

    const updated = [...genresList, trimmed];
    setGenresList(updated);
    setNewGenreInput('');
    await saveGenresToFirestore(updated, `Genre "${trimmed}" thar dah luh a ni e.`);
  };

  // Quick add from defaults if missing
  const handleAddPreset = async (preset: string) => {
    if (genresList.includes(preset)) return;
    const updated = [...genresList, preset];
    setGenresList(updated);
    await saveGenresToFirestore(updated, `Genre "${preset}" dah luh a ni e.`);
  };

  // Start editing
  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingText(genresList[index]);
  };

  // Save edit / rename
  const handleSaveEdit = async (index: number) => {
    const oldName = genresList[index];
    const newName = editingText.trim();
    if (!newName) return;

    if (oldName === newName) {
      setEditingIndex(null);
      return;
    }

    if (genresList.some((g, idx) => idx !== index && g.toLowerCase().trim() === newName.toLowerCase())) {
      setStatusMessage({ type: 'error', text: `Genre "${newName}" hi a awm sa tawh e.` });
      return;
    }

    setSaving(true);
    try {
      const updated = [...genresList];
      updated[index] = newName;
      setGenresList(updated);
      setEditingIndex(null);

      // If requested, also rename in existing books
      if (updateBooksOnRename && db && db.collection) {
        const booksToUpdate = books.filter(
          (b) => (b.category || '').toLowerCase().trim() === oldName.toLowerCase().trim()
        );
        if (booksToUpdate.length > 0) {
          const batch = db.batch();
          booksToUpdate.forEach((b) => {
            const docRef = db.collection('library_books').doc(b.id);
            batch.update(docRef, { category: newName, updatedAt: new Date().toISOString() });
          });
          await batch.commit();
        }
      }

      await saveGenresToFirestore(updated, `Genre "${oldName}" chu "${newName}"-ah thlak a ni e.`);
    } catch (err: any) {
      console.error('Failed to update genre:', err);
      setStatusMessage({ type: 'error', text: err?.message || 'Genre update a hlawhchham.' });
    } finally {
      setSaving(false);
    }
  };

  // Delete a genre
  const handleDeleteGenre = async (index: number) => {
    const genreToDelete = genresList[index];
    const count = getBookCount(genreToDelete);

    if (count > 0) {
      const confirmMsg = `He genre "${genreToDelete}"-ah hian lehkhabu ${count} a awm mek. I delete duh tak tak em? (Lehkhabute chu delete tel a ni lovang).`;
      if (!window.confirm(confirmMsg)) return;
    }

    const updated = genresList.filter((_, idx) => idx !== index);
    setGenresList(updated);
    await saveGenresToFirestore(updated, `Genre "${genreToDelete}" paih a ni e.`);
  };

  // Reset to Bethel church default genres
  const handleResetToDefaults = async () => {
    if (window.confirm('Bethel Kohhran default genre list 8 hi hman leh i duh em?')) {
      setGenresList(DEFAULT_LIBRARY_GENRES);
      await saveGenresToFirestore(DEFAULT_LIBRARY_GENRES, 'Default genre-te hman leh a ni e.');
    }
  };

  // Persist to Firestore
  const saveGenresToFirestore = async (newGenres: string[], successMsg: string) => {
    setSaving(true);
    setStatusMessage(null);
    try {
      if (db && db.collection) {
        await db.collection('library_settings').doc('config').set(
          {
            ...settings,
            genres: newGenres,
          },
          { merge: true }
        );
      }
      onGenresUpdated(newGenres);
      setStatusMessage({ type: 'success', text: successMsg });
    } catch (err: any) {
      console.error('Failed to save genres:', err);
      setStatusMessage({ type: 'error', text: err?.message || 'Settings save a hlawhchham.' });
    } finally {
      setSaving(false);
    }
  };

  const filteredGenres = genresList.filter((g) =>
    g.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const missingPresets = DEFAULT_LIBRARY_GENRES.filter(
    (preset) => !genresList.some((g) => g.toLowerCase().trim() === preset.toLowerCase().trim())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-church-950 via-church-900 to-church-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-church-500/20 border border-church-400/30 flex items-center justify-center text-church-200">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-lg leading-snug">Manage Book Genres / Categories</h3>
                <span className="bg-church-700/80 text-church-100 text-[10px] font-bold px-2 py-0.5 rounded-full border border-church-600/50">
                  {genresList.length} Genres
                </span>
              </div>
              <p className="text-xs text-church-200 font-light mt-0.5">
                Lehkhabu chi hrang hrang (genre) siam belh, thlak danglam emaw paih rawh
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

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 text-xs rounded-xl flex items-center justify-between ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              <span>{statusMessage.text}</span>
              <button
                type="button"
                onClick={() => setStatusMessage(null)}
                className="text-slate-400 hover:text-slate-600 font-bold ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Add New Genre Form */}
          <form onSubmit={handleAddGenre} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2">
            <label className="block text-xs font-bold text-slate-800 flex items-center space-x-1.5">
              <Plus className="w-3.5 h-3.5 text-church-600" />
              <span>Add New Genre (Genre Thar Siam Belhna)</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. Mizo Poetry & Folklore, Youth Devotionals..."
                  value={newGenreInput}
                  onChange={(e) => setNewGenreInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-church-500 focus:outline-none font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={saving || !newGenreInput.trim()}
                className="px-4 py-2 bg-church-800 hover:bg-church-900 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Genre</span>
              </button>
            </div>
          </form>

          {/* Missing Preset Suggestions */}
          {missingPresets.length > 0 && (
            <div className="p-3 bg-church-50/60 border border-church-200/70 rounded-xl space-y-1.5">
              <span className="text-[11px] font-bold text-church-900 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-church-600" />
                <span>Suggested Standard Church Genres (Click to Add):</span>
              </span>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {missingPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleAddPreset(preset)}
                    className="text-[11px] bg-white hover:bg-church-100 text-church-800 border border-church-300 px-2.5 py-1 rounded-lg transition-colors font-medium flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3 text-church-600" />
                    <span>{preset}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search & List Control */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search genres..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-church-500"
              />
            </div>

            <button
              type="button"
              onClick={handleResetToDefaults}
              className="text-[11px] text-slate-600 hover:text-church-700 font-semibold flex items-center space-x-1 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
              title="Reset genres list to default Bethel Church genres"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Defaults</span>
            </button>
          </div>

          {/* Genre List */}
          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white shadow-xs">
            {filteredGenres.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                Genre zawn hmuh a ni lo.
              </div>
            ) : (
              filteredGenres.map((genre, idx) => {
                const bookCount = getBookCount(genre);
                const isEditing = editingIndex === idx;

                return (
                  <div
                    key={idx}
                    className="p-3 flex items-center justify-between hover:bg-slate-50/80 transition-colors gap-3"
                  >
                    {isEditing ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="flex-1 px-2.5 py-1 text-xs sm:text-sm bg-white border border-church-500 rounded-lg font-medium"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(idx)}
                          disabled={saving || !editingText.trim()}
                          className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                          title="Save change"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingIndex(null)}
                          className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 min-w-0 flex items-center space-x-2.5">
                        <span className="text-slate-400 font-mono text-[11px] w-5 text-right">
                          {idx + 1}.
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {genre}
                          </p>
                          <p className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                            <BookOpen className="w-3 h-3 text-slate-400" />
                            <span>
                              {bookCount} {bookCount === 1 ? 'book' : 'books'} in catalog
                            </span>
                          </p>
                        </div>
                      </div>
                    )}

                    {!isEditing && (
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(idx)}
                          className="p-1.5 text-slate-400 hover:text-church-700 hover:bg-church-50 rounded-lg transition-colors"
                          title="Rename genre"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteGenre(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete genre"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Total active genres: <strong className="text-slate-800">{genresList.length}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-church-800 hover:bg-church-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
