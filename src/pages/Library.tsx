import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  BookOpen,
  QrCode,
  UserPlus,
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  Sparkles,
  Smartphone,
  Layers,
  Users,
  History,
  Settings,
  ArrowRight,
  BookMarked,
  Phone,
  MessageCircle,
  RefreshCw,
  Eye,
  Edit3,
  Trash2,
  Library as LibraryIcon,
  Tag,
  MapPin,
  Check,
  Send,
  Calendar,
} from 'lucide-react';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LibraryBook, LibraryMember, LibraryTransaction, LibrarySettings } from '../types';
import { QrScannerModal } from '../components/library/QrScannerModal';
import { BorrowerRegistrationModal } from '../components/library/BorrowerRegistrationModal';
import { IssueReturnModal } from '../components/library/IssueReturnModal';
import { ExcelImportModal } from '../components/library/ExcelImportModal';
import { BookFormModal } from '../components/library/BookFormModal';
import { BookDetailsModal } from '../components/library/BookDetailsModal';
import { BatchQrPrintModal } from '../components/library/BatchQrPrintModal';
import { RegisterQrStandModal } from '../components/library/RegisterQrStandModal';
import { GenreManagementModal } from '../components/library/GenreManagementModal';
import { DEFAULT_LIBRARY_GENRES } from '../constants/libraryGenres';
import { exportBooksCatalogToExcel, exportTransactionsToExcel, exportMembersToExcel, downloadSampleBookTemplate, downloadSimpleTitlesTemplate } from '../utils/libraryExcel';
import { parseScannedQr } from '../utils/qrHelper';

const INITIAL_SETTINGS: LibrarySettings = {
  libraryName: 'PCI Champhai Bethel Kohhran Library',
  loanDurationDays: 14,
  maxBooksPerMember: 3,
  allowSelfRegistration: true,
  finePerDay: 0,
  contactPerson: 'Librarian',
  contactPhone: '9862300000',
  genres: DEFAULT_LIBRARY_GENRES,
};

