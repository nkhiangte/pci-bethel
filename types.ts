
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
  imageUrl?: string; // Legacy field
  imageUrls?: string[]; // New field for multiple images
  imageCaptions?: string[]; // New field for per-image captions
  videoUrl?: string; // Legacy single video field
  videoUrls?: string[]; // New field for multiple YouTube integrations
}

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

export interface Article {
  id: string;
  title: string;
  author: string;
  date: string;
  category: 'Article' | 'Sermon';
  content: string;
  imageUrl?: string;
  videoUrl?: string; // Optional YouTube link
  views?: number;
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

export interface ServiceHistory {
    field: string;
    period: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  period?: string; // For past pastors
  imageUrl: string;
  description?: string; // Short bio/caption
  biography?: string; // Full biography text
  order?: number; // New field for custom sorting
  // Image adjustments
  imagePositionX?: number; // 0-100%
  imagePositionY?: number; // 0-100%
  imageScale?: number; // 1.0+
  // New pastoral fields
  probationTenure?: string;
  previousBial?: string; // Legacy field
  previousBials?: ServiceHistory[]; // New field for multiple entries
  qualification?: string;
  phoneNumber?: string; // New field for contact
}

export interface Missionary {
  id: string;
  name: string;
  qualification?: string; // New field for educational qualification
  field: string; // Mission Field (e.g., Arunachal, Nepal) - kept for backward compat/summary
  imageUrl: string;
  period?: string; // e.g. 2010 - Present - kept for backward compat/summary
  serviceHistory?: ServiceHistory[]; // New: List of multiple fields/years
  bio: string; // Full biography
  order?: number;
  // Image adjustments
  imagePositionX?: number; // 0-100%
  imagePositionY?: number; // 0-100%
  imageScale?: number; // 1.0+
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
  fatherName: string; // Restored to match DB field name
  age: string | number; 
  dateOfDeath: string;
  causeOfDeath: string;
  minister: string;
}

// FIX: Added missing InkhawmpuiRecord interface
export interface InkhawmpuiRecord {
  id?: string;
  type: 'inkhawmpui';
  eventName: string;
  year: number;
  theme: string;
  location: string;
  speakers: string;
}

export type ChurchRecord = BaptismRecord | WeddingRecord | DeathRecord | InkhawmpuiRecord;

// Archives Type
export interface ArchiveEntry {
  id: string;
  title: string;
  date: string;
  category: 'Document' | 'Photo' | 'Video' | 'History' | 'Minute' | 'Rawngbawltu te' | 'Pastors' | 'Upa kal ta te' | 'Weekly Program';
  subCategory?: string; // New field for sub-categories under Rawngbawltu te
  department?: string; // New field for Sunday School hierarchy (e.g., 'Primary', 'Committee')
  description: string;
  link?: string; // Optional URL to the file
  imageUrls?: string[]; // Optional multiple images for profiles
  // Specific fields for Leaders (Pastors & Upa kal ta te)
  birthDate?: string;
  ordinationDate?: string;
  deathDate?: string;
  tenureYears?: string; // e.g., "2010 - 2015"
  
  // Specific fields for Sunday School Hotute
  ss_year?: string;
  ss_superintendent?: string;
  ss_asstSupdt?: string;
  ss_asstSupdtNPSS?: string;
  ss_secretary?: string;
  ss_asstSecy1?: string;
  ss_asstSecy2?: string;
  ss_asstSecyNPSS1?: string;
  ss_asstSecyNPSS2?: string;

  // Specific fields for Sunday School Department Zirtirtute
  ss_dept_leader?: string;
  ss_dept_asst_leader?: string;
  ss_dept_secretary?: string;
  ss_dept_teachers?: string; // Comma separated names
}

export interface ProgramField {
  id: string;
  label: string;
  value: string;
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
  serviceTimes?: {
    sundaySchool: string;
    morning: string;
    evening: string;
  };
  serviceTitles?: {
    sundaySchool: string;
    morning: string;
    evening: string;
  };
  // Updated to support dynamic fields
  servicePrograms?: {
    sundaySchool: ProgramField[];
    morning: ProgramField[];
    evening: ProgramField[];
  };
  midWeek?: {
    nilai: {
      title: string;
      time: string;
      hruaitu: string;
      tantu: string;
      thupui: string;
      thuhriltu: string;
    };
    inrinni: {
      title: string;
      time: string;
      hruaitu: string;
      tantu: string;
      thupui: string;
      thuhriltu: string;
    };
  };
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

export interface KTPMemberWithRole extends KTPMember {
  role?: string;
}

export interface KTPSubCommittee {
  id: string;
  name: string;
  members: KTPMemberWithRole[];
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
