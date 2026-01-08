




export enum View {
  Home = 'Home',
  Sermons = 'Sermons',
  Events = 'Events',
  Announcements = 'Announcements',
  Leaders = 'Leaders',
  Contact = 'Contact'
}

export interface Announcement {
  id: string;
  title: string;
  date: string;
  category: 'General' | 'Funeral' | 'Youth' | 'Emergency';
  content: string;
  imageUrl?: string;
}

// FIX: Add Sermon interface to support sermon data.
export interface Sermon {
  id: string;
  title: string;
  date: string;
  preacher: string;
  scripture?: string;
  description?: string;
  audioUrl?: string;
  videoUrl?: string;
}

export interface ProgramDetails {
  hruaitu?: string; // Conductor/Leader
  tantu?: string; // Reader
  thuhriltu?: string; // Preacher
  thupui?: string; // Topic
  hawngtu?: string; // Topic Opener
  conductor?: string; // Legacy, prefer hruaitu
  pianist?: string;

  // New detailed fields
  solo?: string;
  groupZai?: string;
  thawhlawmKhawntute?: string[];
  khuangpu?: string[];
  zaiHruaitu?: string[];
  guitarist?: string;
  drummer?: string;
  hlaHriltu?: string;
}

export interface Event {
  id: string;
  title: string;
  date: string; // ISO Date string (YYYY-MM-DD) for specific events, or display string for static
  dayOfWeek?: number; // 0=Sunday, 1=Monday, ... 6=Saturday (For recurring templates)
  time: string;
  location: string;
  description: string;
  type: 'Service' | 'Meeting' | 'Special' | 'Fundraising';
  program?: ProgramDetails;
  isRecurringTemplate?: boolean;
  isCancelled?: boolean;
}

export interface Ministry {
  id: string;
  name: string;
  acronym?: string; // e.g., KTP, KPVM
  description: string;
  leader: string;
  schedule: string;
  image: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  period?: string; // For past pastors
  imageUrl: string;
  description?: string; // Added optional description for leaders/elders
  order?: number; // New field for custom sorting
}

export interface CommitteeMember {
  id?: string;
  name: string;
  role: string; // e.g., "Chairman", "Secretary", "Member"
  phone?: string;
}

export interface Committee {
  id: string;
  name: string;
  icon: string; // Store the icon name as a string (e.g., "BookOpen")
  description?: string; // New: Added optional description for committees
  members: CommitteeMember[];
  order?: number;
}

export interface UserProfile {
  uid?: string;
  email: string;
  displayName?: string;
  role?: 'admin' | 'member' | string;
  isAdmin?: string | boolean; // Matches the "isAdmin": "true" field in Firestore
  createdAt?: string;
}

export interface Resource {
  id: string;
  title: string;
  category: 'Report' | 'Form' | 'Bulletin' | 'Article';
  date: string;
  downloadUrl: string;
  fileSize?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  imageUrl: string;
  category: 'Committees' | 'Kohhran Chetna' | 'Kohhran Hunpui';
  date: string;
}

export interface SundaySchoolDepartment {
  id: string; // e.g., 'senior'
  name: string;
  leader: string;
  asstLeader?: string;
  secretary?: string;
  teachers: string[];
  description?: string;
  students?: number;
}


// New Record Types
export interface BaptismRecord {
  id?: string;
  type: 'baptism';
  name: string;
  dateOfBirth: string;
  baptismDate: string;
  parents: string;
  minister: string;
}

export interface WeddingRecord {
  id?: string;
  type: 'wedding';
  groomName: string;
  brideName: string;
  weddingDate: string;
  minister: string;
}

export interface DeathRecord {
  id?: string;
  type: 'death';
  name: string;
  dateOfDeath: string;
  age: number;
  familyContact?: string;
}

export interface InkhawmpuiRecord {
  id?: string;
  type: 'inkhawmpui';
  eventName: string;
  year: number;
  theme: string;
  location: string;
  speakers: string; // comma-separated
}

export type ChurchRecord = BaptismRecord | WeddingRecord | DeathRecord | InkhawmpuiRecord;

// Archives Type
export interface ArchiveEntry {
  id: string;
  title: string;
  date: string;
  category: 'Document' | 'Photo' | 'Video' | 'History' | 'Minute' | 'Rawngbawltu te';
  subCategory?: string; // New field for sub-categories under Rawngbawltu te
  description: string;
  link?: string; // Optional URL to the file
}

export interface WeeklyDuty {
  id: string; // Should be 'current'
  month: string;
  thawhlawmChiartute: string[];
  buhfaithamHralhtute: string[];
  ushers: string[];
  weekRange: string;
  zaiHruaitu: string;
  pianoTumtu: string;
  hlaHriltu: string;
  lightAndSoundDuty: string;
  pangparKhawitu: string;
}

// KTP Hruaitute Types
export interface KTPMember {
  id: string;
  name: string;
  role?: string;
  phone?: string;
}

export interface KTPGroup {
  id: string;
  groupName: string;
  members: KTPMember[];
}

export interface KTPSubCommittee {
  id: string;
  name: string;
  members: KTPMember[];
}

export interface KTPHruaitute {
  year: number;
  leaders: KTPMember[];
  committeeMembers: KTPMember[];
  exOfficioMembers: KTPMember[];
  groupLeaders?: KTPGroup[];
  subCommittees?: KTPSubCommittee[];
}

// KTP Budget Types
export interface BudgetItem {
  id: string;
  item: string;
  amount: string;
}

export interface KTPBudget {
  year: number;
  income: BudgetItem[];
  expenditure: BudgetItem[];
}