export const Library: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin, userProfile, currentUser } = useAuth();
  const { t } = useLanguage();

  // Active Tab: 'catalog' | 'issue-return' | 'borrowers' | 'transactions' | 'database'
  const [activeTab, setActiveTab] = useState<'catalog' | 'issue-return' | 'borrowers' | 'transactions' | 'database'>('catalog');

  // Main Data States
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [members, setMembers] = useState<LibraryMember[]>([]);
  const [transactions, setTransactions] = useState<LibraryTransaction[]>([]);
  const [settings, setSettings] = useState<LibrarySettings>(INITIAL_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'available' | 'issued'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [borrowerSearch, setBorrowerSearch] = useState('');
  const [transactionFilter, setTransactionFilter] = useState<'ALL' | 'active' | 'overdue' | 'returned'>('ALL');

  // Library Directory Landing States
  const [directoryTab, setDirectoryTab] = useState<'categories' | 'authors' | 'az'>('categories');
  const [selectedDirectoryFilter, setSelectedDirectoryFilter] = useState<{ type: 'category' | 'author' | 'az'; value: string } | null>(null);

  // Authors List with book counts
  const authorsList = useMemo(() => {
    const map = new Map<string, { count: number; available: number }>();
    books.forEach((b) => {
      const author = b.author?.trim() || 'Unknown Author';
      const curr = map.get(author) || { count: 0, available: 0 };
      map.set(author, {
        count: curr.count + 1,
        available: curr.available + ((b.availableCopies || 0) > 0 ? 1 : 0),
      });
    });
    return Array.from(map.entries())
      .map(([author, data]) => ({ author, ...data }))
      .sort((a, b) => a.author.localeCompare(b.author));
  }, [books]);

  // A-Z List with book counts
  const azList = useMemo(() => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const map = new Map<string, number>();
    letters.forEach((l) => map.set(l, 0));
    map.set('#', 0);

    books.forEach((b) => {
      const firstChar = (b.title || '').trim().charAt(0).toUpperCase();
      if (letters.includes(firstChar)) {
        map.set(firstChar, (map.get(firstChar) || 0) + 1);
      } else {
        map.set('#', (map.get('#') || 0) + 1);
      }
    });

    const result: { letter: string; count: number }[] = [];
    if ((map.get('#') || 0) > 0) {
      result.push({ letter: '#', count: map.get('#') || 0 });
    }
    letters.forEach((l) => {
      result.push({ letter: l, count: map.get(l) || 0 });
    });
    return result;
  }, [books]);

  // Modal States
  const [scannerModalOpen, setScannerModalOpen] = useState(false);
  const [scannerTargetType, setScannerTargetType] = useState<'any' | 'book' | 'member'>('any');
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [issueReturnModalOpen, setIssueReturnModalOpen] = useState(false);
  const [issueReturnInitialMode, setIssueReturnInitialMode] = useState<'issue' | 'return'>('issue');
  const [selectedBookForAction, setSelectedBookForAction] = useState<LibraryBook | null>(null);
  const [selectedMemberForAction, setSelectedMemberForAction] = useState<LibraryMember | null>(null);
  const [excelImportModalOpen, setExcelImportModalOpen] = useState(false);
  const [bookFormModalOpen, setBookFormModalOpen] = useState(false);
  const [bookToEdit, setBookToEdit] = useState<LibraryBook | null>(null);
  const [bookDetailsModalOpen, setBookDetailsModalOpen] = useState(false);
  const [selectedBookDetails, setSelectedBookDetails] = useState<LibraryBook | null>(null);
  const [batchPrintModalOpen, setBatchPrintModalOpen] = useState(false);
  const [batchPrintInitialType, setBatchPrintInitialType] = useState<'books' | 'members'>('books');
  const [registerStandModalOpen, setRegisterStandModalOpen] = useState(false);
  const [genreModalOpen, setGenreModalOpen] = useState(false);

  // Settings saving state
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Dynamic Genres list
  const effectiveGenres = useMemo(() => {
    return settings.genres && settings.genres.length > 0 ? settings.genres : DEFAULT_LIBRARY_GENRES;
  }, [settings.genres]);

  const handleAddNewGenre = async (newGenre: string) => {
    if (!newGenre.trim()) return;
    const trimmed = newGenre.trim();
    if (effectiveGenres.includes(trimmed)) return;
    const updatedGenres = [...effectiveGenres, trimmed];
    const updatedSettings = { ...settings, genres: updatedGenres };
    setSettings(updatedSettings);
    if (db && db.collection) {
      try {
        await db.collection('library_settings').doc('config').set(updatedSettings, { merge: true });
      } catch (e) {
        console.error('Failed to auto-save new genre to settings:', e);
      }
    }
  };

  const handleSaveGenresFromModal = async (newGenres: string[]) => {
    const updatedSettings = { ...settings, genres: newGenres };
    setSettings(updatedSettings);
    if (db && db.collection) {
      try {
        await db.collection('library_settings').doc('config').set(updatedSettings, { merge: true });
      } catch (e) {
        console.error('Failed to save genres to settings:', e);
      }
    }
  };

  // Check URL query on mount for self-registration QR stand or scanner shortcut
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'register') {
      setRegistrationModalOpen(true);
      // clean param
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch library data from Firestore
  const fetchLibraryData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      if (db && db.collection) {
        // 1. Books
        try {
          const booksSnap = await db.collection('library_books').get();
          const booksList: LibraryBook[] = booksSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as LibraryBook[];
          booksList.sort((a, b) => (a.accessionNo || '').localeCompare(b.accessionNo || ''));
          setBooks(booksList);
        } catch (booksErr: any) {
          console.warn('Error fetching books collection:', booksErr?.message || booksErr);
        }

        // 2. Members
        try {
          const membersSnap = await db.collection('library_members').get();
          const membersList: LibraryMember[] = membersSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as LibraryMember[];
          membersList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          setMembers(membersList);
        } catch (membersErr: any) {
          console.warn('Error fetching members collection:', membersErr?.message || membersErr);
        }

        // 3. Transactions
        try {
          const txSnap = await db.collection('library_transactions').get();
          const txList: LibraryTransaction[] = txSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as LibraryTransaction[];
          txList.sort((a, b) => new Date(b.createdAt || b.issueDate).getTime() - new Date(a.createdAt || a.issueDate).getTime());
          setTransactions(txList);
        } catch (txErr: any) {
          console.warn('Error fetching transactions collection:', txErr?.message || txErr);
        }

        // 4. Settings
        try {
          const settingsDoc = await db.collection('library_settings').doc('config').get();
          if (settingsDoc.exists) {
            setSettings({ ...INITIAL_SETTINGS, ...settingsDoc.data() });
          }
        } catch (settingsErr: any) {
          console.warn('Error fetching library settings:', settingsErr?.message || settingsErr);
        }
      }
    } catch (err: any) {
      console.error('Error fetching library data:', err);
      setFetchError(err?.message || 'Error fetching library data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibraryData();
  }, []);

  // Set of existing accession numbers for duplicate prevention
  const existingAccessionNos = useMemo(() => {
    return new Set(books.map((b) => b.accessionNo));
  }, [books]);

  // General Scanner handler from top header button
  const handleGeneralScanResult = (raw: string, parsed: ReturnType<typeof parseScannedQr>) => {
    if (parsed.type === 'member') {
      const match = members.find(
        (m) =>
          m.memberNo.toLowerCase() === parsed.identifier.toLowerCase() ||
          m.id === parsed.identifier ||
          m.id === parsed.id ||
          m.phone === parsed.identifier
      );
      if (match) {
        setSelectedMemberForAction(match);
        setSelectedBookForAction(null);
        setIssueReturnInitialMode('issue');
        setIssueReturnModalOpen(true);
      } else {
        alert(`Borrower ID '${parsed.identifier}' hi hmuh a ni lo.`);
      }
    } else {
      // Book
      const match = books.find(
        (b) =>
          b.accessionNo.toLowerCase() === parsed.identifier.toLowerCase() ||
          b.id === parsed.identifier ||
          b.id === parsed.id ||
          (b.isbn && b.isbn === parsed.identifier)
      );
      if (match) {
        setSelectedBookDetails(match);
        setBookDetailsModalOpen(true);
      } else {
        alert(`Lehkhabu Accession No '${parsed.identifier}' hi database-ah a awm lo.`);
      }
    }
  };

  // Delete Book
  const handleDeleteBook = async (book: LibraryBook) => {
    try {
      if (db && db.collection) {
        await db.collection('library_books').doc(book.id).delete();
      }
      fetchLibraryData();
    } catch (err) {
      console.error('Error deleting book:', err);
      alert('Failed to delete book');
    }
  };

  // Delete All Books / Clear Book List
  const handleDeleteAllBooks = async () => {
    if (!window.confirm("WARNING: Are you sure you want to delete ALL book titles from the library database? This action cannot be undone and will clear the catalog so you can upload a new list.")) {
      return;
    }
    try {
      if (db && db.collection) {
        const snap = await db.collection('library_books').get();
        const deletePromises = snap.docs.map((d) => d.ref.delete());
        await Promise.all(deletePromises);
      }
      setBooks([]);
      alert("All books have been successfully deleted from the library catalog.");
      fetchLibraryData();
    } catch (err) {
      console.error('Error deleting all books:', err);
      alert('Failed to delete all books.');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      if (db && db.collection) {
        await db.collection('library_settings').doc('config').set(settings, { merge: true });
      }
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  // Filtered Books
  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const matchesSearch =
        !searchQuery.trim() ||
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.accessionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.isbn && b.isbn.includes(searchQuery)) ||
        (b.shelfLocation && b.shelfLocation.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesDirectory = true;
      if (selectedDirectoryFilter) {
        if (selectedDirectoryFilter.type === 'category') {
          matchesDirectory = b.category === selectedDirectoryFilter.value;
        } else if (selectedDirectoryFilter.type === 'author') {
          matchesDirectory = (b.author?.trim() || 'Unknown Author') === selectedDirectoryFilter.value;
        } else if (selectedDirectoryFilter.type === 'az') {
          const firstChar = (b.title || '').trim().charAt(0).toUpperCase();
          if (selectedDirectoryFilter.value === '#') {
            matchesDirectory = !/[A-Z]/.test(firstChar);
          } else {
            matchesDirectory = firstChar === selectedDirectoryFilter.value;
          }
        }
      }

      const matchesCategory = categoryFilter === 'ALL' || b.category === categoryFilter;

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'available' && b.availableCopies > 0) ||
        (statusFilter === 'issued' && b.availableCopies === 0);

      return matchesSearch && matchesDirectory && matchesCategory && matchesStatus;
    });
  }, [books, searchQuery, categoryFilter, statusFilter, selectedDirectoryFilter]);

  // Filtered Borrowers
  const filteredMembersList = useMemo(() => {
    return members.filter((m) => {
      if (!borrowerSearch.trim()) return true;
      const q = borrowerSearch.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.memberNo.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        (m.department && m.department.toLowerCase().includes(q)) ||
        (m.veng && m.veng.toLowerCase().includes(q))
      );
    });
  }, [members, borrowerSearch]);

  // Filtered Transactions & Overdue
  const filteredTransactions = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return transactions.filter((t) => {
      const isOverdue = t.status === 'active' && t.dueDate < todayStr;
      if (transactionFilter === 'active') return t.status === 'active';
      if (transactionFilter === 'overdue') return isOverdue;
      if (transactionFilter === 'returned') return t.status === 'returned';
      return true;
    });
  }, [transactions, transactionFilter]);

  // Summary Metrics
  const totalBooksCount = books.reduce((acc, b) => acc + (b.totalCopies || 1), 0);
  const totalAvailableCopies = books.reduce((acc, b) => acc + (b.availableCopies || 0), 0);
  const totalIssuedCopies = totalBooksCount - totalAvailableCopies;
  const activeLoansCount = transactions.filter((t) => t.status === 'active').length;
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueLoansCount = transactions.filter((t) => t.status === 'active' && t.dueDate < todayStr).length;

  // Send WhatsApp Reminder to Overdue Borrower
  const handleSendWhatsAppReminder = (tx: LibraryTransaction) => {
    const cleanPhone = tx.memberPhone.replace(/\D/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const message = encodeURIComponent(
      `Shalom ${tx.memberName}, Champhai Bethel Kohhran Library atanga lehkhabu i hawh '${tx.bookTitle}' (Acc No: ${tx.accessionNo}) hi ${tx.dueDate} khan a hun a lo tawp tawh a. Khawngaihin library hawn hunah rawn pelet emaw renew turin kan inngen e. Ka lawm e.`
    );
    window.open(`https://wa.me/${phoneWithCode}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-church-950 via-church-900 to-slate-900 text-white relative overflow-hidden shadow-lg">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold backdrop-blur-xs border border-white/10">
                <BookOpen className="w-3.5 h-3.5" />
                <span>PCI Champhai Bethel Kohhran</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                Church Library Management System
              </h1>
              <p className="text-sm sm:text-base text-church-200 max-w-2xl font-light">
                Lehkhabu zawnna, QR Code hmanga hawh leh pekletna, member registration leh Excel catalog management.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Scan Any QR Button */}
              <button
                type="button"
                onClick={() => {
                  setScannerTargetType('any');
                  setScannerModalOpen(true);
                }}
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center space-x-2 cursor-pointer hover:scale-105 active:scale-95"
              >
                <QrCode className="w-4 h-4 text-slate-950" />
                <span>Scan QR Code</span>
              </button>

              {/* Fast Issue & Return (Librarian Desk) */}
              <button
                type="button"
                onClick={() => {
                  setSelectedBookForAction(null);
                  setSelectedMemberForAction(null);
                  setIssueReturnInitialMode('issue');
                  setIssueReturnModalOpen(true);
                }}
                className="px-4 py-2.5 bg-church-800 hover:bg-church-700 text-white font-bold rounded-xl text-xs sm:text-sm border border-white/20 shadow-md transition-all flex items-center space-x-2 cursor-pointer"
              >
                <BookMarked className="w-4 h-4 text-amber-300" />
                <span>Issue / Return</span>
              </button>

              {/* Member Self-Registration Button */}
              <button
                type="button"
                onClick={() => setRegistrationModalOpen(true)}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs sm:text-sm border border-white/20 backdrop-blur-xs transition-all flex items-center space-x-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-emerald-300" />
                <span>Register Borrower</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
            <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
              <span className="text-[11px] uppercase tracking-wider text-church-300 font-semibold block">Total Books</span>
              <span className="text-xl sm:text-2xl font-black text-white">{books.length} <span className="text-xs font-normal text-church-300">titles ({totalBooksCount} copies)</span></span>
            </div>

            <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
              <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-semibold block">Available</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400">{totalAvailableCopies} <span className="text-xs font-normal text-emerald-200">copies ready</span></span>
            </div>

            <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
              <span className="text-[11px] uppercase tracking-wider text-amber-300 font-semibold block">Issued Out</span>
              <span className="text-xl sm:text-2xl font-black text-amber-400">{activeLoansCount} <span className="text-xs font-normal text-amber-200">borrowed</span></span>
            </div>

            <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
              <span className="text-[11px] uppercase tracking-wider text-rose-300 font-semibold block">Overdue</span>
              <span className={`text-xl sm:text-2xl font-black ${overdueLoansCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                {overdueLoansCount} <span className="text-xs font-normal text-rose-200">books late</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container with Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Navigation Tabs Bar */}
        <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-slate-200 mb-6 flex items-center justify-between overflow-x-auto gap-2">
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'catalog'
                  ? 'bg-church-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Catalog (Lehkhabu)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('issue-return')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'issue-return'
                  ? 'bg-church-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Issue & Return Desk</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('borrowers')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'borrowers'
                  ? 'bg-church-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Borrowers ({members.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('transactions')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 relative ${
                activeTab === 'transactions'
                  ? 'bg-church-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Loans & Overdue</span>
              {overdueLoansCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5" />
              )}
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab('database')}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 ${
                  activeTab === 'database'
                    ? 'bg-church-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                <span>Database & Excel</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => setRegisterStandModalOpen(true)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 flex items-center space-x-1.5 transition-colors"
              title="Show QR Stand for phone registration"
            >
              <Smartphone className="w-3.5 h-3.5 text-church-600" />
              <span className="hidden md:inline">Registration QR Stand</span>
            </button>
          </div>
        </div>

        {/* TAB 1: CATALOG */}
        {activeTab === 'catalog' && (
          <div className="space-y-5">
            {/* Search, Filters, and Admin Actions */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Search input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search by book title, author, Accession No, ISBN, shelf..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Admin Quick Buttons */}
                {isAdmin && (
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setBookToEdit(null);
                        setBookFormModalOpen(true);
                      }}
                      className="px-3.5 py-2 bg-church-800 hover:bg-church-900 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center space-x-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Single Book</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExcelImportModalOpen(true)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center space-x-1.5"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Import Excel</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setBatchPrintInitialType('books');
                        setBatchPrintModalOpen(true);
                      }}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs border border-slate-300 transition-all flex items-center space-x-1.5"
                    >
                      <Printer className="w-4 h-4 text-church-600" />
                      <span>Print QR Labels</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Category & Status Filter Pills */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 max-w-full">
                  <span className="text-xs font-semibold text-slate-500 shrink-0 flex items-center space-x-1">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Genre:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('ALL')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      categoryFilter === 'ALL'
                        ? 'bg-church-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    All ({books.length})
                  </button>
                  {effectiveGenres.map((cat) => {
                    const genreCount = books.filter((b) => b.category === cat).length;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center space-x-1 ${
                          categoryFilter === cat
                            ? 'bg-church-900 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <span>{cat}</span>
                        {genreCount > 0 && (
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                              categoryFilter === cat ? 'bg-church-800 text-church-200' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {genreCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setGenreModalOpen(true)}
                      className="px-2.5 py-1 bg-church-50 hover:bg-church-100 text-church-800 border border-church-200 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center space-x-1 shrink-0"
                    >
                      <Tag className="w-3 h-3 text-church-600" />
                      <span>+ Manage Genres</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <div className="bg-slate-100 p-1 rounded-lg flex border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setStatusFilter('ALL')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
                        statusFilter === 'ALL' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'
                      }`}
                    >
                      All ({books.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('available')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
                        statusFilter === 'available' ? 'bg-white shadow-xs text-emerald-700 font-bold' : 'text-slate-600'
                      }`}
                    >
                      Available ({totalAvailableCopies})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('issued')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
                        statusFilter === 'issued' ? 'bg-white shadow-xs text-amber-700 font-bold' : 'text-slate-600'
                      }`}
                    >
                      Issued ({totalIssuedCopies})
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => exportBooksCatalogToExcel(books)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs border border-slate-300"
                    title="Export Catalog to Excel"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Books Grid / List View or Directory Landing */}
            {loading ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                <RefreshCw className="w-8 h-8 text-church-600 animate-spin mx-auto mb-3" />
                <p className="font-semibold text-slate-700">Lehkhabu zawng zawng lakkhawm mek a ni...</p>
              </div>
            ) : !searchQuery.trim() && !selectedDirectoryFilter ? (
              <div className="space-y-6">
                {/* Directory Navigation Header */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                      <BookOpen className="w-5 h-5 text-church-600" />
                      <span>Library Directory</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Explore library collection by Category, Author, or A-Z index.
                    </p>
                  </div>
                  <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setDirectoryTab('categories')}
                      className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                        directoryTab === 'categories'
                          ? 'bg-church-800 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>View by Category</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDirectoryTab('authors')}
                      className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                        directoryTab === 'authors'
                          ? 'bg-church-800 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>View by Author</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDirectoryTab('az')}
                      className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                        directoryTab === 'az'
                          ? 'bg-church-800 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>View by A-Z</span>
                    </button>
                  </div>
                </div>

                {/* Directory Content */}
                {directoryTab === 'categories' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {effectiveGenres.map((cat) => {
                      const catBooks = books.filter((b) => b.category === cat);
                      const catCount = catBooks.length;
                      const availCount = catBooks.filter((b) => (b.availableCopies || 0) > 0).length;
                      return (
                        <div
                          key={cat}
                          onClick={() => setSelectedDirectoryFilter({ type: 'category', value: cat })}
                          className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-church-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="p-2.5 bg-church-50 text-church-700 rounded-xl group-hover:bg-church-800 group-hover:text-white transition-colors">
                                <Tag className="w-4 h-4" />
                              </span>
                              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-full text-xs">
                                {catCount} {catCount === 1 ? 'book' : 'books'}
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-900 group-hover:text-church-700 transition-colors text-sm mb-1">
                              {cat}
                            </h4>
                            <p className="text-xs text-slate-500">
                              {availCount} available for loan
                            </p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-church-700 font-bold">
                            <span>Browse Category</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {directoryTab === 'authors' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {authorsList.length === 0 ? (
                      <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-slate-200">
                        <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-700">No authors found in catalog</p>
                      </div>
                    ) : (
                      authorsList.map((item) => (
                        <div
                          key={item.author}
                          onClick={() => setSelectedDirectoryFilter({ type: 'author', value: item.author })}
                          className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-church-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="p-2.5 bg-amber-50 text-amber-700 rounded-xl group-hover:bg-amber-800 group-hover:text-white transition-colors">
                                <Users className="w-4 h-4" />
                              </span>
                              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-full text-xs">
                                {item.count} {item.count === 1 ? 'book' : 'books'}
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-900 group-hover:text-church-700 transition-colors text-sm mb-1 line-clamp-1">
                              {item.author}
                            </h4>
                            <p className="text-xs text-slate-500">
                              {item.available} available
                            </p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-church-700 font-bold">
                            <span>View Author Books</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {directoryTab === 'az' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-3">
                      {azList.map((item) => (
                        <button
                          key={item.letter}
                          type="button"
                          onClick={() => setSelectedDirectoryFilter({ type: 'az', value: item.letter })}
                          disabled={item.count === 0}
                          className={`p-4 rounded-2xl border flex flex-col items-center justify-center space-y-1 transition-all ${
                            item.count > 0
                              ? 'bg-white border-slate-200 hover:border-church-500 hover:shadow-md cursor-pointer text-slate-900 group'
                              : 'bg-slate-50 border-slate-200 opacity-40 cursor-not-allowed text-slate-400'
                          }`}
                        >
                          <span className="text-lg font-extrabold font-mono group-hover:text-church-700 transition-colors">
                            {item.letter}
                          </span>
                          <span className="text-[10px] bg-slate-100 group-hover:bg-church-50 group-hover:text-church-700 px-2 py-0.5 rounded-full font-bold">
                            {item.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDirectoryFilter && (
                  <div className="flex items-center justify-between bg-church-50 border border-church-200 px-4 py-3 rounded-2xl shadow-xs">
                    <div className="flex items-center space-x-2 text-xs font-semibold text-church-900">
                      <span className="font-bold text-church-700">Browsing {selectedDirectoryFilter.type.toUpperCase()}:</span>
                      <span className="bg-white px-2.5 py-1 rounded-lg border border-church-300 font-bold text-slate-900">
                        {selectedDirectoryFilter.value}
                      </span>
                      <span className="text-slate-500">({filteredBooks.length} {filteredBooks.length === 1 ? 'book' : 'books'})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedDirectoryFilter(null)}
                      className="px-3.5 py-1.5 bg-church-800 text-white rounded-xl text-xs font-bold hover:bg-church-900 transition-colors shadow-xs"
                    >
                      ← Back to Directory
                    </button>
                  </div>
                )}

                {filteredBooks.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                    <h3 className="text-lg font-bold text-slate-800">Lehkhabu hmuh a ni lo</h3>
                    <p className="text-sm text-slate-500 max-w-md mx-auto">
                      I thil zawn nen a inmil lehkhabu a awm rih lo.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredBooks.map((book) => {
                      const isAvailable = (book.availableCopies || 0) > 0;
                      return (
                        <div
                          key={book.id}
                          onClick={() => {
                            setSelectedBookDetails(book);
                            setBookDetailsModalOpen(true);
                          }}
                          className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-church-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                        >
                          <div>
                            {/* Top bar: Acc No + Status */}
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-mono text-xs font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                {book.accessionNo}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isAvailable
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {isAvailable ? `${book.availableCopies} Copies Left` : 'Issued Out'}
                              </span>
                            </div>

                            {/* Title & Author */}
                            <h3 className="font-bold text-sm text-slate-900 group-hover:text-church-700 transition-colors line-clamp-2 mb-1">
                              {book.title}
                            </h3>
                            <p className="text-xs text-slate-600 font-medium line-clamp-1 mb-2">
                              By {book.author}
                            </p>

                            <div className="flex flex-wrap gap-1 mb-2">
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                                {book.category}
                              </span>
                              {book.shelfLocation && (
                                <span className="text-[10px] bg-church-50 text-church-700 px-2 py-0.5 rounded font-medium flex items-center space-x-1">
                                  <MapPin className="w-2.5 h-2.5" />
                                  <span>{book.shelfLocation}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Card Footer: Quick Actions */}
                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <span>Total: {book.totalCopies} {book.totalCopies === 1 ? 'copy' : 'copies'}</span>
                            <div className="flex items-center space-x-1">
                              <span className="text-church-600 font-bold text-[11px] group-hover:underline flex items-center">
                                Details <ArrowRight className="w-3 h-3 ml-0.5" />
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ISSUE & RETURN DESK */}
        {activeTab === 'issue-return' && (
          <div className="space-y-6">
            {/* Fast Desk Launch Banners */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Issue Card */}
              <div className="bg-gradient-to-br from-church-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-church-800 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center mb-4 border border-amber-400/30">
                    <BookMarked className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Fast Issue Book Desk (Lehkhabu Hawhtirna)</h3>
                  <p className="text-xs text-church-200 leading-relaxed mb-6">
                    Borrower QR Code leh Lehkhabu QR Code scan rualin 1-click in lehkhabu hawh tir nghal rawh. Due date leh borrower active loans fel takin a in-track nghal ang.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBookForAction(null);
                    setSelectedMemberForAction(null);
                    setIssueReturnInitialMode('issue');
                    setIssueReturnModalOpen(true);
                  }}
                  className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold rounded-xl text-sm shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Start Fast Issue Checkout</span>
                </button>
              </div>

              {/* Return Card */}
              <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-emerald-800 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center mb-4 border border-emerald-400/30">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Fast Return Desk (Lehkhabu Pekletna)</h3>
                  <p className="text-xs text-emerald-200 leading-relaxed mb-6">
                    Lehkhabu peklet dawnin lehkhabu QR code emaw borrower ID scan la, active loan chu 'Returned' ah rang takin thlak la, copy available zat a in-update nghal ang.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBookForAction(null);
                    setSelectedMemberForAction(null);
                    setIssueReturnInitialMode('return');
                    setIssueReturnModalOpen(true);
                  }}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold rounded-xl text-sm shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Start Fast Return Check-In</span>
                </button>
              </div>
            </div>

            {/* Active Issued Books Activity List */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Tun Laia Hawh Mekte (Currently Active Loans)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lehkhabu la pelet lo zawng zawng leh an peklet hun tur (Due Date)
                  </p>
                </div>
                <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full">
                  {transactions.filter((t) => t.status === 'active').length} Active Loans
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Accession No</th>
                      <th className="p-3">Book Title</th>
                      <th className="p-3">Borrower Name</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Issue Date</th>
                      <th className="p-3">Due Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions
                      .filter((t) => t.status === 'active')
                      .slice(0, 15)
                      .map((tx) => {
                        const isLate = tx.dueDate < todayStr;
                        return (
                          <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-mono font-bold text-amber-800">{tx.accessionNo}</td>
                            <td className="p-3 font-bold text-slate-900">{tx.bookTitle}</td>
                            <td className="p-3 text-slate-700">
                              {tx.memberName} <span className="text-[10px] text-slate-400 font-mono">({tx.memberNo})</span>
                            </td>
                            <td className="p-3 text-slate-500 font-mono">{tx.memberPhone}</td>
                            <td className="p-3 text-slate-600">{tx.issueDate}</td>
                            <td className="p-3 font-semibold">
                              <span className={isLate ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                                {tx.dueDate} {isLate ? '(Overdue)' : ''}
                              </span>
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isLate ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {isLate ? 'LATE / OVERDUE' : 'ACTIVE'}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                {isLate && (
                                  <button
                                    type="button"
                                    onClick={() => handleSendWhatsAppReminder(tx)}
                                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                    title="Send WhatsApp Reminder"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                  </button>
                                )}
                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const b = books.find((x) => x.id === tx.bookId);
                                      if (b) setSelectedBookForAction(b);
                                      setIssueReturnInitialMode('return');
                                      setIssueReturnModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition-colors"
                                  >
                                    Return
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BORROWERS / MEMBERS */}
        {activeTab === 'borrowers' && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search borrower by name, ID, phone, department, or veng..."
                  value={borrowerSearch}
                  onChange={(e) => setBorrowerSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-church-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setRegistrationModalOpen(true)}
                  className="px-4 py-2 bg-church-800 hover:bg-church-900 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center space-x-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register Borrower</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBatchPrintInitialType('members');
                    setBatchPrintModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs border border-slate-300 flex items-center space-x-1.5"
                >
                  <Printer className="w-4 h-4 text-church-600" />
                  <span>Batch Print Cards</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportMembersToExcel(members)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs border border-slate-300"
                  title="Export Members to Excel"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Borrowers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredMembersList.map((member) => (
                <div
                  key={member.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-extrabold text-church-800 bg-church-50 px-2 py-0.5 rounded border border-church-200">
                        {member.memberNo}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          (member.activeLoansCount || 0) > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {member.activeLoansCount || 0} Loans
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 mb-0.5 line-clamp-1">
                      {member.name}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium mb-2">
                      {member.department || 'Kohhran Member'} • {member.veng || 'Bethel'}
                    </p>
                    <p className="text-xs text-slate-600 flex items-center space-x-1.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{member.phone}</span>
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Reg: {member.registeredDate}</span>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMemberForAction(member);
                          setSelectedBookForAction(null);
                          setIssueReturnInitialMode('issue');
                          setIssueReturnModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-church-800 hover:bg-church-900 text-white rounded-lg text-xs font-semibold"
                      >
                        Issue Book
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: TRANSACTIONS & OVERDUE */}
        {activeTab === 'transactions' && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-600">Filter Transactions:</span>
                <div className="bg-slate-100 p-1 rounded-lg flex border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setTransactionFilter('ALL')}
                    className={`px-3 py-1 font-semibold rounded-md ${
                      transactionFilter === 'ALL' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'
                    }`}
                  >
                    All ({transactions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransactionFilter('active')}
                    className={`px-3 py-1 font-semibold rounded-md ${
                      transactionFilter === 'active' ? 'bg-white shadow-xs text-amber-700 font-bold' : 'text-slate-600'
                    }`}
                  >
                    Active Loans ({activeLoansCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransactionFilter('overdue')}
                    className={`px-3 py-1 font-semibold rounded-md ${
                      transactionFilter === 'overdue' ? 'bg-white shadow-xs text-rose-700 font-bold' : 'text-slate-600'
                    }`}
                  >
                    Overdue Late ({overdueLoansCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransactionFilter('returned')}
                    className={`px-3 py-1 font-semibold rounded-md ${
                      transactionFilter === 'returned' ? 'bg-white shadow-xs text-emerald-700 font-bold' : 'text-slate-600'
                    }`}
                  >
                    Returned
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => exportTransactionsToExcel(transactions)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold border border-slate-300 flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Loans to Excel</span>
              </button>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Acc No</th>
                    <th className="p-3">Book Title</th>
                    <th className="p-3">Borrower</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Issue Date</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3">Return Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((tx) => {
                    const isOverdue = tx.status === 'active' && tx.dueDate < todayStr;
                    return (
                      <tr key={tx.id} className={isOverdue ? 'bg-rose-50/40 hover:bg-rose-50/70' : 'hover:bg-slate-50'}>
                        <td className="p-3 font-mono font-bold text-amber-800">{tx.accessionNo}</td>
                        <td className="p-3 font-bold text-slate-900 max-w-xs truncate">{tx.bookTitle}</td>
                        <td className="p-3 text-slate-700">
                          {tx.memberName} <span className="text-[10px] text-slate-400 font-mono">({tx.memberNo})</span>
                        </td>
                        <td className="p-3 text-slate-500 font-mono">{tx.memberPhone}</td>
                        <td className="p-3 text-slate-600">{tx.issueDate}</td>
                        <td className="p-3 font-semibold">
                          <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                            {tx.dueDate}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">{tx.returnDate || '-'}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              tx.status === 'returned'
                                ? 'bg-emerald-100 text-emerald-800'
                                : isOverdue
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {tx.status === 'returned' ? 'RETURNED' : isOverdue ? 'OVERDUE' : 'ACTIVE'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {tx.status === 'active' && (
                            <div className="flex items-center justify-end space-x-1.5">
                              {isOverdue && (
                                <button
                                  type="button"
                                  onClick={() => handleSendWhatsAppReminder(tx)}
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-md"
                                  title="Send WhatsApp Reminder"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </button>
                              )}
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const b = books.find((x) => x.id === tx.bookId);
                                    if (b) setSelectedBookForAction(b);
                                    setIssueReturnInitialMode('return');
                                    setIssueReturnModalOpen(true);
                                  }}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold"
                                >
                                  Return
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: DATABASE & SETTINGS (ADMIN ONLY) */}
        {activeTab === 'database' && isAdmin && (
          <div className="space-y-6">
            {/* Excel Management Hub */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <span>Excel Database Import & Export Hub</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Excel spreadsheet hmangin lehkhabu database awlsam takin thun lut la, catalog leh loan records export rawh.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Import Excel */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-800">1. Bulk Import Books</h4>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                        Excel & Text
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Upload .xlsx/.csv spreadsheet or paste book title lists to batch insert with auto QR codes.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExcelImportModalOpen(true)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 shadow-xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Open Import Window</span>
                  </button>
                </div>

                {/* 2. Download Sample Templates */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">2. Excel Templates</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Download pre-formatted Excel template files for easy data entry.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={downloadSimpleTitlesTemplate}
                      className="w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Simple Titles Template (.xlsx)</span>
                    </button>
                    <button
                      type="button"
                      onClick={downloadSampleBookTemplate}
                      className="w-full py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-600" />
                      <span>Full Catalog Template (.xlsx)</span>
                    </button>
                  </div>
                </div>

                {/* 3. Export Current Catalog */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">3. Export Database</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Export complete catalog with {books.length} titles into an Excel sheet with backup data.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => exportBooksCatalogToExcel(books)}
                    className="w-full py-2 bg-church-800 hover:bg-church-900 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Catalog ({books.length})</span>
                  </button>
                </div>

                {/* 4. Delete Book List / Clear Catalog */}
                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-bold text-sm text-rose-900 flex items-center space-x-1.5">
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      <span>4. Clear Book List</span>
                    </h4>
                    <p className="text-xs text-rose-700 mt-1">
                      Delete all existing book titles from the database to upload your new list.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDeleteAllBooks}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete All Books ({books.length})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Genre & Category Management Hub */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                    <Tag className="w-5 h-5 text-church-700" />
                    <span>Book Genres & Classification ({effectiveGenres.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage church library genres, create new custom categories, and organize books systematically.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setGenreModalOpen(true)}
                  className="px-4 py-2 bg-church-800 hover:bg-church-900 text-white font-bold rounded-xl text-xs shadow-xs transition-colors flex items-center justify-center space-x-1.5 shrink-0"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Manage / Add Genres</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                {effectiveGenres.map((genre, idx) => {
                  const bookCount = books.filter((b) => b.category === genre).length;
                  return (
                    <span
                      key={genre}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center space-x-2"
                    >
                      <span className="text-church-600 font-bold text-[11px]">#{idx + 1}</span>
                      <span>{genre}</span>
                      <span className="px-1.5 py-0.2 bg-slate-200 text-slate-600 rounded-full text-[10px] font-bold">
                        {bookCount} {bookCount === 1 ? 'book' : 'books'}
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Library Settings Form */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                    <Settings className="w-5 h-5 text-church-600" />
                    <span>Library Configuration & Rules</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Set default loan days, borrower limits, and library contact details.
                  </p>
                </div>
                {settingsSuccess && (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved!</span>
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Library Name
                    </label>
                    <input
                      type="text"
                      value={settings.libraryName}
                      onChange={(e) => setSettings({ ...settings, libraryName: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-church-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Default Loan Duration (Days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={settings.loanDurationDays}
                      onChange={(e) =>
                        setSettings({ ...settings, loanDurationDays: parseInt(e.target.value) || 14 })
                      }
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-church-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Max Books Allowed Per Member
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={settings.maxBooksPerMember}
                      onChange={(e) =>
                        setSettings({ ...settings, maxBooksPerMember: parseInt(e.target.value) || 3 })
                      }
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-church-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Librarian Contact Phone
                    </label>
                    <input
                      type="text"
                      value={settings.contactPhone || ''}
                      onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-church-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="px-6 py-2.5 bg-church-800 hover:bg-church-900 text-white font-bold rounded-xl text-xs shadow-md transition-colors"
                  >
                    {savingSettings ? 'Saving...' : 'Save Library Rules'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {/* 1. General QR Scanner Modal */}
      <QrScannerModal
        isOpen={scannerModalOpen}
        onClose={() => setScannerModalOpen(false)}
        onScan={handleGeneralScanResult}
        expectedType={scannerTargetType}
      />

      {/* 2. Borrower Registration Modal */}
      <BorrowerRegistrationModal
        isOpen={registrationModalOpen}
        onClose={() => setRegistrationModalOpen(false)}
        existingMemberCount={members.length}
        onRegistered={() => fetchLibraryData()}
      />

      {/* 3. Fast Issue & Return Modal */}
      <IssueReturnModal
        isOpen={issueReturnModalOpen}
        onClose={() => setIssueReturnModalOpen(false)}
        initialMode={issueReturnInitialMode}
        initialBook={selectedBookForAction}
        initialMember={selectedMemberForAction}
        books={books}
        members={members}
        transactions={transactions}
        defaultLoanDays={settings.loanDurationDays || 14}
        adminName={userProfile?.displayName || currentUser?.email || 'Librarian'}
        onDataChanged={() => fetchLibraryData()}
      />

      {/* 4. Excel Import Modal */}
      <ExcelImportModal
        isOpen={excelImportModalOpen}
        onClose={() => setExcelImportModalOpen(false)}
        existingBooksCount={books.length}
        existingAccessionNos={existingAccessionNos}
        existingBooks={books}
        availableGenres={effectiveGenres}
        onImportComplete={() => fetchLibraryData()}
        onOpenBatchPrint={() => {
          setBatchPrintInitialType('books');
          setBatchPrintModalOpen(true);
        }}
      />

      {/* 5. Book Form Modal (Add / Edit) */}
      <BookFormModal
        isOpen={bookFormModalOpen}
        onClose={() => setBookFormModalOpen(false)}
        bookToEdit={bookToEdit}
        existingBooksCount={books.length}
        availableGenres={effectiveGenres}
        onAddNewGenre={handleAddNewGenre}
        onSaved={() => fetchLibraryData()}
      />

      {/* 6. Book Details Modal */}
      <BookDetailsModal
        isOpen={bookDetailsModalOpen}
        onClose={() => setBookDetailsModalOpen(false)}
        book={selectedBookDetails}
        isAdmin={isAdmin}
        transactions={transactions}
        members={members}
        onEditBook={(book) => {
          setBookToEdit(book);
          setBookFormModalOpen(true);
        }}
        onDeleteBook={(book) => handleDeleteBook(book)}
        onIssueBook={(book) => {
          setSelectedBookForAction(book);
          setSelectedMemberForAction(null);
          setIssueReturnInitialMode('issue');
          setIssueReturnModalOpen(true);
        }}
        onReturnBook={(book) => {
          setSelectedBookForAction(book);
          setSelectedMemberForAction(null);
          setIssueReturnInitialMode('return');
          setIssueReturnModalOpen(true);
        }}
      />

      {/* 7. Batch QR Print Sheet Modal */}
      <BatchQrPrintModal
        isOpen={batchPrintModalOpen}
        onClose={() => setBatchPrintModalOpen(false)}
        books={books}
        members={members}
        initialType={batchPrintInitialType}
      />

      {/* 8. Scan to Register Poster Modal */}
      <RegisterQrStandModal
        isOpen={registerStandModalOpen}
        onClose={() => setRegisterStandModalOpen(false)}
      />

      {/* 9. Genre & Category Management Modal */}
      <GenreManagementModal
        isOpen={genreModalOpen}
        onClose={() => setGenreModalOpen(false)}
        currentGenres={effectiveGenres}
        onSaveGenres={handleSaveGenresFromModal}
        books={books}
        onBooksUpdated={() => fetchLibraryData()}
      />
    </div>
  );
};

export default Library;
