
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
}

export interface ProgramDetails {
  tantu?: string; // Reader/Conductor
  thuhriltu?: string; // Preacher
  thupui?: string; // Topic
  hawngtu?: string; // Topic Opener
  conductor?: string;
  pianist?: string;
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

export interface Sermon {
  id: string;
  title: string;
  preacher: string;
  date: string;
  videoUrl?: string; // YouTube ID or URL
  audioUrl?: string;
  description: string;
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
  members: CommitteeMember[];
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