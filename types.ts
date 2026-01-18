
export type Language = 'en' | 'mizo';

export enum View {
  Home = 'Home',
  About = 'About',
  Events = 'Events',
  Sermons = 'Sermons',
  Ministries = 'Ministries',
  Contact = 'Contact'
}

export interface Announcement {
  id: string;
  title: string;
  date: string;
  category: string;
  content: string;
  imageUrl?: string;
  imageUrls?: string[];
  imageCaptions?: string[];
  videoUrl?: string;
  videoUrls?: string[];
}

export interface Sermon {
  id: string;
  title: string;
  date: string;
  preacher: string;
  scripture: string;
  description: string;
  audioUrl?: string;
  videoUrl?: string;
}

export interface ProgramField {
  id: string;
  label: string;
  value: string;
}

export interface EventProgram {
  hruaitu?: string;
  tantu?: string;
  thuhriltu?: string;
  thupui?: string;
  [key: string]: string | undefined;
}

export interface Event {
  id?: string;
  title: string;
  date: string;
  time: string;
  location?: string;
  description?: string;
  type?: string;
  isCancelled?: boolean;
  dayOfWeek?: number;
  program?: EventProgram;
  isRecurringTemplate?: boolean;
  leader?: string; // used in EVENTS_DATA mapping
  name?: string; // used in weeklyProgram constant
}

export interface Ministry {
  id: string;
  name: string;
  acronym?: string;
  description: string;
  leader: string;
  schedule: string;
  image: string;
}

export interface Staff {
  id?: string;
  name: string;
  role: string;
  imageUrl: string;
  description?: string;
  period?: string; // Tenure/Ordination year
  order?: number;
  biography?: string;
  imagePositionX?: number;
  imagePositionY?: number;
  imageScale?: number;
  phoneNumber?: string;
  qualification?: string;
  probationTenure?: string;
  previousBials?: { field: string; period: string }[];
  collection?: 'pastors' | 'elders' | 'proPastors';
}

export interface WeeklyDuty {
  id: string;
  month: string;
  weekRange: string;
  thawhlawmChiartute: string[];
  buhfaithamHralhtute?: string[]; // Optional based on usage
  ushers: string[];
  zaiHruaitu: string;
  pianoTumtu: string;
  hlaHriltu: string;
  lightAndSoundDuty: string;
  pangparKhawitu: string;
  serviceTimes: {
    sundaySchool: string;
    morning: string;
    evening: string;
  };
  serviceTitles?: {
    sundaySchool: string;
    morning: string;
    evening: string;
  };
  servicePrograms: {
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

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  isAdmin?: boolean;
  createdAt: string;
}

export interface CommitteeMember {
  id?: string;
  name: string;
  role: string;
  phone?: string;
}

export interface Committee {
  id: string;
  name: string;
  icon: string;
  description?: string;
  members: CommitteeMember[];
  order?: number;
}

export interface ArchiveEntry {
  id: string;
  title: string;
  date: string;
  category: string;
  subCategory?: string;
  department?: string; // For Sunday School structure
  description?: string;
  link?: string;
  imageUrls?: string[];
  ss_year?: string;
  ss_dept_teachers?: string;
  ss_dept_leader?: string;
  ss_dept_asst_leader?: string;
  ss_dept_secretary?: string;
  // Sunday School Hotute fields
  ss_superintendent?: string;
  ss_asstSupdt?: string;
  ss_asstSupdtNPSS?: string;
  ss_secretary?: string;
  ss_asstSecy1?: string;
  ss_asstSecy2?: string;
  ss_asstSecyNPSS1?: string;
  ss_asstSecyNPSS2?: string;
  tenureYears?: string; // For analytics
}

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

export interface Resource {
  id: string;
  title: string;
  category: string;
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
  fatherName: string;
  age: string | number;
  dateOfDeath: string;
  causeOfDeath: string;
  minister: string;
}

export interface InkhawmpuiRecord {
  id?: string;
  type: 'inkhawmpui';
  eventName: string;
  year: number | string;
  theme: string;
  puipate: string;
  speakers: string;
}

export interface GospelCampingRecord {
  id?: string;
  type: 'gospelCamping';
  year: string;
  team: string;
  speaker: string;
  date: string;
}

export type ChurchRecord = BaptismRecord | WeddingRecord | DeathRecord | InkhawmpuiRecord | GospelCampingRecord;

export interface SundaySchoolDepartment {
  id: string;
  name: string;
  leader: string;
  asstLeader?: string;
  secretary?: string;
  teachers: string[];
  description: string;
  students?: number;
}

export interface Article {
  id: string;
  title: string;
  author: string;
  date: string;
  category: 'Article' | 'Sermon';
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  views?: number;
}

export interface ServiceHistory {
  field: string;
  period: string;
}

export interface Missionary {
  id: string;
  name: string;
  qualification?: string;
  field: string; // Current/Latest field
  period?: string; // Current/Latest period
  bio?: string;
  imageUrl?: string;
  imagePositionX?: number;
  imagePositionY?: number;
  imageScale?: number;
  serviceHistory?: ServiceHistory[];
}
