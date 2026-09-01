import * as XLSX from 'xlsx';
import { LibraryBook, LibraryTransaction, LibraryMember } from '../types';

export interface ParsedBookRow {
  accessionNo?: string;
  title: string;
  author: string;
  category?: string;
  isbn?: string;
  publisher?: string;
  publishedYear?: string | number;
  edition?: string;
  totalCopies?: number;
  shelfLocation?: string;
  language?: string;
  description?: string;
  status?: string;
  valid: boolean;
  error?: string;
}

export interface ExcelRawData {
  headers: string[];
  rawRows: Record<string, any>[];
  sheetNames: string[];
}

/**
 * Generate standard Complete Sample Excel Template for Church Library
 */
export function downloadSampleBookTemplate() {
  const sampleData = [
    {
      'Accession No': 'BTH-001',
      'Book Title': 'Pathian Thu Chianna (Theology)',
      'Author': 'Rev. Dr. Zairema',
      'Category': 'Theology & Thurin (Doctrine & Theology)',
      'ISBN': '978-81-1234-567-8',
      'Publisher': 'Synod Literature & Publication Board',
      'Published Year': 2018,
      'Edition': '3rd Edition',
      'Total Copies': 3,
      'Shelf Location': 'Rack A, Shelf 2',
      'Language': 'Mizo',
      'Description': 'Kohhran Thurin leh zirtirna pawimawh hrilhfiahna bu'
    },
    {
      'Accession No': 'BTH-002',
      'Book Title': 'Mizo Kristiante Chanchin',
      'Author': 'Rev. Lalrinawma',
      'Category': 'Kohhran Chanchin & History (Church & World History)',
      'ISBN': '978-81-9876-543-2',
      'Publisher': 'SLPB Aizawl',
      'Published Year': 2020,
      'Edition': '1st Edition',
      'Total Copies': 2,
      'Shelf Location': 'Rack B, Shelf 1',
      'Language': 'Mizo',
      'Description': 'Mizorama Chanchin Tha luh dan leh Kohhran thang chhoh dan chanchin'
    },
    {
      'Accession No': 'BTH-003',
      'Book Title': 'Kristian Chhungkua leh Nupa Nun',
      'Author': 'Rev. Vanlalbela',
      'Category': 'Chhungkua & Nupa Nun (Family, Youth & Marriage)',
      'ISBN': '978-03-1033-750-8',
      'Publisher': 'SLPB',
      'Published Year': 2019,
      'Edition': 'Expanded Edition',
      'Total Copies': 2,
      'Shelf Location': 'Rack C, Shelf 3',
      'Language': 'Mizo',
      'Description': 'Chhungkua leh nupa nun kaihhruaina bu pawimawh'
    },
    {
      'Accession No': 'BTH-004',
      'Book Title': 'Thuthlung Thar Hrilhfiahna (Matthaia)',
      'Author': 'Rev. C. Biakmawia',
      'Category': 'Baibul Zirna & Hrilhfiahna (Bible Study & Commentaries)',
      'ISBN': '978-81-7654-321-0',
      'Publisher': 'SLPB',
      'Published Year': 2021,
      'Edition': '2nd Edition',
      'Total Copies': 3,
      'Shelf Location': 'Rack A, Shelf 1',
      'Language': 'Mizo',
      'Description': 'Matthaia Chanchin Tha hrilhfiahna kimchang'
    },
    {
      'Accession No': 'BTH-005',
      'Book Title': 'Kristian Nundan Tha',
      'Author': 'Rev. Lalthankima',
      'Category': 'Kristian Nun & Nundân (Christian Living & Devotional)',
      'ISBN': '',
      'Publisher': 'PCI Champhai Bethel',
      'Published Year': 2022,
      'Edition': '1st Edition',
      'Total Copies': 2,
      'Shelf Location': 'Rack B, Shelf 2',
      'Language': 'Mizo',
      'Description': 'Kristian nun kawng dik zawh dan'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  worksheet['!cols'] = [
    { wch: 16 }, // Accession No
    { wch: 35 }, // Title
    { wch: 25 }, // Author
    { wch: 18 }, // Category
    { wch: 20 }, // ISBN
    { wch: 30 }, // Publisher
    { wch: 14 }, // Year
    { wch: 14 }, // Edition
    { wch: 12 }, // Copies
    { wch: 20 }, // Shelf
    { wch: 12 }, // Language
    { wch: 45 }, // Description
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Books_Catalog');
  XLSX.writeFile(workbook, 'Champhai_Bethel_Library_Full_Template.xlsx');
}

/**
 * Generate Simple "Book Titles Only" Excel Template
 */
export function downloadSimpleTitlesTemplate() {
  const sampleData = [
    { 'Book Title': 'Kristian Chhungkua', 'Author': 'Rev. Vanlalbela', 'Category': 'Christian Living', 'Total Copies': 2 },
    { 'Book Title': 'Pathian Ram Zawn Hmasak', 'Author': 'Rev. Chanchinmawia', 'Category': 'Sermon', 'Total Copies': 1 },
    { 'Book Title': 'Sunday School Zirtirtu Kaihhruaina', 'Author': 'Sunday School Board', 'Category': 'Sunday School', 'Total Copies': 3 },
    { 'Book Title': 'Mizo Hlahlui leh Chanchin', 'Author': 'B. Lalthangliana', 'Category': 'Mizo Literature', 'Total Copies': 1 },
    { 'Book Title': 'Bible Dictionary (Mizo)', 'Author': 'SLPB', 'Category': 'Reference', 'Total Copies': 2 },
    { 'Book Title': 'Kohhran Inrelbawl Dan', 'Author': 'PCI Synod', 'Category': 'Church Order', 'Total Copies': 1 }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  worksheet['!cols'] = [
    { wch: 38 }, // Title
    { wch: 28 }, // Author
    { wch: 20 }, // Category
    { wch: 14 }, // Total Copies
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Book_Titles');
  XLSX.writeFile(workbook, 'Champhai_Bethel_Simple_Book_Titles_Template.xlsx');
}

/**
 * Read raw Excel or CSV file data and extract headers and raw rows
 */
export async function readExcelRawData(file: File): Promise<ExcelRawData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetNames = workbook.SheetNames;
        if (!sheetNames || sheetNames.length === 0) {
          throw new Error('Spreadsheet file contains no sheets.');
        }

        const firstSheet = workbook.Sheets[sheetNames[0]];
        const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

        if (!rawRows || rawRows.length === 0) {
          throw new Error('Spreadsheet-ah hian data row engmah hmuh a ni lo.');
        }

        // Collect all distinct headers across rows
        const headersSet = new Set<string>();
        rawRows.forEach((r) => {
          Object.keys(r).forEach((k) => headersSet.add(k));
        });

        const headers = Array.from(headersSet);
        resolve({ headers, rawRows, sheetNames });
      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Map raw rows to ParsedBookRow objects using user-selected or auto-detected column mappings
 */
export function mapRawRowsToBooks(
  rawRows: Record<string, any>[],
  columnMapping: {
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
  },
  defaults: {
    defaultAuthor?: string;
    defaultCategory?: string;
    defaultCopies?: number;
    defaultShelf?: string;
    defaultLanguage?: string;
  } = {}
): ParsedBookRow[] {
  const {
    defaultAuthor = 'Unknown',
    defaultCategory = 'General',
    defaultCopies = 1,
    defaultShelf = '',
    defaultLanguage = 'Mizo',
  } = defaults;

  return rawRows.map((row, idx) => {
    const title = columnMapping.titleCol && row[columnMapping.titleCol] !== undefined
      ? String(row[columnMapping.titleCol]).trim()
      : '';

    const author = columnMapping.authorCol && row[columnMapping.authorCol] !== undefined
      ? String(row[columnMapping.authorCol]).trim()
      : defaultAuthor;

    const accessionNo = columnMapping.accessionNoCol && row[columnMapping.accessionNoCol] !== undefined
      ? String(row[columnMapping.accessionNoCol]).trim()
      : '';

    const category = columnMapping.categoryCol && row[columnMapping.categoryCol] !== undefined
      ? String(row[columnMapping.categoryCol]).trim()
      : defaultCategory;

    const isbn = columnMapping.isbnCol && row[columnMapping.isbnCol] !== undefined
      ? String(row[columnMapping.isbnCol]).trim()
      : '';

    const publisher = columnMapping.publisherCol && row[columnMapping.publisherCol] !== undefined
      ? String(row[columnMapping.publisherCol]).trim()
      : '';

    const publishedYear = columnMapping.yearCol && row[columnMapping.yearCol] !== undefined
      ? String(row[columnMapping.yearCol]).trim()
      : '';

    const edition = columnMapping.editionCol && row[columnMapping.editionCol] !== undefined
      ? String(row[columnMapping.editionCol]).trim()
      : '';

    const copiesRaw = columnMapping.copiesCol && row[columnMapping.copiesCol] !== undefined
      ? row[columnMapping.copiesCol]
      : defaultCopies;
    const totalCopies = Math.max(1, parseInt(String(copiesRaw), 10) || defaultCopies);

    const shelfLocation = columnMapping.shelfCol && row[columnMapping.shelfCol] !== undefined
      ? String(row[columnMapping.shelfCol]).trim()
      : defaultShelf;

    const language = columnMapping.languageCol && row[columnMapping.languageCol] !== undefined
      ? String(row[columnMapping.languageCol]).trim()
      : defaultLanguage;

    const description = columnMapping.descCol && row[columnMapping.descCol] !== undefined
      ? String(row[columnMapping.descCol]).trim()
      : '';

    const valid = !!title;
    const error = !title ? `Row ${idx + 2}: Title is required.` : undefined;

    return {
      title,
      author: author || defaultAuthor,
      accessionNo,
      category: category || defaultCategory,
      isbn,
      publisher,
      publishedYear,
      edition,
      totalCopies,
      shelfLocation,
      language: language || defaultLanguage,
      description,
      valid,
      error,
    };
  });
}

/**
 * Auto-detect column headers from an Excel file
 */
export function autoDetectColumns(headers: string[]) {
  const mapping: {
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
  } = {};

  headers.forEach((h) => {
    const clean = h.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Title match
    if (!mapping.titleCol && (
      clean.includes('booktitle') ||
      clean.includes('title') ||
      clean.includes('lehkhabu') ||
      clean.includes('hming') ||
      clean.includes('bookname') ||
      clean.includes('name')
    )) {
      mapping.titleCol = h;
    }
    // Author match
    else if (!mapping.authorCol && (
      clean.includes('author') ||
      clean.includes('ziaktu') ||
      clean.includes('writer') ||
      clean.includes('ziak') ||
      clean.includes('by')
    )) {
      mapping.authorCol = h;
    }
    // Accession No match
    else if (!mapping.accessionNoCol && (
      clean.includes('accession') ||
      clean.includes('accno') ||
      clean.includes('bookno') ||
      clean.includes('code') ||
      clean.includes('serial')
    )) {
      mapping.accessionNoCol = h;
    }
    // Category match
    else if (!mapping.categoryCol && (
      clean.includes('category') ||
      clean.includes('genre') ||
      clean.includes('subject') ||
      clean.includes('chi') ||
      clean.includes('type')
    )) {
      mapping.categoryCol = h;
    }
    // Copies match
    else if (!mapping.copiesCol && (
      clean.includes('copies') ||
      clean.includes('totalcopies') ||
      clean.includes('qty') ||
      clean.includes('quantity') ||
      clean.includes('zat')
    )) {
      mapping.copiesCol = h;
    }
    // Shelf match
    else if (!mapping.shelfCol && (
      clean.includes('shelf') ||
      clean.includes('rack') ||
      clean.includes('location') ||
      clean.includes.apply(clean, ['alm'])
    )) {
      mapping.shelfCol = h;
    }
    // ISBN match
    else if (!mapping.isbnCol && clean.includes('isbn')) {
      mapping.isbnCol = h;
    }
    // Publisher match
    else if (!mapping.publisherCol && (clean.includes('publisher') || clean.includes('tichhuaktu'))) {
      mapping.publisherCol = h;
    }
    // Year match
    else if (!mapping.yearCol && (clean.includes('year') || clean.includes('kum'))) {
      mapping.yearCol = h;
    }
    // Edition match
    else if (!mapping.editionCol && clean.includes('edition')) {
      mapping.editionCol = h;
    }
    // Language match
    else if (!mapping.languageCol && (clean.includes('language') || clean.includes('tawng'))) {
      mapping.languageCol = h;
    }
    // Description match
    else if (!mapping.descCol && (clean.includes('description') || clean.includes('desc') || clean.includes('notes') || clean.includes('summary'))) {
      mapping.descCol = h;
    }
  });

  // Fallback: If titleCol not found but there is a 1st column, assign 1st column
  if (!mapping.titleCol && headers.length > 0) {
    mapping.titleCol = headers[0];
  }

  return mapping;
}

/**
 * Parse uploaded Excel or CSV file into Book records automatically
 */
export async function parseBooksExcelFile(file: File): Promise<ParsedBookRow[]> {
  const rawData = await readExcelRawData(file);
  const columnMapping = autoDetectColumns(rawData.headers);
  return mapRawRowsToBooks(rawData.rawRows, columnMapping);
}

/**
 * Parse raw text / pasted list of book titles into structured ParsedBookRow array
 * Supports:
 * - Line by line titles:
 *   "Pathian Thu Chianna"
 *   "Mizo Kristiante Chanchin - Rev. Lalrinawma"
 *   "The Purpose Driven Life by Rick Warren"
 *   "Thuthlung Thar Hrilhfiahna (Commentary)"
 */
export function parseRawTextBookTitles(
  rawText: string,
  defaults: {
    defaultAuthor?: string;
    defaultCategory?: string;
    defaultCopies?: number;
    defaultShelf?: string;
    defaultLanguage?: string;
  } = {}
): ParsedBookRow[] {
  const {
    defaultAuthor = 'Unknown',
    defaultCategory = 'General',
    defaultCopies = 1,
    defaultShelf = '',
    defaultLanguage = 'Mizo',
  } = defaults;

  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

  return lines.map((line, idx) => {
    // Check for "Title - Author" or "Title | Author" or "Title by Author"
    let title = line;
    let author = defaultAuthor;
    let category = defaultCategory;

    // 1. Check tab separation (copied from spreadsheet or table)
    if (line.includes('\t')) {
      const parts = line.split('\t').map((p) => p.trim());
      title = parts[0] || '';
      if (parts[1]) author = parts[1];
      if (parts[2]) category = parts[2];
    }
    // 2. Check hyphen separation "Title - Author"
    else if (line.includes(' - ')) {
      const parts = line.split(' - ');
      title = parts[0].trim();
      author = parts.slice(1).join(' - ').trim();
    }
    // 3. Check pipe separation "Title | Author"
    else if (line.includes('|')) {
      const parts = line.split('|').map((p) => p.trim());
      title = parts[0];
      if (parts[1]) author = parts[1];
      if (parts[2]) category = parts[2];
    }
    // 4. Check "by" separation (e.g., "The Purpose Driven Life by Rick Warren")
    else if (/\s+by\s+/i.test(line)) {
      const parts = line.split(/\s+by\s+/i);
      title = parts[0].trim();
      author = parts[1].trim();
    }

    // Clean numbering prefixes like "1. ", "1) ", "01. "
    title = title.replace(/^[\d]+[\.\)\-\:]\s*/, '').trim();

    const valid = !!title;
    const error = !title ? `Line ${idx + 1}: Empty book title` : undefined;

    return {
      title,
      author: author || defaultAuthor,
      category: category || defaultCategory,
      totalCopies: defaultCopies,
      shelfLocation: defaultShelf,
      language: defaultLanguage,
      valid,
      error,
    };
  });
}

/**
 * Export Books Catalog to Excel file
 */
export function exportBooksCatalogToExcel(books: LibraryBook[]) {
  const exportData = books.map((b) => ({
    'Accession No': b.accessionNo,
    'Book Title': b.title,
    'Author': b.author,
    'Category': b.category,
    'ISBN': b.isbn || '',
    'Total Copies': b.totalCopies,
    'Available Copies': b.availableCopies,
    'Status': b.status,
    'Shelf Location': b.shelfLocation || '',
    'Publisher': b.publisher || '',
    'Published Year': b.publishedYear || '',
    'Edition': b.edition || '',
    'Language': b.language || 'Mizo',
    'Description': b.description || '',
    'Added Date': b.createdAt ? new Date(b.createdAt).toLocaleDateString() : ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  worksheet['!cols'] = [
    { wch: 16 }, // Accession No
    { wch: 35 }, // Title
    { wch: 25 }, // Author
    { wch: 18 }, // Category
    { wch: 18 }, // ISBN
    { wch: 12 }, // Total Copies
    { wch: 15 }, // Available
    { wch: 12 }, // Status
    { wch: 20 }, // Shelf
    { wch: 25 }, // Publisher
    { wch: 14 }, // Year
    { wch: 14 }, // Edition
    { wch: 12 }, // Language
    { wch: 40 }, // Description
    { wch: 14 }, // Date
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Library_Catalog');

  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Champhai_Bethel_Library_Catalog_${dateStr}.xlsx`);
}

/**
 * Export Transactions / Loans to Excel
 */
export function exportTransactionsToExcel(transactions: LibraryTransaction[]) {
  const exportData = transactions.map((t) => ({
    'Transaction ID': t.id,
    'Book Title': t.bookTitle,
    'Accession No': t.accessionNo,
    'Borrower Name': t.memberName,
    'Member No': t.memberNo,
    'Phone': t.memberPhone,
    'Issue Date': t.issueDate,
    'Due Date': t.dueDate,
    'Return Date': t.returnDate || 'Not Returned',
    'Status': t.status.toUpperCase(),
    'Issued By': t.issuedBy || '',
    'Returned To': t.returnedTo || '',
    'Remarks': t.remarks || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Loans_History');

  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Champhai_Bethel_Library_Loans_${dateStr}.xlsx`);
}

/**
 * Export Borrowers Members List to Excel
 */
export function exportMembersToExcel(members: LibraryMember[]) {
  const exportData = members.map((m) => ({
    'Member No': m.memberNo,
    'Full Name': m.name,
    'Phone': m.phone,
    'Email': m.email || '',
    'Department / Fellowship': m.department || '',
    'Veng / Address': m.veng || m.address || '',
    'Registered Date': m.registeredDate,
    'Active Loans': m.activeLoansCount || 0,
    'Status': m.status.toUpperCase(),
    'Notes': m.notes || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Library_Members');

  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Champhai_Bethel_Library_Members_${dateStr}.xlsx`);
}

